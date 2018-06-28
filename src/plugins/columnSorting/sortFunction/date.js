import moment from 'moment';
import {isEmpty} from '../../../helpers/mixed';

const DO_NOT_SWAP = 0;
const FIRST_BEFORE_SECOND = -1;
const FIRST_AFTER_SECOND = 1;

/**
 * Date sorting algorithm
 *
 * @param {Boolean} sortOrder Sorting order (`asc` for ascending, `desc` for descending and `none` for initial state).
 * @param {Object} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */
export default function dateSort(sortOrder, columnMeta) {
  const compareFunction = function (value, nextValue) {
    if (value[1] === nextValue[1]) {
      return DO_NOT_SWAP;
    }

    if (isEmpty(value[1])) {
      if (isEmpty(nextValue[1])) {
        // Two empty values
        return DO_NOT_SWAP;
      }

      // Just fist value is empty and `sortEmptyCells` option set
      if (columnMeta.columnSorting.sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
      }

      return FIRST_AFTER_SECOND;
    }

    if (isEmpty(nextValue[1])) {
      // Just second value is empty and `sortEmptyCells` option set
      if (columnMeta.columnSorting.sortEmptyCells) {
        return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
      }

      return FIRST_BEFORE_SECOND;
    }

    const firstDate = moment(value[1], columnMeta.dateFormat);
    const nextDate = moment(nextValue[1], columnMeta.dateFormat);

    if (!firstDate.isValid()) {
      return FIRST_AFTER_SECOND;
    }

    if (!nextDate.isValid()) {
      return FIRST_BEFORE_SECOND;
    }

    if (nextDate.isAfter(firstDate)) {
      return sortOrder === 'asc' ? FIRST_BEFORE_SECOND : FIRST_AFTER_SECOND;
    }

    if (nextDate.isBefore(firstDate)) {
      return sortOrder === 'asc' ? FIRST_AFTER_SECOND : FIRST_BEFORE_SECOND;
    }

    return DO_NOT_SWAP;
  };

  return compareFunction;
}
