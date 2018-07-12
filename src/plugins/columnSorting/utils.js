import dateSort from './sortFunction/date';
import defaultSort from './sortFunction/default';
import numericSort from './sortFunction/numeric';

export const DO_NOT_SWAP = 0;
export const FIRST_BEFORE_SECOND = -1;
export const FIRST_AFTER_SECOND = 1;

/**
 * Gets sort function for the particular column basing on its column meta.
 *
 * @param {Object} columnMeta
 * @returns {Function}
 */
export function getCompareFunctionFactory(columnMeta) {
  if (columnMeta.sortFunction) {
    return columnMeta.sortFunction;

  } else if (columnMeta.type === 'date') {
    return dateSort;

  } else if (columnMeta.type === 'numeric') {
    return numericSort;
  }

  return defaultSort;
}

/**
 * Get result of next column sorting.
 *
 * @param {Array} sortOrders Sorting orders (`asc` for ascending, `desc` for descending and `none` for initial state).
 * @param {Array} columnMetas Column meta objects.
 * @param {Array} indexWithValues Array is in form [rowIndex, ...values]. We compare just values, stored at second index of array.
 * @param {Array} nextIndexWithValues Array is in form [rowIndex, ...values]. We compare just values, stored at second index of array.
 * @param {Number} lastSortedColumn Index of last already sorted column.
 * @returns {Number} Comparision result; working as compare function in native `Array.prototype.sort` function specification.
 */
export function getNextColumnSortResult(state, columnMetas, indexWithValues, nextIndexWithValues, lastSortedColumn) {
  const nextColumn = lastSortedColumn + 1;

  if (columnMetas[nextColumn]) {
    const compareFunctionFactory = state[nextColumn].compareFunctionFactory || getCompareFunctionFactory(columnMetas[nextColumn]);
    const compareFunction = compareFunctionFactory(state, columnMetas);

    return compareFunction(indexWithValues, nextIndexWithValues, nextColumn);
  }

  return DO_NOT_SWAP;
}
