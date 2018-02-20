import SelectionCalculations from '../calculations/selection';
import MergedCellCoords from '../cellCoords';
import {CellCoords, CellRange} from './../../../3rdparty/walkontable/src';

describe('MergeCells-Selection calculations', () => {
  describe('snapDelta', () => {
    it('should update the delta value to compensate the rowspan according to defined merged cells.', () => {
      const instance = new SelectionCalculations();
      let delta = {
        row: -1,
        col: 0
      };
      let selectionRange = new CellRange(new CellCoords(10, 0), new CellCoords(10, 0), new CellCoords(9, 2));
      let mergedCell = new MergedCellCoords(7, 1, 3, 2);

      instance.snapDelta(delta, selectionRange, mergedCell);

      expect(delta.row).toEqual(-3);
      expect(delta.col).toEqual(0);
    });

    it('should update the delta value to compensate the colspan according to defined merged cells.', () => {
      const instance = new SelectionCalculations();
      let delta = {
        row: 0,
        col: -1
      };
      let selectionRange = new CellRange(new CellCoords(0, 10), new CellCoords(0, 10), new CellCoords(2, 9));
      let mergedCell = new MergedCellCoords(1, 7, 2, 3);

      instance.snapDelta(delta, selectionRange, mergedCell);

      expect(delta.row).toEqual(0);
      expect(delta.col).toEqual(-3);
    });

    it('should update the delta value to compensate the rowspan according to defined merged cells, when two merged cells are overlapping vertically', () => {
      const instance = new SelectionCalculations();
      let delta = {
        row: -3,
        col: 0
      };
      let selectionRange = new CellRange(new CellCoords(10, 0), new CellCoords(10, 0), new CellCoords(9, 3));
      let mergedCell = new MergedCellCoords(7, 1, 3, 2);
      let overlappingCollection = new MergedCellCoords(5, 3, 3, 2);

      instance.snapDelta(delta, selectionRange, overlappingCollection, mergedCell);

      expect(delta.row).toEqual(-5);
      expect(delta.col).toEqual(0);
    });

    it('should update the delta value to compensate the colspan according to defined merged cells, when two merged cells are overlapping horizontally', () => {
      const instance = new SelectionCalculations();
      let delta = {
        row: 0,
        col: -3
      };
      let selectionRange = new CellRange(new CellCoords(0, 10), new CellCoords(0, 10), new CellCoords(3, 9));
      let mergedCell = new MergedCellCoords(1, 7, 2, 3);
      let overlappingCollection = new MergedCellCoords(3, 5, 2, 3);

      instance.snapDelta(delta, selectionRange, overlappingCollection, mergedCell);

      expect(delta.row).toEqual(0);
      expect(delta.col).toEqual(-5);
    });
  });

  describe('getUpdatedSelectionRange', () => {
    it('should increment the `to` property of the provided range with the values from the `delta` object.', () => {
      const instance = new SelectionCalculations();
      let delta = {
        row: 0,
        col: -3
      };
      let selectionRange = new CellRange(new CellCoords(0, 10), new CellCoords(0, 10), new CellCoords(3, 9));
      let extendedRange = instance.getUpdatedSelectionRange(selectionRange, delta);

      expect(extendedRange.from.row).toEqual(0);
      expect(extendedRange.from.col).toEqual(10);
      expect(extendedRange.to.row).toEqual(3);
      expect(extendedRange.to.col).toEqual(6);

      delta = {
        row: 555,
        col: 0
      };

      extendedRange = instance.getUpdatedSelectionRange(extendedRange, delta);

      expect(extendedRange.from.row).toEqual(0);
      expect(extendedRange.from.col).toEqual(10);
      expect(extendedRange.to.row).toEqual(558);
      expect(extendedRange.to.col).toEqual(6);
    });
  });
});
