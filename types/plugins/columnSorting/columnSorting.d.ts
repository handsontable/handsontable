import { BasePlugin } from '../base';

export type SortOrderType = 'asc' | 'desc';
export type Config = {
  column: number;
  sortOrder: SortOrderType;
};

export interface Settings {
  initialConfig?: Config;
  sortEmptyCells?: boolean;
  indicator?: boolean;
  headerAction?: boolean;
  compareFunctionFactory?: ((sortOrder: SortOrderType, columnMeta: GridSettings) =>
    (value: any, nextValue: any) => -1 | 0 | 1);
}

export class ColumnSorting extends BasePlugin {
  constructor(hotInstance: any);
  isEnabled(): boolean;
  sort(sortConfig: any): void;
  clearSort(): void;
  isSorted(): boolean;
  getSortConfig(column?: number): any;
  setSortConfig(sortConfig: any): void;
}
