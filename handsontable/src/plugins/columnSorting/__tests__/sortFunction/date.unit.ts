import { compareFunctionFactory as dateSort } from 'handsontable/plugins/columnSorting/sortFunction/date';

it('dateSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
  expect(dateSort('asc', {}, {})(null, null)).toBe(0);
  expect(dateSort('desc', {}, {})(null, null)).toBe(0);

  expect(dateSort('asc', {}, {})('', '')).toBe(0);
  expect(dateSort('desc', {}, {})('', '')).toBe(0);

  expect(dateSort('asc', {}, {})(undefined, undefined)).toBe(0);
  expect(dateSort('desc', {}, {})(undefined, undefined)).toBe(0);

  expect(dateSort('asc', {}, {})('', null)).toBe(0);
  expect(dateSort('desc', {}, {})('', null)).toBe(0);
  expect(dateSort('asc', {}, {})(null, '')).toBe(0);
  expect(dateSort('desc', {}, {})(null, '')).toBe(0);

  expect(dateSort('asc', {}, {})('', undefined)).toBe(0);
  expect(dateSort('desc', {}, {})('', undefined)).toBe(0);
  expect(dateSort('asc', {}, {})(undefined, '')).toBe(0);
  expect(dateSort('desc', {}, {})(undefined, '')).toBe(0);

  expect(dateSort('asc', {}, {})(null, undefined)).toBe(0);
  expect(dateSort('desc', {}, {})(null, undefined)).toBe(0);
  expect(dateSort('asc', {}, {})(undefined, null)).toBe(0);
  expect(dateSort('desc', {}, {})(undefined, null)).toBe(0);
});
