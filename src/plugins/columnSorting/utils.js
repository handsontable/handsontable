import dateSort from './sortFunction/date';
import defaultSort from './sortFunction/default';
import numericSort from './sortFunction/numeric';

export const DO_NOT_SWAP = 0;
export const FIRST_BEFORE_SECOND = -1;
export const FIRST_AFTER_SECOND = 1;

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
