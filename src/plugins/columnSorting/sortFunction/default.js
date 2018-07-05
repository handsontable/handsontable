import {isEmpty, isUndefined} from '../../../helpers/mixed';
import {sortByNextColumn, DO_NOT_SWAP, FIRST_BEFORE_SECOND, FIRST_AFTER_SECOND, SORT_EMPTY_CELLS_DEFAULT} from '../utils';

/**
 * Default sorting algorithm.
 *
 * @param {Array} sortOrders Sorting orders (`asc` for ascending, `desc` for descending and `none` for initial state).
 * @param {Array} columnMetas Column meta objects.
 * @returns {Function} The compare function.
 */
export default function defaultSort(sortOrders, columnMetas) {
  // We are soring array of arrays. Single array is in form [rowIndex, ...values]. We compare just values, stored at second index of array.
  return function ([rowIndex, ...values], [nextRowIndex, ...nextValues], sortedColumnIndex = 0) {
    let value = values[sortedColumnIndex];
    let nextValue = nextValues[sortedColumnIndex];
    const sortOrder = sortOrders[sortedColumnIndex];
    let sortEmptyCells = columnMetas[sortedColumnIndex].columnSorting.sortEmptyCells;

    if (isUndefined(sortEmptyCells)) {
      sortEmptyCells = SORT_EMPTY_CELLS_DEFAULT;
    }

    if (typeof value === 'string') {
      value = value.toLowerCase();
    }

    if (typeof nextValue === 'string') {
      nextValue = nextValue.toLowerCase();
    }

    if (value === nextValue) {
      // Two equal values, we check if there is sorting in next columns.
      return sortByNextColumn(sortOrders, columnMetas, [rowIndex, ...values], [nextRowIndex, ...nextValues], sortedColumnIndex);
    }

    if (isEmpty(value)) {
      if (isEmpty(nextValue)) {
        // Two equal values, we check if there is sorting in next columns.
        return sortByNextColumn(sortOrders, columnMetas, [rowIndex, ...values], [nextRowIndex, ...nextValues], sortedColumnIndex);
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
