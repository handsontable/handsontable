import { isPlainObject } from '../../../helpers/object';
import { getChoiceLabel } from '../../../utils/cellSource';
import type { CellProperties } from '../../../settings';

/**
 * Defines the value being displayed in an autocomplete-typed cells.
 *
 * A key/value entry displays its `value` half. When that half is an object, the cell's
 * `sourceLabel` option derives the label from it; the stored entry itself is left untouched.
 *
 * @param {*} value The value to be displayed.
 * @param {number} [row] The visual row index.
 * @param {number} [column] The visual column index.
 * @param {object} [cellMeta] The cell meta object, which carries `sourceLabel`.
 * @returns {*} The final value of the cell.
 */
export function valueGetter(
  value: unknown, row?: number, column?: number, cellMeta?: Pick<CellProperties, 'sourceLabel'>): unknown {
  // Deliberately looser than `isKeyValueEntry()`: an entry carrying only `value` still renders as
  // that value, which is behavior this accessor has always had. The write path is stricter - it
  // resolves a label only against an entry that also carries a `key` - so a `{ value }`-only source
  // renders its label but stores it as a bare string. Aligning the two is a behavior change on an
  // undocumented source shape, so it is left alone here rather than made stricter (DEV-57 review).
  return isPlainObject(value) && value.value !== undefined
    ? getChoiceLabel(value.value, cellMeta?.sourceLabel)
    : value;
}
