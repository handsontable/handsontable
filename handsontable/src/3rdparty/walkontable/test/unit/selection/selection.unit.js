import CellCoords from '../../../src/cell/coords';
import CellRange from '../../../src/cell/range';
import Selection from '../../../src/selection/selection';

describe('Selection', () => {
  describe('constructor()', () => {
    it('should be possible to construct the Selection class with arguments', () => {
      const coords = new CellCoords(0, 0);
      const range = new CellRange(coords);
      const options = {};
      const selection = new Selection(options, range);

      expect(selection.cellRange).toBe(range);
      expect(selection.settings).toBe(options);
    });
  });

  describe('isEmpty()', () => {
    it('should return `true` when the Selection is initialized with CellRange as `null`', () => {
      const selection = new Selection({}, null);

      expect(selection.isEmpty()).toBe(true);
    });

    it('should return `true` after assigning `null` to the cellRange property', () => {
      const selection = new Selection({}, new CellRange(new CellCoords(0, 0)));

      expect(selection.isEmpty()).toBe(false);

      selection.cellRange = null;

      expect(selection.isEmpty()).toBe(true);
    });
  });

  describe('add()', () => {
    it('should create a new CellRange instance when the Selection is empty', () => {
      const options = {
        createCellRange(coords) {
          return new CellRange(coords);
        }
      };

      spyOn(options, 'createCellRange').and.callThrough();

      const selection = new Selection(options, null);
      const coords = new CellCoords(0, 0);

      selection.add(coords);

      expect(options.createCellRange).toHaveBeenCalledWith(coords);
      expect(selection.cellRange.highlight).toEqual({ row: 0, col: 0 });
      expect(selection.cellRange.from).toEqual({ row: 0, col: 0 });
      expect(selection.cellRange.to).toEqual({ row: 0, col: 0 });
    });

    it('should extend existing CellRange instance when the Selection is not empty', () => {
      const options = {
        createCellRange(coords) {
          return new CellRange(coords);
        }
      };

      spyOn(options, 'createCellRange').and.callThrough();

      const selection = new Selection(options, new CellRange(new CellCoords(1, 1)));
      const coords = new CellCoords(3, 2);

      selection.add(coords);

      expect(options.createCellRange).not.toHaveBeenCalled();
      expect(selection.cellRange.highlight).toEqual({ row: 1, col: 1 });
      expect(selection.cellRange.from).toEqual({ row: 1, col: 1 });
      expect(selection.cellRange.to).toEqual({ row: 3, col: 2 });
    });
  });

  describe('replace()', () => {
    it('should do nothing and return `false` when the Selection is empty', () => {
      const selection = new Selection({}, null);
      const oldCoords = new CellCoords(1, 1);
      const newCoords = new CellCoords(2, 2);

      expect(selection.replace(oldCoords, newCoords)).toBe(false);
      expect(selection.isEmpty()).toBe(true);
    });

    it('should do nothing and return `false` oldCoords do not match to the range', () => {
      const selection = new Selection({}, new CellRange(new CellCoords(1, 1)));
      const oldCoords = new CellCoords(2, 2);
      const newCoords = new CellCoords(3, 3);

      expect(selection.replace(oldCoords, newCoords)).toBe(false);
      expect(selection.cellRange.highlight).toEqual({ row: 1, col: 1 });
      expect(selection.cellRange.from).toEqual({ row: 1, col: 1 });
      expect(selection.cellRange.to).toEqual({ row: 1, col: 1 });
    });

    it('should replace cellRange `from` property and return `true` when oldCoords match to the range', () => {
      const selection = new Selection({},
        new CellRange(new CellCoords(1, 1), new CellCoords(1, 1), new CellCoords(4, 4)));
      const oldCoords = new CellCoords(1, 1);
      const newCoords = new CellCoords(2, 2);

      expect(selection.replace(oldCoords, newCoords)).toBe(true);
      expect(selection.cellRange.highlight).toEqual({ row: 1, col: 1 });
      expect(selection.cellRange.from).toEqual({ row: 2, col: 2 });
      expect(selection.cellRange.to).toEqual({ row: 4, col: 4 });
    });

    it('should replace cellRange `to` property and return `true` when oldCoords match to the range', () => {
      const selection = new Selection({},
        new CellRange(new CellCoords(1, 1), new CellCoords(1, 1), new CellCoords(4, 4)));
      const oldCoords = new CellCoords(4, 4);
      const newCoords = new CellCoords(2, 2);

      expect(selection.replace(oldCoords, newCoords)).toBe(true);
      expect(selection.cellRange.highlight).toEqual({ row: 1, col: 1 });
      expect(selection.cellRange.from).toEqual({ row: 1, col: 1 });
      expect(selection.cellRange.to).toEqual({ row: 2, col: 2 });
    });
  });

  describe('clear()', () => {
    it('should clear the cellRange property and make the instance empty again', () => {
      const selection = new Selection({}, new CellRange(new CellCoords(1, 1)));

      selection.clear();

      expect(selection.isEmpty()).toBe(true);
    });
  });

  describe('getCorners()', () => {
    it('should return selection corners in pattern: [topRow, topColumn, bottomRow, bottomColumn]', () => {
      {
        const selection = new Selection(
          {}, new CellRange(new CellCoords(1, 2), new CellCoords(1, 2), new CellCoords(4, 5)));

        expect(selection.getCorners()).toEqual([1, 2, 4, 5]);
      }
      {
        const selection = new Selection(
          {}, new CellRange(new CellCoords(4, 5), new CellCoords(4, 5), new CellCoords(1, 2)));

        expect(selection.getCorners()).toEqual([1, 2, 4, 5]);
      }
    });
  });

  describe('destroy()', () => {
    it('should destroy the instance by running the local hook', () => {
      const selection = new Selection({}, new CellRange(new CellCoords(1, 1)));

      spyOn(selection, 'runLocalHooks');
      selection.destroy();

      expect(selection.runLocalHooks).toHaveBeenCalledWith('destroy');
    });
  });
});
