import type { HotInstance } from '../../core/types';
import type { OperationTransaction } from '../../core/operationScope';
import type {
  CellDelta, JournalOp, RemoveColumnsJournalOp, RemoveRowsJournalOp,
} from '../../dataMap/dataJournal';
import type { GridStateSnapshot } from './snapshot/gridState';

/**
 * The selection a step restores, in the `getSelected()` format.
 */
export type SelectionSnapshot = number[][] | undefined;

/**
 * What UndoRedo keeps for one recorded step, besides the public fields of the step itself.
 */
export interface StepRecord {
  /**
   * The structure epoch the step was recorded in. A step from an older epoch describes a dataset
   * that is gone, so it is never restored.
   */
  epoch: number;
  /**
   * The grid state before the step.
   */
  before: GridStateSnapshot;
  /**
   * The grid state after the step.
   */
  after: GridStateSnapshot;
  /**
   * The data and cell meta changes the step made, in order.
   */
  journal: JournalOp[];
  /**
   * The selection an undo and a redo of the step put back.
   */
  selection: StepSelection;
}

/**
 * A selection an undo or a redo puts back: cell ranges in the `getSelected()` format, or a span of
 * whole rows or columns.
 */
export type StepSelectionTarget =
  | { readonly kind: 'cells'; readonly ranges: number[][] }
  | { readonly kind: 'rows'; readonly from: number; readonly to: number }
  | { readonly kind: 'columns'; readonly from: number; readonly to: number };

/**
 * The selections a step puts back. `null` leaves the selection as it is.
 */
export interface StepSelection {
  readonly undo: StepSelectionTarget | null;
  readonly redo: StepSelectionTarget | null;
}

/**
 * The selection of a step that leaves the selection alone in both directions.
 */
const NO_SELECTION: StepSelection = Object.freeze({ undo: null, redo: null });

/**
 * The public shape of one undo step: what the undo hooks receive and what the stacks hold.
 */
export interface UndoRedoStep {
  actionType: string;
  source?: string;
  operations?: string[];
  sources?: Array<string | undefined>;
  [key: string]: unknown;
}

/**
 * Returns the visual row of a physical row, or `null` for a row with no visual index (trimmed).
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number} physicalRow The physical row.
 * @returns {number|null}
 */
function toVisualRowOrNull(hot: HotInstance, physicalRow: number): number | null {
  const visualRow: number | null = hot.toVisualRow(physicalRow);

  return Number.isInteger(visualRow) ? visualRow : null;
}

/**
 * The visual position of every changed cell of a `change` step, resolved when the step is recorded.
 * The values stay in the journal, so a step holds one number per cell until its `changes` field is
 * read, not a tuple per cell.
 */
interface ChangedCellsIndex {
  /**
   * The visual row of each changed cell, in the `changes` order. `-1` stands for `null`.
   */
  readonly rows: Int32Array;
  /**
   * The visual column of each written prop, as `propToCol()` answered it.
   */
  readonly columns: ReadonlyMap<CellDelta['prop'], unknown>;
}

/**
 * Calls the callback for every changed cell of a journal, in the order the cells were written: a
 * reversed run is read backwards (see `CellsJournalOp#reversed`).
 *
 * @param {JournalOp[]} journal The step journal.
 * @param {Function} callback Called with the change and its position in the `changes` order.
 */
function forEachChangedCell(journal: JournalOp[], callback: (delta: CellDelta, index: number) => void) {
  let index = 0;

  journal.forEach((op) => {
    if (op.type !== 'cells') {
      return;
    }

    const { changes } = op;

    if (op.reversed === true) {
      for (let deltaIndex = changes.length - 1; deltaIndex >= 0; deltaIndex -= 1) {
        callback(changes[deltaIndex], index);
        index += 1;
      }
    } else {
      changes.forEach((delta) => {
        callback(delta, index);
        index += 1;
      });
    }
  });
}

/**
 * Resolves the visual position of every changed cell of a journal now, while the index maps still
 * describe the grid the step was recorded on: a later sort or move must not change what the step
 * reports.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {JournalOp[]} journal The step journal.
 * @returns {ChangedCellsIndex}
 */
function indexChangedCells(hot: HotInstance, journal: JournalOp[]): ChangedCellsIndex {
  const count = journal.reduce((sum, op) => (op.type === 'cells' ? sum + op.changes.length : sum), 0);
  const rows = new Int32Array(count);
  const columns = new Map<CellDelta['prop'], unknown>();

  forEachChangedCell(journal, ({ physicalRow, prop }, index) => {
    rows[index] = toVisualRowOrNull(hot, physicalRow) ?? -1;

    if (!columns.has(prop)) {
      // A `columns[].data` accessor has no public prop-to-column translation; it reports `null`,
      // as a trimmed row does.
      columns.set(prop, typeof prop === 'function' ? null : hot.propToCol(prop));
    }
  });

  return { rows, columns };
}

/**
 * Builds the `changes` field of a `change` step: `[visualRow, visualColumn, oldValue, newValue]` per
 * changed cell, in the order the cells were written.
 *
 * @param {JournalOp[]} journal The step journal.
 * @param {ChangedCellsIndex} index The positions resolved when the step was recorded.
 * @returns {Array}
 */
function buildChanges(journal: JournalOp[], { rows, columns }: ChangedCellsIndex): unknown[][] {
  const changes = new Array<unknown[]>(rows.length);

  forEachChangedCell(journal, ({ prop, oldValue, newValue }, index) => {
    const visualRow = rows[index];

    changes[index] = [visualRow === -1 ? null : visualRow, columns.get(prop), oldValue, newValue];
  });

  return changes;
}

/**
 * Up to this many changed cells, a step's `changes` field is built at once: the list is smaller than
 * what deferring it holds (the index, the accessor and its closures), and one-cell edits are the most
 * common steps.
 */
const EAGER_CHANGES_LIMIT = 16;

/**
 * Defines the `changes` field as a plain writable data property, the shape it always had.
 *
 * @param {object} target The object to define it on.
 * @param {*} value The value.
 */
function defineChangesValue(target: object, value: unknown) {
  Object.defineProperty(target, 'changes', { value, writable: true, enumerable: true, configurable: true });
}

/**
 * Turns the `changes` field of a step into one that is built on its first read. Most steps are never
 * inspected, and a tuple per changed cell doubled the memory of a bulk write's step. On the first read
 * or write the field becomes a plain writable property, so a listener sees and sets an ordinary array.
 *
 * @param {UndoRedoStep} step The step, which already holds a `changes` key (the key order stays).
 * @param {Function} build Builds the list.
 */
function defineLazyChanges(step: UndoRedoStep, build: () => unknown[][]) {
  // A step an application froze or sealed before the first read (a store that freezes what it holds)
  // keeps the accessor, which then serves this value.
  let value: unknown = null;
  let isBuilt = false;

  Object.defineProperty(step, 'changes', {
    enumerable: true,
    configurable: true,
    get(this: object) {
      if (!isBuilt) {
        value = build();
        isBuilt = true;
      }

      if (Object.getOwnPropertyDescriptor(this, 'changes')?.configurable === true) {
        defineChangesValue(this, value);
      }

      return value;
    },
    set(this: object, newValue: unknown) {
      const own = Object.getOwnPropertyDescriptor(this, 'changes');

      // An object that inherits from the step gets a property of its own, as an assignment always gave it.
      if (own === undefined ? Object.isExtensible(this) : own.configurable === true) {
        defineChangesValue(this, newValue);
      } else if (this === step && !Object.isFrozen(step)) {
        // A sealed step: its data property would have taken the value.
        value = newValue;
        isBuilt = true;
      }
    },
  });
}

/**
 * Returns an index, or `null` when it is not a number (a row with no visual index).
 *
 * @param {number|null} index The index.
 * @returns {number|null}
 */
function toVisualOrNull(index: number | null): number | null {
  return typeof index === 'number' && Number.isInteger(index) ? index : null;
}

/**
 * Returns the physical index the first insertion of a type started at.
 *
 * @param {JournalOp[]} journal The step journal.
 * @param {string} type `insertRows` or `insertColumns`.
 * @returns {number}
 */
function firstInserted(journal: JournalOp[], type: 'insertRows' | 'insertColumns'): number {
  for (const op of journal) {
    if (op.type === type) {
      return op.physicalIndex;
    }
  }

  return -1;
}

/**
 * Sums the `amount` of every journal entry of a type.
 *
 * @param {JournalOp[]} journal The step journal.
 * @param {string} type `insertRows` or `insertColumns`.
 * @returns {number}
 */
function sumInserted(journal: JournalOp[], type: 'insertRows' | 'insertColumns'): number {
  return journal.reduce((sum, op) => (op.type === type ? sum + op.amount : sum), 0);
}

/**
 * Returns the values of the removed columns of a step, row by row (`data[row][removedColumn]`).
 *
 * @param {JournalOp[]} journal The step journal.
 * @returns {Array}
 */
function collectRemovedColumnData(journal: JournalOp[]): unknown[][] {
  const removedColumns = journal
    .filter((op): op is RemoveColumnsJournalOp => op.type === 'removeColumns')
    .flatMap(op => op.values);
  const rowCount = removedColumns.reduce((max, column) => Math.max(max, column.length), 0);
  const data: unknown[][] = [];

  for (let row = 0; row < rowCount; row++) {
    data.push(removedColumns.map(column => column[row]));
  }

  return data;
}

/**
 * Collects the fields a structural step exposes, the same ones the actions it replaces exposed.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {OperationTransaction} transaction The settled transaction.
 * @param {GridStateSnapshot} before The grid state before the step.
 * @returns {object}
 */
function describeStructuralStep(
  hot: HotInstance, transaction: OperationTransaction, before: GridStateSnapshot,
): Record<string, unknown> {
  const { name, journal } = transaction;

  switch (name) {
    case 'insert_row':
      return {
        index: toVisualOrNull(hot.toVisualRow(firstInserted(journal, 'insertRows'))),
        amount: sumInserted(journal, 'insertRows'),
      };

    case 'insert_col':
      return {
        index: toVisualOrNull(hot.toVisualColumn(firstInserted(journal, 'insertColumns'))),
        amount: sumInserted(journal, 'insertColumns'),
      };

    case 'remove_row': {
      const removals = journal.filter((op): op is RemoveRowsJournalOp => op.type === 'removeRows');
      const indexes = removals.flatMap(op => op.physicalIndexes);
      const data = removals.flatMap(op => op.rows);

      return {
        index: removals[0]?.firstPhysicalIndex ?? null,
        amount: data.length,
        indexes,
        data,
        accessorValues: removals.flatMap(op => op.accessorValues),
      };
    }

    case 'remove_col': {
      const indexes = journal
        .filter((op): op is RemoveColumnsJournalOp => op.type === 'removeColumns')
        .flatMap(op => op.physicalIndexes);
      const colHeaders = before.settings.colHeaders;

      return {
        amount: indexes.length,
        indexes,
        data: collectRemovedColumnData(journal),
        headers: colHeaders === null ? [] : indexes.map(physicalColumn => colHeaders[physicalColumn] ?? null),
      };
    }

    default:
      return {};
  }
}

/**
 * Tells whether a value is a list of integers.
 *
 * @param {*} value The value.
 * @returns {boolean}
 */
function isIndexList(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(index => Number.isInteger(index));
}

/**
 * Returns the ranges a change step selects: the selection it started with when it wrote more than
 * one cell, and the written cell otherwise – the `selected` field the replaced action exposed.
 *
 * @param {JournalOp[]} journal The step journal.
 * @param {ChangedCellsIndex} index The positions of the changed cells.
 * @param {Array} selectionAtOpen The selection when the step started.
 * @returns {Array|undefined}
 */
function selectChangedCells(
  journal: JournalOp[], { rows, columns }: ChangedCellsIndex, selectionAtOpen: SelectionSnapshot,
): number[][] | undefined {
  if (rows.length > 1) {
    return selectionAtOpen;
  }

  let column: unknown;

  forEachChangedCell(journal, ({ prop }) => {
    column = columns.get(prop);
  });

  const row = rows.length === 1 && rows[0] !== -1 ? rows[0] : null;

  return row !== null && typeof column === 'number' ? [[row, column]] : undefined;
}

/**
 * Returns the cell selection of a list of ranges, or `null` when there is none.
 *
 * @param {*} ranges The ranges.
 * @returns {object|null}
 */
function toCellsSelection(ranges: unknown): StepSelectionTarget | null {
  return Array.isArray(ranges) && ranges.length > 0 && ranges.every(isIndexList) ? { kind: 'cells', ranges } : null;
}

/**
 * Returns the selection of a row or column move: the moved span where it started for an undo, and
 * where it landed for a redo.
 *
 * @param {string} kind `rows` or `columns`.
 * @param {*} moved The moved indexes.
 * @param {*} finalIndex The index the move landed on.
 * @returns {StepSelection}
 */
function describeMoveSelection(kind: 'rows' | 'columns', moved: unknown, finalIndex: unknown): StepSelection {
  if (!isIndexList(moved) || moved.length === 0 || typeof finalIndex !== 'number') {
    return NO_SELECTION;
  }

  const span = moved.length - 1;

  return {
    undo: { kind, from: moved[0], to: moved[0] + span },
    redo: { kind, from: finalIndex, to: finalIndex + span },
  };
}

/**
 * Returns the selections a step puts back. Only the steps whose replaced actions moved the selection
 * do: a change selects the cells it wrote, a move selects what was moved, where it was before an undo
 * and where it went after a redo. Every other step leaves the selection alone.
 *
 * @param {UndoRedoStep} step The step.
 * @returns {StepSelection}
 */
function describeStepSelection(step: UndoRedoStep): StepSelection {
  switch (step.actionType) {
    case 'change': {
      const cells = toCellsSelection(step.selected);

      return { undo: cells, redo: cells };
    }

    case 'row_move':
      return describeMoveSelection('rows', step.rows, step.finalRowIndex);

    case 'col_move':
      return describeMoveSelection('columns', step.columns, step.finalColumnIndex);

    case 'move_cells':
      return { undo: toCellsSelection([step.sourceRange]), redo: toCellsSelection([step.targetRange]) };

    default:
      return NO_SELECTION;
  }
}

/**
 * Builds the public undo step for a settled transaction. Its `actionType` is the name of the
 * transaction's outermost operation – the names the replaced action classes used (`change`,
 * `remove_row`, `col_sort`, ...) for the operations they covered. The fields beyond that are the
 * ones those actions exposed and hooks have been reading, derived from the journal or attached by the
 * operation itself; the snapshots and the journal are deliberately not on it, because hooks receive
 * the step as it is.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {OperationTransaction} transaction The settled transaction.
 * @param {GridStateSnapshot} before The grid state before the step.
 * @param {Array} selectionAtOpen The selection when the step started.
 * @returns {object} The step and the selections its undo and redo put back.
 */
export function createStep(
  hot: HotInstance,
  transaction: OperationTransaction,
  before: GridStateSnapshot,
  selectionAtOpen: SelectionSnapshot,
): { step: UndoRedoStep, selection: StepSelection } {
  const { journal } = transaction;
  const changedCells = transaction.name === 'change' ? indexChangedCells(hot, journal) : null;
  const fields: Record<string, unknown> = changedCells === null ?
    describeStructuralStep(hot, transaction, before) :
    // `changes` holds its place in the key order and is defined below.
    { changes: undefined, selected: selectChangedCells(journal, changedCells, selectionAtOpen) };

  const step: UndoRedoStep = {
    ...transaction.details,
    ...fields,
    actionType: transaction.name,
    source: transaction.source,
    operations: transaction.operations.slice(),
    sources: transaction.sources.slice(),
  };

  if (changedCells !== null && changedCells.rows.length <= EAGER_CHANGES_LIMIT) {
    defineChangesValue(step, buildChanges(journal, changedCells));
  } else if (changedCells !== null) {
    defineLazyChanges(step, () => buildChanges(journal, changedCells));
  }

  return { step, selection: describeStepSelection(step) };
}
