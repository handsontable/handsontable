import { autocompleteValidator, VALIDATOR_TYPE as AUTOCOMPLETE_VALIDATOR } from './autocompleteValidator';
import { dateValidator, VALIDATOR_TYPE as DATE_VALIDATOR } from './dateValidator';
import { numericValidator, VALIDATOR_TYPE as NUMERIC_VALIDATOR } from './numericValidator';
import { timeValidator, VALIDATOR_TYPE as TIME_VALIDATOR } from './timeValidator';

export function registerAllValidators(): void;

export interface Validators {
  autocomplete: typeof autocompleteValidator;
  date: typeof dateValidator;
  numeric: typeof numericValidator;
  time: typeof timeValidator;
}

/**
 * The default validator aliases the table has built-in.
 */
export type ValidatorType = keyof Validators;

export {
  autocompleteValidator, AUTOCOMPLETE_VALIDATOR,
  dateValidator, DATE_VALIDATOR,
  numericValidator, NUMERIC_VALIDATOR,
  timeValidator, TIME_VALIDATOR
};
export {
  getRegisteredValidatorNames,
  getRegisteredValidators,
  getValidator,
  hasValidator,
  registerValidator
} from './registry';
export { BaseValidator } from './base';
