import { validateAgainstSource } from '../autocompleteValidator/autocompleteValidator';
import type { CellProperties } from '../../settings';

export const VALIDATOR_TYPE: 'dropdown' = 'dropdown';

/**
 * The Dropdown cell validator.
 *
 * A dropdown is always strict, so a value must match a `source` entry whatever `strict` value the
 * cell meta carries.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function dropdownValidator(
  this: CellProperties, value: unknown, callback: (valid: boolean) => void): void {
  // Not `this.strict`. The dropdown editor writes `strict: true` only onto the cell it prepares,
  // so reading it here made a `strict: false` column strict only in the cells the user had
  // selected (DEV-2911).
  validateAgainstSource(this, value, callback, true);
}

dropdownValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
