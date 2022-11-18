describe('shortcutManager', () => {
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

  it('should set `grid` context at start', () => {
    const hot = handsontable();
    const shortcutManager = hot.getShortcutManager();

    expect(shortcutManager.getActiveContextName()).toBe('grid');
  });

  it('should not give a possibility to register context with already registered name', () => {
    const hot = handsontable();
    const shortcutManager = hot.getShortcutManager();

    expect(() => {
      shortcutManager.addContext('grid');
    }).toThrowError();

    shortcutManager.addContext('name');

    expect(() => {
      shortcutManager.addContext('name');
    }).toThrowError();
  });

  describe('should properly determine whether key is pressed (public method)', () => {
    it('control', () => {
      const hot = handsontable();
      const shortcutManager = hot.getShortcutManager();

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      keyDown('control');

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      keyUp('control');

      hot.listen();

      keyDown('control');

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

      keyUp('control');

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      hot.unlisten();

      keyDown('control');

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      keyUp('control');
    });

    it('meta', () => {
      const hot = handsontable();
      const shortcutManager = hot.getShortcutManager();

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      keyDown('meta');

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      keyUp('meta');

      hot.listen();

      keyDown('meta');

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

      keyUp('meta');

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      hot.unlisten();

      keyDown('meta');

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      keyUp('meta');
    });
  });

  it('should run action when needed', () => {
    const hot = handsontable();
    const shortcutManager = hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');
    const spy = jasmine.createSpy();

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        spy();
      },
      group: 'spy',
      runOnlyIf: () => hot.getSelected() !== void 0,
    });

    keyDownUp(['control', 'b']);

    expect(spy.calls.count()).toBe(0);

    hot.listen();

    keyDownUp(['control', 'b']);

    expect(spy.calls.count()).toBe(0);

    selectCell(0, 0);

    keyDownUp(['control', 'b']);

    expect(spy.calls.count()).toBe(1);

    hot.unlisten();

    keyDownUp(['control', 'b']);

    expect(spy.calls.count()).toBe(1);
  });

  it('should not trigger a callback when IME event is triggered (keyCode 229)', () => {
    const hot = handsontable();
    const shortcutManager = hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');
    const callback = jasmine.createSpy();

    gridContext.removeShortcutsByKeys(['a']);
    gridContext.addShortcut({
      keys: [['a']],
      callback,
      group: 'spy',
    });
    gridContext.removeShortcutsByKeys(['Enter']);
    gridContext.addShortcut({
      keys: [['Enter']],
      callback,
      group: 'spy',
    });
    hot.listen();

    keyDownUp(['a'], { ime: true });

    expect(callback.calls.count()).toBe(0);

    keyDownUp(['Enter'], { ime: true });

    expect(callback.calls.count()).toBe(0);

    keyDownUp(['Enter'], { ime: false });

    expect(callback.calls.count()).toBe(1);
  });

  it('should run action for specified Command/Control modifier key depending on the operating system the table runs on', () => {
    const hot = handsontable();
    const shortcutManager = hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');
    const callback = jasmine.createSpy();

    gridContext.addShortcut({
      keys: [['control/meta', 'b']],
      callback,
      group: 'spy',
      runOnlyIf: () => true,
    });

    hot.listen();
    Handsontable.helper.setPlatformMeta({ platform: 'Win' });
    keyDownUp(['meta', 'b']);

    expect(callback.calls.count()).toBe(0);

    keyDownUp(['control', 'b']);

    expect(callback.calls.count()).toBe(1);

    callback.calls.reset();
    Handsontable.helper.setPlatformMeta({ platform: 'Mac' });
    keyDownUp(['control', 'b']);

    expect(callback.calls.count()).toBe(0);

    keyDownUp(['meta', 'b']);

    expect(callback.calls.count()).toBe(1);

    Handsontable.helper.setPlatformMeta(); // Reset platform
  });

  it('should run `beforeKeyDown` and `afterDocumentKeyDown` hook properly', () => {
    let text = '';

    const hot = handsontable({
      beforeKeyDown() {
        text += '1';
      },
      afterDocumentKeyDown() {
        text += '3';
      },
    });
    const shortcutManager = hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '2';
      },
      group: 'spy',
      runOnlyIf: () => hot.getSelected() !== void 0,
    });

    selectCell(0, 0);
    keyDownUp(['control', 'b']);

    // Please keep in mind that two keys are pressed.
    expect(text).toBe('13123');
  });

  it('should give a possibility to block actions by `beforeKeyDown` hook', () => {
    let text = '';

    const hot = handsontable({
      beforeKeyDown() {
        text += '1';

        return false;
      },
      afterDocumentKeyDown() {
        text += '3';
      },
    });
    const shortcutManager = hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '2';
      },
      group: 'spy',
      runOnlyIf: () => hot.getSelected() !== void 0,
    });

    selectCell(0, 0);
    keyDownUp(['control', 'b']);

    // Please keep in mind that two keys are pressed.
    expect(text).toBe('11');
  });

  it('should give a possibility to block next actions by already executed shortcut\'s action', () => {
    let text = '';
    const hot = handsontable({});
    const shortcutManager = hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '1';
      },
      group: 'spy',
      runOnlyIf: () => hot.getSelected() !== void 0,
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '2';

        return false;
      },
      group: 'spy',
      runOnlyIf: () => hot.getSelected() !== void 0,
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '3';
      },
      group: 'spy'
    });

    selectCell(0, 0);
    keyDownUp(['control', 'b']);

    expect(text).toBe('12');
  });

  it('should be possible to capture the Ctrl/Meta pressed keys state using the "captureCtrl" option', () => {
    const hot = handsontable({});
    const shortcutManager = hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');
    const isCtrlPressedSpy = jasmine.createSpy();

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        isCtrlPressedSpy(shortcutManager.isCtrlPressed());
      },
      group: 'spy',
    });

    gridContext.addShortcut({
      keys: [['control', 'k']],
      captureCtrl: true,
      callback: () => {
        isCtrlPressedSpy(shortcutManager.isCtrlPressed());
      },
      group: 'spy',
    });

    selectCell(0, 0);
    keyDownUp(['control', 'b']);

    expect(isCtrlPressedSpy).toHaveBeenCalledWith(true);

    isCtrlPressedSpy.calls.reset();
    keyDownUp(['control', 'k']);

    expect(isCtrlPressedSpy).toHaveBeenCalledWith(false);
  });

  it('should handle action properly when something is removed from actions stack dynamically (executing "old" list of actions)', () => {
    const hot = handsontable({});
    const shortcutManager = hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');
    let text = '';

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '1';

        gridContext.removeShortcutsByGroup('spy2');
      },
      group: 'spy'
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '2';
      },
      group: 'spy2'
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '3';
      },
      group: 'spy2'
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '4';
      },
      group: 'spy3',
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '5';
      },
      group: 'spy2',
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '6';
      },
      group: 'spy3',
    });

    selectCell(0, 0);
    keyDownUp(['control', 'b']);

    expect(text).toBe('123456');
  });

  it('should handle action properly when something is added to actions stack dynamically (executing "old" list of actions)', () => {
    const hot = handsontable({});
    const shortcutManager = hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');
    let text = '';

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '1';

        gridContext.addShortcut({
          keys: [['control', 'b']],
          callback: () => {
            text += '2';
          },
          group: 'spy2',
        });
      },
      group: 'spy',
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '3';
      },
      group: 'spy2',
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '4';
      },
      group: 'spy3',
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '5';
      },
      group: 'spy2',
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '6';
      },
      group: 'spy3',
    });

    selectCell(0, 0);
    keyDownUp(['control', 'b']);

    expect(text).toBe('13456');
  });

  it('should handle event without key property in a proper way', () => {
    const externalInputElement = document.createElement('input');

    handsontable({});

    document.body.appendChild(externalInputElement);
    externalInputElement.select();

    expect(() => {
      $(externalInputElement).simulate('keydown', {});
      $(externalInputElement).simulate('keyup', {});
    }).not.toThrow();

    document.body.removeChild(externalInputElement);
  });
});
