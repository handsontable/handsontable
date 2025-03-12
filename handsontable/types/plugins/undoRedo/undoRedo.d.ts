import CellRange from '../../3rdparty/walkontable/src/cell/range';
import Core from '../../core';
import { CellValue, CellChange } from '../../common';
import { ColumnConditions } from '../filters';
import { BasePlugin } from '../base';
import { Config as ColumnSortingConfig } from '../columnSorting';

export type Settings = boolean;

export interface CellAlignmentAction {
  actionType: 'cell_alignment';
  stateBefore: { [row: number]: string[] };
  range: CellRange[];
  type: 'horizontal' | 'vertical';
  alignment: 'htLeft' | 'htCenter' | 'htRight' | 'htJustify' | 'htTop' | 'htMiddle' | 'htBottom';
}
export interface ColumnMoveAction {
  actionType: 'col_move';
  columns: number[];
  finalColumnIndex: number;
}
export interface ColumnSortAction {
  actionType: 'col_sort';
  previousSortState: ColumnSortingConfig[];
  nextSortState: ColumnSortingConfig[];
}
export interface InsertColAction {
  actionType: 'insert_col';
  amount: number;
  index: number;
}
export interface InsertRowAction {
  actionType: 'insert_row';
  amount: number;
  index: number;
}
export interface ChangeAction {
  actionType: 'change';
  changes: CellChange[];
  selected: Array<[number, number]>;
  countCols: number;
  countRows: number;
}
export interface FilterAction {
  actionType: 'filter';
  conditionsStack: ColumnConditions[];
  previousConditionsStack: ColumnConditions[];
}
export interface MergeAction {
  actionType: 'merge_cells';
  cellRange: CellRange[];
}
export interface UnmergeAction {
  actionType: 'unmerge_cells';
  cellRange: CellRange[];
}
export interface RemoveColAction {
  actionType: 'remove_col';
  amount: number;
  columnPositions: number[];
  index: number;
  indexes: number[];
  headers: string[];
  data: CellValue[][];
}
export interface RemoveRowAction {
  actionType: 'remove_row';
  index: number;
  data: CellValue[][];
}

export type Action = CellAlignmentAction | ColumnMoveAction | ColumnSortAction |
  InsertColAction | InsertRowAction | ChangeAction | FilterAction | MergeAction |
  UnmergeAction | RemoveColAction | RemoveRowAction;

export class UndoRedo extends BasePlugin {
  constructor(hotInstance: Core);
  undo(): void;
  redo(): void;
  isUndoAvailable(): boolean;
  isRedoAvailable(): boolean;
  clear(): void;
}
