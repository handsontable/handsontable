import Core from '../../core';
import { BasePlugin } from '../base';
import CellCoords from '../../3rdparty/walkontable/src/cell/coords';

export type BorderOptions = {
  width?: number;
  color?: string;
  hide?: boolean;
}
export type BorderRange = {
  range: {
    from: CellCoords;
    to: CellCoords;
  }
}
export type DetailedSettings = (CellCoords | BorderRange) & {
  left?: BorderOptions | string;
  right?: BorderOptions | string;
  top?: BorderOptions | string;
  bottom?: BorderOptions | string;
}

export type Settings = boolean | DetailedSettings[];

export type RangeType = {
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
};

export class CustomBorders extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  setBorders(selectionRanges: RangeType[][] | Array<[number, number, number, number]>, borderObject: object): void;
  getBorders(selectionRanges: RangeType[][] | Array<[number, number, number, number]>): Array<[object]>;
  clearBorders(selectionRanges: RangeType[][] | Array<[number, number, number, number]>): void;
}
