import { createContext } from '../context';

describe('context', () => {
  it('should add shortcut properly only when namespace, callback and keys properties are proper', () => {
    const context = createContext('name');

    expect(() => {
      context.addShortcut({
        keys: [['control/meta', 'a']],
        callback: () => {
          // Callback for shortcut.
        },
      });
    }).toThrowWithCause(undefined, { handsontable: true });

    expect(() => {
      context.addShortcut({
        group: 'helloWorld',
        keys: [['control/meta', 'a']],
      });
    }).toThrowWithCause(undefined, { handsontable: true });

    expect(() => {
      context.addShortcut({
        group: 'helloWorld',
        callback: () => {
          // Callback for shortcut.
        },
      });
    }).toThrowWithCause(undefined, { handsontable: true });

    context.addShortcut({
      group: 'helloWorld',
      keys: [['control/meta', 'a']],
      callback: () => {
        // Callback for shortcut.
      },
    });
  });

  it('should give an ability to get registered shortcuts', () => {
    const context = createContext('name');
    const callback = () => {
      // Callback for shortcut.
    };
    const callback2 = () => {
      // Another callback for shortcut.
    };
    const options = {
      group: 'helloWorld'
    };

    context.addShortcut({
      keys: [['control/meta', 'a']],
      callback,
      ...options
    });

    let shortcuts = context.getShortcuts(['control/meta', 'a']);
    let shortcut = shortcuts[0];

    expect(shortcuts.length).toBe(1);
    expect(shortcut.callback).toBe(callback);
    expect(shortcut.group).toBe(options.group);

    context.addShortcut({
      keys: [['control/meta', 'a']],
      callback: callback2,
      ...options
    });

    shortcuts = context.getShortcuts(['control/meta', 'a']);

    shortcut = shortcuts[0];
    const shortcut2 = shortcuts[1];

    expect(shortcuts.length).toBe(2);
    expect(shortcut.callback).toBe(callback);
    expect(shortcut.group).toBe(options.group);
    expect(shortcut2.callback).toBe(callback2);
    expect(shortcut2.group).toBe(options.group);
  });

  it('should add multiple shortcuts using the `addShortcuts` method', () => {
    const context = createContext('name');
    const callback = () => {
      // Callback for shortcut.
    };
    const callback2 = () => {
      // Another callback for shortcut.
    };
    const options = {
      group: 'helloWorld'
    };
    const namespace2 = 'helloWorld2';
    const runOnlyIf = () => true;

    context.addShortcuts([{
      keys: [['control/meta', 'a']],
      callback,
    }, {
      keys: [['control/meta', 'a']],
      callback: callback2,
      group: 'helloWorld2',
      runOnlyIf,
    }], options);

    const shortcuts = context.getShortcuts(['control/meta', 'a']);
    const shortcut = shortcuts[0];
    const shortcut2 = shortcuts[1];

    expect(shortcuts.length).toBe(2);
    expect(shortcut.callback).toBe(callback);
    expect(shortcut.group).toBe(options.group);
    expect(shortcut2.callback).toBe(callback2);
    expect(shortcut2.group).toBe(namespace2);
    expect(shortcut2.runOnlyIf).toBe(runOnlyIf);
  });

  it('should be possible to add/remove "control/meta" virtual shortcut without conflicting with ' +
     '"control" and "meta" shortcuts', () => {
    const context = createContext('name');
    const options = {
      group: 'helloWorld'
    };

    context.addShortcuts([{
      keys: [['control/meta', 'a']],
      callback: () => {},
    }, {
      keys: [['control', 'a']],
      callback: () => {},
    }, {
      keys: [['meta', 'a']],
      callback: () => {},
    }], options);

    expect(context.getShortcuts(['control/meta', 'a']).length).toBe(1);
    expect(context.getShortcuts(['control', 'a']).length).toBe(1);
    expect(context.getShortcuts(['meta', 'a']).length).toBe(1);

    context.removeShortcutsByKeys(['meta', 'a']);

    expect(context.getShortcuts(['control/meta', 'a']).length).toBe(1);
    expect(context.getShortcuts(['control', 'a']).length).toBe(1);
    expect(context.getShortcuts(['meta', 'a']).length).toBe(0);

    context.removeShortcutsByKeys(['control', 'a']);

    expect(context.getShortcuts(['control/meta', 'a']).length).toBe(1);
    expect(context.getShortcuts(['control', 'a']).length).toBe(0);
    expect(context.getShortcuts(['meta', 'a']).length).toBe(0);

    context.removeShortcutsByKeys(['control/meta', 'a']);

    expect(context.getShortcuts(['control/meta', 'a']).length).toBe(0);
    expect(context.getShortcuts(['control', 'a']).length).toBe(0);
    expect(context.getShortcuts(['meta', 'a']).length).toBe(0);
  });

  it('should give a possibility to remove registered shortcuts by keys', () => {
    const context = createContext('name');
    const callback = () => {
      // Callback for shortcut.
    };
    const callback2 = () => {
      // Another callback for shortcut.
    };
    const options = {
      group: 'helloWorld'
    };

    context.addShortcuts([{
      keys: [['control/meta', 'a']],
      callback,
    }, {
      keys: [['control/meta', 'a']],
      callback: callback2,
    }], options);

    context.removeShortcutsByKeys(['control/meta', 'a']);

    const shortcuts = context.getShortcuts(['control/meta', 'a']);

    expect(shortcuts).toEqual([]);
  });

  it('should give a possibility to check whether there are registered shortcuts', () => {
    const context = createContext('name');
    const callback = () => {
      // Callback for shortcut.
    };
    const callback2 = () => {
      // Callback for shortcut.
    };
    const options = {
      group: 'helloWorld'
    };

    expect(context.hasShortcut(['meta', 'c'])).toBe(false);
    expect(context.hasShortcut(['Meta', 'C'])).toBe(false);
    expect(context.hasShortcut(['c', 'meta'])).toBe(false);
    expect(context.hasShortcut(['C', 'Meta'])).toBe(false);

    context.addShortcut({
      keys: [['meta', 'C']],
      callback,
      ...options
    });

    expect(context.hasShortcut(['meta', 'c'])).toBe(true);
    expect(context.hasShortcut(['Meta', 'C'])).toBe(true);
    expect(context.hasShortcut(['c', 'meta'])).toBe(true);
    expect(context.hasShortcut(['C', 'Meta'])).toBe(true);

    context.addShortcut({
      keys: [['meta', 'c']],
      callback: callback2,
      ...options
    });

    expect(context.hasShortcut(['meta', 'c'])).toBe(true);
    expect(context.hasShortcut(['Meta', 'C'])).toBe(true);
    expect(context.hasShortcut(['c', 'meta'])).toBe(true);
    expect(context.hasShortcut(['C', 'Meta'])).toBe(true);

    context.removeShortcutsByKeys(['meta', 'c']);

    expect(context.hasShortcut(['meta', 'c'])).toBe(false);
    expect(context.hasShortcut(['Meta', 'C'])).toBe(false);
    expect(context.hasShortcut(['c', 'meta'])).toBe(false);
    expect(context.hasShortcut(['C', 'Meta'])).toBe(false);

    context.addShortcut({
      keys: [['Meta', 'c']],
      callback,
      ...options
    });

    expect(context.hasShortcut(['meta', 'c'])).toBe(true);
    expect(context.hasShortcut(['Meta', 'C'])).toBe(true);
    expect(context.hasShortcut(['c', 'meta'])).toBe(true);
    expect(context.hasShortcut(['C', 'Meta'])).toBe(true);

    context.removeShortcutsByKeys(['meta', 'c']);

    expect(context.hasShortcut(['meta', 'c'])).toBe(false);
    expect(context.hasShortcut(['Meta', 'C'])).toBe(false);
    expect(context.hasShortcut(['c', 'meta'])).toBe(false);
    expect(context.hasShortcut(['C', 'Meta'])).toBe(false);

    context.addShortcut({
      keys: [['Meta', 'C']],
      callback,
      ...options
    });

    expect(context.hasShortcut(['meta', 'c'])).toBe(true);
    expect(context.hasShortcut(['Meta', 'C'])).toBe(true);
    expect(context.hasShortcut(['c', 'meta'])).toBe(true);
    expect(context.hasShortcut(['C', 'Meta'])).toBe(true);

    context.removeShortcutsByKeys(['meta', 'c']);

    expect(context.hasShortcut(['meta', 'c'])).toBe(false);
    expect(context.hasShortcut(['Meta', 'C'])).toBe(false);
    expect(context.hasShortcut(['c', 'meta'])).toBe(false);
    expect(context.hasShortcut(['C', 'Meta'])).toBe(false);
  });

  it('should give a possibility to remove registered shortcuts by group', () => {
    const context = createContext('name');
    const callback = () => {
      // Callback for shortcut.
    };
    const callback2 = () => {
      // Callback for shortcut.
    };
    const callback3 = () => {
      // Callback for shortcut.
    };
    const callback4 = () => {
      // Callback for shortcut.
    };
    const options = {
      group: 'helloWorld'
    };
    const options2 = {
      group: 'helloWorld2'
    };

    context.addShortcuts([{
      keys: [['control/meta', 'a']],
      callback,
    }, {
      keys: [['control/meta', 'b']],
      callback: callback2,
    }], options);

    context.addShortcuts([{
      keys: [['control/meta', 'a']],
      callback: callback3,
    }, {
      keys: [['control/meta', 'd']],
      callback: callback4,
    }], options2);

    context.removeShortcutsByGroup(options.group);

    const shortcuts = context.getShortcuts(['control/meta', 'a']);

    expect(shortcuts.length).toBe(1);
    expect(context.hasShortcut(['control/meta', 'b'])).toBe(false);

    context.removeShortcutsByGroup(options2.group);

    expect(context.hasShortcut(['control/meta', 'a'])).toBe(false);
    expect(context.hasShortcut(['control/meta', 'b'])).toBe(false);
    expect(context.hasShortcut(['control/meta', 'd'])).toBe(false);
  });

  it('should give an ability to place one shortcut right before/after another one', () => {
    const context = createContext('name');
    const callback = () => {
      // Callback for shortcut.
    };
    const callback2 = () => {
      // Callback for shortcut.
    };
    const callback3 = () => {
      // Callback for shortcut.
    };
    const callback4 = () => {
      // Callback for shortcut.
    };
    const defaultOptions = {
      preventDefault: true,
      stopPropagation: false,
    };
    const config = {
      group: 'namespace1',
      captureCtrl: false,
      runOnlyIf: () => true,
    };
    const config2 = {
      group: 'namespace2',
      relativeToGroup: 'namespace1',
      position: 'before',
      captureCtrl: false,
      runOnlyIf: () => true,
    };
    const config3 = {
      group: 'namespace3',
      captureCtrl: false,
      runOnlyIf: () => true,
    };
    const config4 = {
      group: 'namespace4',
      relativeToGroup: 'namespace2',
      position: 'after',
      captureCtrl: false,
      runOnlyIf: () => true,
    };

    context.addShortcuts([{
      keys: [['control/meta', 'a']],
      callback,
      ...config
    }, {
      keys: [['control/meta', 'a']],
      callback: callback2,
      ...config2
    }, {
      keys: [['control/meta', 'a']],
      callback: callback3,
      ...config3
    }, {
      keys: [['control/meta', 'a']],
      callback: callback4,
      ...config4
    }]);

    const shortcuts = context.getShortcuts(['control/meta', 'a']);

    // namespace2, namespace4, namespace1, namespace3
    expect(shortcuts).toEqual([
      { callback: callback2, ...defaultOptions, ...config2 },
      { callback: callback4, ...defaultOptions, ...config4 },
      { callback, ...defaultOptions, ...config },
      { callback: callback3, ...defaultOptions, ...config3 },
    ]);
  });
});
