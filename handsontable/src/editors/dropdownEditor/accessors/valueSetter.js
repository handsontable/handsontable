import { valueSetter as autocompleteValueSetter } from '../../autocompleteEditor';

/**
 * Defines what value is set to an dropdown-typed cell.
 *
 * @param {*} newValue The value to be set.
 * @param {number} row The row index.
 * @param {number} col The column index.
 * @returns {*} The new value to be set.
 */
export function valueSetter(newValue, row, col) {
  return autocompleteValueSetter.call(this, newValue, row, col);
}
