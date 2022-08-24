import Core from '../../core';
import { BasePlugin } from '../base';

export interface DetailedSettings {
  syncLimit?: string | number;
  useHeaders?: boolean;
}

export type Settings = boolean | DetailedSettings;

export class AutoColumnSize extends BasePlugin {
  constructor(hotInstance: Core);
  inProgress: boolean;
  measuredColumns: number;

  isEnabled(): boolean;
  calculateVisibleColumnsWidth(): void;
  calculateColumnsWidth(colRange?: number | object, rowRange?: number | object, force?: boolean): void;
  calculateAllColumnsWidth(rowRange?: number | object): void;
  recalculateAllColumnsWidth(): void;
  getSyncCalculationLimit(): number;
  getColumnWidth(column: number, defaultWidth?: number, keepMinimum?: boolean): number;
  getFirstVisibleColumn(): number;
  getLastVisibleColumn(): number;
  clearCache(columns?: number[]): void;
  isNeedRecalculate(): boolean;
}
