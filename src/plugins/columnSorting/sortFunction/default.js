import {isEmpty} from '../../../helpers/mixed';

/**
 * Default sorting algorithm.
 *
 * @param {Boolean} sortOrder Sorting order (`asc` for ascending, `desc` for descending and `none` for initial state).
 * @param {Object} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */

const DO_NOT_SWAP = 0;
const FIRST_BEFORE_SECOND = -1;
const FIRST_AFTER_SECOND = 1;

export default function defaultSort(sortOrder, columnMeta) {
  const compareFunction = function (value, nextValue) {
    if (typeof value[1] === 'string') {
      value[1] = value[1].toLowerCase();
    }
    if (typeof nextValue[1] === 'string') {
      nextValue[1] = nextValue[1].toLowerCase();
    }

    if (value[1] === nextValue[1]) {
      return DO_NOT_SWAP;
    }

    if (isEmpty(value[1])) {
      if (isEmpty(nextValue[1])) {
        return DO_NOT_SWAP;
      }

      if (columnMeta.columnSorting.sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
      }

      return FIRST_AFTER_SECOND;
    }

    if (isEmpty(nextValue[1])) {
      if (columnMeta.columnSorting.sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
      }

      return FIRST_BEFORE_SECOND;
    }

    if (isNaN(value[1]) && !isNaN(nextValue[1])) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;

    } else if (!isNaN(value[1]) && isNaN(nextValue[1])) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;

    } else if (!(isNaN(value[1]) || isNaN(nextValue[1]))) {
      value[1] = parseFloat(value[1]);
      nextValue[1] = parseFloat(nextValue[1]);
    }

    if (value[1] < nextValue[1]) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
    }

    if (value[1] > nextValue[1]) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
    }

    return DO_NOT_SWAP;
  };

  return compareFunction;
}
