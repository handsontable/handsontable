import { BasePlugin } from '../base';
import { registerConflict } from '../base/conflictRegistry';
import { hasOwnProperty } from '../../helpers/object';
import { throwWithCause } from '../../helpers/errors';
import { warnOnce } from '../../helpers/console';
import { announce } from '../../utils/a11yAnnouncer';
import { detachValue, recordCellChange } from '../../dataMap/dataJournal';
import { Launch, LaunchQueue } from './launchQueue';
import { isArrayLike, isProp, pushChange, readCopiedAxes, toErrorMessage, type Change } from './utils';
import { decorateCell, undecorateCell } from './decoration';
import type { CellChange, CellProperties } from '../../settings';
import type { PhysicalIndexToValueMap } from '../../translations';
import type {
  AsyncCellInfo,
  AsyncCellRef,
  AsyncRowRef,
  AsyncValueBatchOptions,
  AsyncValueBatchSource,
  AsyncValueCancelReason,
  AsyncValueContext,
  AsyncValueOptions,
  AsyncValueProp,
  AsyncValueResult,
  AsyncValueSource,
  AsyncValueState,
  AsyncValueStatus,
  AsyncValuesSettings,
} from './types';

export const PLUGIN_KEY = 'asyncValues';
export const PLUGIN_PRIORITY = 340;

/**
 * The source the plugin writes a resolved value with, unless a request names its own.
 */
export const ASYNC_VALUES_SOURCE = 'AsyncValues.resolve';

export { PENDING_CLASS_NAME, ERROR_CLASS_NAME, INDICATOR_CLASS_NAME, ERROR_MESSAGE_CLASS_NAME } from './decoration';

/**
 * The default number of cells per call of a batch source.
 */
const DEFAULT_BATCH_SIZE = 25;

/**
 * The default number of sources running at once: the per-host connection limit of HTTP/1.1 browsers.
 */
const DEFAULT_CONCURRENCY = 6;

/**
 * The answer of a `beforeAsyncValueResolve` listener that discards a value.
 */
const VETOED = Symbol('vetoed');

// NestedRows moves rows through its own data manager without shifting the index mapper, so a physical
// index does not follow its record there.
registerConflict(PLUGIN_KEY, 'nestedRows');

/**
 * The options of a request, with the defaults filled in. One object is shared by every cell of a call.
 */
interface ResolvedOptions {
  dependsOn: AsyncValueProp[];
  source: string;
  meta: Record<string, unknown> | null;
  undo: 'skip' | 'record';
  keepSource: boolean;
  batchSize: number;
}

/**
 * One public call: the requests it started share it. When its last request settles, the writes it
 * left behind are finalized: recorded as one undo step (`undo: 'record'`) and forgotten.
 */
interface Run {
  options: ResolvedOptions;
  live: number;
  hasWrites: boolean;
}

/**
 * Where a failed cell's value came from, kept for `retry()`.
 */
type Origin =
  { kind: 'cell'; source: (context: AsyncValueContext) => PromiseLike<unknown> } |
  { kind: 'batch'; source: AsyncValueBatchSource };

/**
 * The cells of one call of a batch source.
 */
interface Batch {
  controller: AbortController;
  entries: AsyncValueEntry[];
  cancelled: number;
}

/**
 * One cell's request, or the error a failed request left behind.
 */
interface AsyncValueEntry {
  status: AsyncValueStatus;
  state: RowState;
  prop: AsyncValueProp;
  controller: AbortController | null;
  error: unknown;
  message: string;
  settle: (result: AsyncValueResult) => void;
  run: Run;
  origin: Origin | null;
  batch: Batch | null;
  launch: Launch | null;
  finished: boolean;
  reported: boolean;
}

/**
 * A value a call wrote, kept until the call is finalized when the call records an undo step or applies
 * meta. It is `landed` once the grid stored it (the write's own change event), and dropped when any
 * other change reaches the cell first.
 */
interface PendingWrite {
  run: Run;
  oldValue: unknown;
  landed: boolean;
}

/**
 * The plugin's state of one row. Entries point at it, so moving the state to another physical row
 * moves every request and pending write of the row with it.
 */
interface RowState {
  physicalRow: number;
  entries: Map<AsyncValueProp, AsyncValueEntry>;
  writes: Map<AsyncValueProp, PendingWrite>;
}

/**
 * A settled request waiting for the next flush.
 */
interface SettledRequest {
  entry: AsyncValueEntry;
  outcome: { status: 'resolved'; value: unknown } | { status: 'rejected'; error: unknown };
}

/**
 * What a flush does with its settled requests.
 */
interface Decisions {
  rejected: SettledRequest[];
  vetoed: AsyncValueEntry[];
  resolved: SettledRequest[];
  failure: { error: unknown } | null;
}

/**
 * A row state captured before a data replacement, with its row id.
 */
interface ReplacedRow {
  state: RowState;
  rowId: unknown;
}

/**
 * A cell resolved to its physical row and column property.
 */
interface Target {
  physicalRow: number;
  prop: AsyncValueProp;
}

/**
 * The values one flush writes, by write source.
 */
interface Writes {
  visible: Map<string, Change[]>;
  source: Map<string, Change[]>;
}

/**
 * The physical row of an entry.
 *
 * @param {object} entry The entry.
 * @returns {number}
 */
function rowOf(entry: AsyncValueEntry): number {
  return entry.state.physicalRow;
}

/**
 * @plugin AsyncValues
 * @class AsyncValues
 *
 * @description
 * The AsyncValues plugin lets you compute cell values asynchronously, from promises: a remote lookup,
 * a server-computed column, or an AI model filling a column row by row. While a request is pending,
 * the cell shows a pending indicator. When the promise resolves, the plugin writes the value into the
 * cell. When it rejects, the cell keeps its previous value and shows an error state with the rejection
 * message.
 *
 * Start requests by visual coordinates ({@link AsyncValues#setAsyncValue}, {@link AsyncValues#setAsyncValues}),
 * by physical row or row id ({@link AsyncValues#setAsyncValueAt}, {@link AsyncValues#setAsyncValuesForRows}),
 * or many cells per call of one source ({@link AsyncValues#setAsyncValuesInBatches}).
 *
 * A pending request is cancelled, and its `AbortSignal` aborted, when:
 * - the cell's value changes (an edit, a paste, an autofill, an undo, or an API write),
 * - the value of a cell listed in `dependsOn` changes,
 * - a new request starts for the same cell,
 * - the row is removed, or the data is replaced with rows that no longer hold it,
 * - a column is inserted or removed at or before the cell's column, in array data.
 *
 * A late result of a cancelled request is ignored. Requests follow their row's physical index, so
 * sorting, filtering, or moving rows on the client while a request is pending still lands the result
 * on the right record. With row ids (the `rowId` option, or `dataProvider.rowId`), requests also follow
 * their rows through `loadData()` and `updateData()`. The plugin cannot be enabled together with the
 * `NestedRows` plugin.
 *
 * The plugin writes a resolved value with the `'AsyncValues.resolve'` source (or the request's own
 * `source`), and by default without an undo step. The write goes through `beforeChange` and the cell's
 * validator, so either can still change or reject the value. A cell's state is available in its cell
 * meta as `asyncState` (`'pending'`, `'error'`, or `null`) and `asyncError` (the error message, or `null`).
 *
 * To enable the plugin, set the {@link Options#asyncValues} option to `true` or to an object.
 *
 * @example
 *
 * ::: only-for javascript
 * ```js
 * const hot = new Handsontable(container, {
 *   data: [{ id: 1, sku: 'A-100', name: null }],
 *   columns: [{ data: 'sku' }, { data: 'name' }],
 *   rowId: 'id',
 *   asyncValues: { concurrency: 4 },
 * });
 *
 * const asyncValues = hot.getPlugin('asyncValues');
 *
 * asyncValues.setAsyncValuesForRows('all', 'name', async({ physicalRow, signal }) => {
 *   const sku = hot.getSourceDataAtCell(physicalRow, 'sku');
 *   const response = await fetch(`/api/products/${sku}`, { signal });
 *
 *   return (await response.json()).name;
 * }, { dependsOn: ['sku'] });
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * const hotRef = useRef(null);
 *
 * <HotTable
 *   ref={hotRef}
 *   data={[{ id: 1, sku: 'A-100', name: null }]}
 *   columns={[{ data: 'sku' }, { data: 'name' }]}
 *   rowId="id"
 *   asyncValues={{ concurrency: 4 }}
 * />
 *
 * const asyncValues = hotRef.current.hotInstance.getPlugin('asyncValues');
 *
 * asyncValues.setAsyncValuesForRows(
 *   'all',
 *   'name',
 *   ({ physicalRow, signal }) => fetchProductName(physicalRow, signal),
 *   { dependsOn: ['sku'] },
 * );
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * gridSettings = {
 *   data: [{ id: 1, sku: 'A-100', name: null }],
 *   columns: [{ data: 'sku' }, { data: 'name' }],
 *   rowId: 'id',
 *   asyncValues: { concurrency: 4 },
 * };
 *
 * const asyncValues = this.hotTable.hotInstance.getPlugin('asyncValues');
 *
 * asyncValues.setAsyncValuesForRows(
 *   'all',
 *   'name',
 *   ({ physicalRow, signal }) => fetchProductName(physicalRow, signal),
 *   { dependsOn: ['sku'] },
 * );
 * ```
 *
 * ```html
 * <hot-table [settings]="gridSettings"></hot-table>
 * ```
 * :::
 */
export class AsyncValues extends BasePlugin {
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
   * Returns the default settings applied when the plugin is enabled without explicit configuration.
   */
  static get DEFAULT_SETTINGS() {
    return {
      flush: 'microtask' as AsyncValuesSettings['flush'],
      concurrency: DEFAULT_CONCURRENCY,
      copyPendingAs: 'previous' as AsyncValuesSettings['copyPendingAs'],
    };
  }

  /**
   * Returns an object of validator functions used to type-check each settings property at runtime.
   */
  static get SETTINGS_VALIDATORS() {
    return {
      flush: (value: unknown) => value === 'microtask' || value === 'frame' ||
        (typeof value === 'number' && value >= 0 && Number.isFinite(value)),
      concurrency: (value: unknown) => value === Infinity || (Number.isInteger(value) && (value as number) >= 1),
      copyPendingAs: (value: unknown) => value === 'previous' || value === 'empty',
    };
  }

  /**
   * The state of every row, by physical row index. The index mapper shifts the values on a row insert
   * and removal. The map is listed as derived in the undo snapshot, so an undo never brings a pending
   * request or an error back.
   */
  #rowsMap: PhysicalIndexToValueMap | null = null;

  /**
   * Every row state in `#rowsMap`, for the walks that do not start from a row.
   */
  readonly #states = new Set<RowState>();

  /**
   * Every entry, for the walks that do not start from a cell.
   */
  readonly #entries = new Set<AsyncValueEntry>();

  /**
   * The number of pending entries.
   */
  #pendingCount = 0;

  /**
   * Whether a request was pending since the last `afterAsyncValuesIdle`.
   */
  #busy = false;

  /**
   * How deep the plugin is in a flush. `#afterSettling()` waits for the outermost one, so the idle hook
   * never fires before the flush's own resolve hooks.
   */
  #settlingDepth = 0;

  /**
   * The settled requests waiting for the next flush.
   */
  #settled: SettledRequest[] = [];

  /**
   * The sources waiting for a concurrency slot.
   */
  readonly #queue = new LaunchQueue(() => this.getSetting<number>('concurrency') ?? DEFAULT_CONCURRENCY);

  /**
   * Cancels the queued flush, or `null` when none is queued.
   */
  #cancelFlush: (() => void) | null = null;

  /**
   * Whether `disablePlugin()` is clearing the requests. A cancel listener that starts a request then
   * gets a cancelled result instead of a request that would outlive the plugin.
   */
  #disabling = false;

  /**
   * Whether a `loadData()` or `updateData()` is running. Its spare rows fire `afterCreateRow` before
   * `after*Data`, and the row states then belong to the data replacement, not to a row removal.
   */
  #replacingData = false;

  /**
   * The row states captured before the running data replacement.
   */
  #replacedRows: ReplacedRow[] = [];

  /**
   * The first error a hook listener threw while the plugin was starting requests. It is thrown again
   * once the call has finished starting everything, so a throwing listener cannot strand other cells.
   */
  #deferredError: { error: unknown } | null = null;

  /**
   * Checks if the plugin is enabled in the Handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    this.#rowsMap = this.hot.rowIndexMapper
      .createAndRegisterIndexMap(this.pluginName!, 'physicalIndexToValue', null);

    this.addHook('afterGetCellMeta', this.#onAfterGetCellMeta);
    this.addHook('afterRenderer', this.#onAfterRenderer);
    this.addHook('beforeCopy', this.#onBeforeCopy);
    // Before the application's listeners, so a request an application starts from its own
    // `afterChange` is not cancelled by the very change that started it.
    this.addHook('afterChange', this.#onAfterChange, -1);
    this.addHook('afterSetSourceDataAtCell', this.#onAfterSetSourceDataAtCell, -1);
    // Before the application's listeners, so a listener that cancels or writes a cell there already sees
    // every row state on its current physical row.
    this.addHook('afterCreateRow', this.#syncRows, -1);
    this.addHook('afterRemoveRow', this.#syncRows, -1);
    this.addHook('afterCreateCol', this.#onAfterCreateCol);
    this.addHook('afterRemoveCol', this.#onAfterRemoveCol);
    this.addHook('beforeLoadData', this.#onBeforeDataReplaced);
    this.addHook('beforeUpdateData', this.#onBeforeDataReplaced);
    // Before the application's listeners, so requests an application starts when the data loads are not
    // taken for requests of the replaced data.
    this.addHook('afterLoadData', this.#onAfterLoadData, -1);
    this.addHook('afterUpdateData', this.#onAfterUpdateData, -1);
    // `updateSettings()` re-initializes the row index (a `columns` or `dataSchema` change) without a data
    // load, which resets this plugin's map too.
    this.hot.rowIndexMapper.addLocalHook('init', this.#onRowIndexInit);

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state. This method is executed when `updateSettings()` is invoked with the
   * `asyncValues` option. The requests keep running, because the framework wrappers send the option
   * again on every update; a raised `concurrency` starts the queued sources that now fit.
   */
  updatePlugin(): void {
    this.#queue.pump();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance. Cancels every pending request
   * and clears every error state.
   */
  disablePlugin(): void {
    // Unlike most plugins, the cleanup runs before `super.disablePlugin()`: the decoration is taken
    // off by `afterRenderer`, so the grid has to paint once while that hook is still registered.
    if (this.#entries.size > 0) {
      this.#disabling = true;

      try {
        this.#clearAll('disabled');

      } finally {
        this.#disabling = false;
      }

      this.hot.markAllCellsChanged();
      this.hot.render();
    }

    this.#cancelFlush?.();
    this.#cancelFlush = null;
    this.#settled = [];
    this.#queue.clear();
    this.#states.clear();
    this.#replacingData = false;
    this.#replacedRows = [];
    this.hot.rowIndexMapper.removeLocalHook('init', this.#onRowIndexInit);

    if (this.#rowsMap) {
      this.hot.rowIndexMapper.unregisterMap(this.pluginName!);
      this.#rowsMap = null;
    }

    super.disablePlugin();
  }

  /**
   * Starts an asynchronous computation of a cell's value, by visual coordinates.
   *
   * The cell shows the pending state until the request settles. A request already pending for the
   * cell is cancelled first, and an error state is cleared.
   *
   * The returned promise resolves with `{ status: 'resolved' }` once the plugin passes the value to
   * the grid. A `beforeChange` listener or the cell's validator can still change or reject it, and an
   * asynchronous validator delays the write.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {Function|Promise} source A function that returns a promise of the value, or the promise
   * itself. The function receives an object with the `signal` (an `AbortSignal`), `row`, `column`,
   * `physicalRow`, `prop`, and `rowId` of the cell.
   * @param {object} [options] The request options: `dependsOn`, `source`, `meta`, `undo`, and `keepSource`.
   * @fires Hooks#beforeAsyncValueStart
   * @fires Hooks#afterAsyncValueCancel
   * @fires Hooks#afterAsyncValueStart
   * @throws {Error} When the plugin is disabled, or the coordinates point outside the grid.
   * @returns {Promise<object>} A promise that never rejects. It resolves with an object that describes
   * how the request ended: `{ status: 'resolved', value }`, `{ status: 'rejected', error, message }`,
   * or `{ status: 'cancelled', reason }`.
   */
  setAsyncValue(
    row: number,
    column: number,
    source: AsyncValueSource,
    options: AsyncValueOptions = {},
  ): Promise<AsyncValueResult> {
    return this.setAsyncValueAt({ row, column }, source, options);
  }

  /**
   * Starts an asynchronous computation of a cell's value, by visual coordinates (`{ row, column }`), by
   * physical row (`{ physicalRow, prop }`), or by row id (`{ rowId, prop }`). A physical row or a row id
   * also reaches a row that is filtered out or trimmed.
   *
   * @param {object} cell The cell.
   * @param {Function|Promise} source A function that returns a promise of the value, or the promise itself
   * (see {@link AsyncValues#setAsyncValue}).
   * @param {object} [options] The request options (see {@link AsyncValues#setAsyncValue}).
   * @fires Hooks#beforeAsyncValueStart
   * @fires Hooks#afterAsyncValueCancel
   * @fires Hooks#afterAsyncValueStart
   * @throws {Error} When the plugin is disabled, or the cell does not exist.
   * @returns {Promise<object>} A promise of how the request ended (see {@link AsyncValues#setAsyncValue}).
   */
  setAsyncValueAt(
    cell: AsyncCellRef,
    source: AsyncValueSource,
    options: AsyncValueOptions = {},
  ): Promise<AsyncValueResult> {
    this.#assertEnabled();

    const target = this.#resolveCell(cell);

    if (!target) {
      throwWithCause(`The cell ${JSON.stringify(cell)} cannot hold an async value.`);
    }

    const run = this.#createRun(options);
    let result: Promise<AsyncValueResult>;

    try {
      result = this.#startCell(target, source, run);

    } finally {
      this.#afterStarting(run);
    }

    return result;
  }

  /**
   * Starts an asynchronous computation for every cell of a range of visual coordinates, and renders
   * once. The `source` function is called once per cell.
   *
   * @param {number} rowFrom Visual index of the first row.
   * @param {number} columnFrom Visual index of the first column.
   * @param {number} rowTo Visual index of the last row.
   * @param {number} columnTo Visual index of the last column.
   * @param {Function} source A function that returns a promise of a cell's value (see
   * {@link AsyncValues#setAsyncValue}).
   * @param {object} [options] The request options, shared by every cell (see {@link AsyncValues#setAsyncValue}).
   * @fires Hooks#beforeAsyncValueStart
   * @fires Hooks#afterAsyncValueCancel
   * @fires Hooks#afterAsyncValueStart
   * @throws {Error} When the plugin is disabled, or the range reaches outside the grid.
   * @returns {Promise<object[]>} A promise of the results, one per cell, in row-major order.
   */
  setAsyncValues(
    rowFrom: number,
    columnFrom: number,
    rowTo: number,
    columnTo: number,
    source: (context: AsyncValueContext) => PromiseLike<unknown>,
    options: AsyncValueOptions = {},
  ): Promise<AsyncValueResult[]> {
    this.#assertEnabled();

    const targets: Target[] = [];

    for (let row = Math.min(rowFrom, rowTo); row <= Math.max(rowFrom, rowTo); row++) {
      for (let column = Math.min(columnFrom, columnTo); column <= Math.max(columnFrom, columnTo); column++) {
        const target = this.#resolveCell({ row, column });

        // Checked up front, so a range that reaches outside the grid starts no cell at all.
        if (!target) {
          throwWithCause(`The range (${rowFrom}, ${columnFrom}) - (${rowTo}, ${columnTo}) cannot hold async values.`);
        }

        targets.push(target);
      }
    }

    return this.#startCells(targets, source, options);
  }

  /**
   * Starts an asynchronous computation of one column for many rows, by physical row or by row id.
   * `'all'` takes every row of the data, the rows that are filtered out or trimmed included. The
   * `source` function is called once per cell.
   *
   * @param {string|Array} rows `'all'`, or the rows as `{ physicalRow }` or `{ rowId }` objects.
   * @param {string|number} prop The property of the column.
   * @param {Function} source A function that returns a promise of a cell's value (see
   * {@link AsyncValues#setAsyncValue}).
   * @param {object} [options] The request options, shared by every cell (see {@link AsyncValues#setAsyncValue}).
   * @fires Hooks#beforeAsyncValueStart
   * @fires Hooks#afterAsyncValueCancel
   * @fires Hooks#afterAsyncValueStart
   * @throws {Error} When the plugin is disabled, a row does not exist, or the column cannot hold values.
   * @returns {Promise<object[]>} A promise of the results, one per row, in the order of `rows`.
   */
  setAsyncValuesForRows(
    rows: 'all' | AsyncRowRef[],
    prop: AsyncValueProp,
    source: (context: AsyncValueContext) => PromiseLike<unknown>,
    options: AsyncValueOptions = {},
  ): Promise<AsyncValueResult[]> {
    this.#assertEnabled();

    return this.#startCells(this.#resolveRows(rows, prop), source, options);
  }

  /**
   * Starts an asynchronous computation of one column for many rows, with one call of `source` per batch
   * of up to `batchSize` cells (default `25`). Rows are given as in {@link AsyncValues#setAsyncValuesForRows}.
   *
   * `source` receives the cells' contexts and the batch's `AbortSignal`, and resolves with an array aligned
   * with the cells: an element that is an `Error` rejects that cell, and a missing element rejects it with
   * an empty message. A rejection, or an answer that is not an array, rejects every cell of the batch. Each
   * cell settles on its own, and the batch's signal aborts only when every cell of the batch was cancelled.
   * A batch takes one concurrency slot. A row listed twice is computed once.
   *
   * @param {string|Array} rows `'all'`, or the rows as `{ physicalRow }` or `{ rowId }` objects.
   * @param {string|number} prop The property of the column.
   * @param {Function} source A function that receives the cells and a signal, and returns a promise of
   * their values.
   * @param {object} [options] The request options (see {@link AsyncValues#setAsyncValue}), and `batchSize`.
   * @fires Hooks#beforeAsyncValueStart
   * @fires Hooks#afterAsyncValueCancel
   * @fires Hooks#afterAsyncValueStart
   * @throws {Error} When the plugin is disabled, a row does not exist, or the column cannot hold values.
   * @returns {Promise<object[]>} A promise of the results, one per row, in the order of `rows`.
   */
  setAsyncValuesInBatches(
    rows: 'all' | AsyncRowRef[],
    prop: AsyncValueProp,
    source: AsyncValueBatchSource,
    options: AsyncValueBatchOptions = {},
  ): Promise<AsyncValueResult[]> {
    this.#assertEnabled();

    const targets = this.#resolveRows(rows, prop);
    const run = this.#createRun(options);
    let results: Promise<AsyncValueResult>[] = [];

    try {
      results = this.#startBatches(targets, source, run);

    } finally {
      this.#afterStarting(run);
    }

    return Promise.all(results);
  }

  /**
   * Cancels the pending request of a cell, or clears its error state.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @fires Hooks#afterAsyncValueCancel
   */
  cancel(row: number, column: number): void {
    this.cancelAt({ row, column });
  }

  /**
   * Cancels the pending request of a cell, or clears its error state, by visual coordinates, physical
   * row, or row id (see {@link AsyncValues#setAsyncValueAt}).
   *
   * @param {object} cell The cell.
   * @fires Hooks#afterAsyncValueCancel
   */
  cancelAt(cell: AsyncCellRef): void {
    const entry = this.#getEntryAtRef(cell);

    if (entry) {
      this.#clear(entry, 'manual');
      this.hot.render();
    }
  }

  /**
   * Cancels every pending request and clears every error state.
   *
   * @fires Hooks#afterAsyncValueCancel
   */
  cancelAll(): void {
    if (this.#entries.size > 0) {
      this.#clearAll('manual');
      this.hot.render();
    }
  }

  /**
   * Starts a failed cell's request again, with the source and the options it failed with.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @fires Hooks#beforeAsyncValueStart
   * @fires Hooks#afterAsyncValueStart
   * @returns {Promise<object>|null} A promise of how the new request ended, or `null` when the cell has
   * no error, or no source to retry (a plain promise, or `keepSource: false`).
   */
  retry(row: number, column: number): Promise<AsyncValueResult> | null {
    return this.retryAt({ row, column });
  }

  /**
   * Starts a failed cell's request again, by visual coordinates, physical row, or row id (see
   * {@link AsyncValues#retry}).
   *
   * @param {object} cell The cell.
   * @fires Hooks#beforeAsyncValueStart
   * @fires Hooks#afterAsyncValueStart
   * @returns {Promise<object>|null} A promise of how the new request ended, or `null`.
   */
  retryAt(cell: AsyncCellRef): Promise<AsyncValueResult> | null {
    const entry = this.#getEntryAtRef(cell);

    if (!entry || entry.status !== 'error' || !entry.origin) {
      return null;
    }

    return this.#retry([entry])[0];
  }

  /**
   * Starts the requests of every failed cell again. Cells that failed in one batch are retried in batches
   * again.
   *
   * @fires Hooks#beforeAsyncValueStart
   * @fires Hooks#afterAsyncValueStart
   * @returns {Promise<object[]>} A promise of the results of the retried cells.
   */
  retryErrors(): Promise<AsyncValueResult[]> {
    const failed = [...this.#entries].filter(entry => entry.status === 'error' && entry.origin);

    return Promise.all(failed.length > 0 ? this.#retry(failed) : []);
  }

  /**
   * Returns the state of a cell: `{ status: 'pending' }`, `{ status: 'error', error, message }`, or
   * `null` when the cell has no pending request and no error.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {object|null}
   */
  getAsyncState(row: number, column: number): AsyncValueState | null {
    return this.getAsyncStateAt({ row, column });
  }

  /**
   * Returns the state of a cell, by visual coordinates, physical row, or row id (see
   * {@link AsyncValues#getAsyncState}).
   *
   * @param {object} cell The cell.
   * @returns {object|null}
   */
  getAsyncStateAt(cell: AsyncCellRef): AsyncValueState | null {
    const entry = this.#getEntryAtRef(cell);

    if (!entry) {
      return null;
    }

    return entry.status === 'pending'
      ? { status: 'pending' }
      : { status: 'error', error: entry.error, message: entry.message };
  }

  /**
   * Checks whether a cell has a pending request.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  isPending(row: number, column: number): boolean {
    return this.#getEntryAtRef({ row, column })?.status === 'pending';
  }

  /**
   * Lists the cells that have a pending request.
   *
   * @returns {object[]} The cells, as `{ physicalRow, prop, rowId }` objects.
   */
  getPendingCells(): AsyncCellInfo[] {
    return this.#listCells('pending');
  }

  /**
   * Lists the cells whose last request failed.
   *
   * @returns {object[]} The cells, as `{ physicalRow, prop, rowId }` objects.
   */
  getErrorCells(): AsyncCellInfo[] {
    return this.#listCells('error');
  }

  /**
   * Returns the number of cells that have a pending request.
   *
   * @returns {number}
   */
  countPending(): number {
    return this.#pendingCount;
  }

  /**
   * Returns the number of cells whose last request failed.
   *
   * @returns {number}
   */
  countErrors(): number {
    return this.#entries.size - this.#pendingCount;
  }

  /**
   * Destroys the plugin instance. Pending requests and batches are aborted, and their promises resolve
   * as cancelled with the `'disabled'` reason.
   */
  destroy(): void {
    const entries = [...this.#entries];

    this.#cancelFlush?.();
    this.#cancelFlush = null;
    this.#entries.clear();
    this.#states.clear();
    this.#settled = [];
    this.#queue.clear();
    this.#rowsMap = null;
    entries.forEach((entry) => {
      if (entry.status === 'pending') {
        entry.controller?.abort();
        entry.batch?.controller.abort();
        entry.controller = null;
        entry.settle({ status: 'cancelled', reason: 'disabled' });
      }
    });

    super.destroy();
  }

  /**
   * Throws when the plugin is disabled.
   */
  #assertEnabled(): void {
    if (!this.#disabling && (!this.enabled || !this.#rowsMap)) {
      throwWithCause('The AsyncValues plugin is not enabled.');
    }
  }

  /**
   * Resolves the options of a call, and starts the call's run.
   *
   * @param {object} options The options as passed.
   * @returns {object}
   */
  #createRun(options: AsyncValueBatchOptions): Run {
    const batchSize = options.batchSize;

    return {
      options: {
        dependsOn: [...(options.dependsOn ?? [])],
        source: typeof options.source === 'string' && options.source !== '' ? options.source : ASYNC_VALUES_SOURCE,
        meta: options.meta ?? null,
        undo: options.undo === 'record' ? 'record' : 'skip',
        keepSource: options.keepSource !== false,
        batchSize: typeof batchSize === 'number' && batchSize >= 1 ? Math.floor(batchSize) : DEFAULT_BATCH_SIZE,
      },
      live: 0,
      hasWrites: false,
    };
  }

  /**
   * Starts one request per cell of a call, and renders once.
   *
   * @param {object[]} targets The cells.
   * @param {Function} source The value source.
   * @param {object} options The options as passed.
   * @returns {Promise<object[]>}
   */
  #startCells(
    targets: Target[],
    source: AsyncValueSource,
    options: AsyncValueOptions,
  ): Promise<AsyncValueResult[]> {
    const run = this.#createRun(options);
    const results: Promise<AsyncValueResult>[] = [];

    try {
      targets.forEach(target => results.push(this.#startCell(target, source, run)));

    } finally {
      this.#afterStarting(run);
    }

    return Promise.all(results);
  }

  /**
   * Renders the cells a call started, finalizes the call right away when nothing in it is pending, and
   * throws the first error a hook listener threw meanwhile.
   *
   * @param {object} run The call.
   */
  #afterStarting(run: Run): void {
    const deferred = this.#deferredError;

    this.#deferredError = null;

    if (this.#rowsMap) {
      this.hot.render();
    }

    if (run.live === 0) {
      this.#afterSettling();
    }

    if (deferred) {
      throw deferred.error;
    }
  }

  /**
   * Runs a hook listener call, keeping the first error it throws for `#afterStarting()`.
   *
   * @param {Function} call The call.
   * @returns {object|null} What the call returned, as `{ value }`, or `null` when it threw.
   */
  #runDeferringErrors<T>(call: () => T): { value: T } | null {
    try {
      return { value: call() };

    } catch (error) {
      this.#deferredError ??= { error };

      return null;
    }
  }

  /**
   * Resolves a cell to its physical row and column property, or `null` when it does not exist.
   *
   * @param {object} cell The cell.
   * @returns {object|null}
   */
  #resolveCell(cell: AsyncCellRef): Target | null {
    if ('row' in cell) {
      const { row, column } = cell;
      const valid = Number.isInteger(row) && Number.isInteger(column) &&
        row >= 0 && row < this.hot.countRows() && column >= 0 && column < this.hot.countCols();
      const physicalRow = valid ? this.hot.toPhysicalRow(row) : null;
      const prop = valid ? this.hot.colToProp(column) : null;

      return physicalRow !== null && isProp(prop) ? { physicalRow, prop } : null;
    }

    const physicalRow = 'rowId' in cell ? this.#physicalRowOfId(cell.rowId) : cell.physicalRow;

    return physicalRow !== null && this.#isPhysicalRow(physicalRow) && this.#isColumnProp(cell.prop)
      ? { physicalRow, prop: cell.prop }
      : null;
  }

  /**
   * Resolves rows and one column to cells, throwing before anything starts when one does not exist.
   *
   * @param {string|Array} rows `'all'`, or the rows.
   * @param {string|number} prop The property of the column.
   * @returns {object[]}
   */
  #resolveRows(rows: 'all' | AsyncRowRef[], prop: AsyncValueProp): Target[] {
    if (!this.#isColumnProp(prop)) {
      throwWithCause(`The column ${JSON.stringify(prop)} cannot hold async values.`);
    }

    if (rows === 'all') {
      return Array.from({ length: this.hot.rowIndexMapper.getNumberOfIndexes() }, (_, physicalRow) => ({
        physicalRow, prop,
      }));
    }

    if (!Array.isArray(rows)) {
      throwWithCause('The rows must be `\'all\'` or an array of `{ physicalRow }` or `{ rowId }` objects.');
    }

    return rows.map((row) => {
      const target = typeof row === 'object' && row !== null ? this.#resolveCell({ ...row, prop }) : null;

      if (!target) {
        throwWithCause(`The row ${JSON.stringify(row)} cannot hold an async value.`);
      }

      return target;
    });
  }

  /**
   * Tells whether a number is a physical row of the data.
   *
   * @param {number} physicalRow The number.
   * @returns {boolean}
   */
  #isPhysicalRow(physicalRow: number): boolean {
    return Number.isInteger(physicalRow) && physicalRow >= 0 &&
      physicalRow < this.hot.rowIndexMapper.getNumberOfIndexes();
  }

  /**
   * Tells whether a column property names a column of the grid.
   *
   * @param {*} prop The property.
   * @returns {boolean}
   */
  #isColumnProp(prop: unknown): prop is AsyncValueProp {
    if (!isProp(prop)) {
      return false;
    }

    const column = this.hot.propToCol(prop);

    return typeof column === 'number' && column >= 0 && column < this.hot.countCols();
  }

  /**
   * Returns the id of a physical row, or `null` when the rows have no ids.
   *
   * @param {number} physicalRow Physical row index.
   * @returns {*}
   */
  #rowIdOf(physicalRow: number): unknown {
    return this.hot.getRowIdAtPhysicalRow(physicalRow) ?? null;
  }

  /**
   * Returns the physical row of a row id, or `null` when no row holds it.
   *
   * @param {*} rowId The row id.
   * @returns {number|null}
   */
  #physicalRowOfId(rowId: unknown): number | null {
    return rowId === null || rowId === undefined ? null : this.hot.getPhysicalRowById(rowId);
  }

  /**
   * Installs a cell's entry: asks `beforeAsyncValueStart`, replaces a previous request, marks the cell
   * pending, and fires `afterAsyncValueStart`. Calls no source. A listener that throws is treated as a
   * veto (`beforeAsyncValueStart`) or ignored (`afterAsyncValueStart`), and its error is thrown again by
   * `#afterStarting()`.
   *
   * @param {object} target The cell.
   * @param {object} run The call.
   * @param {object|null} origin The source to keep for `retry()`.
   * @returns {object} The entry, when one was installed, and the caller's promise.
   */
  #install(
    target: Target, run: Run, origin: Origin | null,
  ): { entry: AsyncValueEntry | null; result: Promise<AsyncValueResult> } {
    if (this.#disabling || !this.#rowsMap) {
      return { entry: null, result: Promise.resolve({ status: 'cancelled', reason: 'disabled' }) };
    }

    const { physicalRow, prop } = target;
    const answer = this.#runDeferringErrors(() => (
      this.hot.runHooks('beforeAsyncValueStart', physicalRow, prop, this.#rowIdOf(physicalRow))
    ));

    if (!answer || answer.value === false) {
      return { entry: null, result: Promise.resolve({ status: 'cancelled', reason: 'vetoed' }) };
    }

    if (this.#disabling || !this.#rowsMap) {
      return { entry: null, result: Promise.resolve({ status: 'cancelled', reason: 'disabled' }) };
    }

    let settle: (result: AsyncValueResult) => void = () => {};
    const result = new Promise<AsyncValueResult>((resolve) => {
      settle = resolve;
    });
    const state = this.#getRowState(physicalRow);
    const entry: AsyncValueEntry = {
      status: 'pending',
      state,
      prop,
      controller: new AbortController(),
      error: null,
      message: '',
      settle,
      run,
      origin: run.options.keepSource ? origin : null,
      batch: null,
      launch: null,
      finished: false,
      reported: false,
    };
    const previous = state.entries.get(prop);

    run.live += 1;

    // The new entry takes the cell before the previous one's cancel hook runs, so a listener that
    // starts a request for the same cell from that hook replaces this entry instead of leaving it
    // orphaned next to its own. It is stored first, so detaching the previous one never finds the row
    // empty and drops its state.
    this.#setEntry(entry);

    if (previous) {
      this.#detach(previous);
    }

    this.#markChanged(entry);

    if (previous) {
      this.#notifyCleared([[previous, 'restart']]);
    }

    if (this.#isPending(entry)) {
      this.#runDeferringErrors(() => (
        this.hot.runHooks('afterAsyncValueStart', physicalRow, prop, this.#rowIdOf(physicalRow))
      ));
    }

    return { entry: this.#isPending(entry) ? entry : null, result };
  }

  /**
   * Starts a request for one cell, without rendering.
   *
   * @param {object} target The cell.
   * @param {Function|Promise} source The value source.
   * @param {object} run The call.
   * @returns {Promise<object>}
   */
  #startCell(target: Target, source: AsyncValueSource, run: Run): Promise<AsyncValueResult> {
    const { entry, result } = this.#install(
      target, run, typeof source === 'function' ? { kind: 'cell', source } : null,
    );

    if (entry) {
      entry.launch = new Launch((release) => {
        if (!this.#isPending(entry)) {
          release();

          return;
        }

        const context = this.#contextOf(entry);
        // The executor turns a source that throws synchronously into a rejection.
        const request = new Promise<unknown>((resolve) => {
          resolve(typeof source === 'function' ? source(context) : source);
        });

        request.then(
          (value) => {
            release();
            this.#onSettled({ entry, outcome: { status: 'resolved', value } });
          },
          (error) => {
            release();
            this.#onSettled({ entry, outcome: { status: 'rejected', error } });
          },
        );
      }, () => this.#isPending(entry));
      this.#queue.push(entry.launch);
    }

    return result;
  }

  /**
   * Starts batched requests for cells, without rendering. A batch whose installing was interrupted by a
   * throwing listener still starts for the cells it has.
   *
   * @param {object[]} targets The cells.
   * @param {Function} source The batch source.
   * @param {object} run The call.
   * @returns {Array<Promise<object>>} The promises, in the order of `targets`.
   */
  #startBatches(targets: Target[], source: AsyncValueBatchSource, run: Run): Promise<AsyncValueResult>[] {
    const results: Promise<AsyncValueResult>[] = [];
    const started = new Map<number, Map<AsyncValueProp, Promise<AsyncValueResult>>>();
    const { batchSize } = run.options;
    let batch: Batch = { controller: new AbortController(), entries: [], cancelled: 0 };

    try {
      targets.forEach(({ physicalRow, prop }) => {
        let row = started.get(physicalRow);
        const known = row?.get(prop);

        // A row listed twice is computed once: a second install would restart the first entry, which would
        // count as a cancelled cell of its batch.
        if (known) {
          results.push(known);

          return;
        }

        const { entry, result } = this.#install({ physicalRow, prop }, run, { kind: 'batch', source });

        if (!row) {
          row = new Map();
          started.set(physicalRow, row);
        }

        row.set(prop, result);
        results.push(result);

        if (entry) {
          entry.batch = batch;
          batch.entries.push(entry);
        }

        if (batch.entries.length === batchSize) {
          this.#launchBatch(batch, source);
          batch = { controller: new AbortController(), entries: [], cancelled: 0 };
        }
      });

    } finally {
      // Also when installing threw, so the cells already pending are computed.
      if (batch.entries.length > 0) {
        this.#launchBatch(batch, source);
      }
    }

    return results;
  }

  /**
   * Queues one call of a batch source for the batch's cells that are still pending when it runs.
   *
   * @param {object} batch The batch.
   * @param {Function} source The batch source.
   */
  #launchBatch(batch: Batch, source: AsyncValueBatchSource): void {
    const launch = new Launch((release) => {
      const live = batch.entries.filter(entry => this.#isPending(entry));

      if (live.length === 0) {
        release();

        return;
      }

      const contexts = live.map(entry => this.#contextOf(entry));
      const request = new Promise<ArrayLike<unknown>>((resolve) => {
        resolve(source(contexts, batch.controller.signal));
      });

      request.then(
        (values) => {
          release();
          this.#distributeBatch(live, values);
        },
        (error) => {
          release();
          live.forEach(entry => this.#onSettled({ entry, outcome: { status: 'rejected', error } }));
        },
      );
    }, () => batch.entries.some(entry => this.#isPending(entry)));

    batch.entries.forEach((entry) => {
      entry.launch = launch;
    });
    this.#queue.push(launch);
  }

  /**
   * Settles a batch's cells from its answer, by index.
   *
   * @param {object[]} entries The cells the batch source was called with.
   * @param {*} values The answer.
   */
  #distributeBatch(entries: AsyncValueEntry[], values: unknown): void {
    if (!isArrayLike(values)) {
      warnOnce(this, 'asyncValues.batchAnswer',
        'The AsyncValues plugin: a batch source resolved with something that is not an array, so every cell ' +
        'of the batch was rejected.');
      entries.forEach(entry => this.#onSettled({ entry, outcome: { status: 'rejected', error: undefined } }));

      return;
    }

    entries.forEach((entry, index) => {
      const value = values[index];

      this.#onSettled({
        entry,
        outcome: index >= values.length || value instanceof Error
          ? { status: 'rejected', error: index >= values.length ? undefined : value }
          : { status: 'resolved', value },
      });
    });
  }

  /**
   * Starts failed cells again: a cell source per cell, and a batch source in batches per source and call.
   *
   * @param {object[]} failed The failed entries, each with an origin.
   * @returns {Array<Promise<object>>} The promises, in the order of `failed`.
   */
  #retry(failed: AsyncValueEntry[]): Promise<AsyncValueResult>[] {
    const results = new Map<AsyncValueEntry, Promise<AsyncValueResult>>();
    const runs = new Map<ResolvedOptions, Run>();
    const batches = new Map<AsyncValueBatchSource, Map<Run, AsyncValueEntry[]>>();

    try {
      failed.forEach((entry) => {
        let run = runs.get(entry.run.options);

        if (!run) {
          run = { options: entry.run.options, live: 0, hasWrites: false };
          runs.set(entry.run.options, run);
        }

        const origin = entry.origin!;

        if (origin.kind === 'cell') {
          results.set(entry, this.#startCell({ physicalRow: rowOf(entry), prop: entry.prop }, origin.source, run));

          return;
        }

        let byRun = batches.get(origin.source);

        if (!byRun) {
          byRun = new Map();
          batches.set(origin.source, byRun);
        }

        const list = byRun.get(run);

        if (list) {
          list.push(entry);

        } else {
          byRun.set(run, [entry]);
        }
      });

      batches.forEach((byRun, source) => {
        byRun.forEach((entries, run) => {
          this.#startBatches(entries.map(entry => ({ physicalRow: rowOf(entry), prop: entry.prop })), source, run)
            .forEach((result, index) => results.set(entries[index], result));
        });
      });

    } finally {
      runs.forEach(run => this.#afterStarting(run));
    }

    return failed.map(entry => results.get(entry)!);
  }

  /**
   * Builds the context a source receives for a cell.
   *
   * @param {object} entry The entry.
   * @returns {object}
   */
  #contextOf(entry: AsyncValueEntry): AsyncValueContext {
    const physicalRow = rowOf(entry);
    const column = this.hot.propToCol(entry.prop);

    return {
      signal: entry.controller!.signal,
      row: this.hot.toVisualRow(physicalRow),
      column: typeof column === 'number' && column >= 0 ? column : null,
      physicalRow,
      prop: entry.prop,
      rowId: this.#rowIdOf(physicalRow),
    };
  }

  /**
   * Queues a settled request for the next flush, unless it is no longer the cell's request.
   *
   * @param {object} settled The settled request.
   */
  #onSettled(settled: SettledRequest): void {
    if (!this.#isPending(settled.entry)) {
      return;
    }

    this.#settled.push(settled);

    if (!this.#cancelFlush) {
      this.#scheduleFlush();
    }
  }

  /**
   * Queues the flush the `flush` setting asks for.
   */
  #scheduleFlush(): void {
    const flush = this.getSetting<AsyncValuesSettings['flush']>('flush');
    const rootWindow = this.hot.rootWindow;
    let cancelled = false;
    const run = () => {
      if (!cancelled) {
        this.#flush();
      }
    };

    this.#cancelFlush = () => {
      cancelled = true;
    };

    if (flush === 'frame') {
      const frame = rootWindow.requestAnimationFrame(run);

      this.#cancelFlush = () => {
        cancelled = true;
        rootWindow.cancelAnimationFrame(frame);
      };

    } else if (typeof flush === 'number') {
      this.hot._registerTimeout(run, flush);

    } else {
      // Not `_registerMicrotask()`: it keeps one record per call for the instance's life, and a column of
      // separate network responses flushes once per response. `#flush` reads nothing after a destroy.
      rootWindow.queueMicrotask(run);
    }
  }

  /**
   * Applies every request that settled since the last flush. Every `beforeAsyncValueResolve` listener
   * runs first, before anything is written, so a listener that moves rows cannot misplace a write. Then
   * the values are written in one call per write source and path, and the grid renders once. A listener
   * that throws fails its own cell with the error it threw, and the error is thrown again at the end.
   */
  readonly #flush = (): void => {
    this.#cancelFlush = null;

    // A settled request can be cancelled between the settle and this flush (an edit in between).
    const settled = this.#settled.filter(({ entry }) => this.#isPending(entry));

    this.#settled = [];

    if (settled.length === 0 || !this.#rowsMap) {
      return;
    }

    const done: SettledRequest[] = [];
    let vetoed: AsyncValueEntry[] = [];
    let failure: { error: unknown } | null = null;

    this.#settlingDepth += 1;

    try {
      const decided = this.#decide(settled);

      vetoed = decided.vetoed;
      failure = decided.failure;
      this.#apply(decided, done);

    } finally {
      done.forEach(this.#settleResult);

      try {
        this.#notifyCleared(vetoed.map(entry => [entry, 'vetoed']));

      } finally {
        try {
          done.forEach(this.#reportSettled);

        } finally {
          this.#settlingDepth -= 1;
          this.#afterSettling();
        }
      }
    }

    if (failure) {
      throw failure.error;
    }
  };

  /**
   * Applies a flush's decisions: takes the vetoed entries off their cells, turns the rejected ones into
   * error states, and writes the resolved values.
   *
   * @param {object} decided The decisions (see `#decide()`).
   * @param {object[]} done Collects the requests that settled.
   */
  #apply(decided: Decisions, done: SettledRequest[]): void {
    decided.vetoed.forEach((entry) => {
      this.#detach(entry);
      this.#finish(entry);
    });
    decided.rejected.forEach((request) => {
      if (this.#isPending(request.entry)) {
        this.#fail(request.entry, request.outcome.status === 'rejected' ? request.outcome.error : undefined);
        done.push(request);
      }
    });

    const writes: Writes = { visible: new Map(), source: new Map() };

    decided.resolved.forEach((request) => {
      if (this.#isPending(request.entry) && request.outcome.status === 'resolved') {
        this.#planWrite(request.entry, request.outcome.value, writes);
        done.push(request);
      }
    });

    this.#write(writes);
  }

  /**
   * Splits a flush's settled requests into rejected, vetoed, and resolved ones, asking every
   * `beforeAsyncValueResolve` listener about the resolved values.
   *
   * @param {object[]} settled The settled requests.
   * @returns {object}
   */
  #decide(settled: SettledRequest[]): Decisions {
    const rejected: SettledRequest[] = [];
    const vetoed: AsyncValueEntry[] = [];
    const resolved: SettledRequest[] = [];
    let failure: { error: unknown } | null = null;

    settled.forEach((request) => {
      const { entry, outcome } = request;

      if (outcome.status === 'rejected') {
        rejected.push(request);

        return;
      }

      try {
        const value = this.#askBeforeResolve(entry, outcome.value);

        if (value === VETOED) {
          if (this.#isPending(entry)) {
            vetoed.push(entry);
          }

        } else {
          resolved.push({ entry, outcome: { status: 'resolved', value } });
        }

      } catch (error) {
        failure ??= { error };
        rejected.push({ entry, outcome: { status: 'rejected', error } });
      }
    });

    return { rejected, vetoed, resolved, failure };
  }

  /**
   * Turns a pending entry into an error state.
   *
   * @param {object} entry The entry.
   * @param {*} error The rejection reason.
   */
  #fail(entry: AsyncValueEntry, error: unknown): void {
    entry.status = 'error';
    entry.controller = null;
    entry.launch = null;
    entry.batch = null;
    entry.error = error;
    entry.message = toErrorMessage(error);
    this.#finish(entry);
    this.#markChanged(entry);
  }

  /**
   * Asks `beforeAsyncValueResolve` about a resolved value.
   *
   * @param {object} entry The entry.
   * @param {*} value The resolved value.
   * @returns {*} The value to write, or `VETOED`.
   */
  #askBeforeResolve(entry: AsyncValueEntry, value: unknown): unknown {
    if (!this.hot.hasHook('beforeAsyncValueResolve')) {
      return value;
    }

    const physicalRow = rowOf(entry);
    const answer = this.hot.runHooks(
      'beforeAsyncValueResolve', value, physicalRow, entry.prop, this.#rowIdOf(physicalRow),
    );

    if (!this.#isPending(entry) || (answer === false && value !== false)) {
      return VETOED;
    }

    return answer === undefined ? value : answer;
  }

  /**
   * Takes a resolved entry off its cell and adds its value to the flush's writes. A call that records an
   * undo step or applies meta keeps the write pending until the grid stores it.
   *
   * @param {object} entry The entry.
   * @param {*} value The value to write.
   * @param {object} writes The flush's writes.
   */
  #planWrite(entry: AsyncValueEntry, value: unknown, writes: Writes): void {
    const { state, prop, run } = entry;
    const physicalRow = state.physicalRow;
    const visualRow = this.hot.toVisualRow(physicalRow);

    if (run.options.undo === 'record' || run.options.meta) {
      state.writes.set(prop, {
        run, oldValue: detachValue(this.hot.getSourceDataAtCell(physicalRow, prop)), landed: false,
      });
      run.hasWrites = true;
    }

    this.#deleteEntry(entry);
    entry.controller = null;
    entry.launch = null;
    this.#finish(entry);
    this.#markChanged(entry);

    if (visualRow === null) {
      pushChange(writes.source, run.options.source, [physicalRow, prop, value]);

    } else {
      pushChange(writes.visible, run.options.source, [visualRow, prop, value]);
    }
  }

  /**
   * Writes a flush's values without recording them for undo, and renders once. A source write refreshes
   * the open editor's value (core does it for every `setSourceDataAtCell()`), so what the user is typing
   * is put back after it.
   *
   * @param {object} writes The flush's writes.
   */
  #write(writes: Writes): void {
    const editor = writes.source.size > 0 ? this.hot.getActiveEditor() : undefined;
    const typing = editor?.isOpened() ? editor.getValue() : undefined;

    this.hot.suspendRender();

    try {
      this.hot._getOperationScope().suppress(() => {
        writes.visible.forEach((changes, source) => {
          this.hot.setDataAtRowProp(changes, '', '', source);
        });
        writes.source.forEach((changes, source) => {
          this.hot.setSourceDataAtCell(changes, '', undefined, source);
        });
      });

      if (editor && typing !== undefined && editor.isOpened()) {
        editor.setValue(typing);
      }

      this.hot.render();

    } finally {
      this.hot.resumeRender();
    }
  }

  /**
   * Resolves the promise the caller of a settled request holds.
   *
   * @param {object} settled The settled request.
   */
  readonly #settleResult = ({ entry, outcome }: SettledRequest): void => {
    entry.settle(outcome.status === 'resolved'
      ? { status: 'resolved', value: outcome.value }
      : { status: 'rejected', error: entry.error, message: entry.message });
  };

  /**
   * Fires the hook of a settled request. A rejection on the cell the user is on is announced, because
   * its message is not part of the cell's visible text.
   *
   * @param {object} settled The settled request.
   */
  readonly #reportSettled = ({ entry, outcome }: SettledRequest): void => {
    const physicalRow = rowOf(entry);
    const rowId = this.#rowIdOf(physicalRow);

    if (outcome.status === 'resolved') {
      this.hot.runHooks('afterAsyncValueResolve', physicalRow, entry.prop, outcome.value, rowId);

      return;
    }

    // The write of another result in the same flush can clear the error already (a `dependsOn` change);
    // then there is no error state to report.
    if (!this.#entries.has(entry)) {
      return;
    }

    if (entry.message !== '' && this.#isActiveCell(entry) && this.hot.getSettings().ariaTags &&
        this.hot.isListening()) {
      announce(entry.message, 'polite');
    }

    this.hot.runHooks('afterAsyncValueReject', physicalRow, entry.prop, entry.error, entry.message, rowId);
  };

  /**
   * Counts a pending entry as done for its call and the pending count.
   *
   * @param {object} entry The entry.
   */
  #finish(entry: AsyncValueEntry): void {
    if (entry.finished) {
      return;
    }

    entry.finished = true;
    this.#pendingCount -= 1;
    entry.run.live -= 1;

    if (entry.run.live === 0 && entry.run.hasWrites) {
      const run = entry.run;

      // A macrotask later, so a write a quick asynchronous validator delays has landed first.
      this.hot._registerTimeout(() => this.#finalizeRun(run), 0);
    }
  }

  /**
   * Runs what follows any settle: reports an idle grid. Waits for the outermost flush.
   */
  #afterSettling(): void {
    if (this.#settlingDepth > 0) {
      return;
    }

    if (this.#busy && this.#pendingCount === 0) {
      this.#busy = false;
      this.hot.runHooks('afterAsyncValuesIdle');
    }
  }

  /**
   * Finalizes a finished call: forgets its pending writes and, with `undo: 'record'`, journals the ones
   * that landed as one undo step. The step is journaled directly, without writing, so nothing is written
   * again: no open editor is reset and no listener sees the values go back and forth.
   *
   * @param {object} run The call.
   */
  #finalizeRun(run: Run): void {
    if (!this.#rowsMap || this.hot.isDestroyed) {
      return;
    }

    const changes: Array<{ physicalRow: number; prop: AsyncValueProp; oldValue: unknown; newValue: unknown }> = [];

    [...this.#states].forEach((state) => {
      state.writes.forEach((write, prop) => {
        if (write.run !== run) {
          return;
        }

        state.writes.delete(prop);

        const current = this.hot.getSourceDataAtCell(state.physicalRow, prop);

        if (write.landed && run.options.undo === 'record' && !Object.is(current, write.oldValue)) {
          changes.push({
            physicalRow: state.physicalRow, prop, oldValue: write.oldValue, newValue: detachValue(current),
          });
        }
      });

      this.#releaseRowState(state);
    });

    if (changes.length > 0) {
      const scope = this.hot._getOperationScope();

      scope.run('async_values', run.options.source, () => {
        changes.forEach(change => recordCellChange(scope, change));
      });
    }
  }

  /**
   * Tells whether an entry's cell is the selection's active cell.
   *
   * @param {object} entry The entry.
   * @returns {boolean}
   */
  #isActiveCell(entry: AsyncValueEntry): boolean {
    const highlight = this.hot.getSelectedRangeActive()?.highlight;

    return !!highlight &&
      highlight.row === this.hot.toVisualRow(rowOf(entry)) &&
      highlight.col === this.hot.propToCol(entry.prop);
  }

  /**
   * Removes an entry and fires its cancel hook (see `#detach()` and `#notifyCleared()`).
   *
   * @param {object} entry The entry.
   * @param {string} reason Why the entry is removed.
   */
  #clear(entry: AsyncValueEntry, reason: AsyncValueCancelReason): void {
    this.#detach(entry);
    this.#notifyCleared([[entry, reason]]);
  }

  /**
   * Removes an entry from its cell, without running any host code. The request is aborted later, in
   * `#notifyCleared()`, because `abort()` runs the source's own `abort` listeners.
   *
   * @param {object} entry The entry.
   */
  #detach(entry: AsyncValueEntry): void {
    this.#deleteEntry(entry);
    this.#markChanged(entry);
  }

  /**
   * Aborts detached pending requests and reports them as cancelled. A detached error state reports
   * nothing. Every promise settles before the first hook runs, so a throwing listener cannot leave
   * another caller's promise pending.
   *
   * @param {Array} cleared The detached entries, each with the reason it was removed.
   */
  #notifyCleared(cleared: Array<[AsyncValueEntry, AsyncValueCancelReason]>): void {
    const cancelled = cleared.filter(([entry]) => entry.status === 'pending' && !entry.reported);

    if (cancelled.length === 0) {
      this.#afterSettling();

      return;
    }

    try {
      cancelled.forEach(([entry, reason]) => {
        const controller = entry.controller;

        entry.controller = null;
        entry.reported = true;
        this.#finish(entry);
        entry.settle({ status: 'cancelled', reason });
        controller?.abort();
        this.#releaseSlot(entry);
      });
      cancelled.forEach(([entry, reason]) => {
        const physicalRow = rowOf(entry);

        this.hot.runHooks('afterAsyncValueCancel', physicalRow, entry.prop, reason, this.#rowIdOf(physicalRow));
      });

    } finally {
      this.#afterSettling();
    }
  }

  /**
   * Gives back the concurrency slot of a cancelled cell's source when the source has no cell left, and
   * aborts a batch whose cells were all cancelled.
   *
   * @param {object} entry The cancelled entry.
   */
  #releaseSlot(entry: AsyncValueEntry): void {
    const { batch, launch } = entry;

    if (batch) {
      batch.cancelled += 1;

      if (batch.cancelled === batch.entries.length) {
        batch.controller.abort();
      }
    }

    if (launch?.isStarted() && !launch.isLive()) {
      launch.release();
    }
  }

  /**
   * Removes every entry.
   *
   * @param {string} reason Why the entries are removed.
   */
  #clearAll(reason: AsyncValueCancelReason): void {
    const entries = [...this.#entries];

    entries.forEach(entry => this.#detach(entry));
    this.#notifyCleared(entries.map(entry => [entry, reason]));
  }

  /**
   * Tells whether an entry is still the pending request of its cell.
   *
   * @param {object} entry The entry.
   * @returns {boolean}
   */
  #isPending(entry: AsyncValueEntry): boolean {
    return entry.status === 'pending' && this.#entries.has(entry);
  }

  /**
   * Lists the cells whose entries have a status.
   *
   * @param {string} status The status.
   * @returns {object[]}
   */
  #listCells(status: AsyncValueStatus): AsyncCellInfo[] {
    return [...this.#entries]
      .filter(entry => entry.status === status)
      .map(entry => ({ physicalRow: rowOf(entry), prop: entry.prop, rowId: this.#rowIdOf(rowOf(entry)) }));
  }

  /**
   * Returns the entry of a cell, by physical row and property.
   *
   * @param {number} physicalRow Physical row index.
   * @param {string|number} prop The column property.
   * @returns {object|undefined}
   */
  #getEntry(physicalRow: number, prop: AsyncValueProp): AsyncValueEntry | undefined {
    if (this.#entries.size === 0 || !this.#rowsMap) {
      return undefined;
    }

    return this.#rowsMap.getValueAtIndex<RowState | null>(physicalRow)?.entries.get(prop);
  }

  /**
   * Returns the entry of a cell, by any reference.
   *
   * @param {object} cell The cell.
   * @returns {object|undefined}
   */
  #getEntryAtRef(cell: AsyncCellRef): AsyncValueEntry | undefined {
    if (this.#entries.size === 0) {
      return undefined;
    }

    const target = this.#resolveCell(cell);

    return target ? this.#getEntry(target.physicalRow, target.prop) : undefined;
  }

  /**
   * Returns the state of a row, creating it.
   *
   * @param {number} physicalRow Physical row index.
   * @returns {object}
   */
  #getRowState(physicalRow: number): RowState {
    const rowsMap = this.#rowsMap!;
    let state = rowsMap.getValueAtIndex<RowState | null>(physicalRow);

    if (!state) {
      state = { physicalRow, entries: new Map(), writes: new Map() };
      rowsMap.setValueAtIndex(physicalRow, state);
      this.#states.add(state);
    }

    return state;
  }

  /**
   * Drops a row's state once it holds nothing.
   *
   * @param {object} state The row state.
   */
  #releaseRowState(state: RowState): void {
    if (state.entries.size > 0 || state.writes.size > 0) {
      return;
    }

    this.#states.delete(state);

    // While a row insert or removal is reported, `physicalRow` can be stale; `#syncRows()` drops the
    // empty state from the map then.
    if (this.#rowsMap?.getValueAtIndex(state.physicalRow) === state) {
      this.#rowsMap.setValueAtIndex(state.physicalRow, null);
    }
  }

  /**
   * Stores an entry in its row.
   *
   * @param {object} entry The entry.
   */
  #setEntry(entry: AsyncValueEntry): void {
    entry.state.entries.set(entry.prop, entry);
    this.#entries.add(entry);

    if (entry.status === 'pending') {
      this.#pendingCount += 1;
      this.#busy = true;
    }
  }

  /**
   * Removes an entry from its row, and the row's state once it is empty.
   *
   * @param {object} entry The entry.
   */
  #deleteEntry(entry: AsyncValueEntry): void {
    if (entry.state.entries.get(entry.prop) === entry) {
      entry.state.entries.delete(entry.prop);
    }

    this.#entries.delete(entry);
    this.#releaseRowState(entry.state);
  }

  /**
   * Marks an entry's cell for the next paint under `renderMode: 'onChange'`: the state is plugin
   * state, which the paint stamps cannot see.
   *
   * @param {object} entry The entry.
   */
  #markChanged(entry: AsyncValueEntry): void {
    const row = this.hot.toVisualRow(rowOf(entry));
    const column = this.hot.propToCol(entry.prop);

    if (row !== null && typeof column === 'number' && column >= 0) {
      this.hot.markCellChanged(row, column);
    }
  }

  /**
   * Drops row states that no row holds any more, cancelling their requests.
   *
   * @param {Set} kept The states the map still holds.
   */
  #dropRowStates(kept: Set<RowState>): void {
    const lost: Array<[AsyncValueEntry, AsyncValueCancelReason]> = [];

    [...this.#states].forEach((state) => {
      if (!kept.has(state)) {
        this.#states.delete(state);
        state.entries.forEach((entry) => {
          this.#entries.delete(entry);
          lost.push([entry, 'rowRemoved']);
        });
      }
    });

    this.#notifyCleared(lost);
  }

  /**
   * `afterCreateRow` and `afterRemoveRow` hook callback. The index map shifted its values, so the
   * physical row of every row state is read again from it, and a state the map no longer holds belonged
   * to a removed row. Comparing against the map, rather than stashing the rows in `beforeRemoveRow`,
   * holds for a removal another listener vetoed, widened, or nested inside its own.
   */
  readonly #syncRows = (): void => {
    if (this.#states.size === 0 || !this.#rowsMap || this.#replacingData) {
      return;
    }

    const rowsMap = this.#rowsMap;
    const kept = new Set<RowState>();

    (rowsMap.getValues() as Array<RowState | null>).forEach((state, physicalRow) => {
      if (!state) {
        return;
      }

      state.physicalRow = physicalRow;

      if (state.entries.size === 0 && state.writes.size === 0) {
        rowsMap.setValueAtIndex(physicalRow, null);

      } else {
        kept.add(state);
      }
    });

    this.#dropRowStates(kept);
  };

  /**
   * The row index mapper's `init` local hook. A data load re-initializes it and puts the states back
   * from `after*Data`. Outside a load (`updateSettings()` with `columns` or `dataSchema`) the data and its
   * physical rows stay, so every row state (its requests and pending writes) is put back on its row.
   */
  readonly #onRowIndexInit = (): void => {
    const rowsMap = this.#rowsMap;

    if (this.#replacingData || !rowsMap || this.#states.size === 0) {
      return;
    }

    const kept = new Set<RowState>();

    this.#states.forEach((state) => {
      if (state.physicalRow < rowsMap.getLength()) {
        rowsMap.setValueAtIndex(state.physicalRow, state);
        kept.add(state);
      }
    });

    this.#dropRowStates(kept);
  };

  /**
   * Cancels the request of the cell a change wrote, and the requests and errors of the cells that depend
   * on it. A change made with a call's own source lands that call's pending write; any other change to a
   * cell with a pending write drops the write (the change is a step of its own).
   *
   * @param {number} physicalRow Physical row index of the changed cell.
   * @param {string|number} prop The property of the changed cell.
   * @param {string|undefined} source The source of the change.
   * @returns {boolean} `true` when an entry was removed.
   */
  #onCellChanged(physicalRow: number, prop: AsyncValueProp, source: string | undefined): boolean {
    const state = this.#rowsMap?.getValueAtIndex<RowState | null>(physicalRow);

    if (!state) {
      return false;
    }

    this.#landWrite(state, prop, source);

    const own = state.entries.get(prop);
    const dependents = [...state.entries.values()]
      .filter(entry => entry !== own && entry.run.options.dependsOn.includes(prop));

    if (own) {
      this.#detach(own);
    }

    dependents.forEach(entry => this.#detach(entry));
    this.#notifyCleared([
      ...(own ? [[own, 'edit'] as [AsyncValueEntry, AsyncValueCancelReason]] : []),
      ...dependents.map(entry => [entry, 'dependency'] as [AsyncValueEntry, AsyncValueCancelReason]),
    ]);

    return own !== undefined || dependents.length > 0;
  }

  /**
   * Lands a call's pending write when the change carries the call's source, or drops it for any other
   * change. A landed write gets the call's `meta`.
   *
   * @param {object} state The row state.
   * @param {string|number} prop The property of the changed cell.
   * @param {string|undefined} source The source of the change.
   */
  #landWrite(state: RowState, prop: AsyncValueProp, source: string | undefined): void {
    const write = state.writes.get(prop);

    if (!write) {
      return;
    }

    if (write.landed || source !== write.run.options.source) {
      state.writes.delete(prop);
      this.#releaseRowState(state);

      return;
    }

    const { meta, undo } = write.run.options;
    const row = this.hot.toVisualRow(state.physicalRow);
    const column = this.hot.propToCol(prop);

    write.landed = true;

    if (meta && row !== null && typeof column === 'number' && column >= 0) {
      this.hot._getOperationScope().suppress(() => {
        Object.keys(meta).forEach(key => this.hot.setCellMeta(row, column, key, meta[key]));
      });
    }

    if (undo !== 'record') {
      state.writes.delete(prop);
      this.#releaseRowState(state);
    }
  }

  /**
   * Cancels the requests a list of changes affects, and renders when one was cancelled.
   *
   * @param {Array} changes The changes, as `[physicalRow, prop]` pairs.
   * @param {string|undefined} source The source of the changes.
   */
  #onCellsChanged(changes: Array<[number | null, unknown]>, source: string | undefined): void {
    let changed = false;

    changes.forEach(([physicalRow, prop]) => {
      if (physicalRow !== null && isProp(prop)) {
        changed = this.#onCellChanged(physicalRow, prop, source) || changed;
      }
    });

    if (changed) {
      this.hot.render();
    }
  }

  /**
   * `afterChange` hook callback. A write through the visual API cancels the cell's request.
   *
   * @param {Array} changes The changes (visual rows).
   * @param {string} source The source of the changes.
   */
  readonly #onAfterChange = (changes: CellChange[] | null, source: string): void => {
    if (!changes || this.#states.size === 0) {
      return;
    }

    this.#onCellsChanged(changes.map(([row, prop]) => [this.hot.toPhysicalRow(row), prop]), source);
  };

  /**
   * `afterSetSourceDataAtCell` hook callback. A source write (an undo or redo replays through it)
   * cancels the cell's request.
   *
   * @param {Array} changes The changes (physical rows).
   * @param {string} [source] The source of the changes.
   */
  readonly #onAfterSetSourceDataAtCell = (changes: CellChange[], source?: string): void => {
    if (this.#states.size === 0) {
      return;
    }

    this.#onCellsChanged(changes.map(([row, prop]) => [row, prop]), source);
  };

  /**
   * `afterCreateCol` hook callback. See `#onColumnsShifted()`.
   *
   * @param {number} index Visual index of the first inserted column.
   * @param {number} amount The number of inserted columns.
   */
  readonly #onAfterCreateCol = (index: number, amount: number): void => {
    const physicalColumn = this.hot.toPhysicalColumn(index);

    // `amount` is 0 when `maxCols` stopped the insert; a `null` column means it appended past the end.
    if (amount > 0 && physicalColumn !== null) {
      this.#onColumnsShifted(physicalColumn);
    }
  };

  /**
   * `afterRemoveCol` hook callback. See `#onColumnsShifted()`.
   *
   * @param {number} index Visual index of the first removed column.
   * @param {number} amount The number of removed columns.
   * @param {number[]} physicalColumns Physical indexes of the removed columns.
   */
  readonly #onAfterRemoveCol = (index: number, amount: number, physicalColumns: number[]): void => {
    if (physicalColumns.length > 0) {
      this.#onColumnsShifted(physicalColumns.reduce((min, column) => Math.min(min, column), Infinity));
    }
  };

  /**
   * A column insert or removal shifts the properties of array data, which are column indexes, so the
   * entries keyed by an index at or after the change are removed. String properties are stable.
   *
   * @param {number} firstShifted The first physical column index the change shifted.
   */
  #onColumnsShifted(firstShifted: number): void {
    if (this.#entries.size === 0) {
      return;
    }

    const shifted = [...this.#entries]
      .filter(entry => typeof entry.prop === 'number' && entry.prop >= firstShifted);

    if (shifted.length > 0) {
      shifted.forEach(entry => this.#detach(entry));
      this.#notifyCleared(shifted.map(entry => [entry, 'columnsChanged']));
      this.hot.render();
    }
  }

  /**
   * `beforeLoadData` and `beforeUpdateData` hook callback. Captures every row state, with its row id, so
   * `after*Data` can put it back on the row that holds the same record.
   */
  readonly #onBeforeDataReplaced = (): void => {
    this.#replacingData = true;
    this.#replacedRows = [...this.#states].map(state => ({ state, rowId: this.#rowIdOf(state.physicalRow) }));

    // A load that throws never reaches `after*Data`, so the flag is cleared and the states it orphaned
    // are dropped once the load's task ends.
    this.hot.rootWindow.queueMicrotask(() => {
      if (this.#replacingData && this.enabled) {
        this.#onDataReplaced(true);
      }
    });
  };

  /**
   * `afterLoadData` hook callback.
   */
  readonly #onAfterLoadData = (): void => {
    this.#onDataReplaced(true);
  };

  /**
   * `afterUpdateData` hook callback.
   */
  readonly #onAfterUpdateData = (): void => {
    this.#onDataReplaced(false);
  };

  /**
   * Puts the captured row states back after a data replacement (see `#targetRowOf()`). A request whose
   * row is not found is cancelled, and the pending writes of its row are dropped.
   *
   * @param {boolean} isLoad Whether the data was replaced with `loadData()`.
   */
  #onDataReplaced(isLoad: boolean): void {
    const rowsMap = this.#rowsMap;
    const replaced = this.#replacedRows;

    this.#replacingData = false;
    this.#replacedRows = [];

    if (!rowsMap || replaced.length === 0) {
      return;
    }

    const length = rowsMap.getLength();
    const kept = new Set<RowState>();
    const lostReasons = new Map<RowState, AsyncValueCancelReason>();

    replaced.forEach(({ state }) => {
      if (rowsMap.getValueAtIndex(state.physicalRow) === state) {
        rowsMap.setValueAtIndex(state.physicalRow, null);
      }
    });
    replaced.forEach((row) => {
      const target = this.#targetRowOf(row, isLoad);

      if (target === null || target >= length || rowsMap.getValueAtIndex(target) !== null) {
        lostReasons.set(row.state, isLoad && !this.#hasId(row) ? 'dataReplaced' : 'rowRemoved');

        return;
      }

      rowsMap.setValueAtIndex(target, row.state);
      row.state.physicalRow = target;
      kept.add(row.state);
    });

    this.#dropReplacedRowStates(kept, lostReasons);
    this.hot.markAllCellsChanged();
  }

  /**
   * Tells whether a captured row had an id.
   *
   * @param {object} row The captured row.
   * @returns {boolean}
   */
  #hasId(row: ReplacedRow): boolean {
    return row.rowId !== null && row.rowId !== undefined;
  }

  /**
   * Returns the physical row a captured row state belongs on after a data replacement: the row that holds
   * the same id now, or, without ids, the same physical row for `updateData()` (as it keeps cell meta) and
   * none for `loadData()` (a new dataset).
   *
   * @param {object} row The captured row.
   * @param {boolean} isLoad Whether the data was replaced with `loadData()`.
   * @returns {number|null}
   */
  #targetRowOf(row: ReplacedRow, isLoad: boolean): number | null {
    if (this.#hasId(row)) {
      return this.hot.getPhysicalRowById(row.rowId);
    }

    return isLoad ? null : row.state.physicalRow;
  }

  /**
   * Drops the row states a data replacement did not place, cancelling their requests.
   *
   * @param {Set} kept The placed states.
   * @param {Map} reasons The cancel reason of each state not placed.
   */
  #dropReplacedRowStates(kept: Set<RowState>, reasons: Map<RowState, AsyncValueCancelReason>): void {
    const lost: Array<[AsyncValueEntry, AsyncValueCancelReason]> = [];

    reasons.forEach((reason, state) => {
      if (!kept.has(state)) {
        this.#states.delete(state);
        state.entries.forEach((entry) => {
          this.#entries.delete(entry);
          lost.push([entry, reason]);
        });
      }
    });

    this.#notifyCleared(lost);
  }

  /**
   * `afterGetCellMeta` hook callback. Reports the cell's state in its meta.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} cellProperties The cell meta object.
   */
  readonly #onAfterGetCellMeta = (row: number, column: number, cellProperties: CellProperties): void => {
    const physicalRow = this.#entries.size === 0 ? null : this.hot.toPhysicalRow(row);
    const entry = physicalRow === null ? undefined : this.#getEntry(physicalRow, cellProperties.prop);

    if (entry) {
      cellProperties.asyncState = entry.status;
      cellProperties.asyncError = entry.status === 'error' ? entry.message : null;

    } else if (hasOwnProperty(cellProperties, 'asyncState') && cellProperties.asyncState !== null) {
      cellProperties.asyncState = null;
      cellProperties.asyncError = null;
    }
  };

  /**
   * `beforeCopy` hook callback. With `copyPendingAs: 'empty'`, a pending cell is copied as an empty value.
   * Walks the pending cells rather than the copied ones, so a large copy costs nothing extra.
   *
   * @param {Array[]} data The copied data.
   * @param {object[]} coords The copied ranges (visual).
   */
  readonly #onBeforeCopy = (data: unknown[][], coords: Array<Record<string, number>>): void => {
    if (this.#pendingCount === 0 || this.getSetting('copyPendingAs') !== 'empty') {
      return;
    }

    const { rows, columns } = readCopiedAxes(coords);
    const rowIndexes = new Map(rows.map((row, index) => [row, index]));
    const columnIndexes = new Map(columns.map((column, index) => [column, index]));

    this.#entries.forEach((entry) => {
      if (entry.status !== 'pending') {
        return;
      }

      const rowIndex = rowIndexes.get(this.hot.toVisualRow(rowOf(entry)) ?? -1);
      const columnIndex = columnIndexes.get(this.hot.propToCol(entry.prop) as number);

      if (rowIndex !== undefined && columnIndex !== undefined && data[rowIndex]) {
        data[rowIndex][columnIndex] = '';
      }
    });
  };

  /**
   * `afterRenderer` hook callback. Decorates a pending or failed cell, and takes the decoration off a
   * recycled cell element.
   *
   * @param {HTMLTableCellElement} TD The rendered cell element.
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string|number} prop The column property.
   * @param {*} value The cell value.
   * @param {object} cellProperties The cell meta object.
   */
  readonly #onAfterRenderer = (
    TD: HTMLTableCellElement, row: number, column: number, prop: string | number, value: unknown,
    cellProperties: CellProperties,
  ): void => {
    const physicalRow = this.#entries.size === 0 ? null : this.hot.toPhysicalRow(row);
    const entry = physicalRow === null ? undefined : this.#getEntry(physicalRow, prop);

    undecorateCell(TD);

    if (entry) {
      decorateCell(TD, entry.status, entry.message, !!cellProperties.ariaTags);
    }
  };
}
