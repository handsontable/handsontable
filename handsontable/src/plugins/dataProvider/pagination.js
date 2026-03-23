import { PLUGIN_KEY as PAGINATION_PLUGIN_KEY } from '../pagination';
import { applyPaginationToQueryParameters, normalizeExternalPaginationPageSize } from './utils';
import { DEFAULT_PAGE_SIZE } from './constants';

/**
 * Copies Pagination `pageSize` / `initialPage` into query parameters when the plugin is enabled.
 *
 * @param {Core} hot Handsontable instance.
 * @param {{ page: number, pageSize: number }} queryParameters Target object (mutated).
 * @returns {void}
 */
export function applyPaginationToQueryFromPlugin(hot, queryParameters) {
  applyPaginationToQueryParameters(
    hot.getPlugin(PAGINATION_PLUGIN_KEY),
    queryParameters
  );
}

/**
 * Row header index offset for external paged data (1-based page, page size).
 *
 * @param {{ page: number, pageSize: number }} queryParameters Current query parameters.
 * @param {number} visualRowIndex Visual row index in the current page.
 * @param {number} [fallbackPageSize] Used when `pageSize` is not a positive number.
 * @returns {number} Global row index for headers.
 */
export function getPagedRowHeaderIndex(queryParameters, visualRowIndex, fallbackPageSize = DEFAULT_PAGE_SIZE) {
  const { page, pageSize } = queryParameters;
  const ps = typeof pageSize === 'number' && pageSize >= 1 ? pageSize : fallbackPageSize;

  return ((page - 1) * ps) + visualRowIndex;
}

/**
 * Hook: Pagination external data source is active when Pagination plugin is enabled.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {boolean|void} True when external pagination applies.
 */
export function paginationExternalDataSourceActive(hot) {
  if (!hot.getPlugin(PAGINATION_PLUGIN_KEY)?.enabled) {
    return;
  }

  return true;
}

/**
 * Hook: total item count for Pagination when DataProvider drives totals.
 *
 * @param {Core} hot Handsontable instance.
 * @param {number} totalRows Total rows from the last successful fetch.
 * @returns {number|void}
 */
export function paginationTotalItemCount(hot, totalRows) {
  if (!hot.getPlugin(PAGINATION_PLUGIN_KEY)?.enabled) {
    return;
  }

  return totalRows;
}

/**
 * Loads the requested page when Pagination runs in external paged mode.
 *
 * @param {object} ctx Context.
 * @param {function(): boolean} ctx.isEnabled DataProvider enabled check.
 * @param {Core} ctx.hot Handsontable instance.
 * @param {function(): number} ctx.getQueryPage Current 1-based page from query parameters.
 * @param {function(number): Promise<void>} ctx.goToPage Fetch given page.
 * @param {number} oldPage Previous 1-based page.
 * @param {number} newPage New 1-based page.
 * @returns {void}
 */
export function handleAfterPageChangeExternalPagination(
  ctx,
  oldPage,
  newPage
) {
  const { isEnabled, hot, getQueryPage, goToPage } = ctx;

  if (!isEnabled()
    || hot.runHooks('paginationExternalDataSourceActive', false) !== true) {
    return;
  }

  if (newPage === getQueryPage()) {
    return;
  }

  goToPage(newPage).catch(() => {
    const p = hot.getPlugin(PAGINATION_PLUGIN_KEY);

    if (p?.enabled) {
      p.revertPageTo(oldPage);
    }
  });
}

/**
 * Loads page 1 with the new page size when Pagination runs in external paged mode.
 *
 * @param {object} ctx Context.
 * @param {function(): boolean} ctx.isEnabled DataProvider enabled check.
 * @param {Core} ctx.hot Handsontable instance.
 * @param {function(): number} ctx.getQueryPage Current 1-based page.
 * @param {function(): number} ctx.getQueryPageSize Current page size.
 * @param {function(number): Promise<void>} ctx.setPageSize Fetch with new page size (page 1).
 * @param {number | 'auto'} oldPageSize Previous page size.
 * @param {number | 'auto'} newPageSize New page size.
 * @returns {void}
 */
export function handleAfterPageSizeChangeExternalPagination(
  ctx,
  oldPageSize,
  newPageSize
) {
  const { isEnabled, hot, getQueryPage, getQueryPageSize, setPageSize } = ctx;

  if (!isEnabled()
    || hot.runHooks('paginationExternalDataSourceActive', false) !== true) {
    return;
  }

  const ps = normalizeExternalPaginationPageSize(newPageSize, DEFAULT_PAGE_SIZE);

  if (ps === getQueryPageSize() && getQueryPage() === 1) {
    return;
  }

  setPageSize(ps).catch(() => {
    const p = hot.getPlugin(PAGINATION_PLUGIN_KEY);

    if (p?.enabled) {
      p.revertPageSizeTo(oldPageSize);
    }
  });
}

/**
 * Applies loaded paging state to the Pagination plugin after a successful fetch.
 *
 * @param {Core} hot Handsontable instance.
 * @param {{ page: number, pageSize: number }} params Query parameters used for the fetch.
 * @returns {void}
 */
export function applyLoadedPaginationStateFromFetch(hot, params) {
  const paginationPlugin = hot.getPlugin(PAGINATION_PLUGIN_KEY);

  if (paginationPlugin?.enabled) {
    paginationPlugin.applyLoadedPagingState({
      page: params.page,
      pageSize: params.pageSize,
    });
  }
}
