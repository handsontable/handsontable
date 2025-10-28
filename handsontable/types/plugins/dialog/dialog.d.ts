import Core from '../../core';
import { BasePlugin } from '../base';

export interface DialogConfig {
  template?: {
    type: 'alert' | 'confirm';
    title: string;
    description?: string;
    buttons?: {
      text: string;
      type: 'primary' | 'secondary';
      callback?: (event: ClickEvent) => void;
    }[];
  };
  content?: string | HTMLElement;
  customClassName?: string;
  background?: 'solid' | 'semi-transparent';
  contentBackground?: boolean;
  animation?: boolean;
  closable?: boolean;
  a11y?: {
    role?: 'dialog' | 'alertdialog';
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
  };
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
