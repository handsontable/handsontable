import { stringify } from '../../../helpers/mixed';

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
 *
 */
export function valueSetter(this: SetterContext, newValue: unknown, row: number, column: number): unknown {
  // The transient read keeps a bulk write over a checkbox column from permanently materializing
  // one meta object per written cell - the setter runs per change and only reads the templates.
  const { checkedTemplate, uncheckedTemplate } = this.getCellMetaTransient(row, column);

  const stringifiedValue = stringify(newValue);
  const isChecked = stringifiedValue === stringify(checkedTemplate);
  const isUnchecked = stringifiedValue === stringify(uncheckedTemplate);

  if (isChecked || isUnchecked) {
    return isChecked ? checkedTemplate : uncheckedTemplate;
  }

  return newValue;
}
