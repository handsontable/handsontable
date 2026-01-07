import Core from '../core';
import { CellProperties } from '../settings';

export declare const rendererFactory: (callback: ({ instance, td, row, column, prop, value, cellProperties }: {
  instance: Core;
  td: HTMLTableCellElement;
  row: number;
  column: number;
  prop: string | number;
  value: any;
  cellProperties: CellProperties;
}) => void) => (
  instance: Core,
  td: HTMLTableCellElement,
  row: number,
  column: number,
  prop: string | number,
  value: any,
  cellProperties: CellProperties
) => void;
