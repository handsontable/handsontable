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
  if (!value) {
    value = 0;
  }

  const isValid = /^\d+$/.test(value.toString());
  
  if (!isValid) {
    td.innerHTML = `<div class="error"> ${MESSAGE?.BAD_VALUE} </div>`;
    
    return;
  }
  
  td.innerHTML = `<div class="progressBar" style="width: ${getRangeValue(value, minAllowedValue, maxAllowedValue)}px"></div>`;
};
