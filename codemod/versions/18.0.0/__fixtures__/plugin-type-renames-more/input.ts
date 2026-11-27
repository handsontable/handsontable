import type { ColumnSorting } from 'handsontable/plugins/multiColumnSorting';
import type { ColumnSorting as ColumnSortingClass } from 'handsontable/plugins/columnSorting';
import type { DataProviderOptions } from 'handsontable/plugins/dataProvider';
import type { DataProviderOptions as OtherOptions } from 'other-grid/plugins/dataProvider';

export function sort(plugin: ColumnSorting, same: ColumnSortingClass): void {
  plugin.clearSort();
  same.clearSort();
}

export const options: DataProviderOptions = {};

export const other: OtherOptions = {};
