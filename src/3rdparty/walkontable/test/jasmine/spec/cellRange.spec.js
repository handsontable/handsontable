describe("WalkontableCellRange", function () {
  describe("getAll", function () {
    it("should get all cells in range", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(3, 3);
      var range = new WalkontableCellRange(from, to);
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
      var range = new WalkontableCellRange(from, to);
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
      var range = new WalkontableCellRange(from, to);
      var inner = range.getInner();
      expect(inner.length).toBe(7);
      expect(inner[1].row).toBe(1);
      expect(inner[1].col).toBe(3);
    });

    it("should get cells in range excluding from and to (reverse order)", function () {
      var from = new WalkontableCellCoords(3, 3);
      var to = new WalkontableCellCoords(1, 1);
      var range = new WalkontableCellRange(from, to);
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
      var range = new WalkontableCellRange(from, to);
      expect(range.includes(new WalkontableCellCoords(0, 0))).toBe(true);
    });

    it("should return true if given cell is within the range", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(3, 3);
      var range = new WalkontableCellRange(from, to);
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
      var range = new WalkontableCellRange(from, to);
      expect(range.includes(new WalkontableCellCoords(0, 0))).toBe(false);
      expect(range.includes(new WalkontableCellCoords(4, 4))).toBe(false);
      expect(range.includes(new WalkontableCellCoords(1, 4))).toBe(false);
      expect(range.includes(new WalkontableCellCoords(4, 1))).toBe(false);
      expect(range.includes(new WalkontableCellCoords(-1, -1))).toBe(false);
    });
  });

  describe("expand", function () {
    it("should not change range if expander to a cell that fits within the range", function () {
      var from = new WalkontableCellCoords(1, 1);
      var to = new WalkontableCellCoords(3, 3);
      var range = new WalkontableCellRange(from, to);

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
      var range = new WalkontableCellRange(from, to);

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
      var range = new WalkontableCellRange(from, to);

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
      var range = new WalkontableCellRange(from, to);

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
      var range = new WalkontableCellRange(from, to);

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
      var range = new WalkontableCellRange(from, to);

      var expander = new WalkontableCellCoords(3, 0);
      var res = range.expand(expander);
      expect(res).toBe(true);
      var topLeft2 = range.getTopLeftCorner();
      var bottomRight2 = range.getBottomRightCorner();
      expect(topLeft2).toEqual(new WalkontableCellCoords(1, 0));
      expect(bottomRight2).toEqual(new WalkontableCellCoords(3, 1));
    });
  });
});