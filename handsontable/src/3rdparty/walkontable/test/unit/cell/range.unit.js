import CellRange from 'walkontable/cell/range';
import CellCoords from 'walkontable/cell/coords';

function createCoordsFactory(isRtl) {
  return (row, column) => new CellCoords(row, column, isRtl);
}

function createRangeFactory(isRtl) {
  const createCoords = createCoordsFactory(isRtl);

  return (highlightRow, highlightCol, fromRow, fromCol, toRow, toCol) => {
    return new CellRange(
      createCoords(highlightRow, highlightCol, isRtl),
      createCoords(fromRow, fromCol, isRtl),
      createCoords(toRow, toCol, isRtl),
      isRtl
    );
  };
}

describe('CellRange', () => {
  const createRange = createRangeFactory();

  describe('constructor()', () => {
    it('should clone each passed coordinates while assigning', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(3, 4);
      const to = new CellCoords(5, 6);
      const range = new CellRange(highlight, from, to);

      expect(range.highlight.row).toBe(0);
      expect(range.highlight.col).toBe(0);
      expect(range.highlight).not.toBe(highlight);
      expect(range.from.row).toBe(from.row);
      expect(range.from.col).toBe(from.col);
      expect(range.from).not.toBe(from);
      expect(range.to.row).toBe(to.row);
      expect(range.to.col).toBe(to.col);
      expect(range.to).not.toBe(to);
    });
  });

  describe('setHighlight()', () => {
    it('should clone the coordinates object while assigning', () => {
      const highlight = new CellCoords(-1, 6);
      const range = new CellRange(new CellCoords());

      range.setHighlight(highlight);

      expect(range.highlight.row).toBe(0);
      expect(range.highlight.col).toBe(6);
      expect(range.highlight).not.toBe(highlight);
    });
  });

  describe('setFrom()', () => {
    it('should clone the coordinates object while assigning', () => {
      const from = new CellCoords(-1, 6);
      const range = new CellRange(new CellCoords());

      range.setFrom(from);

      expect(range.from.row).toBe(from.row);
      expect(range.from.col).toBe(from.col);
      expect(range.from).not.toBe(from);
    });
  });

  describe('setTo()', () => {
    it('should clone the coordinates object while assigning', () => {
      const to = new CellCoords(-1, 6);
      const range = new CellRange(new CellCoords());

      range.setTo(to);

      expect(range.to.row).toBe(to.row);
      expect(range.to.col).toBe(to.col);
      expect(range.to).not.toBe(to);
    });
  });

  describe('getHeight()', () => {
    it('should return range hight ignoring the negative values (headers) - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -2, 1, 5, 5);

      expect(range.getHeight()).toBe(6);
    });

    it('should return range hight ignoring the negative values (headers) - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -2, 5, 5, 1);

      expect(range.getHeight()).toBe(6);
    });

    it('should return range hight ignoring the negative values (headers) - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 1, -2, 5);

      expect(range.getHeight()).toBe(6);
    });

    it('should return range hight ignoring the negative values (headers) - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -2, 1);

      expect(range.getHeight()).toBe(6);
    });
  });

  describe('getWidth()', () => {
    it('should return range width ignoring the negative values (headers) - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, 1, -2, 5, 5);

      expect(range.getWidth()).toBe(6);
    });

    it('should return range width ignoring the negative values (headers) - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, 1, 5, 5, -2);

      expect(range.getWidth()).toBe(6);
    });

    it('should return range width ignoring the negative values (headers) - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, 1, 5);

      expect(range.getWidth()).toBe(6);
    });

    it('should return range width ignoring the negative values (headers) - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, 1, -2);

      expect(range.getWidth()).toBe(6);
    });
  });

  describe('getCellsCount()', () => {
    it('should return correct cells count ignoring the negative values (headers)', () => {
      const range = createRange(-1, -2, 1, -2, 5, 5);

      expect(range.getCellsCount()).toBe(30);
    });

    it('should return correct cells count for selection in the middle of the coordinate space', () => {
      const range = createRange(1, 1, 1, 1, 5, 5);

      expect(range.getCellsCount()).toBe(25);
    });

    it('should return 1 for singular cell\'s selection', () => {
      const range = createRange(0, 0, 0, 0, 0, 0);

      expect(range.getCellsCount()).toBe(1);
    });
  });

  describe('getOuterHeight()', () => {
    it('should return range hight including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -2, 1, 5, 5);

      expect(range.getOuterHeight()).toBe(8);
    });

    it('should return range hight including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -2, 5, 5, 1);

      expect(range.getOuterHeight()).toBe(8);
    });

    it('should return range hight including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, 1, -2, 5);

      expect(range.getOuterHeight()).toBe(8);
    });

    it('should return range hight including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -2, 1);

      expect(range.getOuterHeight()).toBe(8);
    });
  });

  describe('getOuterWidth()', () => {
    it('should return range width including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, 1, -2, 5, 5);

      expect(range.getOuterWidth()).toBe(8);
    });

    it('should return range width including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, 1, 5, 5, -2);

      expect(range.getOuterWidth()).toBe(8);
    });

    it('should return range width including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, 1, 5);

      expect(range.getOuterWidth()).toBe(8);
    });

    it('should return range width including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, 1, -2);

      expect(range.getOuterWidth()).toBe(8);
    });
  });

  describe('getOuterTopLeftCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topLeft = range.getOuterTopLeftCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topLeft = range.getOuterTopLeftCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topLeft = range.getOuterTopLeftCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topLeft = range.getOuterTopLeftCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(-2);
    });
  });

  describe('getOuterBottomRightCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomRight = range.getOuterBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomRight = range.getOuterBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomRight = range.getOuterBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomRight = range.getOuterBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });
  });

  describe('getOuterTopRightCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topRight = range.getOuterTopRightCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topRight = range.getOuterTopRightCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topRight = range.getOuterTopRightCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topRight = range.getOuterTopRightCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(5);
    });
  });

  describe('getOuterBottomLeftCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomLeft = range.getOuterBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomLeft = range.getOuterBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomLeft = range.getOuterBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomLeft = range.getOuterBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(-2);
    });
  });

  describe('getTopLeftCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topLeft = range.getTopLeftCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topLeft = range.getTopLeftCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topLeft = range.getTopLeftCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topLeft = range.getTopLeftCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(0);
    });
  });

  describe('getBottomRightCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomRight = range.getBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomRight = range.getBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomRight = range.getBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomRight = range.getBottomRightCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });
  });

  describe('getTopRightCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topRight = range.getTopRightCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topRight = range.getTopRightCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topRight = range.getTopRightCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topRight = range.getTopRightCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(5);
    });
  });

  describe('getBottomLeftCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomLeft = range.getBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomLeft = range.getBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomLeft = range.getBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomLeft = range.getBottomLeftCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(0);
    });
  });

  describe('getOuterTopStartCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topLeft = range.getOuterTopStartCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topLeft = range.getOuterTopStartCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topLeft = range.getOuterTopStartCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topLeft = range.getOuterTopStartCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(-2);
    });
  });

  describe('getOuterBottomEndCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomRight = range.getOuterBottomEndCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomRight = range.getOuterBottomEndCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomRight = range.getOuterBottomEndCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomRight = range.getOuterBottomEndCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });
  });

  describe('getOuterTopEndCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topRight = range.getOuterTopEndCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topRight = range.getOuterTopEndCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topRight = range.getOuterTopEndCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topRight = range.getOuterTopEndCorner();

      expect(topRight.row).toBe(-1);
      expect(topRight.col).toBe(5);
    });
  });

  describe('getOuterBottomStartCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomLeft = range.getOuterBottomStartCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomLeft = range.getOuterBottomStartCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomLeft = range.getOuterBottomStartCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomLeft = range.getOuterBottomStartCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(-2);
    });
  });

  describe('getTopStartCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topLeft = range.getTopStartCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topLeft = range.getTopStartCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topLeft = range.getTopStartCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topLeft = range.getTopStartCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(0);
    });
  });

  describe('getBottomEndCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomRight = range.getBottomEndCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomRight = range.getBottomEndCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomRight = range.getBottomEndCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomRight = range.getBottomEndCorner();

      expect(bottomRight.row).toBe(5);
      expect(bottomRight.col).toBe(5);
    });
  });

  describe('getTopEndCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const topRight = range.getTopEndCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const topRight = range.getTopEndCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const topRight = range.getTopEndCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const topRight = range.getTopEndCorner();

      expect(topRight.row).toBe(0);
      expect(topRight.col).toBe(5);
    });
  });

  describe('getBottomStartCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const range = createRange(-1, -2, -1, -2, 5, 5);
      const bottomLeft = range.getBottomStartCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const range = createRange(-1, -2, -1, 5, 5, -2);
      const bottomLeft = range.getBottomStartCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const range = createRange(-1, -2, 5, -2, -1, 5);
      const bottomLeft = range.getBottomStartCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const range = createRange(-1, -2, 5, 5, -1, -2);
      const bottomLeft = range.getBottomStartCorner();

      expect(bottomLeft.row).toBe(5);
      expect(bottomLeft.col).toBe(0);
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

    it('should expand a cell range in top-left direction', () => {
      const range = createRange(1, 1, 1, 1, 3, 3);
      const newRange = createRange(0, 0, 0, 0, 1, 1);

      expect(range.expandByRange(newRange)).toBe(true);
      expect(range.highlight).toEqual({ row: 1, col: 1 });
      expect(range.from).toEqual({ row: 0, col: 0 });
      expect(range.to).toEqual({ row: 3, col: 3 });
    });

    it('should expand a cell range in top-right direction', () => {
      const range = createRange(1, 1, 1, 1, 3, 3);
      const newRange = createRange(0, 3, 0, 3, 1, 4);

      expect(range.expandByRange(newRange)).toBe(true);
      expect(range.highlight).toEqual({ row: 1, col: 1 });
      expect(range.from).toEqual({ row: 0, col: 1 });
      expect(range.to).toEqual({ row: 3, col: 4 });
    });

    it('should expand a cell range in bottom-left direction', () => {
      const range = createRange(1, 1, 1, 1, 3, 3);
      const newRange = createRange(3, 0, 3, 0, 4, 1);

      expect(range.expandByRange(newRange)).toBe(true);
      expect(range.highlight).toEqual({ row: 1, col: 1 });
      expect(range.from).toEqual({ row: 1, col: 0 });
      expect(range.to).toEqual({ row: 4, col: 3 });
    });

    it('should expand a cell range in bottom-right direction', () => {
      const range = createRange(1, 1, 1, 1, 3, 3);
      const newRange = createRange(0, 3, 0, 3, 1, 4);

      expect(range.expandByRange(newRange)).toBe(true);
      expect(range.highlight).toEqual({ row: 1, col: 1 });
      expect(range.from).toEqual({ row: 0, col: 1 });
      expect(range.to).toEqual({ row: 3, col: 4 });
    });
  });

  describe('isSingle()', () => {
    it('should return `true` when `from` and `to` are equals and there is no header selected', () => {
      {
        const range = createRange(0, 0, 4, 5, 4, 5);

        expect(range.isSingle()).toBe(true);
      }
      {
        const range = createRange(0, 0, 0, 0, 0, 0);

        expect(range.isSingle()).toBe(true);
      }
    });

    it('should return `false` when `from` and `to` are equals and there is header selected', () => {
      {
        const range = createRange(0, 0, -1, 0, -1, 0);

        expect(range.isSingle()).toBe(false);
      }
      {
        const range = createRange(0, 0, 0, -1, 0, -1);

        expect(range.isSingle()).toBe(false);
      }
      {
        const range = createRange(0, 0, 0, -1, -1, 0);

        expect(range.isSingle()).toBe(false);
      }
    });

    it('should return `false` when `from` and `to` are not equal', () => {
      {
        const range = createRange(0, 0, 0, 0, -1, 0);

        expect(range.isSingle()).toBe(false);
      }
      {
        const range = createRange(0, 0, 0, 0, 0, 1);

        expect(range.isSingle()).toBe(false);
      }
      {
        const range = createRange(0, 0, 0, 0, 1, 0);

        expect(range.isSingle()).toBe(false);
      }
      {
        const range = createRange(0, 0, 0, 0, 1, 1);

        expect(range.isSingle()).toBe(false);
      }
      {
        const range = createRange(0, 0, -1, 0, 0, 0);

        expect(range.isSingle()).toBe(false);
      }
      {
        const range = createRange(0, 0, 0, 1, 0, 0);

        expect(range.isSingle()).toBe(false);
      }
      {
        const range = createRange(0, 0, 1, 0, 0, 0);

        expect(range.isSingle()).toBe(false);
      }
      {
        const range = createRange(0, 0, 1, 1, 0, 0);

        expect(range.isSingle()).toBe(false);
      }
    });
  });

  describe('clone()', () => {
    it('should clone the object', () => {
      const range = createRange(-1, -2, -1, 5, 5, 2);
      const clone = range.clone();

      expect(clone).not.toBe(range);
      expect(clone.highlight).not.toBe(range.highlight);
      expect(clone.highlight.row).toBe(range.highlight.row);
      expect(clone.highlight.col).toBe(range.highlight.col);
      expect(clone.from).not.toBe(range.from);
      expect(clone.from.row).toBe(range.from.row);
      expect(clone.from.col).toBe(range.from.col);
      expect(clone.to).not.toBe(range.to);
      expect(clone.to.row).toBe(range.to.row);
      expect(clone.to.col).toBe(range.to.col);
    });
  });

  describe('RTL mode', () => {
    const createRangeRTL = createRangeFactory(true);

    describe('getOuterTopLeftCorner()', () => {
      it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const topLeft = range.getOuterTopLeftCorner();

        expect(topLeft.row).toBe(-1);
        expect(topLeft.col).toBe(5);
      });

      it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const topLeft = range.getOuterTopLeftCorner();

        expect(topLeft.row).toBe(-1);
        expect(topLeft.col).toBe(5);
      });

      it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const topLeft = range.getOuterTopLeftCorner();

        expect(topLeft.row).toBe(-1);
        expect(topLeft.col).toBe(5);
      });

      it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const topLeft = range.getOuterTopLeftCorner();

        expect(topLeft.row).toBe(-1);
        expect(topLeft.col).toBe(5);
      });
    });

    describe('getOuterBottomRightCorner()', () => {
      it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const bottomRight = range.getOuterBottomRightCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(-2);
      });

      it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const bottomRight = range.getOuterBottomRightCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(-2);
      });

      it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const bottomRight = range.getOuterBottomRightCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(-2);
      });

      it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const bottomRight = range.getOuterBottomRightCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(-2);
      });
    });

    describe('getOuterTopRightCorner()', () => {
      it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const topRight = range.getOuterTopRightCorner();

        expect(topRight.row).toBe(-1);
        expect(topRight.col).toBe(-2);
      });

      it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const topRight = range.getOuterTopRightCorner();

        expect(topRight.row).toBe(-1);
        expect(topRight.col).toBe(-2);
      });

      it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const topRight = range.getOuterTopRightCorner();

        expect(topRight.row).toBe(-1);
        expect(topRight.col).toBe(-2);
      });

      it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const topRight = range.getOuterTopRightCorner();

        expect(topRight.row).toBe(-1);
        expect(topRight.col).toBe(-2);
      });
    });

    describe('getOuterBottomLeftCorner()', () => {
      it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const bottomLeft = range.getOuterBottomLeftCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });

      it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const bottomLeft = range.getOuterBottomLeftCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });

      it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const bottomLeft = range.getOuterBottomLeftCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });

      it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const bottomLeft = range.getOuterBottomLeftCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });
    });

    describe('getTopLeftCorner()', () => {
      it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const topLeft = range.getTopLeftCorner();

        expect(topLeft.row).toBe(0);
        expect(topLeft.col).toBe(5);
      });

      it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const topLeft = range.getTopLeftCorner();

        expect(topLeft.row).toBe(0);
        expect(topLeft.col).toBe(5);
      });

      it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const topLeft = range.getTopLeftCorner();

        expect(topLeft.row).toBe(0);
        expect(topLeft.col).toBe(5);
      });

      it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const topLeft = range.getTopLeftCorner();

        expect(topLeft.row).toBe(0);
        expect(topLeft.col).toBe(5);
      });
    });

    describe('getBottomRightCorner()', () => {
      it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const bottomRight = range.getBottomRightCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(0);
      });

      it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const bottomRight = range.getBottomRightCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(0);
      });

      it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const bottomRight = range.getBottomRightCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(0);
      });

      it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const bottomRight = range.getBottomRightCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(0);
      });
    });

    describe('getTopRightCorner()', () => {
      it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const topRight = range.getTopRightCorner();

        expect(topRight.row).toBe(0);
        expect(topRight.col).toBe(0);
      });

      it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const topRight = range.getTopRightCorner();

        expect(topRight.row).toBe(0);
        expect(topRight.col).toBe(0);
      });

      it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const topRight = range.getTopRightCorner();

        expect(topRight.row).toBe(0);
        expect(topRight.col).toBe(0);
      });

      it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const topRight = range.getTopRightCorner();

        expect(topRight.row).toBe(0);
        expect(topRight.col).toBe(0);
      });
    });

    describe('getBottomLeftCorner()', () => {
      it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const bottomLeft = range.getBottomLeftCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });

      it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const bottomLeft = range.getBottomLeftCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });

      it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const bottomLeft = range.getBottomLeftCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });

      it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const bottomLeft = range.getBottomLeftCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });
    });

    describe('getOuterTopStartCorner()', () => {
      it('should return most top-right corner coordinates including headers - from top-left to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const topRight = range.getOuterTopStartCorner();

        expect(topRight.row).toBe(-1);
        expect(topRight.col).toBe(-2);
      });

      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const topRight = range.getOuterTopStartCorner();

        expect(topRight.row).toBe(-1);
        expect(topRight.col).toBe(-2);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const topRight = range.getOuterTopStartCorner();

        expect(topRight.row).toBe(-1);
        expect(topRight.col).toBe(-2);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const topRight = range.getOuterTopStartCorner();

        expect(topRight.row).toBe(-1);
        expect(topRight.col).toBe(-2);
      });
    });

    describe('getOuterBottomEndCorner()', () => {
      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const bottomLeft = range.getOuterBottomEndCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });

      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const bottomLeft = range.getOuterBottomEndCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const bottomLeft = range.getOuterBottomEndCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const bottomLeft = range.getOuterBottomEndCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });
    });

    describe('getOuterTopEndCorner()', () => {
      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const topLeft = range.getOuterTopEndCorner();

        expect(topLeft.row).toBe(-1);
        expect(topLeft.col).toBe(5);
      });

      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const topLeft = range.getOuterTopEndCorner();

        expect(topLeft.row).toBe(-1);
        expect(topLeft.col).toBe(5);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const topLeft = range.getOuterTopEndCorner();

        expect(topLeft.row).toBe(-1);
        expect(topLeft.col).toBe(5);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const topLeft = range.getOuterTopEndCorner();

        expect(topLeft.row).toBe(-1);
        expect(topLeft.col).toBe(5);
      });
    });

    describe('getOuterBottomStartCorner()', () => {
      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const bottomRight = range.getOuterBottomStartCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(-2);
      });

      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const bottomRight = range.getOuterBottomStartCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(-2);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const bottomRight = range.getOuterBottomStartCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(-2);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const bottomRight = range.getOuterBottomStartCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(-2);
      });
    });

    describe('getTopStartCorner()', () => {
      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const topRight = range.getTopStartCorner();

        expect(topRight.row).toBe(0);
        expect(topRight.col).toBe(0);
      });

      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const topRight = range.getTopStartCorner();

        expect(topRight.row).toBe(0);
        expect(topRight.col).toBe(0);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const topRight = range.getTopStartCorner();

        expect(topRight.row).toBe(0);
        expect(topRight.col).toBe(0);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const topRight = range.getTopStartCorner();

        expect(topRight.row).toBe(0);
        expect(topRight.col).toBe(0);
      });
    });

    describe('getBottomEndCorner()', () => {
      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const bottomLeft = range.getBottomEndCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });

      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const bottomLeft = range.getBottomEndCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const bottomLeft = range.getBottomEndCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const bottomLeft = range.getBottomEndCorner();

        expect(bottomLeft.row).toBe(5);
        expect(bottomLeft.col).toBe(5);
      });
    });

    describe('getTopEndCorner()', () => {
      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const topLeft = range.getTopEndCorner();

        expect(topLeft.row).toBe(0);
        expect(topLeft.col).toBe(5);
      });

      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const topLeft = range.getTopEndCorner();

        expect(topLeft.row).toBe(0);
        expect(topLeft.col).toBe(5);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const topLeft = range.getTopEndCorner();

        expect(topLeft.row).toBe(0);
        expect(topLeft.col).toBe(5);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const topLeft = range.getTopEndCorner();

        expect(topLeft.row).toBe(0);
        expect(topLeft.col).toBe(5);
      });
    });

    describe('getBottomStartCorner()', () => {
      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, -2, 5, 5);
        const bottomRight = range.getBottomStartCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(0);
      });

      it('should return most top-right corner coordinates including headers - from top-right to bottom-left', () => {
        const range = createRangeRTL(-1, -2, -1, 5, 5, -2);
        const bottomRight = range.getBottomStartCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(0);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, -2, -1, 5);
        const bottomRight = range.getBottomStartCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(0);
      });

      it('should return most top-right corner coordinates including headers - from bottom-left to top-right', () => {
        const range = createRangeRTL(-1, -2, 5, 5, -1, -2);
        const bottomRight = range.getBottomStartCorner();

        expect(bottomRight.row).toBe(5);
        expect(bottomRight.col).toBe(0);
      });
    });

    describe('expandByRange()', () => {
      it('should not expand a cell range when the passed range is not bigger than that expanded one', () => {
        const range = createRangeRTL(0, 0, 0, 0, 2, 2);
        const newRange = createRangeRTL(1, 1, 1, 1, 2, 2);

        expect(range.expandByRange(newRange)).toBe(false);
        expect(range.highlight).toEqual({ row: 0, col: 0 });
        expect(range.from).toEqual({ row: 0, col: 0 });
        expect(range.to).toEqual({ row: 2, col: 2 });
      });

      it('should not expand a cell range when the passed range does not overlap that range', () => {
        const range = createRangeRTL(0, 0, 0, 0, 2, 2);
        const newRange = createRangeRTL(3, 3, 3, 3, 4, 4);

        expect(range.expandByRange(newRange)).toBe(false);
        expect(range.highlight).toEqual({ row: 0, col: 0 });
        expect(range.from).toEqual({ row: 0, col: 0 });
        expect(range.to).toEqual({ row: 2, col: 2 });
      });

      it('should expand a cell range in top-right direction', () => {
        const range = createRangeRTL(1, 1, 1, 1, 3, 3);
        const newRange = createRangeRTL(0, 0, 0, 0, 1, 1);

        expect(range.expandByRange(newRange)).toBe(true);
        expect(range.highlight).toEqual({ row: 1, col: 1 });
        expect(range.from).toEqual({ row: 0, col: 0 });
        expect(range.to).toEqual({ row: 3, col: 3 });
      });

      it('should expand a cell range in top-left direction', () => {
        const range = createRangeRTL(1, 1, 1, 1, 3, 3);
        const newRange = createRangeRTL(0, 3, 0, 3, 1, 4);

        expect(range.expandByRange(newRange)).toBe(true);
        expect(range.highlight).toEqual({ row: 1, col: 1 });
        expect(range.from).toEqual({ row: 0, col: 1 });
        expect(range.to).toEqual({ row: 3, col: 4 });
      });

      it('should expand a cell range in bottom-right direction', () => {
        const range = createRangeRTL(1, 1, 1, 1, 3, 3);
        const newRange = createRangeRTL(3, 0, 3, 0, 4, 1);

        expect(range.expandByRange(newRange)).toBe(true);
        expect(range.highlight).toEqual({ row: 1, col: 1 });
        expect(range.from).toEqual({ row: 1, col: 0 });
        expect(range.to).toEqual({ row: 4, col: 3 });
      });

      it('should expand a cell range in bottom-left direction', () => {
        const range = createRangeRTL(1, 1, 1, 1, 3, 3);
        const newRange = createRangeRTL(0, 3, 0, 3, 1, 4);

        expect(range.expandByRange(newRange)).toBe(true);
        expect(range.highlight).toEqual({ row: 1, col: 1 });
        expect(range.from).toEqual({ row: 0, col: 1 });
        expect(range.to).toEqual({ row: 3, col: 4 });
      });
    });
  });
});
