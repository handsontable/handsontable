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
export type DetailedSettings = (SimpleCellCoords | BorderRange) & {
  left?: BorderOptions | string;
  right?: BorderOptions | string;
  top?: BorderOptions | string;
  bottom?: BorderOptions | string;
};

export type Settings = boolean | DetailedSettings[];

export interface RangeType {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export class CustomBorders extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  setBorders(selectionRanges: RangeType[][] | Array<[number, number, number, number]>, borderObject: object): void;
  getBorders(selectionRanges: RangeType[][] | Array<[number, number, number, number]>): Array<[object]>;
  clearBorders(selectionRanges: RangeType[][] | Array<[number, number, number, number]>): void;
}
