import moment from 'moment';
import {isEmpty} from '../../../helpers/mixed';
import {getNextColumnSortResult, DO_NOT_SWAP, FIRST_BEFORE_SECOND, FIRST_AFTER_SECOND} from '../utils';

/**
 * Date sorting algorithm
 *
 * @param {Array} sortOrders Sorting orders (`asc` for ascending, `desc` for descending and `none` for initial state).
 * @param {Array} columnMetas Column meta objects.
 * @returns {Function} The compare function.
 */
export default function dateSort(state, columnMetas) {
  // We are soring array of arrays. Single array is in form [rowIndex, ...values]. We compare just values, stored at second index of array.
  return function ([rowIndex, ...values], [nextRowIndex, ...nextValues], sortedColumnIndex = 0) {
    const value = values[sortedColumnIndex];
    const nextValue = nextValues[sortedColumnIndex];
    const columnMeta = columnMetas[sortedColumnIndex];
    const {sortOrder, sortEmptyCells} = state[sortedColumnIndex];

    if (value === nextValue) {
      // Two equal values, we check if sorting should be performed for next columns.
      return getNextColumnSortResult(state, columnMetas, [rowIndex, ...values], [nextRowIndex, ...nextValues], sortedColumnIndex);
    }

    if (isEmpty(value)) {
      if (isEmpty(nextValue)) {
        // Two equal values, we check if sorting should be performed for next columns.
        return getNextColumnSortResult(columnMetas, sortedColumnIndex + 1);
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

    const dateFormat = columnMeta.dateFormat;
    const firstDate = moment(value, dateFormat);
    const nextDate = moment(nextValue, dateFormat);

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
}
