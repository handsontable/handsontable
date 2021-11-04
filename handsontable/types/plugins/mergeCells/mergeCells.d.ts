import Core from '../../core';
import { BasePlugin } from '../base';
import CellRange from '../../3rdparty/walkontable/src/cell/range';

export interface DetailedSettings {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
}

export type Settings = boolean | DetailedSettings[];

export class MergeCells extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  clearCollections(): void;
  mergeSelection(cellRange?: CellRange): void;
  unmergeSelection(cellRange?: CellRange): void;
  merge(startRow: number, startColumn: number, endRow: number, endColumn: number): void;
  unmerge(startRow: number, startColumn: number, endRow: number, endColumn: number): void;
}
