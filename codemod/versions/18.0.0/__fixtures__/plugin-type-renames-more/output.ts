import type { ColumnSorting as ColumnSortingClass, ColumnSorting } from 'handsontable/plugins/columnSorting';
import type { DataProviderFetchOptions } from 'handsontable/plugins/dataProvider';
import type { DataProviderOptions as OtherOptions } from 'other-grid/plugins/dataProvider';

export function sort(plugin: ColumnSorting, same: ColumnSortingClass): void {
  plugin.clearSort();
  same.clearSort();
}

export const options: DataProviderFetchOptions = {};

export const other: OtherOptions = {};
