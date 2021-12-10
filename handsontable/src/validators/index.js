import { autocompleteValidator, VALIDATOR_TYPE as AUTOCOMPLETE_VALIDATOR } from './autocompleteValidator';
import { dateValidator, VALIDATOR_TYPE as DATE_VALIDATOR } from './dateValidator';
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
  registerValidator(dateValidator);
  registerValidator(numericValidator);
  registerValidator(timeValidator);
}

export {
  autocompleteValidator, AUTOCOMPLETE_VALIDATOR,
  dateValidator, DATE_VALIDATOR,
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
