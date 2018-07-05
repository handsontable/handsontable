import dateSort from './sortFunction/date';
import defaultSort from './sortFunction/default';
import numericSort from './sortFunction/numeric';
import {ASC_SORT_STATE, DESC_SORT_STATE} from './sortedColumnStates';

export const DO_NOT_SWAP = 0;
export const FIRST_BEFORE_SECOND = -1;
export const FIRST_AFTER_SECOND = 1;

export const SORT_EMPTY_CELLS_DEFAULT = false;

/**
 * Gets sort function for the particular column basing on its column meta.
 *
 * @private
 * @param {Object} columnMeta
 * @returns {Function}
 */
export function getSortFunctionForColumn(columnMeta) {
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
 */
export function sortByNextColumn(sortOrders, columnMetas, indexWithValues, nextIndexWithValues, column) {
  const nextColumn = column + 1;

  if (columnMetas[nextColumn]) {
    const sortFunction = getSortFunctionForColumn(columnMetas[nextColumn]);
    const compareFunction = sortFunction(sortOrders, columnMetas);

    return compareFunction(indexWithValues, nextIndexWithValues, nextColumn);
  }

  return DO_NOT_SWAP;
}
