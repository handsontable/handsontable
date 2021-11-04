import Core from '../../core';
import { BasePlugin } from '../base';

export interface DetailedSettings {
  rows?: number[];
  indicators?: boolean;
}

export type Settings = boolean | DetailedSettings;

export class HiddenRows extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  showRows(rows: number[]): void;
  showRow(...row: number[]): void;
  hideRows(rows: number[]): void;
  hideRow(...row: number[]): void;
  getHiddenRows(): number[];
  isHidden(row: number): boolean;
  isValidConfig(hiddenRows: number[]): boolean;
}
