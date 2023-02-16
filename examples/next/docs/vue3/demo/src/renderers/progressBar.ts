import { baseRenderer } from 'handsontable/renderers';
import { getRangeValue } from '../utils';
import { MESSAGE } from '../constants';

const minAllowedValue = 0;
const maxAllowedValue = 100;

export const progressBarRenderer: typeof baseRenderer = (
  instance,
  td,
  row,
  column,
  prop,
  value,
  cellProperties
) => {
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
  
  td.innerHTML = `<div class="progressBar" style="width: ${getRangeValue(value, minAllowedValue, maxAllowedValue)}px"></div>`;
};
