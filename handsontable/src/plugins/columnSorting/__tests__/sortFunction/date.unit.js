import { compareFunctionFactory as dateSort } from 'handsontable/plugins/columnSorting/sortFunction/date';

it('dateSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
  expect(dateSort('asc', {}, {})(null, null)).toEqual(0);
  expect(dateSort('desc', {}, {})(null, null)).toEqual(0);

  expect(dateSort('asc', {}, {})('', '')).toEqual(0);
  expect(dateSort('desc', {}, {})('', '')).toEqual(0);

  expect(dateSort('asc', {}, {})(undefined, undefined)).toEqual(0);
  expect(dateSort('desc', {}, {})(undefined, undefined)).toEqual(0);

  expect(dateSort('asc', {}, {})('', null)).toEqual(0);
  expect(dateSort('desc', {}, {})('', null)).toEqual(0);
  expect(dateSort('asc', {}, {})(null, '')).toEqual(0);
  expect(dateSort('desc', {}, {})(null, '')).toEqual(0);

  expect(dateSort('asc', {}, {})('', undefined)).toEqual(0);
  expect(dateSort('desc', {}, {})('', undefined)).toEqual(0);
  expect(dateSort('asc', {}, {})(undefined, '')).toEqual(0);
  expect(dateSort('desc', {}, {})(undefined, '')).toEqual(0);

  expect(dateSort('asc', {}, {})(null, undefined)).toEqual(0);
  expect(dateSort('desc', {}, {})(null, undefined)).toEqual(0);
  expect(dateSort('asc', {}, {})(undefined, null)).toEqual(0);
  expect(dateSort('desc', {}, {})(undefined, null)).toEqual(0);
});
