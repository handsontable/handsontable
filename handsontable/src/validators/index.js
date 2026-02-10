import { autocompleteValidator, VALIDATOR_TYPE as AUTOCOMPLETE_VALIDATOR } from './autocompleteValidator';
import { dateValidator, VALIDATOR_TYPE as DATE_VALIDATOR } from './dateValidator';
import { dropdownValidator, VALIDATOR_TYPE as DROPDOWN_VALIDATOR } from './dropdownValidator';
import { intlDateValidator, VALIDATOR_TYPE as INTL_DATE_VALIDATOR } from './intlDateValidator';
import { intlTimeValidator, VALIDATOR_TYPE as INTL_TIME_VALIDATOR } from './intlTimeValidator';
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
  registerValidator(numericValidator);
  registerValidator(timeValidator);
}

export {
  autocompleteValidator, AUTOCOMPLETE_VALIDATOR,
  dropdownValidator, DROPDOWN_VALIDATOR,
  dateValidator, DATE_VALIDATOR,
  intlDateValidator, INTL_DATE_VALIDATOR,
  intlTimeValidator, INTL_TIME_VALIDATOR,
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
