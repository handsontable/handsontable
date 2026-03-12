import { isFunction } from '../../helpers/function';
import { BasePlugin } from '../base';
import { PLUGIN_KEY as PAGINATION_PLUGIN_KEY } from '../pagination';

export const PLUGIN_KEY = 'dataProvider';
export const PLUGIN_PRIORITY = 950;

/** Default page size when dataProvider is used with pagination (no explicit pageSize). */
export const DEFAULT_PAGE_SIZE = 10;
const ABORT_REASON_MESSAGE = 'DataProvider fetch superseded by a newer request';

/**
 * @plugin DataProvider
 * @class DataProvider
 *
 * @description
 * Loads table data from an async provider (e.g. REST API) with query parameters for pagination, sort, and filters.
 * Use with the `pagination` option for server-side paging. When `dataProvider` is set, the `data` option is ignored.
 *
 * Query parameters passed to the provider: `{ page, pageSize, sort, filters }`.
 * The provider returns `{ rows, totalRows }`. Supports AbortSignal for request cancellation.
 *
 * @example
 * ```js
 * const hot = new Handsontable(container, {
 *   dataProvider: async (queryParameters, { signal }) => {
 *     const response = await fetch(buildUrl(queryParameters), { signal });
 *     const json = await response.json();
 *
 *     return { rows: json.data, totalRows: json.total };
 *   },
 *   columns: columns,
 *   pagination: { pageSize: 20 },
 * });
 * ```
 */
export class DataProvider extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get DEFAULT_SETTINGS() {
    return {};
  }

  /**
   * Current query parameters sent to the data provider.
   *
   * @type {{ page: number, pageSize: number, sort: object|null, filters: object|null }}
   */
  #queryParameters = {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sort: null,
    filters: null,
  };

  /**
   * Total row count from the last successful response (for pagination UI).
   *
   * @type {number}
   */
  #totalRows = 0;

  /**
   * AbortController for the current in-flight request.
   *
   * @type {AbortController|null}
   */
  #abortController = null;

  /**
   * Whether the plugin is enabled (dataProvider function is configured).
   *
   * @returns {boolean}
   */
  isEnabled() {
    const provider = this.hot.getSettings()[PLUGIN_KEY];

    return isFunction(provider);
  }

  /**
   * Enables the plugin and loads initial data if the table is already initialized.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    const pagination = this.hot.getPlugin(PAGINATION_PLUGIN_KEY);

    if (pagination?.enabled) {
      const pageSize = pagination.getSetting('pageSize');
      const initialPage = pagination.getSetting('initialPage');

      if (typeof pageSize === 'number') {
        this.#queryParameters.pageSize = pageSize;
      }

      if (typeof initialPage === 'number' && initialPage >= 1) {
        this.#queryParameters.page = initialPage;
      }
    }

    this.addHook('afterInit', this.#onAfterInitBound);
    this.addHook('modifyRowHeader', this.#onModifyRowHeaderBound);

    super.enablePlugin();
  }

  /**
   * Bound handler for afterInit (so it can be removed in disablePlugin).
   *
   * @private
   * @returns {void}
   */
  #onAfterInitBound = () => this.#onAfterInit();

  /**
   * Hook handler: maps visual row index (0-based within current page) to global 0-based row index
   * so that row headers and APIs show correct indexes on page > 1 (e.g. page 2 with pageSize 20 → 20, 21, …).
   *
   * @private
   * @param {number} visualRowIndex Visual row index (0-based, current page only).
   * @returns {number} Global 0-based row index for header/API use.
   */
  #onModifyRowHeader(visualRowIndex) {
    const { page, pageSize } = this.#queryParameters;
    const effectivePageSize = typeof pageSize === 'number' && pageSize >= 1
      ? pageSize
      : DEFAULT_PAGE_SIZE;

    return ((page - 1) * effectivePageSize) + visualRowIndex;
  }

  /**
   * Bound handler for modifyRowHeader (so it can be removed in disablePlugin).
   *
   * @private
   * @param {number} visualRowIndex Visual row index (0-based, current page only).
   * @returns {number} Global 0-based row index for header/API use.
   */
  #onModifyRowHeaderBound = visualRowIndex => this.#onModifyRowHeader(visualRowIndex);

  /**
   * Fetches data from the provider with optional parameter overrides.
   * If a fetch is already in progress, its AbortController is aborted so the provider can cancel
   * (e.g. via signal.addEventListener('abort', () => reject(signal.reason))). Only the latest
   * fetch updates the table; aborted requests are ignored.
   *
   * @param {object} [overrides] Override parts of the current query parameters (e.g. `{ page: 2 }`).
   * @returns {Promise<{ rows: Array, totalRows: number }|null>} Result or null if aborted/cancelled.
   */
  async fetchData(overrides = {}) {
    const provider = this.hot.getSettings()[PLUGIN_KEY];

    if (!isFunction(provider)) {
      return null;
    }

    const params = { ...this.#queryParameters, ...overrides };

    if (this.#abortController) {
      const reason = new Error(ABORT_REASON_MESSAGE);

      reason.name = 'AbortError';
      this.#abortController.abort(reason);
    }

    const controller = new AbortController();

    this.#abortController = controller;
    const signal = controller.signal;

    const allowFetch = this.hot.runHooks('beforeDataProviderFetch', params);

    if (allowFetch === false) {
      this.#abortController = null;

      return null;
    }

    try {
      const result = await provider(params, { signal });

      if (signal.aborted) {
        return null;
      }

      const rows = Array.isArray(result?.rows) ? result.rows : [];
      const totalRows = typeof result?.totalRows === 'number' && result.totalRows >= 0
        ? result.totalRows
        : rows.length;

      this.#queryParameters = params;
      this.#totalRows = totalRows;
      this.hot.loadData(rows, PLUGIN_KEY);
      this.hot.runHooks('afterDataProviderFetch', { ...result, rows, totalRows, queryParameters: params });

      return { rows, totalRows };
    } catch (err) {
      if (signal.aborted || err?.name === 'AbortError') {
        return null;
      }
      this.hot.runHooks('afterDataProviderFetchError', err, params);
      throw err;
    } finally {
      if (this.#abortController === controller) {
        this.#abortController = null;
      }
    }
  }

  /**
   * Navigates to a page and fetches its data. Used by the Pagination plugin when dataProvider is active.
   *
   * @param {number} page Page number (1-based).
   * @returns {Promise<void>}
   */
  async goToPage(page) {
    await this.fetchData({ page: Math.max(1, page) });
  }

  /**
   * Updates page size and refetches (e.g. after user changes page size in pagination UI).
   *
   * @param {number} pageSize New page size.
   * @returns {Promise<void>}
   */
  async setPageSize(pageSize) {
    const numericPageSize = typeof pageSize === 'number' && pageSize >= 1
      ? pageSize
      : DEFAULT_PAGE_SIZE;

    await this.fetchData({ pageSize: numericPageSize, page: 1 });
  }

  /**
   * Updates sort and refetches. Call when column sort changes (e.g. from ColumnSorting plugin).
   *
   * @param {object|null} sort Sort descriptor, e.g. `{ column: 0, sortOrder: 'asc' }` or null to clear.
   * @returns {Promise<void>}
   */
  async setSort(sort) {
    await this.fetchData({ sort, page: 1 });
  }

  /**
   * Updates filters and refetches.
   *
   * @param {object|null} filters Filter state to send to the provider.
   * @returns {Promise<void>}
   */
  async setFilters(filters) {
    await this.fetchData({ filters, page: 1 });
  }

  /**
   * Returns the total row count from the last successful provider response (for pagination UI).
   *
   * @returns {number}
   */
  getTotalRows() {
    return this.#totalRows;
  }

  /**
   * Returns the current query parameters.
   *
   * @returns {{ page: number, pageSize: number, sort: object|null, filters: object|null }}
   */
  getQueryParameters() {
    return { ...this.#queryParameters };
  }

  /**
   * Runs the initial fetch after the table is ready.
   *
   * @private
   */
  #onAfterInit() {
    if (!this.isEnabled()) {
      return;
    }

    this.fetchData();
  }

  /**
   * Disables the plugin and aborts any in-flight request.
   */
  disablePlugin() {
    this.hot.removeHook('afterInit', this.#onAfterInitBound);
    this.hot.removeHook('modifyRowHeader', this.#onModifyRowHeaderBound);

    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }

    super.disablePlugin();
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.#abortController?.abort();
    this.#abortController = null;

    super.destroy();
  }
}
