describe('shortcutManager', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should set `grid` context at start', async() => {
    handsontable();

    const shortcutManager = getShortcutManager();

    expect(shortcutManager.getActiveContextName()).toBe('grid');
  });

  it('should not give a possibility to register context with already registered name', async() => {
    handsontable();

    const shortcutManager = getShortcutManager();

    expect(() => {
      shortcutManager.addContext('grid');
    }).toThrowError();

    shortcutManager.addContext('name');

    expect(() => {
      shortcutManager.addContext('name');
    }).toThrowError();
  });

  describe('should properly determine whether key is pressed (public method)', () => {
    it('control', async() => {
      handsontable();

      const shortcutManager = getShortcutManager();

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      await keyDown('control');

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

      await keyUp('control');

      await listen();

      await keyDown('control');

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

      await keyUp('control');

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      await unlisten();

      await keyDown('control');

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

      await keyUp('control');
    });

    it('meta', async() => {
      handsontable();

      const shortcutManager = getShortcutManager();

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      await keyDown('meta');

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

      await keyUp('meta');

      await listen();

      await keyDown('meta');

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

      await keyUp('meta');

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      await unlisten();

      await keyDown('meta');

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

      await keyUp('meta');
    });
  });

  it('should run action when needed', async() => {
    handsontable();

    const shortcutManager = getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');
    const spy = jasmine.createSpy();

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        spy();
      },
      group: 'spy',
      runOnlyIf: () => getSelected() !== undefined,
    });

    await keyDownUp(['control', 'b']);

    expect(spy.calls.count()).toBe(0);

    await listen();

    await keyDownUp(['control', 'b']);

    expect(spy.calls.count()).toBe(0);

    await selectCell(0, 0);

    await keyDownUp(['control', 'b']);

    expect(spy.calls.count()).toBe(1);

    await unlisten();

    await keyDownUp(['control', 'b']);

    expect(spy.calls.count()).toBe(1);
  });

  it('should not trigger a callback when IME event is triggered (keyCode 229)', async() => {
    handsontable();

    const shortcutManager = getShortcutManager();
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
    await listen();

    await keyDownUp(['a'], { ime: true });

    expect(callback.calls.count()).toBe(0);

    await keyDownUp(['Enter'], { ime: true });

    expect(callback.calls.count()).toBe(0);

    await keyDownUp(['Enter'], { ime: false });

    expect(callback.calls.count()).toBe(1);
  });

  it('should not trigger a callback when the `key` is undefined (#dev-2096)', async() => {
    const afterDocumentKeyDown = jasmine.createSpy();

    handsontable({
      afterDocumentKeyDown,
    });

    await listen();

    keyTriggerFactory('keydown', undefined, {
      extend: {},
      target: document.activeElement,
    });

    expect(afterDocumentKeyDown).not.toHaveBeenCalled();
  });

  it('should run action for specified Command/Control modifier key depending on the operating system the table runs on', async() => {
    handsontable();
    const shortcutManager = getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');
    const callback = jasmine.createSpy();

    gridContext.addShortcut({
      keys: [['control/meta', 'b']],
      callback,
      group: 'spy',
      runOnlyIf: () => true,
    });

    await listen();
    Handsontable.helper.setPlatformMeta({ platform: 'Win' });
    await keyDownUp(['meta', 'b']);

    expect(callback.calls.count()).toBe(0);

    await keyDownUp(['control', 'b']);

    expect(callback.calls.count()).toBe(1);

    callback.calls.reset();
    Handsontable.helper.setPlatformMeta({ platform: 'Mac' });
    await keyDownUp(['control', 'b']);

    expect(callback.calls.count()).toBe(0);

    await keyDownUp(['meta', 'b']);

    expect(callback.calls.count()).toBe(1);

    Handsontable.helper.setPlatformMeta(); // Reset platform
  });

  it('should run `beforeKeyDown` and `afterDocumentKeyDown` hook properly', async() => {
    let text = '';

    handsontable({
      beforeKeyDown() {
        text += '1';
      },
      afterDocumentKeyDown() {
        text += '3';
      },
    });
    const shortcutManager = getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '2';
      },
      group: 'spy',
      runOnlyIf: () => getSelected() !== undefined,
    });

    await selectCell(0, 0);
    await keyDownUp(['control', 'b']);

    // Please keep in mind that two keys are pressed.
    expect(text).toBe('13123');
  });

  it('should be possible to stop propagate the shortcut to cell editor', async() => {
    handsontable();
    const shortcutManager = getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    gridContext.addShortcut({
      keys: [['shift', 'z']],
      callback: () => {},
      stopPropagation: true,
      group: 'spy',
    });

    await selectCell(0, 0);
    await keyDownUp(['shift', 'z']);

    expect(getActiveEditor().isOpened()).toBe(false);
  });

  it('should give a possibility to block actions by `beforeKeyDown` hook', async() => {
    let text = '';

    handsontable({
      beforeKeyDown() {
        text += '1';

        return false;
      },
      afterDocumentKeyDown() {
        text += '3';
      },
    });
    const shortcutManager = getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '2';
      },
      group: 'spy',
      runOnlyIf: () => getSelected() !== undefined,
    });

    await selectCell(0, 0);
    await keyDownUp(['control', 'b']);

    // Please keep in mind that two keys are pressed.
    expect(text).toBe('11');
  });

  it('should give a possibility to block next actions by already executed shortcut\'s action', async() => {
    let text = '';

    handsontable({});

    const shortcutManager = getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '1';
      },
      group: 'spy',
      runOnlyIf: () => getSelected() !== undefined,
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '2';

        return false;
      },
      group: 'spy',
      runOnlyIf: () => getSelected() !== undefined,
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '3';
      },
      group: 'spy'
    });

    await selectCell(0, 0);
    await keyDownUp(['control', 'b']);

    expect(text).toBe('12');
  });

  it('should be possible to capture the Ctrl/Meta pressed keys state using the "captureCtrl" option', async() => {
    handsontable({});
    const shortcutManager = getShortcutManager();
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

    await selectCell(0, 0);
    await keyDownUp(['control', 'b']);

    expect(isCtrlPressedSpy).toHaveBeenCalledWith(true);

    isCtrlPressedSpy.calls.reset();
    await keyDownUp(['control', 'k']);

    expect(isCtrlPressedSpy).toHaveBeenCalledWith(false);
  });

  it('should handle action properly when something is removed from actions stack dynamically (executing "old" list of actions)', async() => {
    handsontable({});
    const shortcutManager = getShortcutManager();
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

    await selectCell(0, 0);
    await keyDownUp(['control', 'b']);

    expect(text).toBe('123456');
  });

  it('should handle action properly when something is added to actions stack dynamically (executing "old" list of actions)', async() => {
    handsontable({});
    const shortcutManager = getShortcutManager();
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

    await selectCell(0, 0);
    await keyDownUp(['control', 'b']);

    expect(text).toBe('13456');
  });

  it('should check if there is a need of releasing keys on click #dev-1025', async() => {
    handsontable();
    const shortcutManager = getShortcutManager();
    const releasePressedKeys = spyOn(shortcutManager, 'releasePressedKeys');

    await keyDown('control/meta');
    await simulateClick(getCell(0, 0));

    expect(releasePressedKeys).not.toHaveBeenCalled();

    await keyUp('control/meta');
    // Any key other than control/meta.
    await keyDown('f');

    await simulateClick(getCell(0, 0));

    expect(releasePressedKeys).toHaveBeenCalled();
  });

  describe('`forwardToContext` option', () => {
    it('should forward the event to the other context within the same HoT instance', async() => {
      handsontable();

      const shortcutManager = getShortcutManager();
      const firstContext = shortcutManager.addContext('first');
      const secondContext = shortcutManager.addContext('second');
      const firstSpy = jasmine.createSpy('first');
      const secondSpy = jasmine.createSpy('second');

      shortcutManager.setActiveContextName('second');
      await listen();

      firstContext.addShortcut({
        keys: [['enter']],
        callback: firstSpy,
        group: 'spy',
      });
      secondContext.addShortcut({
        keys: [['enter']],
        forwardToContext: firstContext,
        callback: secondSpy,
        group: 'spy',
      });

      await keyDownUp('enter');

      expect(firstSpy).toHaveBeenCalledTimes(1);
      expect(secondSpy).toHaveBeenCalledTimes(1);
    });

    it('should forward the event to the other context within another HoT instance', async() => {
      const container2 = $('<div id="testContainer2"></div>').appendTo('body');
      const hot1 = handsontable();
      const hot2 = new Handsontable(container2[0]);
      const shortcutManager1 = hot1.getShortcutManager();
      const shortcutManager2 = hot2.getShortcutManager();
      const context1 = shortcutManager1.addContext('hot1');
      const context2 = shortcutManager2.addContext('hot2');
      const hot1Spy = jasmine.createSpy('hot1');
      const hot2Spy = jasmine.createSpy('hot2');

      shortcutManager2.setActiveContextName('hot2');
      hot2.listen();

      context1.addShortcut({
        keys: [['enter']],
        callback: hot1Spy,
        group: 'spy',
      });
      context2.addShortcut({
        keys: [['enter']],
        forwardToContext: context1,
        callback: hot2Spy,
        group: 'spy',
      });

      await keyDownUp('enter');

      expect(hot2Spy).toHaveBeenCalledTimes(1);
      expect(hot1Spy).toHaveBeenCalledTimes(1);

      hot2.destroy();
      container2.remove();
    });

    it('should not forward the event to the other context when in the first context the event was cancelled', async() => {
      handsontable();

      const shortcutManager = getShortcutManager();
      const firstContext = shortcutManager.addContext('first');
      const secondContext = shortcutManager.addContext('second');
      const firstSpy = jasmine.createSpy('first');

      shortcutManager.setActiveContextName('second');
      await listen();

      firstContext.addShortcut({
        keys: [['enter']],
        callback: firstSpy,
        group: 'spy',
      });
      secondContext.addShortcut({
        keys: [['enter']],
        forwardToContext: firstContext,
        callback: () => {
          return false;
        },
        group: 'spy',
      });

      await keyDownUp('enter');

      expect(firstSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('`runOnlyIf` option', () => {
    it('should execute the shortcut action when the option is not defined', async() => {
      const callback = jasmine.createSpy('callback');

      handsontable();

      const shortcutManager = getShortcutManager();
      const gridContext = shortcutManager.addContext('test');

      gridContext.addShortcut({
        keys: [['enter']],
        group: 'spy',
        callback,
      });

      shortcutManager.setActiveContextName('test');
      await listen();
      await keyDownUp('enter');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should execute the shortcut action when the option returns `true`', async() => {
      const callback = jasmine.createSpy('callback');

      handsontable();

      const shortcutManager = getShortcutManager();
      const gridContext = shortcutManager.addContext('test');

      gridContext.addShortcut({
        keys: [['enter']],
        group: 'spy',
        runOnlyIf: () => true,
        callback,
      });

      shortcutManager.setActiveContextName('test');
      await listen();
      await keyDownUp('enter');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not execute the shortcut action when the option returns different value than `true`', async() => {
      const callback = jasmine.createSpy('callback');
      const runOnlyIf = jasmine.createSpy('runOnlyIf');

      handsontable();

      const shortcutManager = getShortcutManager();
      const gridContext = shortcutManager.addContext('test');

      gridContext.addShortcut({
        keys: [['enter']],
        group: 'spy',
        runOnlyIf,
        callback,
      });

      shortcutManager.setActiveContextName('test');
      await listen();

      runOnlyIf.and.returnValue(false);
      await keyDownUp('enter');

      expect(callback).toHaveBeenCalledTimes(0);

      runOnlyIf.and.returnValue(null);
      await keyDownUp('enter');

      expect(callback).toHaveBeenCalledTimes(0);

      runOnlyIf.and.returnValue(undefined);
      await keyDownUp('enter');

      expect(callback).toHaveBeenCalledTimes(0);

      runOnlyIf.and.returnValue([]);
      await keyDownUp('enter');

      expect(callback).toHaveBeenCalledTimes(0);
    });
  });

  describe('`scope` option', () => {
    it('should create a context with the `table` scope by default', async() => {
      handsontable();

      const shortcutManager = getShortcutManager();
      const gridContext = shortcutManager.addContext('test');

      expect(gridContext.scope).toBe('table');
    });

    it('should create a context with the `global` scope when the `scope` option is set to `global`', async() => {
      handsontable();

      const shortcutManager = getShortcutManager();
      const gridContext = shortcutManager.addContext('test', 'global');

      expect(gridContext.scope).toBe('global');
    });
  });
});
