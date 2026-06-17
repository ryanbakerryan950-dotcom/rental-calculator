(function () {
  'use strict';

  function lockPageScroll(scrollY) {
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      window.scrollTo(0, scrollY);
      document.documentElement.style.scrollBehavior = '';
    };
  }

  function initIpcFaq() {
    const faqSection = document.querySelector('.page-calculadora-ipc .faq-section');
    if (!faqSection) return;

    document.querySelectorAll('.page-calculadora-ipc .faq-item__question').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();

        const scrollY = window.scrollY;
        const unlock = lockPageScroll(scrollY);

        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');

        document.querySelectorAll('.page-calculadora-ipc .faq-item').forEach((entry) => {
          entry.classList.remove('open');
          const question = entry.querySelector('.faq-item__question');
          if (question) question.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }

        setTimeout(unlock, 320);
      });
    });
  }

  function initIpcAnimations() {
    const sections = document.querySelectorAll('.page-calculadora-ipc .animate-section');
    if (!sections.length) return;

    document.body.classList.add('ipc-animations-enabled');

    const revealSection = (el) => {
      el.classList.add('is-visible');
    };

    const isInViewport = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealSection(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

    sections.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index * 0.1, 0.5)}s`;
      if (isInViewport(el)) {
        revealSection(el);
      }
      observer.observe(el);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.classList.contains('page-calculadora-ipc')) return;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    initIpcFaq();
    initIpcAnimations();
  });
})();
