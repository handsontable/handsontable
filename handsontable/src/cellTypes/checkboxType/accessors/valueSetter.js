import { stringify } from '../../../helpers/mixed';

/**
 * Defines what value is set to a checkbox-typed cell.
 *
 * @param {*} newValue The value to be set.
 * @param {number} row The row index.
 * @param {number} column The column index.
 * @returns {*} The new value to be set.
 */
export function valueSetter(newValue, row, column) {
  const {
    checkedTemplate,
    uncheckedTemplate,
  } = this.getCellMeta(row, column);

  const stringifiedValue = stringify(newValue);
  const isChecked = stringifiedValue === stringify(checkedTemplate);
  const isUnchecked = stringifiedValue === stringify(uncheckedTemplate);

  if (isChecked || isUnchecked) {
    return isChecked ? checkedTemplate : uncheckedTemplate;
  }

  return newValue;
}
