import CellRange from '../../3rdparty/walkontable/src/cell/range';
import Core from '../../core';
import { BasePlugin } from '../base';
import { SimpleCellCoords } from "../../common";

export interface BorderOptions {
  width?: number;
  color?: string;
  hide?: boolean;
}
export interface BorderRange {
  range: {
    from: SimpleCellCoords;
    to: SimpleCellCoords;
  };
}
export interface BorderDescriptor {
  start?: BorderOptions;
  end?: BorderOptions;
  left?: BorderOptions;
  right?: BorderOptions;
  top?: BorderOptions;
  bottom?: BorderOptions;
}
export type DetailedSettings = (SimpleCellCoords | BorderRange) & {
  start?: BorderOptions | string;
  end?: BorderOptions | string;
  left?: BorderOptions | string;
  right?: BorderOptions | string;
  top?: BorderOptions | string;
  bottom?: BorderOptions | string;
};

export type Settings = boolean | DetailedSettings[];

export interface ComputedBorder extends BorderDescriptor {
  id: string;
  row: number;
  col: number;
  border?: BorderOptions;
}

export class CustomBorders extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  setBorders(selectionRanges: CellRange[] | Array<[number, number, number, number]>, borderObject: BorderDescriptor): void;
  getBorders(selectionRanges?: CellRange[] | Array<[number, number, number, number]>): ComputedBorder[];
  clearBorders(selectionRanges?: CellRange[] | Array<[number, number, number, number]>): void;
}
