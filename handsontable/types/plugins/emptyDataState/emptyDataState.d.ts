import Core from '../../core';
import { BasePlugin } from '../base';

interface EmptyDataStateMessage {
  title?: string;
  description?: string;
  buttons?: {
    text: string;
    type: 'primary' | 'secondary';
    callback: () => void;
  }[];
}

export interface EmptyDataStateConfig {
  message?: string | ((source: 'unknown' | 'filters') => EmptyDataStateMessage | undefined) | EmptyDataStateMessage;
}

export type Settings = boolean | EmptyDataStateConfig;

export class EmptyDataState extends BasePlugin {
  constructor(hotInstance: Core);

  isVisible(): boolean;
}
