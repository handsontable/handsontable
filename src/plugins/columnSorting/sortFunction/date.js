import moment from 'moment';
import {isEmpty} from '../../../helpers/mixed';

/**
 * Date sorting algorithm
 *
 * @param {Boolean} sortOrder Sorting order (`true` for ascending, `false` for descending).
 * @param {Object} columnMeta Column meta object.
 * @returns {Function} The compare function.
 */
export default function dateSort(sortOrder, columnMeta) {
  return function(a, b) {
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

    var aDate = moment(a[1], columnMeta.dateFormat);
    var bDate = moment(b[1], columnMeta.dateFormat);

    if (!aDate.isValid()) {
      return 1;
    }
    if (!bDate.isValid()) {
      return -1;
    }

    if (bDate.isAfter(aDate)) {
      return sortOrder ? -1 : 1;
    }
    if (bDate.isBefore(aDate)) {
      return sortOrder ? 1 : -1;
    }

    return 0;
  };
}
