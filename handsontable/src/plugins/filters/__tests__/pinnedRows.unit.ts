import { getPinnedPhysicalRows } from 'handsontable/plugins/filters/utils';

describe('Filters -> getPinnedPhysicalRows', () => {
  // The rows are given in VISUAL order and hold PHYSICAL indexes, which is what the two overlays
  // freeze: the caller has already dropped whatever another plugin trimmed. The list is
  // deliberately not 0..n-1, so a helper that returned positions instead of the values sitting at
  // them would fail every case below.
  const visibleRows = [4, 7, 1, 9, 0, 3];

  it('should return an empty set when nothing is pinned', () => {
    expect(getPinnedPhysicalRows(visibleRows, 0, 0).size).toBe(0);
  });

  it('should return the first rows for fixedRowsTop', () => {
    expect([...getPinnedPhysicalRows(visibleRows, 2, 0)]).toEqual([4, 7]);
  });

  it('should return the last rows for fixedRowsBottom', () => {
    expect([...getPinnedPhysicalRows(visibleRows, 0, 2)]).toEqual([0, 3]);
  });

  it('should return both ends when both options are set', () => {
    expect([...getPinnedPhysicalRows(visibleRows, 1, 1)]).toEqual([4, 3]);
  });

  it('should not pin the whole grid when only fixedRowsTop is set', () => {
    // `slice(-0)` returns the WHOLE array, so a bottom range written as a negative slice would pin
    // every row here and no filter would ever hide anything.
    expect([...getPinnedPhysicalRows(visibleRows, 1, 0)]).toEqual([4]);
  });

  it('should de-duplicate when the two ends overlap on a short dataset', () => {
    // Three rows pinned at each end of a four-row grid: rows 7 and 1 belong to both ends.
    expect([...getPinnedPhysicalRows([4, 7, 1, 9], 3, 3)]).toEqual([4, 7, 1, 9]);
  });

  it('should clamp a pin count larger than the dataset', () => {
    expect([...getPinnedPhysicalRows(visibleRows, 99, 0)]).toEqual(visibleRows);
    expect([...getPinnedPhysicalRows(visibleRows, 0, 99)]).toEqual(visibleRows);
  });

  it('should return an empty set for an empty row list', () => {
    expect(getPinnedPhysicalRows([], 2, 2).size).toBe(0);
  });

  it('should not spread a large row list into a function call', () => {
    // `push(...arr)` passes one argument per element and overflows the stack past roughly 10k, so
    // the helper adds rows one at a time. 200k rows all pinned is the shape that used to throw.
    const manyRows = Array.from({ length: 200000 }, (_, index) => index);

    expect(() => getPinnedPhysicalRows(manyRows, 0, manyRows.length)).not.toThrow();
    expect(getPinnedPhysicalRows(manyRows, 0, manyRows.length).size).toBe(manyRows.length);
  });
});
