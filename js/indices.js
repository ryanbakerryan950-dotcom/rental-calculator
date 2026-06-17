/**
 * AlquilerCalc — Official Argentine Index Data
 * ICL, IPC, CER, Casa Propia
 */

const IndicesData = (function () {
  'use strict';

  function getICLMonthly(adjustmentDateInput) {
    const prevKey = getPreviousMonthKey(adjustmentDateInput);

    if (!prevKey) {
      throw new Error(`Cannot compute previous month for: ${adjustmentDateInput}`);
    }

    if (typeof ICLCache === 'undefined') {
      throw new Error('ICL cache is not available.');
    }

    const result = ICLCache.getICLValueForMonthKey(prevKey);

    if (!result) {
      const cache = ICLCache.loadCache();
      const keys = cache?.values ? Object.keys(cache.values).sort() : [];
      const range = keys.length ? `${keys[0]} to ${keys[keys.length - 1]}` : 'empty cache';
      throw new Error(
        `No ICL data for ${prevKey}. ` +
        `Cache covers ${range}. ` +
        'Syncing ICL data from BCRA.'
      );
    }

    return result;
  }

  function getICLDataArray() {
    if (typeof ICLCache === 'undefined') return [];
    return ICLCache.getICLArray();
  }

  function getICLMonthlyTable() {
    if (typeof ICLCache === 'undefined') return {};
    return ICLCache.getMonthlyValues();
  }

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
      const monthly = getICLMonthlyTable();
      const value = monthly[dateStr];
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
    if (indexType === 'ICL') {
      return getICLDataArray().map((d) => d.date);
    }
    const datasets = { IPC, CER, CASA_PROPIA };
    return (datasets[indexType] || []).map((d) => d.date);
  }

  function getLatestValues() {
    const iclData = getICLDataArray();
    return {
      ICL: iclData[iclData.length - 1] || null,
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
    if (typeof ICLCache === 'undefined') {
      return Promise.resolve(false);
    }
    return ICLCache.syncICLData().then(() => true).catch(() => false);
  }

  return {
    get ICL() {
      return getICLDataArray();
    },
    get ICL_MONTHLY() {
      return getICLMonthlyTable();
    },
    IPC,
    CER,
    CASA_PROPIA,
    INDEX_INFO,
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
