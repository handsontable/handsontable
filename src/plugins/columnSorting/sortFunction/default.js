import {isEmpty} from '../../../helpers/mixed';
import {DO_NOT_SWAP, FIRST_BEFORE_SECOND, FIRST_AFTER_SECOND} from '../utils';

/**
 * Default sorting algorithm.
 *
 * @param {String} sortOrder Sorting order (`asc` for ascending, `desc` for descending and `none` for initial state).
 * @param {Object} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */
export default function defaultSort(sortOrder, columnMeta) {
  // We are soring array of arrays. Single array is in form [rowIndex, ...value]. We compare just values, stored at second index of array.
  return function ([, value], [, nextValue]) {
    const sortEmptyCells = columnMeta.columnSorting.sortEmptyCells;

    if (typeof value === 'string') {
      value = value.toLowerCase();
    }

    if (typeof nextValue === 'string') {
      nextValue = nextValue.toLowerCase();
    }

    if (value === nextValue) {
      return DO_NOT_SWAP;
    }

    if (isEmpty(value)) {
      if (isEmpty(nextValue)) {
        // Two empty values
        return DO_NOT_SWAP;
      }

      // Just fist value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
      }

      return FIRST_AFTER_SECOND;
    }

    if (isEmpty(nextValue)) {
      // Just second value is empty and `sortEmptyCells` option was set
      if (sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
      }

      return FIRST_BEFORE_SECOND;
    }

    if (isNaN(value) && !isNaN(nextValue)) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;

    } else if (!isNaN(value) && isNaN(nextValue)) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;

    } else if (!(isNaN(value) || isNaN(nextValue))) {
      value = parseFloat(value);
      nextValue = parseFloat(nextValue);
    }

    if (value < nextValue) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
    }

    if (value > nextValue) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
    }

    return DO_NOT_SWAP;
  };
}
