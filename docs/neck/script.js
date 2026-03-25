const stickyCta = document.getElementById('stickyCta');
const pricingSection = document.getElementById('pricing');
const faqItems = document.querySelectorAll('.faq-item');

function toggleStickyCta() {
  if (!stickyCta || !pricingSection) return;
  const shouldShow = window.scrollY > 600 && window.scrollY < pricingSection.offsetTop + pricingSection.offsetHeight - 200;
  stickyCta.classList.toggle('is-visible', shouldShow);
}

window.addEventListener('scroll', toggleStickyCta, { passive: true });
window.addEventListener('load', toggleStickyCta);

faqItems.forEach((item) => {
  const button = item.querySelector('.faq-question');
  if (!button) return;

  button.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');
    faqItems.forEach((faq) => faq.classList.remove('is-open'));
    if (!isOpen) item.classList.add('is-open');
  });
});
