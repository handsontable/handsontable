import type { HotInstance } from '../../../core/types';
import { getAllCommands as getAllEditorCommands } from './editor';
import { getAllCommands as getAllSelectionExtendCommands } from './extendCellsSelection';
import { getAllCommands as getAllSelectionMoveCommands } from './moveCellSelection';
import { command as emptySelectedCells } from './emptySelectedCells';
import { command as scrollToFocusedCell } from './scrollToFocusedCell';
import { command as selectAllCells } from './selectAllCells';
import { command as selectAllCellsAndHeaders } from './selectAllCellsAndHeaders';
import { command as populateSelectedCellsData } from './populateSelectedCellsData';
import { command as tabNavigation } from './tabNavigation';

const allCommands = [
  ...getAllEditorCommands(),
  ...getAllSelectionExtendCommands(),
  ...getAllSelectionMoveCommands(),
  emptySelectedCells,
  scrollToFocusedCell,
  selectAllCells,
  selectAllCellsAndHeaders,
  populateSelectedCellsData,
  tabNavigation,
];

/**
 * Prepares and creates an object with all available commands to trigger.
 *
 * @param {Handsontable} hot The Handsontable instance.
 * @returns {object}
 */
export function createKeyboardShortcutCommandsPool(hot: HotInstance) {
  const commands: Record<string, (...args: unknown[]) => unknown> = {};

  allCommands.forEach(({ name, callback }) => {
    type CbFn = (hot: HotInstance, ...args: unknown[]) => unknown;
    commands[name] = (...args: unknown[]) => (callback as CbFn)(hot, ...args);
  });

  return commands;
}
