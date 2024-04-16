import SelectionCalculations from '../calculations/selection';
import MergedCellCoords from '../cellCoords';
import { CellCoords, CellRange } from '../../../3rdparty/walkontable/src';

const pluginMock = {
  hot: {
    _createCellCoords: (...args) => new CellCoords(...args),
    _createCellRange: (...args) => new CellRange(...args),
  }
};

describe('MergeCells-Selection calculations', () => {
  describe('isMergeCellFullySelected', () => {
    it('should check whether the provided merged cell is fully selected (in one selection layer)', () => {
      const instance = new SelectionCalculations(pluginMock);
      const mergedCellMock = new MergedCellCoords(5, 2, 3, 3);
      const improperRangeArrayMock = [
        new CellRange(new CellCoords(5, 2), new CellCoords(5, 2), new CellCoords(7, 3))
      ];
      const selectionRangeArrayMock = [
        new CellRange(new CellCoords(4, 1), new CellCoords(4, 1), new CellCoords(8, 5))
      ];

      expect(instance.isMergeCellFullySelected(mergedCellMock, improperRangeArrayMock)).toEqual(false);
      expect(instance.isMergeCellFullySelected(mergedCellMock, selectionRangeArrayMock)).toEqual(true);
    });

    it('should check whether the provided merged cell is fully selected (in multiple layer)', () => {
      const instance = new SelectionCalculations(pluginMock);
      const mergedCellMock = new MergedCellCoords(5, 2, 3, 3);
      const improperRangeArrayMock = [
        new CellRange(new CellCoords(5, 2), new CellCoords(5, 2), new CellCoords(7, 3)),
        new CellRange(new CellCoords(6, 4), new CellCoords(6, 4), new CellCoords(8, 5))
      ];
      const selectionRangeArrayMock = [
        new CellRange(new CellCoords(3, 2), new CellCoords(3, 2), new CellCoords(8, 2)),
        new CellRange(new CellCoords(5, 3), new CellCoords(5, 3), new CellCoords(10, 3)),
        new CellRange(new CellCoords(0, 4), new CellCoords(0, 4), new CellCoords(11, 9))
      ];
      const overlappingSelectionRangeArrayMock = [
        new CellRange(new CellCoords(3, 2), new CellCoords(3, 2), new CellCoords(8, 2)),
        new CellRange(new CellCoords(5, 3), new CellCoords(5, 3), new CellCoords(10, 3)),
        new CellRange(new CellCoords(3, 3), new CellCoords(3, 3), new CellCoords(11, 9))
      ];

      expect(instance.isMergeCellFullySelected(mergedCellMock, improperRangeArrayMock)).toEqual(false);
      expect(instance.isMergeCellFullySelected(mergedCellMock, selectionRangeArrayMock)).toEqual(true);
      expect(instance.isMergeCellFullySelected(mergedCellMock, overlappingSelectionRangeArrayMock)).toEqual(true);
    });
  });
});
