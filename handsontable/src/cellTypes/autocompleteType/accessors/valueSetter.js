import { isObject } from '../../../helpers/object';
import { isDefined } from '../../../helpers/mixed';

/**
 * Defines what value is set to an autocomplete-typed cell.
 *
 * @param {*} newValue The value to be set.
 * @param {number} row The row index.
 * @param {number} column The column index.
 * @returns {*} The new value to be set.
 */
export function valueSetter(newValue, row, column) {
  const sourceDataAtCell = this.getSourceDataAtCell(row, column);
  const isKeyValueObject = obj => isObject(obj) && isDefined(obj.key) && isDefined(obj.value);

  if (isKeyValueObject(sourceDataAtCell)) {
    return isKeyValueObject(newValue) ? newValue : { key: newValue, value: newValue };

  } else {
    return newValue;
  }
}
