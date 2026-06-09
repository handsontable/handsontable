import Handsontable from 'handsontable';
import {
  autocompleteValidator,
  dropdownValidator,
  dateValidator,
  numericValidator,
  timeValidator,
  registerValidator,
  getValidator,
} from 'handsontable/validators';

const elem = document.createElement('div');
const hot = Handsontable(elem, {});

const cellProperties: Handsontable.CellProperties = {
  row: 0,
  col: 0,
  instance: hot,
  visualRow: 0,
  visualCol: 0,
  prop: 'foo'
};

// Verify the built-in validators exist and have the correct signature
autocompleteValidator.apply(cellProperties, ['foo', (valid: boolean) => {}]);
dropdownValidator.apply(cellProperties, ['foo', (valid: boolean) => {}]);
dateValidator.apply(cellProperties as any, ['foo', (valid: boolean) => {}]);
numericValidator.apply(cellProperties, ['foo', (valid: boolean) => {}]);
timeValidator.apply(cellProperties, ['foo', (valid: boolean) => {}]);

// Verify top-level validators API
getValidator('foo').apply(cellProperties, ['value', (valid: boolean) => {}]);
registerValidator('foo', (value: unknown, callback: (valid: boolean) => void) => {});
