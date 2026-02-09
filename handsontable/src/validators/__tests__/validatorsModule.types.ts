import {
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
registerValidator('custom', (value: unknown, callback: (valid: boolean) => void) => {
  callback(true);
});

const autocomplete: Function = getValidator('autocomplete');
const date: Function = getValidator('date');
const numeric: Function = getValidator('numeric');
const time: Function = getValidator('time');
const custom: Function = getValidator('custom');
