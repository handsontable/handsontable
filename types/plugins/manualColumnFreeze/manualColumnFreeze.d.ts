import Core from '../../core';
import { BasePlugin } from '../base';

export class ManualColumnFreeze extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  freezeColumn(column: number): void;
  unfreezeColumn(column: number): void;
}
