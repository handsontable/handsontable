import type { HotInstance } from '../../core/types';
import type { CellChange, ColumnDataGetterSetterFunction } from '../../settings';
import type {
  InsertColumnsJournalOp,
  InsertRowsJournalOp,
  JournalOp,
  RemoveColumnsJournalOp,
  RemoveRowsJournalOp,
} from '../../dataMap/dataJournal';
import { isPlainObject } from '../../helpers/object';
import { isDataAccessorFn } from '../../dataMap/dataSource';
import type { StepRecord } from './entry';
import type { RestoreDirection } from './restore';

/**
 * One cell a restore wrote, addressed in the grid the restore leaves behind.
 */
export interface RestoredCell {
  physicalRow: number;
  prop: string | number | ColumnDataGetterSetterFunction;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Returns the insertion a journal entry makes on an axis, if it makes one.
 *
 * @param {JournalOp} op The journal entry.
 * @param {string} axis `row` or `column`.
 * @returns {object|null}
 */
function insertionOn(op: JournalOp, axis: 'row' | 'column'): InsertRowsJournalOp | InsertColumnsJournalOp | null {
  if (op.type === 'insertRows') {
    return axis === 'row' ? op : null;
  }

  if (op.type === 'insertColumns') {
    return axis === 'column' ? op : null;
  }

  return null;
}

/**
 * Returns the indexes a journal entry removes on an axis, ascending, if it removes any.
 *
 * @param {JournalOp} op The journal entry.
 * @param {string} axis `row` or `column`.
 * @returns {number[]|null}
 */
function removalOn(op: JournalOp, axis: 'row' | 'column'): number[] | null {
  if (op.type === 'removeRows') {
    return axis === 'row' ? op.physicalIndexes : null;
  }

  if (op.type === 'removeColumns') {
    return axis === 'column' ? op.physicalIndexes : null;
  }

  return null;
}

/**
 * Returns an index a removal left behind as it was before the removal.
 *
 * @param {number} index The index after the removal.
 * @param {number[]} removedIndexes The removed indexes, ascending.
 * @returns {number}
 */
function moveIndexPastRemoved(index: number, removedIndexes: number[]): number {
  let result = index;

  removedIndexes.forEach((removedIndex) => {
    if (removedIndex <= result) {
      result += 1;
    }
  });

  return result;
}

/**
 * Maps an index recorded by a journal entry to the grid as it was before the step: the row and column
 * changes recorded before the entry are reversed, last one first.
 *
 * @param {JournalOp[]} journal The step journal.
 * @param {number} opIndex The position of the entry in the journal.
 * @param {number} index The index, as the entry recorded it.
 * @param {string} axis `row` or `column`.
 * @returns {number|null} The index, or `null` when the row or column did not exist then.
 */
function toIndexBeforeStep(
  journal: JournalOp[], opIndex: number, index: number, axis: 'row' | 'column',
): number | null {
  let result = index;

  for (let position = opIndex - 1; position >= 0; position--) {
    const insertion = insertionOn(journal[position], axis);
    const removed = removalOn(journal[position], axis);

    if (insertion !== null && result >= insertion.physicalIndex) {
      if (result < insertion.physicalIndex + insertion.amount) {
        return null;
      }

      result -= insertion.amount;
    }

    // Ascending, so the index moves past every removed one that sat at or before it.
    if (removed !== null) {
      result = moveIndexPastRemoved(result, removed);
    }
  }

  return result;
}

/**
 * Maps an index recorded by a journal entry to the grid as it was after the step: the row and column
 * changes recorded after the entry are applied, first one first.
 *
 * @param {JournalOp[]} journal The step journal.
 * @param {number} opIndex The position of the entry in the journal.
 * @param {number} index The index, as the entry recorded it.
 * @param {string} axis `row` or `column`.
 * @returns {number|null} The index, or `null` when the row or column was removed later in the step.
 */
function toIndexAfterStep(
  journal: JournalOp[], opIndex: number, index: number, axis: 'row' | 'column',
): number | null {
  let result = index;

  for (let position = opIndex + 1; position < journal.length; position++) {
    const insertion = insertionOn(journal[position], axis);
    const removed = removalOn(journal[position], axis);

    if (insertion !== null && result >= insertion.physicalIndex) {
      result += insertion.amount;
    }

    if (removed !== null) {
      const current = result;

      if (removed.includes(current)) {
        return null;
      }

      result -= removed.filter(removedIndex => removedIndex < current).length;
    }
  }

  return result;
}

/**
 * Maps an index to the grid a restore leaves behind. A journal entry addresses rows and columns as
 * they were when it was recorded, and the row and column changes recorded around it move them: an undo
 * leaves the grid as it was before the step, a redo as it was after it.
 *
 * @param {JournalOp[]} journal The step journal.
 * @param {number} opIndex The position of the entry in the journal.
 * @param {number} index The index, as the entry recorded it.
 * @param {string} axis `row` or `column`.
 * @param {RestoreDirection} direction The replay direction.
 * @returns {number|null} The index, or `null` when the row or column does not exist in that grid.
 */
export function toFinalIndex(
  journal: JournalOp[], opIndex: number, index: number, axis: 'row' | 'column', direction: RestoreDirection,
): number | null {
  return direction === 'undo' ?
    toIndexBeforeStep(journal, opIndex, index, axis) : toIndexAfterStep(journal, opIndex, index, axis);
}

/**
 * Maps a prop to the grid a restore leaves behind. A numeric prop is a physical column index (array
 * data), so it moves with the recorded column changes; a named prop and an accessor do not.
 *
 * @param {JournalOp[]} journal The step journal.
 * @param {number} opIndex The position of the entry in the journal.
 * @param {string|number|Function} prop The prop, as the entry recorded it.
 * @param {RestoreDirection} direction The replay direction.
 * @returns {string|number|Function|null}
 */
function toFinalProp(
  journal: JournalOp[], opIndex: number, prop: RestoredCell['prop'], direction: RestoreDirection,
): RestoredCell['prop'] | null {
  return typeof prop === 'number' ? toFinalIndex(journal, opIndex, prop, 'column', direction) : prop;
}

/**
 * Collects the cells an undo of a row removal filled back in.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {JournalOp[]} journal The step journal.
 * @param {number} opIndex The position of the removal in the journal.
 * @param {RemoveRowsJournalOp} op The removal.
 * @param {RestoredCell[]} cells The collected cells.
 */
function collectRestoredRows(
  hot: HotInstance, journal: JournalOp[], opIndex: number, op: RemoveRowsJournalOp, cells: RestoredCell[],
) {
  op.physicalIndexes.forEach((recordedRow, position) => {
    const physicalRow = toFinalIndex(journal, opIndex, recordedRow, 'row', 'undo');
    const row = op.rows[position];

    if (physicalRow === null) {
      return;
    }

    if (Array.isArray(row)) {
      row.forEach((newValue, column) => {
        const prop = toFinalProp(journal, opIndex, column, 'undo');

        if (prop !== null) {
          cells.push({ physicalRow, prop, oldValue: null, newValue });
        }
      });

    } else if (isPlainObject(row)) {
      Object.keys(row).forEach(prop => cells.push({ physicalRow, prop, oldValue: null, newValue: row[prop] }));
    }

    op.accessorValues[position]?.forEach(([physicalColumn, newValue]) => {
      const prop: unknown = hot.colToProp(hot.toVisualColumn(physicalColumn));

      if (isDataAccessorFn(prop)) {
        cells.push({ physicalRow, prop, oldValue: null, newValue });
      }
    });
  });
}

/**
 * Collects the cells an undo of a column removal filled back in.
 *
 * @param {JournalOp[]} journal The step journal.
 * @param {number} opIndex The position of the removal in the journal.
 * @param {RemoveColumnsJournalOp} op The removal.
 * @param {RestoredCell[]} cells The collected cells.
 */
function collectRestoredColumns(
  journal: JournalOp[], opIndex: number, op: RemoveColumnsJournalOp, cells: RestoredCell[],
) {
  op.physicalIndexes.forEach((recordedColumn, position) => {
    const prop = toFinalIndex(journal, opIndex, recordedColumn, 'column', 'undo');

    if (prop === null) {
      return;
    }

    op.values[position].forEach((newValue, recordedRow) => {
      const physicalRow = toFinalIndex(journal, opIndex, recordedRow, 'row', 'undo');

      if (physicalRow !== null) {
        cells.push({ physicalRow, prop, oldValue: null, newValue });
      }
    });
  });
}

/**
 * Returns the cells a restore wrote, in the order it wrote them, addressed in the grid it left
 * behind: the recorded cell changes, and for an undo, the content of the rows and columns a removal
 * took away.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {StepRecord} record The restored step.
 * @param {RestoreDirection} direction The replay direction.
 * @returns {RestoredCell[]}
 */
export function collectRestoredCells(
  hot: HotInstance, record: StepRecord, direction: RestoreDirection,
): RestoredCell[] {
  const { journal } = record;
  const cells: RestoredCell[] = [];

  for (let step = 0; step < journal.length; step++) {
    const opIndex = direction === 'undo' ? journal.length - 1 - step : step;
    const op = journal[opIndex];

    if (op.type === 'cells') {
      const deltas = direction === 'undo' ? op.changes.slice().reverse() : op.changes;

      deltas.forEach(({ physicalRow: recordedRow, prop: recordedProp, oldValue, newValue }) => {
        const physicalRow = toFinalIndex(journal, opIndex, recordedRow, 'row', direction);
        const prop = toFinalProp(journal, opIndex, recordedProp, direction);

        if (physicalRow !== null && prop !== null) {
          cells.push(direction === 'undo' ?
            { physicalRow, prop, oldValue: newValue, newValue: oldValue } :
            { physicalRow, prop, oldValue, newValue });
        }
      });

    } else if (op.type === 'removeRows' && direction === 'undo') {
      collectRestoredRows(hot, journal, opIndex, op, cells);

    } else if (op.type === 'removeColumns' && direction === 'undo') {
      collectRestoredColumns(journal, opIndex, op, cells);
    }
  }

  return cells;
}

/**
 * Returns the visual row of a physical one, or `null` when the row has none (trimmed).
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number} physicalRow The physical row.
 * @returns {number|null}
 */
function toVisualRow(hot: HotInstance, physicalRow: number): number | null {
  const visualRow: number | null = hot.toVisualRow(physicalRow);

  return typeof visualRow === 'number' && Number.isInteger(visualRow) ? visualRow : null;
}

/**
 * Returns restored cells in the `afterChange` format - `[visualRow, prop, oldValue, newValue]`. A cell
 * with no visual row (trimmed) is left out, as it is for any write that bypasses the visual grid.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {RestoredCell[]} cells The restored cells.
 * @returns {Array}
 */
export function toCellChanges(hot: HotInstance, cells: RestoredCell[]): CellChange[] {
  const changes: CellChange[] = [];

  cells.forEach(({ physicalRow, prop, oldValue, newValue }) => {
    const visualRow = toVisualRow(hot, physicalRow);

    if (visualRow !== null) {
      changes.push([visualRow, prop, oldValue, newValue]);
    }
  });

  return changes;
}

/**
 * Returns the visual coordinates of the restored cells that are visible, each cell once.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {RestoredCell[]} cells The restored cells.
 * @returns {Array<Array<number>>}
 */
export function toVisibleCells(hot: HotInstance, cells: RestoredCell[]): Array<[number, number]> {
  const seen = new Set<string>();
  const visibleCells: Array<[number, number]> = [];

  cells.forEach(({ physicalRow, prop }) => {
    const visualRow = toVisualRow(hot, physicalRow);
    const visualColumn = typeof prop === 'function' ? null : hot.propToCol(prop);
    const key = `${visualRow}:${visualColumn}`;

    if (
      visualRow !== null && typeof visualColumn === 'number' && Number.isInteger(visualColumn) && !seen.has(key)
    ) {
      seen.add(key);
      visibleCells.push([visualRow, visualColumn]);
    }
  });

  return visibleCells;
}
