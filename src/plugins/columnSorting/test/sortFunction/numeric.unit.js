import { compareFunctionFactory as numericSort } from 'handsontable/plugins/columnSorting/sortFunction/numeric';

it('numericSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
  expect(numericSort('asc', {}, {})(null, null)).toEqual(0);
  expect(numericSort('desc', {}, {})(null, null)).toEqual(0);

  expect(numericSort('asc', {}, {})('', '')).toEqual(0);
  expect(numericSort('desc', {}, {})('', '')).toEqual(0);

  expect(numericSort('asc', {}, {})(undefined, undefined)).toEqual(0);
  expect(numericSort('desc', {}, {})(undefined, undefined)).toEqual(0);

  expect(numericSort('asc', {}, {})('', null)).toEqual(0);
  expect(numericSort('desc', {}, {})('', null)).toEqual(0);
  expect(numericSort('asc', {}, {})(null, '')).toEqual(0);
  expect(numericSort('desc', {}, {})(null, '')).toEqual(0);

  expect(numericSort('asc', {}, {})('', undefined)).toEqual(0);
  expect(numericSort('desc', {}, {})('', undefined)).toEqual(0);
  expect(numericSort('asc', {}, {})(undefined, '')).toEqual(0);
  expect(numericSort('desc', {}, {})(undefined, '')).toEqual(0);

  expect(numericSort('asc', {}, {})(null, undefined)).toEqual(0);
  expect(numericSort('desc', {}, {})(null, undefined)).toEqual(0);
  expect(numericSort('asc', {}, {})(undefined, null)).toEqual(0);
  expect(numericSort('desc', {}, {})(undefined, null)).toEqual(0);
});
