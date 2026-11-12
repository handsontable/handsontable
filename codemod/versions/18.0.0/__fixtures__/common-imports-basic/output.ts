/**
 * Cell helpers for the orders grid.
 */
import Handsontable, { GridSettings, CellChange, ChangeSource } from 'handsontable';
// TODO(handsontable-codemod 18.0.0/common-imports): SimpleCellCoords: Removed in 18.0 with no replacement. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-handsontablecommon-imports
import type { SimpleCellCoords } from 'handsontable/common';
import type { CellValue as Value, RowObject } from 'handsontable';
// TODO(handsontable-codemod 18.0.0/common-imports): NumericFormatOptions: Removed in 18.0, so use `Intl.NumberFormatOptions` instead. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-handsontablecommon-imports
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
