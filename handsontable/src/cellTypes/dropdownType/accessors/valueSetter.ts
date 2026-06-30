import { valueSetter as autocompleteValueSetter } from '../../autocompleteType/accessors';
import type { SetterContext } from '../../autocompleteType/accessors/valueSetter';

/**
 * Defines what value is set to an dropdown-typed cell.
 *
 * @param {*} newValue The value to be set.
 * @param {number} row The row index.
 * @param {number} column The column index.
 * @param {object} cellMeta The cell meta object.
 * @returns {*} The new value to be set.
 */
export function valueSetter(
  this: SetterContext, newValue: unknown, row: number, column: number,
  cellMeta?: Record<string, unknown>): unknown {
  return autocompleteValueSetter.call(this, newValue, row, column);
}
