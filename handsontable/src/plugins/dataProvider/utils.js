import { isFunction } from '../../helpers/function';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { DEFAULT_PAGE_SIZE } from './constants';

/**
 * Whether `dataProvider` settings are complete enough for the DataProvider plugin to run.
 *
 * @param {*} c Value of the `dataProvider` setting.
 * @returns {boolean}
 */
export function isCompleteDataProviderConfig(c) {
  if (!c || typeof c !== 'object') {
    return false;
  }

  const rid = c.rowId;

  return (typeof rid === 'string' || isFunction(rid))
    && isFunction(c.fetchRows)
    && isFunction(c.onRowsCreate)
    && isFunction(c.onRowsUpdate)
    && isFunction(c.onRowsRemove);
}

/**
 * Builds a console warning message when `dataProvider` is set but not usable, or returns null when no warning applies.
 *
 * @param {*} c Value of the `dataProvider` setting (including from `updateSettings`).
 * @returns {string|null} Warning text, or null when the option is absent, disabled, or complete.
 */
export function getIncompleteDataProviderWarningMessage(c) {
  if (c === undefined || c === null || c === false) {
    return null;
  }

  if (typeof c !== 'object' || Array.isArray(c)) {
    return toSingleLine`Handsontable: \`dataProvider\` must be a plain object with \`rowId\`, \`fetchRows\`,\x20
                        \`onRowsCreate\`, \`onRowsUpdate\`, and \`onRowsRemove\`. The DataProvider plugin\x20
                        stays disabled.`;
  }

  const invalid = [];

  if (!(typeof c.rowId === 'string' || isFunction(c.rowId))) {
    invalid.push('rowId');
  }

  ['fetchRows', 'onRowsCreate', 'onRowsUpdate', 'onRowsRemove'].forEach((key) => {
    if (!isFunction(c[key])) {
      invalid.push(key);
    }
  });

  if (invalid.length === 0) {
    return null;
  }

  return toSingleLine`Handsontable: \`dataProvider\` has missing or invalid required options: ${invalid.join(', ')}.\x20
                      \`rowId\` must be a string or a function. \`fetchRows\`, \`onRowsCreate\`, \`onRowsUpdate\`,\x20
                      and \`onRowsRemove\` must be functions. The DataProvider plugin stays disabled.`;
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
 * Picks user-visible error text for DataProvider dialogs and logging.
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

/**
 * Copies enabled Pagination `pageSize` and current page into query parameters.
 *
 * Uses [[Pagination#getCurrentPage]] when present so refetches (e.g. after sort) keep the active page
 * without calling [[Pagination#getPaginationData]] (unsafe before DataProvider registers external-pagination hooks).
 * Falls back to `initialPage` from settings when `getCurrentPage` is missing (tests) or returns an invalid value.
 *
 * @param {{ enabled?: boolean, getSetting: function(string): *, getCurrentPage?: function(): number }|null|undefined} paginationPlugin Pagination plugin instance.
 * @param {{ page: number, pageSize: number }} queryParameters Target object (mutated).
 * @returns {void}
 */
export function applyPaginationToQueryParameters(paginationPlugin, queryParameters) {
  if (!paginationPlugin?.enabled) {
    return;
  }

  const pageSize = paginationPlugin.getSetting('pageSize');
  const initialPage = paginationPlugin.getSetting('initialPage');
  const currentPage = typeof paginationPlugin.getCurrentPage === 'function'
    ? paginationPlugin.getCurrentPage()
    : undefined;

  if (typeof pageSize === 'number') {
    queryParameters.pageSize = pageSize;
  }

  if (typeof currentPage === 'number' && currentPage >= 1) {
    queryParameters.page = currentPage;
  } else if (typeof initialPage === 'number' && initialPage >= 1) {
    queryParameters.page = initialPage;
  }
}

/**
 * Normalizes a sort descriptor to query format `{ prop, order }`.
 * Accepts either plugin format `{ column, sortOrder }` (column index) or already query format `{ prop, order }`.
 *
 * @param {{ column?: number, prop?: string, sortOrder?: string, order?: string }|null} sort Sort from plugin or overrides.
 * @param {function(number): string} colToProp Maps visual column index to column data key.
 * @returns {{ prop: string, order: 'asc'|'desc' }|null} Query-format sort or null.
 */
export function normalizeSortToQueryFormat(sort, colToProp) {
  if (sort === null || sort === undefined || typeof sort !== 'object') {
    return null;
  }

  if (typeof sort.column === 'number' && typeof colToProp === 'function') {
    return {
      prop: colToProp(sort.column),
      order: sort.sortOrder,
    };
  }

  const order = sort.order ?? sort.sortOrder;

  if (typeof sort.prop === 'string' && (order === 'asc' || order === 'desc')) {
    return {
      prop: sort.prop,
      order,
    };
  }

  return null;
}

/**
 * Converts query-format sort `{ prop, order }` to ColumnSorting plugin format `{ column, sortOrder }`.
 *
 * @param {{ prop: string, order: 'asc'|'desc' }|null} sort Query-format sort.
 * @param {function(string): number} propToCol Maps column data key to visual column index.
 * @returns {{ column: number, sortOrder: 'asc'|'desc' }|null} Plugin-format sort or null.
 */
export function querySortToPluginSort(sort, propToCol) {
  if ((sort === null || sort === undefined) || typeof sort !== 'object' || typeof sort.prop !== 'string') {
    return null;
  }

  const order = sort.order ?? sort.sortOrder;

  if (order !== 'asc' && order !== 'desc') {
    return null;
  }

  if (typeof propToCol !== 'function') {
    return null;
  }

  const column = propToCol(sort.prop);

  if (typeof column !== 'number') {
    return null;
  }

  return {
    column,
    sortOrder: order,
  };
}

/**
 * Copies ColumnSorting state into query `sort` as `{ prop, order }` when sorting is enabled.
 *
 * @param {{ enabled?: boolean, getSortConfig: function(): * }|null|undefined} columnSortingPlugin ColumnSorting plugin instance.
 * @param {{ sort: ({ prop: string, order: 'asc'|'desc' }|null) }} queryParameters Target object (mutated).
 * @param {function(number): string} colToProp Maps visual column index to column data key.
 * @returns {void}
 */
export function applyColumnSortingToQueryParameters(columnSortingPlugin, queryParameters, colToProp) {
  if (!columnSortingPlugin?.enabled || typeof colToProp !== 'function') {
    return;
  }

  const sortConfig = columnSortingPlugin.getSortConfig();
  const first = Array.isArray(sortConfig) && sortConfig.length > 0 ? sortConfig[0] : sortConfig;

  if (first && typeof first === 'object' && typeof first.column === 'number') {
    queryParameters.sort = {
      prop: colToProp(first.column),
      order: first.sortOrder,
    };
  } else {
    queryParameters.sort = null;
  }
}

/**
 * Resolves page size for external pagination fetch when UI reports `'auto'` or invalid values.
 *
 * @param {number | 'auto'} newPageSize Value from Pagination hook.
 * @param {number} fallbackPageSize Default when `newPageSize` is not a positive number.
 * @returns {number}
 */
export function normalizeExternalPaginationPageSize(newPageSize, fallbackPageSize) {
  if (newPageSize === 'auto'
    || typeof newPageSize !== 'number'
    || !Number.isFinite(newPageSize)
    || newPageSize < 1) {
    return fallbackPageSize;
  }

  return newPageSize;
}

/**
 * Aligns ColumnSorting UI with a single-column sort descriptor from the data layer.
 *
 * @param {{ enabled?: boolean, setSortConfig: function(*): void }|null|undefined} columnSortingPlugin ColumnSorting plugin instance.
 * @param {{ column: number, sortOrder: 'asc'|'desc' }|Array|undefined|null} sort ColumnSorting config entry, `[]` to clear, or null/undefined.
 * @returns {void}
 */
export function syncColumnSortingFromQuerySort(columnSortingPlugin, sort) {
  if (!columnSortingPlugin?.enabled) {
    return;
  }

  const sortConfig = sort && typeof sort === 'object' && 'column' in sort ? sort : [];

  columnSortingPlugin.setSortConfig(sortConfig);
}
