import { BasePlugin } from '../base';
import { addClass, removeAttribute, setAttribute } from '../../helpers/dom/element';
import { hasOwnProperty } from '../../helpers/object';
import { throwWithCause } from '../../helpers/errors';
import { A11Y_BUSY, A11Y_INVALID } from '../../helpers/a11y';
import type { CellChange, CellProperties } from '../../settings';
import type { PhysicalIndexToValueMap } from '../../translations';
import type {
  AsyncValueCancelReason,
  AsyncValueContext,
  AsyncValueOptions,
  AsyncValueResult,
  AsyncValueSource,
  AsyncValueState,
  AsyncValueStatus,
} from './types';

export const PLUGIN_KEY = 'asyncValues';
export const PLUGIN_PRIORITY = 340;

/**
 * The source the plugin writes a resolved value with.
 */
export const ASYNC_VALUES_SOURCE = 'AsyncValues.resolve';

/**
 * The class of a cell whose request is pending.
 */
export const PENDING_CLASS_NAME = 'htAsyncPending';

/**
 * The class of a cell whose request failed.
 */
export const ERROR_CLASS_NAME = 'htAsyncError';

/**
 * The class of the pending indicator element.
 */
export const INDICATOR_CLASS_NAME = 'htAsyncIndicator';

/**
 * Marks a cell element the plugin decorated, and holds the `title` the plugin wrote on it, so the
 * decoration can be taken off a recycled element without touching a `title` a renderer wrote.
 */
const DECORATION_ATTRIBUTE = 'data-ht-async';

/**
 * One cell's request, or the error a failed request left behind.
 */
interface AsyncValueEntry {
  status: AsyncValueStatus;
  physicalRow: number;
  prop: string | number;
  controller: AbortController | null;
  dependsOn: Array<string | number>;
  error: unknown;
  message: string;
  settle: (result: AsyncValueResult) => void;
}

/**
 * A settled request waiting for the next flush.
 */
interface SettledRequest {
  entry: AsyncValueEntry;
  outcome: { status: 'resolved'; value: unknown } | { status: 'rejected'; error: unknown };
}

/**
 * The entries of one row, keyed by the column property.
 */
type RowEntries = Map<string | number, AsyncValueEntry>;

/**
 * Turns a rejection reason into the message shown on the cell.
 *
 * @param {*} error The rejection reason.
 * @returns {string}
 */
function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return error === undefined || error === null ? '' : String(error);
}

/**
 * @plugin AsyncValues
 * @class AsyncValues
 *
 * @description
 * The AsyncValues plugin lets you compute a cell's value asynchronously, from a promise. While a
 * request is pending, the cell shows a pending indicator. When the promise resolves, the plugin
 * writes the value into the cell. When it rejects, the cell keeps its previous value and shows an
 * error state with the rejection message.
 *
 * A pending request is cancelled, and its `AbortSignal` aborted, when:
 * - the cell's value changes (an edit, a paste, an autofill, an undo, or an API write),
 * - the value of a cell listed in `dependsOn` changes,
 * - a new request starts for the same cell,
 * - the row is removed, or the data is replaced.
 *
 * A late result of a cancelled request is ignored. Requests are tied to the row's physical index, so
 * sorting, filtering, or moving rows while a request is pending still lands the result on the right
 * record.
 *
 * The plugin writes a resolved value with the `'AsyncValues.resolve'` source, and the write is not
 * added to the undo history. A cell's state is available in its cell meta as `asyncState`
 * (`'pending'`, `'error'`, or `null`) and `asyncError` (the error message, or `null`).
 *
 * To enable the plugin, set the {@link Options#asyncValues} option to `true`.
 *
 * @example
 *
 * ::: only-for javascript
 * ```js
 * const hot = new Handsontable(container, {
 *   data: [{ sku: 'A-100', name: null }],
 *   columns: [{ data: 'sku' }, { data: 'name' }],
 *   asyncValues: true,
 * });
 *
 * const asyncValues = hot.getPlugin('asyncValues');
 *
 * asyncValues.setAsyncValue(0, 1, async({ signal }) => {
 *   const response = await fetch(`/api/products/${hot.getDataAtCell(0, 0)}`, { signal });
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
 *   data={[{ sku: 'A-100', name: null }]}
 *   columns={[{ data: 'sku' }, { data: 'name' }]}
 *   asyncValues={true}
 * />
 *
 * const asyncValues = hotRef.current.hotInstance.getPlugin('asyncValues');
 *
 * asyncValues.setAsyncValue(0, 1, ({ signal }) => fetchProductName('A-100', signal), {
 *   dependsOn: ['sku'],
 * });
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * gridSettings = {
 *   data: [{ sku: 'A-100', name: null }],
 *   columns: [{ data: 'sku' }, { data: 'name' }],
 *   asyncValues: true,
 * };
 *
 * const asyncValues = this.hotTable.hotInstance.getPlugin('asyncValues');
 *
 * asyncValues.setAsyncValue(0, 1, ({ signal }) => fetchProductName('A-100', signal), {
 *   dependsOn: ['sku'],
 * });
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
   * The entries of every row, by physical row index. The index mapper shifts the values on a row
   * insert and removal. The map is listed as derived in the undo snapshot, so an undo never brings a
   * pending request or an error back.
   */
  #rowsMap: PhysicalIndexToValueMap | null = null;

  /**
   * Every entry in `#rowsMap`, for the walks that do not start from a cell.
   */
  #entries = new Set<AsyncValueEntry>();

  /**
   * The settled requests waiting for the next flush.
   */
  #settled: SettledRequest[] = [];

  /**
   * Whether a flush is queued.
   */
  #flushQueued = false;

  /**
   * The entries of the rows a pending removal takes, held between `beforeRemoveRow` and
   * `afterRemoveRow`, so a vetoed removal cancels nothing.
   */
  #removedRowsEntries: AsyncValueEntry[] = [];

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
    this.addHook('afterChange', this.#onAfterChange);
    this.addHook('afterSetSourceDataAtCell', this.#onAfterSetSourceDataAtCell);
    this.addHook('afterCreateRow', this.#syncPhysicalRows);
    this.addHook('beforeRemoveRow', this.#onBeforeRemoveRow);
    this.addHook('afterRemoveRow', this.#onAfterRemoveRow);
    this.addHook('afterCreateCol', this.#onColumnsChange);
    this.addHook('afterRemoveCol', this.#onColumnsChange);
    this.addHook('afterLoadData', this.#onDataReplaced);
    this.addHook('afterUpdateData', this.#onDataReplaced);

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state. This method is executed when `updateSettings()` is invoked with the
   * `asyncValues` option.
   */
  updatePlugin(): void {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance. Cancels every pending request
   * and clears every error state.
   */
  disablePlugin(): void {
    if (this.#entries.size > 0) {
      this.#clearAll('disabled');

      // The decoration is taken off by `afterRenderer`, so it has to paint once before the hook goes.
      this.hot.markAllCellsChanged();
      this.hot.render();
    }

    this.#settled = [];
    this.#removedRowsEntries = [];

    if (this.#rowsMap) {
      this.hot.rowIndexMapper.unregisterMap(this.pluginName!);
      this.#rowsMap = null;
    }

    super.disablePlugin();
  }

  /**
   * Starts an asynchronous computation of a cell's value.
   *
   * The cell shows the pending state until the request settles. A request already pending for the
   * cell is cancelled first, and an error state is cleared.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {Function|Promise} source A function that returns a promise of the value, or the promise
   * itself. The function receives an object with the `signal` (an `AbortSignal`), `row`, `column`,
   * `physicalRow`, and `prop` of the cell.
   * @param {object} [options] The request options.
   * @param {Array} [options.dependsOn] The properties of the columns, in the same row, whose change
   * cancels the request.
   * @fires Hooks#afterAsyncValueStart
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
    const result = this.#start(row, column, source, options);

    this.hot.render();

    return result;
  }

  /**
   * Starts an asynchronous computation for every cell of a range. The `source` function is called
   * once per cell.
   *
   * @param {number} rowFrom Visual index of the first row.
   * @param {number} columnFrom Visual index of the first column.
   * @param {number} rowTo Visual index of the last row.
   * @param {number} columnTo Visual index of the last column.
   * @param {Function} source A function that returns a promise of a cell's value. It receives an
   * object with the `signal` (an `AbortSignal`), `row`, `column`, `physicalRow`, and `prop` of the cell.
   * @param {object} [options] The request options, shared by every cell (see {@link AsyncValues#setAsyncValue}).
   * @fires Hooks#afterAsyncValueStart
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
    const results: Promise<AsyncValueResult>[] = [];

    for (let row = Math.min(rowFrom, rowTo); row <= Math.max(rowFrom, rowTo); row++) {
      for (let column = Math.min(columnFrom, columnTo); column <= Math.max(columnFrom, columnTo); column++) {
        results.push(this.#start(row, column, source, options));
      }
    }

    this.hot.render();

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
    const entry = this.#getEntryAt(row, column);

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
   * Returns the state of a cell: `{ status: 'pending' }`, `{ status: 'error', error, message }`, or
   * `null` when the cell has no pending request and no error.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {object|null}
   */
  getAsyncState(row: number, column: number): AsyncValueState | null {
    const entry = this.#getEntryAt(row, column);

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
    return this.#getEntryAt(row, column)?.status === 'pending';
  }

  /**
   * Destroys the plugin instance.
   */
  destroy(): void {
    this.#entries.forEach(entry => entry.controller?.abort());
    this.#entries.clear();
    this.#settled = [];
    this.#removedRowsEntries = [];
    this.#rowsMap = null;

    super.destroy();
  }

  /**
   * Starts a request for one cell, without rendering.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {Function|Promise} source The value source.
   * @param {object} options The request options.
   * @returns {Promise<object>}
   */
  #start(
    row: number,
    column: number,
    source: AsyncValueSource,
    options: AsyncValueOptions,
  ): Promise<AsyncValueResult> {
    if (!this.enabled || !this.#rowsMap) {
      throwWithCause('The AsyncValues plugin is not enabled.');
    }

    const physicalRow = this.hot.toPhysicalRow(row);
    const prop = this.hot.colToProp(column);

    if (physicalRow === null || physicalRow < 0 || (typeof prop !== 'string' && typeof prop !== 'number')) {
      throwWithCause(`The cell (${row}, ${column}) cannot hold an async value.`);
    }

    const previous = this.#getEntry(physicalRow, prop);

    if (previous) {
      this.#clear(previous, 'restart');
    }

    const controller = new AbortController();
    let settle: (result: AsyncValueResult) => void = () => {};
    const result = new Promise<AsyncValueResult>((resolve) => {
      settle = resolve;
    });
    const entry: AsyncValueEntry = {
      status: 'pending',
      physicalRow,
      prop,
      controller,
      dependsOn: [...(options.dependsOn ?? [])],
      error: null,
      message: '',
      settle,
    };

    this.#setEntry(entry);
    this.#markChanged(entry);
    this.hot.runHooks('afterAsyncValueStart', physicalRow, prop);

    let request: PromiseLike<unknown>;

    try {
      request = typeof source === 'function'
        ? source({ signal: controller.signal, row, column, physicalRow, prop })
        : source;

    } catch (error) {
      request = Promise.reject(error);
    }

    Promise.resolve(request).then(
      value => this.#onSettled({ entry, outcome: { status: 'resolved', value } }),
      error => this.#onSettled({ entry, outcome: { status: 'rejected', error } }),
    );

    return result;
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

    if (!this.#flushQueued) {
      this.#flushQueued = true;
      queueMicrotask(this.#flush);
    }
  }

  /**
   * Applies every request that settled since the last flush: writes the resolved values in one call
   * per path and renders once.
   */
  #flush = (): void => {
    this.#flushQueued = false;

    const settled = this.#settled.filter(({ entry }) => this.#isPending(entry));

    this.#settled = [];

    if (settled.length === 0 || this.hot.isDestroyed) {
      return;
    }

    const visibleChanges: Array<[number, string | number, unknown]> = [];
    const sourceChanges: Array<[number, string | number, unknown]> = [];

    settled.forEach(({ entry, outcome }) => {
      if (outcome.status === 'resolved') {
        const visualRow = this.hot.toVisualRow(entry.physicalRow);

        this.#deleteEntry(entry);
        (visualRow === null ? sourceChanges : visibleChanges)
          .push([visualRow ?? entry.physicalRow, entry.prop, outcome.value]);

      } else {
        entry.status = 'error';
        entry.controller = null;
        entry.error = outcome.error;
        entry.message = toErrorMessage(outcome.error);
      }

      this.#markChanged(entry);
    });

    this.#write(visibleChanges, sourceChanges);
    settled.forEach(this.#notifySettled);
  };

  /**
   * Writes the resolved values without recording them for undo, and renders once.
   *
   * @param {Array} visibleChanges The changes of rows that have a visual index (visual rows).
   * @param {Array} sourceChanges The changes of rows trimmed out of the grid (physical rows).
   */
  #write(
    visibleChanges: Array<[number, string | number, unknown]>,
    sourceChanges: Array<[number, string | number, unknown]>,
  ): void {
    this.hot.suspendRender();

    try {
      this.hot._getOperationScope().suppress(() => {
        if (visibleChanges.length > 0) {
          this.hot.setDataAtRowProp(visibleChanges, '', '', ASYNC_VALUES_SOURCE);
        }

        if (sourceChanges.length > 0) {
          this.hot.setSourceDataAtCell(sourceChanges, '', undefined, ASYNC_VALUES_SOURCE);
        }
      });

      this.hot.render();

    } finally {
      this.hot.resumeRender();
    }
  }

  /**
   * Fires the hook of a settled request and resolves the promise its caller holds.
   *
   * @param {object} settled The settled request.
   */
  #notifySettled = ({ entry, outcome }: SettledRequest): void => {
    if (outcome.status === 'resolved') {
      this.hot.runHooks('afterAsyncValueResolve', entry.physicalRow, entry.prop, outcome.value);
      entry.settle({ status: 'resolved', value: outcome.value });

      return;
    }

    this.hot.runHooks('afterAsyncValueReject', entry.physicalRow, entry.prop, entry.error, entry.message);
    entry.settle({ status: 'rejected', error: entry.error, message: entry.message });
  };

  /**
   * Removes an entry: aborts a pending request and fires the cancel hook, or drops an error state.
   *
   * @param {object} entry The entry.
   * @param {string} reason Why the entry is removed.
   */
  #clear(entry: AsyncValueEntry, reason: AsyncValueCancelReason): void {
    this.#deleteEntry(entry);
    this.#markChanged(entry);

    if (entry.status !== 'pending') {
      return;
    }

    entry.controller?.abort();
    entry.controller = null;
    this.hot.runHooks('afterAsyncValueCancel', entry.physicalRow, entry.prop, reason);
    entry.settle({ status: 'cancelled', reason });
  }

  /**
   * Removes every entry.
   *
   * @param {string} reason Why the entries are removed.
   */
  #clearAll(reason: AsyncValueCancelReason): void {
    [...this.#entries].forEach(entry => this.#clear(entry, reason));
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
   * Returns the entry of a cell, by physical row and property.
   *
   * @param {number} physicalRow Physical row index.
   * @param {string|number} prop The column property.
   * @returns {object|undefined}
   */
  #getEntry(physicalRow: number, prop: string | number): AsyncValueEntry | undefined {
    if (this.#entries.size === 0 || !this.#rowsMap) {
      return undefined;
    }

    return this.#rowsMap.getValueAtIndex<RowEntries | null>(physicalRow)?.get(prop);
  }

  /**
   * Returns the entry of a cell, by visual coordinates.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {object|undefined}
   */
  #getEntryAt(row: number, column: number): AsyncValueEntry | undefined {
    const physicalRow = this.hot.toPhysicalRow(row);
    const prop = this.hot.colToProp(column);

    if (physicalRow === null || (typeof prop !== 'string' && typeof prop !== 'number')) {
      return undefined;
    }

    return this.#getEntry(physicalRow, prop);
  }

  /**
   * Stores an entry in its row.
   *
   * @param {object} entry The entry.
   */
  #setEntry(entry: AsyncValueEntry): void {
    const rowsMap = this.#rowsMap!;
    let rowEntries = rowsMap.getValueAtIndex<RowEntries | null>(entry.physicalRow);

    if (!rowEntries) {
      rowEntries = new Map();
      rowsMap.setValueAtIndex(entry.physicalRow, rowEntries);
    }

    rowEntries.set(entry.prop, entry);
    this.#entries.add(entry);
  }

  /**
   * Removes an entry from its row. The row's slot keeps its (possibly empty) map, so the index map
   * fires no change for it.
   *
   * @param {object} entry The entry.
   */
  #deleteEntry(entry: AsyncValueEntry): void {
    const rowEntries = this.#rowsMap?.getValueAtIndex<RowEntries | null>(entry.physicalRow);

    if (rowEntries?.get(entry.prop) === entry) {
      rowEntries.delete(entry.prop);
    }

    this.#entries.delete(entry);
  }

  /**
   * Marks an entry's cell for the next paint under `renderMode: 'onChange'`: the state is plugin
   * state, which the paint stamps cannot see.
   *
   * @param {object} entry The entry.
   */
  #markChanged(entry: AsyncValueEntry): void {
    const row = this.hot.toVisualRow(entry.physicalRow);
    const column = this.hot.propToCol(entry.prop);

    if (row !== null && typeof column === 'number' && column >= 0) {
      this.hot.markCellChanged(row, column);
    }
  }

  /**
   * Re-reads the physical row of every entry from the index map, after a row insert or removal
   * shifted the values.
   */
  #syncPhysicalRows = (): void => {
    if (this.#entries.size === 0 || !this.#rowsMap) {
      return;
    }

    this.#rowsMap.getValues().forEach((rowEntries, physicalRow) => {
      (rowEntries as RowEntries | null)?.forEach((entry) => {
        entry.physicalRow = physicalRow;
      });
    });
  };

  /**
   * Cancels the requests of the cells a change wrote and of the cells that depend on them.
   *
   * @param {number} physicalRow Physical row index of the changed cell.
   * @param {string|number} prop The property of the changed cell.
   * @returns {boolean} `true` when an entry was removed.
   */
  #onCellChanged(physicalRow: number, prop: string | number): boolean {
    const rowEntries = this.#rowsMap?.getValueAtIndex<RowEntries | null>(physicalRow);

    if (!rowEntries || rowEntries.size === 0) {
      return false;
    }

    const own = rowEntries.get(prop);
    const dependents = [...rowEntries.values()]
      .filter(entry => entry !== own && entry.status === 'pending' && entry.dependsOn.includes(prop));

    if (own) {
      this.#clear(own, 'edit');
    }

    dependents.forEach(entry => this.#clear(entry, 'dependency'));

    return own !== undefined || dependents.length > 0;
  }

  /**
   * Cancels the requests a list of changes affects, and renders when one was cancelled.
   *
   * @param {Array} changes The changes, as `[physicalRow, prop]` pairs.
   */
  #onCellsChanged(changes: Array<[number | null, unknown]>): void {
    let changed = false;

    changes.forEach(([physicalRow, prop]) => {
      if (physicalRow !== null && (typeof prop === 'string' || typeof prop === 'number')) {
        changed = this.#onCellChanged(physicalRow, prop) || changed;
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
   */
  #onAfterChange = (changes: CellChange[] | null): void => {
    if (!changes || this.#entries.size === 0) {
      return;
    }

    this.#onCellsChanged(changes.map(([row, prop]) => [this.hot.toPhysicalRow(row), prop]));
  };

  /**
   * `afterSetSourceDataAtCell` hook callback. A source write (an undo or redo replays through it)
   * cancels the cell's request.
   *
   * @param {Array} changes The changes (physical rows).
   */
  #onAfterSetSourceDataAtCell = (changes: CellChange[]): void => {
    if (this.#entries.size === 0) {
      return;
    }

    this.#onCellsChanged(changes.map(([row, prop]) => [row, prop]));
  };

  /**
   * `beforeRemoveRow` hook callback. Holds the entries of the rows about to be removed.
   *
   * @param {number} index Visual index of the first removed row.
   * @param {number} amount The number of removed rows.
   * @param {number[]} physicalRows Physical indexes of the removed rows.
   */
  #onBeforeRemoveRow = (index: number, amount: number, physicalRows: number[]): void => {
    if (this.#entries.size === 0) {
      return;
    }

    this.#removedRowsEntries = physicalRows.flatMap(physicalRow => [
      ...(this.#rowsMap?.getValueAtIndex<RowEntries | null>(physicalRow)?.values() ?? []),
    ]);
  };

  /**
   * `afterRemoveRow` hook callback. Cancels the requests of the removed rows.
   */
  #onAfterRemoveRow = (): void => {
    const removed = this.#removedRowsEntries;

    this.#removedRowsEntries = [];
    removed.forEach((entry) => {
      // The index map already dropped the row, so only the set still holds the entry.
      this.#entries.delete(entry);

      if (entry.status === 'pending') {
        entry.controller?.abort();
        entry.controller = null;
        this.hot.runHooks('afterAsyncValueCancel', entry.physicalRow, entry.prop, 'rowRemoved');
        entry.settle({ status: 'cancelled', reason: 'rowRemoved' });
      }
    });

    this.#syncPhysicalRows();
  };

  /**
   * `afterCreateCol` and `afterRemoveCol` hook callback. A column insert or removal shifts the
   * properties of array data, which are column indexes, so the entries keyed by one are removed.
   */
  #onColumnsChange = (): void => {
    const shifted = [...this.#entries].filter(entry => typeof entry.prop === 'number');

    if (shifted.length > 0) {
      shifted.forEach(entry => this.#clear(entry, 'columnRemoved'));
      this.hot.render();
    }
  };

  /**
   * `afterLoadData` and `afterUpdateData` hook callback. The requests target the replaced data, so
   * they are cancelled.
   */
  #onDataReplaced = (): void => {
    this.#removedRowsEntries = [];
    this.#settled = [];

    if (this.#entries.size > 0) {
      this.#clearAll('dataReplaced');
      this.hot.markAllCellsChanged();
    }
  };

  /**
   * `afterGetCellMeta` hook callback. Reports the cell's state in its meta.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} cellProperties The cell meta object.
   */
  #onAfterGetCellMeta = (row: number, column: number, cellProperties: CellProperties): void => {
    const physicalRow = this.hot.toPhysicalRow(row);
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
  #onAfterRenderer = (
    TD: HTMLTableCellElement, row: number, column: number, prop: string | number, value: unknown,
    cellProperties: CellProperties,
  ): void => {
    const physicalRow = this.#entries.size === 0 ? null : this.hot.toPhysicalRow(row);
    const entry = physicalRow === null ? undefined : this.#getEntry(physicalRow, prop);

    if (TD.hasAttribute(DECORATION_ATTRIBUTE)) {
      this.#undecorate(TD);
    }

    if (entry) {
      this.#decorate(TD, entry, !!cellProperties.ariaTags);
    }
  };

  /**
   * Decorates a cell element with an entry's state.
   *
   * @param {HTMLTableCellElement} TD The cell element.
   * @param {object} entry The entry.
   * @param {boolean} ariaTags Whether the grid writes ARIA attributes.
   */
  #decorate(TD: HTMLTableCellElement, entry: AsyncValueEntry, ariaTags: boolean): void {
    if (entry.status === 'pending') {
      const indicator = this.hot.rootDocument.createElement('span');

      indicator.className = INDICATOR_CLASS_NAME;
      indicator.setAttribute('aria-hidden', 'true');
      TD.appendChild(indicator);
      addClass(TD, PENDING_CLASS_NAME);
      TD.setAttribute(DECORATION_ATTRIBUTE, '');

      if (ariaTags) {
        setAttribute(TD, [A11Y_BUSY()]);
      }

      return;
    }

    addClass(TD, ERROR_CLASS_NAME);
    TD.setAttribute(DECORATION_ATTRIBUTE, entry.message);

    if (entry.message !== '') {
      TD.setAttribute('title', entry.message);
    }

    if (ariaTags) {
      setAttribute(TD, [A11Y_INVALID()]);
    }
  }

  /**
   * Takes the decoration off a cell element. The classes and ARIA attributes are reset by the
   * renderer on every paint, so only the indicator and the plugin's own `title` remain.
   *
   * @param {HTMLTableCellElement} TD The cell element.
   */
  #undecorate(TD: HTMLTableCellElement): void {
    const title = TD.getAttribute(DECORATION_ATTRIBUTE);

    if (title !== '' && TD.getAttribute('title') === title) {
      TD.removeAttribute('title');
    }

    removeAttribute(TD, [DECORATION_ATTRIBUTE]);
    Array.from(TD.children)
      .filter(child => child.classList.contains(INDICATOR_CLASS_NAME))
      .forEach(child => child.remove());
  }
}
