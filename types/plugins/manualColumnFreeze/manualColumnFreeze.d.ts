import { BasePlugin } from '../base';

export class ManualColumnFreeze extends BasePlugin {
  constructor(hotInstance: any);
  isEnabled(): boolean;
  freezeColumn(column: number): void;
  unfreezeColumn(column: number): void;
}
