import Core from '../../core';
import { BasePlugin } from '../base';

export type Settings = boolean | number[];

export class ManualColumnMove extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  moveColumn(column: number, finalIndex: number): boolean;
  moveColumns(columns: number[], finalIndex: number): boolean;
  dragColumn(column: number, dropIndex: number): boolean;
  dragColumns(columns: number[], dropIndex: number): boolean;
  isMovePossible(movedColumns: number[], finalIndex: number): boolean;
}
