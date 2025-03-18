const allCommands = [
];

/**
 * Prepares and creates an object with all available commands to trigger.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @returns {object}
 */
export function createKeyboardShortcutCommandsPool(hot) {
  const commands = {};

  allCommands.forEach(({ name, callback }) => {
    commands[name] = (...args) => callback(hot, ...args);
  });

  return commands;
}
