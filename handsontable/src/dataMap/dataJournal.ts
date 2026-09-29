import type { HotInstance } from '../core/types';
import type { OperationScope } from '../core/operationScope';
import type { CellMetaKeyState, CellMetaKeyStateEntry } from './metaManager/metaLayers/cellMeta';
import { deepClone, isPlainObject, stripFunctionValues } from '../helpers/object';
import { isDataAccessorFn } from './dataSource';
import type { DataAccessorFn } from './dataSource';

/**
 * One cell value change, addressed by physical row and by prop. Both values are SOURCE values - what
 * the data source stored before and after the write - never the values a change hook reports: those
 * have passed through `valueGetter`/`valueSetter` and `modifyData`, so writing one back into the
 * source would store the display value (a key/value autocomplete cell would get its label instead of
 * its key).
 */
export interface CellDelta {
  physicalRow: number;
  prop: string | number | DataAccessorFn;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Cell value changes, in the order they were written.
 */
export interface CellsJournalOp {
  type: 'cells';
  changes: CellDelta[];
  /**
   * Set when the changes were written from the last one to the first: `applyChanges()` walks its
   * list backwards. The journal keeps the write order, which the replay depends on, and a step's
   * public `changes` field reads such a run backwards, so it lists the cells in the order they were
   * passed.
   */
  reversed?: true;
}

/**
 * Rows inserted into the data source. They hold no content of their own: the rows are rebuilt from
 * the schema when the insertion is replayed, and whatever was written into them afterwards is a
 * separate `cells` entry.
 */
export interface InsertRowsJournalOp {
  type: 'insertRows';
  physicalIndex: number;
  amount: number;
}

/**
 * Rows removed from the data source, together with everything needed to put them back.
 */
export interface RemoveRowsJournalOp {
  type: 'removeRows';
  /**
   * The removed physical rows, in ascending order.
   */
  physicalIndexes: number[];
  /**
   * The physical row of the first visual row removed - the removal's public `index`, as the undo
   * step has always reported it.
   */
  firstPhysicalIndex: number;
  /**
   * A detached copy of each removed row, in the order of `physicalIndexes`.
   */
  rows: unknown[];
  /**
   * For each removed row, the `[physicalColumn, value]` pairs of every column whose `data` is an
   * accessor function - those values live behind the function and are invisible to `rows`.
   */
  accessorValues: Array<Array<[number, unknown]>>;
  /**
   * The cell meta keys the removed rows carried, by the physical coordinates they had.
   */
  metas: CellMetaKeyStateEntry[];
}

/**
 * Columns inserted into the data source (array data only).
 */
export interface InsertColumnsJournalOp {
  type: 'insertColumns';
  physicalIndex: number;
  amount: number;
}

/**
 * Columns removed from the data source (array data only), together with their values.
 */
export interface RemoveColumnsJournalOp {
  type: 'removeColumns';
  /**
   * The removed physical columns, in ascending order.
   */
  physicalIndexes: number[];
  /**
   * For each removed column (in the order of `physicalIndexes`), the value it held in every source row.
   */
  values: unknown[][];
  /**
   * The cell meta keys the removed columns carried, by the physical coordinates they had.
   */
  metas: CellMetaKeyStateEntry[];
}

/**
 * One cell meta key changed through `setCellMeta` or `removeCellMeta`.
 */
export interface MetaJournalOp {
  type: 'meta';
  physicalRow: number;
  physicalColumn: number;
  key: string;
  before: CellMetaKeyState;
  after: CellMetaKeyState;
}

/**
 * Cell meta rows inserted or removed without a row insertion or removal around them - by a plugin
 * that restructures the rows by hand (NestedRows), or through `spliceCellsMeta()`. The data does not
 * move with them.
 */
export interface MetaRowsJournalOp {
  type: 'metaRows';
  /**
   * `true` for empty meta rows inserted, `false` for meta rows removed.
   */
  insert: boolean;
  physicalRow: number;
  amount: number;
  /**
   * The removed rows' own key states, so an undo can put them back. Empty for an insertion.
   */
  metas: CellMetaKeyStateEntry[];
}

/**
 * One entry of a transaction's journal.
 */
export type JournalOp =
  | CellsJournalOp
  | InsertRowsJournalOp
  | RemoveRowsJournalOp
  | InsertColumnsJournalOp
  | RemoveColumnsJournalOp
  | MetaJournalOp
  | MetaRowsJournalOp;

/**
 * Cell meta keys that are never journaled. `valid` is the validation result: the validation flow
 * writes it straight onto the meta object and recomputes it after every change, so a recorded value
 * would only replay a stale verdict.
 */
export const UNJOURNALED_META_KEYS: ReadonlySet<string> = new Set(['valid']);

/**
 * Returns a detached copy of a value that is safe to keep in a journal: objects and arrays are
 * cloned, so a later in-place mutation of the stored value does not rewrite the recorded one.
 *
 * @param {*} value The value to copy.
 * @returns {*}
 */
export function detachValue(value: unknown): unknown {
  return typeof value === 'object' && value !== null ? deepClone(value) : value;
}

/**
 * Snapshots one source row for later restoration. Function-valued keys are dropped (at every
 * depth) – a function is never a cell value, and writing it back would alias the removed row's
 * closure onto the row the `dataSchema` creates when the removal is undone. `__children` is dropped
 * because `nestedRows` restores its own tree.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number} physicalRow Physical index of the row being removed.
 * @returns {unknown} A detached copy of the row.
 */
export function captureRowData(hot: HotInstance, physicalRow: number): unknown {
  const rowData = deepClone(hot.getSourceDataAtRow(physicalRow));

  if (isPlainObject(rowData)) {
    delete rowData.__children;
    stripFunctionValues(rowData);
  }

  return rowData;
}

/**
 * Collects the `[physicalColumnIndex, accessor]` pair of every column whose `data` is an accessor
 * function. The set does not depend on the row, so it is scanned once per removal and reused for
 * every removed row. Returns an empty list when no column uses a function `data` accessor.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {Array<Array>} `[physicalColumnIndex, accessor]` pairs.
 */
export function collectAccessorColumns(hot: HotInstance): Array<[number, DataAccessorFn]> {
  const accessorColumns: Array<[number, DataAccessorFn]> = [];

  for (let visualColumn = 0; visualColumn < hot.countCols(); visualColumn++) {
    // `colToProp` is declared as `string | number` – the shape it has always had publicly – but it
    // hands back the `columns[].data` accessor as-is, so read it as `unknown` and narrow it here.
    const prop: unknown = hot.colToProp(visualColumn);

    if (isDataAccessorFn(prop)) {
      accessorColumns.push([hot.toPhysicalColumn(visualColumn), prop]);
    }
  }

  return accessorColumns;
}

/**
 * Reads the values of every accessor-function column for one row.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number} physicalRow Physical index of the row.
 * @param {Array<Array>} accessorColumns The pairs collected by `collectAccessorColumns`.
 * @returns {Array<Array>} `[physicalColumnIndex, value]` pairs.
 */
export function captureAccessorValues(
  hot: HotInstance, physicalRow: number, accessorColumns: Array<[number, DataAccessorFn]>
): Array<[number, unknown]> {
  return accessorColumns.map(
    ([physicalColumn, prop]) => [physicalColumn, detachValue(hot.getSourceDataAtCell(physicalRow, prop))]
  );
}

/**
 * Appends one cell value change to the transaction's journal. Consecutive changes are kept in one
 * `cells` entry; a structural entry in between starts a new one, so the journal keeps the order the
 * writes happened in.
 *
 * @param {OperationScope} scope The operation scope.
 * @param {CellDelta} delta The change.
 * @param {boolean} [reversed=false] `true` for a change written by a loop that walks its list
 *   backwards (see `CellsJournalOp#reversed`).
 */
export function recordCellChange(scope: OperationScope, delta: CellDelta, reversed = false) {
  const transaction = scope.getRecordingTransaction();

  if (transaction === null) {
    return;
  }

  const lastOp = transaction.journal[transaction.journal.length - 1];

  if (lastOp?.type === 'cells' && (lastOp.reversed === true) === reversed) {
    lastOp.changes.push(delta);
  } else if (reversed) {
    transaction.journal.push({ type: 'cells', changes: [delta], reversed: true });
  } else {
    transaction.journal.push({ type: 'cells', changes: [delta] });
  }
}

/**
 * Records a shift of the cell meta rows made outside a row insertion or removal. Must run before the
 * shift, so a removal can still read the rows' own key states.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {boolean} insert `true` for inserted meta rows, `false` for removed ones.
 * @param {number} physicalRow The first physical row of the shift.
 * @param {number} amount The number of meta rows.
 */
export function recordMetaRowsShift(hot: HotInstance, insert: boolean, physicalRow: number, amount: number) {
  const scope = hot._getOperationScope();

  if (scope.getRecordingTransaction() === null || amount <= 0) {
    return;
  }

  const metas: CellMetaKeyStateEntry[] = [];

  if (!insert) {
    const metaManager = hot._getMetaManager();

    for (let row = physicalRow; row < physicalRow + amount; row++) {
      metaManager.captureRowMetaKeyStates(row, metas);
    }
  }

  scope.record({ type: 'metaRows', insert, physicalRow, amount, metas });
}

/**
 * Records the rows a removal is about to take out of the data source. Must run after the
 * `beforeRemoveRow` hook (a listener may widen the list) and before the rows are spliced out.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number[]} physicalRows The physical rows about to be removed.
 */
export function recordRemovedRows(hot: HotInstance, physicalRows: number[]) {
  const scope = hot._getOperationScope();

  if (scope.getRecordingTransaction() === null || physicalRows.length === 0) {
    return;
  }

  const physicalIndexes = physicalRows.slice(0).sort((a, b) => a - b);
  const accessorColumns = collectAccessorColumns(hot);
  const metaManager = hot._getMetaManager();
  const rows: unknown[] = [];
  const accessorValues: Array<Array<[number, unknown]>> = [];
  const metas: CellMetaKeyStateEntry[] = [];

  physicalIndexes.forEach((physicalRow) => {
    rows.push(captureRowData(hot, physicalRow));
    accessorValues.push(captureAccessorValues(hot, physicalRow, accessorColumns));
    metaManager.captureRowMetaKeyStates(physicalRow, metas);
  });

  scope.record({
    type: 'removeRows',
    physicalIndexes,
    firstPhysicalIndex: physicalRows[0],
    rows,
    accessorValues,
    metas,
  });
}

/**
 * Records the columns a removal is about to take out of an array data source. Must run after the
 * `beforeRemoveCol` hook and before the columns are spliced out.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {unknown[][]} dataSource The data source rows.
 * @param {number[]} physicalColumns The physical columns about to be removed.
 */
export function recordRemovedColumns(hot: HotInstance, dataSource: unknown[], physicalColumns: number[]) {
  const scope = hot._getOperationScope();

  if (scope.getRecordingTransaction() === null || physicalColumns.length === 0) {
    return;
  }

  const physicalIndexes = physicalColumns.slice(0).sort((a, b) => a - b);
  const metaManager = hot._getMetaManager();
  const metas: CellMetaKeyStateEntry[] = [];
  const values = physicalIndexes.map((physicalColumn) => {
    const columnValues: unknown[] = [];

    for (let row = 0; row < dataSource.length; row++) {
      const dataRow = dataSource[row];

      columnValues.push(Array.isArray(dataRow) ? detachValue(dataRow[physicalColumn]) : undefined);
    }

    metaManager.captureColumnMetaKeyStates(physicalColumn, metas);

    return columnValues;
  });

  scope.record({ type: 'removeColumns', physicalIndexes, values, metas });
}
