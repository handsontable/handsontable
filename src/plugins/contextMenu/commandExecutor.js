import {arrayEach} from './../../helpers/array';
import {hasOwnProperty} from './../../helpers/object';

/**
 * Command executor for ContextMenu.
 *
 * @class CommandExecutor
 * @plugin ContextMenu
 */
class CommandExecutor {
  constructor(hotInstance) {
    this.hot = hotInstance;
    this.commands = {};
    this.defaultCommands = {};
    this.commonCallback = null;
  }

  /**
   * Register command.
   *
   * @param {String} name Command name.
   * @param {Object} commandDescriptor Command descriptor object with properties like `key` (command id),
   *                                   `callback` (task to execute), `name` (command name), `disabled` (command availability).
   */
  registerCommand(name, commandDescriptor) {
    this.commands[name] = commandDescriptor;
  }

  /**
   * Register default command.
   *
   * @param {String} name Command name.
   * @param {Object} commandDescriptor Command descriptor object with properties like `key` (command id),
   *                                   `callback` (task to execute), `name` (command name), `disabled` (command availability).
   */
  registerDefaultCommand(name, commandDescriptor) {
    this.defaultCommands[name] = commandDescriptor;
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
   * @param {String} commandName Command id.
   * @param {*} params Arguments passed to command task.
   */
  execute(commandName, ...params) {
    let commandSplit = commandName.split(':');
    commandName = commandSplit[0];

    let subCommandName = commandSplit.length === 2 ? commandSplit[1] : null;
    let command = this.commands[commandName];
    let defaultCommand = this.defaultCommands[commandName];
    let callbacks = [];

    if (!command && !defaultCommand) {
      throw new Error(`Menu command '${commandName}' not exists.`);
    }

    if (command) {
      if (subCommandName && command.submenu) {
        command = findSubCommand(subCommandName, command.submenu.items);
      }
      if (command.disabled === true) {
        return;
      }
      if (typeof command.disabled == 'function' && command.disabled.call(this.hot) === true) {
        return;
      }
      if (hasOwnProperty(command, 'submenu')) {
        return;
      }
      if (typeof command.callback === 'function') {
        callbacks.push(command.callback);
      }
      if (typeof this.commonCallback === 'function') {
        callbacks.push(this.commonCallback);
      }
    }

    if (defaultCommand) {
      if (defaultCommand.submenu && subCommandName) {
        defaultCommand = findSubCommand(subCommandName, defaultCommand.submenu.items);
      }
      if (!command || command.callback !== defaultCommand.callback) {
        callbacks.push(defaultCommand.callback);
      }
    }

    params.unshift(commandSplit.join(':'));
    arrayEach(callbacks, (callback) => callback.apply(this.hot, params));
  }
}

function findSubCommand(subCommandName, subCommands) {
  let command;

  arrayEach(subCommands, (cmd) => {
    let cmds = cmd.key ? cmd.key.split(':') : null;

    if (Array.isArray(cmds) && cmds[1] === subCommandName) {
      command = cmd;

      return false;
    }
  });

  return command;
}

export default CommandExecutor;
