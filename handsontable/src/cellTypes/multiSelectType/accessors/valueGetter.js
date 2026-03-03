import { isKeyValueObject } from '../../../helpers/object';
import { arrayToString } from '../../../helpers/array';

/**
 * Defines the value being displayed in an multiSelect-typed cells.
 *
 * @param {*} value The value to be displayed.
 * @returns {*} The final value of the cell.
 */
export function valueGetter(value) {
  if (Array.isArray(value)) {
    return arrayToString(value.map((val) => {
      return isKeyValueObject(val) ? val.value : val;
    }), ', ');
  }

  return value;
}
