import { isNumericLike, getParsedNumber } from '../../../helpers/number';
import { isNullish } from '../../../dataMap/metaManager/utils';

/**
 * Defines what value is set to a numeric-typed cell.
 *
 * @param {*} newValue The value to be set.
 * @param {number} row The row index.
 * @param {number} col The column index.
 * @returns {*} The new value to be set.
 */
export function valueSetter(newValue, row, col) {
  if (
    typeof newValue === 'string' &&
    isNumericLike(newValue)
  ) {
    const parsedNumber = getParsedNumber(newValue);

    return isNullish(parsedNumber) ? newValue : parsedNumber;
  }

  return newValue;
}
