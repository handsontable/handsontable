import { isObject } from '../../../helpers/object';
import { isJSON } from '../../../helpers/string';
import { arrayToString } from '../../../helpers/array';

/**
 * Defines the value being displayed in an multiSelect-typed cells.
 *
 * @param {*} value The value to be displayed.
 * @returns {*} The final value of the cell.
 */
export function valueGetter(value) {
  if (isJSON(value)) {
    const parsedValue = JSON.parse(value);

    if (Array.isArray(parsedValue)) {
      value = arrayToString(parsedValue, ', ');
    }
  }

  return isObject(value) && value.value !== undefined ? value.value : value;
}
