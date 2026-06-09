import { autocompleteValidator, VALIDATOR_TYPE as AUTOCOMPLETE_VALIDATOR } from './autocompleteValidator';
import { dateValidator, VALIDATOR_TYPE as DATE_VALIDATOR } from './dateValidator';
import { dropdownValidator, VALIDATOR_TYPE as DROPDOWN_VALIDATOR } from './dropdownValidator';
import { intlDateValidator, VALIDATOR_TYPE as INTL_DATE_VALIDATOR } from './intlDateValidator';
import { intlTimeValidator, VALIDATOR_TYPE as INTL_TIME_VALIDATOR } from './intlTimeValidator';
import { multiSelectValidator, VALIDATOR_TYPE as MULTISELECT_VALIDATOR } from './multiSelectValidator';
import { numericValidator, VALIDATOR_TYPE as NUMERIC_VALIDATOR } from './numericValidator';
import { timeValidator, VALIDATOR_TYPE as TIME_VALIDATOR } from './timeValidator';
import {
  registerValidator,
} from './registry';

/**
 * Registers all available validators.
 */
export function registerAllValidators() {
  registerValidator(autocompleteValidator);
  registerValidator(dropdownValidator);
  registerValidator(dateValidator);
  registerValidator(intlDateValidator);
  registerValidator(intlTimeValidator);
  registerValidator(multiSelectValidator);
  registerValidator(numericValidator);
  registerValidator(timeValidator);
}

export {
  autocompleteValidator, AUTOCOMPLETE_VALIDATOR,
  dropdownValidator, DROPDOWN_VALIDATOR,
  dateValidator, DATE_VALIDATOR,
  intlDateValidator, INTL_DATE_VALIDATOR,
  intlTimeValidator, INTL_TIME_VALIDATOR,
  multiSelectValidator, MULTISELECT_VALIDATOR,
  numericValidator, NUMERIC_VALIDATOR,
  timeValidator, TIME_VALIDATOR,
};

export {
  getRegisteredValidatorNames,
  getRegisteredValidators,
  getValidator,
  hasValidator,
  registerValidator,
} from './registry';

/**
 * All built-in validator type names.
 */
export type ValidatorType = typeof AUTOCOMPLETE_VALIDATOR | typeof DATE_VALIDATOR | typeof DROPDOWN_VALIDATOR |
  typeof INTL_DATE_VALIDATOR | typeof INTL_TIME_VALIDATOR | typeof MULTISELECT_VALIDATOR |
  typeof NUMERIC_VALIDATOR | typeof TIME_VALIDATOR | string;
