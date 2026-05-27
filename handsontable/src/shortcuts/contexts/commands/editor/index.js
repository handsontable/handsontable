import { command as closeAndSave } from './closeAndSave';
import { command as closeAndSaveByArrowKeys } from './closeAndSaveByArrowKeys';
import { command as closeAndSaveByEnter } from './closeAndSaveByEnter';
import { command as closeWithoutSaving } from './closeWithoutSaving';
import { command as fastOpen } from './fastOpen';
import { command as open } from './open';

/**
 * Returns complete list of the shortcut commands for the cells editing feature.
 *
 * @returns {Function[]}
 */
export function getAllCommands() {
  return [
    closeAndSave,
    closeAndSaveByArrowKeys,
    closeAndSaveByEnter,
    closeWithoutSaving,
    fastOpen,
    open,
  ];
}
