import Core from '../../core';
import { BasePlugin } from '../base';

export interface DetailedSettings {
  syncLimit?: string | number;
  samplingRatio?: number;
  allowSampleDuplicates?: boolean;
}

export type Settings = boolean | DetailedSettings;

export class AutoRowSize extends BasePlugin {
  constructor(hotInstance: Core);
  inProgress: boolean;
  measuredRows: number;

  isEnabled(): boolean;
  calculateRowsHeight(rowRange?: number | { from: number, to: number }, colRange?: number | { from: number, to: number }, force?: boolean): void;
  calculateAllRowsHeight(colRange?: number | { from: number, to: number }): void;
  recalculateAllRowsHeight(): void;
  getSyncCalculationLimit(): number;
  getRowHeight(row: number, defaultHeight?: number): number;
  getColumnHeaderHeight(): number;
  getFirstVisibleRow(): number;
  getLastVisibleRow(): number;
  clearCache(): void;
  clearCacheByRange(range: number | { from: number, to: number }): void;
  isNeedRecalculate(): boolean;
}
