import moment from 'moment';
import { parseToLocalDate } from '../../helpers/dateTime';

/**
 * Returns a comparator function for sorting `date` cell type values.
 * Empty strings sort before valid dates; unparseable strings sort after valid dates.
 *
 * @param {string} dateFormat Moment.js format string matching the column's `dateFormat` setting.
 * @returns {Function}
 */
export function createDateSortComparator(dateFormat: string): (a: string, b: string) => number {
  return (a: string, b: string) => {
    if (a === '' && b === '') {
      return 0;
    }

    if (a === '') {
      return -1;
    }

    if (b === '') {
      return 1;
    }

    const dateA = moment(a, dateFormat);
    const dateB = moment(b, dateFormat);
    const validA = dateA.isValid();
    const validB = dateB.isValid();

    if (!validA && !validB) {
      return 0;
    }

    if (!validA) {
      return 1;
    }

    if (!validB) {
      return -1;
    }

    return dateA.diff(dateB);
  };
}

/**
 * Returns a comparator function for sorting `intl-date` cell type values.
 * Source data for `intl-date` is always ISO 8601 ("YYYY-MM-DD").
 * Empty strings sort before valid dates; non-ISO strings sort after valid dates.
 *
 * @returns {Function}
 */
export function createISODateSortComparator(): (a: string, b: string) => number {
  return (a: string, b: string) => {
    if (a === '' && b === '') {
      return 0;
    }

    if (a === '') {
      return -1;
    }

    if (b === '') {
      return 1;
    }

    const dateA = parseToLocalDate(a);
    const dateB = parseToLocalDate(b);

    if (dateA === null && dateB === null) {
      return 0;
    }

    if (dateA === null) {
      return 1;
    }

    if (dateB === null) {
      return -1;
    }

    return (dateA as unknown as number) - (dateB as unknown as number);
  };
}

/**
 * Returns the appropriate sort comparator for the given column cell meta, or `undefined` if
 * no cell-type-specific comparator is needed (falls back to `unifyColumnValues` default).
 *
 * @param {object|null|undefined} meta The cell meta object for the column.
 * @returns {Function|undefined}
 */
export function getSortComparatorForMeta(
  meta: Record<string, unknown> | null | undefined
): ((a: string, b: string) => number) | undefined {
  if (!meta) {
    return undefined;
  }

  if (meta.type === 'date') {
    return createDateSortComparator(meta.dateFormat as string);
  }

  if (meta.type === 'intl-date') {
    return createISODateSortComparator();
  }

  return undefined;
}
