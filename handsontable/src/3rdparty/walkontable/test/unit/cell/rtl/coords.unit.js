import CellCoords from 'walkontable/cell/coords';

function createCoords(row, column) {
  return new CellCoords(row, column, true);
}

describe('CellCoords (RTL)', () => {
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
      expect(coords.isRtl()).toBe(true);

      coords.assign({ col: 4 });

      expect(coords.row).toBe(3);
      expect(coords.col).toBe(4);
      expect(coords.isRtl()).toBe(true);

      coords.assign({ row: -1, col: -2 });

      expect(coords.row).toBe(-1);
      expect(coords.col).toBe(-2);
      expect(coords.isRtl()).toBe(true);
    });
  });

  describe('isRtl()', () => {
    it('should return correct values', () => {
      expect(createCoords(0, 0).isRtl()).toBe(true);
    });
  });

  describe('isSouthEastOf()', () => {
    it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
      const coords = createCoords(5, 5);

      expect(coords.isSouthEastOf({ row: 0, col: 0 })).toBe(false);
      expect(coords.isSouthEastOf({ row: 0, col: 10 })).toBe(true);
      expect(coords.isSouthEastOf({ row: 10, col: 0 })).toBe(false);
      expect(coords.isSouthEastOf({ row: 10, col: 10 })).toBe(false);
    });
  });

  describe('isSouthWestOf()', () => {
    it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
      const coords = createCoords(5, 5);

      expect(coords.isSouthWestOf({ row: 0, col: 0 })).toBe(true);
      expect(coords.isSouthWestOf({ row: 0, col: 10 })).toBe(false);
      expect(coords.isSouthWestOf({ row: 10, col: 0 })).toBe(false);
      expect(coords.isSouthWestOf({ row: 10, col: 10 })).toBe(false);
    });
  });

  describe('isNorthEastOf()', () => {
    it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
      const coords = createCoords(5, 5);

      expect(coords.isNorthEastOf({ row: 0, col: 0 })).toBe(false);
      expect(coords.isNorthEastOf({ row: 0, col: 10 })).toBe(false);
      expect(coords.isNorthEastOf({ row: 10, col: 0 })).toBe(false);
      expect(coords.isNorthEastOf({ row: 10, col: 10 })).toBe(true);
    });
  });

  describe('isNorthWestOf()', () => {
    it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
      const coords = createCoords(5, 5);

      expect(coords.isNorthWestOf({ row: 0, col: 0 })).toBe(false);
      expect(coords.isNorthWestOf({ row: 0, col: 10 })).toBe(false);
      expect(coords.isNorthWestOf({ row: 10, col: 0 })).toBe(true);
      expect(coords.isNorthWestOf({ row: 10, col: 10 })).toBe(false);
    });
  });
});
