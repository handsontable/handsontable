import Core from '../../core';
import { BasePlugin } from '../base';

export type NotificationVariant = 'info' | 'success' | 'warning' | 'error';

export type NotificationPosition = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

export interface NotificationAction {
  label: string;
  type?: 'primary' | 'secondary';
  callback: () => void;
}

export interface NotificationMessageOptions {
  variant?: NotificationVariant;
  title?: string;
  message: string | HTMLElement;
  duration?: number;
  position?: NotificationPosition;
  closable?: boolean;
  actions?: NotificationAction[];
}

/**
 * Shape passed to notification hooks after defaults are applied.
 */
export interface NotificationNormalizedOptions {
  id: string;
  variant: NotificationVariant;
  title?: string;
  message: string | HTMLElement;
  duration: number;
  position: NotificationPosition;
  closable: boolean;
  actions: NotificationAction[];
}

export interface NotificationConfig {
  stackLimit?: number;
  animation?: boolean;
}

export type Settings = boolean | NotificationConfig;

export class Notification extends BasePlugin {
  constructor(hotInstance: Core);

  showMessage(options: NotificationMessageOptions): string;
  hide(id: string): void;
  hideAll(): void;
  isVisible(id?: string): boolean;
  getQueueSize(): number;
}
