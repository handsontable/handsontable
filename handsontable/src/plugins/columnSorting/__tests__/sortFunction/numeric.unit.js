import { compareFunctionFactory as numericSort } from 'handsontable/plugins/columnSorting/sortFunction/numeric';

it('numericSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
  expect(numericSort('asc', {}, {})(null, null)).toBe(0);
  expect(numericSort('desc', {}, {})(null, null)).toBe(0);

  expect(numericSort('asc', {}, {})('', '')).toBe(0);
  expect(numericSort('desc', {}, {})('', '')).toBe(0);

  expect(numericSort('asc', {}, {})(undefined, undefined)).toBe(0);
  expect(numericSort('desc', {}, {})(undefined, undefined)).toBe(0);

  expect(numericSort('asc', {}, {})('', null)).toBe(0);
  expect(numericSort('desc', {}, {})('', null)).toBe(0);
  expect(numericSort('asc', {}, {})(null, '')).toBe(0);
  expect(numericSort('desc', {}, {})(null, '')).toBe(0);

  expect(numericSort('asc', {}, {})('', undefined)).toBe(0);
  expect(numericSort('desc', {}, {})('', undefined)).toBe(0);
  expect(numericSort('asc', {}, {})(undefined, '')).toBe(0);
  expect(numericSort('desc', {}, {})(undefined, '')).toBe(0);

  expect(numericSort('asc', {}, {})(null, undefined)).toBe(0);
  expect(numericSort('desc', {}, {})(null, undefined)).toBe(0);
  expect(numericSort('asc', {}, {})(undefined, null)).toBe(0);
  expect(numericSort('desc', {}, {})(undefined, null)).toBe(0);
});
