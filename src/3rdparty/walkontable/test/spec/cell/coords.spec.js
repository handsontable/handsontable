describe('Walkontable.CellCoords', () => {
  describe('isValid', () => {

    const table = document.createElement('table');
    const wrapper = document.createElement('div');
    const container = document.createElement('div');
    wrapper.appendChild(container);
    container.appendChild(table);

    const wot = new Walkontable.Core({
      table,
      data: [],
      totalRows: 10,
      totalColumns: 5
    });

    it('should be false if one of the arguments is smaller than 0', () => {
      let cellCoords = new Walkontable.CellCoords(-1, 0);
      let result = cellCoords.isValid(wot);
      expect(result).toBe(false);

      cellCoords = new Walkontable.CellCoords(0, -1);
      result = cellCoords.isValid(wot);
      expect(result).toBe(false);
    });

    it('should be true if row is within the total number of rows', () => {
      const cellCoords = new Walkontable.CellCoords(9, 1);
      const result = cellCoords.isValid(wot);
      expect(result).toBe(true);
    });

    it('should be false if row is greater than total number of rows', () => {
      const cellCoords = new Walkontable.CellCoords(10, 1);
      const result = cellCoords.isValid(wot);
      expect(result).toBe(false);
    });

    it('should be true if column is within the total number of columns', () => {
      const cellCoords = new Walkontable.CellCoords(1, 4);
      const result = cellCoords.isValid(wot);
      expect(result).toBe(true);
    });

    it('should be false if column is greater than total number of columns', () => {
      const cellCoords = new Walkontable.CellCoords(1, 5);
      const result = cellCoords.isValid(wot);
      expect(result).toBe(false);
    });
  });

  describe('isEqual', () => {
    it('should be equal to itself', () => {
      const cellCoords = new Walkontable.CellCoords(1, 1);
      const result = cellCoords.isEqual(cellCoords);
      expect(result).toBe(true);
    });

    it('should be equal to another instance with the same row and column', () => {
      const cellCoords = new Walkontable.CellCoords(1, 1);
      const cellCoords2 = new Walkontable.CellCoords(1, 1);
      const result = cellCoords.isEqual(cellCoords2);
      expect(result).toBe(true);
    });

    it('should not be equal to an instance with different row or column', () => {
      const cellCoords = new Walkontable.CellCoords(1, 1);
      const cellCoords2 = new Walkontable.CellCoords(2, 1);
      const result = cellCoords.isEqual(cellCoords2);
      expect(result).toBe(false);
    });
  });
});
