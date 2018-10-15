'use strict';

var _selection = require('../calculations/selection');

var _selection2 = _interopRequireDefault(_selection);

var _cellCoords = require('../cellCoords');

var _cellCoords2 = _interopRequireDefault(_cellCoords);

var _src = require('./../../../3rdparty/walkontable/src');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('MergeCells-Selection calculations', function () {
  describe('snapDelta', function () {
    it('should update the delta value to compensate the rowspan according to defined merged cells.', function () {
      var instance = new _selection2.default();
      var delta = {
        row: -1,
        col: 0
      };
      var selectionRange = new _src.CellRange(new _src.CellCoords(10, 0), new _src.CellCoords(10, 0), new _src.CellCoords(9, 2));
      var mergedCell = new _cellCoords2.default(7, 1, 3, 2);

      instance.snapDelta(delta, selectionRange, mergedCell);

      expect(delta.row).toEqual(-3);
      expect(delta.col).toEqual(0);
    });

    it('should update the delta value to compensate the colspan according to defined merged cells.', function () {
      var instance = new _selection2.default();
      var delta = {
        row: 0,
        col: -1
      };
      var selectionRange = new _src.CellRange(new _src.CellCoords(0, 10), new _src.CellCoords(0, 10), new _src.CellCoords(2, 9));
      var mergedCell = new _cellCoords2.default(1, 7, 2, 3);

      instance.snapDelta(delta, selectionRange, mergedCell);

      expect(delta.row).toEqual(0);
      expect(delta.col).toEqual(-3);
    });

    it('should update the delta value to compensate the rowspan according to defined merged cells, when two merged cells are overlapping vertically', function () {
      var instance = new _selection2.default();
      var delta = {
        row: -3,
        col: 0
      };
      var selectionRange = new _src.CellRange(new _src.CellCoords(10, 0), new _src.CellCoords(10, 0), new _src.CellCoords(9, 3));
      var mergedCell = new _cellCoords2.default(7, 1, 3, 2);
      var overlappingCollection = new _cellCoords2.default(5, 3, 3, 2);

      instance.snapDelta(delta, selectionRange, overlappingCollection, mergedCell);

      expect(delta.row).toEqual(-5);
      expect(delta.col).toEqual(0);
    });

    it('should update the delta value to compensate the colspan according to defined merged cells, when two merged cells are overlapping horizontally', function () {
      var instance = new _selection2.default();
      var delta = {
        row: 0,
        col: -3
      };
      var selectionRange = new _src.CellRange(new _src.CellCoords(0, 10), new _src.CellCoords(0, 10), new _src.CellCoords(3, 9));
      var mergedCell = new _cellCoords2.default(1, 7, 2, 3);
      var overlappingCollection = new _cellCoords2.default(3, 5, 2, 3);

      instance.snapDelta(delta, selectionRange, overlappingCollection, mergedCell);

      expect(delta.row).toEqual(0);
      expect(delta.col).toEqual(-5);
    });
  });

  describe('getUpdatedSelectionRange', function () {
    it('should increment the `to` property of the provided range with the values from the `delta` object.', function () {
      var instance = new _selection2.default();
      var delta = {
        row: 0,
        col: -3
      };
      var selectionRange = new _src.CellRange(new _src.CellCoords(0, 10), new _src.CellCoords(0, 10), new _src.CellCoords(3, 9));
      var extendedRange = instance.getUpdatedSelectionRange(selectionRange, delta);

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

  describe('isMergeCellFullySelected', function () {
    it('should check whether the provided merged cell is fully selected (in one selection layer)', function () {
      var instance = new _selection2.default();
      var mergedCellMock = new _cellCoords2.default(5, 2, 3, 3);
      var improperRangeArrayMock = [new _src.CellRange(new _src.CellCoords(5, 2), new _src.CellCoords(5, 2), new _src.CellCoords(7, 3))];
      var selectionRangeArrayMock = [new _src.CellRange(new _src.CellCoords(4, 1), new _src.CellCoords(4, 1), new _src.CellCoords(8, 5))];

      expect(instance.isMergeCellFullySelected(mergedCellMock, improperRangeArrayMock)).toEqual(false);
      expect(instance.isMergeCellFullySelected(mergedCellMock, selectionRangeArrayMock)).toEqual(true);
    });

    it('should check whether the provided merged cell is fully selected (in multiple layer)', function () {
      var instance = new _selection2.default();
      var mergedCellMock = new _cellCoords2.default(5, 2, 3, 3);
      var improperRangeArrayMock = [new _src.CellRange(new _src.CellCoords(5, 2), new _src.CellCoords(5, 2), new _src.CellCoords(7, 3)), new _src.CellRange(new _src.CellCoords(6, 4), new _src.CellCoords(6, 4), new _src.CellCoords(8, 5))];
      var selectionRangeArrayMock = [new _src.CellRange(new _src.CellCoords(3, 2), new _src.CellCoords(3, 2), new _src.CellCoords(8, 2)), new _src.CellRange(new _src.CellCoords(5, 3), new _src.CellCoords(5, 3), new _src.CellCoords(10, 3)), new _src.CellRange(new _src.CellCoords(0, 4), new _src.CellCoords(0, 4), new _src.CellCoords(11, 9))];
      var overlappingSelectionRangeArrayMock = [new _src.CellRange(new _src.CellCoords(3, 2), new _src.CellCoords(3, 2), new _src.CellCoords(8, 2)), new _src.CellRange(new _src.CellCoords(5, 3), new _src.CellCoords(5, 3), new _src.CellCoords(10, 3)), new _src.CellRange(new _src.CellCoords(3, 3), new _src.CellCoords(3, 3), new _src.CellCoords(11, 9))];

      expect(instance.isMergeCellFullySelected(mergedCellMock, improperRangeArrayMock)).toEqual(false);
      expect(instance.isMergeCellFullySelected(mergedCellMock, selectionRangeArrayMock)).toEqual(true);
      expect(instance.isMergeCellFullySelected(mergedCellMock, overlappingSelectionRangeArrayMock)).toEqual(true);
    });
  });
});