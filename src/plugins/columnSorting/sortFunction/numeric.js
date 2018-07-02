import {isEmpty} from '../../../helpers/mixed';
import {DO_NOT_SWAP, FIRST_BEFORE_SECOND, FIRST_AFTER_SECOND} from '../utils';

/**
 * Numeric sorting algorithm.
 *
 * @param {String} sortOrder Sorting order (`asc` for ascending, `desc` for descending and `none` for initial state).
 * @param {Object} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */
export default function numericSort(sortOrder, columnMeta) {
  // We are soring array of arrays. Single array is in form [rowIndex, ...value]. We compare just values, stored at second index of array.
  return function ([, value], [, nextValue]) {
    const sortEmptyCells = columnMeta.columnSorting.sortEmptyCells;
    const parsedFirstValue = parseFloat(value);
    const parsedSecondValue = parseFloat(nextValue);

    // Watch out when changing this part of code! Check below returns 0 (as expected) when comparing empty string, null, undefined
    if (parsedFirstValue === parsedSecondValue || (isNaN(parsedFirstValue) && isNaN(parsedSecondValue))) {
      return DO_NOT_SWAP;
    }

    if (sortEmptyCells) {
      if (isEmpty(value)) {
        return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
      }

      if (isEmpty(nextValue)) {
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
}
