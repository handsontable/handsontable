import { command as closeAndSave } from './closeAndSave';
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
    closeWithoutSaving,
    fastOpen,
    open,
  ];
}
