import { isEmpty } from '../../../helpers/mixed';
import { findChoiceByDisplayedValue, hasKeyValueChoices, isKeyValueEntry } from '../../../utils/cellSource';
import type { CellProperties, ChangeSource } from '../../../settings';

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
 * @param {string} [source] The change source, so an undo or redo can be recognized.
 * @returns {*} The new value to be set.
 */
export function valueSetter(
  this: SetterContext, newValue: unknown, row: number, column: number,
  cellMeta?: ChoiceMeta, source?: ChangeSource): unknown {
  if (isKeyValueEntry(newValue)) {
    return newValue;
  }

  // Undo and redo restore what the cell held before, verbatim - the invariant
  // `utils/valueAccessors.ts` states, and honors for `emptyValue`. This setter did not: whenever
  // the cell happened to hold an entry, it wrapped the restored label as `{ key: <label>, value:
  // <label> }`, so undoing back to a plain label produced a fabricated pair that a `strict` column
  // then rejected. Neither branch below may run on that path.
  if (typeof source === 'string' && source.startsWith('UndoRedo.')) {
    return newValue;
  }

  // An emptied cell has to stay empty: resolving it would let a source entry carrying an empty
  // label stand in for "no value", which `allowEmpty` and the validator's own empty check read
  // differently. And a source with no key/value entries has nothing to resolve to, so it must not
  // pay for the scan - that is the common configuration, and `hasKeyValueChoices()` answers it
  // without touching a single character of any label.
  if (!isEmpty(newValue) && hasKeyValueChoices(cellMeta?.source)) {
    const matchedChoice = findChoiceByDisplayedValue(cellMeta?.source, newValue, cellMeta?.allowHtml === true);

    if (isKeyValueEntry(matchedChoice)) {
      return matchedChoice;
    }
  }

  const sourceDataAtCell = this.getSourceDataAtCell(this.toPhysicalRow(row), this.toPhysicalColumn(column));

  // The same `isEmpty` gate as above, for the same reason. Clearing a cell that held an entry used
  // to wrap the blank as `{ key: null, value: null }`, which is an object rather than an empty cell:
  // `getSourceData()` handed it back for a cell the user had emptied, and `emptyValue` never ran at
  // all, because `utils/valueAccessors.ts` applies that only to an `''` this setter returns.
  if (!isEmpty(newValue) && isKeyValueEntry(sourceDataAtCell)) {
    return { key: newValue, value: newValue };
  }

  return newValue;
}
