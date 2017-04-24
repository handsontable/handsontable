describe('Walkontable.CellRange', () => {
  describe('getAll', () => {
    it('should get all cells in range', () => {
      var from = new Walkontable.CellCoords(1, 1);
      var to = new Walkontable.CellCoords(3, 3);
      var range = new Walkontable.CellRange(from, from, to);
      var all = range.getAll();
      expect(all.length).toBe(9);
      expect(all[0].row).toBe(from.row);
      expect(all[0].col).toBe(from.col);
      expect(all[1].row).toBe(1);
      expect(all[1].col).toBe(2);
      expect(all[8].row).toBe(to.row);
      expect(all[8].col).toBe(to.col);
    });

    it('should get all cells in range (reverse order)', () => {
      var from = new Walkontable.CellCoords(3, 3);
      var to = new Walkontable.CellCoords(1, 1);
      var range = new Walkontable.CellRange(from, from, to);
      var all = range.getAll();
      expect(all.length).toBe(9);
      expect(all[0].row).toBe(to.row);
      expect(all[0].col).toBe(to.col);
      expect(all[1].row).toBe(1);
      expect(all[1].col).toBe(2);
      expect(all[8].row).toBe(from.row);
      expect(all[8].col).toBe(from.col);
    });
  });

  describe('getInner', () => {
    it('should get cells in range excluding from and to', () => {
      var from = new Walkontable.CellCoords(1, 1);
      var to = new Walkontable.CellCoords(3, 3);
      var range = new Walkontable.CellRange(from, from, to);
      var inner = range.getInner();
      expect(inner.length).toBe(7);
      expect(inner[1].row).toBe(1);
      expect(inner[1].col).toBe(3);
    });

    it('should get cells in range excluding from and to (reverse order)', () => {
      var from = new Walkontable.CellCoords(3, 3);
      var to = new Walkontable.CellCoords(1, 1);
      var range = new Walkontable.CellRange(from, from, to);
      var inner = range.getInner();
      expect(inner.length).toBe(7);
      expect(inner[1].row).toBe(1);
      expect(inner[1].col).toBe(3);
    });
  });

  describe('includes', () => {
    it('should return true if range is a single cell and the same cell is given', () => {
      var from = new Walkontable.CellCoords(0, 0);
      var to = new Walkontable.CellCoords(0, 0);
      var range = new Walkontable.CellRange(from, from, to);
      expect(range.includes(new Walkontable.CellCoords(0, 0))).toBe(true);
    });

    it('should return true if given cell is within the range', () => {
      var from = new Walkontable.CellCoords(1, 1);
      var to = new Walkontable.CellCoords(3, 3);
      var range = new Walkontable.CellRange(from, from, to);
      expect(range.includes(new Walkontable.CellCoords(1, 1))).toBe(true);
      expect(range.includes(new Walkontable.CellCoords(3, 1))).toBe(true);
      expect(range.includes(new Walkontable.CellCoords(3, 3))).toBe(true);
      expect(range.includes(new Walkontable.CellCoords(1, 3))).toBe(true);
      expect(range.includes(new Walkontable.CellCoords(2, 2))).toBe(true);
      expect(range.includes(new Walkontable.CellCoords(1, 2))).toBe(true);
      expect(range.includes(new Walkontable.CellCoords(2, 1))).toBe(true);
    });

    it('should return false if given cell outside the range', () => {
      var from = new Walkontable.CellCoords(1, 1);
      var to = new Walkontable.CellCoords(3, 3);
      var range = new Walkontable.CellRange(from, from, to);
      expect(range.includes(new Walkontable.CellCoords(0, 0))).toBe(false);
      expect(range.includes(new Walkontable.CellCoords(4, 4))).toBe(false);
      expect(range.includes(new Walkontable.CellCoords(1, 4))).toBe(false);
      expect(range.includes(new Walkontable.CellCoords(4, 1))).toBe(false);
      expect(range.includes(new Walkontable.CellCoords(-1, -1))).toBe(false);
    });
  });

  describe('includesRange', () => {
    describe('B has more than one cell', () => {
      /*
       +----------+
       |  a       |
       | +------+ |
       | |    b | |
       | |      | |
       | +------+ |
       +----------+
       */
      it('B is included in A, none of borders touch each other', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 1);
        var bBottomRight = new Walkontable.CellCoords(4, 4);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       |  b       |
       | +------+ |
       | |   a  | |
       | |      | |
       | +------+ |
       +----------+
       */
      it('A is included in B, none of borders touch each other', () => {
        var aTopLeft = new Walkontable.CellCoords(1, 1);
        var aBottomRight = new Walkontable.CellCoords(4, 4);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 0);
        var bBottomRight = new Walkontable.CellCoords(5, 4);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(false);
      });

      /*
       +-----------+
       | a |   b | |
       |   |     | |
       |   +-----+ |
       +-----------+
       */
      it('B is included in A, top borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 1);
        var bBottomRight = new Walkontable.CellCoords(4, 4);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +---------+
       | a |   b |
       |   |     |
       |   +-----|
       |         |
       +---------+
       */
      it('B is included in A, top and right borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 1);
        var bBottomRight = new Walkontable.CellCoords(4, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +---------+
       |   +-----|
       | a |   b |
       |   |     |
       |   +-----|
       +---------+
       */
      it('B is included in A, right borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 1);
        var bBottomRight = new Walkontable.CellCoords(4, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +---------+
       |   +-----|
       | a |   b |
       |   |     |
       +---------+
       */
      it('B is included in A, bottom and right borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 1);
        var bBottomRight = new Walkontable.CellCoords(5, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +-----------+
       |   +-----+ |
       | a |   b | |
       |   |     | |
       +-----------+
       */
      it('B is included in A, bottom borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 1);
        var bBottomRight = new Walkontable.CellCoords(5, 4);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +-----------+
       |-----+   a |
       |   b |     |
       |     |     |
       +-----------+
       */
      it('B is included in A, bottom and left borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 0);
        var bBottomRight = new Walkontable.CellCoords(5, 4);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +-----------+
       |-----+   a |
       |   b |     |
       |     |     |
       |-----+     |
       +-----------+
       */
      it('B is included in A, left borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 0);
        var bBottomRight = new Walkontable.CellCoords(4, 4);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +-----------+
       |   b |   a |
       |     |     |
       |-----+     |
       +-----------+
       */
      it('B is included in A, top and left borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 0);
        var bBottomRight = new Walkontable.CellCoords(4, 4);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +------------+
       |  a |   b | |
       |    |     | |
       +------------+
       */
      it('B is included in A, top and bottom borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 1);
        var bBottomRight = new Walkontable.CellCoords(5, 4);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       |  a |   b |
       |    |     |
       +----------+
       */
      it('B is included in A, top, right and bottom borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 1);
        var bBottomRight = new Walkontable.CellCoords(5, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       |  b |   a |
       |    |     |
       +----------+
       */
      it('B is included in A, top, left and bottom borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 0);
        var bBottomRight = new Walkontable.CellCoords(5, 4);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       | a        |
       |----------|
       |  b       |
       |----------|
       +----------+
       */
      it('B is included in A, left and right borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 0);
        var bBottomRight = new Walkontable.CellCoords(4, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       | a        |
       |----------|
       |  b       |
       +----------+
       */
      it('B is included in A, left, bottom and right borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 0);
        var bBottomRight = new Walkontable.CellCoords(5, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       | b        |
       |----------|
       |  a       |
       +----------+
       */
      it('B is included in A, left, top and right borders touch', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 0);
        var bBottomRight = new Walkontable.CellCoords(4, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });
    });
    describe('B has exactly one cell', () => {

      /*
       +----------+
       |  a       |
       | +------+ |
       | |    b | |
       | |      | |
       | +------+ |
       +----------+
       */
      it('B is included in A, none of borders touch each other', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 1);
        var bBottomRight = new Walkontable.CellCoords(1, 1);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

    });
  });

  describe('expand', () => {
    it('should not change range if expander to a cell that fits within the range', () => {
      var from = new Walkontable.CellCoords(1, 1);
      var to = new Walkontable.CellCoords(3, 3);
      var range = new Walkontable.CellRange(from, from, to);

      var topLeft = range.getTopLeftCorner();
      var bottomRight = range.getBottomRightCorner();

      var expander = new Walkontable.CellCoords(3, 1);
      var res = range.expand(expander);
      expect(res).toBe(false);
      var topLeft2 = range.getTopLeftCorner();
      var bottomRight2 = range.getBottomRightCorner();
      expect(topLeft2).toEqual(topLeft);
      expect(bottomRight2).toEqual(bottomRight);
    });

    it('should change range if expander to a cell outside of the cell range', () => {
      var from = new Walkontable.CellCoords(1, 1);
      var to = new Walkontable.CellCoords(3, 3);
      var range = new Walkontable.CellRange(from, from, to);

      var topLeft = range.getTopLeftCorner();

      var expander = new Walkontable.CellCoords(4, 4);
      var res = range.expand(expander);
      expect(res).toBe(true);
      var topLeft2 = range.getTopLeftCorner();
      var bottomRight2 = range.getBottomRightCorner();
      expect(topLeft2).toEqual(topLeft);
      expect(bottomRight2).toEqual(expander);
    });

    it('should change range if expander to a cell outside of the cell range (inverted)', () => {
      var from = new Walkontable.CellCoords(1, 1);
      var to = new Walkontable.CellCoords(3, 3);
      var range = new Walkontable.CellRange(from, from, to);

      var topLeft = range.getTopLeftCorner();

      var expander = new Walkontable.CellCoords(4, 4);
      var res = range.expand(expander);
      expect(res).toBe(true);
      var topLeft2 = range.getTopLeftCorner();
      var bottomRight2 = range.getBottomRightCorner();
      expect(topLeft2).toEqual(topLeft);
      expect(bottomRight2).toEqual(expander);
    });

    it('should change range if expander to a cell outside of the cell range (bottom left)', () => {
      var from = new Walkontable.CellCoords(1, 1);
      var to = new Walkontable.CellCoords(3, 3);
      var range = new Walkontable.CellRange(from, from, to);

      var expander = new Walkontable.CellCoords(3, 0);
      var res = range.expand(expander);
      expect(res).toBe(true);
      var topLeft2 = range.getTopLeftCorner();
      var bottomRight2 = range.getBottomRightCorner();
      expect(topLeft2).toEqual(new Walkontable.CellCoords(1, 0));
      expect(bottomRight2).toEqual(new Walkontable.CellCoords(3, 3));
    });

    it('should change range if expander to a cell outside of the cell range (inverted top right)', () => {
      var from = new Walkontable.CellCoords(2, 0);
      var to = new Walkontable.CellCoords(1, 0);
      var range = new Walkontable.CellRange(from, from, to);

      var expander = new Walkontable.CellCoords(1, 1);
      var res = range.expand(expander);
      expect(res).toBe(true);
      var topLeft2 = range.getTopLeftCorner();
      var bottomRight2 = range.getBottomRightCorner();
      expect(topLeft2).toEqual(new Walkontable.CellCoords(1, 0));
      expect(bottomRight2).toEqual(new Walkontable.CellCoords(2, 1));
    });

    it('should change range if expander to a cell outside of the cell range (inverted bottom left)', () => {
      var from = new Walkontable.CellCoords(2, 1);
      var to = new Walkontable.CellCoords(1, 1);
      var range = new Walkontable.CellRange(from, from, to);

      var expander = new Walkontable.CellCoords(3, 0);
      var res = range.expand(expander);
      expect(res).toBe(true);
      var topLeft2 = range.getTopLeftCorner();
      var bottomRight2 = range.getBottomRightCorner();
      expect(topLeft2).toEqual(new Walkontable.CellCoords(1, 0));
      expect(bottomRight2).toEqual(new Walkontable.CellCoords(3, 1));
    });
  });

  describe('overlaps', () => {
    describe('positive', () => {
      /*
             +-------+
             |       |
             |   b   |
       +-------+     |
       |     +-|-----+
       |   a   |
       |       |
       +-------+
       */
      it('overlapping from NE', () => {
        var aTopLeft = new Walkontable.CellCoords(3, 0);
        var aBottomRight = new Walkontable.CellCoords(8, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 3);
        var bBottomRight = new Walkontable.CellCoords(5, 8);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +---------+
       |      +-------+
       |      |  |    |
       |  a   |  |  b |
       |      |  |    |
       |      +-------+
       +---------+
       */
      it('overlapping from E', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 3);
        var bBottomRight = new Walkontable.CellCoords(4, 6);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +--------+
       |        |
       |  a     |
       |    +---------+
       |    |   |     |
       +----|---+     |
            |      b  |
            |         |
            +---------+
       */
      it('overlapping from SE', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(3, 3);
        var bBottomRight = new Walkontable.CellCoords(8, 8);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +---------+
       |    a    |
       | +-----+ |
       +-|-----|-+
         |  b  |
         +-----+
       */
      it('overlapping from S', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(3, 1);
        var bBottomRight = new Walkontable.CellCoords(6, 4);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
           +--------+
           |      a |
       +--------+   |
       |   |    |   |
       |   +----|---+
       | b      |
       +--------+
       */
      it('overlapping from SW', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 3);
        var aBottomRight = new Walkontable.CellCoords(5, 8);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(3, 0);
        var bBottomRight = new Walkontable.CellCoords(8, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
           +-------+
       +---|--+    |
       |   |  |    |
       | b |  |  a |
       |   |  |    |
       +---|--+    |
           +-------+
       */
      it('overlapping from S', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 3);
        var aBottomRight = new Walkontable.CellCoords(5, 8);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 1);
        var bBottomRight = new Walkontable.CellCoords(4, 4);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +------+
       | b    |
       |   +-------+
       |   |  |    |
       +---|--+  a |
           |       |
           +-------+
       */
      it('overlapping from NW', () => {
        var aTopLeft = new Walkontable.CellCoords(3, 3);
        var aBottomRight = new Walkontable.CellCoords(8, 8);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 0);
        var bBottomRight = new Walkontable.CellCoords(5, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +---------+
       |    b    |
       | +-----+ |
       +-|-----|-+
         |  a  |
         +-----+
       */
      it('overlapping from N', () => {
        var aTopLeft = new Walkontable.CellCoords(3, 1);
        var aBottomRight = new Walkontable.CellCoords(6, 4);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 0);
        var bBottomRight = new Walkontable.CellCoords(5, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +----------+
       |  a       |
       | +------+ |
       | |    b | |
       | |      | |
       | +------+ |
       +----------+
       */
      it('overlapping when includes', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 1);
        var bBottomRight = new Walkontable.CellCoords(4, 4);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
       +----------+
       |  b       |
       | +------+ |
       | |    a | |
       | |      | |
       | +------+ |
       +----------+
       */
      it('overlapping when included', () => {
        var aTopLeft = new Walkontable.CellCoords(1, 1);
        var aBottomRight = new Walkontable.CellCoords(4, 4);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 0);
        var bBottomRight = new Walkontable.CellCoords(5, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*

       b-> +----------+
           |  a       |
           |          |
           |          |
           +----------+
       */
      it('overlapping when A includes B and B has only one cell, and this cell is A\'s top left corner', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 0);
        var bBottomRight = new Walkontable.CellCoords(0, 0);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*

       +----------+ <- b
       |  a       |
       |          |
       |          |
       +----------+
       */
      it('overlapping when A includes B and B has only one cell, and this cell is A\'s top right corner', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 5);
        var bBottomRight = new Walkontable.CellCoords(0, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*

           +----------+
           |  a       |
           |          |
           |          |
      b -> +----------+
       */
      it('overlapping when A includes B and B has only one cell, and this cell is A\'s bottom left corner', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(5, 0);
        var bBottomRight = new Walkontable.CellCoords(5, 0);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*

       +----------+
       |  a       |
       |          |
       |          |
       +----------+ <- b
       */
      it('overlapping when A includes B and B has only one cell, and this cell is A\'s bottom right corner', () => {
        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(5, 5);
        var bBottomRight = new Walkontable.CellCoords(5, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
            +----+
            |b   |
       +----+----+
       |   a|
       +----+
       */
      it('overlapping by touching from NE', () => {

        var aTopLeft = new Walkontable.CellCoords(5, 0);
        var aBottomRight = new Walkontable.CellCoords(10, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 5);
        var bBottomRight = new Walkontable.CellCoords(5, 10);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+----+
       |   a|   b|
       +----+----+
       */
      it('overlapping by touching from E', () => {

        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 5);
        var bBottomRight = new Walkontable.CellCoords(5, 10);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+
       |   a|
       +----+----+
            |   b|
            +----+
       */
      it('overlapping by touching from SE', () => {

        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(5, 5);
        var bBottomRight = new Walkontable.CellCoords(10, 10);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+
       |   a|
       +----+
       |   b|
       +----+
       */
      it('overlapping by touching from S', () => {

        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(5, 5);
        var bBottomRight = new Walkontable.CellCoords(10, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
            +----+
            |   a|
       +----+----+
       |   b|
       +----+
       */
      it('overlapping by touching from SW', () => {

        var aTopLeft = new Walkontable.CellCoords(0, 5);
        var aBottomRight = new Walkontable.CellCoords(5, 10);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(5, 0);
        var bBottomRight = new Walkontable.CellCoords(10, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+----+
       |   b|   a|
       +----+----+
       */
      it('overlapping by touching from W', () => {

        var aTopLeft = new Walkontable.CellCoords(0, 5);
        var aBottomRight = new Walkontable.CellCoords(5, 10);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 0);
        var bBottomRight = new Walkontable.CellCoords(5, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+
       |   b|
       +----+----+
            |   a|
            +----+
       */
      it('overlapping by touching from NW', () => {

        var aTopLeft = new Walkontable.CellCoords(5, 5);
        var aBottomRight = new Walkontable.CellCoords(10, 10);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 0);
        var bBottomRight = new Walkontable.CellCoords(5, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+
       |   b|
       +----+
       |   a|
       +----+
       */
      it('overlapping by touching from E', () => {

        var aTopLeft = new Walkontable.CellCoords(5, 0);
        var aBottomRight = new Walkontable.CellCoords(10, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 0);
        var bBottomRight = new Walkontable.CellCoords(5, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

    });

    describe('negative', () => {
      /*
             +---+
             |  b|
             +---+
       +------+
       |      |
       |  a   |
       |      |
       +------+
       */
      it('not overlapping from NE', () => {

        var aTopLeft = new Walkontable.CellCoords(6, 0);
        var aBottomRight = new Walkontable.CellCoords(11, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 3);
        var bBottomRight = new Walkontable.CellCoords(5, 8);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
       +------+
       |      | +--+
       |   a  | | b|
       |      | +--+
       +------+
       */
      it('not overlapping from E', () => {

        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 6);
        var bBottomRight = new Walkontable.CellCoords(4, 9);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
       +----+
       |a   |
       |    | +----+
       +----+ |b   |
              |    |
              +----+
       */
      it('not overlapping from SE', () => {

        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(1, 6);
        var bBottomRight = new Walkontable.CellCoords(4, 9);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
       +----+
       |a   |
       |    |
       +----+
       +----+
       |b   |
       |    |
       +----+
       */
      it('not overlapping from S', () => {

        var aTopLeft = new Walkontable.CellCoords(0, 0);
        var aBottomRight = new Walkontable.CellCoords(5, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(6, 0);
        var bBottomRight = new Walkontable.CellCoords(11, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
           +----+
           |a   |
           |    |
           +----+
       +----+
       |b   |
       |    |
       +----+
       */
      it('not overlapping from SW', () => {

        var aTopLeft = new Walkontable.CellCoords(0, 3);
        var aBottomRight = new Walkontable.CellCoords(5, 8);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(6, 0);
        var bBottomRight = new Walkontable.CellCoords(11, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
            +------+
       +--+ |      |
       | b| |   a  |
       +--+ |      |
            +------+
       */
      it('not overlapping from W', () => {

        var aTopLeft = new Walkontable.CellCoords(0, 6);
        var aBottomRight = new Walkontable.CellCoords(5, 11);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(3, 0);
        var bBottomRight = new Walkontable.CellCoords(6, 3);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
       +----+
       |b   |
       |    | +----+
       +----+ | a  |
              |    |
              +----+
       */
      it('not overlapping from NW', () => {

        var aTopLeft = new Walkontable.CellCoords(0, 6);
        var aBottomRight = new Walkontable.CellCoords(3, 11);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 0);
        var bBottomRight = new Walkontable.CellCoords(5, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
       +----+
       |b   |
       +----+
       +----+
       |   a|
       +----+
       */
      it('not overlapping from N', () => {

        var aTopLeft = new Walkontable.CellCoords(6, 0);
        var aBottomRight = new Walkontable.CellCoords(11, 5);
        var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new Walkontable.CellCoords(0, 0);
        var bBottomRight = new Walkontable.CellCoords(5, 5);
        var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);
      });
    });
  });

  describe('expand by range', () => {
    it('should not expand range A with range B if A includes B', () => {
      var aTopLeft = new Walkontable.CellCoords(0, 0);
      var aBottomRight = new Walkontable.CellCoords(5, 5);
      var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

      var bTopLeft = new Walkontable.CellCoords(2, 2);
      var bBottomRight = new Walkontable.CellCoords(4, 4);
      var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

      expect(a.expandByRange(b)).toBe(false);

      expect(a.getTopLeftCorner().row).toEqual(0);
      expect(a.getTopLeftCorner().col).toEqual(0);
      expect(a.getBottomRightCorner().row).toEqual(5);
      expect(a.getBottomRightCorner().col).toEqual(5);
    });

    it('should not expand range A with range B if A and B don\'t overlap', () => {
      var aTopLeft = new Walkontable.CellCoords(0, 0);
      var aBottomRight = new Walkontable.CellCoords(5, 5);
      var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

      var bTopLeft = new Walkontable.CellCoords(10, 10);
      var bBottomRight = new Walkontable.CellCoords(15, 15);
      var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

      expect(a.expandByRange(b)).toBe(false);

      expect(a.getTopLeftCorner().row).toEqual(0);
      expect(a.getTopLeftCorner().col).toEqual(0);
      expect(a.getBottomRightCorner().row).toEqual(5);
      expect(a.getBottomRightCorner().col).toEqual(5);
    });

    it('should not expand range A with range B', () => {
      var aTopLeft = new Walkontable.CellCoords(0, 0);
      var aBottomRight = new Walkontable.CellCoords(5, 5);
      var a = new Walkontable.CellRange(aTopLeft, aTopLeft, aBottomRight);

      var bTopLeft = new Walkontable.CellCoords(2, 2);
      var bBottomRight = new Walkontable.CellCoords(7, 7);
      var b = new Walkontable.CellRange(bTopLeft, bTopLeft, bBottomRight);

      expect(a.expandByRange(b)).toBe(true);

      expect(a.getTopLeftCorner().row).toEqual(0);
      expect(a.getTopLeftCorner().col).toEqual(0);
      expect(a.getBottomRightCorner().row).toEqual(7);
      expect(a.getBottomRightCorner().col).toEqual(7);
    });
  });

  describe('forAll', () => {
    it('callback should be called for all cells in the range', () => {
      var from = new Walkontable.CellCoords(1, 1);
      var to = new Walkontable.CellCoords(3, 3);
      var range = new Walkontable.CellRange(from, from, to);
      var forAllCallback = jasmine.createSpy('beforeColumnSortHandler');
      range.forAll(forAllCallback);

      expect(forAllCallback.calls.count()).toBe(9);
    });

    it('callback should be called with row, column parameters', () => {
      var from = new Walkontable.CellCoords(1, 1);
      var to = new Walkontable.CellCoords(2, 2);
      var range = new Walkontable.CellRange(from, from, to);
      var rows = [];
      var cols = [];
      range.forAll((row, col) => {
        rows.push(row);
        cols.push(col);
      });
      expect(rows).toEqual([1, 1, 2, 2]);
      expect(cols).toEqual([1, 2, 1, 2]);
    });

    it('iteration should be interrupted when callback returns false', () => {
      var from = new Walkontable.CellCoords(1, 1);
      var to = new Walkontable.CellCoords(2, 2);
      var range = new Walkontable.CellRange(from, from, to);
      var callCount = 0;
      range.forAll((row, col) => {
        callCount++;
        if (callCount == 2) {
          return false;
        }
      });
      expect(callCount).toBe(2);
    });
  });

  describe('change direction', () => {
    it('should properly change direction on NW-SE', () => {
      var from = new Walkontable.CellCoords(2, 1);
      var to = new Walkontable.CellCoords(1, 2);
      var range = new Walkontable.CellRange(from, from, to);

      expect(range.getDirection()).toBe('SW-NE');

      range.setDirection('NW-SE');

      expect(range.getDirection()).toBe('NW-SE');
      expect(range.from.row).toBe(1);
      expect(range.from.col).toBe(1);
      expect(range.to.row).toBe(2);
      expect(range.to.col).toBe(2);
    });

    it('should properly change direction on NE-SW', () => {
      var from = new Walkontable.CellCoords(2, 1);
      var to = new Walkontable.CellCoords(1, 2);
      var range = new Walkontable.CellRange(from, from, to);

      expect(range.getDirection()).toBe('SW-NE');

      range.setDirection('NE-SW');

      expect(range.getDirection()).toBe('NE-SW');
      expect(range.from.row).toBe(1);
      expect(range.from.col).toBe(2);
      expect(range.to.row).toBe(2);
      expect(range.to.col).toBe(1);
    });

    it('should properly change direction on SE-NW', () => {
      var from = new Walkontable.CellCoords(1, 1);
      var to = new Walkontable.CellCoords(2, 2);
      var range = new Walkontable.CellRange(from, from, to);

      expect(range.getDirection()).toBe('NW-SE');

      range.setDirection('SE-NW');

      expect(range.getDirection()).toBe('SE-NW');
      expect(range.from.row).toBe(2);
      expect(range.from.col).toBe(2);
      expect(range.to.row).toBe(1);
      expect(range.to.col).toBe(1);
    });

    it('should properly change direction on SW-NE', () => {
      var from = new Walkontable.CellCoords(1, 1);
      var to = new Walkontable.CellCoords(2, 2);
      var range = new Walkontable.CellRange(from, from, to);

      expect(range.getDirection()).toBe('NW-SE');

      range.setDirection('SW-NE');

      expect(range.getDirection()).toBe('SW-NE');
      expect(range.from.row).toBe(2);
      expect(range.from.col).toBe(1);
      expect(range.to.row).toBe(1);
      expect(range.to.col).toBe(2);
    });
  });
});
