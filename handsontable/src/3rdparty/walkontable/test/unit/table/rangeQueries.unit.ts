import { rowRangeQuery, columnRangeQuery } from '../../../src/renderedRange';

/**
 * Characterization tests for the row/column range-query logic, now provided by the `rowRangeQuery` /
 * `columnRangeQuery` mixin objects in `renderedRange.ts` (formerly the `calculatedRows` /
 * `calculatedColumns` mixins).
 *
 * They pin the two things the refactor preserves:
 *
 * 1. The exact method set each mixin contributes — so the row group and the column group keep their
 *    members.
 * 2. What each method returns off the current calculators, including the "nothing rendered" fallbacks
 *    (-1 for indexes, 0 for counts) and the header counts.
 *
 * The mixins are plain objects whose methods read `this.deps`, so they are exercised with a stub
 * `this` — no DOM, no table construction. Per-subclass wiring (which table type mixes which group) is
 * covered by the Walkontable integration suite, which constructs the real tables.
 */

const ROW_METHODS = [
  'getFirstRenderedRow',
  'getFirstVisibleRow',
  'getFirstPartiallyVisibleRow',
  'getLastRenderedRow',
  'getLastVisibleRow',
  'getLastPartiallyVisibleRow',
  'getRenderedRowsCount',
  'getVisibleRowsCount',
  'getColumnHeadersCount',
];

const COLUMN_METHODS = [
  'getFirstRenderedColumn',
  'getFirstVisibleColumn',
  'getFirstPartiallyVisibleColumn',
  'getLastRenderedColumn',
  'getLastVisibleColumn',
  'getLastPartiallyVisibleColumn',
  'getRenderedColumnsCount',
  'getVisibleColumnsCount',
  'getRowHeadersCount',
];

/**
 * Lists the callable method names on a mixin object (everything except the `MIXIN_NAME` marker).
 *
 * @param {object} mixin The mixin object.
 * @returns {string[]}
 */
function methodNames(mixin: object): string[] {
  return Object.keys(mixin).filter(key => typeof (mixin as Record<string, unknown>)[key] === 'function');
}

/**
 * Invokes a mixin method with a stub `this` exposing the given dependencies.
 *
 * @param {object} mixin The mixin object.
 * @param {string} method The method name to invoke.
 * @param {object} deps The stub `deps` accessor object.
 * @returns {number}
 */
function callWithDeps(mixin: object, method: string, deps: object): number {
  const fn = (mixin as Record<string, (this: { deps: object }) => number>)[method];

  return fn.call({ deps });
}

describe('range-query mixins', () => {
  describe('method sets (group membership)', () => {
    it('should expose exactly the row group on rowRangeQuery', () => {
      expect(methodNames(rowRangeQuery).sort()).toEqual([...ROW_METHODS].sort());
    });

    it('should expose exactly the column group on columnRangeQuery', () => {
      expect(methodNames(columnRangeQuery).sort()).toEqual([...COLUMN_METHODS].sort());
    });
  });

  describe('row range-query return values', () => {
    /**
     * Builds a stub `deps` whose viewport reports the given row calculators.
     *
     * @param {object} calculators The row calculators to expose.
     * @param {number} columnHeaderCount The number of column headers to report.
     * @returns {object}
     */
    function rowDeps(calculators: object, columnHeaderCount = 0) {
      return {
        getWtViewport: () => calculators,
        getColumnHeaders: () => new Array(columnHeaderCount).fill(() => {}),
        getRowHeaders: () => [],
      };
    }

    it('should read the boundaries off the current row calculators', () => {
      const deps = rowDeps({
        rowsRenderCalculator: { startRow: 5, endRow: 20, count: 16 },
        rowsVisibleCalculator: { startRow: 6, endRow: 19, count: 14 },
        rowsPartiallyVisibleCalculator: { startRow: 4, endRow: 21 },
      });

      expect(callWithDeps(rowRangeQuery, 'getFirstRenderedRow', deps)).toBe(5);
      expect(callWithDeps(rowRangeQuery, 'getLastRenderedRow', deps)).toBe(20);
      expect(callWithDeps(rowRangeQuery, 'getRenderedRowsCount', deps)).toBe(16);
      expect(callWithDeps(rowRangeQuery, 'getFirstVisibleRow', deps)).toBe(6);
      expect(callWithDeps(rowRangeQuery, 'getLastVisibleRow', deps)).toBe(19);
      expect(callWithDeps(rowRangeQuery, 'getVisibleRowsCount', deps)).toBe(14);
      expect(callWithDeps(rowRangeQuery, 'getFirstPartiallyVisibleRow', deps)).toBe(4);
      expect(callWithDeps(rowRangeQuery, 'getLastPartiallyVisibleRow', deps)).toBe(21);
    });

    it('should fall back to -1 for indexes and 0 for counts when no calculator exists', () => {
      const deps = rowDeps({});

      expect(callWithDeps(rowRangeQuery, 'getFirstRenderedRow', deps)).toBe(-1);
      expect(callWithDeps(rowRangeQuery, 'getLastRenderedRow', deps)).toBe(-1);
      expect(callWithDeps(rowRangeQuery, 'getFirstVisibleRow', deps)).toBe(-1);
      expect(callWithDeps(rowRangeQuery, 'getLastVisibleRow', deps)).toBe(-1);
      expect(callWithDeps(rowRangeQuery, 'getFirstPartiallyVisibleRow', deps)).toBe(-1);
      expect(callWithDeps(rowRangeQuery, 'getLastPartiallyVisibleRow', deps)).toBe(-1);
      expect(callWithDeps(rowRangeQuery, 'getRenderedRowsCount', deps)).toBe(0);
      expect(callWithDeps(rowRangeQuery, 'getVisibleRowsCount', deps)).toBe(0);
    });

    it('should count the column headers', () => {
      expect(callWithDeps(rowRangeQuery, 'getColumnHeadersCount', rowDeps({}, 3))).toBe(3);
    });
  });

  describe('column range-query return values', () => {
    /**
     * Builds a stub `deps` whose viewport reports the given column calculators.
     *
     * @param {object} calculators The column calculators to expose.
     * @param {number} rowHeaderCount The number of row headers to report.
     * @returns {object}
     */
    function columnDeps(calculators: object, rowHeaderCount = 0) {
      return {
        getWtViewport: () => calculators,
        getColumnHeaders: () => [],
        getRowHeaders: () => new Array(rowHeaderCount).fill(() => {}),
      };
    }

    it('should read the boundaries off the current column calculators', () => {
      const deps = columnDeps({
        columnsRenderCalculator: { startColumn: 2, endColumn: 10, count: 9 },
        columnsVisibleCalculator: { startColumn: 3, endColumn: 9, count: 7 },
        columnsPartiallyVisibleCalculator: { startColumn: 1, endColumn: 11 },
      });

      expect(callWithDeps(columnRangeQuery, 'getFirstRenderedColumn', deps)).toBe(2);
      expect(callWithDeps(columnRangeQuery, 'getLastRenderedColumn', deps)).toBe(10);
      expect(callWithDeps(columnRangeQuery, 'getRenderedColumnsCount', deps)).toBe(9);
      expect(callWithDeps(columnRangeQuery, 'getFirstVisibleColumn', deps)).toBe(3);
      expect(callWithDeps(columnRangeQuery, 'getLastVisibleColumn', deps)).toBe(9);
      expect(callWithDeps(columnRangeQuery, 'getVisibleColumnsCount', deps)).toBe(7);
      expect(callWithDeps(columnRangeQuery, 'getFirstPartiallyVisibleColumn', deps)).toBe(1);
      expect(callWithDeps(columnRangeQuery, 'getLastPartiallyVisibleColumn', deps)).toBe(11);
    });

    it('should fall back to -1 for indexes and 0 for counts when no calculator exists', () => {
      const deps = columnDeps({});

      expect(callWithDeps(columnRangeQuery, 'getFirstRenderedColumn', deps)).toBe(-1);
      expect(callWithDeps(columnRangeQuery, 'getLastRenderedColumn', deps)).toBe(-1);
      expect(callWithDeps(columnRangeQuery, 'getFirstVisibleColumn', deps)).toBe(-1);
      expect(callWithDeps(columnRangeQuery, 'getLastVisibleColumn', deps)).toBe(-1);
      expect(callWithDeps(columnRangeQuery, 'getFirstPartiallyVisibleColumn', deps)).toBe(-1);
      expect(callWithDeps(columnRangeQuery, 'getLastPartiallyVisibleColumn', deps)).toBe(-1);
      expect(callWithDeps(columnRangeQuery, 'getRenderedColumnsCount', deps)).toBe(0);
      expect(callWithDeps(columnRangeQuery, 'getVisibleColumnsCount', deps)).toBe(0);
    });

    it('should count the row headers', () => {
      expect(callWithDeps(columnRangeQuery, 'getRowHeadersCount', columnDeps({}, 2))).toBe(2);
    });
  });
});
