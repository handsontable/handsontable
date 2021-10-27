import Core from '../../core';
import { BasePlugin } from '../base';

export type Settings = boolean | number[];

export class ManualRowMove extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  moveRow(row: number, finalIndex: number): boolean;
  moveRows(rows: number[], finalIndex: number): boolean;
  dragRow(row: number, dropIndex: number): boolean;
  dragRows(rows: number[], dropIndex: number): boolean;
  isMovePossible(movedRows: number[], finalIndex: number): boolean;
}
