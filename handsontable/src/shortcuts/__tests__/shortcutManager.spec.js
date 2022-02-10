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

      expect(shortcutManager.isCtrlPressed()).toBe(true);

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

      expect(shortcutManager.isCtrlPressed()).toBe(true);

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

    gridContext.addShortcut([['control', 'b']], () => {
      spy();
    }, {
      namespace: 'spy',
      runAction: () => hot.getSelected() !== void 0,
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

    gridContext.addShortcut([['control', 'b']], () => {
      text += '2';
    }, {
      namespace: 'spy',
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

    gridContext.addShortcut([['control', 'b']], () => {
      text += '2';
    }, {
      namespace: 'spy',
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

    gridContext.addShortcut([['control', 'b']], () => {
      text += '1';
    }, {
      namespace: 'spy',
    });

    gridContext.addShortcut([['control', 'b']], () => {
      text += '2';

      return false;
    }, {
      namespace: 'spy',
    });

    gridContext.addShortcut([['control', 'b']], () => {
      text += '3';
    }, {
      namespace: 'spy',
    });

    selectCell(0, 0);
    keyDownUp(['control', 'b']);

    expect(text).toBe('12');
  });

  it('should handle action properly when something is removed from actions stack dynamically (executing "old" list of actions)', () => {
    const hot = handsontable({});
    const shortcutManager = hot.getShortcutManager();
    const gridContext = shortcutManager.getContext('grid');
    let text = '';

    gridContext.addShortcut([['control', 'b']], () => {
      text += '1';

      gridContext.removeShortcutByNamespace('spy2');
    }, {
      namespace: 'spy',
    });

    gridContext.addShortcut([['control', 'b']], () => {
      text += '2';
    }, {
      namespace: 'spy2',
    });

    gridContext.addShortcut([['control', 'b']], () => {
      text += '3';
    }, {
      namespace: 'spy2',
    });

    gridContext.addShortcut([['control', 'b']], () => {
      text += '4';

      gridContext.removeShortcutByNamespace('spy');
    }, {
      namespace: 'spy3',
    });

    gridContext.addShortcut([['control', 'b']], () => {
      text += '5';
    }, {
      namespace: 'spy2',
    });

    gridContext.addShortcut([['control', 'b']], () => {
      text += '6';
    }, {
      namespace: 'spy3',
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

    gridContext.addShortcut([['control', 'b']], () => {
      text += '1';

      gridContext.addShortcut([['control', 'b']], () => {
        text += '2';
      }, {
        namespace: 'spy2',
      });
    }, {
      namespace: 'spy',
    });

    gridContext.addShortcut([['control', 'b']], () => {
      text += '3';
    }, {
      namespace: 'spy2',
    });

    gridContext.addShortcut([['control', 'b']], () => {
      text += '4';

      // gridContext.removeShortcutByNamespace('spy');
    }, {
      namespace: 'spy3',
    });

    gridContext.addShortcut([['control', 'b']], () => {
      text += '5';
    }, {
      namespace: 'spy2',
    });

    gridContext.addShortcut([['control', 'b']], () => {
      text += '6';
    }, {
      namespace: 'spy3',
    });

    selectCell(0, 0);
    keyDownUp(['control', 'b']);

    expect(text).toBe('13456');
  });
});
