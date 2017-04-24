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
   * Set common callback which will be trigger on every executed command.
   *
   * @param {Function} callback Function which will be fired on every command execute.
   */
  setCommonCallback(callback) {
    this.commonCallback = callback;
  }

  /**
   * Execute command or command by its name.
   *
   * @param {Object} or {String} command or Command id.
   * @param {*} params Arguments passed to command task.
   */
  execute(command, ...params) {
    if (typeof command === 'string') {
      command = this.findCommand(command);
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
    let callbacks = [];

    if (typeof command.callback === 'function') {
      callbacks.push(command.callback);
    }
    if (typeof this.commonCallback === 'function') {
      callbacks.push(this.commonCallback);
    }
    params.unshift(command.key);
    arrayEach(callbacks, (callback) => callback.apply(this.hot, params));
  }

  findCommand(commandName) {
    let commandSplit = commandName.split(':');
    commandName = commandSplit[0];

    let subCommandName = commandSplit.length > 1 ? commandSplit[commandSplit.length - 1] : null;
    let command = this.commands[commandName];

    if (!command) {
      throw new Error(`Menu command '${commandName}' not exists.`);
    }
    if (subCommandName && command.submenu) {
      let commands = commandSplit.slice(1);
      command = findSubCommand(commands, command.submenu.items, commandSplit.slice(0, 2));
    }

    return command;
  }
}

function findSubCommand(commands, items, keys) {
  let command;
  arrayEach(items, (item) => {
    if (item.key === keys.join(':')) {
      command = item;
      return false;
    }
  });
  if (commands.length > 1) {
    commands.shift();
    keys.push(commands[0]);
    return findSubCommand(commands, command.submenu.items, keys);
  } else {
    return command;
  }
}

export default CommandExecutor;
