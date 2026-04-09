describe('Notification', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be disabled by default', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    expect(getPlugin('notification').isEnabled()).toBe(false);
  });

  it('should show and hide a toast', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');

    expect(plugin.isVisible()).toBe(false);

    const toastId = plugin.showMessage({ message: 'Saved.' });

    expect(toastId.length).toBeGreaterThan(0);
    // Flush layout/focus after toast DOM update.
    await waitForNextAnimationFrames(1);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);
    expect(plugin.isVisible()).toBe(true);
    expect(plugin.isVisible(toastId)).toBe(true);

    plugin.hide(toastId);
    // Flush layout/focus after toast DOM update.
    await waitForNextAnimationFrames(1);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(0);
    expect(plugin.isVisible()).toBe(false);
  });

  it('should cancel show when beforeNotificationShow returns false', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
      beforeNotificationShow: () => false,
    });

    const plugin = getPlugin('notification');
    const toastId = plugin.showMessage({ message: 'Blocked' });

    expect(toastId).toBe('');
    await waitForNextAnimationFrames(1);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(0);
  });

  it('should fire beforeNotificationShow once per showMessage and not again when a queued toast mounts', async() => {
    const beforeShow = jasmine.createSpy('beforeNotificationShow');

    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: {
        stackLimit: 1,
      },
      beforeNotificationShow: beforeShow,
    });

    const plugin = getPlugin('notification');
    const firstId = plugin.showMessage({ message: 'First' });
    const queuedId = plugin.showMessage({ message: 'Queued' });

    await waitForNextAnimationFrames(1);

    expect(beforeShow).toHaveBeenCalledTimes(2);
    expect(beforeShow.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({
      id: firstId,
      message: 'First',
    }));
    expect(beforeShow.calls.argsFor(1)[0]).toEqual(jasmine.objectContaining({
      id: queuedId,
      message: 'Queued',
    }));

    plugin.hide(firstId);
    await waitForNextAnimationFrames(1);

    expect(beforeShow).toHaveBeenCalledTimes(2);
    expect(document.querySelector('.ht-notification__message').textContent).toContain('Queued');
  });

  it('should queue toasts when stackLimit is reached', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: {
        stackLimit: 1,
      },
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'First' });
    plugin.showMessage({ message: 'Second' });

    expect(plugin.getQueueSize()).toBe(1);
    await waitForNextAnimationFrames(1);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);
  });

  it('should hide all toasts and clear the queue', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: {
        stackLimit: 1,
      },
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'First' });
    plugin.showMessage({ message: 'Queued' });
    plugin.hideAll();
    await waitForNextAnimationFrames(1);

    expect(plugin.getQueueSize()).toBe(0);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(0);
  });

  it('should respect beforeNotificationHide returning false', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
      beforeNotificationHide: () => false,
    });

    const plugin = getPlugin('notification');

    const toastId = plugin.showMessage({ message: 'Stay' });

    await waitForNextAnimationFrames(1);
    plugin.hide(toastId);
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);
  });

  it('should resume auto-dismiss after a blocked programmatic hide', async() => {
    let blockHide = false;

    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
      beforeNotificationHide: () => (blockHide ? false : undefined),
    });

    const plugin = getPlugin('notification');

    const toastId = plugin.showMessage({ message: 'Timer resumes', duration: 600 });

    await waitForNextAnimationFrames(1);

    blockHide = true;
    plugin.hide(toastId);
    blockHide = false;
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);

    await sleep(1100);
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(0);
    expect(plugin.isVisible()).toBe(false);
  });

  it('should restart countdown when beforeNotificationHide blocks a timer-triggered hide', async() => {
    let hideCalls = 0;

    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
      beforeNotificationHide: () => {
        hideCalls += 1;

        return hideCalls > 1;
      },
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'Two-phase dismiss', duration: 400 });
    await waitForNextAnimationFrames(1);

    await sleep(1500);
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(0);
    expect(plugin.isVisible()).toBe(false);
    expect(hideCalls).toBe(2);
  });

  it('should disable via updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'Hello' });
    await waitForNextAnimationFrames(1);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);

    await updateSettings({
      notification: false,
    });
    await waitForNextAnimationFrames(1);

    expect(document.querySelector('.ht-notification')).toBe(null);
  });

  it('should use an updated sanitizer for new toasts after updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');

    await updateSettings({
      sanitizer: () => '',
    });
    await waitForNextAnimationFrames(1);

    plugin.showMessage({ message: '<em>x</em>' });
    await waitForNextAnimationFrames(1);

    const msg = document.querySelector('.ht-notification__message');

    expect(msg.textContent).toBe('');
  });

  it('should keep notification host dir aligned with the grid root after updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
      layoutDirection: 'rtl',
    });

    await waitForNextAnimationFrames(1);

    const host = document.querySelector('.ht-notification');

    expect(host.getAttribute('dir')).toBe('rtl');

    await updateSettings({ colHeaders: true });
    await waitForNextAnimationFrames(1);

    expect(host.getAttribute('dir')).toBe('rtl');
  });

  it('should keep visible toasts when updateSettings repeats the same notification option (e.g. spread of getSettings)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    getPlugin('notification').showMessage({ message: 'Still here', duration: 0 });
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);

    await updateSettings({
      ...getSettings(),
      readOnly: true,
    });
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);
    expect(document.querySelector('.ht-notification__message').textContent).toContain('Still here');
  });

  it('should still rebuild notification UI when notification stackLimit changes', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: { stackLimit: 10 },
    });

    getPlugin('notification').showMessage({ message: 'Toast', duration: 0 });
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);

    await updateSettings({
      ...getSettings(),
      notification: { stackLimit: 5 },
    });
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(0);
  });

  it('should return empty string from showMessage when the plugin is not enabled', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: false,
    });

    expect(getPlugin('notification').showMessage({ message: 'x' })).toBe('');
    await waitForNextAnimationFrames(1);
  });

  it('should enable and disable programmatically', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: false,
    });

    const plugin = getPlugin('notification');

    plugin.enablePlugin();
    await render();
    plugin.showMessage({ message: 'On' });
    await waitForNextAnimationFrames(1);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);

    plugin.disablePlugin();
    await render();
    expect(document.querySelector('.ht-notification')).toBe(null);
    expect(plugin.showMessage({ message: 'Off' })).toBe('');
  });

  it('should apply variant class names on toasts', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'Info', variant: 'info' });
    plugin.showMessage({ message: 'Success', variant: 'success' });
    plugin.showMessage({ message: 'Warning', variant: 'warning' });
    plugin.showMessage({ message: 'Error', variant: 'error' });
    await waitForNextAnimationFrames(1);

    expect(document.querySelector('.ht-notification__toast--info')).not.toBe(null);
    expect(document.querySelector('.ht-notification__toast--success')).not.toBe(null);
    expect(document.querySelector('.ht-notification__toast--warning')).not.toBe(null);
    expect(document.querySelector('.ht-notification__toast--error')).not.toBe(null);
  });

  it('should use assertive aria-live only for the error variant', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'Warn', variant: 'warning', closable: false });
    plugin.showMessage({ message: 'Err', variant: 'error', closable: false });
    await waitForNextAnimationFrames(1);

    const warningToast = document.querySelector('.ht-notification__toast--warning');
    const errorToast = document.querySelector('.ht-notification__toast--error');

    expect(warningToast.getAttribute('aria-live')).toBe('polite');
    expect(warningToast.getAttribute('role')).toBe('status');
    expect(errorToast.getAttribute('aria-live')).toBe('assertive');
    expect(errorToast.getAttribute('role')).toBe('alert');
  });

  it('should place toasts in the stack that matches position', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'TS', position: 'top-start' });
    plugin.showMessage({ message: 'TE', position: 'top-end' });
    plugin.showMessage({ message: 'BS', position: 'bottom-start' });
    plugin.showMessage({ message: 'BE', position: 'bottom-end' });
    await waitForNextAnimationFrames(1);

    expect(document.querySelector('[data-ht-notification-position="top-start"] .ht-notification__message')
      .textContent).toContain('TS');
    expect(document.querySelector('[data-ht-notification-position="top-end"] .ht-notification__message')
      .textContent).toContain('TE');
    expect(document.querySelector('[data-ht-notification-position="bottom-start"] .ht-notification__message')
      .textContent).toContain('BS');
    expect(document.querySelector('[data-ht-notification-position="bottom-end"] .ht-notification__message')
      .textContent).toContain('BE');
  });

  it('should render title when provided', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    getPlugin('notification').showMessage({
      title: 'Disk full',
      message: 'Free space is low.',
    });
    await waitForNextAnimationFrames(1);

    expect(document.querySelector('.ht-notification__title').textContent).toBe('Disk full');
  });

  it('should omit close control when closable is false', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    getPlugin('notification').showMessage({
      message: 'No close',
      closable: false,
    });
    await waitForNextAnimationFrames(1);

    expect(document.querySelector('.ht-notification__close')).toBe(null);
  });

  it('should hide toast when the close control is clicked', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'Close me' });
    await waitForNextAnimationFrames(1);

    await simulateClick(document.querySelector('.ht-notification__close'));
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(0);
    expect(plugin.isVisible()).toBe(false);
  });

  it('should run action callback when an action button is clicked', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');
    let called = false;

    plugin.showMessage({
      message: 'Choose',
      actions: [
        {
          label: 'OK',
          type: 'primary',
          callback() {
            called = true;
          },
        },
      ],
    });
    await waitForNextAnimationFrames(1);

    const btn = document.querySelector('[data-ht-notification-action="0"]');

    expect(btn.classList.contains('ht-button--primary')).toBe(true);

    await simulateClick(btn);
    await waitForNextAnimationFrames(1);

    expect(called).toBe(true);
  });

  it('should use secondary button styling when the action type is secondary', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    getPlugin('notification').showMessage({
      message: 'Choose',
      actions: [
        {
          label: 'Later',
          type: 'secondary',
          callback() {},
        },
      ],
    });
    await waitForNextAnimationFrames(1);

    const btn = document.querySelector('[data-ht-notification-action="0"]');

    expect(btn.classList.contains('ht-button--secondary')).toBe(true);
  });

  it('should append HTMLElement messages into the toast body', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');
    const span = document.createElement('span');

    span.className = 'ht-notification-test-custom-node';
    span.textContent = 'From element';

    plugin.showMessage({ message: span });
    await waitForNextAnimationFrames(1);

    expect(document.querySelector('.ht-notification-test-custom-node').textContent).toBe('From element');
  });

  it('should not use enter-animation class when animation is disabled in settings', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: {
        animation: false,
      },
    });

    getPlugin('notification').showMessage({ message: 'Static' });
    await waitForNextAnimationFrames(1);

    const toast = document.querySelector('.ht-notification__toast');

    expect(toast.classList.contains('ht-notification__toast--animate')).toBe(false);
  });

  it('should auto-dismiss after duration when tab is active', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'Short', duration: 400 });
    await waitForNextAnimationFrames(1);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);

    await sleep(900);
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(0);
    expect(plugin.isVisible()).toBe(false);
  });

  it('should keep toast visible while pointer hovers during countdown', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'Hover pause', duration: 400 });
    await waitForNextAnimationFrames(1);

    const toast = document.querySelector('.ht-notification__toast');

    toast.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await sleep(900);
    await waitForNextAnimationFrames(1);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);

    toast.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    await sleep(900);
    await waitForNextAnimationFrames(1);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(0);
    expect(plugin.isVisible()).toBe(false);
  });

  it('should keep toast until dismissed when duration is 0', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');
    const toastId = plugin.showMessage({ message: 'Sticky', duration: 0 });

    await waitForNextAnimationFrames(1);
    await sleep(800);
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);

    plugin.hide(toastId);
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(0);
  });

  it('should show queued toast after the visible toast at that position is hidden', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: {
        stackLimit: 1,
      },
    });

    const plugin = getPlugin('notification');

    const firstId = plugin.showMessage({ message: 'First' });

    plugin.showMessage({ message: 'Second' });
    await waitForNextAnimationFrames(1);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);
    expect(document.querySelector('.ht-notification__message').textContent).toContain('First');

    plugin.hide(firstId);
    await waitForNextAnimationFrames(1);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);
    expect(document.querySelector('.ht-notification__message').textContent).toContain('Second');
    expect(plugin.getQueueSize()).toBe(0);
  });

  it('should keep focus on a queued replacement toast after closing the visible one (stackLimit 1)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: {
        stackLimit: 1,
      },
    });

    const plugin = getPlugin('notification');
    const firstId = plugin.showMessage({ message: 'First' });

    plugin.showMessage({ message: 'Second' });
    await waitForNextAnimationFrames(1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);

    const firstClose = document.querySelector('.ht-notification__toast .ht-notification__close');

    expect(document.activeElement).toBe(firstClose);

    plugin.hide(firstId);
    await waitForNextAnimationFrames(1);
    await waitForNextAnimationFrames(2);

    expect(document.querySelector('.ht-notification__message').textContent).toContain('Second');

    const secondClose = document.querySelector('.ht-notification__toast .ht-notification__close');

    expect(document.activeElement).toBe(secondClose);
  });

  it('should move focus to the next toast when the focused toast is closed and another remains visible', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'First', position: 'bottom-end' });
    plugin.showMessage({ message: 'Second', position: 'bottom-end' });
    await waitForNextAnimationFrames(1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);

    const closes = [...document.querySelectorAll('.ht-notification__toast .ht-notification__close')];
    const secondClose = closes[1];

    expect(document.activeElement).toBe(closes[0]);

    await simulateClick(closes[0]);
    await waitForNextAnimationFrames(1);
    await waitForNextAnimationFrames(2);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);
    expect(document.activeElement).toBe(secondClose);
  });

  it('should show one toast per corner when stackLimit is 1', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: {
        stackLimit: 1,
      },
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'Top start', position: 'top-start' });
    plugin.showMessage({ message: 'Bottom end', position: 'bottom-end' });
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(2);
    expect(plugin.getQueueSize()).toBe(0);
  });

  it('should fire afterNotificationShow and afterNotificationHide', async() => {
    const afterShow = jasmine.createSpy('afterNotificationShow');
    const afterHide = jasmine.createSpy('afterNotificationHide');

    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
      afterNotificationShow: afterShow,
      afterNotificationHide: afterHide,
    });

    const plugin = getPlugin('notification');
    const toastId = plugin.showMessage({ message: 'Hooked' });

    await waitForNextAnimationFrames(1);

    expect(afterShow).toHaveBeenCalledWith(toastId, jasmine.objectContaining({
      id: toastId,
      message: 'Hooked',
    }));

    plugin.hide(toastId);
    await waitForNextAnimationFrames(1);

    expect(afterHide).toHaveBeenCalledWith(toastId);
  });

  it('should apply stackLimit from updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: {
        stackLimit: 5,
      },
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'a' });
    plugin.showMessage({ message: 'b' });
    plugin.showMessage({ message: 'c' });
    await waitForNextAnimationFrames(1);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(3);

    await updateSettings({
      notification: {
        stackLimit: 2,
      },
    });
    await waitForNextAnimationFrames(1);

    plugin.hideAll();
    await waitForNextAnimationFrames(1);

    plugin.showMessage({ message: 'x' });
    plugin.showMessage({ message: 'y' });
    plugin.showMessage({ message: 'z' });
    await waitForNextAnimationFrames(1);

    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(2);
    expect(plugin.getQueueSize()).toBe(1);
  });

  it('should drop a queued toast when hide is called with its id', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: {
        stackLimit: 1,
      },
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'On screen' });
    const queuedId = plugin.showMessage({ message: 'In queue' });

    expect(plugin.getQueueSize()).toBe(1);

    plugin.hide(queuedId);
    expect(plugin.getQueueSize()).toBe(0);

    await waitForNextAnimationFrames(1);
    expect(document.querySelectorAll('.ht-notification__toast').length).toBe(1);
    expect(document.querySelector('.ht-notification__message').textContent).toContain('On screen');
  });

  it('should not move focus when a toast opens', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    await selectCell(1, 1);
    await waitForNextAnimationFrames(1);

    const plugin = getPlugin('notification');
    const focusedBefore = document.activeElement;

    plugin.showMessage({ message: 'No focus steal' });
    await waitForNextAnimationFrames(1);

    expect(document.activeElement).toBe(focusedBefore);
  });

  it('should keep scroll stack elements out of the sequential tab order', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2),
      notification: true,
    });

    getPlugin('notification').showMessage({ message: 'Toast' });
    await waitForNextAnimationFrames(1);

    document.querySelectorAll('.ht-notification__stack').forEach((stackEl) => {
      expect(stackEl.tabIndex).toBe(-1);
    });
  });

  it('should not move focus when additional toasts open', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    await selectCell(0, 0);
    await waitForNextAnimationFrames(1);

    const plugin = getPlugin('notification');
    const focusedBefore = document.activeElement;

    plugin.showMessage({ message: 'First', position: 'bottom-end' });
    await waitForNextAnimationFrames(1);
    expect(document.activeElement).toBe(focusedBefore);

    plugin.showMessage({ message: 'Second', position: 'bottom-end' });
    await waitForNextAnimationFrames(1);
    expect(document.activeElement).toBe(focusedBefore);
  });

  it('should move focus into toasts on F6 and return to the grid on Escape', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    await selectCell(1, 1);
    await waitForNextAnimationFrames(1);

    const focusedBefore = document.activeElement;
    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'Shortcut toast' });
    await waitForNextAnimationFrames(1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);

    const closeBtn = document.querySelector('.ht-notification__toast .ht-notification__close');

    expect(document.activeElement).toBe(closeBtn);

    await keyDownUp('esc');
    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(focusedBefore);
  });

  it('should return focus to the correct cell after F6, notification rebuild, click into toast, and Escape', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');

    await selectCell(1, 1);
    await waitForNextAnimationFrames(1);

    plugin.showMessage({ message: 'Before rebuild' });
    await waitForNextAnimationFrames(1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);

    await updateSettings({
      notification: {
        stackLimit: 5,
      },
    });
    await waitForNextAnimationFrames(1);

    plugin.showMessage({ message: 'After rebuild' });
    await waitForNextAnimationFrames(1);

    await selectCell(2, 2);
    await waitForNextAnimationFrames(1);

    const focusedCellAfterSecondSelect = document.activeElement;
    const closeBtn = document.querySelector('.ht-notification__toast .ht-notification__close');

    await simulateClick(closeBtn);
    await waitForNextAnimationFrames(1);

    await keyDownUp('esc');
    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(focusedCellAfterSecondSelect);
  });

  it('should return focus to the grid after F6 and closing the last toast, matching Escape', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    await selectCell(1, 1);
    await waitForNextAnimationFrames(1);

    const focusedBefore = document.activeElement;

    getPlugin('notification').showMessage({ message: 'Close last toast' });
    await waitForNextAnimationFrames(1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);

    await simulateClick(document.querySelector('.ht-notification__toast .ht-notification__close'));
    await waitForNextAnimationFrames(1);
    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(focusedBefore);
  });

  it('should return focus to an external control after F6 and Escape when focus started outside the table', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');
    const externalInput = document.createElement('input');

    externalInput.type = 'text';
    externalInput.id = 'notification-test-f6-external';
    document.body.appendChild(externalInput);
    /* Focus outside the grid: isListening() is false; F6 must run via global shortcut contexts. */
    externalInput.focus();
    await waitForNextAnimationFrames(1);

    plugin.showMessage({ message: 'Toast' });
    await waitForNextAnimationFrames(1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(document.querySelector('.ht-notification__toast .ht-notification__close'));

    await keyDownUp('esc');
    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(externalInput);

    externalInput.remove();
  });

  it('should return focus to an external control after F6 and closing the last toast when focus started outside the table', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');
    const externalInput = document.createElement('input');

    externalInput.type = 'text';
    externalInput.id = 'notification-test-f6-external-close';
    document.body.appendChild(externalInput);
    externalInput.focus();
    await waitForNextAnimationFrames(1);

    plugin.showMessage({ message: 'Toast' });
    await waitForNextAnimationFrames(1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(document.querySelector('.ht-notification__toast .ht-notification__close'));

    await simulateClick(document.querySelector('.ht-notification__toast .ht-notification__close'));
    await waitForNextAnimationFrames(1);
    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(externalInput);

    externalInput.remove();
  });

  it('should take notification controls out of the tab order when focus moves to the grid or outside the table', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    await selectCell(1, 1);
    await waitForNextAnimationFrames(1);

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'Toast' });
    await waitForNextAnimationFrames(1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);

    const closeBtn = document.querySelector('.ht-notification__toast .ht-notification__close');

    expect(closeBtn.tabIndex).toBe(0);

    await selectCell(2, 2);
    await waitForNextAnimationFrames(1);

    expect(closeBtn.tabIndex).toBe(-1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);
    expect(closeBtn.tabIndex).toBe(0);

    const externalInput = document.createElement('input');

    externalInput.type = 'text';
    externalInput.id = 'notification-test-external-focus';
    document.body.appendChild(externalInput);
    externalInput.focus();
    await waitForNextAnimationFrames(1);

    expect(closeBtn.tabIndex).toBe(-1);

    externalInput.remove();
  });

  it('should let Tab move between stacked toasts after entering the region with F6', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'First', position: 'bottom-end' });
    plugin.showMessage({ message: 'Second', position: 'bottom-end' });
    await waitForNextAnimationFrames(1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);

    const closes = [...document.querySelectorAll('.ht-notification__toast .ht-notification__close')];

    expect(document.activeElement).toBe(closes[0]);

    await keyDownUp('tab');
    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(closes[1]);
  });

  it('should move Tab from the last notification control to the highlighted grid cell', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    await selectCell(2, 2);
    await waitForNextAnimationFrames(1);

    const highlightedCell = document.activeElement;

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'First', position: 'bottom-end' });
    plugin.showMessage({ message: 'Second', position: 'bottom-end' });
    await waitForNextAnimationFrames(1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);

    const closes = [...document.querySelectorAll('.ht-notification__toast .ht-notification__close')];

    expect(document.activeElement).toBe(closes[0]);

    await keyDownUp('tab');
    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(closes[1]);

    await keyDownUp('tab');
    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(highlightedCell);
  });

  it('should return focus to the cell active before re-entry after Tab exit from the region then click and Escape', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    await selectCell(1, 1);
    await waitForNextAnimationFrames(1);

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'Toast' });
    await waitForNextAnimationFrames(1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);

    await keyDownUp('tab');
    await waitForNextAnimationFrames(2);

    await selectCell(2, 2);
    await waitForNextAnimationFrames(1);

    const cellBeforeClickIntoToast = document.activeElement;
    const closeBtn = document.querySelector('.ht-notification__toast .ht-notification__close');

    await simulateClick(closeBtn);
    await waitForNextAnimationFrames(1);

    await keyDownUp('esc');
    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(cellBeforeClickIntoToast);
  });

  it('should move Tab from the last remaining toast to the grid after closing another toast', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    await selectCell(1, 1);
    await waitForNextAnimationFrames(1);

    const highlightedCell = document.activeElement;

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'First', position: 'bottom-end' });
    plugin.showMessage({ message: 'Second', position: 'bottom-end' });
    await waitForNextAnimationFrames(1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);

    const closes = [...document.querySelectorAll('.ht-notification__toast .ht-notification__close')];

    await simulateClick(closes[0]);
    await waitForNextAnimationFrames(1);
    await waitForNextAnimationFrames(2);

    const secondClose = document.querySelector('.ht-notification__toast .ht-notification__close');

    expect(document.activeElement).toBe(secondClose);

    await keyDownUp('tab');
    await waitForNextAnimationFrames(2);

    expect(document.activeElement).toBe(highlightedCell);
  });

  it('should focus the toast root on F6 when it has no buttons', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      notification: true,
    });

    const plugin = getPlugin('notification');

    plugin.showMessage({ message: 'Plain', closable: false });
    await waitForNextAnimationFrames(1);

    const toastEl = document.querySelector('.ht-notification__toast');

    expect(toastEl.tabIndex).toBe(-1);

    await keyDownUp('f6');
    await waitForNextAnimationFrames(2);

    expect(toastEl.tabIndex).toBe(0);
    expect(document.activeElement).toBe(toastEl);
  });

  describe('multiple Handsontable instances', () => {
    beforeEach(function() {
      this.$container2 = $('<div id="testContainer2"></div>').appendTo('body');
    });

    afterEach(function() {
      this.$container2?.data('handsontable')?.destroy();
      this.$container2?.remove();
    });

    it('should move F6 focus only into the notification region for the instance that owns the focused grid', async function() {
      const hot1 = handsontable({
        data: createSpreadsheetData(2, 2),
        notification: true,
      }, false, this.$container);

      const hot2 = handsontable({
        data: createSpreadsheetData(2, 2),
        notification: true,
      }, false, this.$container2);

      setCurrentHotInstance(hot1);
      hot1.selectCell(0, 0);
      await waitForNextAnimationFrames(1);

      hot1.getPlugin('notification').showMessage({ message: 'Toast A' });
      hot2.getPlugin('notification').showMessage({ message: 'Toast B' });
      await waitForNextAnimationFrames(1);

      const close1 = hot1.rootWrapperElement.querySelector('.ht-notification__toast .ht-notification__close');
      const close2 = hot2.rootWrapperElement.querySelector('.ht-notification__toast .ht-notification__close');

      expect(close1).not.toBe(null);
      expect(close2).not.toBe(null);

      await keyDownUp('f6');
      await waitForNextAnimationFrames(2);

      expect(document.activeElement).toBe(close1);
      expect(document.activeElement).not.toBe(close2);

      setCurrentHotInstance(hot2);
      hot2.selectCell(0, 0);
      await waitForNextAnimationFrames(1);

      await keyDownUp('f6');
      await waitForNextAnimationFrames(2);

      expect(document.activeElement).toBe(close2);
      expect(document.activeElement).not.toBe(close1);
    });
  });
});
