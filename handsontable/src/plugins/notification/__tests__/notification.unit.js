import { Notification } from '../notification';
import { NotificationUI } from '../ui';
import { NOTIFICATION_CLASS_NAME } from '../constants';
import { createIcon } from '../../../themes/engine/icons';

// No `themeManager` on the stub `hot` - `createIcon()` falls back to plain glyph classes, exactly
// like a grid built without a `theme` config object (the common case).
const stubCreateIcon = (name, options) =>
  createIcon({ rootDocument: document, themeManager: undefined }, name, options);

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

describe('NotificationUI icon rendering', () => {
  let ui;

  const createUI = () => new NotificationUI({
    overlayElement: document.createElement('div'),
    sanitizer: false,
    warnScope: document.createElement('div'),
    isRtl: false,
    createIcon: stubCreateIcon,
  });

  afterEach(() => {
    ui?.destroy();
  });

  it('should append exactly one chip-close icon to a closable toast\'s close button', () => {
    ui = createUI();

    const { element } = ui.createToastElement({
      id: 'htn-1',
      variant: 'info',
      message: 'Saved.',
      duration: 0,
      position: 'bottom-end',
      closable: true,
      actions: [],
    }, 'Close', false);

    const closeBtn = element.querySelector(`.${NOTIFICATION_CLASS_NAME}__close`);
    const icons = closeBtn.querySelectorAll('.ht-icon');

    expect(icons.length).toBe(1);
    expect(icons[0].classList.contains('ht-icon-chip-close')).toBe(true);
    expect(icons[0].getAttribute('aria-hidden')).toBe('true');
    expect(closeBtn.getAttribute('aria-label')).toBe('Close');
  });

  it('should keep exactly one icon per open toast after refreshIcons() runs repeatedly', () => {
    ui = createUI();
    ui.install();

    const { element } = ui.createToastElement({
      id: 'htn-1',
      variant: 'info',
      message: 'Saved.',
      duration: 0,
      position: 'bottom-end',
      closable: true,
      actions: [],
    }, 'Close', false);

    ui.getStack('bottom-end').appendChild(element);

    for (let i = 0; i < 3; i++) {
      ui.refreshIcons();
    }

    const closeBtn = element.querySelector(`.${NOTIFICATION_CLASS_NAME}__close`);

    expect(closeBtn.querySelectorAll('.ht-icon').length).toBe(1);
    expect(closeBtn.querySelector('.ht-icon').classList.contains('ht-icon-chip-close')).toBe(true);
  });

  it('should do nothing when refreshIcons() runs before install()', () => {
    ui = createUI();

    expect(() => ui.refreshIcons()).not.toThrow();
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
