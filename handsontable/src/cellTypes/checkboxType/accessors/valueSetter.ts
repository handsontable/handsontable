import { getCheckboxTemplates, matchCheckboxTemplate } from '../../../utils/checkboxColumn';

/**
 * Defines what value is set to a checkbox-typed cell.
 *
 * @param {*} newValue The value to be set.
 * @param {number} row The row index.
 * @param {number} column The column index.
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
export function valueSetter(this: SetterContext, newValue: unknown, row: number, column: number): unknown {
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
