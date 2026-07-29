import { canMoveRange } from '../moveCells';

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
