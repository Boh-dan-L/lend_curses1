document.querySelector('.burger')?.addEventListener('click', () => { alert('Меню (демо)'); });
/* ===== COUNTDOWN (спільний, кожні 2 години) ===== */
// 


/* ===== STICKY CTA (показуємо при скролі, ховаємо коли головний CTA у видимій зоні) ===== */
(function(){
  const sticky = document.querySelector('.bs-sticky-cta');
  if(!sticky) return;

  // показуємо після певної висоти скролу
  let scrolled = false;
  function onScroll(){
    if(window.scrollY > 400 && !scrolled){
      sticky.classList.add('is-visible');
      scrolled = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive:true });

  // ховаємо, якщо головна кнопка видима (щоб не дублюватись)
  const mainCta = document.getElementById('main-cta');
  if('IntersectionObserver' in window && mainCta){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting) sticky.classList.remove('is-visible');
        else if(window.scrollY > 400) sticky.classList.add('is-visible');
      });
    }, { threshold: 0.35 });
    io.observe(mainCta);
  }
})();

// /* ===== TOASTS (фейкові “хтось приєднався”) ===== */
// (function(){
//   const wrap = document.querySelector('.bs-toasts');
//   if(!wrap) return;

//   // Список імен/міст: під себе заміниш або підтягнеш з API
//   const names = ["Олена","Ігор","Марія","Віталій","Тетяна","Анна","Олексій","Юлія","Максим","Сергій","Наталія","Катерина","Михайло"];
//   const cities = ["Київ","Львів","Одеса","Харків","Дніпро","Івано-Франківськ","Тернопіль","Чернівці","Ужгород","Полтава","Вінниця"];
//   const avatars = [
//     "https://ui-avatars.com/api/?name=A&background=0A6670&color=fff",
//     "https://ui-avatars.com/api/?name=B&background=FF7A00&color=fff",
//     "https://ui-avatars.com/api/?name=C&background=0A6670&color=fff"
//   ];

//   function random(arr){ return arr[Math.floor(Math.random()*arr.length)] }
//   function nowTime(){
//     const d = new Date();
//     return d.toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'});
//   }

//   function showToast(){
//     const el = document.createElement('div');
//     el.className = 'bs-toast';
//     el.setAttribute('role','status');

//     el.innerHTML = `
//       <div class="bs-toast__avatar"><img src="${random(avatars)}" alt="" width="36" height="36"></div>
//       <div class="bs-toast__body">
//         <p class="bs-toast__title">${random(names)}</p>
//         <p class="bs-toast__text">щойно приєднався(-лася) до курсу</p>
//       </div>
//       <div class="bs-toast__time">${nowTime()}</div>
//     `;
//     wrap.appendChild(el);

//     // авто-закриття
//     const ttl = 4500 + Math.random()*1500;
//     setTimeout(()=>{
//       el.style.animation = 'toast-out .22s ease forwards';
//       setTimeout(()=>el.remove(), 220);
//     }, ttl);
//   }

//   // Перша — через 2–6с, далі кожні 12–20с (рандом)
//   function schedule(next= true){
//     const delay = next ? (12000 + Math.random()*8000) : (2000 + Math.random()*4000);
//     setTimeout(()=>{
//       showToast();
//       schedule(true);
//     }, delay);
//   }
//   schedule(false);
// })();

