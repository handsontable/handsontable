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
} from './utils';
import {
  cloneServerState,
  createServerState,
  isMutationFailureKind,
  replaceArrayContents,
} from './sheetState';
import type { FetchBinding, SheetServerState } from './sheetState';
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
}

/**
 * A `fetchRows` request that has not settled yet: what it was started for, its abort controller, the query it
 * sent, and whether it asked to skip the loading overlay.
 */
interface InFlightFetch {
  binding: FetchBinding<DataProviderConfig>;
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
   * Server view per sheet, keyed by SheetsBar sheet id (`null` without SheetsBar).
   *
   * @type {Map<number|null, object>}
   */
  #states: Map<number | null, SheetServerState<DataProviderFetchResult>> = new Map();
  /**
   * Fetches in flight, one per sheet. A newer fetch supersedes only the fetch of its own sheet.
   *
   * @type {Map<number|null, object>}
   */
  #inFlight: Map<number | null, InFlightFetch> = new Map();
  /**
   * `true` between `afterSheetTabStateCapture` and `afterSheetTabChange`, i.e. while SheetsBar applies another
   * sheet. The capture hook fires only once no listener canceled the switch.
   *
   * @type {boolean}
   */
  #isSheetSwitching = false;
  /**
   * The SheetsBar sheet the grid shows, learned from the switch hooks' arguments. `undefined` until it is first
   * needed; `null` without SheetsBar.
   *
   * @type {number|null|undefined}
   */
  #activeSheetId: number | null | undefined = undefined;
  /**
   * The data array each off-screen sheet holds, recorded when SheetsBar leaves the sheet. An off-screen response
   * is written into this array, the one the SheetsBar sheet record points at, and not into the array its binding
   * was captured with: every on-screen load hands the grid a new array, so a binding's array can be orphaned while
   * its sheet is still shown.
   *
   * @type {Map<number, *>}
   */
  #sheetData: Map<number, unknown> = new Map();
  /**
   * The sheets SheetsBar removed. Work still queued for one of them (a save's refetch, a deferred toast) is dropped.
   *
   * @type {Set<number>}
   */
  #removedSheets: Set<number> = new Set();
  /**
   * Counts the SheetsBar workbooks the grid has shown. A rebuilt workbook numbers its sheets from 1 again, so a
   * binding captured for an earlier workbook is dropped like a removed sheet.
   *
   * @type {number}
   */
  #workbook = 0;
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
    this.hot.addHook('afterSheetTabStateCapture', this.#onSheetSwitchStart);
    this.hot.addHook('afterSheetTabChange', this.#onSheetSwitchEnd);
    this.hot.addHook('afterSheetTabRemove', this.#onAfterSheetTabRemove);
    this.hot.addHook('afterSheetTabDuplicate', this.#onAfterSheetTabDuplicate);
    this.hot.addHook('afterSheetWorkbookReset', this.#onAfterSheetWorkbookReset);
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
   * During a SheetsBar switch no refetch starts: the fetches already running keep going (each lands in the sheet
   * it was started for), and the arrival handler decides what the arriving sheet shows.
   */
  updatePlugin(): void {
    this.disablePlugin();
    this.enablePlugin();

    if (!this.#isSheetSwitching) {
      this.#activeSheetId = undefined;

      if (this.hot.view) {
        void this.#fetchDataSilently();
      }
    }

    super.updatePlugin();
  }

  /**
   * Disables the plugin, aborts the fetch of the sheet the grid shows (the only fetch without SheetsBar), resets
   * query state. Fetches of off-screen SheetsBar sheets keep running and land in their own sheets, and during a
   * SheetsBar switch nothing is aborted: each fetch lands in the sheet it was started for.
   * Hook listeners registered with `addHook` are removed by `super.disablePlugin()` via `clearHooks()`.
   * The constructor registers {@link Hooks#hasExternalDataSource} for the period before the first `enablePlugin()`;
   * `enablePlugin()` registers it again so it survives each `updatePlugin()` cycle.
   */
  disablePlugin(): void {
    if (!this.#isSheetSwitching) {
      this.#abortVisibleFetch();
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
   * Fetches rows from `fetchRows` with current or overridden query parameters. Fetches the visible sheet.
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

        if (!this.#shouldRefetchAfterCreate(target) && !this.#inFlight.has(target?.sheetId ?? null)) {
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

    return this.#queueCrud(binding, 'remove', payload, () => onRowsRemove(ids), async() => {
      const target = this.#mutationTarget(binding);

      if (target !== null && this.#isDropped(target)) {
        return;
      }

      const offScreen = target !== null && !this.#isVisible(target);
      const pageBeforeFetch = offScreen
        ? this.#stateFor(target.sheetId).queryParameters.page
        : this.#queryParameters.page;
      const rowsLoaded = offScreen ? this.#countRowsOf(this.#offScreenDataOf(target)) : this.hot.countRows();
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

    return this.#enqueueMutation(() => runManualUpdateRowsMutation(this.hot, {
      getRowIdOption: () => this.#getRowIdOption(),
      commitRowsUpdate: payloads => this.#commitRowsUpdate(binding, payloads),
    }, rowPayloads));
  }

  /**
   * Tells whether the visible sheet is waiting for a `fetchRows` response that shows the loading overlay
   * (internal refetches that pass `skipLoading` do not count).
   *
   * @returns {boolean}
   */
  isFetching(): boolean {
    const key = this.#currentBinding()?.sheetId ?? null;
    const entry = this.#inFlight.get(key);

    return entry !== undefined && !entry.skipLoading && this.#isVisible(entry.binding);
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
   * binding (for a grid without SheetsBar, the current `dataProvider` object, so it follows `updateSettings()`: a
   * key omitted later means "default" again). Any value other than `false` means refetch; a non-boolean value is
   * warned about by `BasePlugin#updatePluginSettings`.
   *
   * @param {object|null} binding The binding the create refetches for.
   * @returns {boolean}
   */
  #shouldRefetchAfterCreate(binding: FetchBinding<DataProviderConfig> | null): boolean {
    return binding?.config.refetchAfterCreate !== false;
  }

  /**
   * Resolves the binding a queued mutation's follow-up work runs for. A SheetsBar sheet's mutation keeps the
   * binding captured when it was queued, so its callbacks and its refetch serve the sheet it was made on even when
   * another sheet is visible by the time it runs. Without SheetsBar there is only one grid, and the binding is read
   * when the work runs, so a `dataProvider` changed in between applies, as it always did.
   *
   * @param {object|null} queued The binding captured when the mutation was queued.
   * @returns {object|null} `null` when no `dataProvider` applies.
   */
  #mutationTarget(queued: FetchBinding<DataProviderConfig> | null): FetchBinding<DataProviderConfig> | null {
    return queued === null || queued.sheetId === null ? this.#currentBinding() : queued;
  }

  /**
   * Refetches for a mutation's binding. Like {@link DataProvider#fetchData}, it only renders when no
   * `dataProvider` applies. A visible binding's failure still rejects (callers revert on it); an off-screen
   * binding's failure resolves `null` and waits in its sheet state for the sheet to be visible again.
   *
   * @param {object|null} binding The binding to refetch for.
   * @param {object} overrides Partial query overrides, as in {@link DataProvider#fetchData}.
   * @returns {Promise<{ rows: Array<*>, totalRows: number }|null>}
   */
  #refetchFor(
    binding: FetchBinding<DataProviderConfig> | null,
    overrides: DataProviderFetchDataOverrides
  ): Promise<{ rows: unknown[]; totalRows: number } | null> {
    if (!binding) {
      this.hot.render();

      return Promise.resolve(null);
    }

    return this.#fetchFor(binding, overrides);
  }

  /**
   * Counts the rows a sheet holds.
   *
   * @param {*} data The sheet's data array.
   * @returns {number}
   */
  #countRowsOf(data: unknown): number {
    return Array.isArray(data) ? data.length : 0;
  }

  /**
   * Captures what a fetch started now is for.
   *
   * @returns {object|null} `null` when no `dataProvider` applies.
   */
  #currentBinding(): FetchBinding<DataProviderConfig> | null {
    const config = this.#getConfig();

    if (!config) {
      return null;
    }

    return {
      sheetId: this.#getActiveSheetId(),
      data: this.hot.getSettings().data,
      config,
      workbook: this.#workbook,
    };
  }

  /**
   * Returns the id of the sheet the grid shows. The switch hooks keep it current; the case they cannot answer is
   * the sheet a workbook opens with (SheetsBar fires no switch hook when it builds a workbook: at startup, on a
   * rebuild, or when it is enabled later), so that one is read from the public `getSheets()` and cached until the
   * next switch or {@link Hooks#afterSheetWorkbookReset}. `getSheets()` already answers while SheetsBar is still
   * building the workbook, before the plugin reports itself enabled, which is when a rebuilt workbook's opening
   * server sheet starts its first fetch. Without a workbook nothing is cached, so a SheetsBar enabled later is
   * picked up by the next fetch.
   *
   * @returns {number|null} `null` without SheetsBar.
   */
  #getActiveSheetId(): number | null {
    if (this.#activeSheetId !== undefined) {
      return this.#activeSheetId;
    }

    const activeSheet = this.hot.getPlugin('sheetsBar')?.getSheets().find(sheet => sheet.isActive);

    if (!activeSheet) {
      return null;
    }

    this.#activeSheetId = activeSheet.id;

    return activeSheet.id;
  }

  /**
   * Tells whether the grid shows the sheet a binding was captured for. Without SheetsBar (`null` sheet id) there
   * is nothing else to show, so a fetch that was not aborted always applies, as it always did. A SheetsBar sheet
   * is visible while it is the active sheet: its identity is the sheet, not the data array, which every on-screen
   * load replaces.
   *
   * @param {object} binding The fetch binding.
   * @returns {boolean}
   */
  #isVisible(binding: FetchBinding<DataProviderConfig>): boolean {
    if (binding.sheetId === null) {
      return true;
    }

    return this.enabled && binding.sheetId === this.#getActiveSheetId();
  }

  /**
   * Tells whether a binding's sheet is gone: removed from the workbook, or part of a workbook SheetsBar has since
   * replaced. Work queued for such a sheet is dropped.
   *
   * @param {object} binding The fetch binding.
   * @returns {boolean}
   */
  #isDropped(binding: FetchBinding<DataProviderConfig>): boolean {
    return binding.sheetId !== null
      && (binding.workbook !== this.#workbook || this.#removedSheets.has(binding.sheetId));
  }

  /**
   * Returns the data array an off-screen sheet holds: the one recorded when SheetsBar left it, or the binding's
   * own array for a sheet not left since the binding was captured.
   *
   * @param {object} binding The fetch binding.
   * @returns {*}
   */
  #offScreenDataOf(binding: FetchBinding<DataProviderConfig>): unknown {
    return (binding.sheetId === null ? undefined : this.#sheetData.get(binding.sheetId)) ?? binding.data;
  }

  /**
   * Runs one `fetchRows` request for a binding and applies its response: on screen when the binding is still
   * visible, otherwise into the binding's own data array and sheet state, without touching the grid.
   *
   * @param {object} binding What the fetch is for.
   * @param {object} [overrides] Partial query overrides, as in {@link DataProvider#fetchData}.
   * @param {object} [baseQuery] The query the overrides apply to. Omitted, the visible query is used for a
   * visible binding and the sheet's stored query for an off-screen one.
   * @returns {Promise<{ rows: Array<*>, totalRows: number }|null>}
   */
  async #fetchFor(
    binding: FetchBinding<DataProviderConfig>,
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

    const state = this.#stateFor(binding.sheetId);
    const base = baseQuery ?? (this.#isVisible(binding) ? this.#queryParameters : state.queryParameters);
    const params = this.#mergeAndNormalizeFetchParams(overrides, base);
    const controller = new AbortController();

    this.#abortFetchesFor(binding.sheetId);
    this.#inFlight.set(binding.sheetId, { binding, controller, params, skipLoading: overrides.skipLoading === true });

    if (this.hot.runHooks('beforeDataProviderFetch', params) === false) {
      this.#releaseInFlight(binding.sheetId, controller);
      this.hot.render();

      return null;
    }

    const { signal } = controller;

    try {
      const result = await fetchFn(this.#snapshotQueryParameters(params), { signal });

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
        return this.#fetchFor(
          binding,
          { page: clampedPage, skipLoading: overrides.skipLoading },
          persistedParams
        );
      }

      this.#storeFetchResult(binding, state, result, rows, totalRows, persistedParams);

      return { rows, totalRows };
    } catch (err) {
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

      if (!isVisible) {
        state.failure = err;
        state.hasFailure = true;

        return null;
      }

      this.#showDataProviderRequestErrorNotification('fetch', err);

      throw err;
    } finally {
      this.#releaseInFlight(binding.sheetId, controller);
    }
  }

  /**
   * Stores a successful response in its sheet's state and applies it: through `loadData()` and
   * {@link Hooks#afterDataProviderFetch} while the binding is visible, or into the off-screen sheet's own data
   * array (keeping its identity, so the SheetsBar sheet record sees the rows) while it is not. A sheet binding
   * loads a copy of the rows, so the array a later off-screen response rewrites in place is never the one
   * `fetchRows` returned (a memoized `fetchRows` may hand the same array back); a grid without SheetsBar loads the
   * returned array itself, as it always did. The payload is built after `loadData()`, as it always was: a grid
   * without `columns` maps a `prop` to a column through the loaded rows' schema. An off-screen response stores
   * the raw result only; the payload is built when the sheet is shown, against that sheet's own columns.
   *
   * @param {object} binding What the fetch was for.
   * @param {object} state The binding's sheet state.
   * @param {object} result The `fetchRows` result.
   * @param {Array} rows The normalized rows.
   * @param {number} totalRows The normalized row total.
   * @param {object} persistedParams The query the rows answer.
   */
  #storeFetchResult(
    binding: FetchBinding<DataProviderConfig>,
    state: SheetServerState<DataProviderFetchResult>,
    result: DataProviderFetchResult,
    rows: unknown[],
    totalRows: number,
    persistedParams: DataProviderQueryParameters
  ): void {
    state.queryParameters = this.#snapshotQueryParameters(persistedParams);
    state.failure = undefined;
    state.hasFailure = false;

    if (this.#isVisible(binding)) {
      const loadedRows = binding.sheetId === null ? rows : rows.slice();

      this.#queryParameters = persistedParams;
      this.hot.loadData(loadedRows, PLUGIN_KEY);

      const payload = this.#buildFetchResult(result, loadedRows, totalRows, persistedParams);

      state.lastResult = {
        ...result,
        rows: loadedRows,
        totalRows,
        queryParameters: this.#snapshotQueryParameters(persistedParams),
      };
      this.hot.runHooks('afterDataProviderFetch', payload);
      this.hot.render();

      return;
    }

    const sheetData = this.#offScreenDataOf(binding);
    const storedRows = replaceArrayContents(sheetData, rows) ? sheetData : rows;

    state.lastResult = {
      ...result,
      rows: storedRows,
      totalRows,
      queryParameters: this.#snapshotQueryParameters(persistedParams),
    };
  }

  /**
   * Builds the {@link Hooks#afterDataProviderFetch} payload that replays a sheet's stored response now that the
   * sheet is visible: the rows it shows, and the ColumnSorting and Filters states mapped through its own columns.
   *
   * @param {object} state The visible sheet's state.
   * @param {object} lastResult The stored response.
   * @param {*} rows The rows the sheet shows.
   * @returns {object}
   */
  #buildReplayResult(
    state: SheetServerState<DataProviderFetchResult>,
    lastResult: DataProviderFetchResult,
    rows: unknown
  ): DataProviderFetchPayload {
    return this.#buildFetchResult(
      lastResult,
      Array.isArray(rows) ? rows : [],
      lastResult.totalRows,
      this.#snapshotQueryParameters(state.queryParameters)
    );
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
   * Returns a sheet's server state, creating an empty one on first use.
   *
   * @param {number|null} sheetId The sheet id, or `null` without SheetsBar.
   * @returns {object}
   */
  #stateFor(sheetId: number | null): SheetServerState<DataProviderFetchResult> {
    let state = this.#states.get(sheetId);

    if (!state) {
      state = createServerState<DataProviderFetchResult>(this.#queryParameters);
      this.#states.set(sheetId, state);
    }

    return state;
  }

  /**
   * Aborts the fetch in flight for one sheet, as a newer fetch of that sheet supersedes it.
   *
   * @param {number|null} key The sheet id, or `null` without SheetsBar.
   */
  #abortFetchesFor(key: number | null): void {
    const entry = this.#inFlight.get(key);

    if (entry) {
      this.#inFlight.delete(key);
      entry.controller.abort(this.#createAbortReason());
    }
  }

  /**
   * Aborts the fetch in flight for the sheet the grid shows, without a reason, the way disabling the plugin always
   * aborted its fetch. Without SheetsBar that is the only fetch there can be.
   */
  #abortVisibleFetch(): void {
    const key = this.#getActiveSheetId();
    const entry = this.#inFlight.get(key);

    if (entry) {
      this.#inFlight.delete(key);
      entry.controller.abort();
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
   * Forgets a finished fetch, unless a newer one for the same sheet already replaced it.
   *
   * @param {number|null} key The sheet id.
   * @param {AbortController} controller The finished fetch's controller.
   */
  #releaseInFlight(key: number | null, controller: AbortController): void {
    if (this.#inFlight.get(key)?.controller === controller) {
      this.#inFlight.delete(key);
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
   * Answers a filter that SheetsBar's view-state reset and restore run during a switch. Clearing the conditions
   * runs locally. Re-applying them is blocked and fetches nothing: the arriving server sheet's rows are already
   * filtered by the server, a client-side pass could trim them differently from `fetchRows`, and the arrival
   * replay brings the conditions back from the saved response.
   *
   * @param {Array} conditionsStack The filter conditions about to be applied.
   * @returns {boolean|undefined} `false` for a non-empty stack.
   */
  #allowSwitchFilter(conditionsStack: unknown[]): false | undefined {
    return conditionsStack.length > 0 ? false : undefined;
  }

  /**
   * Answers a sort that SheetsBar's view-state reset and restore run during a switch, without fetching. A clear
   * only resets ColumnSorting's sort state: the rows are in the order the server or the arriving sheet gave them,
   * and a local clearing pass would read a pre-sort index cache that ColumnSorting never builds for a
   * server-driven sort (it throws when the sort state came from a fetch that has not landed yet). Re-applying a
   * sort is blocked, because a client-side pass could order the rows differently from `fetchRows`; the arrival
   * replay brings the header indicator back from the saved response.
   *
   * @param {Array} destinationSortConfigs The sort configs about to be applied.
   * @returns {boolean} Always `false`.
   */
  #answerSwitchSort(destinationSortConfigs: unknown[]): false {
    const columnSorting = this.hot.getPlugin('columnSorting');

    if (destinationSortConfigs.length === 0 && columnSorting?.enabled) {
      columnSorting.setSortConfig([]);
    }

    return false;
  }

  /**
   * Decides what a server sheet shows once SheetsBar has switched to it: wait for its own fetch still in flight,
   * replay the response it already has, or fetch it for the first time.
   */
  #onArrival(): void {
    const binding = this.#currentBinding();

    if (!binding) {
      return;
    }

    this.#showDeferredMutationFailures(binding.sheetId);

    const pending = this.#inFlight.get(binding.sheetId);

    if (pending) {
      this.#queryParameters = this.#snapshotQueryParameters(pending.params);

      return;
    }

    const state = this.#states.get(binding.sheetId);

    if (state?.hasFailure) {
      this.#showDeferredFailure(binding, state);

      return;
    }

    if (state?.lastResult) {
      this.#queryParameters = this.#snapshotQueryParameters(state.queryParameters);
      this.hot.runHooks('afterDataProviderFetch', this.#buildReplayResult(state, state.lastResult, binding.data));
      this.hot.render();

      return;
    }

    this.#applyQueryParametersFromPlugins();
    this.#queryParameters = { ...this.#queryParameters, page: 1 };
    void this.#fetchDataSilently();
  }

  /**
   * Shows the fetch failure a sheet stored while it was off-screen, now that it is visible again: the sheet's last
   * response is replayed (so its sort, filters, and pager come back) and the error toast appears, its Refetch
   * action fetching the visible sheet. The failure's {@link Hooks#afterDataProviderFetchError} already fired when
   * it happened.
   *
   * @param {object} binding The arriving sheet's binding.
   * @param {object} state The arriving sheet's state.
   */
  #showDeferredFailure(
    binding: FetchBinding<DataProviderConfig>,
    state: SheetServerState<DataProviderFetchResult>
  ): void {
    const { failure } = state;

    state.failure = undefined;
    state.hasFailure = false;
    this.#queryParameters = this.#snapshotQueryParameters(state.queryParameters);

    if (state.lastResult) {
      this.hot.runHooks('afterDataProviderFetch', this.#buildReplayResult(state, state.lastResult, binding.data));
    }

    this.#showDataProviderRequestErrorNotification('fetch', failure);
    this.hot.render();
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
  }

  /**
   * Calls `onRowsUpdate`, success/error hooks, then re-fetches or re-renders, all for the binding the update was
   * queued for. A visible binding's refetch keeps rejecting, so `query/crud.ts` reverts the optimistic values.
   * The revert only ever touches the grid while the update's sheet is visible: for an off-screen sheet it reloads
   * that sheet from the server instead, so the visible sheet's cells are never overwritten.
   *
   * @param {object|null} binding The binding captured when the update was queued.
   * @param {object[]} rowPayloads Per-row `{ id, changes, rowData }` payloads.
   * @param {object} [options] Optional flags.
   * @param {function(): void} [options.revertOptimistic] Restores previous cell values when the request fails.
   * @returns {Promise<void>}
   */
  #commitRowsUpdate(
    binding: FetchBinding<DataProviderConfig> | null,
    rowPayloads: object[],
    options: { revertOptimistic?: () => void } = {}
  ): Promise<void> {
    const { revertOptimistic } = options;

    return commitRowsUpdateCrud(this.hot, {
      getOnRowsUpdate: () => this.#getOnRowsUpdate(this.#mutationTarget(binding)?.config),
      fetchData: () => this.#refetchFor(this.#mutationTarget(binding), { skipLoading: true }),
      logError,
      onRequestFailed: (kind, err) => this.#reportRequestFailure(this.#mutationTarget(binding), kind, err),
    }, rowPayloads, {
      revertOptimistic: isFunction(revertOptimistic)
        ? () => this.#revertUpdateFor(this.#mutationTarget(binding), revertOptimistic)
        : undefined,
    });
  }

  /**
   * Shows a failed mutation's error toast, or, when the mutation's sheet is off-screen, stores the failure in that
   * sheet's state so the toast appears when the sheet is visible again.
   *
   * @param {object|null} binding The mutation's binding.
   * @param {string} kind Which request failed.
   * @param {*} err Rejection reason from the user callback.
   */
  #reportRequestFailure(binding: FetchBinding<DataProviderConfig> | null, kind: string, err: unknown): void {
    if (!isMutationFailureKind(kind)) {
      this.#showDataProviderRequestErrorNotification(kind as 'fetch' | 'create' | 'update' | 'remove', err);

      return;
    }

    if (binding === null || this.#isVisible(binding)) {
      this.#showDataProviderRequestErrorNotification(kind, err);

      return;
    }

    if (this.#isDropped(binding)) {
      return;
    }

    this.#stateFor(binding.sheetId).mutationFailures.push({ kind, error: err });
  }

  /**
   * Shows, once each, the mutation failures a sheet stored while it was off-screen.
   *
   * @param {number|null} sheetId The arriving sheet's id.
   */
  #showDeferredMutationFailures(sheetId: number | null): void {
    const state = this.#states.get(sheetId);

    if (!state || state.mutationFailures.length === 0) {
      return;
    }

    const failures = state.mutationFailures;

    state.mutationFailures = [];
    failures.forEach(({ kind, error }) => this.#showDataProviderRequestErrorNotification(kind, error));
  }

  /**
   * Undoes a failed update's optimistic values. While the update's sheet is visible (always, without SheetsBar)
   * the cells are reverted in place. An off-screen sheet's cells are not the grid's any more, so that sheet is
   * reloaded from the server instead.
   *
   * @param {object|null} binding The update's binding.
   * @param {function(): void} revert Restores the previous cell values in the grid.
   */
  #revertUpdateFor(binding: FetchBinding<DataProviderConfig> | null, revert: () => void): void {
    if (binding === null || this.#isVisible(binding)) {
      revert();

      return;
    }

    this.#fetchFor(binding, { skipLoading: true }).catch((err) => {
      logError('Data fetch failed:', err);
    });
  }

  /**
   * Queues create/remove (or similar) server calls with before/after mutation hooks.
   *
   * @param {object} binding The binding captured when the mutation was queued.
   * @param {string} operation `'create'` or `'remove'`.
   * @param {object} payload Hook payload (`{ rowsCreate }` or `{ rowsRemove }`).
   * @param {function(): Promise<*>} userPromiseFn Server callback invocation.
   * @param {function(): Promise<void>|void} onSuccess Runs after success (e.g. `fetchData`).
   * @returns {Promise<void>}
   */
  #queueCrud(
    binding: FetchBinding<DataProviderConfig>,
    operation: string,
    payload: object,
    userPromiseFn: () => Promise<unknown>,
    onSuccess: () => Promise<void> | void
  ): Promise<void> {
    return queueCrud(
      {
        enqueueMutation: fn => this.#enqueueMutation(fn),
        runBeforeRowsMutation: (op, p) => runBeforeRowsMutation(this.hot, op, p),
        runAfterRowsMutation: (op, p) => runAfterRowsMutation(this.hot, op, p),
        runAfterRowsMutationError: (op, err, p) => runAfterRowsMutationError(this.hot, op, err, p),
        logError,
        onRequestFailed: (kind, err) => this.#reportRequestFailure(this.#mutationTarget(binding), kind, err),
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
    if (this.#isSheetSwitching) {
      return this.#allowSwitchFilter(conditionsStack);
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
    if (this.#isSheetSwitching) {
      return this.#answerSwitchSort(destinationSortConfigs);
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
   * Marks the start of a SheetsBar switch that no listener canceled.
   *
   * @param {number} sheetId The sheet being left.
   * @returns {void}
   */
  readonly #onSheetSwitchStart = (sheetId: number) => {
    this.#isSheetSwitching = true;
    this.#activeSheetId = sheetId;
    this.#sheetData.set(sheetId, this.hot.getSettings().data);
  };

  /**
   * Ends the switch and, when the arriving sheet is a server sheet, decides what it shows.
   *
   * @param {number} oldSheetId The sheet that was left.
   * @param {number} newSheetId The sheet that arrived.
   * @returns {void}
   */
  readonly #onSheetSwitchEnd = (oldSheetId: number, newSheetId: number) => {
    this.#isSheetSwitching = false;
    this.#activeSheetId = newSheetId;

    if (this.enabled) {
      this.#onArrival();
    }
  };

  /**
   * @param {number} visualRowIndex Visual row index.
   * @returns {number} Global row index for headers.
   */
  readonly #onModifyRowHeader = (visualRowIndex: number) =>
    getPagedRowHeaderIndex(this.#queryParameters, visualRowIndex);

  /**
   * Aborts the removed sheet's fetch and forgets its server state. The abort is silent: `fetchRows` rejects with
   * `AbortError`, which only fires `afterDataProviderFetchAbort`.
   *
   * @param {number} sheetId The removed sheet's id.
   * @returns {void}
   */
  readonly #onAfterSheetTabRemove = (sheetId: number) => {
    this.#abortFetchesFor(sheetId);
    this.#states.delete(sheetId);
    this.#sheetData.delete(sheetId);
    this.#removedSheets.add(sheetId);
  };

  /**
   * Forgets every sheet of the workbook SheetsBar discarded: aborts their fetches, drops their server state, and
   * stops treating their ids as the sheets they were. Work still queued for one of them is dropped, and the next
   * fetch resolves the sheet the grid shows afresh (a sheet of the new workbook, or `null` once SheetsBar is gone).
   *
   * @returns {void}
   */
  readonly #onAfterSheetWorkbookReset = () => {
    this.#abortAllFetches();
    this.#states.clear();
    this.#sheetData.clear();
    this.#removedSheets.clear();
    this.#workbook += 1;
    this.#activeSheetId = undefined;
    this.#isSheetSwitching = false;
  };

  /**
   * Gives a duplicated sheet a snapshot of the original's server state, so its first visit replays instead of
   * fetching. The original's fetch in flight stays with the original.
   *
   * @param {number} sourceSheetId The original sheet's id.
   * @param {number} sheetId The duplicate's id.
   * @returns {void}
   */
  readonly #onAfterSheetTabDuplicate = (sourceSheetId: number, sheetId: number) => {
    const state = this.#states.get(sourceSheetId);

    if (state?.lastResult) {
      this.#states.set(sheetId, cloneServerState(state));
    }
  };

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
    const prepared = binding !== null && binding.sheetId !== null
      ? prepareUpdateFromChanges(this.hot, binding.config.rowId, valid, { validateNow: true })
      : undefined;

    void this.#enqueueMutation(() => runUpdateFromChanges(this.hot, {
      getRowIdOption: () => this.#getRowIdOption(),
      commitRowsUpdate: (payloads, opts) => this.#commitRowsUpdate(binding, payloads, opts),
      revertChanges: tuples => this.#revertUpdateFor(
        this.#mutationTarget(binding),
        () => revertChangeTuples(this.hot, tuples)
      ),
    }, valid, prepared));
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
    this.hot.removeHook('afterSheetTabStateCapture', this.#onSheetSwitchStart);
    this.hot.removeHook('afterSheetTabChange', this.#onSheetSwitchEnd);
    this.hot.removeHook('afterSheetTabRemove', this.#onAfterSheetTabRemove);
    this.hot.removeHook('afterSheetTabDuplicate', this.#onAfterSheetTabDuplicate);
    this.hot.removeHook('afterSheetWorkbookReset', this.#onAfterSheetWorkbookReset);

    super.destroy();
  }
}
