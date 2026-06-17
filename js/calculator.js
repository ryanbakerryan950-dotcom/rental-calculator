/**
 * AlquilerCalc — Rental Calculator Engine
 * Calculates rental adjustments using official Argentine indices
 */

const RentalCalculator = (function () {
  'use strict';

  const calculationState = {
    m1: null,
    i1: null,
    i2: null,
    date1: null,
    date2: null,
    monthKey1: null,
    monthKey2: null,
    indice: null,
    result: null
  };

  function parseAmount(value) {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    const parsed = CurrencyARS.parseARS(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  function calculate(params) {
    const {
      indexType = 'ICL',
      currentRent,
      startDate,
      endDate,
      contractStartDate,
      contractDuration = 36,
      adjustmentFrequency = 12
    } = params;

    const rent = typeof currentRent === 'number' ? currentRent : parseAmount(currentRent);
    if (isNaN(rent) || rent <= 0) {
      return { error: 'Ingrese un monto de alquiler válido.' };
    }

    if (!startDate || !endDate) {
      return { error: 'Seleccione las fechas de inicio y fin del período.' };
    }

    const variation = IndicesData.calculateVariation(indexType, startDate, endDate);
    if (!variation) {
      return { error: 'No se encontraron datos de índice para las fechas seleccionadas.' };
    }

    const { m2, variationPct } = CurrencyARS.applyRentFormula(
      rent,
      variation.startValue,
      variation.endValue
    );
    const newRent = Math.round(m2);
    const increaseAmount = Math.round(newRent - rent);

    const result = {
      indexType,
      indexInfo: IndicesData.INDEX_INFO[indexType],
      currentRent: rent,
      newRent,
      increaseAmount,
      variationPercent: variationPct,
      startValue: variation.startValue,
      endValue: variation.endValue,
      startDate: variation.startDate,
      endDate: variation.endDate,
      formatted: {
        currentRent: CurrencyARS.formatARS(rent),
        newRent: CurrencyARS.formatARS(newRent),
        increaseAmount: CurrencyARS.formatARS(increaseAmount),
        variationPercent: CurrencyARS.formatPercentAR(variationPct),
        startDate: IndicesData.formatDate(variation.startDate),
        endDate: IndicesData.formatDate(variation.endDate)
      }
    };

    if (contractStartDate && contractDuration) {
      result.contract = calculateContractProjection({
        newRent: result.newRent,
        contractStartDate,
        contractDuration,
        adjustmentFrequency,
        indexType
      });
    }

    return result;
  }

  async function calculateAsync(params, iclRetry = false) {
    const {
      indexType = 'ICL',
      currentRent,
      startIso,
      endIso,
      contractStartDate,
      contractDuration = 36,
      adjustmentFrequency = 12
    } = params;

    const rent = typeof currentRent === 'number' ? currentRent : parseAmount(currentRent);
    if (isNaN(rent) || rent <= 0) {
      return { error: 'Ingrese un monto de alquiler válido.' };
    }

    if (!startIso || !endIso) {
      return { error: 'Seleccione las fechas de inicio y fin del período.' };
    }

    const fecha1Str = IndicesData.toISO(startIso);
    const fecha2Str = IndicesData.toISO(endIso);
    if (!fecha1Str || !fecha2Str) {
      return { error: 'Fecha inválida. Use el formato DD/MM/AAAA o el selector de fecha.' };
    }

    if (new Date(fecha2Str + 'T12:00:00') <= new Date(fecha1Str + 'T12:00:00')) {
      return { error: 'La fecha de actualización debe ser posterior a la de inicio.' };
    }

    if (indexType === 'ICL' && typeof ICLCache !== 'undefined') {
      try {
        await ICLCache.ensureReady();
      } catch (readyErr) {
        return { error: readyErr.message || 'No se pudieron cargar los datos del ICL.' };
      }
    }

    let variation;
    try {
      variation = IndicesData.calculateVariationForDates(indexType, fecha1Str, fecha2Str);
    } catch (err) {
      if (
        indexType === 'ICL' &&
        !iclRetry &&
        typeof ICLCache !== 'undefined'
      ) {
        try {
          await ICLCache.syncICLData();
          return calculateAsync(params, true);
        } catch (syncErr) {
          console.warn('ICL sync retry failed:', syncErr);
        }
      }
      throw err;
    }

    if (!variation) {
      if (
        indexType === 'ICL' &&
        !iclRetry &&
        typeof ICLCache !== 'undefined'
      ) {
        try {
          await ICLCache.syncICLData();
          return calculateAsync(params, true);
        } catch (syncErr) {
          console.warn('ICL sync retry failed:', syncErr);
        }
      }
      return { error: 'No se encontraron datos de índice para las fechas seleccionadas.' };
    }

    const i1 = variation.startValue;
    const i2 = variation.endValue;
    const { m2, variationPct } = CurrencyARS.applyRentFormula(rent, i1, i2);
    const newRent = Math.round(m2);
    const increaseAmount = Math.round(newRent - rent);

    Object.assign(calculationState, {
      m1: rent,
      i1,
      i2,
      date1: fecha1Str,
      date2: fecha2Str,
      monthKey1: variation.monthKey1,
      monthKey2: variation.monthKey2,
      indice: indexType,
      result: { m2: newRent, factor: i2 / i1, variationPct }
    });

    const result = {
      indexType,
      indexInfo: IndicesData.INDEX_INFO[indexType],
      currentRent: rent,
      newRent,
      increaseAmount,
      variationPercent: variationPct,
      startValue: i1,
      endValue: i2,
      startDate: variation.startDate,
      endDate: variation.endDate,
      formatted: {
        currentRent: CurrencyARS.formatARS(rent),
        newRent: CurrencyARS.formatARS(newRent),
        increaseAmount: CurrencyARS.formatARS(increaseAmount),
        variationPercent: CurrencyARS.formatPercentAR(variationPct),
        startDate: IndicesData.formatDate(variation.startDate),
        endDate: IndicesData.formatDate(variation.endDate)
      }
    };

    if (contractStartDate && contractDuration) {
      result.contract = calculateContractProjection({
        newRent: result.newRent,
        contractStartDate,
        contractDuration,
        adjustmentFrequency,
        indexType
      });
    }

    return result;
  }

  function validateCalculationResult(m1, m2, variationPct, periodDays) {
    const warnings = [];
    const errors = [];
    const months = periodDays / 30.44;
    const maxRealisticPct = months * 15;

    if (variationPct > maxRealisticPct) {
      errors.push(
        `Variación de +${variationPct.toFixed(1)}% en ${Math.round(months)} meses ` +
        'supera el máximo histórico del ICL. Posible error en los datos del índice o en las fechas. ' +
        'Verificá las fechas ingresadas y consultá con un profesional.'
      );
    }

    if (variationPct > 100 && months < 12) {
      errors.push(
        `+${variationPct.toFixed(1)}% en menos de 12 meses es inusual para el ICL. ` +
        'Verificá que las fechas sean correctas.'
      );
    }

    if (m2 < m1) {
      warnings.push(
        `El nuevo valor (${CurrencyARS.formatARS(m2)}) es menor al actual (${CurrencyARS.formatARS(m1)}). ` +
        'El ICL no puede bajar. Verificá las fechas (F1 debe ser anterior a F2).'
      );
    }

    return { warnings, errors, blocked: errors.length > 0 };
  }

  function getResultsSection() {
    return document.getElementById('calc-results-section');
  }

  function revealResultsPanel(container) {
    if (!container) return;

    container.classList.add('visible');
    const section = getResultsSection();

    if (section) {
      section.classList.remove('reveal', 'visible');
      section.classList.add('is-visible');
      section.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideResultsPanel(container) {
    if (!container) return;

    container.classList.remove('visible');
    container.innerHTML = '';

    const section = getResultsSection();
    if (section) {
      section.classList.remove('is-visible');
      section.setAttribute('aria-hidden', 'true');
    }
  }

  function showResultWarning(container, message, isError) {
    if (!container) return;
    const el = document.createElement('div');
    el.className = isError ? 'result-panel__alert result-panel__alert--error' : 'result-panel__alert';
    el.setAttribute('role', 'alert');
    el.textContent = message;
    const details = container.querySelector('.result-panel__details');
    if (details) {
      details.parentNode.insertBefore(el, details);
    } else {
      container.prepend(el);
    }
  }

  function calculateContractProjection(params) {
    const {
      newRent,
      contractStartDate,
      contractDuration,
      adjustmentFrequency,
      indexType
    } = params;

    const adjustments = [];
    const totalMonths = parseInt(contractDuration, 10);
    const freq = parseInt(adjustmentFrequency, 10);
    let rent = newRent;

    const [startYear, startMonth] = contractStartDate.split('-').map(Number);

    for (let m = freq; m <= totalMonths; m += freq) {
      const adjYear = startYear + Math.floor((startMonth - 1 + m) / 12);
      const adjMonth = ((startMonth - 1 + m) % 12) + 1;
      const prevYear = startYear + Math.floor((startMonth - 1 + m - freq) / 12);
      const prevMonth = ((startMonth - 1 + m - freq) % 12) + 1;

      const fromDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
      const toDate = `${adjYear}-${String(adjMonth).padStart(2, '0')}`;

      const varData = IndicesData.calculateVariation(indexType, fromDate, toDate);
      if (varData) {
        const increase = rent * (varData.variation / 100);
        rent = Math.round(rent + increase);
        adjustments.push({
          month: m,
          date: toDate,
          formattedDate: IndicesData.formatDate(toDate),
          rent: rent,
          formattedRent: CurrencyARS.formatARS(rent),
          variation: varData.variation,
          formattedVariation: IndicesData.formatPercent(varData.variation)
        });
      }
    }

    return {
      adjustments,
      finalRent: rent,
      formattedFinalRent: CurrencyARS.formatARS(rent),
      totalAdjustments: adjustments.length
    };
  }

  function compareIndices(currentRent, startDate, endDate) {
    const rent = parseAmount(currentRent);
    const types = ['ICL', 'IPC', 'CER', 'CASA_PROPIA'];
    const comparisons = [];

    for (const type of types) {
      const variation = IndicesData.calculateVariation(type, startDate, endDate);
      if (variation) {
        const newRent = Math.round(rent * (1 + variation.variation / 100));
        comparisons.push({
          indexType: type,
          name: IndicesData.INDEX_INFO[type].name,
          fullName: IndicesData.INDEX_INFO[type].fullName,
          variation: variation.variation,
          newRent,
          formattedVariation: IndicesData.formatPercent(variation.variation),
          formattedNewRent: CurrencyARS.formatARS(newRent)
        });
      }
    }

    comparisons.sort((a, b) => b.newRent - a.newRent);
    return comparisons;
  }

  function initMainCalculator() {
    const form = document.getElementById('calculator-form');
    if (!form) return;

    const isHomeCalc = !!document.getElementById('fecha-inicio');

    if (isHomeCalc) {
      initHomeCalculator(form);
      return;
    }

    const tabs = document.querySelectorAll('.calculator__tab');
    const indexInput = document.getElementById('index-type');
    const resultsEl = document.getElementById('calculator-results');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (indexInput) indexInput.value = tab.dataset.index;
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const result = calculate({
        indexType: document.getElementById('index-type').value,
        currentRent: document.getElementById('current-rent').value,
        startDate: document.getElementById('start-date').value,
        endDate: document.getElementById('end-date').value
      });

      if (result.error) {
        alert(result.error);
        return;
      }

      displayResults(result, resultsEl);
    });

    const resetBtn = document.getElementById('calculator-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        form.reset();
        if (indexInput) indexInput.value = 'ICL';
        tabs.forEach(t => t.classList.remove('active'));
        if (tabs[0]) tabs[0].classList.add('active');
        if (resultsEl) resultsEl.classList.remove('visible');
      });
    }

    populateDateSelects();
  }

  function initHomeCalculator(form) {
    const montoInput = document.getElementById('monto-actual');
    if (montoInput) CurrencyARS.initRentInput(montoInput);

    const indexCards = document.querySelectorAll('.index-card');
    const indexInput = document.getElementById('index-type');
    const resultsEl = document.getElementById('calculator-results');
    const fechaInicio = document.getElementById('fecha-inicio');
    const fechaFin = document.getElementById('fecha-fin');
    const btnCalcular = document.getElementById('btn-calcular');
    let lastResult = null;

    const today = new Date().toISOString().slice(0, 10);
    if (fechaInicio) fechaInicio.max = today;
    if (fechaFin) fechaFin.max = today;

    if (fechaInicio && fechaFin) {
      fechaInicio.addEventListener('change', () => {
        if (fechaInicio.value) {
          fechaFin.min = fechaInicio.value;
          if (fechaFin.value && fechaFin.value < fechaInicio.value) {
            fechaFin.value = fechaInicio.value;
          }
        } else {
          fechaFin.removeAttribute('min');
        }
      });
    }

    indexCards.forEach(card => {
      card.addEventListener('click', () => {
        indexCards.forEach(c => {
          c.classList.remove('selected');
          c.setAttribute('aria-pressed', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');
        indexInput.value = card.dataset.index;
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const montoActual = CurrencyARS.getRentRawValue(montoInput);
      const validation = CurrencyARS.validateRentAmount(montoActual);

      if (!validation.valid) {
        CurrencyARS.showFieldError(montoInput, validation.error);
        return;
      }

      CurrencyARS.clearFieldMessages(montoInput);
      if (validation.warning) {
        CurrencyARS.showFieldWarning(montoInput, validation.warning);
      }

      const montoRaw = document.getElementById('monto-raw');
      if (montoRaw) montoRaw.value = montoActual;

      if (btnCalcular) btnCalcular.classList.add('loading');

      try {
        const result = await calculateAsync({
          indexType: indexInput.value,
          currentRent: montoActual,
          startIso: fechaInicio.value,
          endIso: fechaFin.value
        });

        if (result.error) {
          alert(result.error);
          return;
        }

        result.inputDates = {
          start: fechaInicio.value,
          end: fechaFin.value
        };

        const periodDays =
          (new Date(calculationState.date2 + 'T12:00:00') - new Date(calculationState.date1 + 'T12:00:00')) /
          (1000 * 60 * 60 * 24);
        const guard = validateCalculationResult(
          calculationState.m1,
          calculationState.result.m2,
          calculationState.result.variationPct,
          periodDays
        );

        lastResult = result;
        displayHomeResults(result, resultsEl, guard);
      } catch (err) {
        console.error(err);
        alert(`Error obteniendo índices: ${err.message}`);
      } finally {
        if (btnCalcular) btnCalcular.classList.remove('loading');
      }
    });

    if (resultsEl) {
      resultsEl.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target || !lastResult) return;

        const action = target.dataset.action;
        if (action === 'copy') copyResult(lastResult);
        if (action === 'pdf') downloadPDF(lastResult);
        if (action === 'reset') resetHomeCalculator(form, resultsEl, indexCards, indexInput);
        if (action === 'formula-toggle') {
          const explainer = resultsEl.querySelector('.formula-explainer');
          if (explainer) explainer.classList.toggle('open');
        }
      });
    }
  }

  function resetHomeCalculator(form, resultsEl, indexCards, indexInput) {
    form.reset();
    indexInput.value = 'ICL';
    indexCards.forEach((c, i) => {
      c.classList.toggle('selected', i === 0);
      c.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    });
    hideResultsPanel(resultsEl);
  }

  function copyResult(result) {
    const text = [
      'RESULTADO DE ACTUALIZACIÓN — AlquilerCalc',
      `Nuevo valor: ${result.formatted.newRent}`,
      `Aumento: ${result.formatted.variationPercent}`,
      `Índice: ${result.indexInfo.name}`,
      `Período: ${IndicesData.formatDateShort(result.inputDates.start)} → ${IndicesData.formatDateShort(result.inputDates.end)}`,
      `Índice F1: ${(calculationState.i1 ?? result.startValue).toFixed(2)} | Índice F2: ${(calculationState.i2 ?? result.endValue).toFixed(2)}`,
      `Fórmula: M2 = M1 × (I2 ÷ I1)`
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      const btn = document.querySelector('[data-action="copy"]');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '¡Copiado!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
      if (window.AlquilerCalcUI) {
        window.AlquilerCalcUI.showToast('¡Copiado!');
      }
    });
  }

  const PDF_SITE_URL = 'https://calculadoradealquileres.ar';
  const PDF_SITE_LABEL = 'calculadoradealquileres.ar';
  const PDF_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="48" height="48" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="pdf-logo-bg" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F07850"/>
        <stop offset="1" stop-color="#C9552A"/>
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#pdf-logo-bg)"/>
    <rect x="7.5" y="6.5" width="17" height="19" rx="2.5" fill="#fff"/>
    <rect x="9.5" y="8.5" width="13" height="5.5" rx="1.2" fill="#FFF0EB"/>
    <rect x="10.5" y="10" width="8" height="1.4" rx=".7" fill="#E8673C"/>
    <rect x="10.5" y="12" width="5.5" height="1" rx=".5" fill="#E8673C" opacity=".45"/>
    <rect x="10.5" y="16.5" width="3.2" height="3.2" rx=".9" fill="#E8673C"/>
    <rect x="14.4" y="16.5" width="3.2" height="3.2" rx=".9" fill="#E8673C"/>
    <rect x="18.3" y="16.5" width="3.2" height="3.2" rx=".9" fill="#E8673C"/>
    <rect x="10.5" y="20.8" width="3.2" height="3.2" rx=".9" fill="#E8673C"/>
    <rect x="14.4" y="20.8" width="3.2" height="3.2" rx=".9" fill="#E8673C"/>
    <rect x="18.3" y="20.8" width="3.2" height="3.2" rx=".9" fill="#C9552A"/>
  </svg>`;

  function getPdfCalculatorName() {
    if (document.body.classList.contains('page-calculadora-ipc')) {
      return 'Calculadora IPC Alquileres';
    }
    if (document.body.classList.contains('page-calculadora-icl')) {
      return 'Calculadora ICL Alquileres';
    }
    return 'Calculadora De Alquileres';
  }

  function downloadPDF(result) {
    const periodStart = IndicesData.formatDateShort(result.inputDates.start);
    const periodEnd = IndicesData.formatDateShort(result.inputDates.end);
    const calculatorName = getPdfCalculatorName();
    const i1 = (calculationState.i1 ?? result.startValue).toFixed(2);
    const i2 = (calculationState.i2 ?? result.endValue).toFixed(2);
    const generatedAt = new Date().toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const html = `<!DOCTYPE html>
<html lang="es-AR">
<head>
  <meta charset="UTF-8">
  <title>Comprobante — ${calculatorName}</title>
  <style>
    @page { margin: 18mm; }
    @media print {
      body { padding: 0; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: Inter, 'Segoe UI', Arial, sans-serif;
      padding: 40px 36px;
      color: #1A1A2E;
      max-width: 680px;
      margin: 0 auto;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .pdf-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 2px solid #FDDDD3;
      margin-bottom: 28px;
    }
    .pdf-header__logo { flex-shrink: 0; line-height: 0; }
    .pdf-header__name {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #1A1A2E;
      line-height: 1.25;
    }
    .pdf-header__site {
      margin: 6px 0 0;
      font-size: 14px;
    }
    .pdf-header__site a {
      color: #E8673C;
      text-decoration: none;
      font-weight: 600;
    }
    .pdf-doc-title {
      margin: 0 0 20px;
      font-size: 13px;
      font-weight: 600;
      color: #E8673C;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .pdf-amount-box {
      background: #FFF8F5;
      border: 1px solid #FDDDD3;
      border-radius: 12px;
      padding: 28px 24px;
      text-align: center;
      margin-bottom: 28px;
    }
    .pdf-amount {
      margin: 0;
      font-size: 36px;
      font-weight: 800;
      color: #E8673C;
      line-height: 1.1;
    }
    .pdf-amount-label {
      margin: 10px 0 0;
      font-size: 14px;
      color: #6B7280;
    }
    .pdf-details {
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .pdf-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 13px 18px;
      font-size: 14px;
      border-bottom: 1px solid #F3F4F6;
    }
    .pdf-row:last-child { border-bottom: none; }
    .pdf-row__label { color: #6B7280; flex-shrink: 0; }
    .pdf-row__value { font-weight: 600; text-align: right; }
    .pdf-formula {
      background: #FFF0EB;
      border: 1px solid #FDDDD3;
      padding: 18px 20px;
      border-radius: 10px;
      font-family: ui-monospace, 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.7;
      color: #1A1A2E;
    }
    .pdf-formula strong { color: #E8673C; font-weight: 700; }
    .pdf-footer {
      margin-top: 32px;
      padding-top: 18px;
      border-top: 1px solid #E5E7EB;
      font-size: 11px;
      color: #9CA3AF;
      line-height: 1.65;
    }
    .pdf-footer a { color: #E8673C; text-decoration: none; }
  </style>
</head>
<body>
  <header class="pdf-header">
    <div class="pdf-header__logo">${PDF_LOGO_SVG}</div>
    <div>
      <h1 class="pdf-header__name">${calculatorName}</h1>
      <p class="pdf-header__site"><a href="${PDF_SITE_URL}">${PDF_SITE_LABEL}</a></p>
    </div>
  </header>

  <p class="pdf-doc-title">Comprobante de actualización de alquiler</p>

  <div class="pdf-amount-box">
    <p class="pdf-amount">${result.formatted.newRent}</p>
    <p class="pdf-amount-label">Nuevo valor del alquiler mensual</p>
  </div>

  <div class="pdf-details">
    <div class="pdf-row"><span class="pdf-row__label">Aumento aplicado</span><span class="pdf-row__value">${result.formatted.variationPercent}</span></div>
    <div class="pdf-row"><span class="pdf-row__label">Índice utilizado</span><span class="pdf-row__value">${result.indexInfo.fullName}</span></div>
    <div class="pdf-row"><span class="pdf-row__label">Período</span><span class="pdf-row__value">${periodStart} → ${periodEnd}</span></div>
    <div class="pdf-row"><span class="pdf-row__label">Alquiler anterior</span><span class="pdf-row__value">${result.formatted.currentRent}</span></div>
    <div class="pdf-row"><span class="pdf-row__label">Índice F1</span><span class="pdf-row__value">${i1}</span></div>
    <div class="pdf-row"><span class="pdf-row__label">Índice F2</span><span class="pdf-row__value">${i2}</span></div>
    <div class="pdf-row"><span class="pdf-row__label">Incremento en pesos</span><span class="pdf-row__value">${result.formatted.increaseAmount}</span></div>
  </div>

  <div class="pdf-formula">
    <strong>Fórmula:</strong> M2 = M1 × (I2 ÷ I1)<br>
    ${result.formatted.newRent} = ${result.formatted.currentRent} × (${i2} ÷ ${i1})
  </div>

  <p class="pdf-footer">
    Documento orientativo generado el ${generatedAt} por <strong>${calculatorName}</strong> —
    <a href="${PDF_SITE_URL}">${PDF_SITE_LABEL}</a>.<br>
    Consulte siempre con un profesional matriculado antes de aplicar cualquier ajuste contractual.
  </p>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  function displayIpcResults(result, container, guard) {
    const { date1, date2, result: calcResult } = calculationState;
    const periodStart = IndicesData.formatDisplayDate(date1);
    const periodEnd = IndicesData.formatDisplayDate(date2);
    const newRentFormatted = CurrencyARS.formatARS(calcResult.m2);
    const variationFormatted = CurrencyARS.formatPercentAR(calcResult.variationPct);

    container.innerHTML = `
      <div class="ipc-result-stats">
        <div class="ipc-result-stat">
          <span class="ipc-result-stat__label">Monto actualizado</span>
          <span class="ipc-result-stat__value ipc-result-stat__value--orange">${newRentFormatted}</span>
        </div>
        <div class="ipc-result-stat">
          <span class="ipc-result-stat__label">Variación IPC acumulada</span>
          <span class="ipc-result-stat__value ipc-result-stat__value--teal">${variationFormatted}</span>
        </div>
        <div class="ipc-result-stat">
          <span class="ipc-result-stat__label">Período calculado</span>
          <span class="ipc-result-stat__value ipc-result-stat__value--dark">${periodStart} → ${periodEnd}</span>
        </div>
      </div>
    `;

    if (guard) {
      guard.errors.forEach((msg) => showResultWarning(container, msg, true));
      guard.warnings.forEach((msg) => showResultWarning(container, msg, false));
    }

    revealResultsPanel(container);
  }

  function displayHomeResults(result, container, guard) {
    if (!container) return;

    if (document.body.classList.contains('page-calculadora-ipc')) {
      displayIpcResults(result, container, guard);
      return;
    }

    const { m1, i1, i2, date1, date2, monthKey1, monthKey2, indice, result: calcResult } = calculationState;
    const periodStart = IndicesData.formatDisplayDate(date1);
    const periodEnd = IndicesData.formatDisplayDate(date2);
    const dispMonth1 = IndicesData.formatMonthKeyDisplay(monthKey1);
    const dispMonth2 = IndicesData.formatMonthKeyDisplay(monthKey2);
    const newRentFormatted = CurrencyARS.formatARS(calcResult.m2);
    const currentRentFormatted = CurrencyARS.formatARS(m1);
    const increaseFormatted = CurrencyARS.formatARS(calcResult.m2 - m1);
    const variationFormatted = CurrencyARS.formatPercentAR(calcResult.variationPct);

    container.innerHTML = `
      <div class="result-panel__title">Resultado de actualización</div>
      <div class="result-panel__amount-label">Nuevo valor del alquiler:</div>
      <div class="result-panel__amount result-amount">${newRentFormatted}</div>
      <div class="result-panel__badges">
        <span class="result-badge result-badge--green">Aumento aplicado: ${variationFormatted}</span>
        <span class="result-badge result-badge--blue">Índice utilizado: ${result.indexInfo.name}</span>
      </div>
      <div class="result-panel__details">
        <div><strong>Período:</strong> ${periodStart} → ${periodEnd}</div>
        <div><strong>Índice F1:</strong> ${i1.toFixed(2)} (${indice} ${dispMonth1}) &nbsp;|&nbsp; <strong>Índice F2:</strong> ${i2.toFixed(2)} (${indice} ${dispMonth2})</div>
        <div><strong>Variación:</strong> ${variationFormatted}</div>
        <div><strong>Alquiler anterior:</strong> ${currentRentFormatted} &nbsp;→&nbsp; <strong>Incremento:</strong> ${increaseFormatted}</div>
      </div>
      <div class="result-panel__actions">
        <button type="button" class="btn-result-secondary" data-action="pdf">Descargar PDF</button>
        <button type="button" class="btn-result-secondary" data-action="copy">Copiar resultado</button>
        <button type="button" class="btn-result-ghost" data-action="reset">Nueva consulta</button>
      </div>
      <div class="formula-explainer">
        <button type="button" class="formula-explainer__toggle" data-action="formula-toggle">
          Ver fórmula aplicada
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="formula-explainer__body">
          <div class="formula-explainer__content">
            Fórmula aplicada: M2 = M1 × (I2 ÷ I1)<br>
            ${newRentFormatted} = ${currentRentFormatted} × (${i2.toFixed(2)} ÷ ${i1.toFixed(2)})
          </div>
        </div>
      </div>
    `;

    if (guard) {
      guard.errors.forEach((msg) => showResultWarning(container, msg, true));
      guard.warnings.forEach((msg) => showResultWarning(container, msg, false));
    }

    revealResultsPanel(container);
  }

  function initContractCalculator() {
    if (document.getElementById('mini-calc-tabs')) {
      initMiniCalculators();
      return;
    }

    const form = document.getElementById('contract-calculator-form');
    if (!form) return;

    const resultsEl = document.getElementById('contract-results');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const result = calculate({
        indexType: document.getElementById('contract-index-type').value,
        currentRent: document.getElementById('contract-rent').value,
        startDate: document.getElementById('contract-adjust-start').value,
        endDate: document.getElementById('contract-adjust-end').value,
        contractStartDate: document.getElementById('contract-start-date').value,
        contractDuration: document.getElementById('contract-duration').value,
        adjustmentFrequency: document.getElementById('contract-frequency').value
      });

      if (result.error) {
        alert(result.error);
        return;
      }

      displayContractResults(result, resultsEl);
    });

    populateContractDateSelects();
  }

  function populateDateSelects() {
    const startSelect = document.getElementById('start-date');
    const endSelect = document.getElementById('end-date');
    if (!startSelect || !endSelect) return;

    const dates = IndicesData.getAvailableDates('ICL');
    populateSelect(startSelect, dates);
    populateSelect(endSelect, dates);
  }

  function populateContractDateSelects() {
    const selects = [
      'contract-adjust-start',
      'contract-adjust-end',
      'contract-start-date'
    ];

    const dates = IndicesData.getAvailableDates('ICL');
    selects.forEach(id => {
      const el = document.getElementById(id);
      if (el) populateSelect(el, dates);
    });
  }

  function populateSelect(select, dates) {
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Seleccionar fecha';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    dates.forEach(date => {
      const option = document.createElement('option');
      option.value = date;
      option.textContent = IndicesData.formatDate(date);
      select.appendChild(option);
    });
  }

  function displayResults(result, container) {
    if (!container) return;

    container.innerHTML = `
      <div class="results__grid">
        <div class="results__card">
          <div class="results__label">Alquiler actual</div>
          <div class="results__value">${result.formatted.currentRent}</div>
        </div>
        <div class="results__card results__card--highlight">
          <div class="results__label">Nuevo alquiler</div>
          <div class="results__value">${result.formatted.newRent}</div>
        </div>
        <div class="results__card">
          <div class="results__label">Incremento</div>
          <div class="results__value results__value--success">${result.formatted.increaseAmount}</div>
        </div>
      </div>
      <div class="results__breakdown">
        <h4>Detalle del cálculo — ${result.indexInfo.fullName}</h4>
        <div class="results__row">
          <span>Índice al inicio (${result.formatted.startDate})</span>
          <span>${result.startValue.toFixed(4)}</span>
        </div>
        <div class="results__row">
          <span>Índice al cierre (${result.formatted.endDate})</span>
          <span>${result.endValue.toFixed(4)}</span>
        </div>
        <div class="results__row">
          <span>Variación del índice</span>
          <span class="results__value--success">${result.formatted.variationPercent}</span>
        </div>
        <div class="results__row">
          <span>Monto del incremento</span>
          <span>${result.formatted.increaseAmount}</span>
        </div>
        <div class="results__row">
          <span><strong>Nuevo alquiler mensual</strong></span>
          <span><strong>${result.formatted.newRent}</strong></span>
        </div>
      </div>
    `;

    container.classList.add('visible');
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function displayContractResults(result, container) {
    if (!container) return;

    let adjustmentsHTML = '';
    if (result.contract && result.contract.adjustments.length > 0) {
      adjustmentsHTML = `
        <div class="results__breakdown mt-32">
          <h4>Proyección de ajustes futuros</h4>
          ${result.contract.adjustments.map(adj => `
            <div class="results__row">
              <span>Mes ${adj.month} — ${adj.formattedDate}</span>
              <span>${adj.formattedRent} (${adj.formattedVariation})</span>
            </div>
          `).join('')}
          <div class="results__row">
            <span><strong>Alquiler final proyectado</strong></span>
            <span><strong>${result.contract.formattedFinalRent}</strong></span>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="results__grid">
        <div class="results__card">
          <div class="results__label">Alquiler actual</div>
          <div class="results__value">${result.formatted.currentRent}</div>
        </div>
        <div class="results__card results__card--highlight">
          <div class="results__label">Próximo alquiler</div>
          <div class="results__value">${result.formatted.newRent}</div>
        </div>
        <div class="results__card">
          <div class="results__label">Variación</div>
          <div class="results__value results__value--success">${result.formatted.variationPercent}</div>
        </div>
      </div>
      <div class="results__breakdown">
        <h4>Detalle — ${result.indexInfo.fullName}</h4>
        <div class="results__row">
          <span>Período</span>
          <span>${result.formatted.startDate} → ${result.formatted.endDate}</span>
        </div>
        <div class="results__row">
          <span>Incremento</span>
          <span>${result.formatted.increaseAmount}</span>
        </div>
        <div class="results__row">
          <span><strong>Nuevo alquiler</strong></span>
          <span><strong>${result.formatted.newRent}</strong></span>
        </div>
      </div>
      ${adjustmentsHTML}
    `;

    container.classList.add('visible');
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function populateIndexTable() {
    const tbody = document.getElementById('index-table-body');
    if (!tbody) return;

    const latest = IndicesData.getLatestValues();
    const rows = [
      { key: 'ICL', badge: 'icl' },
      { key: 'IPC', badge: 'ipc' },
      { key: 'CER', badge: 'cer' },
      { key: 'CASA_PROPIA', badge: 'casa' }
    ];

    tbody.innerHTML = rows.map(({ key, badge }) => {
      const info = IndicesData.INDEX_INFO[key];
      const data = latest[key];
      return `
        <tr>
          <td><span class="badge badge--${badge}">${info.name}</span></td>
          <td>${info.fullName}</td>
          <td>${IndicesData.formatDate(data.date)}</td>
          <td><strong>${data.value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></td>
          <td>${info.source}</td>
        </tr>
      `;
    }).join('');
  }

  function populateHeroStats() {
    const statsEl = document.getElementById('hero-stats');
    if (!statsEl) return;

    const latest = IndicesData.getLatestValues();
    const iclSeries = IndicesData.ICL;
    const iclVariation = iclSeries.length >= 13
      ? IndicesData.calculateVariation('ICL',
        iclSeries[iclSeries.length - 13].date,
        iclSeries[iclSeries.length - 1].date)
      : null;

    statsEl.innerHTML = `
      <div class="hero__stat">
        <div class="hero__stat-value">${latest.ICL ? latest.ICL.value.toFixed(3) : '—'}</div>
        <div class="hero__stat-label">ICL actual</div>
      </div>
      <div class="hero__stat">
        <div class="hero__stat-value">${iclVariation ? IndicesData.formatPercent(iclVariation.variation) : '—'}</div>
        <div class="hero__stat-label">Variación anual ICL</div>
      </div>
      <div class="hero__stat">
        <div class="hero__stat-value">4</div>
        <div class="hero__stat-label">Índices oficiales</div>
      </div>
    `;
  }

  function addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  function daysBetween(a, b) {
    return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  }

  function initMiniCalculators() {
    initMiniCalcTabs();
    const depositInput = document.getElementById('deposit-rent');
    const futureInput = document.getElementById('future-rent');
    if (depositInput) CurrencyARS.initRentInput(depositInput);
    if (futureInput) CurrencyARS.initRentInput(futureInput);
    initDepositCalculator();
    initExpiryCalculator();
    initFutureRentSimulator();
    IndicesData.fetchICLFromBCRA();
  }

  function initMiniCalcTabs() {
    document.querySelectorAll('.mini-calc__tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.panel;
        document.querySelectorAll('.mini-calc__tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.mini-calc__panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const panel = document.getElementById(target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  function initDepositCalculator() {
    const form = document.getElementById('deposit-calc-form');
    if (!form) return;

    const monthBtns = document.querySelectorAll('[data-deposit-months]');
    const monthsInput = document.getElementById('deposit-months');
    let selectedMonths = 1;

    monthBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        monthBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMonths = parseInt(btn.dataset.depositMonths, 10);
        if (monthsInput) monthsInput.value = selectedMonths;
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rent = CurrencyARS.getRentRawValue(document.getElementById('deposit-rent'));
      const months = parseInt(monthsInput?.value || selectedMonths, 10);
      if (rent <= 0) { alert('Ingrese un valor de alquiler válido.'); return; }

      const deposit = rent * months;
      const dates = IndicesData.getAvailableDates('IPC');
      let updatedDeposit = deposit;
      if (dates.length >= 13) {
        const varData = IndicesData.calculateVariation('IPC', dates[dates.length - 13], dates[dates.length - 1]);
        if (varData) updatedDeposit = Math.round(deposit * (1 + varData.variation / 100));
      }

      const panel = document.getElementById('deposit-results');
      panel.innerHTML = `
        <div class="mini-result__grid">
          <div class="mini-result__item">
            <span class="mini-result__label">Monto del depósito</span>
            <span class="mini-result__value">${CurrencyARS.formatARS(deposit)}</span>
            <span class="mini-result__hint">${months} mes${months > 1 ? 'es' : ''} de alquiler</span>
          </div>
          <div class="mini-result__item mini-result__item--highlight">
            <span class="mini-result__label">Depósito actualizado al vencimiento</span>
            <span class="mini-result__value">${CurrencyARS.formatARS(updatedDeposit)}</span>
            <span class="mini-result__hint">Estimado según variación IPC anual</span>
          </div>
        </div>`;
      panel.classList.add('visible');
    });
  }

  function initExpiryCalculator() {
    const form = document.getElementById('expiry-calc-form');
    if (!form) return;

    const startInput = document.getElementById('expiry-start');
    const durationBtns = document.querySelectorAll('[data-duration]');
    const durationInput = document.getElementById('expiry-duration');
    let duration = 36;

    if (startInput) {
      startInput.max = IndicesData.formatISO(new Date());
    }

    durationBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        durationBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        duration = parseInt(btn.dataset.duration, 10);
        if (durationInput) durationInput.value = duration;
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const startStr = startInput.value;
      const months = parseInt(durationInput?.value || duration, 10);
      const [y, m, d] = startStr.split('-').map(Number);
      const startDate = new Date(y, m - 1, d);
      const endDate = addMonths(startDate, months);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const adjFreqMonths = 3;
      let nextAdj = new Date(startDate);
      while (nextAdj <= today) nextAdj = addMonths(nextAdj, adjFreqMonths);
      if (nextAdj > endDate) nextAdj = null;

      let remaining = 0;
      let cursor = addMonths(new Date(startDate), adjFreqMonths);
      while (cursor <= endDate) {
        if (cursor > today) remaining++;
        cursor = addMonths(cursor, adjFreqMonths);
      }

      document.getElementById('expiry-results').innerHTML = `
        <div class="mini-result__list">
          <div class="mini-result__row"><span>Fecha de vencimiento</span><strong>${IndicesData.formatDateShort(IndicesData.formatISO(endDate))}</strong></div>
          <div class="mini-result__row"><span>Próxima actualización</span><strong>${nextAdj ? IndicesData.formatDateShort(IndicesData.formatISO(nextAdj)) : '— (contrato vencido)'}</strong></div>
          <div class="mini-result__row"><span>Actualizaciones restantes</span><strong>${remaining}</strong></div>
          <div class="mini-result__row"><span>Días hasta el vencimiento</span><strong>${Math.max(0, daysBetween(today, endDate))}</strong></div>
        </div>`;
      document.getElementById('expiry-results').classList.add('visible');
    });
  }

  function initFutureRentSimulator() {
    const form = document.getElementById('future-calc-form');
    if (!form) return;

    const slider = document.getElementById('future-rate');
    const rateDisplay = document.getElementById('future-rate-display');
    if (slider && rateDisplay) {
      rateDisplay.textContent = slider.value + '%';
      slider.addEventListener('input', () => { rateDisplay.textContent = slider.value + '%'; });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rent = CurrencyARS.getRentRawValue(document.getElementById('future-rent'));
      const annualRate = parseFloat(slider.value) / 100;
      const freq = document.getElementById('future-frequency').value;
      const freqMonths = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 }[freq] || 3;
      if (rent <= 0) { alert('Ingrese un alquiler actual válido.'); return; }

      const periodRate = annualRate * (freqMonths / 12);
      let current = rent;
      const rows = [];
      const today = new Date();

      for (let i = 1; i <= 12; i++) {
        const monthDate = addMonths(today, i);
        if (i > 1 && (i - 1) % freqMonths === 0) {
          current = Math.round(current * (1 + periodRate));
        }
        rows.push({
          month: IndicesData.formatDate(`${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`),
          rent: CurrencyARS.formatARS(current)
        });
      }

      document.getElementById('future-results').innerHTML = `
        <p class="mini-result__hint mb-16">Proyección con índice anual del ${slider.value}% · Frecuencia: ${freq}</p>
        <div class="guide-table-wrap">
          <table class="guide-table"><thead><tr><th>Mes</th><th>Alquiler proyectado</th></tr></thead>
          <tbody>${rows.map(r => `<tr><td>${r.month}</td><td><strong>${r.rent}</strong></td></tr>`).join('')}</tbody></table>
        </div>`;
      document.getElementById('future-results').classList.add('visible');
    });
  }

  function selfTest() {
    console.group('AlquilerCalc — Self Test (vs competitor screenshot)');

    const r1 = IndicesData.getICLMonthly('2025-01-01');
    const pass1 = Math.abs(r1.value - 21.54) < 0.01;
    console.log(
      `${pass1 ? '✅' : '❌'} ICL for Jan 2025 adjustment → Dec 2024: ` +
      `${r1.value} (expected 21.54)`
    );

    const r2 = IndicesData.getICLMonthly('2026-01-01');
    const pass2 = Math.abs(r2.value - 29.39) < 0.01;
    console.log(
      `${pass2 ? '✅' : '❌'} ICL for Jan 2026 adjustment → Dec 2025: ` +
      `${r2.value} (expected 29.39)`
    );

    const m1 = 12000;
    const i1 = r1.value;
    const i2 = r2.value;
    const m2 = Math.round(m1 * (i2 / i1) * 100) / 100;
    const pct = ((i2 / i1) - 1) * 100;
    const pass3 = Math.abs(m2 - 16373.26) < 1.00;
    const pass4 = Math.abs(pct - 36.44) < 0.01;

    console.log(
      `${pass3 ? '✅' : '❌'} M2 = $12,000 × (${i2}/${i1}) = ` +
      `$${m2.toFixed(2)} (expected $16,373.26)`
    );
    console.log(
      `${pass4 ? '✅' : '❌'} Variation = +${pct.toFixed(2)}% (expected +36.44%)`
    );

    const p1 = IndicesData.getPreviousMonthKey('2025-01-01');
    const p2 = IndicesData.getPreviousMonthKey('2026-01-01');
    const p3 = IndicesData.getPreviousMonthKey('2024-03-15');
    const pass5 = p1 === '2024-12' && p2 === '2025-12' && p3 === '2024-02';
    console.log(
      `${pass5 ? '✅' : '❌'} getPreviousMonthKey: ` +
      `Jan-2025→${p1} | Jan-2026→${p2} | Mar-2024→${p3}`
    );

    const iso1 = IndicesData.toISO('01/06/2024');
    const iso2 = IndicesData.toISO('2024-06-01');
    const pass6 = iso1 === '2024-06-01' && iso2 === '2024-06-01';
    console.log(
      `${pass6 ? '✅' : '❌'} toISO: "01/06/2024"→${iso1} | "2024-06-01"→${iso2}`
    );

    const c1 = CurrencyARS.parseARS('13.000');
    const c2 = CurrencyARS.parseARS('$ 13.000,00');
    const c3 = CurrencyARS.parseARS('13000');
    const pass7 = c1 === 13000 && c2 === 13000 && c3 === 13000;
    console.log(
      `${pass7 ? '✅' : '❌'} parseARS: "13.000"→${c1} | "$ 13.000,00"→${c2} | "13000"→${c3}`
    );

    const allPass = pass1 && pass2 && pass3 && pass4 && pass5 && pass6 && pass7;
    console.log('');
    console.log(allPass
      ? '✅ ALL TESTS PASSED — calculator matches competitor results'
      : '❌ TESTS FAILED — do not deploy until all pass'
    );
    console.groupEnd();

    return allPass;
  }

  return {
    calculate,
    calculateAsync,
    calculationState,
    validateCalculationResult,
    selfTest,
    calcularActualizacion: (indice, fi, ff, m) => IndicesData.calcularActualizacion(indice, fi, ff, parseAmount(m)),
    compareIndices,
    initMainCalculator,
    initContractCalculator,
    initMiniCalculators,
    populateIndexTable,
    populateHeroStats,
    mostrarResultado: displayHomeResults,
    descargarPDF: downloadPDF,
    copiarResultado: copyResult
  };
})();
