import { isObject } from '../../../helpers/object';

/**
 * Defines the value being displayed in an autocomplete-typed cells.
 *
 * @param {*} value The value to be displayed.
 * @returns {*} The final value of the cell.
 */
export function valueGetter(value) {
  // return value?.key ?? value;
  return isObject(value) && value.value !== undefined ? value.value : value;
}
