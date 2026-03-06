import Core from '../../core';
import { BasePlugin } from '../base';
import CellRange from '../../3rdparty/walkontable/src/cell/range';

export interface MergeCellsSettings {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
}
export interface DetailedSettings {
  virtualized: boolean;
  cells: MergeCellsSettings[];
}

export type Settings = boolean | MergeCellsSettings[] | DetailedSettings;

export class MergeCells extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  clearCollections(): void;
  mergeSelection(cellRange?: CellRange): void;
  unmergeSelection(cellRange?: CellRange): void;
  merge(startRow: number, startColumn: number, endRow: number, endColumn: number): void;
  unmerge(startRow: number, startColumn: number, endRow: number, endColumn: number): void;
}
