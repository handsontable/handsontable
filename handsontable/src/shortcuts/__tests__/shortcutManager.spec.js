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

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

      keyUp('control');

      hot.listen();

      keyDown('control');

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

      keyUp('control');

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      hot.unlisten();

      keyDown('control');

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

      keyUp('control');
    });

    it('meta', () => {
      const hot = handsontable();
      const shortcutManager = hot.getShortcutManager();

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      keyDown('meta');

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

      keyUp('meta');

      hot.listen();

      keyDown('meta');

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

      keyUp('meta');

      expect(shortcutManager.isCtrlPressed()).toBeFalse();

      hot.unlisten();

      keyDown('meta');

      expect(shortcutManager.isCtrlPressed()).toBeTrue();

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
      runOnlyIf: () => hot.getSelected() !== undefined,
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

  it('should not trigger a callback when the `key` is undefined (#dev-2096)', () => {
    const afterDocumentKeyDown = jasmine.createSpy();
    const hot = handsontable({
      afterDocumentKeyDown,
    });

    hot.listen();

    keyTriggerFactory('keydown', undefined, {
      extend: {},
      target: document.activeElement,
    });

    expect(afterDocumentKeyDown).not.toHaveBeenCalled();
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
      runOnlyIf: () => hot.getSelected() !== undefined,
    });

    selectCell(0, 0);
    keyDownUp(['control', 'b']);

    // Please keep in mind that two keys are pressed.
    expect(text).toBe('13123');
  });

  it('should be possible to stop propagate the shortcut to cell editor', () => {
    const hot = handsontable();
    const shortcutManager = hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');

    gridContext.addShortcut({
      keys: [['shift', 'z']],
      callback: () => {},
      stopPropagation: true,
      group: 'spy',
    });

    selectCell(0, 0);
    keyDownUp(['shift', 'z']);

    expect(getActiveEditor().isOpened()).toBe(false);
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
      runOnlyIf: () => hot.getSelected() !== undefined,
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
      runOnlyIf: () => hot.getSelected() !== undefined,
    });

    gridContext.addShortcut({
      keys: [['control', 'b']],
      callback: () => {
        text += '2';

        return false;
      },
      group: 'spy',
      runOnlyIf: () => hot.getSelected() !== undefined,
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

  it('should check if there is a need of releasing keys on click #dev-1025', () => {
    const hot = handsontable();
    const shortcutManager = hot.getShortcutManager();
    const releasePressedKeys = spyOn(shortcutManager, 'releasePressedKeys');

    keyDown('control/meta');
    simulateClick(getCell(0, 0));

    expect(releasePressedKeys).not.toHaveBeenCalled();

    keyUp('control/meta');
    // Any key other than control/meta.
    keyDown('f');

    simulateClick(getCell(0, 0));

    expect(releasePressedKeys).toHaveBeenCalled();
  });

  describe('`forwardToContext` option', () => {
    it('should forward the event to the other context within the same HoT instance', () => {
      handsontable();

      const shortcutManager = getShortcutManager();
      const firstContext = shortcutManager.addContext('first');
      const secondContext = shortcutManager.addContext('second');
      const firstSpy = jasmine.createSpy('first');
      const secondSpy = jasmine.createSpy('second');

      shortcutManager.setActiveContextName('second');
      listen();

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

      keyDownUp('enter');

      expect(firstSpy).toHaveBeenCalledTimes(1);
      expect(secondSpy).toHaveBeenCalledTimes(1);
    });

    it('should forward the event to the other context within another HoT instance', () => {
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

      keyDownUp('enter');

      expect(hot2Spy).toHaveBeenCalledTimes(1);
      expect(hot1Spy).toHaveBeenCalledTimes(1);

      hot2.destroy();
      container2.remove();
    });

    it('should not forward the event to the other context when in the first context the event was cancelled', () => {
      handsontable();

      const shortcutManager = getShortcutManager();
      const firstContext = shortcutManager.addContext('first');
      const secondContext = shortcutManager.addContext('second');
      const firstSpy = jasmine.createSpy('first');

      shortcutManager.setActiveContextName('second');
      listen();

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

      keyDownUp('enter');

      expect(firstSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('`runOnlyIf` option', () => {
    it('should execute the shortcut action when the option is not defined', () => {
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
      listen();
      keyDownUp('enter');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should execute the shortcut action when the option returns `true`', () => {
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
      listen();
      keyDownUp('enter');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not execute the shortcut action when the option returns different value than `true`', () => {
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
      listen();

      runOnlyIf.and.returnValue(false);
      keyDownUp('enter');

      expect(callback).toHaveBeenCalledTimes(0);

      runOnlyIf.and.returnValue(null);
      keyDownUp('enter');

      expect(callback).toHaveBeenCalledTimes(0);

      runOnlyIf.and.returnValue(undefined);
      keyDownUp('enter');

      expect(callback).toHaveBeenCalledTimes(0);

      runOnlyIf.and.returnValue([]);
      keyDownUp('enter');

      expect(callback).toHaveBeenCalledTimes(0);
    });
  });
});
