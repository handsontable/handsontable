import dateSort from 'handsontable/plugins/columnSorting/sortFunction/date';

it('dateSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
  expect(dateSort('asc', { columnSorting: {} })(null, null)).toEqual(0);
  expect(dateSort('desc', { columnSorting: {} })(null, null)).toEqual(0);

  expect(dateSort('asc', { columnSorting: {} })('', '')).toEqual(0);
  expect(dateSort('desc', { columnSorting: {} })('', '')).toEqual(0);

  expect(dateSort('asc', { columnSorting: {} })(undefined, undefined)).toEqual(0);
  expect(dateSort('desc', { columnSorting: {} })(undefined, undefined)).toEqual(0);

  expect(dateSort('asc', { columnSorting: {} })('', null)).toEqual(0);
  expect(dateSort('desc', { columnSorting: {} })('', null)).toEqual(0);
  expect(dateSort('asc', { columnSorting: {} })(null, '')).toEqual(0);
  expect(dateSort('desc', { columnSorting: {} })(null, '')).toEqual(0);

  expect(dateSort('asc', { columnSorting: {} })('', undefined)).toEqual(0);
  expect(dateSort('desc', { columnSorting: {} })('', undefined)).toEqual(0);
  expect(dateSort('asc', { columnSorting: {} })(undefined, '')).toEqual(0);
  expect(dateSort('desc', { columnSorting: {} })(undefined, '')).toEqual(0);

  expect(dateSort('asc', { columnSorting: {} })(null, undefined)).toEqual(0);
  expect(dateSort('desc', { columnSorting: {} })(null, undefined)).toEqual(0);
  expect(dateSort('asc', { columnSorting: {} })(undefined, null)).toEqual(0);
  expect(dateSort('desc', { columnSorting: {} })(undefined, null)).toEqual(0);
});
