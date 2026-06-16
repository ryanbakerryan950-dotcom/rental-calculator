(function () {
  'use strict';

  function initIpcFaq() {
    document.querySelectorAll('.page-calculadora-ipc .faq-item').forEach((item) => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      const chevron = item.querySelector('.faq-chevron');
      if (!question || !answer) return;

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        document.querySelectorAll('.page-calculadora-ipc .faq-item').forEach((entry) => {
          entry.classList.remove('open');
          const q = entry.querySelector('.faq-question');
          const a = entry.querySelector('.faq-answer');
          const c = entry.querySelector('.faq-chevron');
          if (a) a.style.maxHeight = null;
          if (c) c.style.transform = 'rotate(0deg)';
          if (q) {
            q.setAttribute('aria-expanded', 'false');
            q.style.color = '#1A1A2E';
          }
        });

        if (!isOpen) {
          item.classList.add('open');
          answer.style.maxHeight = `${answer.scrollHeight}px`;
          if (chevron) chevron.style.transform = 'rotate(180deg)';
          question.style.color = '#E8673C';
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function initIpcAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.page-calculadora-ipc .animate-section').forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index * 0.1, 0.5)}s`;
      observer.observe(el);
    });
  }

  function initIpcDates() {
    const fechaInicio = document.getElementById('fecha-inicio');
    const fechaFin = document.getElementById('fecha-fin');
    if (!fechaInicio || !fechaFin || typeof IndicesData === 'undefined') return;

    const dates = IndicesData.getAvailableDates('IPC');
    if (dates.length >= 13) {
      fechaInicio.value = `${dates[dates.length - 13]}-01`;
      fechaFin.value = `${dates[dates.length - 1]}-01`;
    }
    fechaFin.min = fechaInicio.value;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.classList.contains('page-calculadora-ipc')) return;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    initIpcFaq();
    initIpcAnimations();
    initIpcDates();
  });
})();
