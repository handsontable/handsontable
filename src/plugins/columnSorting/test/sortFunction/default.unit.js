import { compareFunctionFactory as defaultSort } from 'handsontable/plugins/columnSorting/sortFunction/default';

it('defaultSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
  expect(defaultSort('asc', {}, {})(null, null)).toEqual(0);
  expect(defaultSort('desc', {}, {})(null, null)).toEqual(0);

  expect(defaultSort('asc', {}, {})('', '')).toEqual(0);
  expect(defaultSort('desc', {}, {})('', '')).toEqual(0);

  expect(defaultSort('asc', {}, {})(undefined, undefined)).toEqual(0);
  expect(defaultSort('desc', {}, {})(undefined, undefined)).toEqual(0);

  expect(defaultSort('asc', {}, {})('', null)).toEqual(0);
  expect(defaultSort('desc', {}, {})('', null)).toEqual(0);
  expect(defaultSort('asc', {}, {})(null, '')).toEqual(0);
  expect(defaultSort('desc', {}, {})(null, '')).toEqual(0);

  expect(defaultSort('asc', {}, {})('', undefined)).toEqual(0);
  expect(defaultSort('desc', {}, {})('', undefined)).toEqual(0);
  expect(defaultSort('asc', {}, {})(undefined, '')).toEqual(0);
  expect(defaultSort('desc', {}, {})(undefined, '')).toEqual(0);

  expect(defaultSort('asc', {}, {})(null, undefined)).toEqual(0);
  expect(defaultSort('desc', {}, {})(null, undefined)).toEqual(0);
  expect(defaultSort('asc', {}, {})(undefined, null)).toEqual(0);
  expect(defaultSort('desc', {}, {})(undefined, null)).toEqual(0);
});
