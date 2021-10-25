import Core from '../../core';
import { GridSettings } from '../../settings';
import { BasePlugin } from '../base';

export type SortOrderType = 'asc' | 'desc';
export type Config = {
  column: number;
  sortOrder: SortOrderType;
};

export interface DetailedSettings {
  initialConfig?: Config;
  sortEmptyCells?: boolean;
  indicator?: boolean;
  headerAction?: boolean;
  compareFunctionFactory?: ((sortOrder: SortOrderType, columnMeta: GridSettings) =>
    (value: any, nextValue: any) => -1 | 0 | 1);
}

export type Settings = boolean | DetailedSettings;

export class ColumnSorting extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  sort(sortConfig: Config): void;
  clearSort(): void;
  isSorted(): boolean;
  getSortConfig(column?: number): Config;
  setSortConfig(sortConfig: Config): void;
}
