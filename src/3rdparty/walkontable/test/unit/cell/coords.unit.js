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
});
