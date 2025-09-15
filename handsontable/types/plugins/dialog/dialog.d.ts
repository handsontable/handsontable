import Core from '../../core';
import { BasePlugin } from '../base';

export interface DialogConfig {
  content?: string | HTMLElement;
  customClassName?: string;
  background?: 'solid' | 'semi-transparent';
  contentBackground?: boolean;
  animation?: boolean;
  closable?: boolean;
}

export type Settings = boolean | DialogConfig;

export class Dialog extends BasePlugin {

  constructor(hotInstance: Core);
  isVisible(): boolean;
  show(config?: DialogConfig): void;
  hide(): void;
  update(config: DialogConfig): void;
  focus(): void;
} 