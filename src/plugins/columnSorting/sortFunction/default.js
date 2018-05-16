import {isEmpty} from '../../../helpers/mixed';

/**
 * Default sorting algorithm.
 *
 * @param {Boolean} sortOrder Sorting order - `true` for ascending, `false` for descending.
 * @param {Object} columnMeta Column meta object.
 * @returns {Function} The comparing function.
 */
export default function defaultSort(sortOrder, columnMeta) {
  return function(a, b) {
    if (typeof a[1] === 'string') {
      a[1] = a[1].toLowerCase();
    }
    if (typeof b[1] === 'string') {
      b[1] = b[1].toLowerCase();
    }

    if (a[1] === b[1]) {
      return 0;
    }

    if (isEmpty(a[1])) {
      if (isEmpty(b[1])) {
        return 0;
      }

      if (columnMeta.columnSorting.sortEmptyCells) {
        return sortOrder ? -1 : 1;
      }

      return 1;
    }
    if (isEmpty(b[1])) {
      if (isEmpty(a[1])) {
        return 0;
      }

      if (columnMeta.columnSorting.sortEmptyCells) {
        return sortOrder ? 1 : -1;
      }

      return -1;
    }

    if (isNaN(a[1]) && !isNaN(b[1])) {
      return sortOrder ? 1 : -1;

    } else if (!isNaN(a[1]) && isNaN(b[1])) {
      return sortOrder ? -1 : 1;

    } else if (!(isNaN(a[1]) || isNaN(b[1]))) {
      a[1] = parseFloat(a[1]);
      b[1] = parseFloat(b[1]);
    }
    if (a[1] < b[1]) {
      return sortOrder ? -1 : 1;
    }
    if (a[1] > b[1]) {
      return sortOrder ? 1 : -1;
    }

    return 0;
  };
}
