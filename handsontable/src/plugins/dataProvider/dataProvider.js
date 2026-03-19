import { isFunction } from '../../helpers/function';
import { getProperty } from '../../helpers/object';
import { error as logError } from '../../helpers/console';
import { BasePlugin } from '../base';
import { PLUGIN_KEY as COLUMN_SORTING_PLUGIN_KEY } from '../columnSorting';
import { PLUGIN_KEY as PAGINATION_PLUGIN_KEY } from '../pagination';
import {
  applyColumnSortingToQueryParameters,
  applyPaginationToQueryParameters,
  disablePluginsIncompatibleWithDataProvider,
  normalizeExternalPaginationPageSize,
  normalizeSortToQueryFormat,
  querySortToPluginSort,
  syncColumnSortingFromQuerySort,
} from './utils';

export const PLUGIN_KEY = 'dataProvider';
export const PLUGIN_PRIORITY = 950;
export const DEFAULT_PAGE_SIZE = 10;

const ABORT_REASON_MESSAGE = 'DataProvider fetch superseded by a newer request';

const INITIAL_QUERY_PARAMETERS = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  sort: null,
  filters: null,
};

/**
 * Change sources that batch into one `onRowsUpdate` call. Shared with UndoRedo (skip stack for these edits).
 *
 * @package
 */
export const DATA_PROVIDER_BATCH_UPDATE_SOURCES = new Set([
  'edit',
  undefined,
  'CopyPaste.paste',
  'CopyPaste.cut',
  'Autofill.fill',
  /** Revert after failed `onRowsUpdate`; skipped for server enqueue and omitted from undo stack. */
  'DataProvider.revert',
]);

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
   * Serializes create/update/remove mutations so they run one after another.
   *
   * @type {Promise<void>}
   */
  #mutationQueueTail = Promise.resolve();
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
    const rid = c.rowId;

    return (typeof rid === 'string' || isFunction(rid))
      && isFunction(c.fetchRows)
      && isFunction(c.onRowsCreate)
      && isFunction(c.onRowsUpdate)
      && isFunction(c.onRowsRemove);
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
    applyPaginationToQueryParameters(
      this.hot.getPlugin(PAGINATION_PLUGIN_KEY),
      this.#queryParameters
    );
    applyColumnSortingToQueryParameters(
      this.hot.getPlugin(COLUMN_SORTING_PLUGIN_KEY),
      this.#queryParameters,
      column => this.hot.colToProp(column)
    );
  }

  /**
   * Enables the plugin, syncs query params from pagination/sort plugins, and registers hooks.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.#applyPaginationAndSortFromPlugins();

    this.addHook('afterInit', this.#onAfterInit);
    this.addHook('modifyRowHeader', this.#onModifyRowHeader);
    this.addHook('beforeColumnSort', this.#onBeforeColumnSort);
    this.addHook('afterChange', this.#onAfterChangeForServerUpdate);
    this.addHook('beforeAlter', this.#onBeforeAlter);
    this.addHook('afterPageChange', this.#onAfterPageChangeExternalPagination);
    this.addHook('afterPageSizeChange', this.#onAfterPageSizeChangeExternalPagination);
    this.addHook('paginationExternalDataSourceActive', this.#paginationExternalDataSourceActive);
    this.addHook('paginationTotalItemCount', this.#paginationTotalItemCount);
    this.addHook('afterUpdateSettings', this.#onAfterUpdateSettings);
    this.addHook('filtersServerSideActive', this.#filtersServerSideActive);
    this.addHook('beforeFilter', this.#onBeforeFilter);
    this.addHook('beforeLoadData', this.#onBeforeLoadDataForFilters);
    this.addHook('afterLoadData', this.#onAfterLoadDataForFilters);
    this.addHook('afterDataProviderFetchError', this.#onAfterDataProviderFetchErrorForFilters);

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
  #paginationExternalDataSourceActive = () => {
    if (!this.hot.getPlugin(PAGINATION_PLUGIN_KEY)?.enabled) {
      return;
    }

    return true;
  };

  /**
   * @private
   * @returns {number|void}
   */
  #paginationTotalItemCount = () => {
    if (!this.hot.getPlugin(PAGINATION_PLUGIN_KEY)?.enabled) {
      return;
    }

    return this.#totalRows;
  };

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
    if (!this.isEnabled()
      || this.hot.runHooks('paginationExternalDataSourceActive', false) !== true) {
      return;
    }

    if (newPage === this.#queryParameters.page) {
      return;
    }

    this.#goToPage(newPage).catch(() => {
      const p = this.hot.getPlugin(PAGINATION_PLUGIN_KEY);

      if (p?.enabled) {
        p.revertPageTo(oldPage);
      }
    });
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
    if (!this.isEnabled()
      || this.hot.runHooks('paginationExternalDataSourceActive', false) !== true) {
      return;
    }

    const ps = normalizeExternalPaginationPageSize(newPageSize, DEFAULT_PAGE_SIZE);

    if (ps === this.#queryParameters.pageSize && this.#queryParameters.page === 1) {
      return;
    }

    this.#setPageSize(ps).catch(() => {
      const p = this.hot.getPlugin(PAGINATION_PLUGIN_KEY);

      if (p?.enabled) {
        p.revertPageSizeTo(oldPageSize);
      }
    });
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

    const filtersForProvider = this.#conditionsStackToFiltersPayload(conditionsStack);

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
      const conditions = this.hot.runHooks('getFiltersConditions');

      this.#savedConditionsForLoad = Array.isArray(conditions) && conditions.length > 0
        ? this.#cloneFilterConditionsStack(conditions)
        : [];
    }
  };

  /**
   * afterLoadData: when source is DataProvider, restore filter conditions and update last-known-good.
   *
   * @private
   * @param {Array} sourceData Source data passed to loadData.
   * @param {boolean} initialLoad Whether this is the initial load.
   * @param {string} [source] Source identifier (e.g. 'dataProvider').
   */
  #onAfterLoadDataForFilters = (sourceData, initialLoad, source) => {
    if (source === PLUGIN_KEY) {
      if (this.#savedConditionsForLoad.length > 0) {
        this.hot.runHooks('setFiltersConditions', this.#savedConditionsForLoad);
        this.#savedConditionsForLoad = [];
      }

      const conditions = this.hot.runHooks('getFiltersConditions');

      this.#lastKnownGoodFilterConditions = Array.isArray(conditions) && conditions.length > 0
        ? this.#cloneFilterConditionsStack(conditions)
        : [];
    }
  };

  /**
   * afterDataProviderFetchError: restore filter conditions to last known good and re-render.
   *
   * @private
   */
  #onAfterDataProviderFetchErrorForFilters = () => {
    if (this.#lastKnownGoodFilterConditions.length > 0) {
      this.hot.runHooks('setFiltersConditions', this.#lastKnownGoodFilterConditions);
      this.hot.view.adjustElementsSize();
      this.hot.render();
    }
  };

  /**
   * Deep-clones a filter condition stack (for save/restore). Same shape as Filters exportConditions.
   *
   * @private
   * @param {Array} stack Condition stack from getFiltersConditions.
   * @returns {Array} Cloned stack.
   */
  #cloneFilterConditionsStack(stack) {
    return stack.map(s => ({
      column: s.column,
      operation: s.operation,
      conditions: (s.conditions || []).map(c => ({
        name: c.name,
        args: Array.isArray(c.args) ? [...c.args] : [],
      })),
    }));
  }

  /**
   * Converts Filters plugin condition stack (physical column indexes) to query filters (prop = column data key).
   * Expects the same shape as [[Filters#exportConditions]] returns.
   *
   * @private
   * @param {Array} conditionsStack Array of { column, operation, conditions } (same shape as exportConditions).
   * @returns {Array|null} Array of { prop, operation, conditions } or null when empty.
   */
  #conditionsStackToFiltersPayload(conditionsStack) {
    if (!Array.isArray(conditionsStack) || conditionsStack.length === 0) {
      return null;
    }

    const payload = [];

    for (let i = 0; i < conditionsStack.length; i++) {
      const stack = conditionsStack[i];
      const visualCol = this.hot.toVisualColumn(stack.column);
      const prop = this.hot.colToProp(visualCol);

      if (prop === null || prop === undefined) {
        continue;
      }

      payload.push({
        prop: String(prop),
        operation: stack.operation,
        conditions: stack.conditions.map(c => ({
          name: c.name,
          args: Array.isArray(c.args) ? [...c.args] : [],
        })),
      });
    }

    return payload.length === 0 ? null : payload;
  }

  /**
   * @private
   * @param {Array} currentSortConfig Current sort config.
   * @param {Array} destinationSortConfigs Destination sort config.
   * @param {boolean} sortPossible Whether sort is allowed.
   * @returns {boolean|undefined}
   */
  #onBeforeColumnSort = (currentSortConfig, destinationSortConfigs, sortPossible) => {
    if (!isFunction(this.#getFetchFn()) || !this.isEnabled() || !sortPossible) {
      return;
    }

    const columnSorting = this.hot.getPlugin(COLUMN_SORTING_PLUGIN_KEY);

    columnSorting.setSortConfig(destinationSortConfigs);
    this.#applyPaginationAndSortFromPlugins();

    this.fetchData();

    return false;
  };

  /**
   * @private
   * @param {number} visualRowIndex Visual row index.
   * @returns {number} Global row index for headers.
   */
  #onModifyRowHeader = (visualRowIndex) => {
    const { page, pageSize } = this.#queryParameters;
    const ps = typeof pageSize === 'number' && pageSize >= 1 ? pageSize : DEFAULT_PAGE_SIZE;

    return ((page - 1) * ps) + visualRowIndex;
  };

  /**
   * After a valid edit applies locally, queues `onRowsUpdate`. On failure, cells revert to previous values.
   *
   * @private
   * @param {Array} changes `[visualRow, prop, oldVal, newVal][]`.
   * @param {string} [source] Change source.
   * @returns {void}
   */
  #onAfterChangeForServerUpdate = (changes, source) => {
    if (!isFunction(this.#getOnRowsUpdate()) || !changes?.length) {
      return;
    }
    if (source === 'DataProvider.revert') {
      return;
    }
    if (!DATA_PROVIDER_BATCH_UPDATE_SOURCES.has(source)) {
      return;
    }

    const real = changes.filter(c => c[2] !== c[3]);

    if (real.length === 0) {
      return;
    }

    const valid = real.filter((c) => {
      const col = this.hot.propToCol(c[1]);

      if (col === undefined || col < 0) {
        return false;
      }

      return this.hot.getCellMeta(c[0], col).valid !== false;
    });

    if (valid.length === 0) {
      return;
    }

    this.#enqueueMutation(() => this.#runUpdateFromChanges(valid));
  };

  /**
   * @private
   * @param {Array} changeTuples `[visualRow, prop, oldVal, newVal][]`.
   * @returns {void}
   */
  #revertChangeTuples(changeTuples) {
    if (!changeTuples?.length) {
      return;
    }
    this.hot.batch(() => {
      changeTuples.forEach(([row, prop, oldVal]) => {
        this.hot.setDataAtRowProp(row, prop, oldVal, 'DataProvider.revert');
      });
    });
  }

  /**
   * @private
   * @param {string} action Alter action name.
   * @param {number|Array} index Row index or index groups.
   * @param {number} amount Row count.
   * @returns {boolean|undefined}
   */
  #onBeforeAlter = (action, index, amount) => {
    if (action === 'insert_row_above' || action === 'insert_row_below') {
      if (!isFunction(this.#getOnRowsCreate())) {
        return;
      }

      const n = this.hot.countSourceRows();

      if (this.hot.getSettings().maxRows === n) {
        return;
      }

      const position = action === 'insert_row_below' ? 'below' : 'above';
      const visualIndex = index ?? (position === 'below' ? n : 0);

      this.createRows({
        position,
        referenceRowId: visualIndex >= 0 ? this.getRowId(visualIndex) : undefined,
        rowsAmount: typeof amount === 'number' && amount >= 1 ? amount : 1,
      });

      return false;
    }

    if (action === 'remove_row' && isFunction(this.#getOnRowsRemove())) {
      const rowIds = this.#rowIdsFromAlterRemove(index, amount);

      if (rowIds.length > 0) {
        this.removeRows(rowIds);

        return false;
      }
    }
  };

  /**
   * Row id for remove, or whole row when `rowId` is not set.
   *
   * @private
   * @param {number} visualRow Visual row index.
   * @returns {*} Row id or row reference.
   */
  #idOrRow(visualRow) {
    let id = this.#getRowIdByVisualRow(visualRow);

    if (id === undefined) {
      id = this.hot.getSourceDataAtRow(this.hot.toPhysicalRow(visualRow));
    }

    return id;
  }

  /**
   * Collects row ids (or row snapshots) for `remove_row` alter ranges, including grouped indices.
   *
   * @private
   * @param {number|Array|undefined|null} index Visual start index or `[[index, amount], ...]`.
   * @param {number} amount Row count when `index` is scalar.
   * @returns {Array<*>}
   */
  #rowIdsFromAlterRemove(index, amount) {
    const ids = [];
    const n = () => this.hot.countRows();
    const pushRange = (start, amt) => {
      for (let r = 0; r < amt; r += 1) {
        const v = start + r;

        if (v >= 0 && v < n()) {
          const id = this.#idOrRow(v);

          if (id !== undefined) {
            ids.push(id);
          }
        }
      }
    };

    if (Array.isArray(index)) {
      index.forEach(([gi, ga]) => {
        const start = (gi === undefined || gi === null)
          ? Math.max(0, n() - (ga ?? 1))
          : Math.max(0, gi);

        pushRange(start, ga ?? 1);
      });
    } else {
      const amt = typeof amount === 'number' && amount >= 1 ? amount : 1;
      const start = (index === undefined || index === null)
        ? Math.max(0, n() - amt)
        : Math.max(0, index);

      pushRange(start, amt);
    }

    return ids;
  }

  /**
   * Appends a mutation onto the queue so concurrent CRUD runs sequentially.
   *
   * @private
   * @param {function(): Promise<void>} fn Async work for one mutation.
   * @returns {Promise<void>}
   */
  #enqueueMutation(fn) {
    const mutationPromise = this.#mutationQueueTail.then(fn);

    this.#mutationQueueTail = mutationPromise.catch(() => {});

    return mutationPromise;
  }

  /**
   * Runs `beforeRowsMutation`. Return `false` from a listener to cancel.
   *
   * @private
   * @param {string} operation Mutation kind (`create`, `update`, or `remove`).
   * @param {object} payload Hook payload for the operation.
   * @returns {boolean|undefined} `false` when cancelled.
   */
  #runBeforeRowsMutation(operation, payload) {
    if (this.hot.runHooks('beforeRowsMutation', operation, payload) === false) {
      return false;
    }

    return undefined;
  }

  /**
   * Runs `afterRowsMutation`.
   *
   * @private
   * @param {string} operation Mutation kind (`create`, `update`, or `remove`).
   * @param {object} payload Hook payload for the operation.
   * @returns {void}
   */
  #runAfterRowsMutation(operation, payload) {
    this.hot.runHooks('afterRowsMutation', operation, payload);
  }

  /**
   * Runs `afterRowsMutationError`.
   *
   * @private
   * @param {string} operation Mutation kind (`create`, `update`, or `remove`).
   * @param {Error} err Failure from the server callback.
   * @param {object} payload Hook payload for the operation.
   * @returns {void}
   */
  #runAfterRowsMutationError(operation, err, payload) {
    this.hot.runHooks('afterRowsMutationError', operation, err, payload);
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
  async #commitRowsUpdate(rowPayloads, options = {}) {
    const onRowsUpdate = this.#getOnRowsUpdate();

    if (!isFunction(onRowsUpdate)) {
      return;
    }

    const payload = { rows: rowPayloads };
    const { revertOptimistic } = options;

    try {
      await onRowsUpdate(rowPayloads);
      this.#runAfterRowsMutation('update', payload);
      await this.fetchData();
    } catch (err) {
      this.#runAfterRowsMutationError('update', err, payload);
      logError('Row update failed:', err);

      if (isFunction(revertOptimistic)) {
        revertOptimistic();
      }
      this.hot.render();
    }
  }

  /**
   * Resolves stable row id from a row object using `rowId` option.
   *
   * @private
   * @param {object|Array} rowData Source row.
   * @returns {*|undefined}
   */
  #getRowIdFromRowData(rowData) {
    const opt = this.#getRowIdOption();

    if (opt === undefined || opt === null) {
      return undefined;
    }
    if (isFunction(opt)) {
      return opt(rowData);
    }
    if (typeof opt === 'string') {
      return getProperty(rowData, opt);
    }

    return undefined;
  }

  /**
   * Row id for a visual row index.
   *
   * @private
   * @param {number} visualRow Visual row index.
   * @returns {*|undefined}
   */
  #getRowIdByVisualRow(visualRow) {
    return this.#getRowIdFromRowData(
      this.hot.getSourceDataAtRow(this.hot.toPhysicalRow(visualRow))
    );
  }

  /**
   * Finds a visual row index for a row id.
   *
   * @private
   * @param {*} rowId Row id.
   * @returns {number} Visual row index or -1 when not found.
   */
  #findVisualRowById(rowId) {
    for (let row = 0; row < this.hot.countRows(); row += 1) {
      if (this.#getRowIdByVisualRow(row) === rowId) {
        return row;
      }
    }

    return -1;
  }

  /**
   * @param {number} visualRow Visual row index.
   * @returns {*} Row id from `rowId` option, or undefined.
   */
  getRowId(visualRow) {
    return this.#getRowIdByVisualRow(visualRow);
  }

  /**
   * Builds `changes` map and merged `rowData` for one visual row from Handsontable change tuples.
   *
   * @private
   * @param {Array} rowChanges Tuples `[visualRow, prop, oldVal, newVal]` for one row.
   * @returns {{ changesObj: object, rowData: object|Array }}
   */
  #buildChangesAndRowData(rowChanges) {
    const visualRow = rowChanges[0][0];
    const rowData = this.hot.getSourceDataAtRow(this.hot.toPhysicalRow(visualRow));
    const isObj = rowData && typeof rowData === 'object' && !Array.isArray(rowData);
    const changesObj = {};

    rowChanges.forEach(([, prop, , nv]) => {
      const col = typeof prop === 'number' ? prop : this.hot.propToCol(prop);
      const key = isObj ? this.hot.colToProp(col) : col;

      changesObj[key] = nv;
    });

    let rowDataWithChanges;

    if (Array.isArray(rowData)) {
      rowDataWithChanges = [...rowData];
      rowChanges.forEach(([, prop, , nv]) => {
        const col = typeof prop === 'number' ? prop : this.hot.propToCol(prop);

        rowDataWithChanges[col] = nv;
      });
    } else if (isObj) {
      rowDataWithChanges = { ...rowData, ...changesObj };
    } else {
      rowDataWithChanges = { ...changesObj };
    }

    return { changesObj, rowData: rowDataWithChanges };
  }

  /**
   * Groups cell changes by row, validates, then commits a single batched `onRowsUpdate`.
   * Values are already applied in the grid; on cancel, validation failure, or server error, reverts those cells.
   *
   * @private
   * @param {Array} changes Filtered change tuples `[visualRow, prop, oldVal, newVal][]`.
   * @returns {Promise<void>}
   */
  async #runUpdateFromChanges(changes) {
    const byRow = new Map();

    changes.forEach((ch) => {
      const vr = ch[0];

      if (!byRow.has(vr)) {
        byRow.set(vr, []);
      }
      byRow.get(vr).push(ch);
    });

    const sortedRows = [...byRow.keys()].sort((a, b) => a - b);
    const rowPayloads = sortedRows.map((vr) => {
      const { changesObj, rowData } = this.#buildChangesAndRowData(byRow.get(vr));

      return {
        id: this.#getRowIdByVisualRow(vr),
        changes: changesObj,
        rowData,
      };
    });

    const payload = { rows: rowPayloads };
    const revert = () => this.#revertChangeTuples(changes);

    if (this.#runBeforeRowsMutation('update', payload) === false) {
      revert();

      return;
    }

    const ok = await Promise.all(
      sortedRows.map((vr, i) => this.#validateRowChanges(vr, rowPayloads[i].changes))
    );

    if (ok.some(v => !v)) {
      revert();
      this.#runAfterRowsMutationError('update', new Error('Row update validation failed'), payload);
      logError('Row update failed: validation failed for one or more cells');
      this.hot.render();

      return;
    }

    await this.#commitRowsUpdate(rowPayloads, { revertOptimistic: revert });
  }

  /**
   * Fetches rows from `fetchRows` with current or overridden query parameters.
   *
   * @param {object} [overrides] Partial query overrides (e.g. `{ page: 2 }`, `{ pageSize: 20, page: 1 }`, `{ sort }`, `{ filters }`).
   * Numeric `page` is clamped to at least 1.
   * @returns {Promise<{ rows: Array, totalRows: number }|null>}
   */
  async fetchData(overrides = {}) {
    const fetchFn = this.#getFetchFn();

    if (!isFunction(fetchFn)) {
      return null;
    }

    const params = { ...this.#queryParameters, ...overrides };

    params.sort = normalizeSortToQueryFormat(params.sort, col => this.hot.colToProp(col));

    if (typeof params.page === 'number' && !Number.isNaN(params.page)) {
      params.page = Math.max(1, params.page);
    }

    if (this.#abortController) {
      const reason = new Error(ABORT_REASON_MESSAGE);

      reason.name = 'AbortError';
      this.#abortController.abort(reason);
    }

    const controller = new AbortController();

    this.#abortController = controller;
    const { signal } = controller;

    if (this.hot.runHooks('beforeDataProviderFetch', params) === false) {
      this.#abortController = null;

      return null;
    }

    try {
      const result = await fetchFn(params, { signal });

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
      this.#syncColumnSortingState();

      const paginationPlugin = this.hot.getPlugin(PAGINATION_PLUGIN_KEY);

      if (paginationPlugin?.enabled) {
        paginationPlugin.applyLoadedPagingState({
          page: params.page,
          pageSize: params.pageSize,
        });
      }

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
    return this.#enqueueMutation(async() => {
      if (this.#runBeforeRowsMutation(operation, payload) === false) {
        return;
      }

      try {
        await userPromiseFn();
        this.#runAfterRowsMutation(operation, payload);
        await onSuccess();
      } catch (err) {
        this.#runAfterRowsMutationError(operation, err, payload);
        const label = operation === 'create' ? 'Row create' : 'Row remove';

        logError(`${label} failed:`, err);
      }
    });
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

    return this.#queueCrud('create', payload, () => onRowsCreate(rowsCreatePayload), () => this.fetchData());
  }

  /**
   * Server remove via `onRowsRemove`. Pass one row id or an array of ids.
   *
   * @param {*|*[]} rowIds Row id or ids.
   * @returns {Promise<void>}
   */
  async removeRows(rowIds) {
    const onRowsRemove = this.#getOnRowsRemove();

    if (!isFunction(onRowsRemove)) {
      return;
    }

    const ids = Array.isArray(rowIds) ? rowIds : [rowIds];
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
   * Whether every changed cell passes validator when `allowInvalid` is false.
   *
   * @private
   * @param {number} visualRow Visual row index.
   * @param {object} changes Prop-keyed new values.
   * @returns {Promise<boolean>}
   */
  #validateRowChanges(visualRow, changes) {
    const entries = Object.entries(changes);

    if (entries.length === 0) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      let pending = entries.length;
      let valid = true;

      const done = () => {
        pending -= 1;

        if (pending === 0) {
          resolve(valid);
        }
      };

      entries.forEach(([prop, value]) => {
        const col = this.hot.propToCol(prop);

        if (col === undefined || col < 0) {
          done();

          return;
        }

        const cellMeta = this.hot.getCellMeta(visualRow, col);

        if (!this.hot.getCellValidator(cellMeta)) {
          done();

          return;
        }

        this.hot.validateCell(value, cellMeta, (result) => {
          if (result === false && cellMeta.allowInvalid === false) {
            valid = false;
          }
          done();
        }, 'DataProvider.updateRows');
      });
    });
  }

  /**
   * Server update via `onRowsUpdate`. Pass an array of `{ id, changes, rowData? }` (same shape as `onRowsUpdate`).
   *
   * @param {object[]} rows Row update payloads (one or more).
   * @returns {Promise<void>}
   */
  async updateRows(rows) {
    if (!isFunction(this.#getOnRowsUpdate()) || !Array.isArray(rows) || rows.length === 0) {
      return;
    }

    const rowPayloads = rows.map((p) => {
      const visualRow = this.#findVisualRowById(p.id);

      let rowData;

      if (visualRow >= 0) {
        rowData = this.hot.getSourceDataAtRow(this.hot.toPhysicalRow(visualRow));
      } else if (p.rowData !== undefined) {
        rowData = p.rowData;
      } else {
        rowData = {};
      }

      return {
        id: p.id,
        changes: p.changes,
        rowData: rowData && typeof rowData === 'object' ? rowData : {},
      };
    });

    const payload = { rows: rowPayloads };

    return this.#enqueueMutation(async() => {
      if (this.#runBeforeRowsMutation('update', payload) === false) {
        return;
      }

      const validationResults = await Promise.all(rowPayloads.map(async(p) => {
        const visualRow = this.#findVisualRowById(p.id);

        if (visualRow < 0) {
          return true;
        }

        return this.#validateRowChanges(visualRow, p.changes);
      }));

      if (validationResults.some(ok => !ok)) {
        this.#runAfterRowsMutationError('update', new Error('Row update validation failed'), payload);
        logError('Row update failed: validation failed for one or more cells');

        return;
      }

      await this.#commitRowsUpdate(rowPayloads);
    });
  }

  /**
   * Aligns ColumnSorting plugin UI with `#queryParameters.sort` after `loadData`.
   *
   * @private
   * @returns {void}
   */
  #syncColumnSortingState() {
    const sortForPlugin = querySortToPluginSort(
      this.#queryParameters.sort,
      prop => this.hot.propToCol(prop)
    );

    syncColumnSortingFromQuerySort(
      this.hot.getPlugin(COLUMN_SORTING_PLUGIN_KEY),
      sortForPlugin
    );
  }

  /**
   * Disables the plugin, aborts fetch, resets query state.
   */
  disablePlugin() {
    this.hot.removeHook('afterInit', this.#onAfterInit);
    this.hot.removeHook('modifyRowHeader', this.#onModifyRowHeader);
    this.hot.removeHook('beforeColumnSort', this.#onBeforeColumnSort);
    this.hot.removeHook('afterChange', this.#onAfterChangeForServerUpdate);
    this.hot.removeHook('beforeAlter', this.#onBeforeAlter);
    this.hot.removeHook('afterPageChange', this.#onAfterPageChangeExternalPagination);
    this.hot.removeHook('afterPageSizeChange', this.#onAfterPageSizeChangeExternalPagination);
    this.hot.removeHook('paginationExternalDataSourceActive', this.#paginationExternalDataSourceActive);
    this.hot.removeHook('paginationTotalItemCount', this.#paginationTotalItemCount);
    this.hot.removeHook('afterUpdateSettings', this.#onAfterUpdateSettings);

    this.#abortController?.abort();
    this.#abortController = null;
    this.#queryParameters = { ...INITIAL_QUERY_PARAMETERS };
    this.#totalRows = 0;
    this.#savedConditionsForLoad = [];
    this.#lastKnownGoodFilterConditions = [];
    this.hot.removeHook('filtersServerSideActive', this.#filtersServerSideActive);
    this.hot.removeHook('beforeFilter', this.#onBeforeFilter);
    this.hot.removeHook('beforeLoadData', this.#onBeforeLoadDataForFilters);
    this.hot.removeHook('afterLoadData', this.#onAfterLoadDataForFilters);
    this.hot.removeHook('afterDataProviderFetchError', this.#onAfterDataProviderFetchErrorForFilters);

    super.disablePlugin();

    const c = this.#getConfig();

    if (!c || !this.#isCompleteConfig(c)) {
      this.#incompatibleSettingWarned.clear();
    }
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

    super.destroy();
  }
}
