import { isKeyValueObject } from '../../../helpers/object';
import { isEmpty } from '../../../helpers/mixed';
import { findChoiceByDisplayedValue } from '../../../helpers/cellSource';
import type { CellProperties } from '../../../settings';

/**
 * The slice of the grid instance the setter reads while resolving a value.
 */
export type SetterContext = {
  getSourceDataAtCell: (row: number, col: number) => unknown;
  toPhysicalRow: (row: number) => number;
  toPhysicalColumn: (col: number) => number;
};

/**
 * The cell meta fields the setter reads. Derived from `CellProperties` so the two cannot drift,
 * and narrowed to these two so a caller need not build a whole meta object.
 */
export type ChoiceMeta = Pick<CellProperties, 'source' | 'allowHtml'>;

/**
 * Defines what value is set to an autocomplete-typed cell.
 *
 * A cell whose `source` holds key/value entries stores the entry itself, not the label shown for
 * it. The editor resolves typed text into that entry, so text arriving any other way is resolved
 * here the same way - through `findChoiceByDisplayedValue()`, the one rule both paths share.
 * Without it, a label that came from a `text/plain` paste (which is what
 * <kbd>Cmd/Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> and any paste from another application deliver)
 * or from `setDataAtCell()` was stored as a bare string among objects, and a `strict` column then
 * marked it invalid (DEV-57).
 *
 * @param {*} newValue The value to be set.
 * @param {number} row The visual row index.
 * @param {number} column The visual column index.
 * @param {object} [cellMeta] The cell meta object.
 * @returns {*} The new value to be set.
 */
export function valueSetter(
  this: SetterContext, newValue: unknown, row: number, column: number, cellMeta?: ChoiceMeta): unknown {
  if (isKeyValueObject(newValue)) {
    return newValue;
  }

  // An emptied cell must stay empty. Resolving it would let a source entry that carries an empty
  // label stand in for "no value", which `allowEmpty` and the validator's own empty check read
  // differently.
  if (!isEmpty(newValue)) {
    const matchedChoice = findChoiceByDisplayedValue(cellMeta?.source, newValue, cellMeta?.allowHtml === true);

    if (isKeyValueObject(matchedChoice)) {
      return matchedChoice;
    }
  }

  const sourceDataAtCell = this.getSourceDataAtCell(this.toPhysicalRow(row), this.toPhysicalColumn(column));

  if (isKeyValueObject(sourceDataAtCell)) {
    return { key: newValue, value: newValue };
  }

  return newValue;
}
