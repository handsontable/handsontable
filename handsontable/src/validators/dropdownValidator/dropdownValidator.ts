import { autocompleteValidator } from '../autocompleteValidator/autocompleteValidator';
import type { CellProperties } from '../../settings';

export const VALIDATOR_TYPE: 'dropdown' = 'dropdown';

/**
 * The Dropdown cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function dropdownValidator(
  this: CellProperties, value: unknown, callback: (valid: boolean) => void): void {
  autocompleteValidator.apply(this, [value, callback]);
}

dropdownValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
