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
});