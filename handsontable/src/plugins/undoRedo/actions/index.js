import { CellAlignmentAction } from './cellAlignment';
import { ColumnMoveAction } from './columnMove';
import { ColumnSortAction } from './columnSort';
import { CreateColumnAction } from './createColumn';
import { CreateRowAction } from './createRow';
import { DataChangeAction } from './dataChange';
import { FiltersAction } from './filters';
import { MergeCellsAction } from './mergeCells';
import { RemoveColumnAction } from './removeColumn';
import { RemoveRowAction } from './removeRow';
import { RowMoveAction } from './rowMove';
import { UnmergeCellsAction } from './unmergeCells';

/**
 * Register all undo/redo actions.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {UndoRedo} undoRedoPlugin The undoRedo plugin instance.
 */
export function registerActions(hot, undoRedoPlugin) {
  [
    CellAlignmentAction,
    ColumnMoveAction,
    ColumnSortAction,
    CreateColumnAction,
    CreateRowAction,
    DataChangeAction,
    FiltersAction,
    MergeCellsAction,
    RemoveColumnAction,
    RemoveRowAction,
    RowMoveAction,
    UnmergeCellsAction,
  ].forEach(action => action.startRegisteringEvents(hot, undoRedoPlugin));
}
