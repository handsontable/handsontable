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
  /**
   * When `true`, shows a loading spinner. Used for the `loading` message source (for example when DataProvider is fetching).
   */
  loading?: boolean;
}

export interface EmptyDataStateConfig {
  message?:
    | string
    | ((
        source: 'unknown' | 'filters' | 'loading'
      ) => EmptyDataStateMessage | undefined)
    | EmptyDataStateMessage;
}

export type Settings = boolean | EmptyDataStateConfig;

export class EmptyDataState extends BasePlugin {
  constructor(hotInstance: Core);

  isVisible(): boolean;
}
