import Core from '../../core';
import { BasePlugin } from '../base';

export type Settings = 'all' | 'last' | 'none';

export class StretchColumns extends BasePlugin {
  constructor(hotInstance: Core);

  isEnabled(): boolean;
  getColumnWidth(columnVisualIndex: number): number | null;
}
