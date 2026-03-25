import { isFunction } from '../../helpers/function';
import { error as logError, warn } from '../../helpers/console';
import { throwWithCause } from '../../helpers/errors';
import { BasePlugin } from '../base';
import {
  ABORT_REASON_MESSAGE,
  DATA_PROVIDER_BATCH_UPDATE_SOURCES,
  DATA_PROVIDER_ERROR_REMOVE_ROWS_MISSING_ID,
  DATA_PROVIDER_ERROR_UPDATE_ROWS_MISSING_ID,
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
} from './query/crud';
import {
  applyFiltersFromFiltersPluginToQueryParameters,
  cloneDataProviderFiltersPayload,
  conditionsStackToFiltersPayload,
  filtersPayloadToConditionsStack,
} from './query/filtering';
import {
  applyPaginationToQueryFromPlugin,
  getPagedRowHeaderIndex,
  handleAfterPageChangeExternalPagination,
  handleAfterPageSizeChangeExternalPagination,
} from './query/pagination';
import {
  applyColumnSortToQueryFromPlugin,
  handleBeforeColumnSortForServer,
  normalizeSortInFetchParams,
  sortingPayloadToSort,
} from './query/sorting';
import {
  getDataProviderRequestErrorDescription,
  getIncompleteDataProviderWarningMessage,
  isCompleteDataProviderConfig,
} from './utils';

/**
 * Sort descriptor in query parameters (`fetchRows` and DataProvider getters).
 *
 * @typedef {object} DataProviderSortDescriptor
 * @property {string} prop Column data key.
 * @property {'asc'|'desc'} order Sort direction.
 */

/**
 * Server filter column (`prop` replaces physical column index). Same shape as in `types/plugins/dataProvider/dataProvider.d.ts`.
 *
 * @typedef {object} DataProviderFilterColumn
 * @property {string} prop Column data key.
 * @property {'conjunction'|'disjunction'|'disjunctionWithExtraCondition'} operation Filters stack operation (same values as [[Filters#exportConditions]]).
 * @property {Array<{ name?: string, args: Array<*> }>} conditions Filter conditions (same shape as Filters `exportConditions`).
 */

/**
 * Query parameters passed to `fetchRows` and exposed by DataProvider.
 *
 * @typedef {object} DataProviderQueryParameters
 * @property {number} page 1-based page index.
 * @property {number} pageSize Rows per page.
 * @property {DataProviderSortDescriptor|null} sort Primary sort or null.
 * @property {Array<DataProviderFilterColumn>|null} filters Server-side filters or null.
 */

export {
  DATA_PROVIDER_BATCH_UPDATE_SOURCES,
  DEFAULT_PAGE_SIZE,
  PLUGIN_KEY,
  PLUGIN_PRIORITY,
} from './constants';

/**
 * @plugin DataProvider
 * @class DataProvider
 *
 * @description
 * Server-backed data: `dataProvider` must be an object with `rowId`, `fetchRows`, `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove`.
 * Valid edits apply to the grid immediately; if `onRowsUpdate` fails, if validation fails later, or if `beforeRowsMutation` cancels, those cells revert to their previous values.
 * When the [[Options#dialog]] plugin is enabled, failed `fetchRows`, `onRowsCreate`, `onRowsUpdate`, or `onRowsRemove` requests (including a refetch after a successful mutation) open an alert dialog with the error message.
 *
 * With a complete `dataProvider` configuration, `trimRows`, `manualRowMove`, `manualColumnMove`, and `multiColumnSorting` do not enable. Handsontable logs a console warning for each of those options you still set.
 * If `dataProvider` is present but not a complete configuration object, Handsontable logs one console warning per episode (until the configuration becomes valid); the plugin stays disabled.
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
   * @type {DataProviderQueryParameters}
   */
  #queryParameters = { ...INITIAL_QUERY_PARAMETERS };
  /**
   * Aborts in-flight fetch when superseded or on disable/destroy.
   *
   * @type {AbortController|null}
   */
  #abortController = null;
  /**
   * Serializes create/update/remove mutations so they run one after another.
   *
   * @type {{ tail: Promise<void> }}
   */
  #mutationQueue = { tail: Promise.resolve() };

  /**
   * Dedupes incomplete-`dataProvider` warnings until the setting is valid or removed from updates.
   *
   * @type {boolean}
   */
  #incompleteDataProviderWarningIssued = false;

  /**
   * Raw `dataProvider` setting (config object only).
   *
   * @returns {object|undefined}
   */
  #getConfig() {
    const c = this.hot.getSettings()[PLUGIN_KEY];

    return c && typeof c === 'object' ? c : undefined;
  }

  /**
   * @param {object} c Config object.
   * @returns {boolean}
   */
  #isCompleteConfig(c) {
    return isCompleteDataProviderConfig(c);
  }

  /**
   * `rowId` from config (string path or function).
   *
   * @returns {string|Function|undefined|null}
   */
  #getRowIdOption() {
    const c = this.#getConfig();

    return c ? c.rowId : undefined;
  }

  /**
   * @returns {Function|undefined}
   */
  #getFetchFn() {
    const c = this.#getConfig();

    return c && isFunction(c.fetchRows) ? c.fetchRows : undefined;
  }

  /**
   * @returns {Function|undefined}
   */
  #getOnRowsCreate() {
    const c = this.#getConfig();

    return c && isFunction(c.onRowsCreate) ? c.onRowsCreate : undefined;
  }

  /**
   * @returns {Function|undefined}
   */
  #getOnRowsUpdate() {
    const c = this.#getConfig();

    return c && isFunction(c.onRowsUpdate) ? c.onRowsUpdate : undefined;
  }

  /**
   * @returns {Function|undefined}
   */
  #getOnRowsRemove() {
    const c = this.#getConfig();

    return c && isFunction(c.onRowsRemove) ? c.onRowsRemove : undefined;
  }

  /**
   * @param {DataProviderQueryParameters} p Query parameters object.
   * @returns {DataProviderQueryParameters} Snapshot safe for comparisons and external use (`sort` and `filters` cloned when non-null).
   */
  #snapshotQueryParameters(p) {
    return {
      page: p.page,
      pageSize: p.pageSize,
      sort: p.sort === null ? null : { ...p.sort },
      filters: cloneDataProviderFiltersPayload(p.filters),
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
   * @inheritdoc
   */
  init() {
    super.init();
    this.#applyIncompleteDataProviderWarning(this.hot.getSettings()[PLUGIN_KEY]);
  }

  /**
   * @inheritdoc
   * @param {object} newSettings Settings passed to `updateSettings`.
   */
  onUpdateSettings(newSettings) {
    if (newSettings && Object.prototype.hasOwnProperty.call(newSettings, PLUGIN_KEY)) {
      this.#applyIncompleteDataProviderWarning(newSettings[PLUGIN_KEY]);
    }

    super.onUpdateSettings(newSettings);
  }

  /**
   * Logs a single warning per invalid `dataProvider` stretch; resets when the value becomes valid or cleared.
   *
   * @param {*} value Raw `dataProvider` setting value.
   * @returns {void}
   */
  #applyIncompleteDataProviderWarning(value) {
    const message = getIncompleteDataProviderWarningMessage(value);

    if (message === null) {
      this.#incompleteDataProviderWarningIssued = false;

      return;
    }

    if (this.#incompleteDataProviderWarningIssued) {
      return;
    }

    warn(message);

    this.#incompleteDataProviderWarningIssued = true;
  }

  /**
   * Fills `#queryParameters` from Pagination, ColumnSorting, and (when `fetchRows` exists) Filters so `fetchRows`
   * matches plugin UI state after enable or before a server-driven refetch.
   *
   * @returns {void}
   */
  #applyQueryParametersFromPlugins() {
    applyPaginationToQueryFromPlugin(this.hot, this.#queryParameters);
    applyColumnSortToQueryFromPlugin(this.hot, this.#queryParameters);
    applyFiltersFromFiltersPluginToQueryParameters(
      this.hot,
      this.#queryParameters,
      () => this.#getFetchFn()
    );
  }

  /**
   * Registers DataProvider hooks (removed on disable via `BasePlugin.clearHooks`).
   *
   * @returns {void}
   */
  #registerHooks() {
    const specs = [
      ['afterInit', this.#onAfterInit],
      ['modifyRowHeader', this.#onModifyRowHeader],
      ['beforeColumnSort', this.#onBeforeColumnSort],
      ['beforeUndoStackChange', this.#onBeforeUndoStackChange],
      ['afterChange', this.#onAfterChangeForServerUpdate],
      ['beforeAlter', this.#onBeforeAlter],
      ['afterPageChange', this.#onAfterPageChangeExternalPagination],
      ['afterPageSizeChange', this.#onAfterPageSizeChangeExternalPagination],
      ['beforeFilter', this.#onBeforeFilter],
    ];

    specs.forEach((spec) => {
      const [name, handler, order] = spec;

      this.addHook(name, handler, order);
    });
  }

  /**
   * Aborts an in-flight `fetchRows` call so a new request can start.
   *
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
   * @param {object} overrides Partial query overrides (subset of [[DataProviderQueryParameters]] keys).
   * @returns {DataProviderQueryParameters} Query parameters object for `fetchRows`.
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
   * @returns {AbortController}
   */
  #createFetchAbortController() {
    this.#abortInFlightFetch();

    const controller = new AbortController();

    this.#abortController = controller;

    return controller;
  }

  /**
   * @param {object} params Query parameters for the aborted `fetchRows` call.
   * @param {Error|undefined} reason `AbortError` (or subclass) when `fetchRows` rejected; omit the argument when the promise settled after superseding.
   * @returns {void}
   */
  #runAfterDataProviderFetchAbort(params, reason) {
    const queryParameters = this.#snapshotQueryParameters(params);

    if (typeof reason === 'undefined') {
      this.hot.runHooks('afterDataProviderFetchAbort', queryParameters);
    } else {
      this.hot.runHooks('afterDataProviderFetchAbort', queryParameters, reason);
    }
  }

  /**
   * Aborts any pending `fetchRows` and clears the controller.
   *
   * @returns {void}
   */
  #resetAbortController() {
    this.#abortController?.abort();
    this.#abortController = null;
  }

  /**
   * Enables the plugin, syncs query parameters from Pagination, ColumnSorting, and Filters, and registers hooks.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.#applyQueryParametersFromPlugins();
    this.#registerHooks();

    super.enablePlugin();
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
   * @returns {void}
   */
  #onAfterInit = () => {
    if (this.isEnabled()) {
      this.fetchData();
    }
  };

  /**
   * Loads the requested page when Pagination runs in external paged mode.
   * Skips when `#queryParameters` already matches the Pagination UI (e.g. right after a successful fetch).
   *
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
   * Skips when `#queryParameters` already match (e.g. duplicate `afterPageSizeChange` from Pagination sync).
   *
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
   * Intercepts filter action: applies server-side filters and refetches; returns false so Filters skip client-side trimming.
   *
   * @param {Array} conditionsStack Exported filter conditions (column = physical index).
   * @returns {boolean} False to signal that filtering is handled server-side.
   */
  #onBeforeFilter = (conditionsStack) => {
    if (!this.isEnabled()) {
      return;
    }

    if (!isFunction(this.#getFetchFn())) {
      return false;
    }

    const filtersForProvider = conditionsStackToFiltersPayload(this.hot, conditionsStack);

    this.#queryParameters.filters = filtersForProvider ?? null;
    this.#queryParameters.page = 1;

    this.fetchData();

    return false;
  };

  /**
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
      applyQueryParametersFromPlugins: () => this.#applyQueryParametersFromPlugins(),
      fetchData: overrides => this.fetchData(overrides),
    },
    currentSortConfig,
    destinationSortConfigs,
    sortPossible
  );

  /**
   * @param {number} visualRowIndex Visual row index.
   * @returns {number} Global row index for headers.
   */
  #onModifyRowHeader = visualRowIndex => getPagedRowHeaderIndex(this.#queryParameters, visualRowIndex);

  /**
   * Skips the local undo stack for edits that batch to `onRowsUpdate` (same sources as `shouldIgnoreAfterChangeForServerUpdate`).
   *
   * @param {Array} doneActionsCopy Snapshot of the undo stack before the new action.
   * @param {string} [source] Change source for the action being pushed onto the stack.
   * @returns {boolean|void} Return `false` to block stacking (see [[Hooks#beforeUndoStackChange]]).
   */
  #onBeforeUndoStackChange = (doneActionsCopy, source) => {
    if (!isFunction(this.#getOnRowsUpdate())) {
      return;
    }

    if (!DATA_PROVIDER_BATCH_UPDATE_SOURCES.has(source)) {
      return;
    }

    return false;
  };

  /**
   * After a valid edit applies locally, queues `onRowsUpdate`. On failure, cells revert to previous values.
   *
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
   * @param {function(): Promise<void>} fn Async work for one mutation.
   * @returns {Promise<void>}
   */
  #enqueueMutation(fn) {
    return enqueueMutation(this.#mutationQueue, fn);
  }

  /**
   * Shows an alert in the [[Options#dialog]] plugin when it is enabled.
   *
   * @param {'fetch'|'create'|'update'|'remove'} kind Which request failed.
   * @param {Error|*} err Rejection reason from the user callback or `fetchRows`.
   * @returns {void}
   */
  #showDataProviderRequestErrorDialog(kind, err) {
    const dialogPlugin = this.hot.getPlugin('dialog');

    if (!dialogPlugin?.enabled) {
      return;
    }

    const titles = {
      fetch: 'Could not load data',
      create: 'Could not create rows',
      update: 'Could not update rows',
      remove: 'Could not remove rows',
    };
    const title = titles[kind] ?? 'Request failed';
    const description = getDataProviderRequestErrorDescription(err);

    dialogPlugin.show({
      template: {
        type: 'confirm',
        title,
        description,
        buttons: [
          {
            text: 'Close',
            type: 'secondary',
            callback: () => {
              dialogPlugin.hide();
            },
          },
        ],
      },
      closable: true,
    });
  }

  /**
   * Calls `onRowsUpdate`, success/error hooks, then re-fetches or re-renders.
   *
   * @param {object[]} rowPayloads Per-row `{ id, changes, rowData }` payloads.
   * @param {object} [options] Optional flags.
   * @param {function(): void} [options.revertOptimistic] Restores previous cell values when the request fails.
   * @returns {Promise<void>}
   */
  #commitRowsUpdate(rowPayloads, options = {}) {
    return commitRowsUpdateCrud(this.hot, {
      getOnRowsUpdate: () => this.#getOnRowsUpdate(),
      fetchData: () => this.fetchData({ skipLoading: true }),
      logError,
      onRequestFailed: (kind, err) => this.#showDataProviderRequestErrorDialog(kind, err),
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
   * Pass `{ skipLoading: true }` to mark internal refetches (for example sort or CRUD); [[Hooks#beforeDataProviderFetch]] receives it, and it is not passed to `fetchRows`.
   * Numeric `page` is clamped to at least 1.
   * @returns {Promise<{ rows: Array<*>, totalRows: number }|null>}
   *
   * @fires Hooks#afterDataProviderFetch when data loads.
   * @fires Hooks#afterDataProviderFetchError when `fetchRows` throws a non-abort error.
   * @fires Hooks#afterDataProviderFetchAbort when the request is superseded, aborted, or ends with `AbortError`.
   */
  async fetchData(overrides = {}) {
    const fetchFn = this.#getFetchFn();

    if (!isFunction(fetchFn)) {
      this.hot.render();

      return null;
    }

    const params = this.#mergeAndNormalizeFetchParams(overrides);
    const controller = this.#createFetchAbortController();
    const { signal } = controller;

    if (this.hot.runHooks('beforeDataProviderFetch', params) === false) {
      this.#abortController = null;
      this.hot.render();

      return null;
    }

    const fetchRowsParams = this.#snapshotQueryParameters(params);

    try {
      const result = await fetchFn(fetchRowsParams, { signal });

      if (signal.aborted) {
        this.#runAfterDataProviderFetchAbort(params, undefined);

        return null;
      }

      const rows = Array.isArray(result?.rows) ? result.rows : [];
      const totalRows = typeof result?.totalRows === 'number' && result.totalRows >= 0
        ? result.totalRows
        : rows.length;

      const persistedParams = this.#snapshotQueryParameters(params);

      this.#queryParameters = persistedParams;

      this.hot.loadData(rows, PLUGIN_KEY);

      const columnSortConfig = sortingPayloadToSort(this.hot, persistedParams.sort ?? null);
      const filtersConditionsStack = filtersPayloadToConditionsStack(
        this.hot,
        persistedParams.filters ?? null
      );

      this.hot.runHooks(
        'afterDataProviderFetch',
        {
          ...result,
          rows,
          totalRows,
          queryParameters: persistedParams,
          columnSortConfig,
          filtersConditionsStack,
        }
      );

      this.hot.render();

      return { rows, totalRows };
    } catch (err) {
      if (signal.aborted || err?.name === 'AbortError') {
        this.#runAfterDataProviderFetchAbort(params, err);

        return null;
      }

      this.hot.runHooks('afterDataProviderFetchError', err, this.#snapshotQueryParameters(params));
      this.#showDataProviderRequestErrorDialog('fetch', err);

      throw err;
    } finally {
      if (this.#abortController === controller) {
        this.#abortController = null;
      }
    }
  }

  /**
   * @param {number} page 1-based page index (values below 1 are treated as 1 via `fetchData`).
   * @returns {Promise<void>}
   */
  async #goToPage(page) {
    await this.fetchData({ page });
  }

  /**
   * @param {number} pageSize New page size.
   * @returns {Promise<void>}
   */
  async #setPageSize(pageSize) {
    const ps = typeof pageSize === 'number' && pageSize >= 1 ? pageSize : DEFAULT_PAGE_SIZE;

    await this.fetchData({ pageSize: ps, page: 1 });
  }

  /**
   * @returns {DataProviderQueryParameters} Copy of current query parameters (`sort` and `filters` are cloned when non-null).
   */
  getQueryParameters() {
    return this.#snapshotQueryParameters(this.#queryParameters);
  }

  /**
   * Queues create/remove (or similar) server calls with before/after mutation hooks.
   *
   * @param {string} operation `'create'` or `'remove'`.
   * @param {object} payload Hook payload (`{ rowsCreate }` or `{ rowsRemove }`).
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
        onRequestFailed: (kind, err) => this.#showDataProviderRequestErrorDialog(kind, err),
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
      return Promise.resolve();
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
      () => this.fetchData({ skipLoading: true })
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
      return Promise.resolve();
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
      const result = await this.fetchData({ skipLoading: true });

      if (result?.rows.length === 0 && currentPage > 1) {
        // Avoid Pagination `setPage` here: it would fire `afterPageChange` and start another fetch path. One extra
        // `fetchData` is enough; Pagination updates from [[Hooks#afterDataProviderFetch]] on that result.
        await this.fetchData({ page: currentPage - 1, skipLoading: true });
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
    this.#resetAbortController();
    this.#queryParameters = { ...INITIAL_QUERY_PARAMETERS };

    super.disablePlugin();

    this.hot.render();
  }

  /**
   * Destroys the plugin.
   */
  destroy() {
    this.#resetAbortController();

    super.destroy();
  }
}
