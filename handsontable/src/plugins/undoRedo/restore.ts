import type { HotInstance } from '../../core/types';
import type {
  CellsJournalOp,
  InsertColumnsJournalOp,
  InsertRowsJournalOp,
  JournalOp,
  MetaJournalOp,
  MetaRowsJournalOp,
  RemoveColumnsJournalOp,
  RemoveRowsJournalOp,
} from '../../dataMap/dataJournal';
import type { CellMetaKeyStateEntry } from '../../dataMap/metaManager/metaLayers/cellMeta';
import type { ColumnDataGetterSetterFunction } from '../../settings';
import { deepClone, isPlainObject } from '../../helpers/object';
import { isDataAccessorFn } from '../../dataMap/dataSource';
import { safeBatch } from '../../utils/safeBatch';
import type { GridStateSnapshot, GridStateTracker } from './snapshot/gridState';
import type { StepRecord } from './entry';

/**
 * Which way a step is replayed.
 */
export type RestoreDirection = 'undo' | 'redo';

/**
 * A source-data write in the form `setSourceDataAtCell()` accepts.
 */
type SourceChange = [number, string | number | ColumnDataGetterSetterFunction, unknown];

/**
 * Tells whether a journal entry adds or removes rows.
 *
 * @param {JournalOp} op The journal entry.
 * @returns {boolean}
 */
function isRowStructural(op: JournalOp): op is InsertRowsJournalOp | RemoveRowsJournalOp {
  return op.type === 'insertRows' || op.type === 'removeRows';
}

/**
 * Tells whether a journal entry adds or removes rows or columns.
 *
 * @param {JournalOp} op The journal entry.
 * @returns {boolean}
 */
export function isStructural(op: JournalOp): boolean {
  return isRowStructural(op) || op.type === 'insertColumns' || op.type === 'removeColumns';
}

/**
 * A row insertion or removal a restore of a reshaped source reports through the row hooks, at
 * physical positions (the replay runs in physical order, so they are the visual ones too).
 */
interface RowChange {
  insert: boolean;
  start: number;
  amount: number;
}

/**
 * Splits ascending physical indexes into `[start, length]` runs of consecutive indexes.
 *
 * @param {number[]} indexes Ascending physical indexes.
 * @returns {Array<Array<number>>}
 */
function toRuns(indexes: number[]): Array<[number, number]> {
  const runs: Array<[number, number]> = [];

  indexes.forEach((index) => {
    const lastRun = runs[runs.length - 1];

    if (lastRun && lastRun[0] + lastRun[1] === index) {
      lastRun[1] += 1;
    } else {
      runs.push([index, 1]);
    }
  });

  return runs;
}

/**
 * Writes source values back without re-judging them. The values were in the source before, so the
 * source data validator must not blank them again, and the replay source keeps the `valueSetter`
 * from translating them a second time (they are stored values, not user input).
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {Array} changes The writes.
 * @param {string} source `UndoRedo.undo` or `UndoRedo.redo`.
 */
function writeSource(hot: HotInstance, changes: SourceChange[], source: string) {
  if (changes.length > 0) {
    hot.setSourceDataAtCell(changes, undefined, undefined, source);
  }
}

/**
 * Puts cell meta key states back, each in the origin bucket it was filed in.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {CellMetaKeyStateEntry[]} metas The captured states.
 */
function applyMetaStates(hot: HotInstance, metas: CellMetaKeyStateEntry[]) {
  const metaManager = hot._getMetaManager();

  metas.forEach(({ physicalRow, physicalColumn, key, state }) => {
    metaManager.applyCellMetaKeyState(physicalRow, physicalColumn, key, state);
  });
}

/**
 * Replays a `cells` entry: the old values for an undo (in reverse write order, so a cell written
 * twice ends on its first old value), the new values for a redo.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {CellsJournalOp} op The journal entry.
 * @param {RestoreDirection} direction The replay direction.
 * @param {string} source The replay source.
 */
function replayCells(hot: HotInstance, op: CellsJournalOp, direction: RestoreDirection, source: string) {
  const deltas = direction === 'undo' ? op.changes.slice().reverse() : op.changes;

  writeSource(hot, deltas.map(({ physicalRow, prop, oldValue, newValue }): SourceChange => [
    physicalRow,
    prop,
    deepClone(direction === 'undo' ? oldValue : newValue),
  ]), source);
}

/**
 * Counts the rows or the columns of the source data.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {string} axis `row` or `column`.
 * @returns {number}
 */
function countSourceItems(hot: HotInstance, axis: 'row' | 'column'): number {
  return axis === 'row' ? hot.countSourceRows() : hot.countSourceCols();
}

/**
 * Removes or re-creates rows or columns at physical positions, run by run. The replay runs in
 * physical order (see `restoreStep`), so a visual index names the physical row or column of the same
 * number. Removals go from the last run up, so each run's indexes are still the recorded ones.
 *
 * A `beforeAlter`, `beforeCreateRow`/`beforeRemoveRow` or column-axis listener can veto a run. Each
 * run is therefore checked against the count it must change by, and on a veto the runs this call
 * already applied are reverted, so the call either applies completely or leaves the data as it was.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {string} axis `row` or `column`.
 * @param {Array<Array<number>>} runs The `[start, length]` runs.
 * @param {boolean} insert `true` to re-create, `false` to remove.
 * @param {string} source The replay source.
 * @returns {boolean} `false` when a run was vetoed.
 */
function alterRuns(
  hot: HotInstance, axis: 'row' | 'column', runs: Array<[number, number]>, insert: boolean, source: string,
): boolean {
  const insertAction = axis === 'row' ? 'insert_row_above' : 'insert_col_start';
  const removeAction = axis === 'row' ? 'remove_row' : 'remove_col';
  const orderedRuns = insert ? runs : runs.slice().reverse();
  const appliedRuns: Array<[number, number]> = [];

  for (const [start, length] of orderedRuns) {
    const countBefore = countSourceItems(hot, axis);

    // `keepEmptyRows` - the replay must not grow spare rows between two recorded entries.
    hot.alter(insert ? insertAction : removeAction, start, length, source, true);

    const applied = countSourceItems(hot, axis) - countBefore;

    if (applied !== (insert ? length : -length)) {
      // An insert can land in part (`maxRows` clamps it). Those rows are new and empty, so they are
      // taken out again. A removal that landed in part cannot be taken back: its rows are gone.
      if (insert && applied > 0) {
        hot.alter(removeAction, start, applied, source, true);
      }

      appliedRuns.reverse().forEach(([appliedStart, appliedLength]) => {
        hot.alter(insert ? removeAction : insertAction, appliedStart, appliedLength, source, true);
      });

      return false;
    }

    appliedRuns.push([start, length]);
  }

  return true;
}

/**
 * Collects the writes that fill re-created rows with their recorded content.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {RemoveRowsJournalOp} op The journal entry.
 * @returns {Array}
 */
function collectRowContent(hot: HotInstance, op: RemoveRowsJournalOp): SourceChange[] {
  const changes: SourceChange[] = [];

  op.physicalIndexes.forEach((physicalRow, position) => {
    const row = op.rows[position];

    if (Array.isArray(row)) {
      row.forEach((value, column) => changes.push([physicalRow, column, deepClone(value)]));

    } else if (isPlainObject(row)) {
      Object.keys(row).forEach(key => changes.push([physicalRow, key, deepClone(row[key])]));
    }

    // The values of accessor columns live behind the accessor and are invisible to the row copy.
    op.accessorValues[position]?.forEach(([physicalColumn, value]) => {
      const prop: unknown = hot.colToProp(hot.toVisualColumn(physicalColumn));

      if (isDataAccessorFn(prop)) {
        changes.push([physicalRow, prop, deepClone(value)]);
      }
    });
  });

  return changes;
}

/**
 * Replays a `removeRows` entry: an undo re-creates the rows and refills them, a redo removes them.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {RemoveRowsJournalOp} op The journal entry.
 * @param {RestoreDirection} direction The replay direction.
 * @param {string} source The replay source.
 * @returns {boolean} `false` when a listener vetoed the row change.
 */
function replayRemovedRows(
  hot: HotInstance, op: RemoveRowsJournalOp, direction: RestoreDirection, source: string,
): boolean {
  const runs = toRuns(op.physicalIndexes);

  if (direction === 'redo') {
    return alterRuns(hot, 'row', runs, false, source);
  }

  if (!alterRuns(hot, 'row', runs, true, source)) {
    return false;
  }

  writeSource(hot, collectRowContent(hot, op), source);
  applyMetaStates(hot, op.metas);

  return true;
}

/**
 * Replays a `removeColumns` entry: an undo re-creates the columns and refills them, a redo removes them.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {RemoveColumnsJournalOp} op The journal entry.
 * @param {RestoreDirection} direction The replay direction.
 * @param {string} source The replay source.
 * @returns {boolean} `false` when a listener vetoed the column change.
 */
function replayRemovedColumns(
  hot: HotInstance, op: RemoveColumnsJournalOp, direction: RestoreDirection, source: string,
): boolean {
  const runs = toRuns(op.physicalIndexes);

  if (direction === 'redo') {
    return alterRuns(hot, 'column', runs, false, source);
  }

  if (!alterRuns(hot, 'column', runs, true, source)) {
    return false;
  }

  const changes: SourceChange[] = [];

  op.physicalIndexes.forEach((physicalColumn, position) => {
    op.values[position].forEach((value, row) => changes.push([row, physicalColumn, deepClone(value)]));
  });

  writeSource(hot, changes, source);
  applyMetaStates(hot, op.metas);

  return true;
}

/**
 * Replays an `insertRows` entry.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {InsertRowsJournalOp} op The journal entry.
 * @param {RestoreDirection} direction The replay direction.
 * @param {string} source The replay source.
 * @returns {boolean} `false` when a listener vetoed the row change.
 */
function replayInsertedRows(
  hot: HotInstance, op: InsertRowsJournalOp, direction: RestoreDirection, source: string,
): boolean {
  return alterRuns(hot, 'row', [[op.physicalIndex, op.amount]], direction === 'redo', source);
}

/**
 * Replays an `insertColumns` entry.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {InsertColumnsJournalOp} op The journal entry.
 * @param {RestoreDirection} direction The replay direction.
 * @param {string} source The replay source.
 * @returns {boolean} `false` when a listener vetoed the column change.
 */
function replayInsertedColumns(
  hot: HotInstance, op: InsertColumnsJournalOp, direction: RestoreDirection, source: string,
): boolean {
  return alterRuns(hot, 'column', [[op.physicalIndex, op.amount]], direction === 'redo', source);
}

/**
 * Replays a `meta` entry.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {MetaJournalOp} op The journal entry.
 * @param {RestoreDirection} direction The replay direction.
 */
function replayMeta(hot: HotInstance, op: MetaJournalOp, direction: RestoreDirection) {
  hot._getMetaManager().applyCellMetaKeyState(
    op.physicalRow, op.physicalColumn, op.key, direction === 'undo' ? op.before : op.after
  );
}

/**
 * Inserts or removes cell meta rows, putting back the key states recorded for removed rows when
 * they come back.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {boolean} insert `true` to insert meta rows, `false` to remove them.
 * @param {number} physicalRow The first physical row.
 * @param {number} amount The number of meta rows.
 * @param {CellMetaKeyStateEntry[]} metas The key states of the rows that come back.
 */
function shiftMetaRows(
  hot: HotInstance, insert: boolean, physicalRow: number, amount: number, metas: CellMetaKeyStateEntry[],
) {
  const metaManager = hot._getMetaManager();

  if (insert) {
    metaManager.createRow(physicalRow, amount);
    applyMetaStates(hot, metas);
  } else {
    metaManager.removeRow(physicalRow, amount);
  }
}

/**
 * Replays a `metaRows` entry.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {MetaRowsJournalOp} op The journal entry.
 * @param {RestoreDirection} direction The replay direction.
 */
function replayMetaRows(hot: HotInstance, op: MetaRowsJournalOp, direction: RestoreDirection) {
  // An undo reverses the shift, a redo repeats it.
  shiftMetaRows(hot, op.insert === (direction === 'redo'), op.physicalRow, op.amount, op.metas);
}

/**
 * Returns the row changes a row entry makes in a replay direction, in the order they apply: runs
 * that come back from the first one down, runs that go away from the last one up, so each run's
 * physical indexes are the recorded ones when it applies.
 *
 * @param {InsertRowsJournalOp|RemoveRowsJournalOp} op The journal entry.
 * @param {RestoreDirection} direction The replay direction.
 * @returns {RowChange[]}
 */
function toRowChanges(op: InsertRowsJournalOp | RemoveRowsJournalOp, direction: RestoreDirection): RowChange[] {
  const insert = op.type === 'insertRows' ? direction === 'redo' : direction === 'undo';
  const runs: Array<[number, number]> = op.type === 'insertRows' ?
    [[op.physicalIndex, op.amount]] : toRuns(op.physicalIndexes);
  const changes = runs.map(([start, amount]): RowChange => ({ insert, start, amount }));

  return insert ? changes : changes.reverse();
}

/**
 * Replays a row entry of a step whose source shape was restored from the snapshot. The restored
 * shape already holds the rows' data, so only the cell meta rows are moved.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {InsertRowsJournalOp|RemoveRowsJournalOp} op The journal entry.
 * @param {RestoreDirection} direction The replay direction.
 */
function replayRowsOnMeta(
  hot: HotInstance, op: InsertRowsJournalOp | RemoveRowsJournalOp, direction: RestoreDirection,
) {
  const metas = op.type === 'removeRows' ? op.metas : [];

  toRowChanges(op, direction).forEach(({ insert, start, amount }) => {
    shiftMetaRows(hot, insert, start, amount, insert ? metas : []);
  });
}

/**
 * Asks the row hooks about the row changes a restore of a reshaped source makes, before anything
 * changes - the rows do not go through `alter()`, which would ask them. Every change is asked, even
 * after a veto, so each listener hears about all of them.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {RowChange[]} changes The row changes.
 * @param {string} source The replay source.
 * @returns {boolean} `false` when a listener vetoed a change.
 */
function askRowChanges(hot: HotInstance, changes: RowChange[], source: string): boolean {
  let allowed = true;

  changes.forEach(({ insert, start, amount }) => {
    const answer = insert ?
      hot.runHooks('beforeCreateRow', start, amount, source) :
      hot.runHooks('beforeRemoveRow', start, amount, rangeOf(start, amount), source);

    if (answer === false) {
      allowed = false;
    }
  });

  return allowed;
}

/**
 * Reports the row changes a restore of a reshaped source made.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {RowChange[]} changes The row changes.
 * @param {string} source The replay source.
 */
function announceRowChanges(hot: HotInstance, changes: RowChange[], source: string) {
  changes.forEach(({ insert, start, amount }) => {
    if (insert) {
      hot.runHooks('afterCreateRow', start, amount, source);
    } else {
      hot.runHooks('afterRemoveRow', start, amount, rangeOf(start, amount), source);
    }
  });
}

/**
 * Returns the indexes `start` to `start + amount - 1`.
 *
 * @param {number} start The first index.
 * @param {number} amount The number of indexes.
 * @returns {number[]}
 */
function rangeOf(start: number, amount: number): number[] {
  const indexes = new Array<number>(amount);

  for (let offset = 0; offset < amount; offset++) {
    indexes[offset] = start + offset;
  }

  return indexes;
}

/**
 * Replays one journal entry.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {JournalOp} op The journal entry.
 * @param {RestoreDirection} direction The replay direction.
 * @param {string} source The replay source.
 * @param {boolean} shapeRestored `true` when the source shape was restored from the snapshot, so a
 *   row entry moves the cell meta rows only.
 * @returns {boolean} `false` when a listener vetoed a row or column change of the entry.
 */
function replayOp(
  hot: HotInstance, op: JournalOp, direction: RestoreDirection, source: string, shapeRestored: boolean,
): boolean {
  if (shapeRestored && isRowStructural(op)) {
    replayRowsOnMeta(hot, op, direction);

    return true;
  }

  switch (op.type) {
    case 'cells':
      replayCells(hot, op, direction, source);

      return true;
    case 'insertRows':
      return replayInsertedRows(hot, op, direction, source);
    case 'removeRows':
      return replayRemovedRows(hot, op, direction, source);
    case 'insertColumns':
      return replayInsertedColumns(hot, op, direction, source);
    case 'removeColumns':
      return replayRemovedColumns(hot, op, direction, source);
    case 'metaRows':
      replayMetaRows(hot, op, direction);

      return true;
    default:
      replayMeta(hot, op, direction);

      return true;
  }
}

/**
 * Replays journal entries in order. When a listener vetoes an entry's row or column change, the
 * entries replayed before it are reverted, so the call either applies completely or not at all.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {JournalOp[]} ops The entries, in replay order.
 * @param {RestoreDirection} direction The replay direction.
 * @param {string} source The replay source.
 * @param {boolean} shapeRestored `true` when the source shape was restored from the snapshot.
 * @returns {boolean} `false` when an entry was vetoed.
 */
function replayJournal(
  hot: HotInstance, ops: JournalOp[], direction: RestoreDirection, source: string, shapeRestored: boolean,
): boolean {
  const appliedOps: JournalOp[] = [];

  for (const op of ops) {
    if (!replayOp(hot, op, direction, source, shapeRestored)) {
      const reverse = direction === 'undo' ? 'redo' : 'undo';

      appliedOps.reverse().forEach(appliedOp => replayOp(hot, appliedOp, reverse, source, shapeRestored));

      return false;
    }

    appliedOps.push(op);
  }

  return true;
}

/**
 * Restores a recorded step, in this order:
 *
 * 1. When the journal adds or removes rows or columns, the row and column order is reset to the
 *    physical order, so a visual index names the physical row or column of the same number while
 *    the journal is replayed. The maps are put back in step 5.
 * 2. For a plugin that reshapes the source array itself (NestedRows), the rows its shape adds or
 *    removes are asked about through `beforeCreateRow` and `beforeRemoveRow` - they do not go
 *    through `alter()`, which would ask. Then the shape is put back from the snapshot.
 * 3. The journal, backwards for an undo, forwards for a redo. With a restored shape, a row entry
 *    moves the cell meta rows only: the shape already holds the rows' data.
 * 4. With a restored shape, `afterCreateRow` and `afterRemoveRow` report its rows.
 * 5. The index maps, the plugin states and the settings the step changed, from the snapshot. What the
 *    step left alone keeps its current state, so a change made outside any step since (a trim a
 *    settings update applied) survives the undo.
 *
 * Everything runs inside one suspended render and index-cache batch. When a listener vetoes a row or
 * column change, the replay is reverted and the grid is put back as it was.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {GridStateTracker} tracker The grid state tracker.
 * @param {StepRecord} record The step to restore.
 * @param {RestoreDirection} direction The replay direction.
 * @returns {boolean} `false` when the replay was vetoed and nothing changed.
 */
export function restoreStep(
  hot: HotInstance, tracker: GridStateTracker, record: StepRecord, direction: RestoreDirection,
): boolean {
  const target: GridStateSnapshot = direction === 'undo' ? record.before : record.after;
  const other: GridStateSnapshot = direction === 'undo' ? record.after : record.before;
  const source = direction === 'undo' ? 'UndoRedo.undo' : 'UndoRedo.redo';
  const ops = direction === 'undo' ? record.journal.slice().reverse() : record.journal;
  const shapeRestored = target.sourceStructures.size > 0;
  const rowChanges = shapeRestored ?
    ops.filter(isRowStructural).flatMap(op => toRowChanges(op, direction)) : [];
  const reordersForReplay = ops.some(isStructural);

  return safeBatch(hot, () => {
    const current = tracker.capture();

    if (reordersForReplay) {
      tracker.resetToPhysicalOrder();
    }

    if (!askRowChanges(hot, rowChanges, source)) {
      tracker.restore(current, { forceOrder: reordersForReplay });

      return false;
    }

    tracker.restoreSourceStructures(target, other);

    if (shapeRestored) {
      // The restored shape can hold another number of rows. The maps get their values in step 5.
      hot.rowIndexMapper.fitToLength(hot.countSourceRows());
    }

    if (!replayJournal(hot, ops, direction, source, shapeRestored)) {
      // A listener vetoed part of the replay. The grid is put back as it was, so the step can stay
      // on its stack.
      tracker.restoreSourceStructures(current);
      tracker.restore(current, { forceOrder: reordersForReplay });

      return false;
    }

    announceRowChanges(hot, rowChanges, source);

    // Only what the step changed is written back, so a change made outside any step since survives.
    tracker.restore(target, { changedFrom: other, base: current, forceOrder: reordersForReplay });

    // A full render when the batch ends. A step that changed only cell meta asks for none itself, and
    // the fast draw the batch ends with would keep every cell as it was painted.
    hot.render();

    return true;
  });
}
