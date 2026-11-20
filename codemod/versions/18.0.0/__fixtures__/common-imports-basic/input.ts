/**
 * Cell helpers for the orders grid.
 */
import Handsontable, { GridSettings } from 'handsontable';
import type { CellValue as Value, RowObject, SimpleCellCoords } from 'handsontable/common';
import { CellChange, ChangeSource, NumericFormatOptions } from 'handsontable/common';
import { HotTable } from '@handsontable/react-wrapper';

export const format: NumericFormatOptions = { style: 'currency', currency: 'USD' };

export function origin(coords: SimpleCellCoords): string {
  return `${coords.row}:${coords.col}`;
}

export function readChange(change: CellChange, source: ChangeSource, row: RowObject): Value {
  return source === 'edit' ? change[3] : row.id;
}

export const settings: GridSettings = { data: [], colHeaders: true };

export { Handsontable, HotTable };
