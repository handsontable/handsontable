import {isEmpty} from '../../../helpers/mixed';

/**
 * Numeric sorting algorithm.
 *
 * @param {Boolean} sortOrder Sorting order (`true` for ascending, `false` for descending).
 * @param {Object} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */
export default function numericSort(sortOrder, columnMeta) {
  return function(a, b) {
    const parsedA = parseFloat(a[1]);
    const parsedB = parseFloat(b[1]);

    // Watch out when changing this part of code!
    // Check below returns 0 (as expected) when comparing empty string, null, undefined
    if (parsedA === parsedB || (isNaN(parsedA) && isNaN(parsedB))) {
      return 0;
    }

    if (columnMeta.columnSorting.sortEmptyCells) {
      if (isEmpty(a[1])) {
        return sortOrder ? -1 : 1;
      }

      if (isEmpty(b[1])) {
        return sortOrder ? 1 : -1;
      }
    }

    if (isNaN(parsedA)) {
      return 1;
    }

    if (isNaN(parsedB)) {
      return -1;
    }

    if (parsedA < parsedB) {
      return sortOrder ? -1 : 1;

    } else if (parsedA > parsedB) {
      return sortOrder ? 1 : -1;
    }

    return 0;
  };
}
