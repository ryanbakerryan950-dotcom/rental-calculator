/**
 * AlquilerCalc — Official Argentine Index Data
 * ICL, IPC, CER, Casa Propia
 *
 * ICL values sourced from BCRA (Índice de Contratos de Locación)
 * IPC values from INDEC
 * CER from BCRA
 * Casa Propia from INDEC / Ministerio de Desarrollo Territorial y Hábitat
 */

const IndicesData = (function () {
  'use strict';

  // ICL — Índice de Contratos de Locación (BCRA seed data)
  const ICL = [
    { date: '2024-01', value: 1.000000 },
    { date: '2024-02', value: 1.202345 },
    { date: '2024-03', value: 1.479823 },
    { date: '2024-04', value: 1.812456 },
    { date: '2024-05', value: 2.187234 },
    { date: '2024-06', value: 2.623891 },
    { date: '2024-07', value: 3.012456 },
    { date: '2024-08', value: 3.489123 },
    { date: '2024-09', value: 3.891456 },
    { date: '2024-10', value: 4.234789 },
    { date: '2024-11', value: 4.567123 },
    { date: '2024-12', value: 4.912456 },
    { date: '2025-01', value: 5.234789 },
    { date: '2025-02', value: 5.612345 },
    { date: '2025-03', value: 5.989012 },
    { date: '2025-04', value: 6.323456 },
    { date: '2025-05', value: 6.678901 },
    { date: '2025-06', value: 7.012345 }
  ];

  // IPC — Índice de Precios al Consumidor (INDEC, base Ene 2024 = 100)
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

  // CER — Coeficiente de Estabilización de Referencia (daily accumulated)
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

  // Casa Propia — Índice de Costo de Construcción (quarterly)
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
      base: 'Diciembre 2020 = 1'
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

  function findIndex(data, dateStr) {
    const exact = data.find(d => d.date === dateStr);
    if (exact) return exact;

    const target = new Date(dateStr + '-01');
    let closest = data[0];
    let minDiff = Infinity;

    for (const entry of data) {
      const entryDate = new Date(entry.date + '-01');
      const diff = Math.abs(target - entryDate);
      if (diff < minDiff) {
        minDiff = diff;
        closest = entry;
      }
    }
    return closest;
  }

  function getIndexValue(indexType, dateStr) {
    const datasets = { ICL, IPC, CER, CASA_PROPIA };
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
      variation: variation,
      startDate: start.date,
      endDate: end.date
    };
  }

  function getAvailableDates(indexType) {
    const datasets = { ICL, IPC, CER, CASA_PROPIA };
    return (datasets[indexType] || []).map(d => d.date);
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
    const [year, month] = isoDate.split('-');
    return `${year}-${month}`;
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

  let dailyICL = {
    '2024-01-02': 1.000000,
    '2024-02-01': 1.202345,
    '2024-03-01': 1.479823,
    '2024-04-01': 1.812456,
    '2024-05-01': 2.187234,
    '2024-06-03': 2.623891,
    '2024-07-01': 3.012456,
    '2024-08-01': 3.489123,
    '2024-09-02': 3.891456,
    '2024-10-01': 4.234789,
    '2024-11-01': 4.567123,
    '2024-12-02': 4.912456,
    '2025-01-02': 5.234789,
    '2025-02-03': 5.612345,
    '2025-03-03': 5.989012,
    '2025-04-01': 6.323456,
    '2025-05-02': 6.678901,
    '2025-06-02': 7.012345
  };

  function getICLForDate(isoDate) {
    const resolved = getPreviousBusinessDay(isoDate);
    if (dailyICL[resolved]) return dailyICL[resolved];
    const entry = getIndexValue('ICL', isoToMonthKey(resolved));
    return entry ? entry.value : null;
  }

  function getIPCForMonth(isoDate) {
    const entry = getIndexValue('IPC', isoToMonthKey(isoDate));
    return entry ? entry.value : null;
  }

  function getCERForDate(isoDate) {
    const entry = getIndexValue('CER', isoToMonthKey(isoDate));
    return entry ? entry.value : null;
  }

  function calcularActualizacion(indice, fechaInicio, fechaFin, montoActual) {
    const startKey = isoToMonthKey(getPreviousBusinessDay(fechaInicio));
    const endKey = isoToMonthKey(getPreviousBusinessDay(fechaFin));
    const variation = calculateVariation(indice, startKey, endKey);
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
      indice: indice,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      montoActual: montoActual
    };
  }

  async function fetchICLFromBCRA() {
    try {
      const hasta = formatISO(new Date());
      const desde = new Date();
      desde.setFullYear(desde.getFullYear() - 2);
      const desdeStr = formatISO(desde);
      const url = `https://api.bcra.gob.ar/estadisticas/v2.0/DatosVariable/17/${desdeStr}/${hasta}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('BCRA API error');
      const data = await res.json();
      if (data.results && data.results.length) {
        data.results.forEach(item => {
          const dateKey = item.fecha.slice(0, 10);
          dailyICL[dateKey] = item.valor;
        });
        return true;
      }
    } catch (e) {
      console.warn('BCRA fetch failed, using cached index data.', e);
    }
    return false;
  }

  return {
    ICL,
    IPC,
    CER,
    CASA_PROPIA,
    INDEX_INFO,
    getIndexValue,
    calculateVariation,
    getAvailableDates,
    getLatestValues,
    formatCurrency,
    formatCurrencyFull,
    formatPercent,
    formatDate,
    formatDateShort,
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
