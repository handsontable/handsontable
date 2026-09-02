import { CommandExecutor } from 'handsontable/plugins/contextMenu/commandExecutor';

describe('contextMenu/CommandExecutor', () => {
  /** Stands in for the Handsontable instance every callback is applied against. */
  const hot = {};

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

    it('does nothing when the subcommand name matches no submenu entry', () => {
      // Previously this read `disabled` off `undefined` and threw a TypeError.
      const executor = new CommandExecutor(hot);
      const callback = jest.fn();

      executor.registerCommand('alignment', alignmentCommand(callback));

      expect(() => executor.execute('alignment:nonexistent')).not.toThrow();
      expect(callback).not.toHaveBeenCalled();
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
