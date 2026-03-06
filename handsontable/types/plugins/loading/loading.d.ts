import Core from '../../core';
import { BasePlugin } from '../base';

export interface LoadingConfig {
  icon?: string;
  title?: string;
  description?: string;
}

export type Settings = boolean | LoadingConfig;

export class Loading extends BasePlugin {
  constructor(hotInstance: Core);

  isVisible(): boolean;
  show(options?: LoadingConfig): void;
  hide(): void;
  update(options?: LoadingConfig): void;
}
