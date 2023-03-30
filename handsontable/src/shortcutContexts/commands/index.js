import { getAllCommands as getAllSelectionExtendCommands } from './extendCellsSelection';
import { getAllCommands as getAllSelectionMoveCommands } from './moveCellSelection';
import { command as selectAll } from './selectAll';
import { command as populateSelectedCellsData } from './populateSelectedCellsData';

const allCommands = [
  ...getAllSelectionExtendCommands(),
  ...getAllSelectionMoveCommands(),
  selectAll,
  populateSelectedCellsData,
];

/**
 * Prepares and creates an object with all available commands to trigger.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @returns {object}
 */
export function createShortcutsCommand(hot) {
  const commands = {};

  allCommands.forEach(({ name, callback }) => {
    commands[name] = (...args) => callback(hot, ...args);
  });

  return commands;
}
