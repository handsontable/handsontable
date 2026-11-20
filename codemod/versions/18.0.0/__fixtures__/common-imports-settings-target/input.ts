// Column accessors shared by the report grids.
import type { ColumnDataGetterSetterFunction } from 'handsontable/common';
import type { GridSettings } from 'handsontable/settings';

export const accessor: ColumnDataGetterSetterFunction = (row: unknown, value?: unknown) => value as never;

export const settings: GridSettings = { columns: [{ data: accessor }] };
