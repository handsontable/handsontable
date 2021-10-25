import Core from '../../core';
import { CellValue, CellChange } from '../../common';
import { ColumnConditions } from '../filters';
import { BasePlugin } from '../base';

export type ChangeAction = {
  actionType: 'change';
  changes: CellChange[];
  selected: [number, number][]
};
export type InsertRowAction = {
  actionType: 'insert_row';
  amount: number;
  index: number;
}
export type RemoveRowAction = {
  actionType: 'remove_row';
  index: number;
  data: CellValue[][];
}
export type InsertColAction = {
  actionType: 'insert_col';
  amount: number;
  index: number;
}
export type RemoveColAction = {
  actionType: 'remove_col';
  amount: number;
  columnPositions: number[];
  index: number;
  indexes: number[];
  headers: string[];
  data: CellValue[][];
}
export type FilterAction = {
  actionType: 'filter';
  conditionsStack: ColumnConditions[];
}

export type Action = ChangeAction | InsertRowAction | RemoveRowAction | InsertColAction |
                     RemoveColAction | FilterAction;

export class UndoRedo extends BasePlugin {
  constructor(hotInstance: Core);
  undo(): void;
  redo(): void;
}
