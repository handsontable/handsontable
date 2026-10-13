import TableView from 'handsontable/tableView';
import { command as moveToMostInlineEnd } from '../moveCellSelection/toMostInlineEnd';
import { command as moveToMostBottomInlineEnd } from '../moveCellSelection/toMostBottomInlineEnd';
import { command as extendToMostInlineEnd } from '../extendCellsSelection/toMostInlineEnd';

/**
 * A grid stub that answers what the End and Ctrl+End commands read.
 *
 * @param {object} options The grid shape.
 * @param options.totalColumns
 * @param options.fixedColumnsStart
 * @param options.fixedColumnsEnd
 * @returns {object}
 */
function createHot({ totalColumns = 6, fixedColumnsStart = 0, fixedColumnsEnd = 0 } = {}) {
  const selection = {
    markSource: jest.fn(),
    markEndSource: jest.fn(),
    setRangeStart: jest.fn(),
    setRangeEnd: jest.fn(),
    isSelectedByRowHeader: () => false,
    isSelectedByCorner: () => false,
  };
  const highlight = { row: 1, col: 2, isCell: () => true, clone: () => ({ row: 1, col: 2 }) };
  const range = {
    highlight,
    from: { row: 1, col: 2, clone: () => ({ row: 1, col: 2 }) },
    to: { row: 1, col: 2 },
  };

  const settings = { fixedColumnsStart, fixedColumnsEnd };
  const hot = {
    selection,
    countCols: () => totalColumns,
    countRows: () => 5,
    getSettings: () => settings,
    getSelectedRangeActive: () => range,
    columnIndexMapper: { getNearestNotHiddenIndex: index => index },
    rowIndexMapper: { getNearestNotHiddenIndex: index => index },
    _createCellCoords: (row, col) => ({ row, col }),
  };

  // The real TableView counter, so the stub cannot drift from the band size the renderer uses.
  hot.view = { countFixedColumnsEnd: () => TableView.prototype.countFixedColumnsEnd.call({ settings, hot }) };

  return hot;
}

describe('the most inline end commands', () => {
  describe('moveCellSelectionToMostInlineEnd', () => {
    it('should move to the last column when no end column is frozen', () => {
      const hot = createHot();

      moveToMostInlineEnd.callback(hot);

      expect(hot.selection.setRangeStart).toHaveBeenCalledWith({ row: 1, col: 5 });
    });

    it('should move to the last column that is not frozen at the end', () => {
      const hot = createHot({ fixedColumnsEnd: 2 });

      moveToMostInlineEnd.callback(hot);

      expect(hot.selection.setRangeStart).toHaveBeenCalledWith({ row: 1, col: 3 });
    });

    it('should do nothing when the start and end columns cover the grid', () => {
      const hot = createHot({ fixedColumnsStart: 3, fixedColumnsEnd: 3 });

      moveToMostInlineEnd.callback(hot);

      expect(hot.selection.setRangeStart).not.toHaveBeenCalled();
      expect(hot.selection.markSource).not.toHaveBeenCalled();
    });
  });

  describe('moveCellSelectionToMostBottomInlineEnd', () => {
    it('should move to the last row and column when no end column is frozen', () => {
      const hot = createHot();

      moveToMostBottomInlineEnd.callback(hot);

      expect(hot.selection.setRangeStart).toHaveBeenCalledWith({ row: 4, col: 5 });
    });

    it('should move to the last column that is not frozen at the end', () => {
      const hot = createHot({ fixedColumnsEnd: 2 });

      moveToMostBottomInlineEnd.callback(hot);

      expect(hot.selection.setRangeStart).toHaveBeenCalledWith({ row: 4, col: 3 });
    });

    it('should do nothing when the start and end columns cover the grid', () => {
      const hot = createHot({ fixedColumnsStart: 3, fixedColumnsEnd: 3 });

      moveToMostBottomInlineEnd.callback(hot);

      expect(hot.selection.setRangeStart).not.toHaveBeenCalled();
    });
  });

  describe('extendCellsSelectionToMostInlineEnd', () => {
    it('should extend to the last column that is not frozen at the end', () => {
      const hot = createHot({ fixedColumnsEnd: 2 });

      extendToMostInlineEnd.callback(hot);

      expect(hot.selection.setRangeEnd).toHaveBeenCalledWith({ row: 1, col: 3 });
    });

    it('should do nothing when the start and end columns cover the grid', () => {
      const hot = createHot({ fixedColumnsStart: 3, fixedColumnsEnd: 3 });

      extendToMostInlineEnd.callback(hot);

      expect(hot.selection.setRangeStart).not.toHaveBeenCalled();
      expect(hot.selection.setRangeEnd).not.toHaveBeenCalled();
    });
  });
});
