import { BasePlugin } from '../base';

export interface Settings {
  rows?: number[];
  indicators?: boolean;
}

export class HiddenRows extends BasePlugin {
  constructor(hotInstance: any);
  isEnabled(): boolean;
  showRows(rows: number[]): void;
  showRow(...row: number[]): void;
  hideRows(rows: number[]): void;
  hideRow(...row: number[]): void;
  getHiddenRows(): number[];
  isHidden(row: number): boolean;
  isValidConfig(hiddenRows: number[]): boolean;
}
