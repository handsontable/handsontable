/**
 * Root CSS class name for the notification plugin overlay host.
 */
export const NOTIFICATION_CLASS_NAME = 'ht-notification';

export type NotificationPosition = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

export type NotificationVariant = 'info' | 'success' | 'warning' | 'error';

export const NOTIFICATION_POSITIONS: NotificationPosition[] = ['top-start', 'top-end', 'bottom-start', 'bottom-end'];

export const NOTIFICATION_VARIANTS: NotificationVariant[] = ['info', 'success', 'warning', 'error'];
