import Core from '../../core';
import { CellValue } from '../../common';
import { BasePlugin } from '../base';

export type Settings = boolean;

export class PersistentState extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  loadValue(key: string, saveTo: CellValue): void;
  saveValue(key: string, value: CellValue): void;
  resetValue(key: string): void;
}
