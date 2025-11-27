import { isKeyValueObject } from '../../../helpers/object';
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
    const parsedValue = JSON.parse(value).map(value => isKeyValueObject(value) ? value.value : value);

    if (Array.isArray(parsedValue)) {
      value = arrayToString(parsedValue, ', ');
    }
  }

  return isKeyValueObject(value) && value.value !== undefined ? value.value : value;
}
