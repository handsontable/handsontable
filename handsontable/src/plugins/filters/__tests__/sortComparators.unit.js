import {
  createDateSortComparator,
  createISODateSortComparator,
  getSortComparatorForMeta,
} from 'handsontable/plugins/filters/sortComparators';
import { unifyColumnValues } from 'handsontable/plugins/filters/utils';

describe('Filters sort comparators', () => {
  describe('createDateSortComparator', () => {
    it('should sort dates in ascending order for DD/MM/YYYY format', () => {
      const cmp = createDateSortComparator('DD/MM/YYYY');

      expect(cmp('01/01/2023', '15/06/2023')).toBeLessThan(0);
      expect(cmp('15/06/2023', '01/01/2023')).toBeGreaterThan(0);
      expect(cmp('01/01/2023', '01/01/2023')).toBe(0);
    });

    it('should sort dates in ascending order for MM/DD/YYYY format', () => {
      const cmp = createDateSortComparator('MM/DD/YYYY');

      expect(cmp('01/15/2023', '06/15/2023')).toBeLessThan(0);
      expect(cmp('06/15/2023', '01/15/2023')).toBeGreaterThan(0);
    });

    it('should sort dates in ascending order for YYYY-MM-DD format', () => {
      const cmp = createDateSortComparator('YYYY-MM-DD');

      expect(cmp('2023-01-01', '2023-12-31')).toBeLessThan(0);
      expect(cmp('2023-12-31', '2023-01-01')).toBeGreaterThan(0);
    });

    it('should sort dates across different years', () => {
      const cmp = createDateSortComparator('DD/MM/YYYY');

      expect(cmp('01/01/2020', '01/01/2023')).toBeLessThan(0);
      expect(cmp('01/01/2023', '01/01/2020')).toBeGreaterThan(0);
    });

    it('should place empty strings before valid dates', () => {
      const cmp = createDateSortComparator('DD/MM/YYYY');

      expect(cmp('', '01/01/2023')).toBeLessThan(0);
      expect(cmp('01/01/2023', '')).toBeGreaterThan(0);
      expect(cmp('', '')).toBe(0);
    });

    it('should place invalid date strings after valid dates', () => {
      const cmp = createDateSortComparator('DD/MM/YYYY');

      expect(cmp('invalid', '01/01/2023')).toBeGreaterThan(0);
      expect(cmp('01/01/2023', 'invalid')).toBeLessThan(0);
    });

    it('should treat two invalid date strings as equal', () => {
      const cmp = createDateSortComparator('DD/MM/YYYY');

      expect(cmp('invalid', 'also-invalid')).toBe(0);
    });
  });

  describe('createISODateSortComparator', () => {
    it('should sort ISO 8601 dates in ascending order', () => {
      const cmp = createISODateSortComparator();

      expect(cmp('2023-01-01', '2023-12-31')).toBeLessThan(0);
      expect(cmp('2023-12-31', '2023-01-01')).toBeGreaterThan(0);
      expect(cmp('2023-06-15', '2023-06-15')).toBe(0);
    });

    it('should sort dates across different years', () => {
      const cmp = createISODateSortComparator();

      expect(cmp('2020-01-01', '2023-01-01')).toBeLessThan(0);
      expect(cmp('2023-01-01', '2020-01-01')).toBeGreaterThan(0);
    });

    it('should place empty strings before valid dates', () => {
      const cmp = createISODateSortComparator();

      expect(cmp('', '2023-01-01')).toBeLessThan(0);
      expect(cmp('2023-01-01', '')).toBeGreaterThan(0);
      expect(cmp('', '')).toBe(0);
    });

    it('should place non-ISO strings after valid dates', () => {
      const cmp = createISODateSortComparator();

      expect(cmp('not-a-date', '2023-01-01')).toBeGreaterThan(0);
      expect(cmp('2023-01-01', 'not-a-date')).toBeLessThan(0);
    });

    it('should treat two non-ISO strings as equal', () => {
      const cmp = createISODateSortComparator();

      expect(cmp('invalid', 'also-invalid')).toBe(0);
    });
  });

  describe('getSortComparatorForMeta', () => {
    it('should return a date comparator for "date" cell type', () => {
      const cmp = getSortComparatorForMeta({ type: 'date', dateFormat: 'DD/MM/YYYY' });

      expect(typeof cmp).toBe('function');
      expect(cmp('01/01/2023', '15/06/2023')).toBeLessThan(0);
    });

    it('should return an ISO date comparator for "intl-date" cell type', () => {
      const cmp = getSortComparatorForMeta({ type: 'intl-date' });

      expect(typeof cmp).toBe('function');
      expect(cmp('2023-01-01', '2023-12-31')).toBeLessThan(0);
    });

    it('should return undefined for unknown cell types', () => {
      expect(getSortComparatorForMeta({ type: 'text' })).toBeUndefined();
      expect(getSortComparatorForMeta({ type: 'numeric' })).toBeUndefined();
      expect(getSortComparatorForMeta({ type: 'checkbox' })).toBeUndefined();
    });

    it('should return undefined for null or undefined meta', () => {
      expect(getSortComparatorForMeta(null)).toBeUndefined();
      expect(getSortComparatorForMeta(undefined)).toBeUndefined();
    });
  });

  describe('unifyColumnValues with date comparator', () => {
    it('should sort date values correctly when a date comparator is provided', () => {
      const cmp = createDateSortComparator('DD/MM/YYYY');
      const values = ['15/06/2023', '01/01/2020', '31/12/2022'];
      const result = unifyColumnValues(values, cmp);

      expect(result).toEqual(['01/01/2020', '31/12/2022', '15/06/2023']);
    });

    it('should sort ISO date values correctly when an ISO date comparator is provided', () => {
      const cmp = createISODateSortComparator();
      const values = ['2023-06-15', '2020-01-01', '2022-12-31'];
      const result = unifyColumnValues(values, cmp);

      expect(result).toEqual(['2020-01-01', '2022-12-31', '2023-06-15']);
    });

    it('should deduplicate values before sorting', () => {
      const cmp = createDateSortComparator('DD/MM/YYYY');
      const values = ['15/06/2023', '01/01/2020', '15/06/2023'];
      const result = unifyColumnValues(values, cmp);

      expect(result).toEqual(['01/01/2020', '15/06/2023']);
    });

    it('should sort values without comparator using default string sorting (backward compatible)', () => {
      const values = ['b', 'a', 'c'];
      const result = unifyColumnValues(values);

      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should sort numbers without comparator using default numeric sorting', () => {
      const values = [10, 2, 30];
      const result = unifyColumnValues(values);

      expect(result).toEqual([2, 10, 30]);
    });
  });
});
