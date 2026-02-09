import { compareFunctionFactory as defaultSort } from 'handsontable/plugins/columnSorting/sortFunction/default';

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
