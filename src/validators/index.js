export { autocompleteValidator, VALIDATOR_TYPE as AUTOCOMPLETE_VALIDATOR } from './autocompleteValidator';
export { dateValidator, VALIDATOR_TYPE as DATE_VALIDATOR } from './dateValidator';
export { numericValidator, VALIDATOR_TYPE as NUMERIC_VALIDATOR } from './numericValidator';
export { timeValidator, VALIDATOR_TYPE as TIME_VALIDATOR } from './timeValidator';

export {
  getRegisteredValidatorNames,
  getRegisteredValidators,
  getValidator,
  hasValidator,
  registerValidator,
} from './registry';
