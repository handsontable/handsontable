import { clampMoveTarget, canMoveRange, buildMoveMap } from '../moveCells';

describe('clampMoveTarget', () => {
  it('keeps the whole block inside the grid (top-left clamp)', () => {
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
  });

  it('clamps against the bottom-right so the block does not overflow', () => {
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

  it('returns the exact top-left for an interior drop', () => {
    expect(clampMoveTarget({
      pointerRow: 5,
      pointerCol: 5,
      grabRowOffset: 1,
      grabColOffset: 1,
      rangeHeight: 2,
      rangeWidth: 2,
      totalRows: 20,
      totalCols: 10,
    })).toEqual({ row: 4, col: 4 });
  });
});

describe('canMoveRange', () => {
  it('allows a single contiguous cell range', () => {
    expect(canMoveRange({
      rangeCount: 1,
      isEntireRow: false,
      isEntireColumn: false,
      isHeader: false,
    })).toBe(true);
  });

  it('rejects multiple ranges', () => {
    expect(canMoveRange({
      rangeCount: 2,
      isEntireRow: false,
      isEntireColumn: false,
      isHeader: false,
    })).toBe(false);
  });

  it('rejects full-row, full-column, and header selections', () => {
    expect(canMoveRange({
      rangeCount: 1,
      isEntireRow: true,
      isEntireColumn: false,
      isHeader: false,
    })).toBe(false);
    expect(canMoveRange({
      rangeCount: 1,
      isEntireRow: false,
      isEntireColumn: true,
      isHeader: false,
    })).toBe(false);
    expect(canMoveRange({
      rangeCount: 1,
      isEntireRow: false,
      isEntireColumn: false,
      isHeader: true,
    })).toBe(false);
  });
});

describe('buildMoveMap', () => {
  it('maps each source cell to its target cell preserving layout', () => {
    const map = buildMoveMap({
      fromRow: 2,
      fromCol: 2,
      toRow: 3,
      toCol: 3,
      targetRow: 5,
      targetCol: 6,
    });

    expect(map).toEqual([
      {
        fromRow: 2,
        fromCol: 2,
        toRow: 5,
        toCol: 6,
      },
      {
        fromRow: 2,
        fromCol: 3,
        toRow: 5,
        toCol: 7,
      },
      {
        fromRow: 3,
        fromCol: 2,
        toRow: 6,
        toCol: 6,
      },
      {
        fromRow: 3,
        fromCol: 3,
        toRow: 6,
        toCol: 7,
      },
    ]);
  });

  it('handles a single-cell range', () => {
    expect(buildMoveMap({
      fromRow: 1,
      fromCol: 1,
      toRow: 1,
      toCol: 1,
      targetRow: 4,
      targetCol: 4,
    }))
      .toEqual([{
        fromRow: 1,
        fromCol: 1,
        toRow: 4,
        toCol: 4,
      }]);
  });
});
