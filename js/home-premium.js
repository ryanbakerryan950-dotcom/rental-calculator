/**

 * Warm landing page — Lucide icons, scroll effects

 * index.html only (.page-premium)

 */

(function () {

  'use strict';



  function initLucide() {

    if (typeof lucide !== 'undefined') {

      lucide.createIcons();

    }

  }



  function initNavbarScroll() {

    const navbar = document.querySelector('.navbar');

    if (!navbar) return;



    const onScroll = () => {

      navbar.classList.toggle('scrolled', window.scrollY > 50);

    };

    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });

  }



  function initCounterAnimation() {

    const el = document.querySelector('[data-counter="pct"]');

    if (!el) return;



    const target = parseFloat(el.dataset.target || '36.44');

    const observer = new IntersectionObserver((entries) => {

      entries.forEach((entry) => {

        if (!entry.isIntersecting) return;

        observer.unobserve(el);

        const start = performance.now();

        const duration = 1200;



        function tick(now) {

          const t = Math.min((now - start) / duration, 1);

          const eased = 1 - Math.pow(1 - t, 3);

          const val = (target * eased).toFixed(1);

          el.textContent = `+${val}%`;

          if (t < 1) requestAnimationFrame(tick);

        }

        requestAnimationFrame(tick);

      });

    }, { threshold: 0.5 });



    observer.observe(el);

  }



  function initScrollReveal() {
    document.querySelectorAll('.content.reveal, .container.reveal').forEach((el) => {
      el.classList.remove('reveal', 'visible');
    });

    const targets = document.querySelectorAll(
      '.reveal-stagger, section:not(.hero):not(.hero--split):not(.calc-section):not(.cta-banner)'
    );

    targets.forEach((el) => {
      if (!el.classList.contains('reveal') && !el.classList.contains('reveal-stagger')) {
        el.classList.add('reveal');
      }
    });

    const revealVisible = (el) => {
      el.classList.add('visible');
      el.querySelectorAll('.reveal-stagger').forEach((stagger) => {
        stagger.classList.add('visible');
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealVisible(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

    const observed = document.querySelectorAll('.reveal, .reveal-stagger');
    observed.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        revealVisible(el);
      }
      observer.observe(el);
    });
  }



  document.addEventListener('DOMContentLoaded', () => {

    if (!document.body.classList.contains('page-premium')) return;

    initLucide();

    initNavbarScroll();

    initCounterAnimation();

    initScrollReveal();

  });

})();


