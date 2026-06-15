/**
 * currency.js
 * Single source of truth for all Argentine currency parsing,
 * validation, and formatting in this application.
 *
 * es-AR locale rules:
 *   Thousands separator : dot      →  1.200.000
 *   Decimal separator   : comma    →  1.200.000,50
 *   Currency prefix     : "$ "     →  $ 1.200.000,50
 */

const CurrencyARS = (function () {
  'use strict';

  function parseARS(raw) {
    if (raw === null || raw === undefined) return NaN;

    let str = String(raw).trim();
    str = str.replace(/^\$\s*/, '').trim();
    str = str.replace(/[\s\u00A0]/g, '');

    if (str === '') return NaN;

    const hasDot = str.includes('.');
    const hasComma = str.includes(',');

    if (hasDot && hasComma) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (hasComma && !hasDot) {
      const parts = str.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        str = str.replace(',', '.');
      } else {
        str = str.replace(/,/g, '');
      }
    } else if (hasDot && !hasComma) {
      const parts = str.split('.');
      const lastPart = parts[parts.length - 1];
      if (!(parts.length === 2 && lastPart.length <= 2)) {
        str = str.replace(/\./g, '');
      }
    }

    const result = parseFloat(str);
    return isNaN(result) ? NaN : result;
  }

  function formatARS(value, options = {}) {
    if (value === null || value === undefined || isNaN(value)) return '';

    const {
      showPrefix = true,
      decimals = 2,
      forceDecimals = true
    } = options;

    const formatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: forceDecimals ? decimals : 0,
      maximumFractionDigits: decimals
    }).format(value);

    return showPrefix ? `$ ${formatted}` : formatted;
  }

  function formatPercentAR(value, decimals = 2) {
    if (isNaN(value)) return '';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals).replace('.', ',')}%`;
  }

  function validateRentAmount(value) {
    if (isNaN(value) || value === null || value === undefined) {
      return {
        valid: false,
        error: 'Ingresá un valor numérico válido.',
        warning: null
      };
    }

    if (value <= 0) {
      return {
        valid: false,
        error: 'El valor del alquiler debe ser mayor a cero.',
        warning: null
      };
    }

    if (value < 1000) {
      return {
        valid: false,
        error:
          `El valor ${formatARS(value)} parece demasiado bajo. ` +
          `¿Quisiste escribir ${formatARS(value * 1000)}? ` +
          `Verificá el monto ingresado.`,
        warning: null
      };
    }

    if (value < 10000) {
      return {
        valid: true,
        error: null,
        warning:
          `${formatARS(value)} es un valor inusualmente bajo para un alquiler. ` +
          `Si es correcto, continuá. Si no, corregí el monto.`
      };
    }

    if (value > 100_000_000) {
      return {
        valid: true,
        error: null,
        warning:
          `${formatARS(value)} es un valor inusualmente alto. ` +
          `Verificá que no hayas ingresado dígitos de más.`
      };
    }

    return { valid: true, error: null, warning: null };
  }

  function applyRentFormula(m1, i1, i2) {
    if ([m1, i1, i2].some(v => isNaN(v) || v <= 0)) {
      throw new RangeError(
        `applyRentFormula recibió valores inválidos: m1=${m1}, i1=${i1}, i2=${i2}`
      );
    }

    const factor = i2 / i1;
    const m2 = m1 * factor;
    const variationPct = (factor - 1) * 100;

    return {
      m2: Math.round(m2 * 100) / 100,
      factor,
      variationPct
    };
  }

  function clearFieldMessages(inputEl) {
    if (!inputEl) return;
    inputEl.classList.remove('input--error', 'input--warning', 'input-error', 'input-warning');
    document
      .querySelectorAll(`[data-msg-for="${inputEl.id}"]`)
      .forEach(el => el.remove());
  }

  function showFieldError(inputEl, message) {
    if (!inputEl) return;
    clearFieldMessages(inputEl);
    inputEl.classList.add('input--error');

    const msg = document.createElement('p');
    msg.className = 'field-msg field-msg--error';
    msg.setAttribute('role', 'alert');
    msg.setAttribute('data-msg-for', inputEl.id);
    msg.textContent = message.startsWith('❌') ? message : `❌ ${message}`;

    inputEl.closest('.input-currency-wrapper, .input-wrapper, .form-group, .calc-field, div')
      .appendChild(msg);
    inputEl.focus();
  }

  function showFieldWarning(inputEl, message) {
    if (!inputEl) return;
    document.querySelectorAll(`.field-msg--warning[data-msg-for="${inputEl.id}"]`)
      .forEach(el => el.remove());
    inputEl.classList.remove('input--error');
    inputEl.classList.add('input--warning');

    const msg = document.createElement('p');
    msg.className = 'field-msg field-msg--warning';
    msg.setAttribute('role', 'status');
    msg.setAttribute('data-msg-for', inputEl.id);
    msg.textContent = message.startsWith('⚠️') ? message : `⚠️ ${message}`;

    inputEl.closest('.input-currency-wrapper, .input-wrapper, .form-group, .calc-field, div')
      .appendChild(msg);
  }

  function getRentRawValue(inputEl) {
    if (!inputEl) return NaN;
    if (typeof inputEl.getRawValue === 'function') {
      const v = inputEl.getRawValue();
      if (!isNaN(v)) return v;
    }
    if (inputEl.dataset.rawValue !== undefined && inputEl.dataset.rawValue !== '') {
      const v = Number(inputEl.dataset.rawValue);
      if (!isNaN(v)) return v;
    }
    return parseARS(inputEl.value);
  }

  function initRentInput(inputEl) {
    if (!inputEl || inputEl.dataset.rentInputInit) return;
    inputEl.dataset.rentInputInit = 'true';

    let rawValue = NaN;

    inputEl.addEventListener('focus', function () {
      const current = parseARS(this.value);
      if (!isNaN(current)) {
        this.value = current % 1 === 0
          ? current.toString()
          : current.toFixed(2).replace('.', ',');
      }
      this.select();
      clearFieldMessages(this);
    });

    inputEl.addEventListener('input', function () {
      const cursor = this.selectionStart;
      const cleaned = this.value.replace(/[^0-9.,]/g, '');
      this.value = cleaned;

      const parsed = parseARS(cleaned);
      rawValue = isNaN(parsed) ? NaN : parsed;
      this.dataset.rawValue = isNaN(rawValue) ? '' : String(rawValue);

      try { this.setSelectionRange(cursor, cursor); } catch (_) { /* noop */ }
    });

    inputEl.addEventListener('blur', function () {
      const parsed = parseARS(this.value);

      if (!isNaN(parsed) && parsed > 0) {
        rawValue = parsed;
        this.dataset.rawValue = String(parsed);
        this.value = formatARS(parsed);
        this.classList.remove('input--error', 'input--warning');

        const validation = validateRentAmount(parsed);
        if (!validation.valid && validation.error) {
          showFieldError(this, validation.error);
        } else if (validation.warning) {
          showFieldWarning(this, validation.warning);
        }
      } else if (this.value.trim() !== '') {
        showFieldError(
          this,
          'Formato inválido. Ejemplos válidos: 150000 · 150.000 · 150.000,00'
        );
        rawValue = NaN;
        this.dataset.rawValue = '';
      }
    });

    inputEl.getRawValue = function () {
      if (!isNaN(rawValue)) return rawValue;
      if (this.dataset.rawValue !== '') {
        const v = Number(this.dataset.rawValue);
        if (!isNaN(v)) return v;
      }
      return parseARS(this.value);
    };
  }

  return {
    parseARS,
    formatARS,
    formatPercentAR,
    validateRentAmount,
    applyRentFormula,
    initRentInput,
    getRentRawValue,
    showFieldError,
    showFieldWarning,
    clearFieldMessages
  };
})();
