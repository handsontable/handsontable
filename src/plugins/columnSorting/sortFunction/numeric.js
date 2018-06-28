import {isEmpty} from '../../../helpers/mixed';

const DO_NOT_SWAP = 0;
const FIRST_BEFORE_SECOND = -1;
const FIRST_AFTER_SECOND = 1;

/**
 * Numeric sorting algorithm.
 *
 * @param {Boolean} sortOrder Sorting order (`asc` for ascending, `desc` for descending and `none` for initial state).
 * @param {Object} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */
export default function numericSort(sortOrder, columnMeta) {
  const compareFunction = function (value, nextValue) {
    const parsedFirstValue = parseFloat(value[1]);
    const parsedSecondValue = parseFloat(nextValue[1]);

    // Watch out when changing this part of code! Check below returns 0 (as expected) when comparing empty string, null, undefined
    if (parsedFirstValue === parsedSecondValue || (isNaN(parsedFirstValue) && isNaN(parsedSecondValue))) {
      return DO_NOT_SWAP;
    }

    if (columnMeta.columnSorting.sortEmptyCells) {
      if (isEmpty(value[1])) {
        return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
      }

      if (isEmpty(nextValue[1])) {
        return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
      }
    }

    if (isNaN(parsedFirstValue)) {
      return FIRST_AFTER_SECOND;
    }

    if (isNaN(parsedSecondValue)) {
      return FIRST_BEFORE_SECOND;
    }

    if (parsedFirstValue < parsedSecondValue) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;

    } else if (parsedFirstValue > parsedSecondValue) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
    }

    return DO_NOT_SWAP;
  };

  return compareFunction;
}
