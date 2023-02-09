import { baseRenderer } from 'handsontable/renderers';
import { getRangeValue } from '../utils';
import { MESSAGE } from '../constants';

const minAllowedValue = 0;
const maxAllowedValue = 5;

export const starsRenderer: typeof baseRenderer = function(
  instance,
  td,
  row,
  column,
  prop,
  value,
  cellProperties
) {
  if (!value) {
    value = 0;
  }

  const isValid = /^\d+$/.test(value.toString());

  if (!isValid) {
    td.innerHTML = `<div class="error"> ${MESSAGE?.BAD_VALUE} </div>`;
    
    return;
  }

  td.innerHTML = `<div class="star htCenter">${'★'.repeat(getRangeValue(value, minAllowedValue, maxAllowedValue))}</div>`;
};
