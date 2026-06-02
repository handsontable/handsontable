import {
  createISODateSortComparator,
  getSortComparatorForMeta,
} from 'handsontable/plugins/filters/sortComparators';
import { unifyColumnValues } from 'handsontable/plugins/filters/utils';

describe('Filters sort comparators', () => {
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
      const cmp = getSortComparatorForMeta({ type: 'date' });

      expect(typeof cmp).toBe('function');
      expect(cmp('2023-01-01', '2023-06-15')).toBeLessThan(0);
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
      const cmp = createISODateSortComparator();
      const values = ['2023-06-15', '2020-01-01', '2022-12-31'];
      const result = unifyColumnValues(values, cmp);

      expect(result).toEqual(['2020-01-01', '2022-12-31', '2023-06-15']);
    });

    it('should sort ISO date values correctly when an ISO date comparator is provided', () => {
      const cmp = createISODateSortComparator();
      const values = ['2023-06-15', '2020-01-01', '2022-12-31'];
      const result = unifyColumnValues(values, cmp);

      expect(result).toEqual(['2020-01-01', '2022-12-31', '2023-06-15']);
    });

    it('should deduplicate values before sorting', () => {
      const cmp = createISODateSortComparator();
      const values = ['2023-06-15', '2020-01-01', '2023-06-15'];
      const result = unifyColumnValues(values, cmp);

      expect(result).toEqual(['2020-01-01', '2023-06-15']);
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
