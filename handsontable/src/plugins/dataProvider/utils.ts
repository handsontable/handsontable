import { DEFAULT_PAGE_SIZE, SETTINGS_VALIDATORS } from './constants';

/**
 * Whether `dataProvider` settings are complete enough for the DataProvider plugin to run.
 *
 * @param {*} c Value of the `dataProvider` setting.
 * @returns {boolean}
 */
export function isCompleteDataProviderConfig(c: unknown): boolean {
  if (!c || typeof c !== 'object' || Array.isArray(c)) {
    return false;
  }

  const record = c as Record<string, unknown>;

  return Object.keys(SETTINGS_VALIDATORS).every(key => SETTINGS_VALIDATORS[key](record[key]));
}

/**
 * @param {string} s Candidate text.
 * @returns {boolean} True when the string is only a three-digit HTTP status (e.g. `"500"`).
 */
function isBareHttpStatusText(s: string): boolean {
  return typeof s === 'string' && /^\d{3}$/.test(s.trim());
}

/**
 * @param {Array<string>} candidates Collected messages (mutated).
 * @param {*} value String to append when non-empty after trim.
 * @returns {void}
 */
function pushStringCandidate(candidates: string[], value: unknown): void {
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
function collectStringsFromApiPayload(obj: unknown, candidates: string[]): void {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return;
  }

  const record = obj as Record<string, unknown>;

  pushStringCandidate(candidates, record.message);
  pushStringCandidate(candidates, record.error);

  if (typeof record.detail === 'string') {
    pushStringCandidate(candidates, record.detail);
  }
}

/**
 * Picks user-visible error text for DataProvider notifications and logging.
 * Prefer server JSON (`message`, `error`, `detail`) from `response.data`, `data`, or `body` over a bare status code in `Error#message`.
 *
 * @param {*} err Value thrown or rejected from `fetchRows` or row mutation callbacks.
 * @returns {string} Non-empty description for UI.
 */
export function getDataProviderRequestErrorDescription(err: unknown): string {
  const candidates: string[] = [];

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

  const errRecord = err as Record<string, unknown>;
  const responseData = errRecord.response as Record<string, unknown> | undefined;
  const nested = responseData?.data ?? errRecord.data ?? errRecord.body;

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

  if (typeof errRecord.error === 'string') {
    pushStringCandidate(candidates, errRecord.error);
  }

  if (typeof errRecord.message === 'string') {
    pushStringCandidate(candidates, errRecord.message);
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
export function clampDataProviderPageToTotalRows(page: number, pageSize: number, totalRows: number): number {
  const ps = typeof pageSize === 'number' && pageSize >= 1 ? pageSize : DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalRows / ps));

  return Math.max(1, Math.min(page, totalPages));
}
