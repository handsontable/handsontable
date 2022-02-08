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

  it('should give ability to get registered shortcuts', () => {
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

  it('should give ability to remove registered shortcuts by variant', () => {
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

  it('should give ability to check whether there are registered shortcuts', () => {
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

    expect(context.hasShortcut(['control', 'a'])).toBeFalsy();
    expect(context.hasShortcut(['Control', 'A'])).toBeFalsy();
    expect(context.hasShortcut(['a', 'control'])).toBeFalsy();
    expect(context.hasShortcut(['A', 'Control'])).toBeFalsy();

    context.addShortcut([['control', 'a']], callback, options);

    expect(context.hasShortcut(['control', 'a'])).toBeTruthy();
    expect(context.hasShortcut(['Control', 'A'])).toBeTruthy();
    expect(context.hasShortcut(['a', 'control'])).toBeTruthy();
    expect(context.hasShortcut(['A', 'Control'])).toBeTruthy();

    context.addShortcut([['control', 'a']], callback2, options);

    expect(context.hasShortcut(['control', 'a'])).toBeTruthy();
    expect(context.hasShortcut(['Control', 'A'])).toBeTruthy();
    expect(context.hasShortcut(['a', 'control'])).toBeTruthy();
    expect(context.hasShortcut(['A', 'Control'])).toBeTruthy();

    context.removeShortcutByVariants([['control', 'a']]);

    expect(context.hasShortcut(['control', 'a'])).toBeFalsy();
    expect(context.hasShortcut(['Control', 'A'])).toBeFalsy();
    expect(context.hasShortcut(['a', 'control'])).toBeFalsy();
    expect(context.hasShortcut(['A', 'Control'])).toBeFalsy();
  });

  it('should give ability to remove registered shortcuts by namespace', () => {
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
    expect(context.hasShortcut(['control', 'b'])).toBeFalsy();

    context.removeShortcutByNamespace(options2.namespace);

    expect(context.hasShortcut(['control', 'a'])).toBeFalsy();
    expect(context.hasShortcut(['control', 'b'])).toBeFalsy();
    expect(context.hasShortcut(['control', 'd'])).toBeFalsy();
  });
});
