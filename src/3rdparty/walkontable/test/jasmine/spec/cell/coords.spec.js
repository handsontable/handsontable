describe("WalkontableCellCoords", function () {
  describe("isValid", function () {

    var table = document.createElement('table');
    var wrapper = document.createElement('div');
    var container = document.createElement('div');
    wrapper.appendChild(container);
    container.appendChild(table);

    var wot = new Walkontable({
      table: table,
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

  describe("isEqual", function () {
    it("should be equal to itself", function () {
      var cellCoords = new WalkontableCellCoords(1, 1);
      var result = cellCoords.isEqual(cellCoords);
      expect(result).toBe(true);
    });

    it("should be equal to another instance with the same row and column", function () {
      var cellCoords = new WalkontableCellCoords(1, 1);
      var cellCoords2 = new WalkontableCellCoords(1, 1);
      var result = cellCoords.isEqual(cellCoords2);
      expect(result).toBe(true);
    });

    it("should not be equal to an instance with different row or column", function () {
      var cellCoords = new WalkontableCellCoords(1, 1);
      var cellCoords2 = new WalkontableCellCoords(2, 1);
      var result = cellCoords.isEqual(cellCoords2);
      expect(result).toBe(false);
    });
  });
});
