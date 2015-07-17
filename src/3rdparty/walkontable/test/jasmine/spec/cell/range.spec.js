describe("WalkontableCellRange", function () {
  describe("getAll", function () {
    it("should get all cells in range", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(3, 3);
      var range = new WalkontableCellRange(from, from, to);
      var all = range.getAll();
      expect(all.length).toBe(9);
      expect(all[0].row).toBe(from.row);
      expect(all[0].col).toBe(from.col);
      expect(all[1].row).toBe(1);
      expect(all[1].col).toBe(2);
      expect(all[8].row).toBe(to.row);
      expect(all[8].col).toBe(to.col);
    });

    it("should get all cells in range (reverse order)", function () {
      var from = new WalkontableCellCoords(3, 3);
      var to = new WalkontableCellCoords(1, 1);
      var range = new WalkontableCellRange(from, from, to);
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

  describe("getInner", function () {
    it("should get cells in range excluding from and to", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(3, 3);
      var range = new WalkontableCellRange(from, from, to);
      var inner = range.getInner();
      expect(inner.length).toBe(7);
      expect(inner[1].row).toBe(1);
      expect(inner[1].col).toBe(3);
    });

    it("should get cells in range excluding from and to (reverse order)", function () {
      var from = new WalkontableCellCoords(3, 3);
      var to = new WalkontableCellCoords(1, 1);
      var range = new WalkontableCellRange(from, from, to);
      var inner = range.getInner();
      expect(inner.length).toBe(7);
      expect(inner[1].row).toBe(1);
      expect(inner[1].col).toBe(3);
    });
  });

  describe("includes", function () {
    it("should return true if range is a single cell and the same cell is given", function () {
      var from = new WalkontableCellCoords(0, 0);
      var to = new WalkontableCellCoords(0, 0);
      var range = new WalkontableCellRange(from, from, to);
      expect(range.includes(new WalkontableCellCoords(0, 0))).toBe(true);
    });

    it("should return true if given cell is within the range", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(3, 3);
      var range = new WalkontableCellRange(from, from, to);
      expect(range.includes(new WalkontableCellCoords(1, 1))).toBe(true);
      expect(range.includes(new WalkontableCellCoords(3, 1))).toBe(true);
      expect(range.includes(new WalkontableCellCoords(3, 3))).toBe(true);
      expect(range.includes(new WalkontableCellCoords(1, 3))).toBe(true);
      expect(range.includes(new WalkontableCellCoords(2, 2))).toBe(true);
      expect(range.includes(new WalkontableCellCoords(1, 2))).toBe(true);
      expect(range.includes(new WalkontableCellCoords(2, 1))).toBe(true);
    });

    it("should return false if given cell outside the range", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(3, 3);
      var range = new WalkontableCellRange(from, from, to);
      expect(range.includes(new WalkontableCellCoords(0, 0))).toBe(false);
      expect(range.includes(new WalkontableCellCoords(4, 4))).toBe(false);
      expect(range.includes(new WalkontableCellCoords(1, 4))).toBe(false);
      expect(range.includes(new WalkontableCellCoords(4, 1))).toBe(false);
      expect(range.includes(new WalkontableCellCoords(-1, -1))).toBe(false);
    });
  });

  describe("includesRange", function () {
    describe("B has more than one cell", function () {
      /*
       +----------+
       |  a       |
       | +------+ |
       | |    b | |
       | |      | |
       | +------+ |
       +----------+
       */
      it("B is included in A, none of borders touch each other", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 1);
        var bBottomRight = new WalkontableCellCoords(4, 4);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("A is included in B, none of borders touch each other", function () {
        var aTopLeft = new WalkontableCellCoords(1, 1);
        var aBottomRight = new WalkontableCellCoords(4, 4);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 0);
        var bBottomRight = new WalkontableCellCoords(5, 4);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(false);
      });

      /*
       +-----------+
       | a |   b | |
       |   |     | |
       |   +-----+ |
       +-----------+
       */
      it("B is included in A, top borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 1);
        var bBottomRight = new WalkontableCellCoords(4, 4);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("B is included in A, top and right borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 1);
        var bBottomRight = new WalkontableCellCoords(4, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("B is included in A, right borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 1);
        var bBottomRight = new WalkontableCellCoords(4, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +---------+
       |   +-----|
       | a |   b |
       |   |     |
       +---------+
       */
      it("B is included in A, bottom and right borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 1);
        var bBottomRight = new WalkontableCellCoords(5, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +-----------+
       |   +-----+ |
       | a |   b | |
       |   |     | |
       +-----------+
       */
      it("B is included in A, bottom borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 1);
        var bBottomRight = new WalkontableCellCoords(5, 4);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +-----------+
       |-----+   a |
       |   b |     |
       |     |     |
       +-----------+
       */
      it("B is included in A, bottom and left borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 0);
        var bBottomRight = new WalkontableCellCoords(5, 4);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("B is included in A, left borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 0);
        var bBottomRight = new WalkontableCellCoords(4, 4);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +-----------+
       |   b |   a |
       |     |     |
       |-----+     |
       +-----------+
       */
      it("B is included in A, top and left borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 0);
        var bBottomRight = new WalkontableCellCoords(4, 4);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +------------+
       |  a |   b | |
       |    |     | |
       +------------+
       */
      it("B is included in A, top and bottom borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 1);
        var bBottomRight = new WalkontableCellCoords(5, 4);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       |  a |   b |
       |    |     |
       +----------+
       */
      it("B is included in A, top, right and bottom borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 1);
        var bBottomRight = new WalkontableCellCoords(5, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       |  b |   a |
       |    |     |
       +----------+
       */
      it("B is included in A, top, left and bottom borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 0);
        var bBottomRight = new WalkontableCellCoords(5, 4);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("B is included in A, left and right borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 0);
        var bBottomRight = new WalkontableCellCoords(4, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       | a        |
       |----------|
       |  b       |
       +----------+
       */
      it("B is included in A, left, bottom and right borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 0);
        var bBottomRight = new WalkontableCellCoords(5, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

      /*
       +----------+
       | b        |
       |----------|
       |  a       |
       +----------+
       */
      it("B is included in A, left, top and right borders touch", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 0);
        var bBottomRight = new WalkontableCellCoords(4, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });
    });
    describe("B has exactly one cell", function () {

      /*
       +----------+
       |  a       |
       | +------+ |
       | |    b | |
       | |      | |
       | +------+ |
       +----------+
       */
      it("B is included in A, none of borders touch each other", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 1);
        var bBottomRight = new WalkontableCellCoords(1, 1);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.includesRange(b)).toBe(true);
      });

    });
  });

  describe("expand", function () {
    it("should not change range if expander to a cell that fits within the range", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(3, 3);
      var range = new WalkontableCellRange(from, from, to);

      var topLeft = range.getTopLeftCorner();
      var bottomRight = range.getBottomRightCorner();

      var expander = new WalkontableCellCoords(3, 1);
      var res = range.expand(expander);
      expect(res).toBe(false);
      var topLeft2 = range.getTopLeftCorner();
      var bottomRight2 = range.getBottomRightCorner();
      expect(topLeft2).toEqual(topLeft);
      expect(bottomRight2).toEqual(bottomRight);
    });

    it("should change range if expander to a cell outside of the cell range", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(3, 3);
      var range = new WalkontableCellRange(from, from, to);

      var topLeft = range.getTopLeftCorner();

      var expander = new WalkontableCellCoords(4, 4);
      var res = range.expand(expander);
      expect(res).toBe(true);
      var topLeft2 = range.getTopLeftCorner();
      var bottomRight2 = range.getBottomRightCorner();
      expect(topLeft2).toEqual(topLeft);
      expect(bottomRight2).toEqual(expander);
    });

    it("should change range if expander to a cell outside of the cell range (inverted)", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(3, 3);
      var range = new WalkontableCellRange(from, from, to);

      var topLeft = range.getTopLeftCorner();

      var expander = new WalkontableCellCoords(4, 4);
      var res = range.expand(expander);
      expect(res).toBe(true);
      var topLeft2 = range.getTopLeftCorner();
      var bottomRight2 = range.getBottomRightCorner();
      expect(topLeft2).toEqual(topLeft);
      expect(bottomRight2).toEqual(expander);
    });

    it("should change range if expander to a cell outside of the cell range (bottom left)", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(3, 3);
      var range = new WalkontableCellRange(from, from, to);

      var expander = new WalkontableCellCoords(3, 0);
      var res = range.expand(expander);
      expect(res).toBe(true);
      var topLeft2 = range.getTopLeftCorner();
      var bottomRight2 = range.getBottomRightCorner();
      expect(topLeft2).toEqual(new WalkontableCellCoords(1, 0));
      expect(bottomRight2).toEqual(new WalkontableCellCoords(3, 3));
    });

    it("should change range if expander to a cell outside of the cell range (inverted top right)", function () {
      var from = new WalkontableCellCoords(2, 0);
      var to = new WalkontableCellCoords(1, 0);
      var range = new WalkontableCellRange(from, from, to);

      var expander = new WalkontableCellCoords(1, 1);
      var res = range.expand(expander);
      expect(res).toBe(true);
      var topLeft2 = range.getTopLeftCorner();
      var bottomRight2 = range.getBottomRightCorner();
      expect(topLeft2).toEqual(new WalkontableCellCoords(1, 0));
      expect(bottomRight2).toEqual(new WalkontableCellCoords(2, 1));
    });

    it("should change range if expander to a cell outside of the cell range (inverted bottom left)", function () {
      var from = new WalkontableCellCoords(2, 1);
      var to = new WalkontableCellCoords(1, 1);
      var range = new WalkontableCellRange(from, from, to);

      var expander = new WalkontableCellCoords(3, 0);
      var res = range.expand(expander);
      expect(res).toBe(true);
      var topLeft2 = range.getTopLeftCorner();
      var bottomRight2 = range.getBottomRightCorner();
      expect(topLeft2).toEqual(new WalkontableCellCoords(1, 0));
      expect(bottomRight2).toEqual(new WalkontableCellCoords(3, 1));
    });
  });

  describe("overlaps", function () {


    describe("positive", function () {
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
      it("overlapping from NE", function () {
        var aTopLeft = new WalkontableCellCoords(3, 0);
        var aBottomRight = new WalkontableCellCoords(8, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 3);
        var bBottomRight = new WalkontableCellCoords(5, 8);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("overlapping from E", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 3);
        var bBottomRight = new WalkontableCellCoords(4, 6);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("overlapping from SE", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(3, 3);
        var bBottomRight = new WalkontableCellCoords(8, 8);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("overlapping from S", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(3, 1);
        var bBottomRight = new WalkontableCellCoords(6, 4);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("overlapping from SW", function () {
        var aTopLeft = new WalkontableCellCoords(0, 3);
        var aBottomRight = new WalkontableCellCoords(5, 8);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(3, 0);
        var bBottomRight = new WalkontableCellCoords(8, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("overlapping from S", function () {
        var aTopLeft = new WalkontableCellCoords(0, 3);
        var aBottomRight = new WalkontableCellCoords(5, 8);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 1);
        var bBottomRight = new WalkontableCellCoords(4, 4);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("overlapping from NW", function () {
        var aTopLeft = new WalkontableCellCoords(3, 3);
        var aBottomRight = new WalkontableCellCoords(8, 8);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 0);
        var bBottomRight = new WalkontableCellCoords(5, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("overlapping from N", function () {
        var aTopLeft = new WalkontableCellCoords(3, 1);
        var aBottomRight = new WalkontableCellCoords(6, 4);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 0);
        var bBottomRight = new WalkontableCellCoords(5, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("overlapping when includes", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 1);
        var bBottomRight = new WalkontableCellCoords(4, 4);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("overlapping when included", function () {
        var aTopLeft = new WalkontableCellCoords(1, 1);
        var aBottomRight = new WalkontableCellCoords(4, 4);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 0);
        var bBottomRight = new WalkontableCellCoords(5, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });


      /*

       b-> +----------+
           |  a       |
           |          |
           |          |
           +----------+
       */
      it("overlapping when A includes B and B has only one cell, and this cell is A's top left corner", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 0);
        var bBottomRight = new WalkontableCellCoords(0, 0);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*

       +----------+ <- b
       |  a       |
       |          |
       |          |
       +----------+
       */
      it("overlapping when A includes B and B has only one cell, and this cell is A's top right corner", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 5);
        var bBottomRight = new WalkontableCellCoords(0, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*

           +----------+
           |  a       |
           |          |
           |          |
      b -> +----------+
       */
      it("overlapping when A includes B and B has only one cell, and this cell is A's bottom left corner", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(5, 0);
        var bBottomRight = new WalkontableCellCoords(5, 0);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*

       +----------+
       |  a       |
       |          |
       |          |
       +----------+ <- b
       */
      it("overlapping when A includes B and B has only one cell, and this cell is A's bottom right corner", function () {
        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(5, 5);
        var bBottomRight = new WalkontableCellCoords(5, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);
      });

      /*
            +----+
            |b   |
       +----+----+
       |   a|
       +----+
       */
      it("overlapping by touching from NE", function () {

        var aTopLeft = new WalkontableCellCoords(5, 0);
        var aBottomRight = new WalkontableCellCoords(10, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 5);
        var bBottomRight = new WalkontableCellCoords(5, 10);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+----+
       |   a|   b|
       +----+----+
       */
      it("overlapping by touching from E", function () {

        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 5);
        var bBottomRight = new WalkontableCellCoords(5, 10);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+
       |   a|
       +----+----+
            |   b|
            +----+
       */
      it("overlapping by touching from SE", function () {

        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(5, 5);
        var bBottomRight = new WalkontableCellCoords(10, 10);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+
       |   a|
       +----+
       |   b|
       +----+
       */
      it("overlapping by touching from S", function () {

        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(5, 5);
        var bBottomRight = new WalkontableCellCoords(10, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
            +----+
            |   a|
       +----+----+
       |   b|
       +----+
       */
      it("overlapping by touching from SW", function () {

        var aTopLeft = new WalkontableCellCoords(0, 5);
        var aBottomRight = new WalkontableCellCoords(5, 10);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(5, 0);
        var bBottomRight = new WalkontableCellCoords(10, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+----+
       |   b|   a|
       +----+----+
       */
      it("overlapping by touching from W", function () {

        var aTopLeft = new WalkontableCellCoords(0, 5);
        var aBottomRight = new WalkontableCellCoords(5, 10);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 0);
        var bBottomRight = new WalkontableCellCoords(5, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+
       |   b|
       +----+----+
            |   a|
            +----+
       */
      it("overlapping by touching from NW", function () {

        var aTopLeft = new WalkontableCellCoords(5, 5);
        var aBottomRight = new WalkontableCellCoords(10, 10);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 0);
        var bBottomRight = new WalkontableCellCoords(5, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

      /*
       +----+
       |   b|
       +----+
       |   a|
       +----+
       */
      it("overlapping by touching from E", function () {

        var aTopLeft = new WalkontableCellCoords(5, 0);
        var aBottomRight = new WalkontableCellCoords(10, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 0);
        var bBottomRight = new WalkontableCellCoords(5, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(true);

      });

    });

    describe("negative", function () {
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
      it("not overlapping from NE", function () {

        var aTopLeft = new WalkontableCellCoords(6, 0);
        var aBottomRight = new WalkontableCellCoords(11, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 3);
        var bBottomRight = new WalkontableCellCoords(5, 8);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
       +------+
       |      | +--+
       |   a  | | b|
       |      | +--+
       +------+
       */
      it("not overlapping from E", function () {

        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 6);
        var bBottomRight = new WalkontableCellCoords(4, 9);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("not overlapping from SE", function () {

        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(1, 6);
        var bBottomRight = new WalkontableCellCoords(4, 9);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("not overlapping from S", function () {

        var aTopLeft = new WalkontableCellCoords(0, 0);
        var aBottomRight = new WalkontableCellCoords(5, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(6, 0);
        var bBottomRight = new WalkontableCellCoords(11, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("not overlapping from SW", function () {

        var aTopLeft = new WalkontableCellCoords(0, 3);
        var aBottomRight = new WalkontableCellCoords(5, 8);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(6, 0);
        var bBottomRight = new WalkontableCellCoords(11, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

      /*
            +------+
       +--+ |      |
       | b| |   a  |
       +--+ |      |
            +------+
       */
      it("not overlapping from W", function () {

        var aTopLeft = new WalkontableCellCoords(0, 6);
        var aBottomRight = new WalkontableCellCoords(5, 11);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(3, 0);
        var bBottomRight = new WalkontableCellCoords(6, 3);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("not overlapping from NW", function () {

        var aTopLeft = new WalkontableCellCoords(0, 6);
        var aBottomRight = new WalkontableCellCoords(3, 11);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 0);
        var bBottomRight = new WalkontableCellCoords(5, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

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
      it("not overlapping from N", function () {

        var aTopLeft = new WalkontableCellCoords(6, 0);
        var aBottomRight = new WalkontableCellCoords(11, 5);
        var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

        var bTopLeft = new WalkontableCellCoords(0, 0);
        var bBottomRight = new WalkontableCellCoords(5, 5);
        var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);

        expect(a.overlaps(b)).toBe(false);

      });

    });

  });

  describe("expand by range", function () {
    it("should not expand range A with range B if A includes B", function () {
      var aTopLeft = new WalkontableCellCoords(0, 0);
      var aBottomRight = new WalkontableCellCoords(5, 5);
      var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

      var bTopLeft = new WalkontableCellCoords(2, 2);
      var bBottomRight = new WalkontableCellCoords(4, 4);
      var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);


      expect(a.expandByRange(b)).toBe(false);

      expect(a.getTopLeftCorner().row).toEqual(0);
      expect(a.getTopLeftCorner().col).toEqual(0);
      expect(a.getBottomRightCorner().row).toEqual(5);
      expect(a.getBottomRightCorner().col).toEqual(5);
    });

    it("should not expand range A with range B if A and B don't overlap", function () {
      var aTopLeft = new WalkontableCellCoords(0, 0);
      var aBottomRight = new WalkontableCellCoords(5, 5);
      var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

      var bTopLeft = new WalkontableCellCoords(10, 10);
      var bBottomRight = new WalkontableCellCoords(15, 15);
      var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);


      expect(a.expandByRange(b)).toBe(false);

      expect(a.getTopLeftCorner().row).toEqual(0);
      expect(a.getTopLeftCorner().col).toEqual(0);
      expect(a.getBottomRightCorner().row).toEqual(5);
      expect(a.getBottomRightCorner().col).toEqual(5);
    });

    it("should not expand range A with range B", function () {
      var aTopLeft = new WalkontableCellCoords(0, 0);
      var aBottomRight = new WalkontableCellCoords(5, 5);
      var a = new WalkontableCellRange(aTopLeft, aTopLeft, aBottomRight);

      var bTopLeft = new WalkontableCellCoords(2, 2);
      var bBottomRight = new WalkontableCellCoords(7, 7);
      var b = new WalkontableCellRange(bTopLeft, bTopLeft, bBottomRight);


      expect(a.expandByRange(b)).toBe(true);

      expect(a.getTopLeftCorner().row).toEqual(0);
      expect(a.getTopLeftCorner().col).toEqual(0);
      expect(a.getBottomRightCorner().row).toEqual(7);
      expect(a.getBottomRightCorner().col).toEqual(7);
    });
  });

  describe("forAll", function () {
    it("callback should be called for all cells in the range", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(3, 3);
      var range = new WalkontableCellRange(from, from, to);
      var forAllCallback = jasmine.createSpy('beforeColumnSortHandler');
      range.forAll(forAllCallback);
      expect(forAllCallback.callCount).toBe(9);
    });

    it("callback should be called with row, column parameters", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(2, 2);
      var range = new WalkontableCellRange(from, from, to);
      var rows = [];
      var cols = [];
      range.forAll(function (row, col) {
        rows.push(row);
        cols.push(col);
      });
      expect(rows).toEqual([1, 1, 2, 2]);
      expect(cols).toEqual([1, 2, 1, 2]);
    });

    it("iteration should be interrupted when callback returns false", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(2, 2);
      var range = new WalkontableCellRange(from, from, to);
      var callCount = 0;
      range.forAll(function (row, col) {
        callCount++;
        if (callCount == 2) {
          return false;
        }
      });
      expect(callCount).toBe(2);
    });
  });
});