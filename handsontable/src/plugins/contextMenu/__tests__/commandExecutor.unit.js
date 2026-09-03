import { CommandExecutor } from 'handsontable/plugins/contextMenu/commandExecutor';

describe('contextMenu/CommandExecutor', () => {
  /**
   * Stands in for the Handsontable instance every callback is applied against. `rootElement` is
   * the scope the "warn once" state binds to, and it must be an object — a real instance always
   * has one. Rebuilt per test so one test's warning cannot silence another's.
   */
  let hot;
  let warnSpy;

  beforeEach(() => {
    hot = { rootElement: {} };
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('a command registered under a key that contains a colon', () => {
    // Object-form menu `items` take their key verbatim, so `{ items: { 'alignment:left': … } }`
    // registers the command under the whole string. `execute()` used to split on `:` first and
    // look up `alignment`, which was never registered — so a click threw
    // `Menu command 'alignment' not exists.` instead of running anything (issue #5027).
    it('is found by its full name instead of throwing', () => {
      const executor = new CommandExecutor(hot);
      const callback = jest.fn();

      executor.registerCommand('alignment:left', { key: 'alignment:left', callback });

      expect(() => executor.execute('alignment:left')).not.toThrow();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('receives its own full name as the first callback argument', () => {
      const executor = new CommandExecutor(hot);
      const callback = jest.fn();

      executor.registerCommand('alignment:left', { key: 'alignment:left', callback });
      executor.execute('alignment:left', 'extra');

      expect(callback).toHaveBeenCalledWith('alignment:left', 'extra');
    });
  });

  describe('a subcommand of a registered parent', () => {
    /**
     * Mirrors how the predefined `alignment` item is shaped: a parent holding its own submenu.
     *
     * @param {Function} callback The submenu entry's callback.
     * @returns {object}
     */
    function alignmentCommand(callback) {
      return {
        key: 'alignment',
        submenu: {
          items: [{ key: 'alignment:left', callback }],
        },
      };
    }

    it('still resolves through the parent when only the parent is registered', () => {
      // The path the documented `executeCommand('alignment:left')` relies on. Matching the full
      // name first must not shadow it — nothing registers `alignment:left` at the top level here.
      const executor = new CommandExecutor(hot);
      const callback = jest.fn();

      executor.registerCommand('alignment', alignmentCommand(callback));
      executor.execute('alignment:left');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('alignment:left');
    });

    it('wins over a top-level command registered under the same colon key', () => {
      // Both can be registered at once: `{ items: { alignment: {}, 'alignment:left': {…} } }`
      // produces a rich `alignment` parent AND a bare top-level `alignment:left`. Resolving the
      // whole name first would hand back the bare entry, whose lack of a callback would silently
      // disable an alignment that used to work. The parent's submenu keeps precedence.
      const executor = new CommandExecutor(hot);
      const submenuCallback = jest.fn();
      const topLevelCallback = jest.fn();

      executor.registerCommand('alignment', alignmentCommand(submenuCallback));
      executor.registerCommand('alignment:left', { key: 'alignment:left', callback: topLevelCallback });
      executor.execute('alignment:left');

      expect(submenuCallback).toHaveBeenCalledTimes(1);
      expect(topLevelCallback).not.toHaveBeenCalled();
    });

    it('does nothing when the subcommand name matches no submenu entry', () => {
      // Previously this read `disabled` off `undefined` and threw a TypeError.
      const executor = new CommandExecutor(hot);
      const callback = jest.fn();

      executor.registerCommand('alignment', alignmentCommand(callback));

      expect(() => executor.execute('alignment:nonexistent')).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
    });

    it('warns about the unmatched subcommand so the typo is findable', () => {
      // A mistyped PARENT throws. Without this, a mistyped CHILD was completely silent — no
      // throw, no output, no return value — which is the worst of the two for debugging.
      const executor = new CommandExecutor(hot);

      executor.registerCommand('alignment', alignmentCommand(jest.fn()));
      executor.execute('alignment:lefft');

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('alignment:lefft');
    });

    it('does not run the parent as a fallback', () => {
      // A parent that owns a submenu is a container, never an action.
      const executor = new CommandExecutor(hot);
      const parentCallback = jest.fn();
      const command = alignmentCommand(jest.fn());

      command.callback = parentCallback;
      executor.registerCommand('alignment', command);
      executor.execute('alignment:nonexistent');

      expect(parentCallback).not.toHaveBeenCalled();
    });
  });

  describe('a command nobody registered', () => {
    it('still reports the missing name', () => {
      const executor = new CommandExecutor(hot);

      expect(() => executor.execute('not_a_command')).toThrow(/not_a_command/);
    });

    it('reports the parent name when a subcommand of an unknown parent is executed', () => {
      const executor = new CommandExecutor(hot);

      expect(() => executor.execute('nothing:here')).toThrow(/'nothing'/);
    });

    it('does not resolve a name inherited from Object.prototype', () => {
      // `commands` is a plain object, so a bare `this.commands[name]` lookup answers `toString`
      // and `constructor` with the inherited member. That has no callback and no own `submenu`,
      // so it slipped past every gate in `execute()` and quietly ran the common callback rather
      // than reporting an unknown command.
      const executor = new CommandExecutor(hot);
      const commonCallback = jest.fn();

      executor.setCommonCallback(commonCallback);

      expect(() => executor.execute('toString')).toThrow(/toString/);
      expect(() => executor.execute('constructor')).toThrow(/constructor/);
      expect(commonCallback).not.toHaveBeenCalled();
    });
  });

  describe('the disabled gate', () => {
    it('skips a command disabled by value, matched by its full name', () => {
      const executor = new CommandExecutor(hot);
      const callback = jest.fn();

      executor.registerCommand('alignment:left', { key: 'alignment:left', callback, disabled: true });
      executor.execute('alignment:left');

      expect(callback).not.toHaveBeenCalled();
    });

    it('skips a command whose disabled function returns true', () => {
      const executor = new CommandExecutor(hot);
      const callback = jest.fn();

      executor.registerCommand('alignment:left', {
        key: 'alignment:left',
        callback,
        disabled: () => true,
      });
      executor.execute('alignment:left');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('the common callback', () => {
    it('runs for a command matched by its full name', () => {
      // The menu closes through this callback, so a command found on the new exact-match path
      // must not bypass it.
      const executor = new CommandExecutor(hot);
      const commonCallback = jest.fn();

      executor.registerCommand('alignment:left', { key: 'alignment:left' });
      executor.setCommonCallback(commonCallback);
      executor.execute('alignment:left');

      expect(commonCallback).toHaveBeenCalledWith('alignment:left');
    });
  });
});
