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



  function initTimelineFlip() {
    const track = document.querySelector('.timeline-flip-stagger');
    const section = document.getElementById('como-funciona');
    if (!track || !section) return;

    const show = () => track.classList.add('is-visible');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      show();
      return;
    }

    const isInView = () => {
      const rect = section.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.88 && rect.bottom > 0;
    };

    const tryShow = () => {
      if (track.classList.contains('is-visible')) return true;
      if (isInView()) {
        show();
        return true;
      }
      return false;
    };

    if (tryShow()) return;

    const teardown = (observer) => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };

    const onScroll = () => {
      if (tryShow()) teardown(observer);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          show();
          teardown(observer);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 0px 0px' });

    observer.observe(section);
    window.addEventListener('scroll', onScroll, { passive: true });

    window.addEventListener('load', () => {
      requestAnimationFrame(() => tryShow());
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => tryShow());
    });
  }

  function initScrollReveal() {
    if (document.body.classList.contains('page-calculadora-ipc')) return;

    document.querySelectorAll('.content.reveal, .container.reveal').forEach((el) => {
      el.classList.remove('reveal', 'visible');
    });

    const targets = document.querySelectorAll(
      '.reveal-stagger, section:not(.hero):not(.hero--split):not(.calc-section):not(.calc-results-section):not(.cta-banner):not(.timeline):not(.faq-section):not(#faq):not(#calc-results-section)'
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



  function initPremiumFaq() {
    if (document.body.classList.contains('page-calculadora-ipc')) return;

    document.querySelectorAll('.faq-item__question').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');

        document.querySelectorAll('.faq-item').forEach((entry) => {
          entry.classList.remove('open');
          const question = entry.querySelector('.faq-item__question');
          if (question) question.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {

    if (!document.body.classList.contains('page-premium')) return;

    initLucide();

    initNavbarScroll();

    initCounterAnimation();

    initTimelineFlip();

    initScrollReveal();

    initPremiumFaq();

  });

})();


