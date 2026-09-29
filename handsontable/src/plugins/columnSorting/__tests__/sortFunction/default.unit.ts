import { compareFunctionFactory as defaultSort } from 'handsontable/plugins/columnSorting/sortFunction/default';

it('defaultSort comparing function should sort boolean values correctly', () => {
  expect(defaultSort('asc', {}, {})(false, true)).toBe(-1);
  expect(defaultSort('asc', {}, {})(true, false)).toBe(1);
  expect(defaultSort('asc', {}, {})(false, false)).toBe(0);
  expect(defaultSort('asc', {}, {})(true, true)).toBe(0);

  expect(defaultSort('desc', {}, {})(false, true)).toBe(1);
  expect(defaultSort('desc', {}, {})(true, false)).toBe(-1);
  expect(defaultSort('desc', {}, {})(false, false)).toBe(0);
  expect(defaultSort('desc', {}, {})(true, true)).toBe(0);
});

it('defaultSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
  expect(defaultSort('asc', {}, {})(null, null)).toBe(0);
  expect(defaultSort('desc', {}, {})(null, null)).toBe(0);

  expect(defaultSort('asc', {}, {})('', '')).toBe(0);
  expect(defaultSort('desc', {}, {})('', '')).toBe(0);

  expect(defaultSort('asc', {}, {})(undefined, undefined)).toBe(0);
  expect(defaultSort('desc', {}, {})(undefined, undefined)).toBe(0);

  expect(defaultSort('asc', {}, {})('', null)).toBe(0);
  expect(defaultSort('desc', {}, {})('', null)).toBe(0);
  expect(defaultSort('asc', {}, {})(null, '')).toBe(0);
  expect(defaultSort('desc', {}, {})(null, '')).toBe(0);

  expect(defaultSort('asc', {}, {})('', undefined)).toBe(0);
  expect(defaultSort('desc', {}, {})('', undefined)).toBe(0);
  expect(defaultSort('asc', {}, {})(undefined, '')).toBe(0);
  expect(defaultSort('desc', {}, {})(undefined, '')).toBe(0);

  expect(defaultSort('asc', {}, {})(null, undefined)).toBe(0);
  expect(defaultSort('desc', {}, {})(null, undefined)).toBe(0);
  expect(defaultSort('asc', {}, {})(undefined, null)).toBe(0);
  expect(defaultSort('desc', {}, {})(undefined, null)).toBe(0);
});

it('should not throw when the column locale is an invalid BCP 47 tag', () => {
  const compare = defaultSort('asc', { locale: 'en_US' }, {});

  expect(() => compare('Beta', 'alpha')).not.toThrow();
});

it('should sort case-insensitively and identically to the default Unicode mapping', () => {
  const compare = defaultSort('asc', { locale: 'en-US' }, {});

  expect(compare('apple', 'Apple')).toBe(0);
  expect(compare('Apple', 'banana')).toBeLessThan(0);
});

it('should lowercase each distinct string once per created compare function', () => {
  // eslint-disable-next-line global-require
  const stringHelpers = require('handsontable/helpers/string');
  const spy = jest.spyOn(stringHelpers, 'localeLowerCase');
  const compare = defaultSort('asc', { locale: 'en-US' }, {});

  expect(compare('Banana', 'apple')).toBe(1);
  expect(compare('apple', 'Cherry')).toBe(-1);
  expect(compare('Cherry', 'Banana')).toBe(1);
  expect(compare('Banana', 'Cherry')).toBe(-1);

  // 3 distinct strings across 8 sides — every repeat must hit the per-run cache.
  expect(spy).toHaveBeenCalledTimes(3);

  spy.mockRestore();
});

it('should not share the lowercase cache between separately created compare functions', () => {
  // eslint-disable-next-line global-require
  const stringHelpers = require('handsontable/helpers/string');
  const spy = jest.spyOn(stringHelpers, 'localeLowerCase');

  defaultSort('asc', { locale: 'en-US' }, {})('Apple', 'Banana');
  defaultSort('asc', { locale: 'en-US' }, {})('Apple', 'Banana');

  // Each compare function owns a fresh cache, so both runs lowercase both strings.
  expect(spy).toHaveBeenCalledTimes(4);

  spy.mockRestore();
});

describe('defaultSort prepared keys', () => {
  // Mixed pool: numeric-looking strings, plain numbers, booleans, the three empty values, NaN,
  // a Date, whitespace-only strings, an object and a case-only string pair.
  const MIXED_POOL: unknown[] = [
    'A1', 'a10', 'A100', 'b2', '3', '10', '2.5', ' ', '  ',
    '', null, undefined,
    true, false,
    0, 1, -5, 2.5, NaN,
    new Date(2020, 0, 1), {},
    'Zebra', 'zebra',
  ];

  /**
   * Builds the sorted-row arrays the engine hands to `prepare()`.
   *
   * @param {Array} pool The values to wrap.
   * @returns {Array} The `[rowIndex, value]` rows.
   */
  function toRows(pool: unknown[]): unknown[][] {
    return pool.map((value, rowIndex) => [rowIndex, value]);
  }

  it('should answer every comparison exactly as the pairwise path does', () => {
    (['asc', 'desc'] as const).forEach((sortOrder) => {
      ([{}, { sortEmptyCells: true }, { sortEmptyCells: false }] as const).forEach((pluginSettings) => {
        const compare = defaultSort(sortOrder, { locale: 'en-US' }, pluginSettings);
        const keys = compare.prepare(toRows(MIXED_POOL), 1);
        const mismatches: string[] = [];

        for (let index = 0; index < MIXED_POOL.length; index++) {
          for (let nextIndex = 0; nextIndex < MIXED_POOL.length; nextIndex++) {
            const prepared = compare.compare(keys, index, nextIndex);
            const pairwise = compare(MIXED_POOL[index], MIXED_POOL[nextIndex]);

            if (prepared !== pairwise) {
              mismatches.push(
                `${sortOrder}/${JSON.stringify(pluginSettings)}: (${index},${nextIndex}) ` +
                `prepared ${prepared} vs pairwise ${pairwise}`
              );
            }
          }
        }

        expect(mismatches).toEqual([]);
      });
    });
  });

  it('should lowercase every row exactly once while preparing, without a per-run cache', () => {
    // eslint-disable-next-line global-require
    const stringHelpers = require('handsontable/helpers/string');
    const spy = jest.spyOn(stringHelpers, 'localeLowerCase');
    const pool = ['Banana', 'apple', 'Banana', 'Cherry', 'apple', 1, null];
    const compare = defaultSort('asc', { locale: 'en-US' }, {});

    compare.prepare(toRows(pool), 1);

    // 5 strings among 7 rows — one call per string row, no memoization, no row-sized Map.
    expect(spy).toHaveBeenCalledTimes(5);

    spy.mockRestore();
  });

  it('should read `sortEmptyCells` per comparison, not once per prepared column', () => {
    const pluginSettings: { sortEmptyCells?: boolean } = { sortEmptyCells: false };
    const compare = defaultSort('asc', {}, pluginSettings);
    const keys = compare.prepare(toRows(['a', null]), 1);

    expect(compare.compare(keys, 1, 0)).toBe(1);

    pluginSettings.sortEmptyCells = true;

    expect(compare.compare(keys, 1, 0)).toBe(-1);
  });
});
