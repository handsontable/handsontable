import dateSort from 'handsontable-pro/plugins/multiColumnSorting/sortFunction/date';

it('dateSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
  expect(dateSort('asc', { multiColumnSorting: {} })(null, null)).toEqual(0);
  expect(dateSort('desc', { multiColumnSorting: {} })(null, null)).toEqual(0);

  expect(dateSort('asc', { multiColumnSorting: {} })('', '')).toEqual(0);
  expect(dateSort('desc', { multiColumnSorting: {} })('', '')).toEqual(0);

  expect(dateSort('asc', { multiColumnSorting: {} })(undefined, undefined)).toEqual(0);
  expect(dateSort('desc', { multiColumnSorting: {} })(undefined, undefined)).toEqual(0);

  expect(dateSort('asc', { multiColumnSorting: {} })('', null)).toEqual(0);
  expect(dateSort('desc', { multiColumnSorting: {} })('', null)).toEqual(0);
  expect(dateSort('asc', { multiColumnSorting: {} })(null, '')).toEqual(0);
  expect(dateSort('desc', { multiColumnSorting: {} })(null, '')).toEqual(0);

  expect(dateSort('asc', { multiColumnSorting: {} })('', undefined)).toEqual(0);
  expect(dateSort('desc', { multiColumnSorting: {} })('', undefined)).toEqual(0);
  expect(dateSort('asc', { multiColumnSorting: {} })(undefined, '')).toEqual(0);
  expect(dateSort('desc', { multiColumnSorting: {} })(undefined, '')).toEqual(0);

  expect(dateSort('asc', { multiColumnSorting: {} })(null, undefined)).toEqual(0);
  expect(dateSort('desc', { multiColumnSorting: {} })(null, undefined)).toEqual(0);
  expect(dateSort('asc', { multiColumnSorting: {} })(undefined, null)).toEqual(0);
  expect(dateSort('desc', { multiColumnSorting: {} })(undefined, null)).toEqual(0);
});
