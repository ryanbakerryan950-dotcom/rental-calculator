/**
 * AlquilerCalc — ICL background sync & localStorage cache
 * BCRA daily ICL → localStorage → instant calculator lookups
 */
const ICLCache = (function () {
  'use strict';

  const ICL_CACHE_KEY = 'icl_data_cache';
  const ICL_START_DATE = '2020-07-01';
  const BCRA_DIRECT_URL = 'https://api.bcra.gob.ar/estadisticas/v3.0/monetarias/ICL';
  const PROXY_URL = '/api/icl';
  const SNAPSHOT_URL = '/data/icl-snapshot.json';

  let syncPromise = null;
  let readyPromise = null;

  function parseISO(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatISO(date) {
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const da = String(date.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }

  function todayISO() {
    return formatISO(new Date());
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(ICL_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveCache(values, lastUpdated) {
    try {
      localStorage.setItem(ICL_CACHE_KEY, JSON.stringify({
        lastUpdated,
        values
      }));
    } catch (e) {
      console.warn('ICL cache save failed:', e);
    }
  }

  function getCachedICLValue(dateISO) {
    const cache = loadCache();
    if (!cache || !cache.values) return null;

    if (cache.values[dateISO] !== undefined) return cache.values[dateISO];

    const d = parseISO(dateISO);
    for (let i = 1; i <= 7; i += 1) {
      d.setDate(d.getDate() - 1);
      const key = formatISO(d);
      if (cache.values[key] !== undefined) return cache.values[key];
    }

    return null;
  }

  function isCacheStale() {
    const cache = loadCache();
    if (!cache || !cache.lastUpdated) return true;

    const last = new Date(cache.lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now - last) / (1000 * 60 * 60);

    return hoursSinceUpdate >= 24;
  }

  function isCacheMissingDate(dateISO) {
    const cache = loadCache();
    if (!cache || !cache.values) return true;

    const d = parseISO(dateISO);
    for (let i = 0; i <= 7; i += 1) {
      const key = formatISO(d);
      if (cache.values[key] !== undefined) return false;
      d.setDate(d.getDate() - 1);
    }
    return true;
  }

  function normalizeEntry(entry) {
    const fecha = entry.fecha || entry.Fecha || entry.date;
    const valor = entry.valor ?? entry.Valor ?? entry.value;
    if (!fecha || valor === undefined || valor === null) return null;

    let iso = String(fecha);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) {
      const [day, month, year] = iso.split('/');
      iso = `${year}-${month}-${day}`;
    } else if (/^\d{8}$/.test(iso)) {
      iso = `${iso.slice(0, 4)}-${iso.slice(4, 6)}-${iso.slice(6, 8)}`;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;

    return { fecha: iso, valor: Number(valor) };
  }

  function mergeResults(existingValues, payload) {
    const newValues = { ...existingValues };
    const rows = payload.results || payload.data || payload;

    if (!Array.isArray(rows)) return newValues;

    rows.forEach((entry) => {
      const normalized = normalizeEntry(entry);
      if (normalized) {
        newValues[normalized.fecha] = normalized.valor;
      }
    });

    return newValues;
  }

  async function fetchJsonIfAvailable(url) {
    const response = await fetch(url);
    if (!response.ok) return null;

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('json')) return null;

    return response.json();
  }

  async function loadSnapshotIfNeeded() {
    if (hasCacheData()) return true;

    try {
      const data = await fetchJsonIfAvailable(SNAPSHOT_URL);
      if (!data?.values || !Object.keys(data.values).length) return false;

      saveCache(data.values, data.lastUpdated || new Date().toISOString());
      console.log(`ICL snapshot loaded (${Object.keys(data.values).length} dates)`);
      return true;
    } catch (err) {
      console.warn('ICL snapshot load failed:', err);
      return false;
    }
  }

  async function fetchICLRange(fetchFrom, today) {
    const proxyUrl = `${PROXY_URL}?desde=${fetchFrom}&hasta=${today}`;
    const directUrl = `${BCRA_DIRECT_URL}?desde=${fetchFrom}&hasta=${today}`;

    try {
      const proxyData = await fetchJsonIfAvailable(proxyUrl);
      if (proxyData) return proxyData;
    } catch (err) {
      console.warn('ICL proxy fetch failed:', err);
    }

    try {
      const directData = await fetchJsonIfAvailable(directUrl);
      if (directData) return directData;
    } catch (err) {
      console.warn('ICL direct fetch failed:', err);
    }

    return null;
  }

  async function ensureReady() {
    if (hasCacheData()) return;

    if (!readyPromise) {
      readyPromise = (async () => {
        await loadSnapshotIfNeeded();
        if (!hasCacheData()) {
          await syncICLData();
        }
      })().finally(() => {
        readyPromise = null;
      });
    }

    await readyPromise;

    if (!hasCacheData()) {
      throw new Error('No hay datos ICL disponibles. Verificá tu conexión e intentá de nuevo.');
    }
  }

  async function syncICLData() {
    if (syncPromise) return syncPromise;

    syncPromise = (async () => {
      const cache = loadCache();
      const existingValues = cache?.values || {};

      let fetchFrom;
      if (Object.keys(existingValues).length > 0) {
        const dates = Object.keys(existingValues).sort();
        const lastDate = parseISO(dates[dates.length - 1]);
        lastDate.setDate(lastDate.getDate() + 1);
        fetchFrom = formatISO(lastDate);
      } else {
        fetchFrom = ICL_START_DATE;
      }

      const today = todayISO();

      if (fetchFrom > today) {
        saveCache(existingValues, new Date().toISOString());
        return;
      }

      try {
        const data = await fetchICLRange(fetchFrom, today);
        if (!data) {
          if (Object.keys(existingValues).length > 0) {
            console.warn('ICL sync skipped: live source unavailable, using cached data');
            return;
          }
          const loaded = await loadSnapshotIfNeeded();
          if (!loaded) {
            throw new Error('No ICL data available from BCRA or local snapshot');
          }
          return;
        }

        const newValues = mergeResults(existingValues, data);
        saveCache(newValues, new Date().toISOString());
        console.log(`ICL cache updated: ${fetchFrom} → ${today}`);
      } catch (error) {
        console.warn('ICL background sync failed:', error);
        if (!hasCacheData()) throw error;
      }
    })();

    try {
      await syncPromise;
    } finally {
      syncPromise = null;
    }
  }

  function initICLCache() {
    loadSnapshotIfNeeded().finally(() => {
      const today = todayISO();
      if (isCacheStale() || isCacheMissingDate(today)) {
        syncICLData().catch((err) => console.warn('ICL init sync failed:', err));
      }
    });
  }

  function onVisibilityChange() {
    if (document.visibilityState !== 'visible') return;

    const today = todayISO();
    if (isCacheStale() || isCacheMissingDate(today)) {
      syncICLData().catch((err) => console.warn('ICL visibility sync failed:', err));
    }
  }

  function getMonthlyValues() {
    const cache = loadCache();
    if (!cache?.values) return {};

    const isos = Object.keys(cache.values).sort();
    if (!isos.length) return {};

    const monthly = {};
    let [year, month] = isos[0].slice(0, 7).split('-').map(Number);
    const [endYear, endMonth] = isos[isos.length - 1].slice(0, 7).split('-').map(Number);

    while (year < endYear || (year === endYear && month <= endMonth)) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const result = getICLValueForMonthKey(monthKey);
      if (result) {
        monthly[monthKey] = result.value;
      }
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    return monthly;
  }

  function getICLValueForMonthKey(monthKey) {
    const [y, m] = monthKey.split('-').map(Number);
    const lookupISO = formatISO(new Date(y, m, 1));
    const value = getCachedICLValue(lookupISO);
    if (value === null) return null;
    return { value, monthKey };
  }

  function getICLArray() {
    const monthly = getMonthlyValues();
    return Object.keys(monthly).sort().map((date) => ({
      date,
      value: monthly[date]
    }));
  }

  function hasCacheData() {
    const cache = loadCache();
    return !!(cache && cache.values && Object.keys(cache.values).length > 0);
  }

  document.addEventListener('DOMContentLoaded', initICLCache);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    ICL_CACHE_KEY,
    ICL_START_DATE,
    loadCache,
    saveCache,
    getCachedICLValue,
    isCacheStale,
    isCacheMissingDate,
    syncICLData,
    ensureReady,
    loadSnapshotIfNeeded,
    initICLCache,
    getMonthlyValues,
    getICLValueForMonthKey,
    getICLArray,
    hasCacheData
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ICLCache;
}
