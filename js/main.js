/**
 * AlquilerCalc — Main Application
 * Navigation, mobile menu, scroll effects, page initialization
 */

(function () {
  'use strict';

  const WHATSAPP_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

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

  function formatRentInput(input) {
    if (!input) return;
    input.addEventListener('blur', () => {
      const value = parseFloat(input.value.replace(/[^\d.]/g, ''));
      if (!isNaN(value) && value > 0) {
        input.value = value.toLocaleString('es-AR');
      }
    });
    input.addEventListener('focus', () => {
      input.value = input.value.replace(/[^\d.]/g, '');
    });
  }

  function initRentInputs() {
    document.querySelectorAll('#current-rent, #contract-rent, #monto-actual, #deposit-rent, #future-rent').forEach(formatRentInput);
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

  function initWhatsAppFAB() {
    if (document.querySelector('.whatsapp-fab')) return;

    const fab = document.createElement('a');
    fab.href = 'https://wa.me/?text=Hola, quiero consultar sobre actualización de alquileres';
    fab.className = 'whatsapp-fab';
    fab.target = '_blank';
    fab.rel = 'noopener noreferrer';
    fab.setAttribute('aria-label', 'Consultar por WhatsApp');
    fab.innerHTML = `${WHATSAPP_SVG}<span>¿Dudas?</span>`;
    document.body.appendChild(fab);
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
    initWhatsAppFAB();
    initCookieBanner();

    if (typeof RentalCalculator !== 'undefined') {
      RentalCalculator.initMainCalculator();
      RentalCalculator.initContractCalculator();
      RentalCalculator.populateIndexTable();
      RentalCalculator.populateHeroStats();
    }
  });
})();
