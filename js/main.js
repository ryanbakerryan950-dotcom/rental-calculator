/**
 * AlquilerCalc — Main Application
 * Navigation, mobile menu, scroll effects, page initialization
 */

(function () {
  'use strict';

  function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    });

    const hamburger = document.querySelector('.navbar__hamburger');
    const mobileMenu = document.querySelector('.navbar__mobile');

    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('open');
        hamburger.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });

      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          mobileMenu.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });
    }

    setActiveNavLink();
  }

  function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar__links a, .navbar__mobile a').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const linkPage = href.split('#')[0];
      if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function initRentInputs() {
    document.querySelectorAll('#current-rent, #contract-rent').forEach((input) => {
      if (typeof CurrencyARS !== 'undefined') {
        CurrencyARS.initRentInput(input);
      }
    });
  }

  function initHeroMonthBadge() {
    const badge = document.getElementById('hero-month-badge');
    if (badge && typeof IndicesData !== 'undefined') {
      badge.textContent = `📊 Índices actualizados al ${IndicesData.getCurrentMonthName()}`;
    }
  }

  function initAccordion() {
    document.querySelectorAll('.faq-item__question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');

        document.querySelectorAll('.faq-item').forEach(i => {
          i.classList.remove('open');
          const q = i.querySelector('.faq-item__question');
          if (q) q.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function initScrollReveal() {
    if (document.body.classList.contains('page-premium')) return;

    const sections = document.querySelectorAll(
      'section:not(.hero):not(.hero--split):not(.hero--page):not(.hero--dark), .section, .content'
    );
    sections.forEach((el, i) => {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
        el.style.transitionDelay = `${Math.min(i * 0.05, 0.3)}s`;
      }
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  function initCookieBanner() {
    if (localStorage.getItem('alquilercalc_cookies')) return;
    if (document.querySelector('.cookie-banner')) return;

    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.innerHTML = `
      <p>Esta web usa cookies técnicas para mejorar tu experiencia.</p>
      <div class="cookie-banner__actions">
        <button type="button" class="cookie-banner__accept">Aceptar</button>
        <button type="button" class="cookie-banner__essential">Solo esenciales</button>
        <a href="politica-privacidad.html" class="cookie-banner__info">Más info</a>
      </div>`;

    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('visible'));

    const dismiss = (choice) => {
      localStorage.setItem('alquilercalc_cookies', choice);
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 400);
    };

    banner.querySelector('.cookie-banner__accept').addEventListener('click', () => dismiss('all'));
    banner.querySelector('.cookie-banner__essential').addEventListener('click', () => dismiss('essential'));
  }

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove('visible'), 2500);
  }

  window.AlquilerCalcUI = { showToast };

  document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initSmoothScroll();
    initRentInputs();
    initHeroMonthBadge();
    initAccordion();
    initScrollReveal();
    initCookieBanner();

    if (typeof RentalCalculator !== 'undefined' && RentalCalculator.selfTest) {
      RentalCalculator.selfTest();
    }

    if (typeof RentalCalculator !== 'undefined') {
      RentalCalculator.initMainCalculator();
      RentalCalculator.initContractCalculator();
      RentalCalculator.populateIndexTable();
      RentalCalculator.populateHeroStats();
    }
  });
})();
