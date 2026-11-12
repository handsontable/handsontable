// TODO(handsontable-codemod 18.0.0/common-imports): SimpleCellCoords: Removed in 18.0 with no replacement. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-handsontablecommon-imports
import { type SimpleCellCoords } from 'handsontable/common';
import { ColumnDataGetterSetterFunction } from 'handsontable/settings';
import type { CellValue, RowObject } from 'handsontable';

export const read: ColumnDataGetterSetterFunction = (row: unknown, value?: unknown) => value as never;

export const rows: RowObject[] = [];

export const last: CellValue = null;

export const origin: SimpleCellCoords = { row: 0, col: 0 };
