import CellRange from 'walkontable/cell/range';
import CellCoords from 'walkontable/cell/coords';

describe('CellRange', () => {
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

  describe('getInnerHeight()', () => {
    it('should return range hight ignoring the negative values (headers) - from top-left to bottom-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-2, 1);
      const to = new CellCoords(5, 5);
      const range = new CellRange(highlight, from, to);

      expect(range.getInnerHeight()).toBe(6);
    });

    it('should return range hight ignoring the negative values (headers) - from top-right to bottom-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-2, 5);
      const to = new CellCoords(5, 1);
      const range = new CellRange(highlight, from, to);

      expect(range.getInnerHeight()).toBe(6);
    });

    it('should return range hight ignoring the negative values (headers) - from bottom-left to top-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 1);
      const to = new CellCoords(-2, 5);
      const range = new CellRange(highlight, from, to);

      expect(range.getInnerHeight()).toBe(6);
    });

    it('should return range hight ignoring the negative values (headers) - from bottom-right to top-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 5);
      const to = new CellCoords(-2, 1);
      const range = new CellRange(highlight, from, to);

      expect(range.getInnerHeight()).toBe(6);
    });
  });

  describe('getInnerWidth()', () => {
    it('should return range width ignoring the negative values (headers) - from top-left to bottom-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(1, -2);
      const to = new CellCoords(5, 5);
      const range = new CellRange(highlight, from, to);

      expect(range.getInnerWidth()).toBe(6);
    });

    it('should return range width ignoring the negative values (headers) - from top-right to bottom-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(1, 5);
      const to = new CellCoords(5, -2);
      const range = new CellRange(highlight, from, to);

      expect(range.getInnerWidth()).toBe(6);
    });

    it('should return range width ignoring the negative values (headers) - from bottom-left to top-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, -2);
      const to = new CellCoords(1, 5);
      const range = new CellRange(highlight, from, to);

      expect(range.getInnerWidth()).toBe(6);
    });

    it('should return range width ignoring the negative values (headers) - from bottom-right to top-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 5);
      const to = new CellCoords(1, -2);
      const range = new CellRange(highlight, from, to);

      expect(range.getInnerWidth()).toBe(6);
    });
  });

  describe('getHeight()', () => {
    it('should return range hight ignoring the negative values (headers) - from top-left to bottom-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-2, 1);
      const to = new CellCoords(5, 5);
      const range = new CellRange(highlight, from, to);

      expect(range.getHeight()).toBe(8);
    });

    it('should return range hight ignoring the negative values (headers) - from top-right to bottom-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-2, 5);
      const to = new CellCoords(5, 1);
      const range = new CellRange(highlight, from, to);

      expect(range.getHeight()).toBe(8);
    });

    it('should return range hight ignoring the negative values (headers) - from bottom-left to top-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 1);
      const to = new CellCoords(-2, 5);
      const range = new CellRange(highlight, from, to);

      expect(range.getHeight()).toBe(8);
    });

    it('should return range hight ignoring the negative values (headers) - from bottom-right to top-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 5);
      const to = new CellCoords(-2, 1);
      const range = new CellRange(highlight, from, to);

      expect(range.getHeight()).toBe(8);
    });
  });

  describe('getInnerWidth()', () => {
    it('should return range width ignoring the negative values (headers) - from top-left to bottom-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(1, -2);
      const to = new CellCoords(5, 5);
      const range = new CellRange(highlight, from, to);

      expect(range.getInnerWidth()).toBe(6);
    });

    it('should return range width ignoring the negative values (headers) - from top-right to bottom-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(1, 5);
      const to = new CellCoords(5, -2);
      const range = new CellRange(highlight, from, to);

      expect(range.getInnerWidth()).toBe(6);
    });

    it('should return range width ignoring the negative values (headers) - from bottom-left to top-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, -2);
      const to = new CellCoords(1, 5);
      const range = new CellRange(highlight, from, to);

      expect(range.getInnerWidth()).toBe(6);
    });

    it('should return range width ignoring the negative values (headers) - from bottom-right to top-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 5);
      const to = new CellCoords(1, -2);
      const range = new CellRange(highlight, from, to);

      expect(range.getInnerWidth()).toBe(6);
    });
  });

  describe('getWidth()', () => {
    it('should return range width ignoring the negative values (headers) - from top-left to bottom-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(1, -2);
      const to = new CellCoords(5, 5);
      const range = new CellRange(highlight, from, to);

      expect(range.getWidth()).toBe(8);
    });

    it('should return range width ignoring the negative values (headers) - from top-right to bottom-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(1, 5);
      const to = new CellCoords(5, -2);
      const range = new CellRange(highlight, from, to);

      expect(range.getWidth()).toBe(8);
    });

    it('should return range width ignoring the negative values (headers) - from bottom-left to top-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, -2);
      const to = new CellCoords(1, 5);
      const range = new CellRange(highlight, from, to);

      expect(range.getWidth()).toBe(8);
    });

    it('should return range width ignoring the negative values (headers) - from bottom-right to top-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 5);
      const to = new CellCoords(1, -2);
      const range = new CellRange(highlight, from, to);

      expect(range.getWidth()).toBe(8);
    });
  });

  describe('getOuterTopLeftCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, -2);
      const to = new CellCoords(5, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterTopLeftCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, 5);
      const to = new CellCoords(5, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterTopLeftCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, -2);
      const to = new CellCoords(-1, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterTopLeftCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 5);
      const to = new CellCoords(-1, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterTopLeftCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(-2);
    });
  });

  describe('getOuterBottomRightCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, -2);
      const to = new CellCoords(5, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterBottomRightCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, 5);
      const to = new CellCoords(5, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterBottomRightCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, -2);
      const to = new CellCoords(-1, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterBottomRightCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 5);
      const to = new CellCoords(-1, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterBottomRightCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(5);
    });
  });

  describe('getOuterTopRightCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, -2);
      const to = new CellCoords(5, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterTopRightCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, 5);
      const to = new CellCoords(5, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterTopRightCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, -2);
      const to = new CellCoords(-1, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterTopRightCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 5);
      const to = new CellCoords(-1, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterTopRightCorner();

      expect(topLeft.row).toBe(-1);
      expect(topLeft.col).toBe(5);
    });
  });

  describe('getOuterBottomLeftCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, -2);
      const to = new CellCoords(5, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterBottomLeftCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, 5);
      const to = new CellCoords(5, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterBottomLeftCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, -2);
      const to = new CellCoords(-1, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterBottomLeftCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(-2);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 5);
      const to = new CellCoords(-1, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getOuterBottomLeftCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(-2);
    });
  });

  describe('getTopLeftCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, -2);
      const to = new CellCoords(5, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getTopLeftCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, 5);
      const to = new CellCoords(5, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getTopLeftCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, -2);
      const to = new CellCoords(-1, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getTopLeftCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 5);
      const to = new CellCoords(-1, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getTopLeftCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(0);
    });
  });

  describe('getBottomRightCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, -2);
      const to = new CellCoords(5, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getBottomRightCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, 5);
      const to = new CellCoords(5, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getBottomRightCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, -2);
      const to = new CellCoords(-1, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getBottomRightCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 5);
      const to = new CellCoords(-1, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getBottomRightCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(5);
    });
  });

  describe('getTopRightCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, -2);
      const to = new CellCoords(5, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getTopRightCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, 5);
      const to = new CellCoords(5, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getTopRightCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, -2);
      const to = new CellCoords(-1, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getTopRightCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(5);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 5);
      const to = new CellCoords(-1, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getTopRightCorner();

      expect(topLeft.row).toBe(0);
      expect(topLeft.col).toBe(5);
    });
  });

  describe('getBottomLeftCorner()', () => {
    it('should return most top-left corner coordinates including headers - from top-left to bottom-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, -2);
      const to = new CellCoords(5, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getBottomLeftCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from top-right to bottom-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(-1, 5);
      const to = new CellCoords(5, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getBottomLeftCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-left to top-right', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, -2);
      const to = new CellCoords(-1, 5);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getBottomLeftCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(0);
    });

    it('should return most top-left corner coordinates including headers - from bottom-right to top-left', () => {
      const highlight = new CellCoords(-1, -2);
      const from = new CellCoords(5, 5);
      const to = new CellCoords(-1, -2);
      const range = new CellRange(highlight, from, to);

      const topLeft = range.getBottomLeftCorner();

      expect(topLeft.row).toBe(5);
      expect(topLeft.col).toBe(0);
    });
  });
});
