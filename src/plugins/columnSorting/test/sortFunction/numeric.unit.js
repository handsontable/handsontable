import numericSort from 'handsontable/plugins/columnSorting/sortFunction/numeric';

describe('numericSort', () => {
  it('numericSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
    expect(numericSort('asc', { columnSorting: {} })(null, null)).toEqual(0);
    expect(numericSort('desc', { columnSorting: {} })(null, null)).toEqual(0);

    expect(numericSort('asc', { columnSorting: {} })('', '')).toEqual(0);
    expect(numericSort('desc', { columnSorting: {} })('', '')).toEqual(0);

    expect(numericSort('asc', { columnSorting: {} })(undefined, undefined)).toEqual(0);
    expect(numericSort('desc', { columnSorting: {} })(undefined, undefined)).toEqual(0);

    expect(numericSort('asc', { columnSorting: {} })('', null)).toEqual(0);
    expect(numericSort('desc', { columnSorting: {} })('', null)).toEqual(0);
    expect(numericSort('asc', { columnSorting: {} })(null, '')).toEqual(0);
    expect(numericSort('desc', { columnSorting: {} })(null, '')).toEqual(0);

    expect(numericSort('asc', { columnSorting: {} })('', undefined)).toEqual(0);
    expect(numericSort('desc', { columnSorting: {} })('', undefined)).toEqual(0);
    expect(numericSort('asc', { columnSorting: {} })(undefined, '')).toEqual(0);
    expect(numericSort('desc', { columnSorting: {} })(undefined, '')).toEqual(0);

    expect(numericSort('asc', { columnSorting: {} })(null, undefined)).toEqual(0);
    expect(numericSort('desc', { columnSorting: {} })(null, undefined)).toEqual(0);
    expect(numericSort('asc', { columnSorting: {} })(undefined, null)).toEqual(0);
    expect(numericSort('desc', { columnSorting: {} })(undefined, null)).toEqual(0);
  });
});
