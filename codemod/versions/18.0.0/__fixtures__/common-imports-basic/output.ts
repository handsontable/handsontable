/**
 * Cell helpers for the orders grid.
 */
import Handsontable, { GridSettings, CellChange, ChangeSource } from 'handsontable';
// TODO(handsontable-codemod 18.0.0/common-imports): SimpleCellCoords: Removed in 18.0 with no replacement. Use the inline type `{ row: number; col: number }`.
import type { SimpleCellCoords } from 'handsontable/common';
import type { CellValue as Value, RowObject } from 'handsontable';
// TODO(handsontable-codemod 18.0.0/common-imports): NumericFormatOptions: Removed in 18.0 with no replacement. The `numericFormat` option is typed `object`. Use `Intl.NumberFormatOptions`. The Numbro.js `pattern` and `culture` keys no longer apply.
import { NumericFormatOptions } from 'handsontable/common';
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
