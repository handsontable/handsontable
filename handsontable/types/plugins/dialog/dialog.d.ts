import Core from '../../core';
import { BasePlugin } from '../base';

export interface DialogConfig {
  template?: {
    type: 'confirm';
    title: string;
    description?: string;
    buttons?: {
      text: string;
      type: 'primary' | 'secondary';
      callback?: (event: MouseEvent) => void;
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

type TemplateOptions = string | { title: string, description?: string };

export class Dialog extends BasePlugin {
  constructor(hotInstance: Core);

  isVisible(): boolean;
  show(config?: DialogConfig): void;
  hide(): void;
  update(config: DialogConfig): void;
  showAlert(message?: TemplateOptions, callback?: (event: MouseEvent) => void): void;
  showConfirm(message?: TemplateOptions, onOk?: (event: MouseEvent) => void, onCancel?: (event: MouseEvent) => void): void;
  focus(): void;
}
