(function () {
  const doc = document.documentElement;
  doc.classList.add('js');

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function initYear() {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach((el) => io.observe(el));
  }

  function initCarousel() {
    const carousel = $('#heroCarousel');
    if (!carousel) return;

    const slides = $$('.hero-slide', carousel);
    const titleEl = $('#heroTitle', carousel) || $('#heroTitle');
    const subtitleEl = $('#heroSubtitle', carousel) || $('#heroSubtitle');
    const dotsWrap = $('.hero-dots', carousel);
    const prevBtn = $('.hero-arrow.prev', carousel);
    const nextBtn = $('.hero-arrow.next', carousel);

    if (!slides.length) return;

    let current = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
    let timer = null;
    const autoplay = carousel.dataset.autoplay !== 'false';
    const delay = Number(carousel.dataset.delay) || 5000;

    if (dotsWrap) {
      dotsWrap.innerHTML = slides.map((_, index) => (
        `<button class="hero-dot${index === current ? ' is-active' : ''}" type="button" aria-label="Ir a la imagen ${index + 1}"></button>`
      )).join('');
    }

    const dots = $$('.hero-dot', dotsWrap || carousel);

    function animateText() {
      [titleEl, subtitleEl].forEach((el) => {
        if (!el || typeof el.animate !== 'function') return;
        el.animate(
          [
            { opacity: 0, transform: 'translateY(12px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 380, easing: 'ease-out' }
        );
      });
    }

    function render(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === current);
        slide.setAttribute('aria-hidden', slideIndex === current ? 'false' : 'true');
      });

      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === current);
        dot.setAttribute('aria-pressed', dotIndex === current ? 'true' : 'false');
      });

      const active = slides[current];
      const title = active.dataset.title || '';
      const subtitle = active.dataset.subtitle || '';

      if (titleEl) titleEl.textContent = title;
      if (subtitleEl) subtitleEl.textContent = subtitle;

      animateText();
    }

    function next() {
      render(current + 1);
    }

    function prev() {
      render(current - 1);
    }

    function stopAuto() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function startAuto() {
      if (!autoplay) return;
      stopAuto();
      timer = window.setInterval(next, delay);
    }

    prevBtn?.addEventListener('click', () => {
      prev();
      startAuto();
    });

    nextBtn?.addEventListener('click', () => {
      next();
      startAuto();
    });

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        render(index);
        startAuto();
      });
    });

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('focusin', stopAuto);
    carousel.addEventListener('focusout', startAuto);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAuto();
      else startAuto();
    });

    render(current);
    startAuto();
  }

  initYear();
  initReveal();
  initCarousel();
})();
