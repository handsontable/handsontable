import { getPinnedPhysicalRows } from 'handsontable/plugins/filters/utils';

describe('Filters -> getPinnedPhysicalRows', () => {
  // The sequence is deliberately NOT 0..n-1 in most cases below: it is the row index sequence,
  // which a sort or a row move permutes. The helper must read positions in that order and return
  // the physical indexes sitting there, never the positions themselves.
  const sequence = [4, 7, 1, 9, 0, 3];

  it('should return an empty set when nothing is pinned', () => {
    expect(getPinnedPhysicalRows(sequence, 0, 0).size).toBe(0);
  });

  it('should return the first rows of the sequence for fixedRowsTop', () => {
    expect([...getPinnedPhysicalRows(sequence, 2, 0)]).toEqual([4, 7]);
  });

  it('should return the last rows of the sequence for fixedRowsBottom', () => {
    expect([...getPinnedPhysicalRows(sequence, 0, 2)]).toEqual([0, 3]);
  });

  it('should return both ends when both options are set', () => {
    expect([...getPinnedPhysicalRows(sequence, 1, 1)]).toEqual([4, 3]);
  });

  it('should not pin the whole grid when only fixedRowsTop is set', () => {
    // `slice(-0)` returns the WHOLE array rather than an empty one, so an unguarded bottom slice
    // would pin every row here and no filter would ever hide anything.
    expect([...getPinnedPhysicalRows(sequence, 1, 0)]).toEqual([4]);
  });

  it('should de-duplicate when the two ends overlap on a short dataset', () => {
    // Three rows pinned at each end of a four-row grid: rows 7 and 1 belong to both ends.
    const shortSequence = [4, 7, 1, 9];

    expect([...getPinnedPhysicalRows(shortSequence, 3, 3)]).toEqual([4, 7, 1, 9]);
  });

  it('should clamp a pin count larger than the dataset', () => {
    expect([...getPinnedPhysicalRows(sequence, 99, 0)]).toEqual(sequence);
    expect([...getPinnedPhysicalRows(sequence, 0, 99)]).toEqual(sequence);
  });

  it('should treat a negative count as zero', () => {
    expect(getPinnedPhysicalRows(sequence, -1, -1).size).toBe(0);
  });

  it('should return an empty set for an empty sequence', () => {
    expect(getPinnedPhysicalRows([], 2, 2).size).toBe(0);
  });
});
