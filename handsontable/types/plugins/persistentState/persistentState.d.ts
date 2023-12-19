import Core from '../../core';
import { CellValue } from '../../common';
import { BasePlugin } from '../base';

export interface ValueHolder {
  value: any;
}
export type Settings = boolean;

export class PersistentState extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  loadValue(key: string, saveTo: ValueHolder): void;
  saveValue(key: string, value: CellValue): void;
  resetValue(key?: string): void;
}
