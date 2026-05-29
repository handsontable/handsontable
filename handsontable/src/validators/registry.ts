import { staticRegister } from '../utils/staticRegister';
import { throwWithCause } from '../helpers/errors';
import type { VALIDATOR_TYPE as AUTOCOMPLETE_VALIDATOR } from './autocompleteValidator';
import type { VALIDATOR_TYPE as DATE_VALIDATOR } from './dateValidator';
import type { VALIDATOR_TYPE as DROPDOWN_VALIDATOR } from './dropdownValidator';
import type { VALIDATOR_TYPE as INTL_DATE_VALIDATOR } from './intlDateValidator';
import type { VALIDATOR_TYPE as INTL_TIME_VALIDATOR } from './intlTimeValidator';
import type { VALIDATOR_TYPE as MULTI_SELECT_VALIDATOR } from './multiSelectValidator';
import type { VALIDATOR_TYPE as NUMERIC_VALIDATOR } from './numericValidator';
import type { VALIDATOR_TYPE as TIME_VALIDATOR } from './timeValidator';

const {
  register,
  getItem,
  hasItem,
  getNames,
  getValues,
} = staticRegister('validators');

/**
 * Retrieve validator function.
 *
 * @param {string} name Validator identification.
 * @returns {Function} Returns validator function.
 */
function _getItem(name: string | Function): Function {
  if (typeof name === 'function') {
    return name;
  }
  if (!hasItem(name)) {
    throwWithCause(`No registered validator found under "${name}" name`);
  }

  return getItem(name) as Function;
}

/**
 * Register validator under its alias.
 *
 * @param {string|Function} name Validator's alias or validator function with its descriptor.
 * @param {Function} [validator] Validator function.
 */
function _register(name: string | (Function & { VALIDATOR_TYPE: string }), validator?: Function): void {
  if (typeof name !== 'string') {
    validator = name;
    name = name.VALIDATOR_TYPE;
  }

  register(name, validator);
}

export {
  _register as registerValidator,
  _getItem as getValidator,
  hasItem as hasValidator,
  getNames as getRegisteredValidatorNames,
  getValues as getRegisteredValidators,
};

/**
 * All built-in validator type names.
 */
export type ValidatorType = typeof AUTOCOMPLETE_VALIDATOR | typeof DATE_VALIDATOR | typeof DROPDOWN_VALIDATOR |
  typeof INTL_DATE_VALIDATOR | typeof INTL_TIME_VALIDATOR | typeof MULTI_SELECT_VALIDATOR |
  typeof NUMERIC_VALIDATOR | typeof TIME_VALIDATOR | string;
