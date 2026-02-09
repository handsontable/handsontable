import { CopyableRangesFactory, normalizeRanges } from '../copyableRanges';
import CellRange from '../../../3rdparty/walkontable/src/cell/range';
import CellCoords from '../../../3rdparty/walkontable/src/cell/coords';

function createCellRange(startRow, startColumn, endRow, endColumn) {
  return new CellRange(
    new CellCoords(startRow, startColumn),
    new CellCoords(startRow, startColumn),
    new CellCoords(endRow, endColumn),
  );
}

describe('CopyPaste', () => {
  describe('`CopyableRangesFactory` class', () => {
    describe('`getCellsRange` method', () => {
      it('should return `null` when there are no rows rendered', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 0,
          countColumns: () => 10,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 2,
        });

        ranges.setSelectedRange(createCellRange(0, 0, 2, 2));

        expect(ranges.getCellsRange()).toBe(null);
      });

      it('should return `null` when there are no columns rendered', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 10,
          countColumns: () => 0,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 2,
        });

        ranges.setSelectedRange(createCellRange(0, 0, 2, 2));

        expect(ranges.getCellsRange()).toBe(null);
      });

      it('should return copyable range of the cells only', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 10,
          countColumns: () => 10,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 2,
        });

        ranges.setSelectedRange(createCellRange(1, 2, 3, 4));

        expect(ranges.getCellsRange()).toEqual({
          isRangeTrimmed: false,
          startRow: 1,
          startCol: 2,
          endRow: 3,
          endCol: 4,
        });
      });

      it('should ignore coords that point to the row and column headers (negative values)', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 100,
          countColumns: () => 100,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 2,
        });

        ranges.setSelectedRange(createCellRange(-2, -3, 15, 70));

        expect(ranges.getCellsRange()).toEqual({
          isRangeTrimmed: false,
          startRow: 0,
          startCol: 0,
          endRow: 15,
          endCol: 70,
        });
      });

      it('should return trimmed copyable range of the cells', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 100,
          countColumns: () => 100,
          rowsLimit: () => 5,
          columnsLimit: () => 10,
          countColumnHeaders: () => 2,
        });

        ranges.setSelectedRange(createCellRange(-2, -3, 15, 70));

        expect(ranges.getCellsRange()).toEqual({
          isRangeTrimmed: true,
          startRow: 0,
          startCol: 0,
          endRow: 4,
          endCol: 9,
        });
      });

      it('should not be possible to limit rows/columns count below 1', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 100,
          countColumns: () => 100,
          rowsLimit: () => 0,
          columnsLimit: () => 0,
          countColumnHeaders: () => 2,
        });

        ranges.setSelectedRange(createCellRange(-2, -3, 15, 70));

        expect(ranges.getCellsRange()).toEqual({
          isRangeTrimmed: true,
          startRow: 0,
          startCol: 0,
          endRow: 0,
          endCol: 0,
        });

        ranges.setSelectedRange(createCellRange(9, 65, 15, 70));

        expect(ranges.getCellsRange()).toEqual({
          isRangeTrimmed: true,
          startRow: 9,
          startCol: 65,
          endRow: 9,
          endCol: 65,
        });
      });
    });

    describe('`getMostBottomColumnHeadersRange` method', () => {
      it('should return `null` when there are no columns rendered', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 10,
          countColumns: () => 0,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 2,
        });

        ranges.setSelectedRange(createCellRange(0, 0, 2, 2));

        expect(ranges.getMostBottomColumnHeadersRange()).toBe(null);
      });

      it('should return `null` when there are no column headers rendered', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 10,
          countColumns: () => 10,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 0,
        });

        ranges.setSelectedRange(createCellRange(0, 0, 2, 2));

        expect(ranges.getMostBottomColumnHeadersRange()).toBe(null);
      });

      it('should return copyable range of the most-bottom column headers only', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 10,
          countColumns: () => 10,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 2,
        });

        ranges.setSelectedRange(createCellRange(1, 2, 3, 4));

        expect(ranges.getMostBottomColumnHeadersRange()).toEqual({
          isRangeTrimmed: false,
          startRow: -1,
          startCol: 2,
          endRow: -1,
          endCol: 4,
        });
      });

      it('should return copyable range of the most-bottom column headers when there is no rows', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 0,
          countColumns: () => 10,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 2,
        });

        ranges.setSelectedRange(createCellRange(1, 2, 3, 4));

        expect(ranges.getMostBottomColumnHeadersRange()).toEqual({
          isRangeTrimmed: false,
          startRow: -1,
          startCol: 2,
          endRow: -1,
          endCol: 4,
        });
      });

      it('should ignore coords that point to the row and column headers (negative values)', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 100,
          countColumns: () => 100,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 2,
        });

        ranges.setSelectedRange(createCellRange(-2, -3, 15, 70));

        expect(ranges.getMostBottomColumnHeadersRange()).toEqual({
          isRangeTrimmed: false,
          startRow: -1,
          startCol: 0,
          endRow: -1,
          endCol: 70,
        });
      });

      it('should return trimmed copyable range of most-bottom column headers', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 100,
          countColumns: () => 100,
          rowsLimit: () => 5,
          columnsLimit: () => 10,
          countColumnHeaders: () => 2,
        });

        ranges.setSelectedRange(createCellRange(-2, -3, 15, 70));

        expect(ranges.getMostBottomColumnHeadersRange()).toEqual({
          isRangeTrimmed: true,
          startRow: -1,
          startCol: 0,
          endRow: -1,
          endCol: 9,
        });
      });

      it('should not be possible to limit rows/columns count below 1', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 100,
          countColumns: () => 100,
          rowsLimit: () => 0,
          columnsLimit: () => 0,
          countColumnHeaders: () => 2,
        });

        ranges.setSelectedRange(createCellRange(-2, -3, 15, 70));

        expect(ranges.getMostBottomColumnHeadersRange()).toEqual({
          isRangeTrimmed: true,
          startRow: -1,
          startCol: 0,
          endRow: -1,
          endCol: 0,
        });

        ranges.setSelectedRange(createCellRange(9, 65, 15, 70));

        expect(ranges.getMostBottomColumnHeadersRange()).toEqual({
          isRangeTrimmed: true,
          startRow: -1,
          startCol: 65,
          endRow: -1,
          endCol: 65,
        });
      });
    });

    describe('`getAllColumnHeadersRange` method', () => {
      it('should return `null` when there are no columns rendered', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 10,
          countColumns: () => 0,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 5,
        });

        ranges.setSelectedRange(createCellRange(0, 0, 2, 2));

        expect(ranges.getAllColumnHeadersRange()).toBe(null);
      });

      it('should return `null` when there are no column headers rendered', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 10,
          countColumns: () => 10,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 0,
        });

        ranges.setSelectedRange(createCellRange(0, 0, 2, 2));

        expect(ranges.getAllColumnHeadersRange()).toBe(null);
      });

      it('should return copyable range of the all column headers', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 10,
          countColumns: () => 10,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 5,
        });

        ranges.setSelectedRange(createCellRange(1, 2, 3, 4));

        expect(ranges.getAllColumnHeadersRange()).toEqual({
          isRangeTrimmed: false,
          startRow: -5,
          startCol: 2,
          endRow: -1,
          endCol: 4,
        });
      });

      it('should return copyable range of the all column headers when there is no rows', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 0,
          countColumns: () => 10,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 5,
        });

        ranges.setSelectedRange(createCellRange(1, 2, 3, 4));

        expect(ranges.getAllColumnHeadersRange()).toEqual({
          isRangeTrimmed: false,
          startRow: -5,
          startCol: 2,
          endRow: -1,
          endCol: 4,
        });
      });

      it('should ignore coords that point to the row and column headers (negative values)', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 100,
          countColumns: () => 100,
          rowsLimit: () => Infinity,
          columnsLimit: () => Infinity,
          countColumnHeaders: () => 5,
        });

        ranges.setSelectedRange(createCellRange(-2, -3, 15, 70));

        expect(ranges.getAllColumnHeadersRange()).toEqual({
          isRangeTrimmed: false,
          startRow: -5,
          startCol: 0,
          endRow: -1,
          endCol: 70,
        });
      });

      it('should return trimmed copyable range of all column headers', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 100,
          countColumns: () => 100,
          rowsLimit: () => 5,
          columnsLimit: () => 10,
          countColumnHeaders: () => 5,
        });

        ranges.setSelectedRange(createCellRange(-2, -3, 15, 70));

        expect(ranges.getAllColumnHeadersRange()).toEqual({
          isRangeTrimmed: true,
          startRow: -5,
          startCol: 0,
          endRow: -1,
          endCol: 9,
        });
      });

      it('should not be possible to limit rows/columns count below 1', () => {
        const ranges = new CopyableRangesFactory({
          countRows: () => 100,
          countColumns: () => 100,
          rowsLimit: () => 0,
          columnsLimit: () => 0,
          countColumnHeaders: () => 5,
        });

        ranges.setSelectedRange(createCellRange(-5, -3, 15, 70));

        expect(ranges.getAllColumnHeadersRange()).toEqual({
          isRangeTrimmed: true,
          startRow: -5,
          startCol: 0,
          endRow: -1,
          endCol: 0,
        });

        ranges.setSelectedRange(createCellRange(9, 65, 15, 70));

        expect(ranges.getAllColumnHeadersRange()).toEqual({
          isRangeTrimmed: true,
          startRow: -5,
          startCol: 65,
          endRow: -1,
          endCol: 65,
        });
      });
    });
  });

  describe('`normalizeRanges` utils', () => {
    it('should return a correct results for specific range', () => {
      expect(normalizeRanges([
        { startRow: 0, endRow: 0, startCol: 0, endCol: 0 }
      ])).toEqual({
        rows: [0],
        columns: [0],
      });
      expect(normalizeRanges([
        { startRow: 0, endRow: 2, startCol: 3, endCol: 9 }
      ])).toEqual({
        rows: [0, 1, 2],
        columns: [3, 4, 5, 6, 7, 8, 9],
      });
      expect(normalizeRanges([
        { startRow: -3, endRow: 2, startCol: 3, endCol: 9 }
      ])).toEqual({
        rows: [-3, -2, -1, 0, 1, 2],
        columns: [3, 4, 5, 6, 7, 8, 9],
      });
      expect(normalizeRanges([
        { startRow: 2, endRow: -3, startCol: 9, endCol: 3 }
      ])).toEqual({
        rows: [-3, -2, -1, 0, 1, 2],
        columns: [3, 4, 5, 6, 7, 8, 9],
      });
    });

    it('should return a correct results with uniq indexes for multiple ranges', () => {
      // the same coords but defined with opposite directions
      expect(normalizeRanges([
        { startRow: -3, endRow: 2, startCol: 3, endCol: 9 },
        { startRow: 2, endRow: -3, startCol: 9, endCol: 3 },
      ])).toEqual({
        rows: [-3, -2, -1, 0, 1, 2],
        columns: [3, 4, 5, 6, 7, 8, 9],
      });
      expect(normalizeRanges([
        { startRow: -3, endRow: 2, startCol: 3, endCol: 9 },
        { startRow: 2, endRow: -3, startCol: 9, endCol: 3 },
        { startRow: 100, endRow: 101, startCol: 9, endCol: 3 },
        { startRow: 0, endRow: 0, startCol: 22, endCol: 19 },
      ])).toEqual({
        rows: [-3, -2, -1, 0, 1, 2, 100, 101],
        columns: [3, 4, 5, 6, 7, 8, 9, 19, 20, 21, 22],
      });
    });
  });
});
