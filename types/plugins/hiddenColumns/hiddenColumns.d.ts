import { BasePlugin } from '../base';

export interface Settings {
  columns?: number[];
  indicators?: boolean;
}

export class HiddenColumns extends BasePlugin {
  constructor(hotInstance: any);
  isEnabled(): boolean;
  showColumns(columns: number[]): void;
  showColumn(...column: number[]): void;
  hideColumns(columns: number[]): void;
  hideColumn(...column: number[]): void;
  getHiddenColumns(): number[];
  isHidden(column: number): boolean;
  isValidConfig(hiddenColumns: number[]): boolean;
}
