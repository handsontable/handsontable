import { Notification } from '../notification';
import { NotificationUI } from '../ui';
import { NOTIFICATION_CLASS_NAME } from '../constants';

describe('NotificationUI.setSequentialFocusWithinHost', () => {
  it('should toggle tabIndex on toast buttons', () => {
    const host = document.createElement('div');
    const toast = document.createElement('div');

    toast.className = `${NOTIFICATION_CLASS_NAME}__toast`;
    const btn = document.createElement('button');

    btn.type = 'button';
    btn.tabIndex = -1;
    toast.appendChild(btn);
    host.appendChild(toast);

    NotificationUI.setSequentialFocusWithinHost(host, true);
    expect(btn.tabIndex).toBe(0);

    NotificationUI.setSequentialFocusWithinHost(host, false);
    expect(btn.tabIndex).toBe(-1);
  });
});

describe('NotificationUI.getFocusables', () => {
  it('should return button elements in DOM order when the toast has controls', () => {
    const toast = document.createElement('div');
    const primary = document.createElement('button');

    primary.type = 'button';
    toast.appendChild(primary);
    const secondary = document.createElement('button');

    secondary.type = 'button';
    toast.appendChild(secondary);

    expect(NotificationUI.getFocusables(toast)).toEqual([primary, secondary]);
  });

  it('should return the toast root when there are no buttons', () => {
    const toast = document.createElement('div');

    toast.tabIndex = 0;

    expect(NotificationUI.getFocusables(toast)).toEqual([toast]);
  });

  it('should omit disabled buttons from the focusable list', () => {
    const toast = document.createElement('div');
    const enabled = document.createElement('button');
    const disabled = document.createElement('button');

    enabled.type = 'button';
    disabled.type = 'button';
    disabled.disabled = true;
    toast.appendChild(enabled);
    toast.appendChild(disabled);

    expect(NotificationUI.getFocusables(toast)).toEqual([enabled]);
  });
});

describe('Notification plugin (configuration)', () => {
  it('should expose default settings', () => {
    expect(Notification.DEFAULT_SETTINGS.stackLimit).toBe(10);
    expect(Notification.DEFAULT_SETTINGS.animation).toBe(true);
  });

  it('should validate stackLimit', () => {
    const { stackLimit } = Notification.SETTINGS_VALIDATORS;

    expect(stackLimit(3)).toBe(true);
    expect(stackLimit(1)).toBe(true);
    expect(stackLimit(0)).toBe(false);
    expect(stackLimit(1.5)).toBe(false);
    expect(stackLimit('1')).toBe(false);
  });

  it('should validate animation flag', () => {
    const { animation } = Notification.SETTINGS_VALIDATORS;

    expect(animation(true)).toBe(true);
    expect(animation(false)).toBe(true);
    expect(animation(1)).toBe(false);
  });
});
