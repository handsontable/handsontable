import Core from '../../core';
import { BasePlugin } from '../base';

export type Direction = 'vertical' | 'horizontal';

export interface DetailedSettings {
  autoInsertRow?: boolean;
  direction?: Direction;
}

export type Settings = boolean | Direction | DetailedSettings;

export class Autofill extends BasePlugin {
  constructor(hotInstance: Core);
  autoInsertRow: boolean;

  isEnabled(): boolean;
}
