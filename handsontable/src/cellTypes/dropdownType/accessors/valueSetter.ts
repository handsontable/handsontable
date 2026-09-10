import { valueSetter as autocompleteValueSetter } from '../../autocompleteType/accessors';
import type { ChoiceMeta, SetterContext } from '../../autocompleteType/accessors/valueSetter';

/**
 * Defines what value is set to an dropdown-typed cell.
 *
 * `cellMeta` is forwarded, not dropped: the autocomplete setter reads `source` from it to resolve a
 * bare label into the key/value entry it belongs to, and a dropdown is `strict` by default, so
 * losing it would leave every plain-text paste invalid (DEV-57).
 *
 * @param {*} newValue The value to be set.
 * @param {number} row The row index.
 * @param {number} column The column index.
 * @param {object} [cellMeta] The cell meta object.
 * @returns {*} The new value to be set.
 */
export function valueSetter(
  this: SetterContext, newValue: unknown, row: number, column: number,
  cellMeta?: ChoiceMeta): unknown {
  return autocompleteValueSetter.call(this, newValue, row, column, cellMeta);
}
