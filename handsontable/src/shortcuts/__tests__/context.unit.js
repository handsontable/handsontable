import { createContext } from '../context';

describe('context', () => {
  it('should add shortcut properly only when namespace is added', () => {
    const context = createContext('name');

    expect(() => {
      context.addShortcut([['control', 'a']], () => {
        // Callback for shortcut.
      });
    }).toThrowError();

    context.addShortcut([['control', 'a']], () => {
      // Callback for shortcut.
    }, {
      namespace: 'helloWorld'
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
      namespace: 'helloWorld'
    };

    context.addShortcut([['control', 'a']], callback, options);

    let shortcuts = context.getShortcuts(['control', 'a']);
    let shortcut = shortcuts[0];

    expect(shortcuts.length).toBe(1);
    expect(shortcut.callback).toBe(callback);
    expect(shortcut.options.namespace).toBe(options.namespace);

    context.addShortcut([['control', 'a']], callback2, options);

    shortcuts = context.getShortcuts(['control', 'a']);

    shortcut = shortcuts[0];
    const shortcut2 = shortcuts[1];

    expect(shortcuts.length).toBe(2);
    expect(shortcut.callback).toBe(callback);
    expect(shortcut.options.namespace).toBe(options.namespace);
    expect(shortcut2.callback).toBe(callback2);
    expect(shortcut2.options.namespace).toBe(options.namespace);
  });

  it('should give a possibility to remove registered shortcuts by variant', () => {
    const context = createContext('name');
    const callback = () => {
      // Callback for shortcut.
    };
    const callback2 = () => {
      // Another callback for shortcut.
    };
    const options = {
      namespace: 'helloWorld'
    };

    context.addShortcut([['control', 'a']], callback, options);
    context.addShortcut([['control', 'a']], callback2, options);

    context.removeShortcutByVariants([['control', 'a']]);

    const shortcuts = context.getShortcuts(['control', 'a']);

    expect(shortcuts).toBeUndefined();
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
      namespace: 'helloWorld'
    };

    expect(context.hasShortcut(['control', 'a'])).toBe(false);
    expect(context.hasShortcut(['Control', 'A'])).toBe(false);
    expect(context.hasShortcut(['a', 'control'])).toBe(false);
    expect(context.hasShortcut(['A', 'Control'])).toBe(false);

    context.addShortcut([['control', 'a']], callback, options);

    expect(context.hasShortcut(['control', 'a'])).toBe(true);
    expect(context.hasShortcut(['Control', 'A'])).toBe(true);
    expect(context.hasShortcut(['a', 'control'])).toBe(true);
    expect(context.hasShortcut(['A', 'Control'])).toBe(true);

    context.addShortcut([['control', 'a']], callback2, options);

    expect(context.hasShortcut(['control', 'a'])).toBe(true);
    expect(context.hasShortcut(['Control', 'A'])).toBe(true);
    expect(context.hasShortcut(['a', 'control'])).toBe(true);
    expect(context.hasShortcut(['A', 'Control'])).toBe(true);

    context.removeShortcutByVariants([['control', 'a']]);

    expect(context.hasShortcut(['control', 'a'])).toBe(false);
    expect(context.hasShortcut(['Control', 'A'])).toBe(false);
    expect(context.hasShortcut(['a', 'control'])).toBe(false);
    expect(context.hasShortcut(['A', 'Control'])).toBe(false);
  });

  it('should give a possibility to remove registered shortcuts by namespace', () => {
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
      namespace: 'helloWorld'
    };
    const options2 = {
      namespace: 'helloWorld2'
    };

    context.addShortcut([['control', 'a']], callback, options);
    context.addShortcut([['control', 'b']], callback2, options);
    context.addShortcut([['control', 'a']], callback3, options2);
    context.addShortcut([['control', 'd']], callback4, options2);

    context.removeShortcutByNamespace(options.namespace);

    const shortcuts = context.getShortcuts(['control', 'a']);

    expect(shortcuts.length).toBe(1);
    expect(context.hasShortcut(['control', 'b'])).toBe(false);

    context.removeShortcutByNamespace(options2.namespace);

    expect(context.hasShortcut(['control', 'a'])).toBe(false);
    expect(context.hasShortcut(['control', 'b'])).toBe(false);
    expect(context.hasShortcut(['control', 'd'])).toBe(false);
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
      position: 'after',
      relativeToNamespace: '',
    };
    const config = {
      namespace: 'namespace1',
      runAction: () => true,
    };
    const config2 = {
      namespace: 'namespace2',
      relativeToNamespace: 'namespace1',
      position: 'before',
      runAction: () => true,
    };
    const config3 = {
      namespace: 'namespace3',
      runAction: () => true,
    };
    const config4 = {
      namespace: 'namespace4',
      relativeToNamespace: 'namespace2',
      position: 'after',
      runAction: () => true,
    };

    context.addShortcut([['control', 'a']], callback, config);
    context.addShortcut([['control', 'a']], callback2, config2);
    context.addShortcut([['control', 'a']], callback3, config3);
    context.addShortcut([['control', 'a']], callback4, config4);

    const shortcuts = context.getShortcuts(['control', 'a']);

    // namespace2, namespace4, namespace1, namespace3
    expect(shortcuts).toEqual([
      { callback: callback2, options: { ...defaultOptions, ...config2 } },
      { callback: callback4, options: { ...defaultOptions, ...config4 } },
      { callback, options: { ...defaultOptions, ...config } },
      { callback: callback3, options: { ...defaultOptions, ...config3 } },
    ]);
  });
});
