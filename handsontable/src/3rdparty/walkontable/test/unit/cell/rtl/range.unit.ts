import CellRange from 'walkontable/cell/range';
import CellCoords from 'walkontable/cell/coords';

function createCoords(row, column) {
  return new CellCoords(row, column, true);
}

function createRange(highlightRow, highlightCol, fromRow, fromCol, toRow, toCol) {
  return new CellRange(
    createCoords(highlightRow, highlightCol),
    createCoords(fromRow, fromCol),
    createCoords(toRow, toCol),
    true,
  );
}

describe('CellRange (RTL)', () => {
  describe('includes()', () => {
    it('should return `true` for coords that are within the range', () => {
      const range = createRange(-1, -1, 1, 1, 5, 5);

      expect(range.includes(createCoords(1, 1))).toBe(true);
      expect(range.includes(createCoords(1, 2))).toBe(true);
      expect(range.includes(createCoords(1, 3))).toBe(true);
      expect(range.includes(createCoords(1, 4))).toBe(true);
      expect(range.includes(createCoords(1, 5))).toBe(true);
      expect(range.includes(createCoords(2, 5))).toBe(true);
      expect(range.includes(createCoords(3, 5))).toBe(true);
      expect(range.includes(createCoords(4, 5))).toBe(true);
      expect(range.includes(createCoords(5, 5))).toBe(true);
    });

    it('should return `false` for coords that are not within the range', () => {
      const range = createRange(-1, -1, 1, 1, 5, 5);

      expect(range.includes(createCoords(0, 1))).toBe(false);
      expect(range.includes(createCoords(1, 0))).toBe(false);
      expect(range.includes(createCoords(5, 6))).toBe(false);
      expect(range.includes(createCoords(6, 5))).toBe(false);
    });
  });

  describe('includesRange()', () => {
    it('should return `true` for coords that are within the range', () => {
      const range = createRange(-1, -1, 1, 1, 5, 5);

      expect(range.includesRange(createRange(-1, -1, 1, 1, 5, 5))).toBe(true);
      expect(range.includesRange(createRange(-1, -1, 1, 2, 5, 4))).toBe(true);
      expect(range.includesRange(createRange(-1, -1, 1, 3, 5, 3))).toBe(true);
      expect(range.includesRange(createRange(-1, -1, 1, 4, 5, 2))).toBe(true);
      expect(range.includesRange(createRange(-1, -1, 1, 5, 5, 1))).toBe(true);
      expect(range.includesRange(createRange(-1, -1, 5, 1, 1, 5))).toBe(true);
    });

    it('should return `false` for coords that are not within the range', () => {
      const range = createRange(-1, -1, 1, 1, 5, 5);

      expect(range.includesRange(createRange(-1, -1, 1, 0, 5, 5))).toBe(false);
      expect(range.includesRange(createRange(-1, -1, 0, 1, 5, 5))).toBe(false);
      expect(range.includesRange(createRange(-1, -1, 1, 1, 6, 5))).toBe(false);
      expect(range.includesRange(createRange(-1, -1, 1, 1, 5, 6))).toBe(false);
      expect(range.includesRange(createRange(-1, -1, 1, 1, 6, 6))).toBe(false);
      expect(range.includesRange(createRange(-1, -1, 0, 0, 5, 5))).toBe(false);
      expect(range.includesRange(createRange(-1, -1, -1, 1, 5, 5))).toBe(false);
    });
  });

  describe('overlaps()', () => {
    it('should return `true` for the overlapping ranges', () => {
      const range = createRange(-1, -1, 1, 1, 5, 5);

      // overlaps from top-left
      expect(range.overlaps(createRange(-1, -1, 0, 0, 1, 1))).toBe(true);
      // overlaps from top-right
      expect(range.overlaps(createRange(-1, -1, 0, 6, 1, 5))).toBe(true);
      // overlaps from bottom-left
      expect(range.overlaps(createRange(-1, -1, 6, 0, 5, 1))).toBe(true);
      // overlaps from bottom-right
      expect(range.overlaps(createRange(-1, -1, 6, 6, 5, 5))).toBe(true);
      // the range is the same
      expect(range.overlaps(createRange(-1, -1, 1, 1, 5, 5))).toBe(true);
      // the range is entirely within the range
      expect(range.overlaps(createRange(-1, -1, 2, 2, 3, 3))).toBe(true);
      // the range entirely covers the range
      expect(range.overlaps(createRange(-1, -1, 0, 0, 9, 9))).toBe(true);
    });

    it('should return `false` for not overlapping ranges', () => {
      const range = createRange(-1, -1, 1, 1, 5, 5);

      expect(range.overlaps(createRange(-1, -1, 0, 0, 0, 0))).toBe(false);
      expect(range.overlaps(createRange(-1, -1, 0, 6, 1, 6))).toBe(false);
      expect(range.overlaps(createRange(-1, -1, 6, 0, 6, 1))).toBe(false);
      expect(range.overlaps(createRange(-1, -1, 6, 6, 6, 6))).toBe(false);
    });
  });

  describe('isSouthEastOf()', () => {
    it('should return correct value for the passed cell coords', () => {
      const range = createRange(-1, -1, 1, 1, 5, 5);

      // cell coords points to top-right
      expect(range.isSouthEastOf(createCoords(0, 0))).toBe(false);
      // cell coords points to top-left
      expect(range.isSouthEastOf(createCoords(0, 6))).toBe(true);
      // cell coords points to bottom-right
      expect(range.isSouthEastOf(createCoords(6, 0))).toBe(false);
      // cell coords points to bottom-left
      expect(range.isSouthEastOf(createCoords(6, 6))).toBe(false);
    });
  });

  describe('isNorthWestOf()', () => {
    it('should return correct value for the passed cell coords', () => {
      const range = createRange(-1, -1, 1, 1, 5, 5);

      // cell coords points to top-right
      expect(range.isNorthWestOf(createCoords(0, 0))).toBe(false);
      // cell coords points to top-left
      expect(range.isNorthWestOf(createCoords(0, 6))).toBe(false);
      // cell coords points to bottom-right
      expect(range.isNorthWestOf(createCoords(6, 0))).toBe(true);
      // cell coords points to bottom-left
      expect(range.isNorthWestOf(createCoords(6, 6))).toBe(false);
    });
  });

  describe('isOverlappingHorizontally()', () => {
    it('should return correct value for the overlapping or non-overlapping ranges', () => {
      const range = createRange(-1, -1, 1, 1, 5, 5);

      // overlaps from right one column
      expect(range.isOverlappingHorizontally(createRange(-1, -1, 0, 1, 10, 1))).toBe(true);
      // overlaps from right two columns
      expect(range.isOverlappingHorizontally(createRange(-1, -1, 0, 1, 10, 2))).toBe(true);
      // overlaps all columns
      expect(range.isOverlappingHorizontally(createRange(-1, -1, 0, 1, 10, 5))).toBe(true);
      // the range entirely covers all range
      expect(range.isOverlappingHorizontally(createRange(-1, -1, 0, 0, 10, 9))).toBe(true);

      // overlaps from left one column
      expect(range.isOverlappingHorizontally(createRange(-1, -1, 0, 5, 10, 5))).toBe(true);
      // overlaps from left two columns
      expect(range.isOverlappingHorizontally(createRange(-1, -1, 0, 5, 10, 4))).toBe(true);
      // overlaps all columns
      expect(range.isOverlappingHorizontally(createRange(-1, -1, 0, 5, 10, 1))).toBe(true);
      // the range entirely covers all range
      expect(range.isOverlappingHorizontally(createRange(-1, -1, 0, 9, 10, 0))).toBe(true);

      // the range is the same
      expect(range.isOverlappingHorizontally(createRange(-1, -1, 1, 1, 5, 5))).toBe(true);
    });
  });

  describe('isOverlappingVertically()', () => {
    it('should return correct value for overlapping ranges', () => {
      const range = createRange(-1, -1, 1, 1, 5, 5);

      // overlaps from top one row
      expect(range.isOverlappingVertically(createRange(-1, -1, 1, 0, 1, 10))).toBe(true);
      // overlaps from top two rows
      expect(range.isOverlappingVertically(createRange(-1, -1, 1, 0, 2, 10))).toBe(true);
      // overlaps all rows
      expect(range.isOverlappingVertically(createRange(-1, -1, 1, 0, 5, 10))).toBe(true);
      // the range entirely covers all range
      expect(range.isOverlappingVertically(createRange(-1, -1, 0, 0, 9, 10))).toBe(true);

      // overlaps from bottom one row
      expect(range.isOverlappingVertically(createRange(-1, -1, 5, 0, 5, 10))).toBe(true);
      // overlaps from bottom two rows
      expect(range.isOverlappingVertically(createRange(-1, -1, 5, 0, 4, 10))).toBe(true);
      // overlaps all rows
      expect(range.isOverlappingVertically(createRange(-1, -1, 5, 0, 1, 10))).toBe(true);
      // the range entirely covers all range
      expect(range.isOverlappingVertically(createRange(-1, -1, 9, 0, 0, 10))).toBe(true);

      // the range is the same
      expect(range.isOverlappingVertically(createRange(-1, -1, 1, 1, 5, 5))).toBe(true);
    });
  });

  describe('expand()', () => {
    it('should expand the range correctly', () => {
      const range = createRange(-1, -1, 2, 2, 5, 5);

      // expend to top-right
      expect(range.expand(createCoords(1, 1))).toBe(true);
      expect(range).toEqualCellRange('highlight: -1,-1 from: 1,1 to: 5,5');

      // expend to top-left
      expect(range.expand(createCoords(0, 6))).toBe(true);
      expect(range).toEqualCellRange('highlight: -1,-1 from: 0,1 to: 5,6');

      // expend to bottom-left
      expect(range.expand(createCoords(6, 7))).toBe(true);
      expect(range).toEqualCellRange('highlight: -1,-1 from: 0,1 to: 6,7');

      // expend to bottom-right
      expect(range.expand(createCoords(7, 0))).toBe(true);
      expect(range).toEqualCellRange('highlight: -1,-1 from: 0,0 to: 7,7');
    });
  });

  describe('getDirection()', () => {
    it('should return "NW-SE" for range that point to SE direction', () => {
      const range = createRange(-1, -1, 2, 5, 5, 2);

      expect(range.getDirection()).toBe('NW-SE');
    });

    it('should return "NE-SW" for range that point to SW direction', () => {
      const range = createRange(-1, -1, 2, 2, 5, 5);

      expect(range.getDirection()).toBe('NE-SW');
    });

    it('should return "SE-NW" for range that point to NW direction', () => {
      const range = createRange(-1, -1, 5, 2, 2, 5);

      expect(range.getDirection()).toBe('SE-NW');
    });

    it('should return "SW-NE" for range that point to NE direction', () => {
      const range = createRange(-1, -1, 5, 5, 2, 2);

      expect(range.getDirection()).toBe('SW-NE');
    });
  });

  describe('setDirection()', () => {
    it('should change the range direction', () => {
      const range = createRange(-1, -1, 5, 5, 2, 2);

      range.setDirection('NW-SE');

      expect(range).toEqualCellRange('highlight: -1,-1 from: 2,5 to: 5,2');

      range.setDirection('SE-NW');

      expect(range).toEqualCellRange('highlight: -1,-1 from: 5,2 to: 2,5');

      range.setDirection('NE-SW');

      expect(range).toEqualCellRange('highlight: -1,-1 from: 2,2 to: 5,5');

      range.setDirection('SW-NE');

      expect(range).toEqualCellRange('highlight: -1,-1 from: 5,5 to: 2,2');

      range.setDirection('NE-NE'); // do nothing

      expect(range).toEqualCellRange('highlight: -1,-1 from: 5,5 to: 2,2');
    });
  });

  describe('getVerticalDirection()', () => {
    it('should return correct direction', () => {
      expect(createRange(-1, -1, 2, 2, 2, 2).getVerticalDirection()).toBe('N-S');
      expect(createRange(-1, -1, 1, 2, 2, 2).getVerticalDirection()).toBe('N-S');
      expect(createRange(-1, -1, -2, 2, -1, 2).getVerticalDirection()).toBe('N-S');

      expect(createRange(-1, -1, 3, 2, 2, 2).getVerticalDirection()).toBe('S-N');
      expect(createRange(-1, -1, -1, 2, -2, 2).getVerticalDirection()).toBe('S-N');
    });
  });

  describe('getHorizontalDirection()', () => {
    it('should return correct direction', () => {
      expect(createRange(-1, -1, 2, 1, 2, 2).getHorizontalDirection()).toBe('E-W');
      expect(createRange(-1, -1, 2, -2, 2, -1).getHorizontalDirection()).toBe('E-W');

      expect(createRange(-1, -1, 2, 2, 2, 2).getHorizontalDirection()).toBe('W-E');
      expect(createRange(-1, -1, 2, 3, 2, 2).getHorizontalDirection()).toBe('W-E');
      expect(createRange(-1, -1, 2, -1, 2, -2).getHorizontalDirection()).toBe('W-E');
    });
  });

  describe('flipDirectionVertically()', () => {
    it('should flip the range (S-N) direction', () => {
      const range = createRange(-1, -1, 2, 2, 5, 5);

      range.flipDirectionVertically();

      expect(range).toEqualCellRange('highlight: -1,-1 from: 5,2 to: 2,5');
    });

    it('should flip the range (N-S) direction', () => {
      const range = createRange(-1, -1, 5, 5, 2, 2);

      range.flipDirectionVertically();

      expect(range).toEqualCellRange('highlight: -1,-1 from: 2,5 to: 5,2');
    });
  });

  describe('flipDirectionHorizontally()', () => {
    it('should flip the range (W-E) direction', () => {
      const range = createRange(-1, -1, 2, 2, 5, 5);

      range.flipDirectionHorizontally();

      expect(range).toEqualCellRange('highlight: -1,-1 from: 2,5 to: 5,2');
    });

    it('should flip the range (E-W) direction', () => {
      const range = createRange(-1, -1, 5, 5, 2, 2);

      range.flipDirectionHorizontally();

      expect(range).toEqualCellRange('highlight: -1,-1 from: 5,2 to: 2,5');
    });
  });

  describe('isCorner()', () => {
    it('should return `true` when the coords matches to the range corner', () => {
      const range = createRange(-1, -1, 2, 2, 5, 5);

      expect(range.isCorner(createCoords(2, 2))).toBe(true);
      expect(range.isCorner(createCoords(2, 5))).toBe(true);
      expect(range.isCorner(createCoords(5, 2))).toBe(true);
      expect(range.isCorner(createCoords(5, 5))).toBe(true);

      expect(range.isCorner(createCoords(-1, -1))).toBe(false);
      expect(range.isCorner(createCoords(0, 0))).toBe(false);
      expect(range.isCorner(createCoords(2, 1))).toBe(false);
      expect(range.isCorner(createCoords(2, 3))).toBe(false);
      expect(range.isCorner(createCoords(4, 2))).toBe(false);
      expect(range.isCorner(createCoords(2, 4))).toBe(false);
    });
  });

  describe('getOppositeCorner()', () => {
    it('should return the opposite corner coords', () => {
      expect(createRange(-1, -1, 2, 2, 5, 5).getOppositeCorner(createCoords(2, 2))).toEqual({
        row: 5,
        col: 5,
      });
      expect(createRange(-1, -1, 2, 2, 5, 5).getOppositeCorner(createCoords(5, 5))).toEqual({
        row: 2,
        col: 2,
      });
      expect(createRange(-1, -1, 2, 5, 5, 2).getOppositeCorner(createCoords(2, 5))).toEqual({
        row: 5,
        col: 2,
      });
      expect(createRange(-1, -1, 2, 5, 5, 2).getOppositeCorner(createCoords(5, 2))).toEqual({
        row: 2,
        col: 5,
      });
      expect(createRange(-1, -1, 2, 5, 5, 2).getOppositeCorner(createCoords(1, 1))).toBeUndefined();
    });
  });

  describe('getBordersSharedWith()', () => {
    it('should return the opposite corner coords', () => {
      const range = createRange(-1, -1, 2, 2, 5, 5);

      expect(range.getBordersSharedWith(createRange(-1, -1, 2, 2, 5, 5))).toEqual([
        'top',
        'left',
        'bottom',
        'right',
      ]);
      expect(range.getBordersSharedWith(createRange(-1, -1, 2, 2, 4, 4))).toEqual([
        'top',
        'right',
      ]);
      expect(range.getBordersSharedWith(createRange(-1, -1, 3, 3, 4, 5))).toEqual([
        'left',
      ]);
      expect(range.getBordersSharedWith(createRange(-1, -1, 3, 2, 4, 4))).toEqual([
        'right',
      ]);
      expect(range.getBordersSharedWith(createRange(-1, -1, 2, 3, 4, 4))).toEqual([
        'top',
      ]);
      expect(range.getBordersSharedWith(createRange(-1, -1, 3, 3, 5, 4))).toEqual([
        'bottom',
      ]);
      expect(range.getBordersSharedWith(createRange(-1, -1, 1, 3, 5, 4))).toEqual([]);
      expect(range.getBordersSharedWith(createRange(-1, -1, 3, 3, 9, 4))).toEqual([]);
    });
  });

  describe('getInner()', () => {
    it('should return all CellCoords (except corners) instances that are included in the range', () => {
      const range = createRange(-1, -1, 2, 2, 5, 5);

      expect(range.getInner().length).toBe(14);
      expect(range.getInner()[0]).toBeInstanceOf(CellCoords);
      expect(range.getInner().map(coords => coords.toObject())).toEqual([
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 2, col: 5 },
        { row: 3, col: 2 },
        { row: 3, col: 3 },
        { row: 3, col: 4 },
        { row: 3, col: 5 },
        { row: 4, col: 2 },
        { row: 4, col: 3 },
        { row: 4, col: 4 },
        { row: 4, col: 5 },
        { row: 5, col: 2 },
        { row: 5, col: 3 },
        { row: 5, col: 4 },
      ]);
    });
  });

  describe('getAll()', () => {
    it('should return all CellCoords instances that are included in the range', () => {
      const range = createRange(-1, -1, 2, 2, 5, 5);

      expect(range.getAll().length).toBe(16);
      expect(range.getAll()[0]).toBeInstanceOf(CellCoords);
      expect(range.getAll().map(coords => coords.toObject())).toEqual([
        { row: 2, col: 2 },
        { row: 2, col: 3 },
        { row: 2, col: 4 },
        { row: 2, col: 5 },
        { row: 3, col: 2 },
        { row: 3, col: 3 },
        { row: 3, col: 4 },
        { row: 3, col: 5 },
        { row: 4, col: 2 },
        { row: 4, col: 3 },
        { row: 4, col: 4 },
        { row: 4, col: 5 },
        { row: 5, col: 2 },
        { row: 5, col: 3 },
        { row: 5, col: 4 },
        { row: 5, col: 5 },
      ]);
    });
  });

  describe('forAll()', () => {
    it('should call callback as many times as there are cells in range', () => {
      const range = createRange(-1, -1, 2, 2, 5, 5);
      const cells = [];

      range.forAll((row, column) => {
        cells.push([row, column]);
      });

      expect(cells).toEqual([
        [2, 2],
        [2, 3],
        [2, 4],
        [2, 5],
        [3, 2],
        [3, 3],
        [3, 4],
        [3, 5],
        [4, 2],
        [4, 3],
        [4, 4],
        [4, 5],
        [5, 2],
        [5, 3],
        [5, 4],
        [5, 5],
      ]);
    });

    it('should be possible to break a loop after returning `false`', () => {
      const range = createRange(-1, -1, 2, 2, 5, 5);
      const cells = [];

      range.forAll((row, column) => {
        cells.push([row, column]);

        if (column === 5) {
          return false;
        }
      });

      expect(cells).toEqual([
        [2, 2],
        [2, 3],
        [2, 4],
        [2, 5],
      ]);
    });
  });

  describe('getOuterTopLeftCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topLeft = range.getOuterTopLeftCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topLeft = range.getOuterTopLeftCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topLeft = range.getOuterTopLeftCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topLeft = range.getOuterTopLeftCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(5);
    });
  });

  describe('getOuterBottomRightCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomRight = range.getOuterBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomRight = range.getOuterBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomRight = range.getOuterBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomRight = range.getOuterBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(-2);
    });
  });

  describe('getOuterTopRightCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topRight = range.getOuterTopRightCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topRight = range.getOuterTopRightCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topRight = range.getOuterTopRightCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topRight = range.getOuterTopRightCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(-2);
    });
  });

  describe('getOuterBottomLeftCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomLeft = range.getOuterBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomLeft = range.getOuterBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomLeft = range.getOuterBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomLeft = range.getOuterBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });
  });

  describe('getTopLeftCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topLeft = range.getTopLeftCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topLeft = range.getTopLeftCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topLeft = range.getTopLeftCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topLeft = range.getTopLeftCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(5);
    });
  });

  describe('getBottomRightCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomRight = range.getBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomRight = range.getBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomRight = range.getBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomRight = range.getBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(0);
    });
  });

  describe('getTopRightCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topRight = range.getTopRightCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topRight = range.getTopRightCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topRight = range.getTopRightCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topRight = range.getTopRightCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(0);
    });
  });

  describe('getBottomLeftCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomLeft = range.getBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomLeft = range.getBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomLeft = range.getBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomLeft = range.getBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });
  });

  describe('getOuterTopStartCorner()', () => {
    it('should return most top-right corner coordinates including headers - from top-left to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topRight = range.getOuterTopStartCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(-2);
    });

    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topRight = range.getOuterTopStartCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(-2);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topRight = range.getOuterTopStartCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(-2);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topRight = range.getOuterTopStartCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(-2);
    });
  });

  describe('getOuterBottomEndCorner()', () => {
    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomLeft = range.getOuterBottomEndCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });

    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomLeft = range.getOuterBottomEndCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomLeft = range.getOuterBottomEndCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomLeft = range.getOuterBottomEndCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });
  });

  describe('getOuterTopEndCorner()', () => {
    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topLeft = range.getOuterTopEndCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topLeft = range.getOuterTopEndCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topLeft = range.getOuterTopEndCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topLeft = range.getOuterTopEndCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(5);
    });
  });

  describe('getOuterBottomStartCorner()', () => {
    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomRight = range.getOuterBottomStartCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(-2);
    });

    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomRight = range.getOuterBottomStartCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(-2);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomRight = range.getOuterBottomStartCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(-2);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomRight = range.getOuterBottomStartCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(-2);
    });
  });

  describe('getTopStartCorner()', () => {
    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topRight = range.getTopStartCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(0);
    });

    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topRight = range.getTopStartCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(0);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topRight = range.getTopStartCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(0);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topRight = range.getTopStartCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(0);
    });
  });

  describe('getBottomEndCorner()', () => {
    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomLeft = range.getBottomEndCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });

    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomLeft = range.getBottomEndCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomLeft = range.getBottomEndCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomLeft = range.getBottomEndCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(5);
    });
  });

  describe('getTopEndCorner()', () => {
    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topLeft = range.getTopEndCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topLeft = range.getTopEndCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topLeft = range.getTopEndCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topLeft = range.getTopEndCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(5);
    });
  });

  describe('getBottomStartCorner()', () => {
    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomRight = range.getBottomStartCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(0);
    });

    it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomRight = range.getBottomStartCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(0);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomRight = range.getBottomStartCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(0);
    });

    it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomRight = range.getBottomStartCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(0);
    });
  });

  describe('expandByRange()', () => {
    it('should not expand a cell range when the passed range is not bigger than that expanded one', () => {
      const range = createRange(0, 0, 0, 0, 2, 2);
      const newRange = createRange(1, 1, 1, 1, 2, 2);

      expect(range.expandByRange(newRange)).toBe(false);
      expect(range.highlight).toEqual({ row: 0, col: 0 });
      expect(range.from).toEqual({ row: 0, col: 0 });
      expect(range.to).toEqual({ row: 2, col: 2 });
    });

    it('should not expand a cell range when the passed range does not overlap that range', () => {
      const range = createRange(0, 0, 0, 0, 2, 2);
      const newRange = createRange(3, 3, 3, 3, 4, 4);

      expect(range.expandByRange(newRange)).toBe(false);
      expect(range.highlight).toEqual({ row: 0, col: 0 });
      expect(range.from).toEqual({ row: 0, col: 0 });
      expect(range.to).toEqual({ row: 2, col: 2 });
    });

    it('should expand a cell range in top-right direction', () => {
      const range = createRange(1, 1, 1, 1, 3, 3);
      const newRange = createRange(0, 0, 0, 0, 1, 1);

      expect(range.expandByRange(newRange)).toBe(true);
      expect(range.highlight).toEqual({ row: 1, col: 1 });
      expect(range.from).toEqual({ row: 0, col: 0 });
      expect(range.to).toEqual({ row: 3, col: 3 });
    });

    it('should expand a cell range in top-left direction', () => {
      const range = createRange(1, 1, 1, 1, 3, 3);
      const newRange = createRange(0, 3, 0, 3, 1, 4);

      expect(range.expandByRange(newRange)).toBe(true);
      expect(range.highlight).toEqual({ row: 1, col: 1 });
      expect(range.from).toEqual({ row: 0, col: 1 });
      expect(range.to).toEqual({ row: 3, col: 4 });
    });

    it('should expand a cell range in bottom-right direction', () => {
      const range = createRange(1, 1, 1, 1, 3, 3);
      const newRange = createRange(3, 0, 3, 0, 4, 1);

      expect(range.expandByRange(newRange)).toBe(true);
      expect(range.highlight).toEqual({ row: 1, col: 1 });
      expect(range.from).toEqual({ row: 1, col: 0 });
      expect(range.to).toEqual({ row: 4, col: 3 });
    });

    it('should expand a cell range in bottom-left direction', () => {
      const range = createRange(1, 1, 1, 1, 3, 3);
      const newRange = createRange(0, 3, 0, 3, 1, 4);

      expect(range.expandByRange(newRange)).toBe(true);
      expect(range.highlight).toEqual({ row: 1, col: 1 });
      expect(range.from).toEqual({ row: 0, col: 1 });
      expect(range.to).toEqual({ row: 3, col: 4 });
    });
  });
});
