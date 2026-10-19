import { BasePlugin } from '../base';
import { registerConflict } from '../base/conflictRegistry';
import { addClass, removeAttribute, setAttribute } from '../../helpers/dom/element';
import { hasOwnProperty } from '../../helpers/object';
import { throwWithCause } from '../../helpers/errors';
import { A11Y_BUSY, A11Y_INVALID } from '../../helpers/a11y';
import { announce } from '../../utils/a11yAnnouncer';
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
 * The class of the visually hidden element that carries the error message to assistive technology.
 */
export const ERROR_MESSAGE_CLASS_NAME = 'htAsyncErrorMessage';

/**
 * Marks a cell element the plugin decorated, and holds the `title` the plugin wrote on it, so the
 * decoration can be taken off a recycled element without touching a `title` a renderer wrote.
 */
const DECORATION_ATTRIBUTE = 'data-ht-async';

// NestedRows moves rows through its own data manager without shifting the index mapper, so a physical
// index does not follow its record there.
registerConflict(PLUGIN_KEY, 'nestedRows');

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
 * - the row is removed, or the data is replaced (which includes a refetch of the `DataProvider` plugin).
 *
 * A late result of a cancelled request is ignored. Requests are tied to the row's physical index, so
 * sorting, filtering, or moving rows on the client while a request is pending still lands the result
 * on the right record. The plugin cannot be enabled together with the `NestedRows` plugin.
 *
 * The plugin writes a resolved value with the `'AsyncValues.resolve'` source, and the write is not
 * added to the undo history. The write goes through `beforeChange` and the cell's validator, so
 * either can still change or reject the value. A cell's state is available in its cell meta as
 * `asyncState` (`'pending'` or `'error'`) and `asyncError` (the error message).
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
 * asyncValues.setAsyncValue(0, 1, async({ physicalRow, signal }) => {
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
    // Before the application's listeners, so a request an application starts from its own
    // `afterChange` is not cancelled by the very change that started it.
    this.addHook('afterChange', this.#onAfterChange, -1);
    this.addHook('afterSetSourceDataAtCell', this.#onAfterSetSourceDataAtCell, -1);
    this.addHook('afterCreateRow', this.#syncRows);
    this.addHook('afterRemoveRow', this.#syncRows);
    this.addHook('afterCreateCol', this.#onAfterCreateCol);
    this.addHook('afterRemoveCol', this.#onAfterRemoveCol);
    this.addHook('afterLoadData', this.#onDataReplaced);
    this.addHook('afterUpdateData', this.#onDataReplaced);

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state. This method is executed when `updateSettings()` is invoked with the
   * `asyncValues` option. The option has no settings to apply, so the requests keep running: the
   * framework wrappers send the option again on every update.
   */
  updatePlugin(): void {
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
      this.#clearAll('disabled');
      this.hot.markAllCellsChanged();
      this.hot.render();
    }

    this.#settled = [];

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
   * The returned promise resolves with `{ status: 'resolved' }` once the plugin passes the value to
   * the grid. A `beforeChange` listener or the cell's validator can still change or reject it, and an
   * asynchronous validator delays the write.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {Function|Promise} source A function that returns a promise of the value, or the promise
   * itself. The function receives an object with the `signal` (an `AbortSignal`), `row`, `column`,
   * `physicalRow`, and `prop` of the cell.
   * @param {object} [options] The request options.
   * @param {Array} [options.dependsOn] The properties of the columns, in the same row, whose change
   * cancels the request.
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
    const result = this.#start(row, column, source, options);

    this.hot.render();

    return result;
  }

  /**
   * Starts an asynchronous computation for every cell of a range, and renders once. The `source`
   * function is called once per cell.
   *
   * @param {number} rowFrom Visual index of the first row.
   * @param {number} columnFrom Visual index of the first column.
   * @param {number} rowTo Visual index of the last row.
   * @param {number} columnTo Visual index of the last column.
   * @param {Function} source A function that returns a promise of a cell's value. It receives an
   * object with the `signal` (an `AbortSignal`), `row`, `column`, `physicalRow`, and `prop` of the cell.
   * @param {object} [options] The request options, shared by every cell (see {@link AsyncValues#setAsyncValue}).
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
   * Destroys the plugin instance. Pending requests are aborted, and their promises resolve as
   * cancelled with the `'disabled'` reason.
   */
  destroy(): void {
    const entries = [...this.#entries];

    this.#entries.clear();
    this.#settled = [];
    this.#rowsMap = null;
    entries.forEach((entry) => {
      if (entry.status === 'pending') {
        entry.controller?.abort();
        entry.controller = null;
        entry.settle({ status: 'cancelled', reason: 'disabled' });
      }
    });

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

    const physicalRow = this.#isInGrid(row, column) ? this.hot.toPhysicalRow(row) : null;
    const prop = this.hot.colToProp(column);

    if (physicalRow === null || (typeof prop !== 'string' && typeof prop !== 'number')) {
      throwWithCause(`The cell (${row}, ${column}) cannot hold an async value.`);
    }

    const previous = this.#getEntry(physicalRow, prop);
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

    // The new entry takes the cell before the previous one's cancel hook runs, so a listener that
    // starts a request for the same cell from that hook replaces this entry instead of leaving it
    // orphaned next to its own.
    if (previous) {
      this.#detach(previous);
    }

    this.#setEntry(entry);
    this.#markChanged(entry);

    if (previous) {
      this.#notifyCleared(previous, 'restart');
    }

    if (!this.#isPending(entry)) {
      return result;
    }

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
   * Tells whether visual coordinates point at a cell of the grid.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  #isInGrid(row: number, column: number): boolean {
    return Number.isInteger(row) && Number.isInteger(column) &&
      row >= 0 && row < this.hot.countRows() && column >= 0 && column < this.hot.countCols();
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
      this.hot._registerMicrotask(this.#flush);
    }
  }

  /**
   * Applies every request that settled since the last flush: writes the resolved values in one call
   * per path and renders once. Results that settle in the same task share a flush; results that
   * arrive in separate tasks (separate network responses) get one flush each.
   */
  #flush = (): void => {
    this.#flushQueued = false;

    // A settled request can be cancelled between the settle and this flush (an edit in between).
    const settled = this.#settled.filter(({ entry }) => this.#isPending(entry));

    this.#settled = [];

    if (settled.length === 0) {
      return;
    }

    const visibleChanges: Array<[number, string | number, unknown]> = [];
    const sourceChanges: Array<[number, string | number, unknown]> = [];

    settled.forEach(({ entry, outcome }) => {
      if (outcome.status === 'resolved') {
        const visualRow = this.hot.toVisualRow(entry.physicalRow);

        this.#deleteEntry(entry);
        entry.controller = null;
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

    try {
      this.#write(visibleChanges, sourceChanges);

    } finally {
      settled.forEach(this.#notifySettled);
    }
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
   * Fires the hook of a settled request and resolves the promise its caller holds. A rejection on the
   * cell the user is on is announced, because its message is not part of the cell's visible text.
   *
   * @param {object} settled The settled request.
   */
  #notifySettled = ({ entry, outcome }: SettledRequest): void => {
    if (outcome.status === 'resolved') {
      this.hot.runHooks('afterAsyncValueResolve', entry.physicalRow, entry.prop, outcome.value);
      entry.settle({ status: 'resolved', value: outcome.value });

      return;
    }

    if (entry.message !== '' && this.#isActiveCell(entry)) {
      announce(entry.message, 'polite');
    }

    this.hot.runHooks('afterAsyncValueReject', entry.physicalRow, entry.prop, entry.error, entry.message);
    entry.settle({ status: 'rejected', error: entry.error, message: entry.message });
  };

  /**
   * Tells whether an entry's cell is the selection's active cell.
   *
   * @param {object} entry The entry.
   * @returns {boolean}
   */
  #isActiveCell(entry: AsyncValueEntry): boolean {
    const highlight = this.hot.getSelectedRangeActive()?.highlight;

    return !!highlight &&
      highlight.row === this.hot.toVisualRow(entry.physicalRow) &&
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
    this.#notifyCleared(entry, reason);
  }

  /**
   * Removes an entry from its cell and aborts a pending request, without running any host code.
   *
   * @param {object} entry The entry.
   */
  #detach(entry: AsyncValueEntry): void {
    this.#deleteEntry(entry);
    this.#markChanged(entry);
    entry.controller?.abort();
    entry.controller = null;
  }

  /**
   * Reports a detached pending request as cancelled. A detached error state reports nothing.
   *
   * @param {object} entry The entry.
   * @param {string} reason Why the entry was removed.
   */
  #notifyCleared(entry: AsyncValueEntry, reason: AsyncValueCancelReason): void {
    if (entry.status !== 'pending') {
      return;
    }

    this.hot.runHooks('afterAsyncValueCancel', entry.physicalRow, entry.prop, reason);
    entry.settle({ status: 'cancelled', reason });
  }

  /**
   * Removes every entry.
   *
   * @param {string} reason Why the entries are removed.
   */
  #clearAll(reason: AsyncValueCancelReason): void {
    const entries = [...this.#entries];

    entries.forEach(entry => this.#detach(entry));
    entries.forEach(entry => this.#notifyCleared(entry, reason));
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
   * Removes an entry from its row, and the row's map once it is empty.
   *
   * @param {object} entry The entry.
   */
  #deleteEntry(entry: AsyncValueEntry): void {
    const rowsMap = this.#rowsMap;
    const rowEntries = rowsMap?.getValueAtIndex<RowEntries | null>(entry.physicalRow);

    if (rowsMap && rowEntries?.get(entry.prop) === entry) {
      rowEntries.delete(entry.prop);

      if (rowEntries.size === 0) {
        rowsMap.setValueAtIndex(entry.physicalRow, null);
      }
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
   * `afterCreateRow` and `afterRemoveRow` hook callback. The index map shifted its values, so the
   * physical row of every entry is read again from it, and an entry the map no longer holds belonged
   * to a removed row. Comparing against the map, rather than stashing the rows in `beforeRemoveRow`,
   * holds for a removal another listener vetoed, widened, or nested inside its own.
   */
  #syncRows = (): void => {
    if (this.#entries.size === 0 || !this.#rowsMap) {
      return;
    }

    const live = new Set<AsyncValueEntry>();

    this.#rowsMap.getValues().forEach((rowEntries, physicalRow) => {
      (rowEntries as RowEntries | null)?.forEach((entry) => {
        entry.physicalRow = physicalRow;
        live.add(entry);
      });
    });

    const removed = [...this.#entries].filter(entry => !live.has(entry));

    removed.forEach((entry) => {
      this.#entries.delete(entry);
      entry.controller?.abort();
      entry.controller = null;
    });
    removed.forEach(entry => this.#notifyCleared(entry, 'rowRemoved'));
  };

  /**
   * Cancels the requests of the cell a change wrote, and the requests and errors of the cells that
   * depend on it.
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
      .filter(entry => entry !== own && entry.dependsOn.includes(prop));

    if (own) {
      this.#detach(own);
    }

    dependents.forEach(entry => this.#detach(entry));

    if (own) {
      this.#notifyCleared(own, 'edit');
    }

    dependents.forEach(entry => this.#notifyCleared(entry, 'dependency'));

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
   * `afterCreateCol` hook callback. See `#onColumnsShifted()`.
   *
   * @param {number} index Visual index of the first inserted column.
   */
  #onAfterCreateCol = (index: number): void => {
    this.#onColumnsShifted(this.hot.toPhysicalColumn(index) ?? 0);
  };

  /**
   * `afterRemoveCol` hook callback. See `#onColumnsShifted()`.
   *
   * @param {number} index Visual index of the first removed column.
   * @param {number} amount The number of removed columns.
   * @param {number[]} physicalColumns Physical indexes of the removed columns.
   */
  #onAfterRemoveCol = (index: number, amount: number, physicalColumns: number[]): void => {
    this.#onColumnsShifted(physicalColumns.length > 0 ? Math.min(...physicalColumns) : 0);
  };

  /**
   * A column insert or removal shifts the properties of array data, which are column indexes, so the
   * entries keyed by an index at or after the change are removed. String properties are stable.
   *
   * @param {number} firstShifted The first physical column index the change shifted.
   */
  #onColumnsShifted(firstShifted: number): void {
    const shifted = [...this.#entries]
      .filter(entry => typeof entry.prop === 'number' && entry.prop >= firstShifted);

    if (shifted.length > 0) {
      shifted.forEach(entry => this.#detach(entry));
      shifted.forEach(entry => this.#notifyCleared(entry, 'columnsChanged'));
      this.hot.render();
    }
  }

  /**
   * `afterLoadData` and `afterUpdateData` hook callback. The requests target the replaced data, so
   * they are cancelled.
   */
  #onDataReplaced = (): void => {
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
      TD.appendChild(this.#createElement(INDICATOR_CLASS_NAME, ''));
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
      // The `title` reaches a pointer only, and a screen reader drops it while the cell carries
      // `aria-describedby` (its column header). Visually hidden text is read with the cell's content.
      TD.appendChild(this.#createElement(ERROR_MESSAGE_CLASS_NAME, entry.message));
    }

    if (ariaTags) {
      setAttribute(TD, [A11Y_INVALID()]);
    }
  }

  /**
   * Creates one of the plugin's elements inside a cell.
   *
   * @param {string} className The element's class.
   * @param {string} text The element's text.
   * @returns {HTMLSpanElement}
   */
  #createElement(className: string, text: string): HTMLSpanElement {
    const element = this.hot.rootDocument.createElement('span');

    element.className = className;

    if (text === '') {
      element.setAttribute('aria-hidden', 'true');

    } else {
      element.textContent = text;
    }

    return element;
  }

  /**
   * Takes the decoration off a cell element. The classes and ARIA attributes are reset by the
   * renderer on every paint, so only the plugin's elements and its own `title` remain.
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
      .filter(child => child.classList.contains(INDICATOR_CLASS_NAME) ||
        child.classList.contains(ERROR_MESSAGE_CLASS_NAME))
      .forEach(child => child.remove());
  }
}
