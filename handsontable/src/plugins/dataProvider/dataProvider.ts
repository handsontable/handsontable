import { isFunction } from '../../helpers/function';
import { error as logError } from '../../helpers/console';
import { throwWithCause } from '../../helpers/errors';
import { hasOwnProperty } from '../../helpers/object';
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
  prepareUpdateFromChanges,
  queueCrud,
  revertChangeTuples,
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
  isDataProviderRequestKind,
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
 * @property {'conjunction'|'disjunction'|'disjunctionWithExtraCondition'} operation Filters stack operation (same values as {@link Filters#exportConditions}).
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

/**
 * Which DataProvider request a result or a failure belongs to: `fetchRows`, `onRowsCreate`, `onRowsUpdate`, or
 * `onRowsRemove`. Internal: part of the context owner contract.
 */
export type DataProviderRequestKind = 'fetch' | 'create' | 'update' | 'remove';

/**
 * How a request made for a context the grid no longer shows ended: with a normalized `fetchRows` response
 * (`{ rows, totalRows, queryParameters }`, no ColumnSorting or Filters state), or with a failure. Internal: part
 * of the context owner contract.
 */
export type DataProviderDetachedOutcome = { result: DataProviderFetchResult } | { error: unknown };

/**
 * The plugin that shows several views of the grid, each backed by its own requests (SheetsBar). Internal: the
 * owner registers itself through `DataProvider#_setContextOwner()`; nothing here is public API.
 */
export interface DataProviderContextOwner {
  /**
   * Returns the context the grid shows: an object the owner never reuses for another view, or `null`.
   */
  getContext(): object | null;
  /**
   * Receives the outcome of a request made for a context the grid no longer shows. The plugin does nothing else
   * with it: no rows are loaded, no hook fires, and no error notification is shown.
   */
  onDetachedRequest(kind: DataProviderRequestKind, outcome: DataProviderDetachedOutcome, context: object): void;
  /**
   * Receives a normalized response the plugin has just loaded for the context the grid shows, before any hook
   * fires, so no hook listener can change what the owner keeps.
   */
  onShownResponse(result: DataProviderFetchResult, context: object): void;
  /**
   * Returns the latest response the owner keeps for a context the grid no longer shows. An off-screen refetch asks
   * for its query, and a remove's follow-up counts its rows. When the owner has none, both use what the request was
   * queued with.
   */
  getContextResult?(context: object): DataProviderFetchResult | null | undefined;
}

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

/**
 * @deprecated Since 18.0.0, renamed to `DataProviderFetchOptions`. This alias will be removed in
 * 19.0.0. Use {@link DataProviderFetchOptions} instead.
 */
export type DataProviderOptions = DataProviderFetchOptions;

export interface RowsCreatePayload {
  position: 'above' | 'below';
  referenceRowId?: unknown;
  rowsAmount: number;
}

export interface RowUpdatePayload {
  id: unknown;
  changes: Record<string | number, unknown>;
  rowData?: Record<string, unknown> | unknown[];
}

export interface RowMutationCreatePayload {
  rowsCreate: RowsCreatePayload;
}

export interface RowMutationUpdatePayload {
  rows: RowUpdatePayload[];
}

export interface RowMutationRemovePayload {
  rowsRemove: unknown[];
}

export type RowMutationPayload = RowMutationCreatePayload | RowMutationUpdatePayload | RowMutationRemovePayload;

export interface DataProviderConfig {
  rowId: string;
  fetchRows: (queryParameters: DataProviderQueryParameters, options: DataProviderFetchOptions) =>
    Promise<DataProviderFetchResult>;
  onRowsCreate?: (payload: RowsCreatePayload) => Promise<unknown[]>;
  onRowsUpdate?: (payload: RowUpdatePayload[]) => Promise<void>;
  onRowsRemove?: (payload: unknown[]) => Promise<void>;
  /**
   * Whether a successful `onRowsCreate` is followed by an automatic `fetchRows` refetch of the current query.
   * Set to `false` to apply the server response yourself (for example inside `onRowsCreate`), which keeps a new
   * row visible on the current page when the grid is sorted. Defaults to `true`.
   *
   * With Pagination enabled, a skipped refetch leaves the row total and the page count stale until the next
   * `fetchRows` call; reconcile them yourself. When a `fetchRows` request is still in flight when the create
   * finishes (for example a sort or filter change made just before the insert), the plugin refetches anyway, so
   * the pending response cannot overwrite the rows you applied.
   */
  refetchAfterCreate?: boolean;
}

/**
 * The `afterDataProviderFetch` payload a fetch builds: the `fetchRows` result, the query it answered, and the
 * matching ColumnSorting and Filters states.
 */
interface DataProviderFetchPayload extends Omit<DataProviderFetchResult, 'columnSortConfig'> {
  columnSortConfig: ReturnType<typeof sortingPayloadToSort>;
  isRestored?: true;
}

/**
 * What a request was started for, captured when it starts: the context the grid showed (`null` without a context
 * owner), the `dataProvider` config whose callbacks serve it, and the query parameters the grid showed. The query
 * is only read when the request's follow-up work runs while its context is no longer the one the grid shows.
 */
interface RequestBinding {
  context: object | null;
  config: DataProviderConfig;
  query: DataProviderQueryParameters;
}

/**
 * A `fetchRows` request that has not settled yet: what it was started for, its abort controller, the query it
 * sent, and whether it asked to skip the loading overlay.
 */
interface InFlightFetch {
  binding: RequestBinding;
  controller: AbortController;
  params: DataProviderQueryParameters;
  skipLoading: boolean;
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
 * A truthy {@link Options#dataProvider} value enables this plugin. Each key (`rowId`, `fetchRows`, `onRowsCreate`, `onRowsUpdate`, `onRowsRemove`, and the optional `refetchAfterCreate`) is validated like other plugin options.
 * When the object is a **complete** server-backed configuration (the five required keys `rowId`, `fetchRows`, `onRowsCreate`, `onRowsUpdate`, and `onRowsRemove` present and valid; `refetchAfterCreate` is optional), Handsontable loads rows via `fetchRows`, runs mutations through the callbacks, and the {@link Hooks#hasExternalDataSource} hook returns `true` so plugins such as Filters and Pagination can treat the grid as server-driven.
 * If required callbacks are missing or invalid, `fetchRows` and the affected mutation paths no-op until the configuration is valid.
 * Valid edits apply to the grid immediately; if `onRowsUpdate` fails, if validation fails later, or if `beforeRowsMutation` cancels, those cells revert to their previous values.
 * After a successful `onRowsCreate`, the plugin refetches the current query; set `refetchAfterCreate: false` to skip that refetch and apply the server response yourself. The refetch still runs when another `fetchRows` request is in flight at that moment, so its late response cannot drop the rows you applied.
 * When the {@link Options#notification} plugin is enabled, failed `fetchRows`, `onRowsCreate`, `onRowsUpdate`, or `onRowsRemove` requests (including a refetch after a successful mutation) show an error notification toast with the same translated titles and description text as before.
 *
 * If `trimRows`, `manualRowMove`, `manualColumnMove`, or `multiColumnSorting` is enabled, the DataProvider plugin does not enable. Handsontable logs a console warning when you still set a complete `dataProvider` configuration.
 * Use {@link Options#columnSorting} for server-driven sort (single column). Query `sort` uses `prop` (column data key).
 *
 * With the {@link SheetsBar} plugin, declare `dataProvider` in the `settings` of each sheet that loads from a server.
 * Each sheet keeps its own requests: a response or a failure that settles after you switched to another sheet never
 * touches the sheet you see.
 */
export class DataProvider extends BasePlugin {
  /**
   * Returns the plugin key used to identify this plugin in Handsontable settings.
   */
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  /**
   * Returns the priority order used to determine the order in which plugins are initialized.
   */
  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * Returns the setting keys that trigger a plugin update when changed via `updateSettings`.
   */
  static get SETTING_KEYS() {
    return [PLUGIN_KEY];
  }

  /**
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   */
  static get DEFAULT_SETTINGS() {
    return DEFAULT_SETTINGS;
  }

  /**
   * Returns validator functions for each plugin setting to verify their values are valid before applying them.
   */
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
   * Fetches in flight, one per context. A newer fetch supersedes only the fetch of its own context.
   *
   * @type {Map<object|null, object>}
   */
  #inFlight: Map<object | null, InFlightFetch> = new Map();
  /**
   * The contexts `_releaseContext()` dropped. Work still queued for one of them is dropped too.
   *
   * @type {WeakSet<object>}
   */
  #releasedContexts: WeakSet<object> = new WeakSet();
  /**
   * The plugin that names the context the grid shows, or `null` without one.
   *
   * @type {object|null}
   */
  #contextOwner: DataProviderContextOwner | null = null;
  /**
   * The error notifications on screen for an owner's context, with the request kind and the context each was shown
   * for. A context change hides the ones of the view that was left and hands their failures back to the owner, so
   * no Refetch action can ever fetch another view and no failure is shown over another view; a successful fetch for
   * the context hides its fetch error notifications, and dropping the context hides them all. Notifications of the
   * default context are not tracked.
   *
   * @type {object[]}
   */
  #errorToasts: Array<{ id: string, kind: DataProviderRequestKind, context: object, error: unknown }> = [];
  /**
   * `true` while `_runWithoutFetching()` runs its callback.
   *
   * @type {boolean}
   */
  #isPassive = false;
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
    this.#adoptPendingQuery();

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
    this.addHook('afterNotificationHide', this.#onAfterNotificationHide);

    super.enablePlugin();
  }

  /**
   * Re-applies settings and refetches when the instance is already initialized. A payload whose `dataProvider`
   * is no longer the grid's (an earlier `afterUpdateSettings` listener replaced it with a nested `updateSettings()`
   * call, which already re-applied the plugin) changes nothing.
   *
   * @param {object} [newSettings] The settings passed to `updateSettings()`.
   */
  updatePlugin(newSettings?: Record<string, unknown>): void {
    if (newSettings && hasOwnProperty(newSettings, 'dataProvider')
      && newSettings.dataProvider !== this.hot.getSettings().dataProvider) {
      super.updatePlugin();

      return;
    }

    this.disablePlugin();
    this.enablePlugin();

    if (!this.#isPassive && this.hot.view) {
      void this.#fetchDataSilently();
    }

    super.updatePlugin();
  }

  /**
   * Disables the plugin, aborts the fetch the grid is waiting for, and resets query state. With the
   * {@link SheetsBar} plugin, fetches of the sheets you do not see keep running.
   * Hook listeners registered with `addHook` are removed by `super.disablePlugin()` via `clearHooks()`.
   * The constructor registers {@link Hooks#hasExternalDataSource} for the period before the first `enablePlugin()`;
   * `enablePlugin()` registers it again so it survives each `updatePlugin()` cycle.
   */
  disablePlugin(): void {
    if (!this.#isPassive) {
      this.#abortFetchesFor(this.#currentContext());
    }

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
   * Fetches rows from `fetchRows` with current or overridden query parameters. With the {@link SheetsBar} plugin, it
   * fetches the sheet you see.
   *
   * @param {object} [overrides] Partial query overrides (e.g. `{ page: 2 }`, `{ pageSize: 20, page: 1 }`, `{ sort }`, `{ filters }`).
   * Pass `{ skipLoading: true }` to mark internal refetches (for example sort or CRUD); {@link Hooks#beforeDataProviderFetch} receives it, and it is not passed to `fetchRows`.
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
    const binding = this.#currentBinding();

    if (!binding) {
      this.hot.render();

      return null;
    }

    return this.#fetchFor(binding, overrides);
  }

  /**
   * Server create via `onRowsCreate`. Use `rowsAmount` to insert more than one row in one call.
   * After a successful `onRowsCreate`, refetches the current query unless `refetchAfterCreate` is `false`;
   * {@link Hooks#afterRowsMutation} fires in both cases. With the refetch off, a `fetchRows` request that is
   * still in flight when the create finishes (a sort or filter change made just before) would otherwise resolve
   * later and `loadData()` the rows `onRowsCreate` applied out of the grid, so that one case refetches anyway
   * (superseding the pending request, which fires {@link Hooks#afterDataProviderFetchAbort}).
   *
   * @param {object} [options] `position`, `referenceRowId`, `rowsAmount`.
   * @returns {Promise<void>}
   */
  async createRows(options: { position?: string; referenceRowId?: unknown; rowsAmount?: number } = {}): Promise<void> {
    const binding = this.#currentBinding();
    const onRowsCreate = binding?.config.onRowsCreate;

    if (!binding || !isFunction(onRowsCreate)) {
      return;
    }

    const rowsCreatePayload = {
      position: options.position ?? 'below',
      referenceRowId: options.referenceRowId,
      rowsAmount: options.rowsAmount ?? 1,
    };
    const payload = { rowsCreate: rowsCreatePayload };

    return this.#queueCrud(
      binding,
      'create',
      payload,
      () => Promise.resolve(onRowsCreate(rowsCreatePayload)),
      async() => {
        const target = this.#mutationTarget(binding);

        if (!this.#shouldRefetchAfterCreate(target) && !this.#inFlight.has(target?.context ?? null)) {
          return;
        }

        await this.#refetchFor(target, { skipLoading: true });
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
    const binding = this.#currentBinding();
    const onRowsRemove = binding?.config.onRowsRemove;

    if (!binding || !isFunction(onRowsRemove)) {
      return;
    }

    const ids = Array.isArray(rowIds) ? rowIds : [rowIds];

    ids.forEach((id) => {
      if (isMissingRowId(id)) {
        throwWithCause(DATA_PROVIDER_ERROR_REMOVE_ROWS_MISSING_ID);
      }
    });
    const payload = { rowsRemove: ids };
    const rowsLoadedAtQueue = this.hot.countRows();

    return this.#queueCrud(binding, 'remove', payload, () => onRowsRemove(ids), async() => {
      const target = this.#mutationTarget(binding);

      if (!this.hot || (target !== null && this.#isDropped(target))) {
        return;
      }

      const offScreen = target !== null && !this.#isVisible(target);
      const latest = offScreen ? this.#latestResultFor(target) : null;
      const pageBeforeFetch = target === null ? this.#queryParameters.page : this.#queryFor(target).page;
      const rowsLoaded = offScreen ? latest?.rows.length ?? rowsLoadedAtQueue : this.hot.countRows();
      const removesEveryLoadedRow = ids.length >= rowsLoaded && rowsLoaded >= 1;

      if (removesEveryLoadedRow && pageBeforeFetch > 1) {
        await this.#refetchFor(target, { page: pageBeforeFetch - 1, skipLoading: true });

        return;
      }

      const result = await this.#refetchFor(target, { skipLoading: true });

      if (result?.rows.length === 0 && pageBeforeFetch > 1) {
        await this.#refetchFor(target, { page: pageBeforeFetch - 1, skipLoading: true });
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
    const binding = this.#currentBinding();

    return this.#enqueueMutation(() => {
      if (!this.hot) {
        return;
      }

      return runManualUpdateRowsMutation(this.hot, {
        getRowIdOption: () => this.#getRowIdOption(),
        commitRowsUpdate: payloads => this.#commitRowsUpdate(binding, payloads),
      }, rowPayloads);
    });
  }

  /**
   * Tells whether the grid is waiting for a `fetchRows` response that shows the loading overlay. A fetch that passes
   * `skipLoading: true` does not count. The answer is already `false` inside the {@link Hooks#afterDataProviderFetch},
   * {@link Hooks#afterDataProviderFetchError}, and {@link Hooks#afterDataProviderFetchAbort} listeners of the fetch
   * that settled, unless another fetch has started in the meantime. With the sheets bar, it answers for the sheet
   * you see.
   *
   * @returns {boolean}
   */
  isFetching(): boolean {
    const entry = this.#inFlight.get(this.#currentContext());

    return entry !== undefined && !entry.skipLoading && this.#isVisible(entry.binding);
  }

  /**
   * Registers the plugin that names the context the grid shows (SheetsBar), or removes it with `null`. Internal:
   * part of the context owner contract described in the plugin's `AGENTS.md`; not public API.
   *
   * @private
   * @param {object|null} owner The context owner.
   */
  _setContextOwner(owner: DataProviderContextOwner | null): void {
    this.#contextOwner = owner;
  }

  /**
   * Drops a context for good: aborts its running `fetchRows` request, which fires
   * {@link Hooks#afterDataProviderFetchAbort} only, and drops the work still queued for it. A queued mutation still
   * calls its callback and fires its mutation hooks, and its failure is still logged, but its refetch, its cell
   * revert, and the report to the owner are skipped. The default context, `null`, is never dropped: releasing it
   * only aborts its running request. EmptyDataState's loading overlay is synced afterwards, since an aborted fetch
   * fires no hook that would hide it. The error notifications of a dropped context are hidden, since a Refetch action
   * could no longer fetch it and the failures describe a view that is gone. Internal: part of the context owner
   * contract; not public API.
   *
   * @private
   * @param {object|null} context The context to drop.
   */
  _releaseContext(context: object | null): void {
    this.#abortFetchesFor(context);

    if (context !== null) {
      this.#releasedContexts.add(context);
      this.#hideErrorToastsFor(context);
    }

    this.hot.getPlugin('emptyDataState')?._syncDataProviderLoading(this.isFetching());
  }

  /**
   * Runs `callback` while the plugin stays passive, and returns what it returns. While the callback runs:
   *
   * - an `updateSettings()` call that changes `dataProvider` applies the new configuration without aborting any
   * running `fetchRows` request and without refetching, and disabling the plugin aborts nothing;
   * - a ColumnSorting or Filters change is not sent to the server: applying a sort or a filter is canceled (the rows
   * come from the server, and a local pass could disagree with `fetchRows`), while clearing them runs locally
   * (clearing the sort only resets ColumnSorting's sort state, and the rows keep the order the server gave them);
   * - an explicit `fetchData()` call still fetches.
   *
   * When the plugin is enabled inside the callback while a `fetchRows` request of the current context is still
   * running, that request's query parameters become the current ones. The passive state ends when the callback
   * returns or throws; an async callback therefore leaves it at its first `await`, so pass synchronous work only.
   * Calls nest. Internal: part of the context owner contract; not public API.
   *
   * @private
   * @param {Function} callback The synchronous work to run.
   * @returns {*} The value `callback` returns.
   */
  _runWithoutFetching<T>(callback: () => T): T {
    const wasPassive = this.#isPassive;

    this.#isPassive = true;

    try {
      return callback();
    } finally {
      this.#isPassive = wasPassive;
    }
  }

  /**
   * Runs the owner's change of the view the grid shows, `callback`, inside `_runWithoutFetching()`, and brings the
   * per-view state of the plugins this plugin drives in line with it, since no DataProvider hook fires while a
   * view changes:
   *
   * - before `callback`, Pagination forgets the server row total, which described the view being left;
   * - after `callback` (also when it throws), the error notifications still on screen for the view that was left are
   * hidden and their failures handed back to the owner (its latest fetch failure, and every mutation failure: a
   * Refetch action would otherwise fetch the new view, and a mutation failure would describe it), the query parameters are derived again from the plugins, which the
   * change has brought to the new view's state (page 1, or the query of the new context's running fetch),
   * EmptyDataState shows its loading overlay exactly when the new context has a fetch in flight that shows
   * loading, and Filters takes the conditions on screen as the ones a failed server fetch rolls back to.
   *
   * The owner brings the new view's response back afterwards (`_restoreFetchResult()`, which re-applies the same
   * Filters rule once the replayed conditions are on screen) or starts its first fetch. Internal: part of the
   * context owner contract; not public API.
   *
   * @private
   * @param {Function} callback The synchronous work that changes the view.
   * @returns {*} The value `callback` returns.
   */
  _runContextChange<T>(callback: () => T): T {
    this.hot.getPlugin('pagination')?._resetDataProviderTotal();

    try {
      return this._runWithoutFetching(callback);
    } finally {
      this.#detachErrorToasts();
      this.#rederiveQuery();
      this.hot.getPlugin('emptyDataState')?._syncDataProviderLoading(this.isFetching(), true);
      this.hot.getPlugin('filters')?._resetDataProviderRollback();
    }
  }

  /**
   * Shows a response kept from an earlier `fetchRows` call as if it had just loaded, without calling `fetchRows`
   * and without reloading rows: the response's `queryParameters` become the current query parameters, and
   * {@link Hooks#afterDataProviderFetch} fires with the response and `isRestored: true`. The payload carries the rows
   * the grid shows, not rows from `result` (so the grid must already show the rows the response returned), and the
   * ColumnSorting and Filters states that match the query, mapped through the columns the grid has now. Does
   * nothing while the plugin is disabled. Once the replayed conditions are on screen, Filters takes them as the
   * ones a failed server fetch rolls back to. The page and page size Pagination takes from the replay fetch
   * nothing. Internal: part of the context owner contract; not public API.
   *
   * @private
   * @param {object} result The kept response: `{ totalRows, queryParameters }`; its `rows`, if any, are ignored.
   *
   * @fires Hooks#afterDataProviderFetch
   */
  _restoreFetchResult(result: Omit<DataProviderFetchResult, 'rows'>): void {
    if (!this.enabled) {
      return;
    }

    const data = this.hot.getSettings().data;
    const rows = Array.isArray(data) ? data : [];
    const query = { ...this.#queryParameters, ...result.queryParameters };
    const totalRows = typeof result.totalRows === 'number' && result.totalRows >= 0 ? result.totalRows : rows.length;
    const payload = this.#buildFetchResult({ ...result, rows }, rows, totalRows, this.#snapshotQueryParameters(query));

    this.#queryParameters = this.#snapshotQueryParameters(query);
    this.hot.runHooks('afterDataProviderFetch', { ...payload, isRestored: true });

    this.hot.getPlugin('filters')?._resetDataProviderRollback();
    this.hot.render();
  }

  /**
   * Shows the built-in error notification for a failed request, the one the plugin shows when a request fails
   * while the Notification plugin is enabled. A `'fetch'` notification carries a **Refetch** action that fetches
   * the grid's current query again. Does nothing while the Notification plugin is disabled. Internal: part of the
   * context owner contract; not public API.
   *
   * @private
   * @param {'fetch'|'create'|'update'|'remove'} kind Which request failed.
   * @param {Error|*} error The rejection reason.
   */
  _showRequestError(kind: DataProviderRequestKind, error: unknown): void {
    this.#showDataProviderRequestErrorNotification(kind, error);
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
   * Whether `createRows()` refetches after a successful `onRowsCreate`. Reads the raw config of the create's
   * binding (in the default context, the current `dataProvider` object, so it follows `updateSettings()`: a
   * key omitted later means "default" again). Any value other than `false` means refetch; a non-boolean value is
   * warned about by `BasePlugin#updatePluginSettings`.
   *
   * @param {object|null} binding The binding the create refetches for.
   * @returns {boolean}
   */
  #shouldRefetchAfterCreate(binding: RequestBinding | null): boolean {
    return binding?.config.refetchAfterCreate !== false;
  }

  /**
   * Resolves the binding a queued mutation's follow-up work runs for. A mutation of an owner's context keeps the
   * binding captured when it was queued, so its callbacks and its refetch serve the context it was made in even
   * when another context is shown by the time it runs. In the default context (`null`) there is only one grid, and
   * the binding is read when the work runs, so a `dataProvider` changed in between applies, as it always did. A
   * default-context mutation whose work runs once an owner shows a context of its own keeps its queued binding,
   * which is dropped (`#isDropped()`): its refetch and its revert would otherwise land on the owner's view.
   *
   * @param {object|null} queued The binding captured when the mutation was queued.
   * @returns {object|null} `null` when no `dataProvider` applies.
   */
  #mutationTarget(queued: RequestBinding | null): RequestBinding | null {
    if (!this.hot) {
      return null;
    }

    if (queued === null || (queued.context === null && this.#currentContext() === null)) {
      return this.#currentBinding();
    }

    return queued;
  }

  /**
   * Refetches for a mutation's binding. Like {@link DataProvider#fetchData}, it only renders when no
   * `dataProvider` applies. A visible binding's failure still rejects (callers revert on it); the failure of a
   * binding whose context is no longer shown resolves `null`.
   *
   * @param {object|null} binding The binding to refetch for.
   * @param {object} overrides Partial query overrides, as in {@link DataProvider#fetchData}.
   * @returns {Promise<{ rows: Array<*>, totalRows: number }|null>}
   */
  #refetchFor(
    binding: RequestBinding | null,
    overrides: DataProviderFetchDataOverrides
  ): Promise<{ rows: unknown[]; totalRows: number } | null> {
    if (!this.hot) {
      return Promise.resolve(null);
    }

    if (!binding) {
      this.hot.render();

      return Promise.resolve(null);
    }

    return this.#fetchFor(binding, overrides);
  }

  /**
   * Captures what a request started now is for.
   *
   * @returns {object|null} `null` when no `dataProvider` applies.
   */
  #currentBinding(): RequestBinding | null {
    const config = this.#getConfig();

    if (!config) {
      return null;
    }

    return {
      context: this.#currentContext(),
      config,
      query: this.#snapshotQueryParameters(this.#queryParameters),
    };
  }

  /**
   * Asks the context owner which context the grid shows.
   *
   * @returns {object|null} `null` without an owner.
   */
  #currentContext(): object | null {
    return this.#contextOwner?.getContext() ?? null;
  }

  /**
   * Tells whether the grid shows the context a binding was captured for. A binding that was dropped never is. The
   * default context (`null`) is otherwise always shown, as it always was for a grid without an owner. An owner's
   * context is shown while the plugin is enabled and the owner reports it as current.
   *
   * @param {object} binding The request binding.
   * @returns {boolean}
   */
  #isVisible(binding: RequestBinding): boolean {
    if (this.#isDropped(binding)) {
      return false;
    }

    return binding.context === null || (this.enabled && binding.context === this.#currentContext());
  }

  /**
   * Tells whether the work of a binding is dropped: its context was released through `_releaseContext()`, or it
   * belongs to the default context while an owner shows a context of its own (a request made before the owner
   * appeared, for example a save of a plain grid still pending when SheetsBar is enabled).
   *
   * @param {object} binding The request binding.
   * @returns {boolean}
   */
  #isDropped(binding: RequestBinding): boolean {
    return binding.context === null
      ? this.#currentContext() !== null
      : this.#releasedContexts.has(binding.context);
  }

  /**
   * Returns the query a refetch for a binding starts from: the current query while its context is shown, otherwise
   * the query of the latest response the owner keeps for that context, or the query the binding was made with when
   * it keeps none.
   *
   * @param {object} binding The request binding.
   * @returns {object}
   */
  #queryFor(binding: RequestBinding): DataProviderQueryParameters {
    if (this.#isVisible(binding)) {
      return this.#queryParameters;
    }

    return this.#latestResultFor(binding)?.queryParameters ?? binding.query;
  }

  /**
   * Returns the latest response the owner keeps for a binding's context, or `null` when it keeps none.
   *
   * @param {object} binding The request binding.
   * @returns {object|null}
   */
  #latestResultFor(binding: RequestBinding): DataProviderFetchResult | null {
    if (binding.context === null) {
      return null;
    }

    return this.#contextOwner?.getContextResult?.(binding.context) ?? null;
  }

  /**
   * Makes the query of the current context's running fetch the current query, so the page, sort, and filters the
   * plugin reports match the rows that fetch will load.
   */
  #adoptPendingQuery(): void {
    const pending = this.#inFlight.get(this.#currentContext());

    if (pending) {
      this.#queryParameters = this.#snapshotQueryParameters(pending.params);
    }
  }

  /**
   * Runs one `fetchRows` request for a binding and applies its response: on screen when the binding's context is
   * still shown, otherwise by handing it to the context owner, without touching the grid.
   *
   * @param {object} binding What the fetch is for.
   * @param {object} [overrides] Partial query overrides, as in {@link DataProvider#fetchData}.
   * @param {object} [baseQuery] The query the overrides apply to. Omitted, the current query is used for a
   * visible binding, and for one whose context is not shown the query of the latest response the owner keeps for
   * it, or the binding's own query when it keeps none.
   * @returns {Promise<{ rows: Array<*>, totalRows: number }|null>}
   */
  async #fetchFor(
    binding: RequestBinding,
    overrides: DataProviderFetchDataOverrides = {},
    baseQuery?: DataProviderQueryParameters
  ): Promise<{ rows: unknown[]; totalRows: number } | null> {
    if (this.#isDropped(binding)) {
      return null;
    }

    const fetchFn = binding.config.fetchRows;

    if (!isFunction(fetchFn)) {
      this.hot.render();

      return null;
    }

    const base = baseQuery ?? this.#queryFor(binding);
    const params = this.#mergeAndNormalizeFetchParams(overrides, base);
    const controller = new AbortController();

    this.#abortFetchesFor(binding.context, this.#createAbortReason());
    this.#inFlight.set(binding.context, { binding, controller, params, skipLoading: overrides.skipLoading === true });

    const hookParams = this.#isVisible(binding) ? params : { ...params, skipLoading: true };

    if (this.hot.runHooks('beforeDataProviderFetch', hookParams) === false) {
      this.#releaseInFlight(binding.context, controller);
      this.hot.render();

      return null;
    }

    const { signal } = controller;

    try {
      const result = await fetchFn(this.#snapshotQueryParameters(params), { signal });

      if (signal.aborted) {
        this.#releaseInFlight(binding.context, controller);
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
        return this.#fetchFor(
          binding,
          { page: clampedPage, skipLoading: overrides.skipLoading },
          persistedParams
        );
      }

      this.#releaseInFlight(binding.context, controller);
      this.#applyFetchResult(binding, result, rows, totalRows, persistedParams);

      return { rows, totalRows };
    } catch (err) {
      this.#releaseInFlight(binding.context, controller);

      if (signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
        this.#runAfterDataProviderFetchAbort(params, err);

        return null;
      }

      const isVisible = this.#isVisible(binding);

      if (isVisible) {
        this.hot.runHooks('afterDataProviderFetchError', err, this.#snapshotQueryParameters(params));
      } else {
        this.hot.runHooks('afterDataProviderFetchError', err, this.#snapshotQueryParameters(params), false);
      }

      this.#notifyRequestError('fetch', err, binding);

      if (!isVisible) {
        return null;
      }

      throw err;
    } finally {
      this.#releaseInFlight(binding.context, controller);
    }
  }

  /**
   * Applies a successful response. While the binding's context is shown, the rows go through `loadData()` and
   * {@link Hooks#afterDataProviderFetch} fires; the payload is built after `loadData()`, as it always was, because a
   * grid without `columns` maps a `prop` to a column through the loaded rows' schema. For an owner's context the
   * context's fetch error notifications are hidden, and the normalized response goes to the owner first, so a hook
   * listener cannot change what the owner keeps. For a context
   * that is not shown, the normalized response goes to the context owner, and nothing else happens.
   *
   * @param {object} binding What the fetch was for.
   * @param {object} result The `fetchRows` result.
   * @param {Array} rows The normalized rows.
   * @param {number} totalRows The normalized row total.
   * @param {object} persistedParams The query the rows answer.
   */
  #applyFetchResult(
    binding: RequestBinding,
    result: DataProviderFetchResult,
    rows: unknown[],
    totalRows: number,
    persistedParams: DataProviderQueryParameters
  ): void {
    if (this.#isVisible(binding)) {
      this.#queryParameters = persistedParams;
      this.hot.loadData(rows, PLUGIN_KEY);

      if (binding.context !== null) {
        this.#hideErrorToastsFor(binding.context, true);
        this.#contextOwner?.onShownResponse(
          { ...result, rows, totalRows, queryParameters: this.#snapshotQueryParameters(persistedParams) },
          binding.context
        );
      }

      this.hot.runHooks('afterDataProviderFetch', this.#buildFetchResult(result, rows, totalRows, persistedParams));
      this.hot.render();

      return;
    }

    if (binding.context === null || this.#isDropped(binding)) {
      return;
    }

    this.#contextOwner?.onDetachedRequest('fetch', {
      result: { ...result, rows, totalRows, queryParameters: this.#snapshotQueryParameters(persistedParams) },
    }, binding.context);
  }

  /**
   * Builds the {@link Hooks#afterDataProviderFetch} payload: the `fetchRows` result with the normalized rows and
   * total, the query they answer, and the ColumnSorting and Filters states matching that query.
   *
   * @param {object} result The `fetchRows` result.
   * @param {Array} rows The rows the payload carries.
   * @param {number} totalRows The row total.
   * @param {object} persistedParams The query the rows answer.
   * @returns {object}
   */
  #buildFetchResult(
    result: DataProviderFetchResult,
    rows: unknown[],
    totalRows: number,
    persistedParams: DataProviderQueryParameters
  ): DataProviderFetchPayload {
    const columnSortConfig = sortingPayloadToSort(this.hot, persistedParams.sort ?? null);
    const filtersConditionsStack = filtersPayloadToConditionsStack(
      this.hot,
      persistedParams.filters ?? null
    );

    return {
      ...result,
      rows,
      totalRows,
      queryParameters: persistedParams,
      columnSortConfig,
      filtersConditionsStack,
    };
  }

  /**
   * Aborts the fetch in flight for one context. A newer fetch of that context supersedes it with an `AbortError`
   * reason; disabling the plugin, destroying it, and releasing a context abort without one, as they always did.
   *
   * @param {object|null} context The context.
   * @param {Error} [reason] The abort reason.
   */
  #abortFetchesFor(context: object | null, reason?: Error): void {
    const entry = this.#inFlight.get(context);

    if (entry) {
      this.#inFlight.delete(context);
      entry.controller.abort(reason);
    }
  }

  /**
   * Aborts every fetch in flight, without a reason, the way destroying the plugin always did.
   */
  #abortAllFetches(): void {
    const entries = [...this.#inFlight.values()];

    this.#inFlight.clear();
    entries.forEach(({ controller }) => controller.abort());
  }

  /**
   * Forgets a finished fetch, unless a newer one for the same context already replaced it.
   *
   * @param {object|null} context The context.
   * @param {AbortController} controller The finished fetch's controller.
   */
  #releaseInFlight(context: object | null, controller: AbortController): void {
    if (this.#inFlight.get(context)?.controller === controller) {
      this.#inFlight.delete(context);
    }
  }

  /**
   * Creates the reason a superseded fetch is aborted with.
   *
   * @returns {Error}
   */
  #createAbortReason(): Error {
    const reason = new Error(ABORT_REASON_MESSAGE);

    reason.name = 'AbortError';

    return reason;
  }

  /**
   * Answers a filter change made inside `_runWithoutFetching()`, without fetching. Clearing the
   * conditions runs locally. Applying them is canceled: the rows come from the server, and a client-side pass
   * could trim them differently from `fetchRows`.
   *
   * @param {Array} conditionsStack The filter conditions about to be applied.
   * @returns {boolean|undefined} `false` for a non-empty stack.
   */
  #answerPassiveFilter(conditionsStack: unknown[]): false | undefined {
    return conditionsStack.length > 0 ? false : undefined;
  }

  /**
   * Answers a sort change made inside `_runWithoutFetching()`, without fetching. A clear only
   * resets ColumnSorting's sort state: the rows are in the order the server gave them, and a local clearing pass
   * would read a pre-sort index cache that ColumnSorting never builds for a server-driven sort (it throws when the
   * sort state came from a fetch that has not landed yet). Applying a sort is canceled, because a client-side pass
   * could order the rows differently from `fetchRows`.
   *
   * @param {Array} destinationSortConfigs The sort configs about to be applied.
   * @returns {boolean} Always `false`.
   */
  #answerPassiveSort(destinationSortConfigs: unknown[]): false {
    const columnSorting = this.hot.getPlugin('columnSorting');

    if (destinationSortConfigs.length === 0 && columnSorting?.enabled) {
      columnSorting.setSortConfig([]);
    }

    return false;
  }

  /**
   * @param {object} [config] The `dataProvider` config to read; the current one by default.
   * @returns {Function|undefined}
   */
  #getOnRowsUpdate(
    config: DataProviderConfig | undefined = this.#getConfig()
  ): ((payload: object[]) => Promise<void>) | undefined {
    return config && isFunction(config.onRowsUpdate)
      ? config.onRowsUpdate as unknown as (payload: object[]) => Promise<void>
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
   * Merges overrides into a base query (`#queryParameters` by default) and normalizes sort / page for `fetchRows`.
   *
   * @param {object} overrides Partial query overrides (subset of `DataProviderQueryParameters` keys).
   * @param {DataProviderQueryParameters} [base] The query the overrides apply to.
   * @returns {DataProviderQueryParameters} Query parameters object for `fetchRows`.
   */
  #mergeAndNormalizeFetchParams(
    overrides: DataProviderFetchDataOverrides,
    base: DataProviderQueryParameters = this.#queryParameters
  ): DataProviderBeforeFetchParameters {
    const params = { ...base, ...overrides };

    normalizeSortInFetchParams(params, this.hot);

    if (typeof params.page === 'number' && !Number.isNaN(params.page)) {
      params.page = Math.max(1, params.page);
    }

    return params;
  }

  /**
   * @param {object} params Query parameters for the aborted `fetchRows` call.
   * @param {Error|undefined} reason `AbortError` (or subclass) when `fetchRows` rejected; omit the argument when the promise settled after superseding.
   * @returns {void}
   */
  #runAfterDataProviderFetchAbort(params: DataProviderBeforeFetchParameters, reason: unknown): void {
    if (!this.hot) {
      return;
    }

    const queryParameters = this.#snapshotQueryParameters(params);

    this.hot.runHooks('afterDataProviderFetchAbort', queryParameters, reason);
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
   * Shows an error toast in the {@link Options#notification} plugin when it is enabled.
   * For `fetch` failures only, the toast includes a primary **Refetch** action (`duration: 0` until dismissed) that hides the toast and calls {@link DataProvider#fetchData} again.
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

            void this.#fetchDataSilently();
          },
        },
      ];
    }

    toastId = notificationPlugin.showMessage(options);

    const context = this.#currentContext();

    if (toastId && context !== null) {
      this.#errorToasts.push({ id: toastId, kind, context, error: err });
    }
  }

  /**
   * Hides the error notifications still on screen for a view the grid no longer shows, and hands their failures back
   * to the owner, which shows them again once that view is shown again (the owner keeps them only for a view it
   * does not show): the latest fetch failure of each such view, and every create, update, or remove failure. A
   * Refetch action fetches the view the grid shows, so leaving one on screen would let it fetch the next view and
   * lose the failure it reports, and a mutation failure left on screen would describe the next view.
   */
  #detachErrorToasts(): void {
    const current = this.#currentContext();

    this.#errorToasts = this.#errorToasts.filter(toast => !this.#releasedContexts.has(toast.context));

    const departed = this.#errorToasts.filter(toast => toast.context !== current);

    if (departed.length === 0) {
      return;
    }

    const latestFetchErrors = new Map<object, unknown>();

    this.#errorToasts = this.#errorToasts.filter(toast => toast.context === current);
    departed.forEach((toast) => {
      this.hot.getPlugin('notification')?.hide(toast.id);

      if (toast.kind === 'fetch') {
        latestFetchErrors.set(toast.context, toast.error);
      } else {
        this.#contextOwner?.onDetachedRequest(toast.kind, { error: toast.error }, toast.context);
      }
    });
    latestFetchErrors.forEach((error, context) => {
      this.#contextOwner?.onDetachedRequest('fetch', { error }, context);
    });
  }

  /**
   * Hides the error notifications of a context: only its fetch error notifications once a fetch for it succeeded,
   * so none of them is handed back to the owner as a failure on the next context change, or every one of them when
   * the context is dropped.
   *
   * @param {object} context The context.
   * @param {boolean} [fetchOnly=false] Whether to hide only the fetch error notifications.
   */
  #hideErrorToastsFor(context: object, fetchOnly = false): void {
    const isHidden = (toast: { kind: DataProviderRequestKind, context: object }) => toast.context === context
      && (!fetchOnly || toast.kind === 'fetch');
    const hidden = this.#errorToasts.filter(isHidden);

    this.#errorToasts = this.#errorToasts.filter(toast => !isHidden(toast));
    hidden.forEach((toast) => {
      this.hot.getPlugin('notification')?.hide(toast.id);
    });
  }

  /**
   * Derives the query parameters again after the owner changed the view, from the Pagination, ColumnSorting, and
   * Filters states the change left behind (the new view's own, since restoring its sort and filters runs passively),
   * starting on page 1. A fetch still running for the new context keeps its own query. A replayed response sets
   * its own query afterwards.
   */
  #rederiveQuery(): void {
    if (!this.enabled) {
      return;
    }

    this.#queryParameters = { ...INITIAL_QUERY_PARAMETERS };
    this.#applyQueryParametersFromPlugins();
    this.#queryParameters.page = 1;
    this.#adoptPendingQuery();
  }

  /**
   * Calls `onRowsUpdate`, success/error hooks, then re-fetches or re-renders, all for the binding the update was
   * queued for. A visible binding's refetch keeps rejecting, so `query/crud.ts` reverts the optimistic values.
   * The revert only ever touches the grid while the update's context is shown: for another context it reloads
   * that context from the server instead, so the cells on screen are never overwritten. Once the grid is
   * destroyed, an update that has not reached `onRowsUpdate` is skipped and one that is running settles without
   * hooks, reverts, or renders.
   *
   * @param {object|null} binding The binding captured when the update was queued.
   * @param {object[]} rowPayloads Per-row `{ id, changes, rowData }` payloads.
   * @param {object} [options] Optional flags.
   * @param {function(): void} [options.revertOptimistic] Restores previous cell values when the request fails.
   * @returns {Promise<void>}
   */
  #commitRowsUpdate(
    binding: RequestBinding | null,
    rowPayloads: object[],
    options: { revertOptimistic?: () => void } = {}
  ): Promise<void> {
    const { revertOptimistic } = options;

    if (!this.hot) {
      return Promise.resolve();
    }

    return commitRowsUpdateCrud(this.hot, {
      getOnRowsUpdate: () => this.#getOnRowsUpdate(this.#mutationTarget(binding)?.config),
      fetchData: () => this.#refetchFor(this.#mutationTarget(binding), { skipLoading: true }),
      logError,
      onRequestFailed: (kind, err) => this.#notifyRequestError(kind, err, this.#mutationTarget(binding)),
      runAfterRowsMutation: (op, p) => {
        if (this.hot) {
          runAfterRowsMutation(this.hot, op, p);
        }
      },
      runAfterRowsMutationError: (op, err, p) => {
        if (this.hot) {
          runAfterRowsMutationError(this.hot, op, err, p);
        }
      },
      render: () => {
        if (this.hot) {
          this.hot.render();
        }
      },
    }, rowPayloads, {
      revertOptimistic: isFunction(revertOptimistic)
        ? () => this.#revertUpdateFor(this.#mutationTarget(binding), revertOptimistic)
        : undefined,
    });
  }

  /**
   * Reports a failed request. A request whose context the grid shows gets the error notification. For a context the
   * grid does not show, the failure goes to the context owner instead, which shows the notification once that
   * context is shown again; a dropped request reports nothing (its hooks and console log already fired).
   *
   * @param {string} kind Which request failed.
   * @param {*} err The rejection reason.
   * @param {object|null} binding The request's binding.
   */
  #notifyRequestError(kind: string, err: unknown, binding: RequestBinding | null): void {
    if (!this.hot || !isDataProviderRequestKind(kind)) {
      return;
    }

    if (binding === null || this.#isVisible(binding)) {
      this.#showDataProviderRequestErrorNotification(kind, err);

      return;
    }

    if (binding.context !== null && !this.#isDropped(binding)) {
      this.#contextOwner?.onDetachedRequest(kind, { error: err }, binding.context);
    }
  }

  /**
   * Undoes a failed update's optimistic values. While the update's context is shown (always, without an owner)
   * the cells are reverted in place. Another context's cells are not the grid's any more, so that context is
   * reloaded from the server instead. After `destroy()` nothing is reverted.
   *
   * @param {object|null} binding The update's binding.
   * @param {function(): void} revert Restores the previous cell values in the grid.
   */
  #revertUpdateFor(binding: RequestBinding | null, revert: () => void): void {
    if (!this.hot) {
      return;
    }

    if (binding === null || this.#isVisible(binding)) {
      revert();

      return;
    }

    this.#fetchFor(binding, { skipLoading: true }).catch((err) => {
      logError('Data fetch failed:', err);
    });
  }

  /**
   * Queues create/remove (or similar) server calls with before/after mutation hooks. Once the grid is destroyed, a
   * mutation that has not started yet is skipped and one that is running settles without firing hooks.
   *
   * @param {object} binding The binding captured when the mutation was queued.
   * @param {string} operation `'create'` or `'remove'`.
   * @param {object} payload Hook payload (`{ rowsCreate }` or `{ rowsRemove }`).
   * @param {function(): Promise<*>} userPromiseFn Server callback invocation.
   * @param {function(): Promise<void>|void} onSuccess Runs after success (e.g. `fetchData`).
   * @returns {Promise<void>}
   */
  #queueCrud(
    binding: RequestBinding,
    operation: string,
    payload: object,
    userPromiseFn: () => Promise<unknown>,
    onSuccess: () => Promise<void> | void
  ): Promise<void> {
    return queueCrud(
      {
        enqueueMutation: fn => this.#enqueueMutation(fn),
        runBeforeRowsMutation: (op, p) => (this.hot ? runBeforeRowsMutation(this.hot, op, p) : false),
        runAfterRowsMutation: (op, p) => {
          if (this.hot) {
            runAfterRowsMutation(this.hot, op, p);
          }
        },
        runAfterRowsMutationError: (op, err, p) => {
          if (this.hot) {
            runAfterRowsMutationError(this.hot, op, err, p);
          }
        },
        logError,
        onRequestFailed: (kind, err) => this.#notifyRequestError(kind, err, this.#mutationTarget(binding)),
      },
      operation,
      payload,
      userPromiseFn,
      onSuccess
    );
  }

  /**
   * Runs {@link DataProvider#fetchData} for internal fire-and-forget refetches (initial load, `updatePlugin`, sort, filter, and the
   * Refetch notification action). {@link DataProvider#fetchData} already surfaces the failure – it fires
   * {@link Hooks#afterDataProviderFetchError} and shows the error notification – before rethrowing for its public callers,
   * so here the rejection is only logged and settled. Without this, `fetchRows` failures reach the page as
   * `unhandledrejection` events.
   *
   * @param {object} [overrides] Partial query overrides passed to {@link DataProvider#fetchData}.
   * @returns {Promise<{ rows: Array<*>, totalRows: number }|null>} Resolves to `null` when the fetch fails.
   */
  #fetchDataSilently(
    overrides: DataProviderFetchDataOverrides = {}
  ): Promise<{ rows: unknown[]; totalRows: number } | null> {
    return this.fetchData(overrides).catch((err) => {
      logError('Data fetch failed:', err);

      return null;
    });
  }

  /**
   * Default handler for {@link Hooks#hasExternalDataSource}: `true` when this instance has a complete server-backed
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
    void this.#fetchDataSilently();
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
   * Without `fetchRows`, returns nothing so Filters run client-side trimming (same guard pattern as `#onBeforeColumnSort()`).
   *
   * @param {Array} conditionsStack Exported filter conditions (column = physical index).
   * @returns {boolean|void} False when filtering is handled server-side.
   */
  readonly #onBeforeFilter = (conditionsStack: unknown[]) => {
    if (this.#isPassive) {
      return this.#answerPassiveFilter(conditionsStack);
    }

    return handleBeforeFilterForServer(
      {
        hot: this.hot,
        hasFetchFn: () => isFunction(this.#getFetchFn()),
        applyFiltersAndRefetch: (filtersForProvider) => {
          this.#queryParameters.filters = filtersForProvider ?? null;
          this.#queryParameters.page = 1;
          void this.#fetchDataSilently();
        },
      },
      conditionsStack
    );
  };

  /**
   * @param {Array} currentSortConfig Current sort config.
   * @param {Array} destinationSortConfigs Destination sort config.
   * @param {boolean} sortPossible Whether sort is allowed.
   * @returns {boolean|undefined}
   */
  readonly #onBeforeColumnSort = (
    currentSortConfig: unknown[], destinationSortConfigs: unknown[], sortPossible: boolean
  ) => {
    if (this.#isPassive) {
      return this.#answerPassiveSort(destinationSortConfigs);
    }

    return handleBeforeColumnSortForServer(
      {
        hot: this.hot,
        hasFetchFn: () => isFunction(this.#getFetchFn()),
        applyQueryParametersFromPlugins: () => this.#applyQueryParametersFromPlugins(),
        fetchData: overrides => this.#fetchDataSilently(overrides),
      },
      currentSortConfig,
      destinationSortConfigs,
      sortPossible
    );
  };

  /**
   * Forgets a tracked error notification once it is hidden (dismissed, timed out, or hidden by its Refetch action).
   *
   * @param {string} id The hidden notification's id.
   */
  readonly #onAfterNotificationHide = (id: string) => {
    this.#errorToasts = this.#errorToasts.filter(toast => toast.id !== id);
  };

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
   * @returns {boolean|void} Return `false` to block stacking (see {@link Hooks#beforeUndoStackChange}).
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

    const binding = this.#currentBinding();
    const prepared = binding !== null && binding.context !== null
      ? prepareUpdateFromChanges(this.hot, binding.config.rowId, valid, { validateNow: true })
      : undefined;

    void this.#enqueueMutation(() => {
      if (!this.hot) {
        return;
      }

      return runUpdateFromChanges(this.hot, {
        getRowIdOption: () => this.#getRowIdOption(),
        commitRowsUpdate: (payloads, opts) => this.#commitRowsUpdate(binding, payloads, opts),
        revertChanges: tuples => this.#revertUpdateFor(
          this.#mutationTarget(binding),
          () => revertChangeTuples(this.hot, tuples)
        ),
      }, valid, prepared);
    });
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
    this.#abortAllFetches();

    super.destroy();
  }
}
