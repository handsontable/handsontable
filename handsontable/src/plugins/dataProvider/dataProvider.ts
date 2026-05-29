import { isFunction } from '../../helpers/function';
import { error as logError } from '../../helpers/console';
import { throwWithCause } from '../../helpers/errors';
import * as I18nC from '../../i18n/constants';
import { BasePlugin } from '../base';
import type { HotInstance } from '../../core/types';
import {
  PLUGIN_KEY,
  PLUGIN_PRIORITY,
  DEFAULT_SETTINGS,
  SETTINGS_VALIDATORS,
  ABORT_REASON_MESSAGE,
  DATA_PROVIDER_BATCH_UPDATE_SOURCES,
  DATA_PROVIDER_ERROR_REMOVE_ROWS_MISSING_ID,
  DATA_PROVIDER_ERROR_UPDATE_ROWS_MISSING_ID,
  INITIAL_QUERY_PARAMETERS,
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
  filtersPayloadToConditionsStack,
  handleBeforeFilterForServer,
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
  clampDataProviderPageToTotalRows,
  getDataProviderRequestErrorDescription,
  isCompleteDataProviderConfig,
} from './utils';
import { registerConflict } from '../base/conflictRegistry';
import type { NotificationMessageOptions } from '../notification/notification';

registerConflict('dataProvider', [
  'manualRowMove',
  'manualColumnMove',
  'trimRows',
  'multiColumnSorting',
]);

/**
 * Sort descriptor in query parameters (`fetchRows` and DataProvider getters).
 *
 * @typedef {object} DataProviderSortDescriptor
 * @property {string} prop Column data key.
 * @property {'asc'|'desc'} order Sort direction.
 */

/**
 * Single filter condition entry (same shape as Filters `exportConditions` items).
 *
 * @typedef {object} DataProviderFilterCondition
 * @property {string} [name] Condition name (omitted for some stack entries).
 * @property {Array<*>} args Condition arguments.
 */

/**
 * Server filter column (`prop` replaces physical column index). Same shape as in `types/plugins/dataProvider/dataProvider.d.ts`.
 *
 * @typedef {object} DataProviderFilterColumn
 * @property {string} prop Column data key.
 * @property {'conjunction'|'disjunction'|'disjunctionWithExtraCondition'} operation Filters stack operation (same values as [[Filters#exportConditions]]).
 * @property {Array<DataProviderFilterCondition>} conditions Filter conditions (same shape as Filters `exportConditions`).
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

export interface DataProviderSortDescriptor {
  prop: string;
  order: 'asc' | 'desc';
}

export interface DataProviderFilterCondition {
  name?: string;
  args: unknown[];
}

export interface DataProviderFilterColumn {
  prop: string;
  operation: string;
  conditions: DataProviderFilterCondition[];
}

export interface DataProviderQueryParameters {
  page: number;
  pageSize: number;
  sort: DataProviderSortDescriptor | null;
  filters: DataProviderFilterColumn[] | null;
}

export interface DataProviderBeforeFetchParameters extends DataProviderQueryParameters {
  skipLoading?: boolean;
}

export type DataProviderFetchDataOverrides = Partial<DataProviderQueryParameters> & { skipLoading?: boolean };

export interface DataProviderFetchResult {
  rows: unknown[];
  totalRows: number;
  queryParameters?: DataProviderQueryParameters;
  columnSortConfig?: unknown[];
  filtersConditionsStack?: unknown[];
}

export interface DataProviderFetchOptions {
  signal: AbortSignal;
}

/** @deprecated Use DataProviderFetchOptions */
export type DataProviderOptions = DataProviderFetchOptions;

export interface RowsCreatePayload {
  index?: number;
  amount?: number;
  data?: unknown[];
  position?: string;
  referenceRowId?: unknown;
  rowsAmount?: number;
}

export interface RowUpdatePayload {
  rowId: unknown;
  data: Record<string, unknown>;
}

export interface RowMutationCreatePayload {
  rowsCreate: RowsCreatePayload;
}

export interface RowMutationUpdatePayload {
  rowsUpdate: RowUpdatePayload[];
}

export interface RowMutationRemovePayload {
  rowsRemove: unknown[];
}

export type RowMutationPayload = RowMutationCreatePayload | RowMutationUpdatePayload | RowMutationRemovePayload;

export interface DataProviderConfig {
  rowId: string;
  fetchRows: (queryParameters: DataProviderQueryParameters, options: DataProviderFetchOptions) =>
    Promise<DataProviderFetchResult>;
  onRowCreate?: (payload: RowsCreatePayload) => Promise<unknown[]>;
  onRowsCreate?: (payload: RowsCreatePayload) => Promise<unknown[]>;
  onRowsUpdate?: (payload: RowUpdatePayload[]) => Promise<void>;
  onRowsRemove?: (payload: unknown[]) => Promise<void>;
}

export {
  PLUGIN_KEY,
  PLUGIN_PRIORITY,
} from './constants';

/**
 * @plugin DataProvider
 * @class DataProvider
 *
 * @description
 * A truthy [[Options#dataProvider]] value enables this plugin. Each key (`rowId`, `fetchRows`, `onRowsCreate`, `onRowsUpdate`, `onRowsRemove`) is validated like other plugin options.
 * When the object is a **complete** server-backed configuration (all of those keys present and valid), Handsontable loads rows via `fetchRows`, runs mutations through the callbacks, and the [[Hooks#hasExternalDataSource]] hook returns `true` so plugins such as Filters and Pagination can treat the grid as server-driven.
 * If required callbacks are missing or invalid, `fetchRows` and the affected mutation paths no-op until the configuration is valid.
 * Valid edits apply to the grid immediately; if `onRowsUpdate` fails, if validation fails later, or if `beforeRowsMutation` cancels, those cells revert to their previous values.
 * When the [[Options#notification]] plugin is enabled, failed `fetchRows`, `onRowsCreate`, `onRowsUpdate`, or `onRowsRemove` requests (including a refetch after a successful mutation) show an error notification toast with the same translated titles and description text as before.
 *
 * If `trimRows`, `manualRowMove`, `manualColumnMove`, or `multiColumnSorting` is enabled, the DataProvider plugin does not enable. Handsontable logs a console warning when you still set a complete `dataProvider` configuration.
 * Use [[Options#columnSorting]] for server-driven sort (single column). Query `sort` uses `prop` (column data key).
 */
export class DataProvider extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get SETTING_KEYS() {
    return [PLUGIN_KEY];
  }

  static get DEFAULT_SETTINGS() {
    return DEFAULT_SETTINGS;
  }

  static get SETTINGS_VALIDATORS() {
    return SETTINGS_VALIDATORS;
  }

  /**
   * Last request params passed to `fetchRows` (`page`, `pageSize`, `sort`, `filters`).
   * Same shape as `DataProviderQueryParameters` in `types/plugins/dataProvider/dataProvider.d.ts`.
   *
   * @type {DataProviderQueryParameters}
   */
  #queryParameters: DataProviderQueryParameters = { ...INITIAL_QUERY_PARAMETERS };
  /**
   * Aborts in-flight fetch when superseded or on disable/destroy.
   *
   * @type {AbortController|null}
   */
  #abortController: AbortController | null = null;
  /**
   * Serializes create/update/remove mutations so they run one after another.
   *
   * @type {{ tail: Promise<void> }}
   */
  readonly #mutationQueue: { tail: Promise<void> } = { tail: Promise.resolve() };

  /**
   * @param {object} hotInstance Handsontable instance.
   */
  constructor(hotInstance: HotInstance) {
    super(hotInstance);

    // Before `enablePlugin()` runs (`afterPluginsInitialized`), core may call `runHooks('hasExternalDataSource')`
    // (for example during `updateSettings`). `disablePlugin()` clears all `addHook` listeners, so `enablePlugin()`
    // registers this hook again.
    this.addHook('hasExternalDataSource', this.#onHasExternalDataSource);
  }

  /**
   * Check if the plugin is enabled in the handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin, syncs query parameters from Pagination, ColumnSorting, and Filters, and registers hooks.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    this.#applyQueryParametersFromPlugins();

    this.addHook('hasExternalDataSource', this.#onHasExternalDataSource);
    this.addHook('afterInit', this.#onAfterInit);
    this.addHook('modifyRowHeader', this.#onModifyRowHeader);
    this.addHook('beforeColumnSort', this.#onBeforeColumnSort);
    this.addHook('beforeUndoStackChange', this.#onBeforeUndoStackChange);
    this.addHook('afterChange', this.#onAfterChangeForServerUpdate);
    this.addHook('beforeAlter', this.#onBeforeAlter);
    this.addHook('afterPageChange', this.#onAfterPageChangeExternalPagination);
    this.addHook('afterPageSizeChange', this.#onAfterPageSizeChangeExternalPagination);
    this.addHook('beforeFilter', this.#onBeforeFilter);

    super.enablePlugin();
  }

  /**
   * Re-applies settings and refetches when the instance is already initialized.
   */
  updatePlugin(): void {
    this.disablePlugin();
    this.enablePlugin();

    if (this.hot.view) {
      this.fetchData();
    }

    super.updatePlugin();
  }

  /**
   * Disables the plugin, aborts fetch, resets query state.
   * Hook listeners registered with `addHook` are removed by `super.disablePlugin()` via `clearHooks()`.
   * The constructor registers [[Hooks#hasExternalDataSource]] for the period before the first `enablePlugin()`;
   * `enablePlugin()` registers it again so it survives each `updatePlugin()` cycle.
   */
  disablePlugin(): void {
    this.#resetAbortController();
    this.#queryParameters = { ...INITIAL_QUERY_PARAMETERS };

    super.disablePlugin();
  }

  /**
   * @returns {DataProviderQueryParameters} Copy of current query parameters (`sort` and `filters` are cloned when non-null).
   */
  getQueryParameters(): DataProviderQueryParameters {
    return this.#snapshotQueryParameters(this.#queryParameters);
  }

  /**
   * @param {number} visualRow Visual row index.
   * @returns {*} Row id from `rowId` option, or undefined.
   */
  getRowId(visualRow: number): unknown {
    return getRowIdByVisualRow(this.hot, this.#getRowIdOption(), visualRow);
  }

  /**
   * Fetches rows from `fetchRows` with current or overridden query parameters.
   *
   * @param {object} [overrides] Partial query overrides (e.g. `{ page: 2 }`, `{ pageSize: 20, page: 1 }`, `{ sort }`, `{ filters }`).
   * Pass `{ skipLoading: true }` to mark internal refetches (for example sort or CRUD); [[Hooks#beforeDataProviderFetch]] receives it, and it is not passed to `fetchRows`.
   * Numeric `page` is clamped to at least 1.
   * When the response `totalRows` implies fewer pages than the requested `page`, fetches again at the last valid page without applying the out-of-range result (avoids redundant `afterPageChange` loads and aborted duplicate requests after row removal on the last page).
   * @returns {Promise<{ rows: Array<*>, totalRows: number }|null>}
   *
   * @fires Hooks#afterDataProviderFetch when data loads.
   * @fires Hooks#afterDataProviderFetchError when `fetchRows` throws a non-abort error.
   * @fires Hooks#afterDataProviderFetchAbort when the request is superseded, aborted, or ends with `AbortError`.
   */
  async fetchData(
    overrides: DataProviderFetchDataOverrides = {}
  ): Promise<{ rows: unknown[]; totalRows: number } | null> {
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
      const clampedPage = clampDataProviderPageToTotalRows(
        persistedParams.page,
        persistedParams.pageSize,
        totalRows
      );

      if (clampedPage !== persistedParams.page) {
        return this.fetchData({ ...overrides, page: clampedPage, skipLoading: overrides.skipLoading });
      }

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
      if (signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
        this.#runAfterDataProviderFetchAbort(params, err);

        return null;
      }

      this.hot.runHooks('afterDataProviderFetchError', err, this.#snapshotQueryParameters(params));
      this.#showDataProviderRequestErrorNotification('fetch', err);

      throw err;
    } finally {
      if (this.#abortController === controller) {
        this.#abortController = null;
      }
    }
  }

  /**
   * Server create via `onRowsCreate`. Use `rowsAmount` to insert more than one row in one call.
   *
   * @param {object} [options] `position`, `referenceRowId`, `rowsAmount`.
   * @returns {Promise<void>}
   */
  async createRows(options: { position?: string; referenceRowId?: unknown; rowsAmount?: number } = {}): Promise<void> {
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
      () => Promise.resolve(onRowsCreate(rowsCreatePayload)),
      async() => {
        await this.fetchData({ skipLoading: true });
      }
    );
  }

  /**
   * Server remove via `onRowsRemove`. Pass one row id or an array of ids.
   *
   * After a successful `onRowsRemove`, refetches from the server. When the remove clears every row currently
   * loaded (typical when emptying the last page) and the current page is greater than 1, loads the previous page
   * in one request. Otherwise refetches the current page, then loads the previous page when that response is empty
   * and the current page is still greater than 1.
   *
   * @param {Array<*>|*} rowIds Row id or ids.
   * @returns {Promise<void>}
   * @throws {Error} When any id is `null` or `undefined`.
   */
  async removeRows(rowIds: unknown[] | unknown): Promise<void> {
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

    return this.#queueCrud('remove', payload, () => onRowsRemove(ids), async() => {
      const pageBeforeFetch = this.#queryParameters.page;
      const rowsLoaded = this.hot.countRows();
      const removesEveryLoadedRow = ids.length >= rowsLoaded && rowsLoaded >= 1;

      if (removesEveryLoadedRow && pageBeforeFetch > 1) {
        await this.fetchData({ page: pageBeforeFetch - 1, skipLoading: true });

        return;
      }

      const result = await this.fetchData({ skipLoading: true });

      if (result?.rows.length === 0 && pageBeforeFetch > 1) {
        await this.fetchData({ page: pageBeforeFetch - 1, skipLoading: true });
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
  async updateRows(
    rows: Array<{ id?: unknown; changes?: Record<string, unknown>; rowData?: Record<string, unknown> }>
  ): Promise<void> {
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
   * Raw `dataProvider` setting (config object only).
   *
   * @returns {object|undefined}
   */
  #getConfig(): DataProviderConfig | undefined {
    const c = this.hot.getSettings()[PLUGIN_KEY];

    return c && typeof c === 'object' ? c as DataProviderConfig : undefined;
  }

  /**
   * `rowId` from config (string path or function).
   *
   * @returns {string|Function|undefined|null}
   */
  #getRowIdOption(): DataProviderConfig['rowId'] | undefined {
    const c = this.#getConfig();

    return c ? c.rowId : undefined;
  }

  /**
   * @returns {Function|undefined}
   */
  #getFetchFn(): DataProviderConfig['fetchRows'] | undefined {
    const c = this.#getConfig();

    return c && isFunction(c.fetchRows) ? c.fetchRows as DataProviderConfig['fetchRows'] : undefined;
  }

  /**
   * @returns {Function|undefined}
   */
  #getOnRowsCreate(): DataProviderConfig['onRowsCreate'] {
    const c = this.#getConfig();

    return c && isFunction(c.onRowsCreate) ? c.onRowsCreate as DataProviderConfig['onRowsCreate'] : undefined;
  }

  /**
   * @returns {Function|undefined}
   */
  #getOnRowsUpdate(): ((payload: object[]) => Promise<void>) | undefined {
    const c = this.#getConfig();

    return c && isFunction(c.onRowsUpdate)
      ? c.onRowsUpdate as unknown as (payload: object[]) => Promise<void>
      : undefined;
  }

  /**
   * @returns {Function|undefined}
   */
  #getOnRowsRemove(): DataProviderConfig['onRowsRemove'] {
    const c = this.#getConfig();

    return c && isFunction(c.onRowsRemove) ? c.onRowsRemove as DataProviderConfig['onRowsRemove'] : undefined;
  }

  /**
   * @param {DataProviderQueryParameters} p Query parameters object.
   * @returns {DataProviderQueryParameters} Snapshot safe for comparisons and external use (`sort` and `filters` cloned when non-null).
   */
  #snapshotQueryParameters(p: DataProviderQueryParameters): DataProviderQueryParameters {
    return {
      page: p.page,
      pageSize: p.pageSize,
      sort: p.sort === null ? null : { ...p.sort },
      filters: cloneDataProviderFiltersPayload(p.filters),
    };
  }

  /**
   * Fills `#queryParameters` from Pagination, ColumnSorting, and (when `fetchRows` exists) Filters so `fetchRows`
   * matches plugin UI state after enable or before a server-driven refetch.
   *
   * @returns {void}
   */
  #applyQueryParametersFromPlugins(): void {
    applyPaginationToQueryFromPlugin(this.hot, this.#queryParameters);
    applyColumnSortToQueryFromPlugin(this.hot, this.#queryParameters);
    applyFiltersFromFiltersPluginToQueryParameters(
      this.hot,
      this.#queryParameters,
      () => this.#getFetchFn()
    );
  }

  /**
   * Aborts an in-flight `fetchRows` call so a new request can start.
   *
   * @returns {void}
   */
  #abortInFlightFetch(): void {
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
  #mergeAndNormalizeFetchParams(overrides: DataProviderFetchDataOverrides): DataProviderBeforeFetchParameters {
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
  #createFetchAbortController(): AbortController {
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
  #runAfterDataProviderFetchAbort(params: DataProviderBeforeFetchParameters, reason: unknown): void {
    const queryParameters = this.#snapshotQueryParameters(params);

    this.hot.runHooks('afterDataProviderFetchAbort', queryParameters, reason);
  }

  /**
   * Aborts any pending `fetchRows` and clears the controller.
   *
   * @returns {void}
   */
  #resetAbortController(): void {
    this.#abortController?.abort();
    this.#abortController = null;
  }

  /**
   * Appends a mutation onto the queue so concurrent CRUD runs sequentially.
   *
   * @param {function(): Promise<void>} fn Async work for one mutation.
   * @returns {Promise<void>}
   */
  #enqueueMutation(fn: () => Promise<void> | void): Promise<void> {
    return enqueueMutation(this.#mutationQueue, fn);
  }

  /**
   * Shows an error toast in the [[Options#notification]] plugin when it is enabled.
   * For `fetch` failures only, the toast includes a primary **Refetch** action (`duration: 0` until dismissed) that hides the toast and calls [[DataProvider#fetchData]] again.
   *
   * @param {'fetch'|'create'|'update'|'remove'} kind Which request failed.
   * @param {Error|*} err Rejection reason from the user callback or `fetchRows`.
   * @returns {void}
   */
  #showDataProviderRequestErrorNotification(kind: 'fetch' | 'create' | 'update' | 'remove', err: unknown): void {
    const notificationPlugin = this.hot.getPlugin('notification');

    if (!notificationPlugin?.enabled) {
      return;
    }

    const titleKeys = {
      fetch: I18nC.DATA_PROVIDER_ERRORS_FETCH,
      create: I18nC.DATA_PROVIDER_ERRORS_CREATE,
      update: I18nC.DATA_PROVIDER_ERRORS_UPDATE,
      remove: I18nC.DATA_PROVIDER_ERRORS_REMOVE,
    };
    const title = this.hot.getTranslatedPhrase(
      titleKeys[kind] ?? I18nC.DATA_PROVIDER_ERRORS_REQUEST_FAILED
    );
    const message = getDataProviderRequestErrorDescription(err);

    let toastId = '';
    const options: NotificationMessageOptions = {
      variant: 'error',
      title,
      message,
    };

    if (kind === 'fetch') {
      options.duration = 0;
      options.actions = [
        {
          label: this.hot.getTranslatedPhrase(I18nC.DATA_PROVIDER_BUTTONS_REFETCH),
          type: 'primary',
          callback: () => {
            if (toastId) {
              notificationPlugin.hide(toastId);
            }

            this.fetchData();
          },
        },
      ];
    }

    toastId = notificationPlugin.showMessage(options);
  }

  /**
   * Calls `onRowsUpdate`, success/error hooks, then re-fetches or re-renders.
   *
   * @param {object[]} rowPayloads Per-row `{ id, changes, rowData }` payloads.
   * @param {object} [options] Optional flags.
   * @param {function(): void} [options.revertOptimistic] Restores previous cell values when the request fails.
   * @returns {Promise<void>}
   */
  #commitRowsUpdate(rowPayloads: object[], options: { revertOptimistic?: () => void } = {}): Promise<void> {
    return commitRowsUpdateCrud(this.hot, {
      getOnRowsUpdate: () => this.#getOnRowsUpdate(),
      fetchData: () => this.fetchData({ skipLoading: true }),
      logError,
      onRequestFailed: (kind, err) => this.#showDataProviderRequestErrorNotification(
        kind as 'fetch' | 'create' | 'update' | 'remove', err),
    }, rowPayloads, options);
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
  #queueCrud(
    operation: string, payload: object, userPromiseFn: () => Promise<unknown>, onSuccess: () => Promise<void> | void
  ): Promise<void> {
    return queueCrud(
      {
        enqueueMutation: fn => this.#enqueueMutation(fn),
        runBeforeRowsMutation: (op, p) => runBeforeRowsMutation(this.hot, op, p),
        runAfterRowsMutation: (op, p) => runAfterRowsMutation(this.hot, op, p),
        runAfterRowsMutationError: (op, err, p) => runAfterRowsMutationError(this.hot, op, err, p),
        logError,
        onRequestFailed: (kind, err) => this.#showDataProviderRequestErrorNotification(
          kind as 'fetch' | 'create' | 'update' | 'remove', err),
      },
      operation,
      payload,
      userPromiseFn,
      onSuccess
    );
  }

  /**
   * Default handler for [[Hooks#hasExternalDataSource]]: `true` when this instance has a complete server-backed
   * `dataProvider` configuration. Registered in the constructor (early lifecycle) and in `enablePlugin()` after each
   * `disablePlugin()` clears `addHook` listeners.
   *
   * @returns {boolean}
   */
  readonly #onHasExternalDataSource = () => isCompleteDataProviderConfig(this.hot.getSettings().dataProvider);

  /**
   * @returns {void}
   */
  readonly #onAfterInit = () => {
    this.fetchData();
  };

  /**
   * Loads the requested page when Pagination runs in external paged mode.
   * Skips when `#queryParameters` already matches the Pagination UI (e.g. right after a successful fetch).
   *
   * @param {number} oldPage Previous 1-based page.
   * @param {number} newPage New 1-based page.
   * @returns {void}
   */
  readonly #onAfterPageChangeExternalPagination = (oldPage: number, newPage: number) => {
    handleAfterPageChangeExternalPagination(
      {
        hot: this.hot,
        getQueryPage: () => this.#queryParameters.page,
        goToPage: async(page) => {
          await this.fetchData({ page });
        },
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
  readonly #onAfterPageSizeChangeExternalPagination = (oldPageSize: number | 'auto', newPageSize: number | 'auto') => {
    handleAfterPageSizeChangeExternalPagination(
      {
        hot: this.hot,
        getQueryPage: () => this.#queryParameters.page,
        getQueryPageSize: () => this.#queryParameters.pageSize,
        setPageSize: async(pageSize) => {
          await this.fetchData({ pageSize, page: 1 });
        },
      },
      oldPageSize,
      newPageSize
    );
  };

  /**
   * Intercepts filter action when `fetchRows` is set: applies server-side filters and refetches; returns false so Filters skip client-side trimming.
   * Without `fetchRows`, returns nothing so Filters run client-side trimming (same guard pattern as [[#onBeforeColumnSort]]).
   *
   * @param {Array} conditionsStack Exported filter conditions (column = physical index).
   * @returns {boolean|void} False when filtering is handled server-side.
   */
  readonly #onBeforeFilter = (conditionsStack: unknown[]) => handleBeforeFilterForServer(
    {
      hot: this.hot,
      hasFetchFn: () => isFunction(this.#getFetchFn()),
      applyFiltersAndRefetch: (filtersForProvider) => {
        this.#queryParameters.filters = filtersForProvider ?? null;
        this.#queryParameters.page = 1;
        this.fetchData();
      },
    },
    conditionsStack
  );

  /**
   * @param {Array} currentSortConfig Current sort config.
   * @param {Array} destinationSortConfigs Destination sort config.
   * @param {boolean} sortPossible Whether sort is allowed.
   * @returns {boolean|undefined}
   */
  readonly #onBeforeColumnSort = (
    currentSortConfig: unknown[], destinationSortConfigs: unknown[], sortPossible: boolean
  ) => handleBeforeColumnSortForServer(
    {
      hot: this.hot,
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
  readonly #onModifyRowHeader = (visualRowIndex: number) =>
    getPagedRowHeaderIndex(this.#queryParameters, visualRowIndex);

  /**
   * Skips the local undo stack for edits that batch to `onRowsUpdate` (same sources as `shouldIgnoreAfterChangeForServerUpdate`).
   *
   * @param {Array} doneActionsCopy Snapshot of the undo stack before the new action.
   * @param {string} [source] Change source for the action being pushed onto the stack.
   * @returns {boolean|void} Return `false` to block stacking (see [[Hooks#beforeUndoStackChange]]).
   */
  readonly #onBeforeUndoStackChange = (doneActionsCopy: unknown[], source: string | undefined) => {
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
  readonly #onAfterChangeForServerUpdate = (changes: unknown[] | null, source: string | undefined) => {
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
  readonly #onBeforeAlter = (action: string, index: number | number[][], amount: number) => handleBeforeAlterForCrud(
    {
      hot: this.hot,
      getOnRowsCreate: () => this.#getOnRowsCreate(),
      getOnRowsRemove: () => this.#getOnRowsRemove(),
      getRowIdOption: () => this.#getRowIdOption(),
      getRowId: (vr: number) => this.getRowId(vr),
      createRows: (opts: { position?: string; referenceRowId?: unknown; rowsAmount?: number }) => this.createRows(opts),
      removeRows: (ids: unknown[]) => this.removeRows(ids),
    },
    action,
    index as number | [number, number][],
    amount
  );

  /**
   * Destroys the plugin.
   */
  destroy() {
    this.#resetAbortController();

    super.destroy();
  }
}
