import { DEFAULT_PAGE_SIZE } from '../constants';
import type { HotInstance } from '../../../core/types';

interface PaginationPluginInterface {
  enabled?: boolean;
  getSetting(key: string): unknown;
  getCurrentPage?(): number;
  getCurrentPageSize?(): number | 'auto' | undefined;
  revertPageTo?(page: number): void;
  revertPageSizeTo?(pageSize: number | 'auto', page?: number): void;
}

const PAGINATION_PLUGIN_KEY = 'pagination';

/**
 * Copies enabled Pagination `pageSize` and current page into query parameters.
 *
 * Uses {@link Pagination#getCurrentPage} and {@link Pagination#getCurrentPageSize} when present so refetches
 * (e.g. after sort) keep the user-selected state without calling {@link Pagination#getPaginationData}
 * (unsafe before DataProvider registers external-pagination hooks).
 * Falls back to `pageSize` / `initialPage` from settings when the state getters are missing (tests)
 * or return a non-numeric value (e.g. `'auto'`).
 *
 * @param {{
 *   enabled?: boolean,
 *   getSetting: function(string): *,
 *   getCurrentPage?: function(): number,
 *   getCurrentPageSize?: function(): number | 'auto' | undefined,
 * }|null|undefined} paginationPlugin Pagination plugin instance.
 * @param {{ page: number, pageSize: number }} queryParameters Target object (mutated).
 * @returns {void}
 */
export function applyPaginationToQueryParameters(
  paginationPlugin: PaginationPluginInterface | null | undefined,
  queryParameters: { page: number; pageSize: number }
): void {
  if (!paginationPlugin?.enabled) {
    return;
  }

  const currentPageSize = typeof paginationPlugin.getCurrentPageSize === 'function'
    ? paginationPlugin.getCurrentPageSize()
    : undefined;
  const settingsPageSize = paginationPlugin.getSetting('pageSize');
  const initialPage = paginationPlugin.getSetting('initialPage');
  const currentPage = typeof paginationPlugin.getCurrentPage === 'function'
    ? paginationPlugin.getCurrentPage()
    : undefined;

  if (typeof currentPageSize === 'number') {
    queryParameters.pageSize = currentPageSize;
  } else if (typeof settingsPageSize === 'number') {
    queryParameters.pageSize = settingsPageSize;
  }

  if (typeof currentPage === 'number' && currentPage >= 1) {
    queryParameters.page = currentPage;
  } else if (typeof initialPage === 'number' && initialPage >= 1) {
    queryParameters.page = initialPage;
  }
}

/**
 * Resolves page size for external pagination fetch when UI reports `'auto'` or invalid values.
 *
 * @param {number | 'auto'} newPageSize Value from Pagination hook.
 * @param {number} fallbackPageSize Default when `newPageSize` is not a positive number.
 * @returns {number}
 */
export function normalizeExternalPaginationPageSize(newPageSize: number | 'auto', fallbackPageSize: number): number {
  if (newPageSize === 'auto'
    || typeof newPageSize !== 'number'
    || !Number.isFinite(newPageSize)
    || newPageSize < 1) {
    return fallbackPageSize;
  }

  return newPageSize;
}

/**
 * Copies Pagination `pageSize` / `initialPage` into query parameters when the plugin is enabled.
 *
 * @param {Core} hot Handsontable instance.
 * @param {{ page: number, pageSize: number }} queryParameters Target object (mutated).
 * @returns {void}
 */
export function applyPaginationToQueryFromPlugin(
  hot: HotInstance, queryParameters: { page: number; pageSize: number }
): void {
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
export function getPagedRowHeaderIndex(
  queryParameters: { page: number; pageSize: number },
  visualRowIndex: number,
  fallbackPageSize: number = DEFAULT_PAGE_SIZE
): number {
  const { page, pageSize } = queryParameters;
  const ps = typeof pageSize === 'number' && pageSize >= 1 ? pageSize : fallbackPageSize;

  return ((page - 1) * ps) + visualRowIndex;
}

/**
 * Loads the requested page when Pagination runs in external paged mode. When the fetch fails, puts the pager back on
 * the query's page, the page of the rows still shown: the page the change started from can be one whose fetch a
 * later change superseded, and the revert's own {@link Hooks#afterPageChange} then names that page, so the handler
 * fetched it and reverted again, without end, against a server that kept failing.
 *
 * @param {object} ctx Context.
 * @param {Core} ctx.hot Handsontable instance.
 * @param {function(): number} ctx.getQueryPage Current 1-based page from query parameters.
 * @param {function(number): Promise<void>} ctx.goToPage Fetch given page.
 * @param {number} oldPage Previous 1-based page.
 * @param {number} newPage New 1-based page.
 * @returns {void}
 */
export function handleAfterPageChangeExternalPagination(
  ctx: { hot: HotInstance; getQueryPage: () => number; goToPage: (page: number) => Promise<void> },
  oldPage: number,
  newPage: number
): void {
  const { hot, getQueryPage, goToPage } = ctx;
  const paginationPlugin = hot.getPlugin(PAGINATION_PLUGIN_KEY);

  if (!paginationPlugin?.enabled) {
    return;
  }

  if (newPage === getQueryPage()) {
    return;
  }

  goToPage(newPage).catch(() => {
    const p = hot.getPlugin(PAGINATION_PLUGIN_KEY);

    if (p?.enabled) {
      p.revertPageTo(getQueryPage());
    }
  });
}

/**
 * Loads page 1 with the new page size when Pagination runs in external paged mode. Skips when the new page size
 * already matches the query and the query is on page 1. While the plugin applies a response (a loaded one or a
 * replayed one), it also skips when the pager's page matches the query's page: that is Pagination taking the page
 * and page size of the response (possibly after a view with another page size was shown), not a user's change.
 * When the fetch fails, the pager is put back on the query's page size and page, those of the rows still shown (the
 * size the change started from is kept when it asks for the query's size, so `'auto'` stays `'auto'`). The attempted
 * size may have clamped the page, and the size the change started from can be one whose fetch a later change
 * superseded. The revert's own page-size change starts no fetch: off page 1 the rule above does not skip it, and its
 * fetch, failing too, reverted to the size that failed, without end. Another size set while the revert runs (a
 * listener) is still fetched.
 *
 * @param {object} ctx Context.
 * @param {Core} ctx.hot Handsontable instance.
 * @param {function(): number} ctx.getQueryPage Current 1-based page.
 * @param {function(): number} ctx.getQueryPageSize Current page size.
 * @param {function(): boolean} ctx.isApplyingResponse Whether the plugin is applying a response right now.
 * @param {function(): boolean} ctx.isRevertingPager Whether the pager is being put back after a failed fetch.
 * @param {function(function(): void): void} ctx.revertPager Runs a revert of the pager with `isRevertingPager` set.
 * @param {function(number): Promise<void>} ctx.setPageSize Fetch with new page size (page 1).
 * @param {number | 'auto'} oldPageSize Previous page size.
 * @param {number | 'auto'} newPageSize New page size.
 * @returns {void}
 */
export function handleAfterPageSizeChangeExternalPagination(
  ctx: {
    hot: HotInstance; getQueryPage: () => number; getQueryPageSize: () => number;
    isApplyingResponse: () => boolean; isRevertingPager: () => boolean;
    revertPager: (revert: () => void) => void; setPageSize: (ps: number) => Promise<void>;
  },
  oldPageSize: number | 'auto',
  newPageSize: number | 'auto'
): void {
  const { hot, getQueryPage, getQueryPageSize, isApplyingResponse, isRevertingPager, revertPager, setPageSize } = ctx;

  const paginationPlugin = hot.getPlugin(PAGINATION_PLUGIN_KEY);

  if (!paginationPlugin?.enabled) {
    return;
  }

  const ps = normalizeExternalPaginationPageSize(newPageSize, DEFAULT_PAGE_SIZE);

  if (isRevertingPager() && ps === getQueryPageSize()) {
    return;
  }

  const isPagerSync = isApplyingResponse() && paginationPlugin.getCurrentPage() === getQueryPage();

  if (ps === getQueryPageSize() && (getQueryPage() === 1 || isPagerSync)) {
    return;
  }

  setPageSize(ps).catch(() => {
    const p = hot.getPlugin(PAGINATION_PLUGIN_KEY);

    if (p?.enabled) {
      const queryPageSize = getQueryPageSize();
      const previousPageSize = normalizeExternalPaginationPageSize(oldPageSize, DEFAULT_PAGE_SIZE) === queryPageSize
        ? oldPageSize
        : queryPageSize;

      revertPager(() => p.revertPageSizeTo(previousPageSize, getQueryPage()));
    }
  });
}
