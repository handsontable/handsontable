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

    expect(context.hasShortcut(['control', 'a'])).toBeFalse();
    expect(context.hasShortcut(['Control', 'A'])).toBeFalse();
    expect(context.hasShortcut(['a', 'control'])).toBeFalse();
    expect(context.hasShortcut(['A', 'Control'])).toBeFalse();

    context.addShortcut([['control', 'a']], callback, options);

    expect(context.hasShortcut(['control', 'a'])).toBeTrue();
    expect(context.hasShortcut(['Control', 'A'])).toBeTrue();
    expect(context.hasShortcut(['a', 'control'])).toBeTrue();
    expect(context.hasShortcut(['A', 'Control'])).toBeTrue();

    context.addShortcut([['control', 'a']], callback2, options);

    expect(context.hasShortcut(['control', 'a'])).toBeTrue();
    expect(context.hasShortcut(['Control', 'A'])).toBeTrue();
    expect(context.hasShortcut(['a', 'control'])).toBeTrue();
    expect(context.hasShortcut(['A', 'Control'])).toBeTrue();

    context.removeShortcutByVariants([['control', 'a']]);

    expect(context.hasShortcut(['control', 'a'])).toBeFalse();
    expect(context.hasShortcut(['Control', 'A'])).toBeFalse();
    expect(context.hasShortcut(['a', 'control'])).toBeFalse();
    expect(context.hasShortcut(['A', 'Control'])).toBeFalse();
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
    expect(context.hasShortcut(['control', 'b'])).toBeFalse();

    context.removeShortcutByNamespace(options2.namespace);

    expect(context.hasShortcut(['control', 'a'])).toBeFalse();
    expect(context.hasShortcut(['control', 'b'])).toBeFalse();
    expect(context.hasShortcut(['control', 'd'])).toBeFalse();
  });
});
