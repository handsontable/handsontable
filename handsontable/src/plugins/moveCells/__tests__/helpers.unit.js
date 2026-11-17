import { clampMoveTarget, clampToDrawnBands } from '../helpers';

describe('clampMoveTarget', () => {
  it('keeps the whole block inside the grid', () => {
    expect(clampMoveTarget({
      pointerRow: 0,
      pointerCol: 0,
      grabRowOffset: 1,
      grabColOffset: 1,
      rangeHeight: 3,
      rangeWidth: 3,
      totalRows: 20,
      totalCols: 10,
    })).toEqual({ row: 0, col: 0 });

    expect(clampMoveTarget({
      pointerRow: 19,
      pointerCol: 9,
      grabRowOffset: 0,
      grabColOffset: 0,
      rangeHeight: 3,
      rangeWidth: 3,
      totalRows: 20,
      totalCols: 10,
    })).toEqual({ row: 17, col: 7 });
  });
});

describe('clampToDrawnBands', () => {
  // Two frozen start tracks, the scrolled table renders 20 to 29, two frozen end tracks of 40.
  const bands = [[0, 1], [20, 29], [38, 39]];

  it('keeps a range the scrolled table renders', () => {
    expect(clampToDrawnBands(22, 24, bands)).toEqual({ first: 22, last: 24 });
  });

  it('keeps a range in a frozen end band, which the scrolled table does not render', () => {
    expect(clampToDrawnBands(38, 38, bands)).toEqual({ first: 38, last: 38 });
  });

  it('keeps a range in a frozen start band while the table is scrolled away from it', () => {
    expect(clampToDrawnBands(0, 1, bands)).toEqual({ first: 0, last: 1 });
  });

  it('cuts a range down to its drawn part', () => {
    expect(clampToDrawnBands(25, 35, bands)).toEqual({ first: 25, last: 29 });
    expect(clampToDrawnBands(5, 22, bands)).toEqual({ first: 20, last: 22 });
  });

  it('spans from one band to another when the range reaches both', () => {
    expect(clampToDrawnBands(28, 39, bands)).toEqual({ first: 28, last: 39 });
  });

  it('answers null for a range between the bands', () => {
    expect(clampToDrawnBands(5, 10, bands)).toBeNull();
  });

  it('ignores an empty band', () => {
    expect(clampToDrawnBands(0, 3, [[0, -1], [2, 9], [40, 39]])).toEqual({ first: 2, last: 3 });
  });
});
