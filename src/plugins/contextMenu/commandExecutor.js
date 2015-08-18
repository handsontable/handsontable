
import {arrayEach} from './../../helpers/array';

/**
 * @class CommandExecutor
 */
class CommandExecutor {
  constructor(hotInstance) {
    this.hot = hotInstance;
    this.commands = {};
  }

  /**
   * Register command.
   *
   * @param {String} name
   * @param {Object} commandDescriptor
   */
  registerCommand(name, commandDescriptor) {
    this.commands[name] = commandDescriptor;
  }

  /**
   * Execute command by its name.
   *
   * @param {String} commandName
   * @param {*} params
   */
  execute(commandName, ...params) {
    let commandSplit = commandName.split(':');
    commandName = commandSplit[0];

    let subCommandName = commandSplit.length === 2 ? commandSplit[1] : null;
    let command = this.commands[commandName];

    if (!command) {
      throw new Error(`Menu command '${commandName}' not exists.`);
    }
    if (subCommandName && command.submenu) {
      command = findSubCommand(subCommandName, command.submenu.items);
    }
    if (command.disabled === true) {
      return;
    }
    if (typeof command.disabled == 'function' && command.disabled.call(this.hot) === true) {
      return;
    }
    if (command.hasOwnProperty('submenu')) {
      return;
    }
    let callbacks = [];

    if (typeof command.callback === 'function') {
      callbacks.push(command.callback);
    }
    if (typeof this.hot.getSettings().contextMenu.callback === 'function') {
      callbacks.push(this.hot.getSettings().contextMenu.callback);
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

export {CommandExecutor};
