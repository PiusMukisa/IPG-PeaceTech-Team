const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    navMenu.classList.toggle('is-open', !isOpen);
  });

  document.querySelectorAll('.nav-menu a').forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('is-open');
    });
  });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.querySelectorAll('.contact-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = form.querySelector('.form-message');
    if (message) message.textContent = 'Thank you. You are on the list.';
    form.reset();
  });
});

document.querySelectorAll('[data-slideshow]').forEach((slideshow) => {
  const slides = [...slideshow.querySelectorAll('.welcome-slide')];
  const toggle = slideshow.querySelector('.slideshow-toggle');
  const index = slideshow.querySelector('.welcome-index strong');
  let current = 0;
  let isPlaying = true;

  const showNext = () => {
    slides[current].classList.remove('is-active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('is-active');
    if (index) index.textContent = String(current + 1).padStart(2, '0');
  };

  let timer = window.setInterval(showNext, 4200);
  toggle?.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      timer = window.setInterval(showNext, 4200);
      toggle.setAttribute('aria-label', 'Pause welcome slideshow');
      toggle.setAttribute('aria-pressed', 'false');
    } else {
      window.clearInterval(timer);
      toggle.setAttribute('aria-label', 'Play welcome slideshow');
      toggle.setAttribute('aria-pressed', 'true');
    }
  });
});
