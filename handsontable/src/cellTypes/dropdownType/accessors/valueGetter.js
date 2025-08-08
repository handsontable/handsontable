import { valueGetter as autocompleteValueGetter } from '../../autocompleteType/accessors';

/**
 * Defines the value being displayed in an dropdown-typed cells.
 *
 * @param {*} value The value to be displayed.
 * @returns {*} The final value of the cell.
 */
export function valueGetter(value) {
  return autocompleteValueGetter.call(this, value);
}
