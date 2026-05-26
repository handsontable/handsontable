import type { HotInstance } from '../../core/types';
import { arrayEach } from '../../helpers/array';
import { throwWithCause } from '../../helpers/errors';
import { hasOwnProperty } from '../../helpers/object';

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
    const commandSplit = commandName.split(':');
    const commandNamePrimary = commandSplit[0];

    const subCommandName = commandSplit.length === 2 ? commandSplit[1] : null;
    let command = this.commands[commandNamePrimary];

    if (!command) {
      throwWithCause(`Menu command '${commandNamePrimary}' not exists.`);
    }
    if (subCommandName && command.submenu) {
      command = findSubCommand(subCommandName, command.submenu.items)!;
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
    params.unshift(commandSplit.join(':'));
    arrayEach(callbacks, callback => callback.apply(this.hot, params));
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
