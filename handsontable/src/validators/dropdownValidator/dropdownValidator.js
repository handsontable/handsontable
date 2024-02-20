import { autocompleteValidator } from '../autocompleteValidator/autocompleteValidator';

export const VALIDATOR_TYPE = 'dropdown';

/**
 * The Dropdown cell validator.
 *
 * @private
 * @param {*} value Value of edited cell.
 * @param {Function} callback Callback called with validation result.
 */
export function dropdownValidator(value, callback) {
  autocompleteValidator.apply(this, [value, callback]);
}

dropdownValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;
