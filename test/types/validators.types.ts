import Handsontable from 'handsontable';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});

const cellProperties: Handsontable.CellProperties = { 
  row: 0,
  col: 0,
  instance: {} as Handsontable,
  visualRow: 0,
  visualCol: 0,
  prop: 'foo'
};

const TD = document.createElement('td');

// Verify the built-in validators exist and have the correct signature
Handsontable.validators.AutocompleteValidator.apply(cellProperties, ['foo', (valid: boolean) => {}]);
Handsontable.validators.DateValidator.apply(cellProperties, ['foo', (valid: boolean) => {}]);
Handsontable.validators.DropdownValidator.apply(cellProperties, ['foo', (valid: boolean) => {}]);
Handsontable.validators.NumericValidator.apply(cellProperties, ['foo', (valid: boolean) => {}]);
Handsontable.validators.TimeValidator.apply(cellProperties, ['foo', (valid: boolean) => {}]);

// Verify top-level validators API
Handsontable.validators.getValidator('foo').apply(cellProperties, ['value', (valid: boolean) => {}]);
Handsontable.validators.registerValidator('foo', (value: any, callback: (valid: boolean) => void) => {});
