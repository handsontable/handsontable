import { BasePlugin } from '../base';

export class AutoColumnSize extends BasePlugin {
  constructor(hotInstance: any);
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
