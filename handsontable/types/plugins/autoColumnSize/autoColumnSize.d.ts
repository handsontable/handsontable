import Core from '../../core';
import { BasePlugin } from '../base';

export interface DetailedSettings {
  syncLimit?: string | number;
  useHeaders?: boolean;
  samplingRatio?: number;
  allowSampleDuplicates?: boolean;
}

export type Settings = boolean | DetailedSettings;

export class AutoColumnSize extends BasePlugin {
  constructor(hotInstance: Core);
  inProgress: boolean;
  measuredColumns: number;

  isEnabled(): boolean;
  calculateVisibleColumnsWidth(): void;
  calculateColumnsWidth(colRange?: number | { from: number, to: number }, rowRange?: number | { from: number, to: number }, force?: boolean): void;
  calculateAllColumnsWidth(rowRange?: number | { from: number, to: number }): void;
  recalculateAllColumnsWidth(): void;
  getSyncCalculationLimit(): number;
  getColumnWidth(column: number, defaultWidth?: number, keepMinimum?: boolean): number;
  getFirstVisibleColumn(): number;
  getLastVisibleColumn(): number;
  clearCache(physicalColumns?: number[]): void;
  isNeedRecalculate(): boolean;
}
