import Core from '../../core';
import { BasePlugin } from '../base';

export interface EmptyDataStateConfig {
  message?: string | function | {
    title?: string;
    description?: string;
    actions?: {
      text: string;
      type: 'primary' | 'secondary';
      callback: () => void;
    }[];
  };
}

export type Settings = boolean | EmptyDataStateConfig;

export class EmptyDataState extends BasePlugin {
  constructor(hotInstance: Core);

  isVisible(): boolean;
}
