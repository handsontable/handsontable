import { HotInstance, KeyboardShortcutCommand, KeyboardShortcutCommandsPool } from '../types';

const allCommands: KeyboardShortcutCommand[] = [
];

/**
 * Prepares and creates an object with all available commands to trigger.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @returns {object}
 */
export function createKeyboardShortcutCommandsPool(hot: HotInstance): KeyboardShortcutCommandsPool {
  const commands: KeyboardShortcutCommandsPool = {};

  allCommands.forEach(({ name, callback }) => {
    commands[name] = (...args: any[]) => callback(hot, ...args);
  });

  return commands;
}
