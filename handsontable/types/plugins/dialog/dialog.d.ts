import Core from '../../core';
import { BasePlugin } from '../base';

export interface DialogConfig {
  content?: string | HTMLElement;
  customClassName?: string;
  background?: 'solid' | 'semi-transparent';
  contentBackground?: boolean;
  contentDirections?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  animation?: boolean;
  closable?: boolean;
}

export type Settings = boolean | DialogConfig;

export class Dialog extends BasePlugin {
  static PLUGIN_KEY: string;
  static PLUGIN_PRIORITY: number;
  static DEFAULT_CONFIG: DialogConfig;

  constructor(hotInstance: Core);
  isEnabled(): boolean;
  isVisible(): boolean;
  show(config?: DialogConfig): void;
  hide(): void;
  update(config: DialogConfig): void;
} 