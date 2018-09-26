import dateSort from './sortFunction/date';
import defaultSort from './sortFunction/default';
import numericSort from './sortFunction/numeric';

export const DO_NOT_SWAP = 0;
export const FIRST_BEFORE_SECOND = -1;
export const FIRST_AFTER_SECOND = 1;

/**
 * Gets sort function for the particular column basing on its column meta.
 *
 * @param {Array} columnMeta Column meta object.
 * @returns {Function}
 */
function getCompareFunctionFactory(columnMeta) {
  const columnSettings = columnMeta.multiColumnSorting;

  if (columnSettings.compareFunctionFactory) {
    return columnSettings.compareFunctionFactory;

  } else if (columnMeta.type === 'date') {
    return dateSort;

  } else if (columnMeta.type === 'numeric') {
    return numericSort;
  }

  return defaultSort;
}

/**
 * Sort comparator handled by conventional sort algorithm.
 *
 * @param {Array} sortOrders Sort orders (`asc` for ascending, `desc` for descending).
 * @param {Array} columnMeta Column meta objects.
 * @returns {Function}
 */
export function mainSortComparator(sortingOrders, columnMetas) {
  return function(rowIndexWithValues, nextRowIndexWithValues) {
    // We sort array of arrays. Single array is in form [rowIndex, ...values].
    // We compare just values, stored at second index of array.
    const [, ...values] = rowIndexWithValues;
    const [, ...nextValues] = nextRowIndexWithValues;

    return (function getCompareResult(column) {
      const sortingOrder = sortingOrders[column];
      const columnMeta = columnMetas[column];
      const value = values[column];
      const nextValue = nextValues[column];
      const compareFunctionFactory = getCompareFunctionFactory(columnMeta);
      const compareResult = compareFunctionFactory(sortingOrder, columnMeta)(value, nextValue);

      if (compareResult === DO_NOT_SWAP) {
        const nextSortedColumn = column + 1;

        if (typeof columnMetas[nextSortedColumn] !== 'undefined') {
          return getCompareResult(nextSortedColumn);
        }
      }

      return compareResult;
    }(0));
  };
}
