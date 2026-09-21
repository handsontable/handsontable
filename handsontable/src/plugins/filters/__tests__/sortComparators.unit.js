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

  describe('getSortComparatorForMeta with the filterValueComparator option', () => {
    it('should return the comparator the column defines', () => {
      const custom = () => 0;

      expect(getSortComparatorForMeta({ type: 'text', filterValueComparator: custom })).toBe(custom);
    });

    it('should let the option win over the cell type comparator', () => {
      const custom = () => 0;

      expect(getSortComparatorForMeta({ type: 'date', filterValueComparator: custom })).toBe(custom);
      expect(getSortComparatorForMeta({ type: 'intl-datetime', filterValueComparator: custom })).toBe(custom);
    });

    it('should read the option even when the meta carries no type', () => {
      const custom = () => 0;

      expect(getSortComparatorForMeta({ filterValueComparator: custom })).toBe(custom);
    });

    it('should ignore a value that is not a function', () => {
      expect(getSortComparatorForMeta({ type: 'text', filterValueComparator: ['a', 'b'] })).toBeUndefined();
      expect(getSortComparatorForMeta({ type: 'text', filterValueComparator: 'asc' })).toBeUndefined();
      expect(getSortComparatorForMeta({ type: 'text', filterValueComparator: null })).toBeUndefined();

      // falls back to the cell-type comparator, not to nothing
      const dateFallback = getSortComparatorForMeta({ type: 'date', filterValueComparator: 'asc' });

      expect(typeof dateFallback).toBe('function');
      expect(dateFallback('2023-01-01', '2023-06-15')).toBeLessThan(0);
    });
  });

  describe('unifyColumnValues with a custom comparator', () => {
    const ORDER = ['Critical', 'High', 'Medium', 'Low'];
    const rank = value => (ORDER.indexOf(value) === -1 ? ORDER.length : ORDER.indexOf(value));
    const byPriority = (a, b) => rank(a) - rank(b);

    it('should order the values by the comparator', () => {
      expect(unifyColumnValues(['Low', 'High', 'Critical', 'Medium', 'High'], byPriority))
        .toEqual(['Critical', 'High', 'Medium', 'Low']);
    });

    it('should place a literal empty string where the comparator says', () => {
      // unknown values (the blank) rank last under `byPriority`
      expect(unifyColumnValues(['Low', '', 'Critical'], byPriority)).toEqual(['Critical', 'Low', '']);
    });

    it('should hand a null or undefined blank to the comparator as an empty string', () => {
      // `unifyColumnValues` maps through `toEmptyString` BEFORE it sorts, which is the conversion
      // the option's documentation promises. Assert on what the comparator was handed rather than
      // on the output: the `Set` dedupes before that map, so `null` and `undefined` survive as two
      // separate entries and both become `''`.
      const seen = [];
      const spy = (a, b) => {
        seen.push(a, b);

        return byPriority(a, b);
      };

      unifyColumnValues(['Low', null, undefined, 'Critical'], spy);

      expect(seen).toContain('');
      expect(seen).not.toContain(null);
      expect(seen).not.toContain(undefined);
    });

    it('should keep every distinct value regardless of the comparator', () => {
      const values = ['Low', 'High', 'Critical', 'Medium', '', 'Unknown'];
      const alwaysEqual = () => 0;

      expect([...unifyColumnValues(values, alwaysEqual)].sort()).toEqual([...values].sort());
    });

    it('should keep the default order byte-identical when no comparator is given', () => {
      expect(unifyColumnValues(['Low', 'High', 'Critical', 'Medium', '']))
        .toEqual(['', 'Critical', 'High', 'Low', 'Medium']);
      expect(unifyColumnValues([300, 5, 1000, 20])).toEqual([5, 20, 300, 1000]);
    });
  });
});
