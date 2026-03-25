/* ===== COUNTDOWN: multi-instance ===== */
(function(){
  const nodes = Array.from(document.querySelectorAll('.bs-countdown'));
  if (!nodes.length) return;

  function pad(n){ return String(n).padStart(2,'0'); }

  function getDeadlineFor(el){
    const mode = el.getAttribute('data-mode') || 'rolling';
    const now = new Date();

    if (mode === 'daily'){
      const end = new Date(now);
      end.setHours(23,59,59,999);
      return end;
    }
    if (mode === 'rolling'){
      const end = new Date(now);
      const nextHour = Math.ceil(now.getHours()/2)*2;
      end.setHours(nextHour,0,0,0);
      if (end <= now) end.setHours(end.getHours()+2);
      return end;
    }
    if (mode === 'fixed'){
      const s = el.getAttribute('data-deadline');
      return s ? new Date(s) : new Date(now.getTime());
    }
    if (mode === 'duration'){
      // тривалість у мс (за замовч. 2 години)
      const key = el.getAttribute('data-key') || 'bs-countdown-duration';
      const durationMs = +(el.getAttribute('data-duration-ms') || 7200000);
      let end = +localStorage.getItem(key);
      if (!end || Date.now() > end) {
        end = Date.now() + durationMs;
        localStorage.setItem(key, end);
      }
      // запам'ятовуємо для автоперезапуску
      el._durationKey = key;
      el._durationMs = durationMs;
      return new Date(end);
    }
    return new Date(now.getTime());
  }

  const timers = nodes.map(el => ({
    el,
    mode: el.getAttribute('data-mode') || 'rolling',
    dEl: el.querySelector('[data-part="days"]'),
    hEl: el.querySelector('[data-part="hours"]'),
    mEl: el.querySelector('[data-part="minutes"]'),
    sEl: el.querySelector('[data-part="seconds"]'),
    getEnd: () => getDeadlineFor(el),
    end: null
  }));

  timers.forEach(t => { t.end = t.getEnd(); });

  function updateOne(t){
    let now = new Date();
    let diff = t.end - now;

    if (diff <= 0){
      if (t.mode === 'duration'){
        const key = t.el._durationKey || 'bs-countdown-duration';
        const ms = t.el._durationMs || 7200000;
        const newEnd = Date.now() + ms;
        localStorage.setItem(key, newEnd);
        t.end = new Date(newEnd);
      } else {
        t.end = t.getEnd();
      }
      diff = t.end - now;
    }

    let days = Math.floor(diff/86400000); diff -= days*86400000;
    let hours = Math.floor(diff/3600000); diff -= hours*3600000;
    let minutes = Math.floor(diff/60000); diff -= minutes*60000;
    let seconds = Math.floor(diff/1000);

    if (t.dEl) t.dEl.textContent = pad(days);
    if (t.hEl) t.hEl.textContent = pad(hours);
    if (t.mEl) t.mEl.textContent = pad(minutes);
    if (t.sEl) t.sEl.textContent = pad(seconds);
  }

  // первинний рендер і глобальний інтервал
  timers.forEach(updateOne);
  setInterval(() => timers.forEach(updateOne), 1000);
})();

/* ===== FAQ accordion (smooth height) ===== */
(function(){
  const root = document.querySelector('[data-faq]');
  if(!root) return;

  function closeItem(item){
    const btn = item.querySelector('.bs-faq__q');
    const panel = item.querySelector('.bs-faq__a');
    if (!btn || !panel) return;
    btn.setAttribute('aria-expanded','false');
    panel.style.height = panel.scrollHeight + 'px'; // фіксуємо поточну, щоб анімація пішла
    requestAnimationFrame(()=>{ panel.style.height = '0px'; });
  }

  function openItem(item){
    const btn = item.querySelector('.bs-faq__q');
    const panel = item.querySelector('.bs-faq__a');
    if (!btn || !panel) return;
    btn.setAttribute('aria-expanded','true');
    panel.style.height = panel.scrollHeight + 'px';
    // після завершення — авто-висота не потрібна, лишаємо фікс для стабільності
  }

  // Делегування кліку
  root.addEventListener('click', (e)=>{
    const btn = e.target.closest('.bs-faq__q');
    if(!btn) return;
    const item = btn.closest('.bs-faq__item');
    const expanded = btn.getAttribute('aria-expanded') === 'true';

    // Якщо хочеш, щоб відкритим був лише один — спочатку закриємо всі
    root.querySelectorAll('.bs-faq__item').forEach(el=>{
      if(el !== item) closeItem(el);
    });

    if(expanded) closeItem(item); else openItem(item);
  });

  // Ініціалізація: все закрито
  root.querySelectorAll('.bs-faq__item').forEach(closeItem);

  // Перерахунок висоти при ресайзі (якщо контент перенісся)
  let rid = null;
  window.addEventListener('resize', ()=>{
    if (rid) cancelAnimationFrame(rid);
    rid = requestAnimationFrame(()=>{
      root.querySelectorAll('.bs-faq__item').forEach(item=>{
        const btn = item.querySelector('.bs-faq__q');
        const panel = item.querySelector('.bs-faq__a');
        if(btn.getAttribute('aria-expanded') === 'true'){
          panel.style.height = 'auto'; // скинь
          panel.style.height = panel.scrollHeight + 'px'; // зафіксуй нову
        }
      });
    });
  });
})();

/* ===== REVIEWS carousel ===== */
// === Reviews carousel (простий) ===
(function(){
  const root = document.getElementById('rvCarousel');
  if (!root) return;

  const track = root.querySelector('.rv-track');
  const slides = Array.from(root.querySelectorAll('.rv-slide'));
  const prevBtn = root.querySelector('.rv-prev');
  const nextBtn = root.querySelector('.rv-next');

  let index = 0;

  function update() {
    track.style.transform = `translateX(${-index * 100}%)`;
  }

  function next(){ index = (index + 1) % slides.length; update(); }
  function prev(){ index = (index - 1 + slides.length) % slides.length; update(); }

  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  update();
})();


/* ==== SPOTS + PURCHASE TOAST (sync) ==== */
(function () {
  const STORAGE_KEY = 'spots-state-v1';
  const START_SPOTS = 17;   // стартове число місць
  const MIN_SPOTS   = 3;    // нижня межа (далі не зменшуємо)
  const FIRST_AFTER = 5000; // перший тост через 5с після заходу
  const EVERY_MS    = 60000; // інтервал між тостами (60с). Зміни під себе.

  // 1) Стан у localStorage
  let state = {};
  try { state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(e) { state = {}; }
  if (!state.value || typeof state.value !== 'number') {
    state = { value: START_SPOTS, shown: 0 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // 2) Рендер усіх лічильників
  function renderSpots() {
    document.querySelectorAll('[data-spotss]').forEach(el => {
      el.textContent = state.value;
    });
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function decSpots() {
    if (state.value > MIN_SPOTS) {
      state.value -= 1;
      save();
      renderSpots();
    }
  }
  renderSpots();

  // 3) Дані для тостів (замініть на свої)
  const buyers = [
    'Олена', 'Ігор', 'Наталія', 'Максим', 'Світлана', 'Андрій', 'Марія',
    'Богдан', 'Ірина', 'Роман', 'Юлія', 'Влад', 'Катерина'
  ];
  const cities = ['Київ', 'Львів', 'Одеса', 'Дніпро', 'Харків', 'Вінниця', 'Чернівці', 'Запоріжжя'];

  // 4) Показ тосту + синхронне зменшення місць
  function showPurchaseToast() {
    if (state.value <= MIN_SPOTS) return; // стоп, досягли межі

    const name  = buyers[state.shown % buyers.length];
    const city  = cities[(state.shown * 7) % cities.length]; // псевдорандом
    const when  = ['щойно', '1 хв тому', '2 хв тому'][state.shown % 3];

    const el = document.createElement('div');
    el.className = 'bs-toast';
    el.innerHTML = `
      <strong>${name}</strong> приєднався(лась) до курсу
      <small>${when}</small>
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));

    // СИНХРОН: як тільки з’явився тост — зменшуємо кількість місць
    decSpots();

    state.shown += 1; save();

    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 350);
    }, 3500);
  }

  // 5) Розклад показу
  setTimeout(function run() {
    showPurchaseToast();
    if (state.value > MIN_SPOTS) setTimeout(run, EVERY_MS);
  }, FIRST_AFTER);

  // 6) Публічний хук, якщо захочеш викликати тост вручну
  window.BS_PURCHASE_TOAST = showPurchaseToast;

  // 7) Якщо маєш власну систему тостів — слухай кастомну подію:
  // window.dispatchEvent(new CustomEvent('bs:purchase'));
  window.addEventListener('bs:purchase', function () {
    showPurchaseToast();
  });
})();

/* ==== ASSESS (KOOS-light) ==== */
(function(){
  const root = document.querySelector('[data-assess]');
  if(!root) return;

  const steps = Array.from(root.querySelectorAll('.assess__step'));
  const resultBox = document.querySelector('[data-assess-result]');
  const progressEl = document.querySelector('[data-assess-progress]');
  const stepTxt = document.querySelector('[data-assess-step]');

  // універсальна функція, яка МОЖЕ скролити (за бажанням)
  function setStep(i, {scroll = false} = {}){
    steps.forEach((s,idx)=>s.classList.toggle('is-active', idx===i));
    const pct = Math.round(((i+1)/steps.length)*100);
    if(progressEl) progressEl.style.width = pct+'%';
    if(stepTxt) stepTxt.textContent = `Крок ${i+1} із ${steps.length}`;

    if (scroll) {
      const host = root.closest('.bs-assess') || root;
      const top = host.getBoundingClientRect().top + window.pageYOffset - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  // показати перший крок БЕЗ скролу
  let current = steps.findIndex(s=>s.classList.contains('is-active'));
  if(current<0) current = 0;
  setStep(current, {scroll:false});

  // live-значення для range
  root.querySelectorAll('[data-range]').forEach(r=>{
    const out = document.querySelector(`[data-out="${r.name}"]`);
    const upd = ()=>{ if(out) out.textContent = r.value; };
    r.addEventListener('input', upd); upd();
  });

  // навігація: тепер скролимо ТІЛЬКИ при кліку Далі/Назад
  root.addEventListener('click', (e)=>{
    const next = e.target.closest('[data-next]');
    const prev = e.target.closest('[data-prev]');
    if(next){ current = Math.min(current+1, steps.length-1); setStep(current, {scroll:true}); }
    if(prev){ current = Math.max(current-1, 0);           setStep(current, {scroll:true}); }
  });

  // підрахунок результату
  function calc(){
    const fd = new FormData(root);

    const redFlag = ['rf_swelling','rf_locking','rf_acute'].some(k=>fd.get(k)==='yes');
    if(redFlag){ return { type:'warning' }; }

    let score = 0;
    const painRest = +(fd.get('pain_rest')||0);
    const painLoad = +(fd.get('pain_load')||0);
    if(painRest >= 4) score += 2;
    if(painLoad >= 5) score += 2;
    if(fd.get('swelling48') === 'yes') score += 2;
    if(fd.get('instability') === 'yes') score += 1;

    // NEW: KOOS-lite активності
    if(fd.get('walk_pain') === 'yes')      score += 1;
    if(fd.get('stairs_pain') === 'yes')    score += 2;
    if(fd.get('squat_pain') === 'yes')     score += 2;
    if(fd.get('kneel_pain') === 'yes')     score += 1;
    if(fd.get('night_pain') === 'yes')     score += 1;
    if(fd.get('morning_stiff') === 'yes')  score += 1;

    let stage = 'stage2';
    if(score >= 5) stage = 'stage1';
    else if(score >= 3) stage = 'border';

    return { type:'ok', score, stage, painRest, painLoad };
  }

  // шаблони результатів — CTA тільки через data-scroll-to (без хеша в URL)
  function render(res){
    if(res.type === 'warning'){
      resultBox.hidden = false;
      resultBox.innerHTML = `
        <div class="assess__warning">
          Є ознаки, з якими спершу краще звернутися до лікаря (гострий набряк/заклинювання/свіжа травма).
          Паралельно запустіть <strong>«Нульовий тиждень»</strong>: легкі ізометрії, лімфодренаж, рух у безболісному діапазоні.
        </div>
        <div class="assess__actions">
          <a href="#" data-scroll-to="#pricing" class="btn btn--primary">Перейти до безпечного старту</a>
          <a href="#" data-scroll-to="#faq" class="btn">Подивитись FAQ</a>
        </div>
      `;
      return;
    }

    const blocks = {
      stage1: {
        badge: 'Рекомендовано • Етап 1 (Гострий)',
        title: 'Спочатку заспокоїти симптоми 7–14 днів',
        p1: 'Мета: зменшити біль/набряк, повернути повне розгинання, контроль.',
        p2: 'Що робимо: ізометрії квадрицепса, легка мобільність, лімфодренаж, активація мʼязів.',
        list: ['Уникаємо 1й тиждень: глибокі присідання, різкі кручення, біг/стрибки.',
               'Перетест на 7 день — якщо гострий бал ≤2, переходимо на Етап 2.'],
        cta:  { target:'#pricing', text:'Почати Етап 1' }
      },
      border: {
        badge: 'Прикордонний випадок',
        title: 'Два варіанти старту (рекомендований підсвічено)',
        p1: 'Є ознаки подразнення, але базовий контроль уже непоганий.',
        p2: 'Варіант А (рекомендовано): 7 днів Етап 1 → ретест. Варіант Б: Етап 2 з регресіями.',
        list: ['Не використовуємо глибокі кути, більше ізометрій на старті.',
               'Стежимо, щоб біль не зростав >2 бали по 10 бальній шкалі болю.'],
        cta:  { target:'#pricing', text:'Етап 1 (рекомендовано)' },
        cta2: { target:'#pricing', text:'Етап 2 (з регресіями)' }
      },
      stage2: {
        badge: 'Рекомендовано • Етап 2 (Функціональний)',
        title: 'Сила, стабільність і повернення до активності',
        p1: 'Мета: сила, витривалість, баланс, паттерн ходьби.',
        p2: 'Що робимо: гіп-хіндж, присідання до безпечної глибини, баланс/стабільність, прогрес навантаження.',
        list: ['Якщо під час занять біль ↑ >2 бали — повернись тимчасово на Етап 1 на 3–5 днів.'],
        cta:  { target:'#pricing', text:'Почати Етап 2' }
      }
    };

    const b = blocks[res.stage];
    resultBox.hidden = false;
    resultBox.innerHTML = `
      <span class="assess__badge">${b.badge}</span>
      <h3 class="assess__title">${b.title}</h3>
      <p class="assess__p">${b.p1}</p>
      <p class="assess__p">${b.p2}</p>
      <ul class="assess__list">${b.list.map(li=>`<li>${li}</li>`).join('')}</ul>
      <div class="assess__actions">
        <a href="#" data-scroll-to="${b.cta.target}" class="btn btn--primary">${b.cta.text}</a>
        ${b.cta2 ? `<a href="#" data-scroll-to="${b.cta2.target}" class="btn">${b.cta2.text}</a>` : ''}
      </div>
      <div class="assess__p" style="margin-top:10px">
        <strong>Бонус-модулі за діагнозами:</strong> підходи для ПФС, коліна бігуна, ACL, меніска, артрозу, тендинопатії.
      </div>
    `;
  }

  // submit → рендеримо, і МОЖЕМО прокрутити до результату
  root.addEventListener('submit', (e)=>{
    e.preventDefault();
    const r = calc();
    render(r);
    // опційно: притягнути вʼю до блоку результату
    requestAnimationFrame(()=>{
      if (!resultBox.hidden) {
        const top = resultBox.getBoundingClientRect().top + window.pageYOffset - 12;
        window.scrollTo({ top, behavior:'smooth' });
      }
    });
  });
})();

(function () {
  // Вимкнути автоповернення позиції скролу браузером
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // При старті прибираємо хеш із адреси
  window.addEventListener('load', function () {
    if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
      window.scrollTo(0, 0);
    }
  });

  // Плавний скрол за data-scroll-to
  const OFFSET = 0; // якщо є fixed-header — постав його висоту
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[data-scroll-to]');
    if (!a) return;

    const id = a.getAttribute('data-scroll-to');
    if (!id || id.charAt(0) !== '#') return;

    const el = document.querySelector(id);
    if (!el) return;

    e.preventDefault();

    const top = el.getBoundingClientRect().top + window.pageYOffset - OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
  });
})();

window.addEventListener('load', function () {
  // скидаємо позицію, навіть якщо браузер стрибнув
  window.scrollTo(0, 0);
});