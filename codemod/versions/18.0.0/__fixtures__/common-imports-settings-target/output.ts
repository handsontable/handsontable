// Column accessors shared by the report grids.
import type { GridSettings, ColumnDataGetterSetterFunction } from 'handsontable/settings';

export const accessor: ColumnDataGetterSetterFunction = (row: unknown, value?: unknown) => value as never;

export const settings: GridSettings = { columns: [{ data: accessor }] };
