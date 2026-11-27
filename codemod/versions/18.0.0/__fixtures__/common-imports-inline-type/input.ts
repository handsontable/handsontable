import { type CellValue, ColumnDataGetterSetterFunction, type SimpleCellCoords } from 'handsontable/common';
import { type RowObject } from 'handsontable/common';

export const read: ColumnDataGetterSetterFunction = (row: unknown, value?: unknown) => value as never;

export const rows: RowObject[] = [];

export const last: CellValue = null;

export const origin: SimpleCellCoords = { row: 0, col: 0 };
