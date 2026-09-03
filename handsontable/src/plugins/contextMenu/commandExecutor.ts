import type { HotInstance } from '../../core/types';
import { arrayEach } from '../../helpers/array';
import { throwWithCause } from '../../helpers/errors';
import { hasOwnProperty } from '../../helpers/object';
import { warnOnce } from '../../helpers/console';

interface CommandDescriptor {
  key?: string;
  callback?: Function;
  disabled?: boolean | (() => boolean);
  submenu?: {
    items: CommandDescriptor[];
  };
  [key: string]: unknown;
}

/**
 * Command executor for ContextMenu.
 *
 * @private
 * @class CommandExecutor
 */
export class CommandExecutor {
  /**
   * @type {Core}
   */
  declare hot: HotInstance;
  /**
   * @type {object}
   */
  commands: Record<string, CommandDescriptor> = {};
  /**
   * @type {Function}
   */
  commonCallback: Function | null = null;

  /**
   * Initializes the command executor with a reference to the Handsontable instance.
   */
  constructor(hotInstance: HotInstance) {
    this.hot = hotInstance;
  }

  /**
   * Register command.
   *
   * @param {string} name Command name.
   * @param {object} commandDescriptor Command descriptor object with properties like `key` (command id),
   *                                   `callback` (task to execute), `name` (command name), `disabled` (command availability).
   */
  registerCommand(name: string, commandDescriptor: CommandDescriptor) {
    this.commands[name] = commandDescriptor;
  }

  /**
   * Set common callback which will be trigger on every executed command.
   *
   * @param {Function} callback Function which will be fired on every command execute.
   */
  setCommonCallback(callback: Function) {
    this.commonCallback = callback;
  }

  /**
   * Execute command by its name.
   *
   * @param {string} commandName Command id.
   * @param {*} params Arguments passed to command task.
   */
  execute(commandName: string, ...params: unknown[]) {
    const command = this.#findCommand(commandName);

    // A subcommand name that matches no submenu entry leaves nothing to run.
    if (!command) {
      return;
    }
    if (command.disabled === true) {
      return;
    }
    if (typeof command.disabled === 'function' && command.disabled.call(this.hot) === true) {
      return;
    }
    if (hasOwnProperty(command, 'submenu')) {
      return;
    }
    const callbacks: Function[] = [];

    if (typeof command.callback === 'function') {
      callbacks.push(command.callback);
    }
    if (typeof this.commonCallback === 'function') {
      callbacks.push(this.commonCallback);
    }
    params.unshift(commandName);
    arrayEach(callbacks, callback => callback.apply(this.hot, params));
  }

  /**
   * Resolves a command name to the descriptor that should run.
   *
   * @param {string} commandName Command id, optionally a `parent:child` subcommand name.
   * @returns {object|undefined} The command, or `undefined` when a subcommand name matches no
   *                             entry in its parent's submenu.
   */
  #findCommand(commandName: string): CommandDescriptor | undefined {
    const commandSplit = commandName.split(':');
    const commandNamePrimary = commandSplit[0];
    const subCommandName = commandSplit.length === 2 ? commandSplit[1] : null;

    // The primary name is resolved FIRST so a parent's submenu keeps precedence over a top-level
    // command registered under the same `parent:child` key. Both exist whenever object-form
    // `items` declare the parent and the colon key side by side, and the submenu entry is the one
    // that carries the action — matching the whole name first would hand back the caller's bare
    // entry and silently stop running it.
    if (hasOwnProperty(this.commands, commandNamePrimary)) {
      const command = this.commands[commandNamePrimary];

      if (!subCommandName || !command.submenu) {
        return command;
      }

      const subCommand = findSubCommand(subCommandName, command.submenu.items);

      // Nothing to run. Reported rather than thrown, so a mistyped subcommand is as findable as
      // a mistyped parent (which throws below) without crashing a click handler.
      if (!subCommand) {
        warnOnce(
          this.hot.rootElement,
          `menu-unknown-subcommand:${commandName}`,
          `Handsontable: the menu command "${commandName}" matches no entry in the ` +
          `"${commandNamePrimary}" submenu, so it did nothing.`
        );
      }

      return subCommand;
    }

    // No such parent. A command can still be registered under a key that itself contains a colon,
    // because object-form menu `items` use their key verbatim — matching the whole name here is
    // what stops `{ items: { 'alignment:left': … } }` throwing on click. Reached only where the
    // lookup above used to throw, so it takes nothing away from the split path.
    if (hasOwnProperty(this.commands, commandName)) {
      return this.commands[commandName];
    }

    return throwWithCause(`Menu command '${commandNamePrimary}' not exists.`);
  }
}

/**
 * @param {string} subCommandName The subcommand name.
 * @param {string[]} subCommands The collection of the commands.
 * @returns {boolean}
 */
function findSubCommand(subCommandName: string, subCommands: CommandDescriptor[]) {
  let command: CommandDescriptor | undefined;

  arrayEach(subCommands, (cmd) => {
    const cmds = (cmd as CommandDescriptor).key ? (cmd as CommandDescriptor).key!.split(':') : null;

    if (Array.isArray(cmds) && cmds[1] === subCommandName) {
      command = cmd as CommandDescriptor;

      return false;
    }
  });

  return command;
}
