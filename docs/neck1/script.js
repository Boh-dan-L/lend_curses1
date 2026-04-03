const stickyCta = document.getElementById('stickyCta');
const pricingButtons = document.querySelectorAll('.scroll-to-pricing');
const pricingSection = document.getElementById('pricing');
const faqItems = document.querySelectorAll('.faq-item');
const revealItems = document.querySelectorAll('.reveal');

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
