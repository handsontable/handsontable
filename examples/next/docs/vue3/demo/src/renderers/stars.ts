import { baseRenderer } from 'handsontable/renderers';
import { getRangeValue } from '../utils';
import { MESSAGE } from '../constants';

const minAllowedValue = 0;
const maxAllowedValue = 5;

export const starsRenderer: typeof baseRenderer = (...args) => {
  const [
    instance,
    td,
    row,
    column,
    prop,
    value,
    cellProperties
  ] = args;

  baseRenderer(...args);

  let isValid = cellProperties.valid;

  // Run the validator for the cell at initialization.
  if (isValid === void 0) {
    (cellProperties.validator as Function)(value, (isValueValid: boolean) => {
      isValid = isValueValid;
    });
  }

  if (!isValid) {
    td.innerHTML = `<div class="error"> ${MESSAGE?.BAD_VALUE} </div>`;
    
    return;
  }

  td.innerHTML = `<div class="star htCenter">${'★'.repeat(getRangeValue(value, minAllowedValue, maxAllowedValue))}</div>`;
};
