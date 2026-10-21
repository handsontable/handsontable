import { getCheckboxTemplates, matchCheckboxTemplate } from '../../../utils/checkboxColumn';

/**
 * Defines what value is set to a checkbox-typed cell.
 *
 * @param {*} newValue The value to be set.
 * @param {number} row The row index.
 * @param {number} column The column index.
 * @param {object} [cellMeta] The cell meta (unused; the setter reads the templates itself).
 * @param {string} [source] The change source. An `UndoRedo.*` write is stored verbatim.
 * @returns {*} The new value to be set.
 */
type SetterContext = { getCellMetaTransient: (row: number, col: number) => Record<string, unknown> };

/**
 * Stores the template a written value stands for, so a pasted `'false'`, `'False'`, or `'FALSE'`
 * lands as the `false` the cell displays rather than as a string a backend may read as truthy
 * (DEV-355). The match is the renderer's (`matchCheckboxTemplate()`), including the `true`/`false`
 * defaults for a cell that was never rendered. A value that matches neither template is stored
 * unchanged; the opt-in `checkbox` validator is what flags or rejects it.
 */
export function valueSetter(
  this: SetterContext, newValue: unknown, row: number, column: number, cellMeta?: unknown, source?: string,
): unknown {
  // An `UndoRedo.*` write restores the old value verbatim (the rule in `utils/valueAccessors.ts`):
  // remapping it would store a value the cell never held, such as `false` for a loaded `'False'`.
  if (typeof source === 'string' && source.startsWith('UndoRedo.')) {
    return newValue;
  }

  // The transient read keeps a bulk write over a checkbox column from permanently materializing
  // one meta object per written cell - the setter runs per change and only reads the templates.
  const meta = this.getCellMetaTransient(row, column);
  const state = matchCheckboxTemplate(newValue, meta);

  if (state === null) {
    return newValue;
  }

  const templates = getCheckboxTemplates(meta);

  return state === 'checked' ? templates.checked : templates.unchecked;
}
