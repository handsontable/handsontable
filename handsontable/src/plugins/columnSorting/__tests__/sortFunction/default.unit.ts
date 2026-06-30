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
