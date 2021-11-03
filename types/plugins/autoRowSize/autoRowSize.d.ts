import Core from '../../core';
import { BasePlugin } from '../base';

export interface DetailedSettings {
  syncLimit?: string | number;
}

export type Settings = boolean | DetailedSettings;

export class AutoRowSize extends BasePlugin {
  constructor(hotInstance: Core);
  inProgress: boolean;
  measuredRows: number;

  isEnabled(): boolean;
  calculateRowsHeight(rowRange?: number | object, colRange?: number | object, force?: boolean): void;
  calculateAllRowsHeight(colRange?: number | object): void;
  recalculateAllRowsHeight(): void;
  getSyncCalculationLimit(): number;
  getRowHeight(row: number, defaultHeight?: number): number;
  getColumnHeaderHeight(): number;
  getFirstVisibleRow(): number;
  getLastVisibleRow(): number;
  clearCache(): void;
  clearCacheByRange(range: number | object): void;
  isNeedRecalculate(): boolean;
}
