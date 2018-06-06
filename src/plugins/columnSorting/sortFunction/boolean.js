/**
 * Boolean sorting algorithm.
 *
 * @param {Boolean} sortOrder Sorting order (`true` for ascending, `false` for descending).
 * @param {Object} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */
export default function booleanSort(sortOrder, columnMeta) {
  return function(a, b) {
    if (a[1] !== true && a[1] !== false && b[1] !== true && b[1] !== false) {
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

    if (!!a[1] !== a[1]) {
      return 1;
    }

    if (!!b[1] !== b[1]) {
      return -1;
    }

    if (!!a[1] === !!b[1]) {
      return 0;
    }

    return sortOrder ? (a[1] - b[1]) : (b[1] - a[1]);
  };
}
