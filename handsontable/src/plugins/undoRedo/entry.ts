import type { HotInstance } from '../../core/types';
import type { OperationTransaction } from '../../core/operationScope';
import type { JournalOp, RemoveColumnsJournalOp, RemoveRowsJournalOp } from '../../dataMap/dataJournal';
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
 * Collects the `changes` field of a `change` step: `[visualRow, visualColumn, oldValue, newValue]` per
 * changed cell, in the order the cells were written.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {JournalOp[]} journal The step journal.
 * @returns {Array}
 */
function collectChanges(hot: HotInstance, journal: JournalOp[]): unknown[][] {
  const changes: unknown[][] = [];

  journal.forEach((op) => {
    if (op.type !== 'cells') {
      return;
    }

    const deltas = op.reversed === true ? op.changes.slice().reverse() : op.changes;

    deltas.forEach(({ physicalRow, prop, oldValue, newValue }) => {
      // A `columns[].data` accessor has no public prop-to-column translation; it reports `null`,
      // as a trimmed row does.
      const visualColumn = typeof prop === 'function' ? null : hot.propToCol(prop);

      changes.push([toVisualRowOrNull(hot, physicalRow), visualColumn, oldValue, newValue]);
    });
  });

  return changes;
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
 * one cell, and the written cell otherwise - the `selected` field the replaced action exposed.
 *
 * @param {Array} changes The `changes` field of the step.
 * @param {Array} selectionAtOpen The selection when the step started.
 * @returns {Array|undefined}
 */
function selectChangedCells(changes: unknown[][], selectionAtOpen: SelectionSnapshot): number[][] | undefined {
  if (changes.length > 1) {
    return selectionAtOpen;
  }

  const [row, column] = changes[0] ?? [];

  return typeof row === 'number' && typeof column === 'number' ? [[row, column]] : undefined;
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
 * transaction's outermost operation - the names the replaced action classes used (`change`,
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
  let fields: Record<string, unknown>;

  if (transaction.name === 'change') {
    const changes = collectChanges(hot, transaction.journal);

    fields = { changes, selected: selectChangedCells(changes, selectionAtOpen) };
  } else {
    fields = describeStructuralStep(hot, transaction, before);
  }

  const step: UndoRedoStep = {
    ...transaction.details,
    ...fields,
    actionType: transaction.name,
    source: transaction.source,
    operations: transaction.operations.slice(),
    sources: transaction.sources.slice(),
  };

  return { step, selection: describeStepSelection(step) };
}
