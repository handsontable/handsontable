import CellCoords from 'walkontable/cell/coords';

function createCoords(row, column) {
  return new CellCoords(row, column);
}

describe('CellCoords', () => {
  describe('normalize()', () => {
    it('should normalize negative coordinates', () => {
      const coords = createCoords(-2, -1);

      coords.normalize();

      expect(coords.row).toBe(0);
      expect(coords.col).toBe(0);
    });

    it('should not normalize `null` coordinates (leave as it is)', () => {
      const coords = createCoords();

      coords.normalize();

      expect(coords.row).toBe(null);
      expect(coords.col).toBe(null);
    });
  });

  describe('isValid', () => {
    it('should return `false` when the row is not an integer type', () => {
      expect(createCoords(null, 2).isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 2,
        countColHeaders: 4,
      })).toBe(false);
      expect(createCoords(undefined, 2).isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 2,
        countColHeaders: 4,
      })).toBe(false);
      expect(createCoords(1.1, 2).isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 2,
        countColHeaders: 4,
      })).toBe(false);
      expect(createCoords('1', 2).isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 2,
        countColHeaders: 4,
      })).toBe(false);
    });

    it('should return `false` when the column is not an integer type', () => {
      expect(createCoords(2, null).isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 2,
        countColHeaders: 4,
      })).toBe(false);
      expect(createCoords(2, undefined).isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 2,
        countColHeaders: 4,
      })).toBe(false);
      expect(createCoords(2, 1.1).isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 2,
        countColHeaders: 4,
      })).toBe(false);
      expect(createCoords(2, '1').isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 2,
        countColHeaders: 4,
      })).toBe(false);
    });

    it('should return `false` when the row exceed the total rows count', () => {
      expect(createCoords(6, 2).isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 2,
        countColHeaders: 4,
      })).toBe(false);
    });

    it('should return `false` when the row exceed the total rows count', () => {
      expect(createCoords(2, 3).isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 2,
        countColHeaders: 4,
      })).toBe(false);
    });

    it('should return `false` when the row is lower than the number of column headers', () => {
      expect(createCoords(-5, 1).isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 2,
        countColHeaders: 4,
      })).toBe(false);
      expect(createCoords(-1, 1).isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 0,
        countColHeaders: 0,
      })).toBe(false);
    });

    it('should return `false` when the column is lower than the number of row headers', () => {
      expect(createCoords(1, -3).isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 2,
        countColHeaders: 4,
      })).toBe(false);
      expect(createCoords(1, -1).isValid({
        countRows: 6,
        countCols: 3,
        countRowHeaders: 0,
        countColHeaders: 0,
      })).toBe(false);
    });

    it('should return `true` when the coords points to the range within the table (there are some headers)', () => {
      const tableParams = {
        countRows: 6,
        countCols: 3,
        countRowHeaders: 2,
        countColHeaders: 4,
      };

      // most top-left
      expect(createCoords(-4, -2).isValid(tableParams)).toBe(true);
      // most top-right
      expect(createCoords(-4, 2).isValid(tableParams)).toBe(true);
      // most bottom-right
      expect(createCoords(5, 2).isValid(tableParams)).toBe(true);
      // most bottom-left
      expect(createCoords(5, -2).isValid(tableParams)).toBe(true);
    });

    it('should return `true` when the coords points to the range within the table (no headers)', () => {
      const tableParams = {
        countRows: 6,
        countCols: 3,
        countRowHeaders: 0,
        countColHeaders: 0,
      };

      // most top-left
      expect(createCoords(0, 0).isValid(tableParams)).toBe(true);
      // most top-right
      expect(createCoords(0, 2).isValid(tableParams)).toBe(true);
      // most bottom-right
      expect(createCoords(5, 2).isValid(tableParams)).toBe(true);
      // most bottom-left
      expect(createCoords(5, 0).isValid(tableParams)).toBe(true);
    });
  });

  describe('isEqual()', () => {
    it('should be equal to itself', () => {
      const coords = createCoords(1, 1);
      const result = coords.isEqual(coords);

      expect(result).toBe(true);
    });

    it('should be equal to another instance with the same row and column', () => {
      const coords = createCoords(1, 1);
      const coords2 = createCoords(1, 1);
      const result = coords.isEqual(coords2);

      expect(result).toBe(true);
    });

    it('should not be equal to an instance with different row or column', () => {
      const coords = createCoords(1, 1);
      const coords2 = createCoords(2, 1);
      const result = coords.isEqual(coords2);

      expect(result).toBe(false);
    });
  });

  describe('clone()', () => {
    it('should clone the object', () => {
      const coords = createCoords(3, 9);
      const clone = coords.clone();

      expect(coords.row).toBe(clone.row);
      expect(coords.col).toBe(clone.col);
      expect(coords).not.toBe(clone);
    });
  });

  describe('assign()', () => {
    it('should be possible to assign coords from other CellCoords instance', () => {
      const coords = createCoords(0, 0);
      const coords2 = createCoords(3, 9);

      coords.assign(coords2);

      expect(coords).not.toBe(coords2);
      expect(coords.row).toBe(coords2.row);
      expect(coords.col).toBe(coords2.col);
      expect(coords.isRtl()).toBe(coords2.isRtl());
    });

    it('should be possible to assign coords from literal object', () => {
      const coords = createCoords(0, 0);

      coords.assign({ row: 3 });

      expect(coords.row).toBe(3);
      expect(coords.col).toBe(0);
      expect(coords.isRtl()).toBe(false);

      coords.assign({ col: 4 });

      expect(coords.row).toBe(3);
      expect(coords.col).toBe(4);
      expect(coords.isRtl()).toBe(false);

      coords.assign({ row: -1, col: -2 });

      expect(coords.row).toBe(-1);
      expect(coords.col).toBe(-2);
      expect(coords.isRtl()).toBe(false);
    });
  });

  describe('isRtl()', () => {
    it('should return correct values', () => {
      expect(createCoords(0, 0).isRtl()).toBe(false);
    });
  });

  describe('isCell()', () => {
    it('should return `false` when one of the axis point to the header (negative value)', () => {
      expect(createCoords(-1, 9).isCell()).toBe(false);
      expect(createCoords(9, -1).isCell()).toBe(false);
      expect(createCoords(-1, -1).isCell()).toBe(false);
      expect(createCoords(0, -1).isCell()).toBe(false);
      expect(createCoords(-1, 0).isCell()).toBe(false);
    });

    it('should return `true` when all axis point to the cells range', () => {
      expect(createCoords(0, 0).isCell()).toBe(true);
      expect(createCoords(1, 0).isCell()).toBe(true);
      expect(createCoords(0, 1).isCell()).toBe(true);
      expect(createCoords(1, 1).isCell()).toBe(true);
      expect(createCoords(100, 100).isCell()).toBe(true);
    });
  });

  describe('isHeader()', () => {
    it('should return `false` when all axis point to the cells (positive value)', () => {
      expect(createCoords(0, 0).isHeader()).toBe(false);
      expect(createCoords(1, 0).isHeader()).toBe(false);
      expect(createCoords(0, 1).isHeader()).toBe(false);
      expect(createCoords(1, 1).isHeader()).toBe(false);
      expect(createCoords(100, 100).isHeader()).toBe(false);
    });

    it('should return `true` when one of the axis point to the headers range', () => {
      expect(createCoords(-1, 9).isHeader()).toBe(true);
      expect(createCoords(9, -1).isHeader()).toBe(true);
      expect(createCoords(-1, -1).isHeader()).toBe(true);
      expect(createCoords(0, -1).isHeader()).toBe(true);
      expect(createCoords(-1, 0).isHeader()).toBe(true);
    });
  });

  describe('isSouthEastOf()', () => {
    it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
      const coords = createCoords(5, 5);

      expect(coords.isSouthEastOf({ row: 0, col: 0 })).toBe(true);
      expect(coords.isSouthEastOf({ row: 0, col: 10 })).toBe(false);
      expect(coords.isSouthEastOf({ row: 10, col: 0 })).toBe(false);
      expect(coords.isSouthEastOf({ row: 10, col: 10 })).toBe(false);
    });
  });

  describe('isSouthWestOf()', () => {
    it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
      const coords = createCoords(5, 5);

      expect(coords.isSouthWestOf({ row: 0, col: 0 })).toBe(false);
      expect(coords.isSouthWestOf({ row: 0, col: 10 })).toBe(true);
      expect(coords.isSouthWestOf({ row: 10, col: 0 })).toBe(false);
      expect(coords.isSouthWestOf({ row: 10, col: 10 })).toBe(false);
    });
  });

  describe('isNorthEastOf()', () => {
    it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
      const coords = createCoords(5, 5);

      expect(coords.isNorthEastOf({ row: 0, col: 0 })).toBe(false);
      expect(coords.isNorthEastOf({ row: 0, col: 10 })).toBe(false);
      expect(coords.isNorthEastOf({ row: 10, col: 0 })).toBe(true);
      expect(coords.isNorthEastOf({ row: 10, col: 10 })).toBe(false);
    });
  });

  describe('isNorthWestOf()', () => {
    it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
      const coords = createCoords(5, 5);

      expect(coords.isNorthWestOf({ row: 0, col: 0 })).toBe(false);
      expect(coords.isNorthWestOf({ row: 0, col: 10 })).toBe(false);
      expect(coords.isNorthWestOf({ row: 10, col: 0 })).toBe(false);
      expect(coords.isNorthWestOf({ row: 10, col: 10 })).toBe(true);
    });
  });

  describe('toObject()', () => {
    it('should return literal object with `row` and `col` properties', () => {
      expect(createCoords(-1, 9).toObject()).toEqual({ row: -1, col: 9 });
      expect(createCoords(9, -1).toObject()).toEqual({ row: 9, col: -1 });
      expect(createCoords(-1, -1).toObject()).toEqual({ row: -1, col: -1 });
      expect(createCoords(0, -1).toObject()).toEqual({ row: 0, col: -1 });
      expect(createCoords(-1, 0).toObject()).toEqual({ row: -1, col: 0 });
    });
  });
});
