import CellCoords from 'walkontable/cell/coords';

describe('CellCoords', () => {
  describe('normalize()', () => {
    it('should normalize negative coordinates', () => {
      const coords = new CellCoords(-2, -1);

      coords.normalize();

      expect(coords.row).toBe(0);
      expect(coords.col).toBe(0);
    });

    it('should not normalize `null` coordinates (leave as it is)', () => {
      const coords = new CellCoords();

      coords.normalize();

      expect(coords.row).toBe(null);
      expect(coords.col).toBe(null);
    });
  });

  describe('clone()', () => {
    it('should clone the object', () => {
      const coords = new CellCoords(3, 9);
      const clone = coords.clone();

      expect(coords.row).toBe(clone.row);
      expect(coords.col).toBe(clone.col);
      expect(coords).not.toBe(clone);
    });
  });

  describe('isSouthEastOf()', () => {
    it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
      const coords = new CellCoords(5, 5);

      expect(coords.isSouthEastOf({ row: 0, col: 0 })).toBe(true);
      expect(coords.isSouthEastOf({ row: 0, col: 10 })).toBe(false);
      expect(coords.isSouthEastOf({ row: 10, col: 0 })).toBe(false);
      expect(coords.isSouthEastOf({ row: 10, col: 10 })).toBe(false);
    });
  });

  describe('isSouthWestOf()', () => {
    it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
      const coords = new CellCoords(5, 5);

      expect(coords.isSouthWestOf({ row: 0, col: 0 })).toBe(false);
      expect(coords.isSouthWestOf({ row: 0, col: 10 })).toBe(true);
      expect(coords.isSouthWestOf({ row: 10, col: 0 })).toBe(false);
      expect(coords.isSouthWestOf({ row: 10, col: 10 })).toBe(false);
    });
  });

  describe('isNorthEastOf()', () => {
    it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
      const coords = new CellCoords(5, 5);

      expect(coords.isNorthEastOf({ row: 0, col: 0 })).toBe(false);
      expect(coords.isNorthEastOf({ row: 0, col: 10 })).toBe(false);
      expect(coords.isNorthEastOf({ row: 10, col: 0 })).toBe(true);
      expect(coords.isNorthEastOf({ row: 10, col: 10 })).toBe(false);
    });
  });

  describe('isNorthWestOf()', () => {
    it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
      const coords = new CellCoords(5, 5);

      expect(coords.isNorthWestOf({ row: 0, col: 0 })).toBe(false);
      expect(coords.isNorthWestOf({ row: 0, col: 10 })).toBe(false);
      expect(coords.isNorthWestOf({ row: 10, col: 0 })).toBe(false);
      expect(coords.isNorthWestOf({ row: 10, col: 10 })).toBe(true);
    });
  });

  describe('RTL mode', () => {
    describe('isSouthEastOf()', () => {
      it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
        const coords = new CellCoords(5, 5, true);

        expect(coords.isSouthEastOf({ row: 0, col: 0 })).toBe(false);
        expect(coords.isSouthEastOf({ row: 0, col: 10 })).toBe(true);
        expect(coords.isSouthEastOf({ row: 10, col: 0 })).toBe(false);
        expect(coords.isSouthEastOf({ row: 10, col: 10 })).toBe(false);
      });
    });

    describe('isSouthWestOf()', () => {
      it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
        const coords = new CellCoords(5, 5, true);

        expect(coords.isSouthWestOf({ row: 0, col: 0 })).toBe(true);
        expect(coords.isSouthWestOf({ row: 0, col: 10 })).toBe(false);
        expect(coords.isSouthWestOf({ row: 10, col: 0 })).toBe(false);
        expect(coords.isSouthWestOf({ row: 10, col: 10 })).toBe(false);
      });
    });

    describe('isNorthEastOf()', () => {
      it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
        const coords = new CellCoords(5, 5, true);

        expect(coords.isNorthEastOf({ row: 0, col: 0 })).toBe(false);
        expect(coords.isNorthEastOf({ row: 0, col: 10 })).toBe(false);
        expect(coords.isNorthEastOf({ row: 10, col: 0 })).toBe(false);
        expect(coords.isNorthEastOf({ row: 10, col: 10 })).toBe(true);
      });
    });

    describe('isNorthWestOf()', () => {
      it('should correctly check the position of the CellCoords instance based on the passed coords', () => {
        const coords = new CellCoords(5, 5, true);

        expect(coords.isNorthWestOf({ row: 0, col: 0 })).toBe(false);
        expect(coords.isNorthWestOf({ row: 0, col: 10 })).toBe(false);
        expect(coords.isNorthWestOf({ row: 10, col: 0 })).toBe(true);
        expect(coords.isNorthWestOf({ row: 10, col: 10 })).toBe(false);
      });
    });
  });
});
