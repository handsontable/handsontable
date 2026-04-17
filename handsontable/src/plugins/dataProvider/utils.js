import { DEFAULT_PAGE_SIZE, SETTINGS_VALIDATORS } from './constants';

/**
 * Whether `dataProvider` settings are complete enough for the DataProvider plugin to run.
 *
 * @param {*} c Value of the `dataProvider` setting.
 * @returns {boolean}
 */
export function isCompleteDataProviderConfig(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) {
    return false;
  }

  return Object.keys(SETTINGS_VALIDATORS).every(key => SETTINGS_VALIDATORS[key](c[key]));
}

/**
 * @param {string} s Candidate text.
 * @returns {boolean} True when the string is only a three-digit HTTP status (e.g. `"500"`).
 */
function isBareHttpStatusText(s) {
  return typeof s === 'string' && /^\d{3}$/.test(s.trim());
}

/**
 * @param {Array<string>} candidates Collected messages (mutated).
 * @param {*} value String to append when non-empty after trim.
 * @returns {void}
 */
function pushStringCandidate(candidates, value) {
  if (typeof value === 'string') {
    const t = value.trim();

    if (t) {
      candidates.push(t);
    }
  }
}

/**
 * @param {object} obj Plain object payload (e.g. JSON body).
 * @param {Array<string>} candidates Collected messages (mutated).
 * @returns {void}
 */
function collectStringsFromApiPayload(obj, candidates) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return;
  }

  pushStringCandidate(candidates, obj.message);
  pushStringCandidate(candidates, obj.error);

  if (typeof obj.detail === 'string') {
    pushStringCandidate(candidates, obj.detail);
  }
}

/**
 * Picks user-visible error text for DataProvider notifications and logging.
 * Prefer server JSON (`message`, `error`, `detail`) from `response.data`, `data`, or `body` over a bare status code in `Error#message`.
 *
 * @param {*} err Value thrown or rejected from `fetchRows` or row mutation callbacks.
 * @returns {string} Non-empty description for UI.
 */
export function getDataProviderRequestErrorDescription(err) {
  const candidates = [];

  if (err === undefined || err === null) {
    return 'Unknown error';
  }

  if (typeof err === 'string') {
    const t = err.trim();

    return t || 'Unknown error';
  }

  if (typeof err !== 'object') {
    return String(err);
  }

  const nested = err.response?.data ?? err.data ?? err.body;

  if (nested !== undefined && nested !== null) {
    if (typeof nested === 'string') {
      try {
        collectStringsFromApiPayload(JSON.parse(nested), candidates);
      } catch {
        pushStringCandidate(candidates, nested);
      }
    } else {
      collectStringsFromApiPayload(nested, candidates);
    }
  }

  if (typeof err.error === 'string') {
    pushStringCandidate(candidates, err.error);
  }

  if (typeof err.message === 'string') {
    pushStringCandidate(candidates, err.message);
  }

  const preferred = candidates.find(c => !isBareHttpStatusText(c));

  if (preferred) {
    return preferred;
  }

  if (candidates.length > 0) {
    return candidates[0];
  }

  return String(err);
}

/**
 * Clamps a 1-based page index to the range implied by `totalRows` and fixed `pageSize` (server-side pagination).
 *
 * @param {number} page Requested page (at least 1).
 * @param {number} pageSize Rows per page from query parameters.
 * @param {number} totalRows Non-negative total row count from `fetchRows`.
 * @returns {number} Page in `[1, max(1, ceil(totalRows / pageSize))]`.
 */
export function clampDataProviderPageToTotalRows(page, pageSize, totalRows) {
  const ps = typeof pageSize === 'number' && pageSize >= 1 ? pageSize : DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalRows / ps));

  return Math.max(1, Math.min(page, totalPages));
}
