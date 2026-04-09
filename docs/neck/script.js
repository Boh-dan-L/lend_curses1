const stickyCta = document.getElementById('stickyCta');
const pricingButtons = document.querySelectorAll('.scroll-to-pricing');
const pricingSection = document.getElementById('pricing');
const faqItems = document.querySelectorAll('.faq-item');
const revealItems = document.querySelectorAll('.reveal');

const timerHours = document.getElementById('timerHours');
const timerMinutes = document.getElementById('timerMinutes');
const timerSeconds = document.getElementById('timerSeconds');
const COUNTDOWN_STORAGE_KEY = 'neckCourseOfferCountdownEnd';
const COUNTDOWN_DURATION_MS = ((2 * 60) + 15) * 60 * 1000;

pricingButtons.forEach((button) => {
  button.addEventListener('click', () => {
    pricingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

window.addEventListener('scroll', () => {
  if (!stickyCta) return;
  stickyCta.classList.toggle('visible', window.scrollY > 800);
});

faqItems.forEach((item) => {
  const button = item.querySelector('.faq-question');
  button?.addEventListener('click', () => {
    const isActive = item.classList.contains('active');
    faqItems.forEach((faq) => faq.classList.remove('active'));
    if (!isActive) item.classList.add('active');
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach((item) => observer.observe(item));

const TIMER_STORAGE_KEY = 'neck_course_offer_end_time';
const TIMER_DURATION_MS = (2 * 60 * 60 + 15 * 60) * 1000;

function getOrCreateTimerEndTime() {
  const now = Date.now();
  const saved = localStorage.getItem(TIMER_STORAGE_KEY);
  const savedTime = saved ? Number(saved) : 0;

  if (!savedTime || Number.isNaN(savedTime) || savedTime <= now) {
    const newEndTime = now + TIMER_DURATION_MS;
    localStorage.setItem(TIMER_STORAGE_KEY, String(newEndTime));
    return newEndTime;
  }

  return savedTime;
}

function getTimeParts(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    full: [
      String(hours).padStart(2, '0'),
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0')
    ].join(':')
  };
}

function updateSharedTimer() {
  const timerHours = document.getElementById('timerHours');
  const timerMinutes = document.getElementById('timerMinutes');
  const timerSeconds = document.getElementById('timerSeconds');
  const pricingTimer = document.getElementById('pricingTimer');

  let endTime = getOrCreateTimerEndTime();

  function render() {
    const now = Date.now();
    let diff = endTime - now;

    if (diff <= 0) {
      endTime = now + TIMER_DURATION_MS;
      localStorage.setItem(TIMER_STORAGE_KEY, String(endTime));
      diff = endTime - now;
    }

    const time = getTimeParts(diff);

    if (timerHours) timerHours.textContent = time.hours;
    if (timerMinutes) timerMinutes.textContent = time.minutes;
    if (timerSeconds) timerSeconds.textContent = time.seconds;
    if (pricingTimer) pricingTimer.textContent = time.full;
  }

  render();
  setInterval(render, 1000);
}

window.addEventListener('load', updateSharedTimer);

const reviewsSlider = document.getElementById('reviewsSlider');

if (reviewsSlider) {
  const slides = reviewsSlider.querySelectorAll('.review-slide');
  const prevBtn = document.getElementById('reviewsPrev');
  const nextBtn = document.getElementById('reviewsNext');
  const dots = reviewsSlider.querySelectorAll('.reviews-dot');

  let currentReview = 0;

  function showReview(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    currentReview = index;
  }

  prevBtn?.addEventListener('click', () => {
    const newIndex = currentReview === 0 ? slides.length - 1 : currentReview - 1;
    showReview(newIndex);
  });

  nextBtn?.addEventListener('click', () => {
    const newIndex = currentReview === slides.length - 1 ? 0 : currentReview + 1;
    showReview(newIndex);
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => showReview(index));
  });

  showReview(0);
}