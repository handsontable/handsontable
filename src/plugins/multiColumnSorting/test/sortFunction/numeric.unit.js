import numericSort from 'handsontable-pro/plugins/multiColumnSorting/sortFunction/numeric';

describe('numericSort', () => {
  it('numericSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
    expect(numericSort('asc', { multiColumnSorting: {} })(null, null)).toEqual(0);
    expect(numericSort('desc', { multiColumnSorting: {} })(null, null)).toEqual(0);

    expect(numericSort('asc', { multiColumnSorting: {} })('', '')).toEqual(0);
    expect(numericSort('desc', { multiColumnSorting: {} })('', '')).toEqual(0);

    expect(numericSort('asc', { multiColumnSorting: {} })(undefined, undefined)).toEqual(0);
    expect(numericSort('desc', { multiColumnSorting: {} })(undefined, undefined)).toEqual(0);

    expect(numericSort('asc', { multiColumnSorting: {} })('', null)).toEqual(0);
    expect(numericSort('desc', { multiColumnSorting: {} })('', null)).toEqual(0);
    expect(numericSort('asc', { multiColumnSorting: {} })(null, '')).toEqual(0);
    expect(numericSort('desc', { multiColumnSorting: {} })(null, '')).toEqual(0);

    expect(numericSort('asc', { multiColumnSorting: {} })('', undefined)).toEqual(0);
    expect(numericSort('desc', { multiColumnSorting: {} })('', undefined)).toEqual(0);
    expect(numericSort('asc', { multiColumnSorting: {} })(undefined, '')).toEqual(0);
    expect(numericSort('desc', { multiColumnSorting: {} })(undefined, '')).toEqual(0);

    expect(numericSort('asc', { multiColumnSorting: {} })(null, undefined)).toEqual(0);
    expect(numericSort('desc', { multiColumnSorting: {} })(null, undefined)).toEqual(0);
    expect(numericSort('asc', { multiColumnSorting: {} })(undefined, null)).toEqual(0);
    expect(numericSort('desc', { multiColumnSorting: {} })(undefined, null)).toEqual(0);
  });
});
