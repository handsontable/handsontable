import { arrayEach } from '../../helpers/array';
import { hasOwnProperty } from '../../helpers/object';

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
  hot;
  /**
   * @type {object}
   */
  commands = {};
  /**
   * @type {Function}
   */
  commonCallback = null;

  constructor(hotInstance) {
    this.hot = hotInstance;
  }

  /**
   * Register command.
   *
   * @param {string} name Command name.
   * @param {object} commandDescriptor Command descriptor object with properties like `key` (command id),
   *                                   `callback` (task to execute), `name` (command name), `disabled` (command availability).
   */
  registerCommand(name, commandDescriptor) {
    this.commands[name] = commandDescriptor;
  }

  /**
   * Set common callback which will be trigger on every executed command.
   *
   * @param {Function} callback Function which will be fired on every command execute.
   */
  setCommonCallback(callback) {
    this.commonCallback = callback;
  }

  /**
   * Execute command by its name.
   *
   * @param {string} commandName Command id.
   * @param {*} params Arguments passed to command task.
   */
  execute(commandName, ...params) {
    const commandSplit = commandName.split(':');
    const commandNamePrimary = commandSplit[0];

    const subCommandName = commandSplit.length === 2 ? commandSplit[1] : null;
    let command = this.commands[commandNamePrimary];

    if (!command) {
      throw new Error(`Menu command '${commandNamePrimary}' not exists.`, { cause: { handsontable: true } });
    }
    if (subCommandName && command.submenu) {
      command = findSubCommand(subCommandName, command.submenu.items);
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
    const callbacks = [];

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
function findSubCommand(subCommandName, subCommands) {
  let command;

  arrayEach(subCommands, (cmd) => {
    const cmds = cmd.key ? cmd.key.split(':') : null;

    if (Array.isArray(cmds) && cmds[1] === subCommandName) {
      command = cmd;

      return false;
    }
  });

  return command;
}
