import Core from '../../core';
import { BasePlugin } from '../base';

export interface DetailedSettings {
  columns?: number[];
  indicators?: boolean;
}

export type Settings = boolean | DetailedSettings;

export class HiddenColumns extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  showColumns(columns: number[]): void;
  showColumn(...column: number[]): void;
  hideColumns(columns: number[]): void;
  hideColumn(...column: number[]): void;
  getHiddenColumns(): number[];
  isHidden(column: number): boolean;
  isValidConfig(hiddenColumns: number[]): boolean;
}
