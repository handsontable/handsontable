import {
  BaseValidator,
  autocompleteValidator,
  dateValidator,
  numericValidator,
  timeValidator,

  getValidator,
  registerAllValidators,
  registerValidator,
} from 'handsontable/validators';

registerAllValidators();

registerValidator(autocompleteValidator);
registerValidator(dateValidator);
registerValidator(numericValidator);
registerValidator(timeValidator);
registerValidator('custom', (value, callback) => {
  callback(true);
});

const autocomplete: BaseValidator = getValidator('autocomplete');
const date: BaseValidator = getValidator('date');
const numeric: BaseValidator = getValidator('numeric');
const time: BaseValidator = getValidator('time');
const custom: BaseValidator = getValidator('custom');
