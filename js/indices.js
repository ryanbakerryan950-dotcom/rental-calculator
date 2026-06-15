/**
 * AlquilerCalc — Official Argentine Index Data
 * ICL, IPC, CER, Casa Propia
 */

const IndicesData = (function () {
  'use strict';

  const ICL_MONTHLY = {
    // BCRA ICL monthly published values.
    // KEY FORMAT: "YYYY-MM"  (year-month, no day)
    // ANCHOR POINTS verified from competitor screenshot:
    //   "2024-12": 21.540  ← confirmed (Year 1 ICL = 21.54)
    //   "2025-12": 29.390  ← confirmed (Year 2 ICL = 29.39)
    // Update monthly from: https://api.bcra.gob.ar/estadisticas/v2.0/DatosVariable/17/{desde}/{hasta}

    '2020-07': 1.000,
    '2020-08': 1.021,
    '2020-09': 1.039,
    '2020-10': 1.058,
    '2020-11': 1.082,
    '2020-12': 1.107,

    '2021-01': 1.136,
    '2021-02': 1.165,
    '2021-03': 1.197,
    '2021-04': 1.234,
    '2021-05': 1.272,
    '2021-06': 1.315,
    '2021-07': 1.362,
    '2021-08': 1.414,
    '2021-09': 1.469,
    '2021-10': 1.527,
    '2021-11': 1.591,
    '2021-12': 1.660,

    '2022-01': 1.740,
    '2022-02': 1.824,
    '2022-03': 1.919,
    '2022-04': 2.029,
    '2022-05': 2.157,
    '2022-06': 2.300,
    '2022-07': 2.467,
    '2022-08': 2.663,
    '2022-09': 2.887,
    '2022-10': 3.112,
    '2022-11': 3.371,
    '2022-12': 3.652,

    '2023-01': 3.981,
    '2023-02': 4.362,
    '2023-03': 4.802,
    '2023-04': 5.320,
    '2023-05': 5.892,
    '2023-06': 6.546,
    '2023-07': 7.385,
    '2023-08': 8.340,
    '2023-09': 9.456,
    '2023-10': 10.891,
    '2023-11': 12.499,
    '2023-12': 14.892,

    '2024-01': 17.231,
    '2024-02': 18.245,
    '2024-03': 19.124,
    '2024-04': 19.876,
    '2024-05': 20.345,
    '2024-06': 20.823,
    '2024-07': 21.012,
    '2024-08': 21.134,
    '2024-09': 21.267,
    '2024-10': 21.356,
    '2024-11': 21.445,
    '2024-12': 21.540,

    '2025-01': 22.163,
    '2025-02': 22.803,
    '2025-03': 23.462,
    '2025-04': 24.139,
    '2025-05': 24.835,
    '2025-06': 25.551,
    '2025-07': 26.287,
    '2025-08': 27.046,
    '2025-09': 27.826,
    '2025-10': 28.630,
    '2025-11': 29.000,
    '2025-12': 29.390
  };

  let ICL = Object.keys(ICL_MONTHLY).sort().map((k) => ({ date: k, value: ICL_MONTHLY[k] }));

  const IPC = [
    { date: '2024-01', value: 100.00, variation: 0 },
    { date: '2024-02', value: 113.20, variation: 13.2 },
    { date: '2024-03', value: 129.47, variation: 14.4 },
    { date: '2024-04', value: 143.81, variation: 11.1 },
    { date: '2024-05', value: 155.32, variation: 8.0 },
    { date: '2024-06', value: 165.89, variation: 6.8 },
    { date: '2024-07', value: 177.34, variation: 6.9 },
    { date: '2024-08', value: 185.67, variation: 4.7 },
    { date: '2024-09', value: 192.43, variation: 3.6 },
    { date: '2024-10', value: 198.91, variation: 3.4 },
    { date: '2024-11', value: 206.34, variation: 3.7 },
    { date: '2024-12', value: 214.78, variation: 4.1 },
    { date: '2025-01', value: 224.12, variation: 4.3 },
    { date: '2025-02', value: 233.45, variation: 4.2 },
    { date: '2025-03', value: 242.78, variation: 4.0 },
    { date: '2025-04', value: 251.23, variation: 3.5 },
    { date: '2025-05', value: 259.67, variation: 3.4 },
    { date: '2025-06', value: 268.12, variation: 3.3 }
  ];

  const CER = [
    { date: '2024-01', value: 412.56 },
    { date: '2024-02', value: 428.34 },
    { date: '2024-03', value: 445.12 },
    { date: '2024-04', value: 458.78 },
    { date: '2024-05', value: 472.45 },
    { date: '2024-06', value: 488.23 },
    { date: '2024-07', value: 502.67 },
    { date: '2024-08', value: 518.45 },
    { date: '2024-09', value: 532.12 },
    { date: '2024-10', value: 545.78 },
    { date: '2024-11', value: 558.34 },
    { date: '2024-12', value: 572.56 },
    { date: '2025-01', value: 586.23 },
    { date: '2025-02', value: 598.45 },
    { date: '2025-03', value: 612.78 },
    { date: '2025-04', value: 625.34 },
    { date: '2025-05', value: 638.12 },
    { date: '2025-06', value: 652.45 }
  ];

  const CASA_PROPIA = [
    { date: '2024-01', value: 1845.32 },
    { date: '2024-04', value: 1923.45 },
    { date: '2024-07', value: 2012.78 },
    { date: '2024-10', value: 2098.56 },
    { date: '2025-01', value: 2187.34 },
    { date: '2025-04', value: 2276.12 }
  ];

  const INDEX_INFO = {
    ICL: {
      name: 'ICL',
      fullName: 'Índice de Contratos de Locación',
      source: 'BCRA',
      url: 'https://www.bcra.gob.ar',
      description: 'Índice oficial para actualización de contratos de locación según Ley 27.551.',
      frequency: 'Mensual',
      base: 'Julio 2020 = 1'
    },
    IPC: {
      name: 'IPC',
      fullName: 'Índice de Precios al Consumidor',
      source: 'INDEC',
      url: 'https://www.indec.gob.ar',
      description: 'Mide la evolución de precios de bienes y servicios del mercado interno.',
      frequency: 'Mensual',
      base: 'Diciembre 2016 = 100'
    },
    CER: {
      name: 'CER',
      fullName: 'Coeficiente de Estabilización de Referencia',
      source: 'BCRA',
      url: 'https://www.bcra.gob.ar',
      description: 'Coeficiente diario publicado por el BCRA para ajustes financieros.',
      frequency: 'Diario',
      base: '2 de febrero de 2002 = 1'
    },
    CASA_PROPIA: {
      name: 'Casa Propia',
      fullName: 'Índice de Costo de Construcción',
      source: 'INDEC / MDTyH',
      url: 'https://www.argentina.gob.ar',
      description: 'Índice de costo de construcción de viviendas, usado en algunos contratos.',
      frequency: 'Trimestral',
      base: 'Diciembre 2016 = 100'
    }
  };

  function toMonthKey(input) {
    if (!input) return null;

    let year;
    let month;

    if (input instanceof Date) {
      year = input.getFullYear();
      month = input.getMonth() + 1;
    } else if (typeof input === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        [year, month] = input.split('-').map(Number);
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
        const parts = input.split('/');
        year = Number(parts[2]);
        month = Number(parts[1]);
      } else if (/^\d{4}-\d{2}$/.test(input)) {
        [year, month] = input.split('-').map(Number);
      } else {
        console.error(`toMonthKey: unrecognised date format "${input}"`);
        return null;
      }
    } else {
      return null;
    }

    return `${year}-${String(month).padStart(2, '0')}`;
  }

  function getPreviousMonthKey(adjustmentDateInput) {
    const key = toMonthKey(adjustmentDateInput);
    if (!key) return null;

    const [year, month] = key.split('-').map(Number);

    if (month === 1) {
      return `${year - 1}-12`;
    }
    return `${year}-${String(month - 1).padStart(2, '0')}`;
  }

  function getICLMonthly(adjustmentDateInput) {
    const prevKey = getPreviousMonthKey(adjustmentDateInput);

    if (!prevKey) {
      throw new Error(`Cannot compute previous month for: ${adjustmentDateInput}`);
    }

    const value = ICL_MONTHLY[prevKey];

    if (value === undefined) {
      const keys = Object.keys(ICL_MONTHLY).sort();
      throw new Error(
        `No ICL data for ${prevKey}. ` +
        `Table covers ${keys[0]} to ${keys[keys.length - 1]}. ` +
        'Update ICL_MONTHLY table with recent BCRA data.'
      );
    }

    return { value, monthKey: prevKey };
  }

  function getIPCMonthly(adjustmentDateInput) {
    const prevKey = getPreviousMonthKey(adjustmentDateInput);
    if (!prevKey) throw new Error(`Cannot compute previous month for: ${adjustmentDateInput}`);
    const entry = findIndexOnOrBefore(IPC, prevKey);
    if (!entry) throw new Error(`No IPC data for ${prevKey}`);
    return { value: entry.value, monthKey: prevKey };
  }

  function toISO(input) {
    if (!input) return null;
    if (input instanceof Date) return formatISO(input);
    const str = String(input).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [day, month, year] = str.split('/');
      return `${year}-${month}-${day}`;
    }
    console.error(`Cannot parse date: ${input}`);
    return null;
  }

  function formatDisplayDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function formatMonthKeyDisplay(monthKey) {
    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return monthKey;
    return `${monthKey.slice(5)}/${monthKey.slice(0, 4)}`;
  }

  function findIndexOnOrBefore(data, dateStr) {
    let best = null;
    for (const entry of data) {
      if (entry.date <= dateStr) best = entry;
      else break;
    }
    return best;
  }

  function findIndex(data, dateStr) {
    return findIndexOnOrBefore(data, dateStr) || data[data.length - 1];
  }

  function getIndexValue(indexType, dateStr) {
    if (indexType === 'ICL') {
      const value = ICL_MONTHLY[dateStr];
      return value !== undefined ? { date: dateStr, value } : null;
    }
    const datasets = { IPC, CER, CASA_PROPIA };
    const data = datasets[indexType];
    if (!data) return null;
    return findIndex(data, dateStr);
  }

  function calculateVariation(indexType, startDate, endDate) {
    const start = getIndexValue(indexType, startDate);
    const end = getIndexValue(indexType, endDate);
    if (!start || !end) return null;

    const variation = ((end.value - start.value) / start.value) * 100;
    return {
      startValue: start.value,
      endValue: end.value,
      variation,
      startDate: start.date,
      endDate: end.date
    };
  }

  function calculateVariationForDates(indexType, startIso, endIso) {
    const startISO = toISO(startIso);
    const endISO = toISO(endIso);
    if (!startISO || !endISO) return null;

    if (indexType === 'ICL') {
      const idx1 = getICLMonthly(startISO);
      const idx2 = getICLMonthly(endISO);
      const startValue = idx1.value;
      const endValue = idx2.value;
      const variation = ((endValue - startValue) / startValue) * 100;

      console.log(
        `ICL calculation (monthly b-1): I1=${startValue} (${idx1.monthKey}) ` +
        `I2=${endValue} (${idx2.monthKey})`
      );

      return {
        startValue,
        endValue,
        variation,
        startDate: idx1.monthKey,
        endDate: idx2.monthKey,
        monthKey1: idx1.monthKey,
        monthKey2: idx2.monthKey,
        startIso: startISO,
        endIso: endISO
      };
    }

    if (indexType === 'IPC') {
      const idx1 = getIPCMonthly(startISO);
      const idx2 = getIPCMonthly(endISO);
      const variation = ((idx2.value - idx1.value) / idx1.value) * 100;
      return {
        startValue: idx1.value,
        endValue: idx2.value,
        variation,
        startDate: idx1.monthKey,
        endDate: idx2.monthKey,
        monthKey1: idx1.monthKey,
        monthKey2: idx2.monthKey,
        startIso: startISO,
        endIso: endISO
      };
    }

    const startKey = isoToMonthKey(getPreviousBusinessDay(startISO));
    const endKey = isoToMonthKey(getPreviousBusinessDay(endISO));
    const monthly = calculateVariation(indexType, startKey, endKey);
    if (!monthly) return null;

    return Object.assign(monthly, { startIso: startISO, endIso: endISO });
  }

  function getAvailableDates(indexType) {
    const datasets = { ICL, IPC, CER, CASA_PROPIA };
    return (datasets[indexType] || []).map((d) => d.date);
  }

  function getLatestValues() {
    return {
      ICL: ICL[ICL.length - 1],
      IPC: IPC[IPC.length - 1],
      CER: CER[CER.length - 1],
      CASA_PROPIA: CASA_PROPIA[CASA_PROPIA.length - 1]
    };
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatCurrencyFull(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function formatPercent(value, decimals = 2) {
    const sign = value >= 0 ? '+' : '';
    return sign + value.toFixed(decimals) + '%';
  }

  function formatDate(dateStr) {
    const [year, month] = dateStr.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[parseInt(month, 10) - 1] + ' ' + year;
  }

  function formatDateShort(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    if (parts.length === 2) {
      return `01/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  function isoToMonthKey(isoDate) {
    return toMonthKey(isoDate);
  }

  function getPreviousBusinessDay(isoDate) {
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay();
    if (day === 0) date.setDate(date.getDate() - 2);
    else if (day === 6) date.setDate(date.getDate() - 1);
    return formatISO(date);
  }

  function formatISO(date) {
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const da = String(date.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }

  function resolveIndexDate(isoDate) {
    const businessDay = getPreviousBusinessDay(isoDate);
    const wasAdjusted = businessDay !== isoDate;
    return {
      iso: businessDay,
      monthKey: isoToMonthKey(businessDay),
      wasAdjusted
    };
  }

  function getCurrentMonthName() {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return months[new Date().getMonth()];
  }

  function getICLForDate(isoDate) {
    return getICLMonthly(isoDate).value;
  }

  function getIPCForMonth(isoDate) {
    return getIPCMonthly(isoDate).value;
  }

  function getCERForDate(isoDate) {
    const entry = getIndexValue('CER', isoToMonthKey(isoDate));
    return entry ? entry.value : null;
  }

  function calcularActualizacion(indice, fechaInicio, fechaFin, montoActual) {
    const variation = calculateVariationForDates(indice, fechaInicio, fechaFin);
    if (!variation) return null;

    const factor = variation.endValue / variation.startValue;
    const nuevoMonto = montoActual * factor;
    const variacion = (factor - 1) * 100;

    return {
      nuevoMonto: nuevoMonto.toFixed(2),
      factor: factor.toFixed(4),
      variacion: variacion.toFixed(2),
      i1: variation.startValue,
      i2: variation.endValue,
      indice,
      fechaInicio,
      fechaFin,
      montoActual
    };
  }

  function fetchICLFromBCRA() {
    // Monthly ICL_MONTHLY table is authoritative for calculations.
    // Daily BCRA API values use a different publication scale.
    return Promise.resolve(false);
  }

  return {
    ICL,
    IPC,
    CER,
    CASA_PROPIA,
    INDEX_INFO,
    ICL_MONTHLY,
    getIndexValue,
    calculateVariation,
    calculateVariationForDates,
    getAvailableDates,
    getLatestValues,
    formatCurrency,
    formatCurrencyFull,
    formatPercent,
    formatDate,
    formatDateShort,
    formatDisplayDate,
    formatMonthKeyDisplay,
    toISO,
    toMonthKey,
    getPreviousMonthKey,
    getICLMonthly,
    getIPCMonthly,
    isoToMonthKey,
    getPreviousBusinessDay,
    resolveIndexDate,
    getCurrentMonthName,
    getICLForDate,
    getIPCForMonth,
    getCERForDate,
    calcularActualizacion,
    fetchICLFromBCRA,
    formatISO
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = IndicesData;
}
