import defaultSort from 'handsontable-pro/plugins/multiColumnSorting/sortFunction/default';

it('defaultSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
  expect(defaultSort('asc', { multiColumnSorting: {} })(null, null)).toEqual(0);
  expect(defaultSort('desc', { multiColumnSorting: {} })(null, null)).toEqual(0);

  expect(defaultSort('asc', { multiColumnSorting: {} })('', '')).toEqual(0);
  expect(defaultSort('desc', { multiColumnSorting: {} })('', '')).toEqual(0);

  expect(defaultSort('asc', { multiColumnSorting: {} })(undefined, undefined)).toEqual(0);
  expect(defaultSort('desc', { multiColumnSorting: {} })(undefined, undefined)).toEqual(0);

  expect(defaultSort('asc', { multiColumnSorting: {} })('', null)).toEqual(0);
  expect(defaultSort('desc', { multiColumnSorting: {} })('', null)).toEqual(0);
  expect(defaultSort('asc', { multiColumnSorting: {} })(null, '')).toEqual(0);
  expect(defaultSort('desc', { multiColumnSorting: {} })(null, '')).toEqual(0);

  expect(defaultSort('asc', { multiColumnSorting: {} })('', undefined)).toEqual(0);
  expect(defaultSort('desc', { multiColumnSorting: {} })('', undefined)).toEqual(0);
  expect(defaultSort('asc', { multiColumnSorting: {} })(undefined, '')).toEqual(0);
  expect(defaultSort('desc', { multiColumnSorting: {} })(undefined, '')).toEqual(0);

  expect(defaultSort('asc', { multiColumnSorting: {} })(null, undefined)).toEqual(0);
  expect(defaultSort('desc', { multiColumnSorting: {} })(null, undefined)).toEqual(0);
  expect(defaultSort('asc', { multiColumnSorting: {} })(undefined, null)).toEqual(0);
  expect(defaultSort('desc', { multiColumnSorting: {} })(undefined, null)).toEqual(0);
});
