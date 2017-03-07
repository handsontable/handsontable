describe('Walkontable.CellCoords', () => {
  describe('isValid', () => {

    var table = document.createElement('table');
    var wrapper = document.createElement('div');
    var container = document.createElement('div');
    wrapper.appendChild(container);
    container.appendChild(table);

    var wot = new Walkontable.Core({
      table,
      data: [],
      totalRows: 10,
      totalColumns: 5
    });

    it('should be false if one of the arguments is smaller than 0', () => {
      var cellCoords = new Walkontable.CellCoords(-1, 0);
      var result = cellCoords.isValid(wot);
      expect(result).toBe(false);

      cellCoords = new Walkontable.CellCoords(0, -1);
      result = cellCoords.isValid(wot);
      expect(result).toBe(false);
    });

    it('should be true if row is within the total number of rows', () => {
      var cellCoords = new Walkontable.CellCoords(9, 1);
      var result = cellCoords.isValid(wot);
      expect(result).toBe(true);
    });

    it('should be false if row is greater than total number of rows', () => {
      var cellCoords = new Walkontable.CellCoords(10, 1);
      var result = cellCoords.isValid(wot);
      expect(result).toBe(false);
    });

    it('should be true if column is within the total number of columns', () => {
      var cellCoords = new Walkontable.CellCoords(1, 4);
      var result = cellCoords.isValid(wot);
      expect(result).toBe(true);
    });

    it('should be false if column is greater than total number of columns', () => {
      var cellCoords = new Walkontable.CellCoords(1, 5);
      var result = cellCoords.isValid(wot);
      expect(result).toBe(false);
    });
  });

  describe('isEqual', () => {
    it('should be equal to itself', () => {
      var cellCoords = new Walkontable.CellCoords(1, 1);
      var result = cellCoords.isEqual(cellCoords);
      expect(result).toBe(true);
    });

    it('should be equal to another instance with the same row and column', () => {
      var cellCoords = new Walkontable.CellCoords(1, 1);
      var cellCoords2 = new Walkontable.CellCoords(1, 1);
      var result = cellCoords.isEqual(cellCoords2);
      expect(result).toBe(true);
    });

    it('should not be equal to an instance with different row or column', () => {
      var cellCoords = new Walkontable.CellCoords(1, 1);
      var cellCoords2 = new Walkontable.CellCoords(2, 1);
      var result = cellCoords.isEqual(cellCoords2);
      expect(result).toBe(false);
    });
  });
});
