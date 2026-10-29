import { CellCoords, CellRange } from 'walkontable';
import { expandRangeToBlocks, isRangeOneBlock } from '../cellBlocks';

/**
 * Creates a range from `from` to `to` with the highlight on `from`.
 */
function createRange(fromRow: number, fromCol: number, toRow: number, toCol: number) {
  return new CellRange(
    new CellCoords(fromRow, fromCol),
    new CellCoords(fromRow, fromCol),
    new CellCoords(toRow, toCol),
  );
}

/**
 * Creates a block the way a merged cell describes itself.
 */
function createBlock(row: number, col: number, rowspan: number, colspan: number) {
  return {
    row,
    col,
    rowspan,
    colspan,
    getRange: () => createRange(row, col, row + rowspan - 1, col + colspan - 1),
  };
}

/**
 * Reads a range as `[fromRow, fromCol, toRow, toCol]`.
 */
function corners(range: CellRange) {
  return [range.from.row, range.from.col, range.to.row, range.to.col];
}

describe('cellBlocks', () => {
  describe('expandRangeToBlocks()', () => {
    it('should leave a range that touches no block as it is', () => {
      const range = createRange(3, 1, 3, 2);

      expect(expandRangeToBlocks(range, [createBlock(0, 0, 2, 2)], false)).toBe(false);
      expect(corners(range)).toEqual([3, 1, 3, 2]);
    });

    it('should leave a range that already covers every block it touches as it is', () => {
      const range = createRange(0, 0, 3, 3);

      expect(expandRangeToBlocks(range, [createBlock(1, 1, 2, 2)], false)).toBe(false);
      expect(corners(range)).toEqual([0, 0, 3, 3]);
    });

    it('should grow a range over a block it cuts', () => {
      const range = createRange(2, 0, 2, 1);

      expect(expandRangeToBlocks(range, [createBlock(1, 1, 3, 2)], false)).toBe(true);
      expect(corners(range)).toEqual([1, 0, 3, 2]);
    });

    it('should grow over a chain of three blocks whatever order they are listed in', () => {
      // C1:C2, B2:B3, A3:A4. From A4:C4 only A3:A4 is touched at first.
      const staircase = [createBlock(0, 2, 2, 1), createBlock(1, 1, 2, 1), createBlock(2, 0, 2, 1)];
      const topDown = createRange(3, 0, 3, 2);
      const bottomUp = createRange(3, 0, 3, 2);

      expandRangeToBlocks(topDown, staircase, false);
      expandRangeToBlocks(bottomUp, staircase.slice().reverse(), false);

      expect(corners(topDown)).toEqual([0, 0, 3, 2]);
      expect(corners(bottomUp)).toEqual([0, 0, 3, 2]);
    });

    it('should grow over a chain longer than any fixed number of passes would cover', () => {
      // A staircase of five, listed top-down: each pass adds one more step.
      const staircase = [
        createBlock(0, 4, 2, 1),
        createBlock(1, 3, 2, 1),
        createBlock(2, 2, 2, 1),
        createBlock(3, 1, 2, 1),
        createBlock(4, 0, 2, 1),
      ];
      const range = createRange(5, 0, 5, 4);

      expect(expandRangeToBlocks(range, staircase, false)).toBe(true);
      expect(corners(range)).toEqual([0, 0, 5, 4]);
    });

    it('should keep the range direction when `changeDirection` is `false`', () => {
      const range = createRange(2, 0, 2, 0);

      expandRangeToBlocks(range, [createBlock(1, 0, 2, 1)], false);

      expect(corners(range)).toEqual([1, 0, 2, 0]);
    });

    it('should let the range flip its direction when `changeDirection` is `true`', () => {
      const range = createRange(2, 0, 2, 0);

      expandRangeToBlocks(range, [createBlock(1, 0, 2, 1)], true);

      // The highlight (row 2) ends on the bottom edge, so the range runs bottom-up.
      expect(corners(range)).toEqual([2, 0, 1, 0]);
    });
  });

  describe('isRangeOneBlock()', () => {
    it('should return `true` for a range whose corners are a block\'s corners, in either direction', () => {
      const blocks = [createBlock(0, 0, 1, 1), createBlock(1, 1, 2, 3)];

      expect(isRangeOneBlock(createRange(1, 1, 2, 3), blocks)).toBe(true);
      expect(isRangeOneBlock(createRange(2, 3, 1, 1), blocks)).toBe(true);
    });

    it('should return `false` for a range larger or smaller than every block', () => {
      const blocks = [createBlock(1, 1, 2, 3)];

      expect(isRangeOneBlock(createRange(1, 1, 3, 3), blocks)).toBe(false);
      expect(isRangeOneBlock(createRange(1, 1, 1, 3), blocks)).toBe(false);
      expect(isRangeOneBlock(createRange(1, 1, 2, 3), [])).toBe(false);
    });

    it('should count header coordinates as `0`', () => {
      // A full column B selected from its header, over a block that fills the column's 6 rows.
      expect(isRangeOneBlock(createRange(-1, 1, 5, 1), [createBlock(0, 1, 6, 1)])).toBe(true);
    });
  });
});
