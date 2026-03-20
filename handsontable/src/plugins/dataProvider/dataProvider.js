import { isFunction } from '../../helpers/function';
import { error as logError } from '../../helpers/console';
import { throwWithCause } from '../../helpers/errors';
import { BasePlugin } from '../base';
import { PLUGIN_KEY as PAGINATION_PLUGIN_KEY } from '../pagination';
import {
  ABORT_REASON_MESSAGE,
  DATA_PROVIDER_ERROR_REMOVE_ROWS_MISSING_ID,
  DATA_PROVIDER_ERROR_UPDATE_ROWS_MISSING_ID,
  DATA_PROVIDER_AFTER_UPDATE_SETTINGS_ORDER,
  DEFAULT_PAGE_SIZE,
  INITIAL_QUERY_PARAMETERS,
  PLUGIN_KEY,
  PLUGIN_PRIORITY,
} from './constants';
import {
  buildManualUpdateRowPayloads,
  commitRowsUpdate as commitRowsUpdateCrud,
  enqueueMutation,
  filterChangesForBatchedServerUpdate,
  getRowIdByVisualRow,
  handleBeforeAlterForCrud,
  isMissingRowId,
  queueCrud,
  runAfterRowsMutation,
  runAfterRowsMutationError,
  runBeforeRowsMutation,
  runManualUpdateRowsMutation,
  runUpdateFromChanges,
  shouldIgnoreAfterChangeForServerUpdate,
} from './crud';
import {
  captureFilterConditionsSnapshot,
  conditionsStackToFiltersPayload,
  restoreFilterConditionsFromSnapshot,
} from './filtering';
import {
  applyLoadedPaginationStateFromFetch,
  applyPaginationToQueryFromPlugin,
  getPagedRowHeaderIndex,
  handleAfterPageChangeExternalPagination,
  handleAfterPageSizeChangeExternalPagination,
  paginationExternalDataSourceActive,
  paginationTotalItemCount,
} from './pagination';
import {
  applyColumnSortToQueryFromPlugin,
  handleBeforeColumnSortForServer,
  normalizeSortInFetchParams,
  syncColumnSortingStateFromQuerySort,
} from './sorting';
import { computeEmptyStateLoadingActive } from './loading';
import { disablePluginsIncompatibleWithDataProvider, isCompleteDataProviderConfig } from './utils';

export {
  DATA_PROVIDER_BATCH_UPDATE_SOURCES,
  DEFAULT_PAGE_SIZE,
  PLUGIN_KEY,
  PLUGIN_PRIORITY,
} from './constants';

/** @typedef {{ tail: Promise<void> }} MutationQueueState */

/**
 * @plugin DataProvider
 * @class DataProvider
 *
 * @description
 * Server-backed data: `dataProvider` must be an object with `rowId`, `fetchRows`, `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove`.
 * Valid edits apply to the grid immediately; if `onRowsUpdate` fails, if validation fails later, or if `beforeRowsMutation` cancels, those cells revert to their previous values.
 *
 * When enabled, `trimRows`, `manualRowMove`, and `multiColumnSorting` are turned off. Handsontable logs a console warning for each option you still set.
 * Use [[Options#columnSorting]] for server-driven sort (single column). Query `sort` uses `prop` (column data key).
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
   * Last request params passed to `fetchRows` (`page`, `pageSize`, `sort`, `filters`).
   * Same shape as `DataProviderQueryParameters` in `types/plugins/dataProvider/dataProvider.d.ts`.
   *
   * @type {{ page: number, pageSize: number, sort: object|null, filters: object|null }}
   */
  #queryParameters = { ...INITIAL_QUERY_PARAMETERS };
  /**
   * Query parameters for the dataset currently shown after the last successful `loadData` from this plugin.
   * Differs from `#queryParameters` while a request is in flight if settings were updated before the fetch (e.g. `setFilters`).
   *
   * @private
   * @type {{ page: number, pageSize: number, sort: object|null, filters: object|null }}
   */
  #lastLoadedQueryParameters = { ...INITIAL_QUERY_PARAMETERS };
  /**
   * `totalRows` from the last successful `fetchRows` response.
   *
   * @type {number}
   */
  #totalRows = 0;
  /**
   * Aborts in-flight fetch when superseded or on disable/destroy.
   *
   * @type {AbortController|null}
   */
  #abortController = null;
  /**
   * Number of `fetchData` calls currently in progress (after `beforeDataProviderFetch` passes).
   *
   * @private
   * @type {number}
   */
  #fetchInFlightCount = 0;
  /**
   * Query parameters for the latest `fetchRows` call that has not released its in-flight slot.
   * Cleared only when `#fetchInFlightCount` returns to 0 so a superseded fetch does not wipe the active request.
   *
   * @private
   * @type {object|null}
   */
  #inFlightQueryParameters = null;
  /**
   * Last value passed to `emptyDataStateLoadingChange` (dedupes hook noise).
   *
   * @private
   * @type {boolean}
   */
  #lastEmittedDataProviderLoading = false;
  /**
   * Serializes create/update/remove mutations so they run one after another.
   *
   * @private
   * @type {MutationQueueState}
   */
  #mutationQueue = { tail: Promise.resolve() };
  /**
   * Setting keys for which an incompatible-plugin warning was logged this session.
   *
   * @private
   * @type {Set<string>}
   */
  #incompatibleSettingWarned = new Set();
  /**
   * Filter conditions saved before loadData (restored after load via setFiltersConditions hook).
   *
   * @private
   * @type {Array}
   */
  #savedConditionsForLoad = [];
  /**
   * Last known good filter conditions (for rollback when a fetch fails).
   *
   * @private
   * @type {Array}
   */
  #lastKnownGoodFilterConditions = [];

  /**
   * Raw `dataProvider` setting (config object only).
   *
   * @private
   * @returns {object|undefined}
   */
  #getConfig() {
    const c = this.hot.getSettings()[PLUGIN_KEY];

    return c && typeof c === 'object' ? c : undefined;
  }

  /**
   * @private
   * @param {object} c Config object.
   * @returns {boolean}
   */
  #isCompleteConfig(c) {
    return isCompleteDataProviderConfig(c);
  }

  /**
   * `rowId` from config (string path or function).
   *
   * @private
   * @returns {string|Function|undefined|null}
   */
  #getRowIdOption() {
    const c = this.#getConfig();

    return c ? c.rowId : undefined;
  }

  /**
   * @private
   * @returns {Function|undefined}
   */
  #getFetchFn() {
    const c = this.#getConfig();

    return c && isFunction(c.fetchRows) ? c.fetchRows : undefined;
  }

  /**
   * @private
   * @returns {Function|undefined}
   */
  #getOnRowsCreate() {
    const c = this.#getConfig();

    return c && isFunction(c.onRowsCreate) ? c.onRowsCreate : undefined;
  }

  /**
   * @private
   * @returns {Function|undefined}
   */
  #getOnRowsUpdate() {
    const c = this.#getConfig();

    return c && isFunction(c.onRowsUpdate) ? c.onRowsUpdate : undefined;
  }

  /**
   * @private
   * @returns {Function|undefined}
   */
  #getOnRowsRemove() {
    const c = this.#getConfig();

    return c && isFunction(c.onRowsRemove) ? c.onRowsRemove : undefined;
  }

  /**
   * @param {object} p Query parameters object.
   * @returns {{ page: number, pageSize: number, sort: object|null, filters: * }} Snapshot safe for comparisons.
   */
  #snapshotQueryParameters(p) {
    return {
      page: p.page,
      pageSize: p.pageSize,
      sort: p.sort === null ? null : { ...p.sort },
      filters: p.filters === null ? null : p.filters,
    };
  }

  /**
   * @returns {boolean} True when `dataProvider` is an object with all required keys.
   */
  isEnabled() {
    const c = this.#getConfig();

    return !!c && this.#isCompleteConfig(c);
  }

  /**
   * Copies `pageSize` / `initialPage` from Pagination and sort from ColumnSorting into `#queryParameters`.
   *
   * @private
   * @returns {void}
   */
  #applyPaginationAndSortFromPlugins() {
    applyPaginationToQueryFromPlugin(this.hot, this.#queryParameters);
    applyColumnSortToQueryFromPlugin(this.hot, this.#queryParameters);
  }

  /**
   * Registers DataProvider hooks (removed on disable via `BasePlugin.clearHooks`).
   *
   * @private
   * @returns {void}
   */
  #registerHooks() {
    const specs = [
      ['afterInit', this.#onAfterInit],
      ['modifyRowHeader', this.#onModifyRowHeader],
      ['beforeColumnSort', this.#onBeforeColumnSort],
      ['afterChange', this.#onAfterChangeForServerUpdate],
      ['beforeAlter', this.#onBeforeAlter],
      ['afterPageChange', this.#onAfterPageChangeExternalPagination],
      ['afterPageSizeChange', this.#onAfterPageSizeChangeExternalPagination],
      ['paginationExternalDataSourceActive', this.#paginationExternalDataSourceActive],
      ['paginationTotalItemCount', this.#paginationTotalItemCount],
      ['afterUpdateSettings', this.#onAfterUpdateSettings, DATA_PROVIDER_AFTER_UPDATE_SETTINGS_ORDER],
      ['filtersServerSideActive', this.#filtersServerSideActive],
      ['beforeFilter', this.#onBeforeFilter],
      ['beforeLoadData', this.#onBeforeLoadDataForFilters],
      ['afterLoadData', this.#onAfterLoadDataForFilters],
      ['afterDataProviderFetchError', this.#onAfterDataProviderFetchErrorForFilters],
      ['afterRowSequenceCacheUpdate', this.#onAfterViewSequenceForDataProviderLoading],
      ['afterColumnSequenceCacheUpdate', this.#onAfterViewSequenceForDataProviderLoading],
      ['emptyDataStateLoadingSync', this.#onRequestDataProviderLoadingSync],
    ];

    specs.forEach((spec) => {
      const [name, handler, order] = spec;

      this.addHook(name, handler, order);
    });
  }

  /**
   * Aborts an in-flight `fetchRows` call so a new request can start.
   *
   * @private
   * @returns {void}
   */
  #abortInFlightFetch() {
    if (!this.#abortController) {
      return;
    }

    const reason = new Error(ABORT_REASON_MESSAGE);

    reason.name = 'AbortError';
    this.#abortController.abort(reason);
  }

  /**
   * Merges overrides into `#queryParameters` and normalizes sort / page for `fetchRows`.
   *
   * @private
   * @param {object} overrides Partial query overrides.
   * @returns {object} Query parameters object.
   */
  #mergeAndNormalizeFetchParams(overrides) {
    const params = { ...this.#queryParameters, ...overrides };

    normalizeSortInFetchParams(params, this.hot);

    if (typeof params.page === 'number' && !Number.isNaN(params.page)) {
      params.page = Math.max(1, params.page);
    }

    return params;
  }

  /**
   * Replaces `#abortController` with a new controller for the next fetch.
   *
   * @private
   * @returns {AbortController}
   */
  #createFetchAbortController() {
    this.#abortInFlightFetch();

    const controller = new AbortController();

    this.#abortController = controller;

    return controller;
  }

  /**
   * @private
   * @param {object} params Query parameters for the aborted `fetchRows` call.
   * @param {Error|undefined} reason `AbortError` (or subclass) when `fetchRows` rejected; omit the argument when the promise settled after superseding.
   * @returns {void}
   */
  #runAfterDataProviderFetchAbort(params, reason) {
    if (typeof reason === 'undefined') {
      this.hot.runHooks('afterDataProviderFetchAbort', params);
    } else {
      this.hot.runHooks('afterDataProviderFetchAbort', params, reason);
    }
  }

  /**
   * Enables the plugin, syncs query params from pagination/sort plugins, and registers hooks.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.#applyPaginationAndSortFromPlugins();
    this.#registerHooks();

    super.enablePlugin();

    this.#warnAndDisableIncompatiblePlugins();
  }

  /**
   * Re-applies settings and refetches when the instance is already initialized.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    if (this.isEnabled() && this.hot.view) {
      this.fetchData();
    }

    super.updatePlugin();
  }

  /**
   * @private
   * @returns {void}
   */
  #onAfterInit = () => {
    if (this.isEnabled()) {
      this.fetchData();
    }
  };

  /**
   * Re-disables plugins that conflict with DataProvider after `updateSettings()` (their `updatePlugin` may re-enable them).
   * Registered with a late `afterUpdateSettings` order index so this runs after other plugins' listeners.
   *
   * @private
   * @returns {void}
   */
  #onAfterUpdateSettings = () => {
    if (this.enabled && this.isEnabled()) {
      this.#warnAndDisableIncompatiblePlugins();
    }
  };

  /**
   * @private
   * @returns {boolean|void}
   */
  #paginationExternalDataSourceActive = () => paginationExternalDataSourceActive(this.hot);

  /**
   * @private
   * @returns {number|void}
   */
  #paginationTotalItemCount = () => paginationTotalItemCount(this.hot, this.#totalRows);

  /**
   * Loads the requested page when Pagination runs in external paged mode.
   * Skips when `#queryParameters` already matches (e.g. after `applyLoadedPagingState`).
   *
   * @private
   * @param {number} oldPage Previous 1-based page.
   * @param {number} newPage New 1-based page.
   * @returns {void}
   */
  #onAfterPageChangeExternalPagination = (oldPage, newPage) => {
    handleAfterPageChangeExternalPagination(
      {
        isEnabled: () => this.isEnabled(),
        hot: this.hot,
        getQueryPage: () => this.#queryParameters.page,
        goToPage: page => this.#goToPage(page),
      },
      oldPage,
      newPage
    );
  };

  /**
   * Loads page 1 with the new page size when Pagination runs in external paged mode.
   * Skips when `#queryParameters` already match (e.g. duplicate hook from `applyLoadedPagingState`).
   *
   * @private
   * @param {number | 'auto'} oldPageSize Previous page size.
   * @param {number | 'auto'} newPageSize New page size.
   * @returns {void}
   */
  #onAfterPageSizeChangeExternalPagination = (oldPageSize, newPageSize) => {
    handleAfterPageSizeChangeExternalPagination(
      {
        isEnabled: () => this.isEnabled(),
        hot: this.hot,
        getQueryPage: () => this.#queryParameters.page,
        getQueryPageSize: () => this.#queryParameters.pageSize,
        setPageSize: pageSize => this.#setPageSize(pageSize),
      },
      oldPageSize,
      newPageSize
    );
  };

  /**
   * Returns true when DataProvider is enabled so the Filters plugin hides "Filter by value".
   *
   * @private
   * @returns {boolean}
   */
  #filtersServerSideActive = () => this.isEnabled();

  /**
   * Intercepts filter action: applies server-side filters and refetches; returns false so Filters skip client-side trimming.
   *
   * @private
   * @param {Array} conditionsStack Exported filter conditions (column = physical index).
   * @returns {boolean} False to signal that filtering is handled server-side.
   */
  #onBeforeFilter = (conditionsStack) => {
    if (!this.isEnabled() || !isFunction(this.#getFetchFn())) {
      return;
    }

    const filtersForProvider = conditionsStackToFiltersPayload(this.hot, conditionsStack);

    this.setFilters(filtersForProvider).catch(() => {
      // Already handled via afterDataProviderFetchError hook.
    });

    return false;
  };

  /**
   * beforeLoadData: when source is DataProvider, save current filter conditions for restore after load.
   *
   * @private
   * @param {Array} sourceData Source data passed to loadData.
   * @param {boolean} initialLoad Whether this is the initial load.
   * @param {string} [source] Source identifier (e.g. 'dataProvider').
   */
  #onBeforeLoadDataForFilters = (sourceData, initialLoad, source) => {
    if (source === PLUGIN_KEY) {
      this.#savedConditionsForLoad = captureFilterConditionsSnapshot(this.hot);
    }
  };

  /**
   * afterLoadData: when source is DataProvider, restore filter conditions and update last-known-good.
   * Always re-disables plugins incompatible with DataProvider (e.g. `trimRows`) so they cannot persist across `loadData`.
   *
   * @private
   * @param {Array} sourceData Source data passed to loadData.
   * @param {boolean} initialLoad Whether this is the initial load.
   * @param {string} [source] Source identifier (e.g. 'dataProvider').
   */
  #onAfterLoadDataForFilters = (sourceData, initialLoad, source) => {
    if (source === PLUGIN_KEY) {
      restoreFilterConditionsFromSnapshot(this.hot, this.#savedConditionsForLoad);
      this.#savedConditionsForLoad = [];
      this.#lastKnownGoodFilterConditions = captureFilterConditionsSnapshot(this.hot);
    }
    this.#warnAndDisableIncompatiblePlugins();
  };

  /**
   * afterDataProviderFetchError: restore filter conditions to last known good and re-render.
   *
   * @private
   */
  #onAfterDataProviderFetchErrorForFilters = () => {
    if (this.#lastKnownGoodFilterConditions.length > 0) {
      restoreFilterConditionsFromSnapshot(this.hot, this.#lastKnownGoodFilterConditions);
      this.hot.view.adjustElementsSize();
      this.hot.render();
    }
  };

  /**
   * Renderable row/column counts can change while a fetch is in flight. Re-evaluate the EmptyDataState loading signal.
   *
   * @private
   */
  #onAfterViewSequenceForDataProviderLoading = () => {
    if (this.enabled && this.isEnabled()) {
      this.#publishDataProviderLoadingChange(false);
    }
  };

  /**
   * EmptyDataState runs this hook after it enables so loading state is pushed again if a fetch is still in flight.
   *
   * @private
   */
  #onRequestDataProviderLoadingSync = () => {
    if (this.enabled && this.isEnabled()) {
      this.#publishDataProviderLoadingChange(true);
    }
  };

  /**
   * Runs [[Hooks#emptyDataStateLoadingChange]] when the loading overlay flag changes, or always when `forceRepublish` is `true`.
   *
   * @private
   * @param {boolean} forceRepublish When `true`, always run the hook (used after EmptyDataState re-enables).
   * @returns {void}
   */
  #publishDataProviderLoadingChange(forceRepublish) {
    if (!this.hot) {
      return;
    }

    if (!this.enabled || !this.isEnabled()) {
      if (this.#lastEmittedDataProviderLoading) {
        this.#lastEmittedDataProviderLoading = false;
        this.hot.runHooks('emptyDataStateLoadingChange', false);
      }

      return;
    }

    const next = computeEmptyStateLoadingActive({
      fetchInFlightCount: this.#fetchInFlightCount,
      inFlightQueryParameters: this.#inFlightQueryParameters,
      lastLoadedQueryParameters: this.#lastLoadedQueryParameters,
      view: this.hot.view,
    });

    if (forceRepublish || next !== this.#lastEmittedDataProviderLoading) {
      this.#lastEmittedDataProviderLoading = next;
      this.hot.runHooks('emptyDataStateLoadingChange', next);
    }
  }

  /**
   * @private
   * @param {Array} currentSortConfig Current sort config.
   * @param {Array} destinationSortConfigs Destination sort config.
   * @param {boolean} sortPossible Whether sort is allowed.
   * @returns {boolean|undefined}
   */
  #onBeforeColumnSort = (currentSortConfig, destinationSortConfigs, sortPossible) => handleBeforeColumnSortForServer(
    {
      hot: this.hot,
      isEnabled: () => this.isEnabled(),
      hasFetchFn: () => isFunction(this.#getFetchFn()),
      applyPaginationAndSortFromPlugins: () => this.#applyPaginationAndSortFromPlugins(),
      fetchData: () => this.fetchData(),
    },
    currentSortConfig,
    destinationSortConfigs,
    sortPossible
  );

  /**
   * @private
   * @param {number} visualRowIndex Visual row index.
   * @returns {number} Global row index for headers.
   */
  #onModifyRowHeader = visualRowIndex => getPagedRowHeaderIndex(this.#queryParameters, visualRowIndex);

  /**
   * After a valid edit applies locally, queues `onRowsUpdate`. On failure, cells revert to previous values.
   *
   * @private
   * @param {Array} changes `[visualRow, prop, oldVal, newVal][]`.
   * @param {string} [source] Change source.
   * @returns {void}
   */
  #onAfterChangeForServerUpdate = (changes, source) => {
    if (shouldIgnoreAfterChangeForServerUpdate(isFunction(this.#getOnRowsUpdate()), changes, source)) {
      return;
    }

    const valid = filterChangesForBatchedServerUpdate(this.hot, changes);

    if (valid.length === 0) {
      return;
    }

    this.#enqueueMutation(() => runUpdateFromChanges(this.hot, {
      getRowIdOption: () => this.#getRowIdOption(),
      commitRowsUpdate: (payloads, opts) => this.#commitRowsUpdate(payloads, opts),
    }, valid));
  };

  /**
   * @private
   * @param {string} action Alter action name.
   * @param {number|Array} index Row index or index groups.
   * @param {number} amount Row count.
   * @returns {boolean|undefined}
   */
  #onBeforeAlter = (action, index, amount) => handleBeforeAlterForCrud(
    {
      hot: this.hot,
      getOnRowsCreate: () => this.#getOnRowsCreate(),
      getOnRowsRemove: () => this.#getOnRowsRemove(),
      getRowIdOption: () => this.#getRowIdOption(),
      getRowId: vr => this.getRowId(vr),
      createRows: opts => this.createRows(opts),
      removeRows: ids => this.removeRows(ids),
    },
    action,
    index,
    amount
  );

  /**
   * Appends a mutation onto the queue so concurrent CRUD runs sequentially.
   *
   * @private
   * @param {function(): Promise<void>} fn Async work for one mutation.
   * @returns {Promise<void>}
   */
  #enqueueMutation(fn) {
    return enqueueMutation(this.#mutationQueue, fn);
  }

  /**
   * Calls `onRowsUpdate`, success/error hooks, then re-fetches or re-renders.
   *
   * @private
   * @param {object[]} rowPayloads Per-row `{ id, changes, rowData }` payloads.
   * @param {object} [options] Optional flags.
   * @param {function(): void} [options.revertOptimistic] Restores previous cell values when the request fails.
   * @returns {Promise<void>}
   */
  #commitRowsUpdate(rowPayloads, options = {}) {
    return commitRowsUpdateCrud(this.hot, {
      getOnRowsUpdate: () => this.#getOnRowsUpdate(),
      fetchData: () => this.fetchData(),
      logError,
    }, rowPayloads, options);
  }

  /**
   * @param {number} visualRow Visual row index.
   * @returns {*} Row id from `rowId` option, or undefined.
   */
  getRowId(visualRow) {
    return getRowIdByVisualRow(this.hot, this.#getRowIdOption(), visualRow);
  }

  /**
   * Fetches rows from `fetchRows` with current or overridden query parameters.
   *
   * @param {object} [overrides] Partial query overrides (e.g. `{ page: 2 }`, `{ pageSize: 20, page: 1 }`, `{ sort }`, `{ filters }`).
   * Numeric `page` is clamped to at least 1.
   * @returns {Promise<{ rows: Array, totalRows: number }|null>}
   *
   * @fires Hooks#afterDataProviderFetch when data loads.
   * @fires Hooks#afterDataProviderFetchError when `fetchRows` throws a non-abort error.
   * @fires Hooks#afterDataProviderFetchAbort when the request is superseded, aborted, or ends with `AbortError`.
   * @fires Hooks#emptyDataStateLoadingChange when the Empty Data State loading overlay flag should change.
   */
  async fetchData(overrides = {}) {
    const fetchFn = this.#getFetchFn();

    if (!isFunction(fetchFn)) {
      this.#publishDataProviderLoadingChange(false);

      return null;
    }

    const params = this.#mergeAndNormalizeFetchParams(overrides);
    const controller = this.#createFetchAbortController();
    const { signal } = controller;

    // Register in-flight state before `beforeDataProviderFetch` so synchronous renders or sequence hooks
    // (e.g. from Pagination `refreshUI`) still see the active request in `#publishDataProviderLoadingChange`.
    this.#fetchInFlightCount += 1;
    this.#inFlightQueryParameters = params;

    if (this.hot.runHooks('beforeDataProviderFetch', params) === false) {
      this.#fetchInFlightCount -= 1;

      if (this.#fetchInFlightCount === 0) {
        this.#inFlightQueryParameters = null;
      }

      this.#abortController = null;
      this.#publishDataProviderLoadingChange(false);

      return null;
    }

    let fetchReleased = false;

    const releaseFetchInFlight = () => {
      if (!fetchReleased) {
        fetchReleased = true;
        this.#fetchInFlightCount -= 1;

        if (this.#fetchInFlightCount === 0) {
          this.#inFlightQueryParameters = null;
        }
      }
    };

    this.#publishDataProviderLoadingChange(false);

    try {
      const result = await fetchFn(params, { signal });

      if (signal.aborted) {
        releaseFetchInFlight();
        this.#runAfterDataProviderFetchAbort(params, undefined);
        this.#publishDataProviderLoadingChange(false);

        return null;
      }

      const rows = Array.isArray(result?.rows) ? result.rows : [];
      const totalRows = typeof result?.totalRows === 'number' && result.totalRows >= 0
        ? result.totalRows
        : rows.length;

      this.#queryParameters = params;
      this.#totalRows = totalRows;
      this.#lastLoadedQueryParameters = this.#snapshotQueryParameters(params);

      try {
        this.hot.loadData(rows, PLUGIN_KEY);
        syncColumnSortingStateFromQuerySort(this.hot, this.#queryParameters.sort);
        applyLoadedPaginationStateFromFetch(this.hot, params);

        this.hot.runHooks('afterDataProviderFetch', { ...result, rows, totalRows, queryParameters: params });
      } finally {
        // Keep `#fetchInFlightCount` > 0 until the grid and pagination state match this response so
        // `afterRowSequenceCacheUpdate` does not publish `emptyDataStateLoadingChange` false while rows still reflect the previous page.
        releaseFetchInFlight();
        this.#publishDataProviderLoadingChange(false);
      }

      return { rows, totalRows };
    } catch (err) {
      releaseFetchInFlight();

      if (signal.aborted || err?.name === 'AbortError') {
        this.#runAfterDataProviderFetchAbort(params, err);
        this.#publishDataProviderLoadingChange(false);

        return null;
      }
      this.hot.runHooks('afterDataProviderFetchError', err, params);
      this.#publishDataProviderLoadingChange(false);
      throw err;
    } finally {
      if (this.#abortController === controller) {
        this.#abortController = null;
      }
    }
  }

  /**
   * Returns whether `fetchData` is currently waiting on `fetchRows` (after `beforeDataProviderFetch` allowed the request).
   *
   * @returns {boolean} `true` while at least one `fetchRows` from `fetchData` has not settled.
   *
   * @category DataProvider
   */
  isFetching() {
    return this.#fetchInFlightCount > 0;
  }

  /**
   * Returns query parameters for the latest started in-flight `fetchRows` call, or `null` when nothing is loading.
   * Useful to tell a refetch that will replace the grid (e.g. another page) from a refresh with the same query.
   * When a request is superseded, this reflects the newer request until every overlapping `fetchData` settles.
   *
   * @returns {object|null} A copy of the active request parameters, or `null`.
   *
   * @category DataProvider
   */
  getInFlightQueryParameters() {
    if (!this.#inFlightQueryParameters) {
      return null;
    }

    return this.#snapshotQueryParameters(this.#inFlightQueryParameters);
  }

  /**
   * Returns a copy of the query parameters for the data currently in the grid (last successful DataProvider `loadData`).
   *
   * @returns {object} Same shape as `getQueryParameters`.
   *
   * @category DataProvider
   */
  getLastLoadedQueryParameters() {
    return this.#snapshotQueryParameters(this.#lastLoadedQueryParameters);
  }

  /**
   * @private
   * @param {number} page 1-based page index (values below 1 are treated as 1 via `fetchData`).
   * @returns {Promise<void>}
   */
  async #goToPage(page) {
    await this.fetchData({ page });
  }

  /**
   * @private
   * @param {number} pageSize New page size.
   * @returns {Promise<void>}
   */
  async #setPageSize(pageSize) {
    const ps = typeof pageSize === 'number' && pageSize >= 1 ? pageSize : DEFAULT_PAGE_SIZE;

    await this.fetchData({ pageSize: ps, page: 1 });
  }

  /**
   * @returns {number} Total rows from the last successful fetch.
   */
  getTotalRows() {
    return this.#totalRows;
  }

  /**
   * @returns {object} Copy of current query parameters.
   */
  getQueryParameters() {
    return { ...this.#queryParameters };
  }

  /**
   * Sets filter state for server-side filtering and refetches data (resets to page 1).
   * Pass `null` to clear filters.
   *
   * @param {Array<{ prop: string, operation: string, conditions: Array<{ name: string, args: Array }> }>|null} filters Filter
   * descriptors (prop = column data key, same as sort) or null.
   * @returns {Promise<{ rows: Array, totalRows: number }|null>} Result of the fetch, or null if fetch was skipped/aborted.
   */
  setFilters(filters) {
    this.#queryParameters.filters = filters ?? null;
    this.#queryParameters.page = 1;

    return this.fetchData();
  }

  /**
   * Queues create/remove (or similar) server calls with before/after mutation hooks.
   *
   * @private
   * @param {string} operation `'create'` or `'remove'`.
   * @param {object} payload Hook payload (`{ rowsCreate }`, `{ rows }`, or `{ rowsRemove }`).
   * @param {function(): Promise<*>} userPromiseFn Server callback invocation.
   * @param {function(): Promise<void>|void} onSuccess Runs after success (e.g. `fetchData`).
   * @returns {Promise<void>}
   */
  #queueCrud(operation, payload, userPromiseFn, onSuccess) {
    return queueCrud(
      {
        enqueueMutation: fn => this.#enqueueMutation(fn),
        runBeforeRowsMutation: (op, p) => runBeforeRowsMutation(this.hot, op, p),
        runAfterRowsMutation: (op, p) => runAfterRowsMutation(this.hot, op, p),
        runAfterRowsMutationError: (op, err, p) => runAfterRowsMutationError(this.hot, op, err, p),
        logError,
      },
      operation,
      payload,
      userPromiseFn,
      onSuccess
    );
  }

  /**
   * Server create via `onRowsCreate`. Use `rowsAmount` to insert more than one row in one call.
   *
   * @param {object} [options] `position`, `referenceRowId`, `rowsAmount`.
   * @returns {Promise<void>}
   */
  async createRows(options = {}) {
    const onRowsCreate = this.#getOnRowsCreate();

    if (!isFunction(onRowsCreate)) {
      return;
    }

    const rowsCreatePayload = {
      position: options.position ?? 'below',
      referenceRowId: options.referenceRowId,
      rowsAmount: options.rowsAmount ?? 1,
    };
    const payload = { rowsCreate: rowsCreatePayload };

    return this.#queueCrud(
      'create',
      payload,
      () => onRowsCreate(rowsCreatePayload),
      () => this.fetchData()
    );
  }

  /**
   * Server remove via `onRowsRemove`. Pass one row id or an array of ids.
   *
   * @param {*|*[]} rowIds Row id or ids.
   * @returns {Promise<void>}
   * @throws {Error} When any id is `null` or `undefined`.
   */
  async removeRows(rowIds) {
    const onRowsRemove = this.#getOnRowsRemove();

    if (!isFunction(onRowsRemove)) {
      return;
    }

    const ids = Array.isArray(rowIds) ? rowIds : [rowIds];

    ids.forEach((id) => {
      if (isMissingRowId(id)) {
        throwWithCause(DATA_PROVIDER_ERROR_REMOVE_ROWS_MISSING_ID);
      }
    });
    const payload = { rowsRemove: ids };
    const currentPage = this.#queryParameters.page;

    return this.#queueCrud('remove', payload, () => onRowsRemove(ids), async() => {
      const result = await this.fetchData();

      if (result?.rows.length === 0 && currentPage > 1) {
        const pagination = this.hot.getPlugin(PAGINATION_PLUGIN_KEY);

        if (pagination?.enabled) {
          pagination.setPage(currentPage - 1);
        } else {
          await this.#goToPage(currentPage - 1);
        }
      }
    });
  }

  /**
   * Server update via `onRowsUpdate`. Pass an array of `{ id, changes, rowData? }` (same shape as `onRowsUpdate`).
   *
   * @param {object[]} rows Row update payloads (one or more).
   * @returns {Promise<void>}
   * @throws {Error} When any payload omits `id` or `id` is `null`.
   */
  async updateRows(rows) {
    if (!isFunction(this.#getOnRowsUpdate()) || !Array.isArray(rows) || rows.length === 0) {
      return;
    }

    rows.forEach((p) => {
      if (isMissingRowId(p.id)) {
        throwWithCause(DATA_PROVIDER_ERROR_UPDATE_ROWS_MISSING_ID);
      }
    });

    const rowPayloads = buildManualUpdateRowPayloads(this.hot, this.#getRowIdOption(), rows);

    return this.#enqueueMutation(() => runManualUpdateRowsMutation(this.hot, {
      getRowIdOption: () => this.#getRowIdOption(),
      commitRowsUpdate: payloads => this.#commitRowsUpdate(payloads),
    }, rowPayloads));
  }

  /**
   * Disables the plugin, aborts fetch, resets query state.
   * Hook listeners registered with `addHook` are removed by `super.disablePlugin()` via `clearHooks()`.
   */
  disablePlugin() {
    this.#abortController?.abort();
    this.#abortController = null;
    this.#fetchInFlightCount = 0;
    this.#inFlightQueryParameters = null;
    this.#queryParameters = { ...INITIAL_QUERY_PARAMETERS };
    this.#lastLoadedQueryParameters = { ...INITIAL_QUERY_PARAMETERS };
    this.#totalRows = 0;
    this.#savedConditionsForLoad = [];
    this.#lastKnownGoodFilterConditions = [];

    super.disablePlugin();

    const c = this.#getConfig();

    if (!c || !this.#isCompleteConfig(c)) {
      this.#incompatibleSettingWarned.clear();
    }

    this.#publishDataProviderLoadingChange(false);
  }

  /**
   * Logs a warning and disables plugins that conflict with server-backed data.
   *
   * @private
   * @returns {void}
   */
  #warnAndDisableIncompatiblePlugins() {
    if (!this.isEnabled()) {
      return;
    }

    disablePluginsIncompatibleWithDataProvider(
      this.hot,
      this.hot.getSettings(),
      this.#incompatibleSettingWarned
    );
  }

  /**
   * Destroys the plugin.
   */
  destroy() {
    this.#abortController?.abort();
    this.#abortController = null;
    this.#fetchInFlightCount = 0;
    this.#inFlightQueryParameters = null;
    this.#lastLoadedQueryParameters = { ...INITIAL_QUERY_PARAMETERS };
    this.#publishDataProviderLoadingChange(false);

    super.destroy();
  }
}
