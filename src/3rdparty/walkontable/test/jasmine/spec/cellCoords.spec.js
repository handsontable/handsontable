describe("WalkontableCellCoords", function () {
  describe("isValid", function () {
    var wot = new Walkontable({
      table: document.createElement('table'),
      data: [],
      totalRows: 10,
      totalColumns: 5
    });

    it("should be false if one of the arguments is smaller than 0", function () {
      var cellCoords = new WalkontableCellCoords(-1, 0);
      var result = cellCoords.isValid(wot);
      expect(result).toBe(false);

      cellCoords = new WalkontableCellCoords(0, -1);
      result = cellCoords.isValid(wot);
      expect(result).toBe(false);
    });

    it("should be true if row is within the total number of rows", function () {
      var cellCoords = new WalkontableCellCoords(9, 1);
      var result = cellCoords.isValid(wot);
      expect(result).toBe(true);
    });

    it("should be false if row is greater than total number of rows", function () {
      var cellCoords = new WalkontableCellCoords(10, 1);
      var result = cellCoords.isValid(wot);
      expect(result).toBe(false);
    });

    it("should be true if column is within the total number of columns", function () {
      var cellCoords = new WalkontableCellCoords(1, 4);
      var result = cellCoords.isValid(wot);
      expect(result).toBe(true);
    });

    it("should be false if column is greater than total number of columns", function () {
      var cellCoords = new WalkontableCellCoords(1, 5);
      var result = cellCoords.isValid(wot);
      expect(result).toBe(false);
    });
  });
});