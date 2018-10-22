import defaultSort from 'handsontable/plugins/columnSorting/sortFunction/default';

it('defaultSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
  expect(defaultSort('asc', { columnSorting: {} })(null, null)).toEqual(0);
  expect(defaultSort('desc', { columnSorting: {} })(null, null)).toEqual(0);

  expect(defaultSort('asc', { columnSorting: {} })('', '')).toEqual(0);
  expect(defaultSort('desc', { columnSorting: {} })('', '')).toEqual(0);

  expect(defaultSort('asc', { columnSorting: {} })(undefined, undefined)).toEqual(0);
  expect(defaultSort('desc', { columnSorting: {} })(undefined, undefined)).toEqual(0);

  expect(defaultSort('asc', { columnSorting: {} })('', null)).toEqual(0);
  expect(defaultSort('desc', { columnSorting: {} })('', null)).toEqual(0);
  expect(defaultSort('asc', { columnSorting: {} })(null, '')).toEqual(0);
  expect(defaultSort('desc', { columnSorting: {} })(null, '')).toEqual(0);

  expect(defaultSort('asc', { columnSorting: {} })('', undefined)).toEqual(0);
  expect(defaultSort('desc', { columnSorting: {} })('', undefined)).toEqual(0);
  expect(defaultSort('asc', { columnSorting: {} })(undefined, '')).toEqual(0);
  expect(defaultSort('desc', { columnSorting: {} })(undefined, '')).toEqual(0);

  expect(defaultSort('asc', { columnSorting: {} })(null, undefined)).toEqual(0);
  expect(defaultSort('desc', { columnSorting: {} })(null, undefined)).toEqual(0);
  expect(defaultSort('asc', { columnSorting: {} })(undefined, null)).toEqual(0);
  expect(defaultSort('desc', { columnSorting: {} })(undefined, null)).toEqual(0);
});
