import MergedCellsCollection from '../cellsCollection';
import MergedCell from '../cellCoords';
import { CellCoords, CellRange } from '../../../3rdparty/walkontable/src';

describe('MergeCells', () => {
  /**
   *
   */
  function createMergedCell(row, col, rowspan, colspan) {
    return new MergedCell(
      row,
      col,
      rowspan,
      colspan,
      (...args) => new CellCoords(...args),
      (...args) => new CellRange(...args),
    );
  }

  describe('MergedCellsCollection', () => {
    const hotMock = {
      render: () => {
      },
      countCols: () => 100,
      countRows: () => 100,
      _createCellCoords: (row, column) => new CellCoords(row, column),
      _createCellRange: (highlight, from, to) => new CellRange(highlight, from, to),
    };

    /**
     *
     */
    function createCellRange(fromRow, fromColumn, toRow, toColumn) {
      return new CellRange(
        new CellCoords(fromRow, fromColumn),
        new CellCoords(fromRow, fromColumn),
        new CellCoords(toRow, toColumn)
      );
    }

    describe('`add` method', () => {
      it('should add a merged cell object to the array of merged cells', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        expect(mergedCellsCollection.mergedCells.length).toEqual(3);
        expect(mergedCellsCollection.mergedCells[0].row).toEqual(0);
        expect(mergedCellsCollection.mergedCells[0].col).toEqual(1);
        expect(mergedCellsCollection.mergedCells[0].rowspan).toEqual(3);
        expect(mergedCellsCollection.mergedCells[0].colspan).toEqual(4);
        expect(mergedCellsCollection.mergedCells[1].row).toEqual(10);
        expect(mergedCellsCollection.mergedCells[1].col).toEqual(11);
        expect(mergedCellsCollection.mergedCells[1].rowspan).toEqual(3);
        expect(mergedCellsCollection.mergedCells[1].colspan).toEqual(4);
        expect(mergedCellsCollection.mergedCells[2].row).toEqual(20);
        expect(mergedCellsCollection.mergedCells[2].col).toEqual(21);
        expect(mergedCellsCollection.mergedCells[2].rowspan).toEqual(3);
        expect(mergedCellsCollection.mergedCells[2].colspan).toEqual(4);
      });

      it('should not add new merged cells and throw an appropriate warning, if the merged cell is overlapping any other ' +
        'previously declared merged cell', () => {
        const warnSpy = spyOn(console, 'warn');

        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });
        const newMergedCells = [
          {
            row: 0,
            col: 1,
            rowspan: 3,
            colspan: 4
          },
          {
            row: 1,
            col: 2,
            rowspan: 3,
            colspan: 4
          },
          {
            row: 20,
            col: 21,
            rowspan: 3,
            colspan: 4
          }];

        mergedCellsCollection.add(newMergedCells[0]);
        mergedCellsCollection.add(newMergedCells[1]);
        mergedCellsCollection.add(newMergedCells[2]);

        expect(warnSpy).toHaveBeenCalledWith(MergedCellsCollection.IS_OVERLAPPING_WARNING(newMergedCells[1]));
        expect(mergedCellsCollection.mergedCells.length).toEqual(2);
        expect(mergedCellsCollection.mergedCells[0].row).toEqual(0);
        expect(mergedCellsCollection.mergedCells[0].col).toEqual(1);
        expect(mergedCellsCollection.mergedCells[1].row).toEqual(20);
        expect(mergedCellsCollection.mergedCells[1].col).toEqual(21);
      });
    });

    describe('`remove` method', () => {
      it('should remove a merged cell object from the array of merged cells by passing the starting coordinates', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        mergedCellsCollection.remove(10, 11);

        expect(mergedCellsCollection.mergedCells.length).toEqual(2);
        expect(mergedCellsCollection.mergedCells[0].row).toEqual(0);
        expect(mergedCellsCollection.mergedCells[0].col).toEqual(1);
        expect(mergedCellsCollection.mergedCells[0].rowspan).toEqual(3);
        expect(mergedCellsCollection.mergedCells[0].colspan).toEqual(4);
        expect(mergedCellsCollection.mergedCells[1].row).toEqual(20);
        expect(mergedCellsCollection.mergedCells[1].col).toEqual(21);
        expect(mergedCellsCollection.mergedCells[1].rowspan).toEqual(3);
        expect(mergedCellsCollection.mergedCells[1].colspan).toEqual(4);
      });

      it('should remove a merged cell object from the array of merged cells by passing the coordinates from the middle of the merged cell', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        mergedCellsCollection.remove(12, 13);

        expect(mergedCellsCollection.mergedCells.length).toEqual(2);
        expect(mergedCellsCollection.mergedCells[0].row).toEqual(0);
        expect(mergedCellsCollection.mergedCells[0].col).toEqual(1);
        expect(mergedCellsCollection.mergedCells[0].rowspan).toEqual(3);
        expect(mergedCellsCollection.mergedCells[0].colspan).toEqual(4);
        expect(mergedCellsCollection.mergedCells[1].row).toEqual(20);
        expect(mergedCellsCollection.mergedCells[1].col).toEqual(21);
        expect(mergedCellsCollection.mergedCells[1].rowspan).toEqual(3);
        expect(mergedCellsCollection.mergedCells[1].colspan).toEqual(4);
      });
    });

    describe('`get` method', () => {
      it('should get a merged cell object from the array of merged cells by passing the starting coordinates', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        const wantedCollection = mergedCellsCollection.get(10, 11);

        expect(wantedCollection.row).toEqual(10);
        expect(wantedCollection.col).toEqual(11);
        expect(wantedCollection.rowspan).toEqual(3);
        expect(wantedCollection.colspan).toEqual(4);
      });

      it('should get a merged cell object from the array of merged cells by passing coordinates from the middle of the merged cell', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        const wantedCollection = mergedCellsCollection.get(12, 13);

        expect(wantedCollection.row).toEqual(10);
        expect(wantedCollection.col).toEqual(11);
        expect(wantedCollection.rowspan).toEqual(3);
        expect(wantedCollection.colspan).toEqual(4);
      });
    });

    describe('`getByRange` method', () => {
      it('should get a merged cell object from the array of merged cells by passing coordinates from the middle of the merged cell', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        const range = new CellRange(
          new CellCoords(9, 10),
          new CellCoords(9, 10),
          new CellCoords(12, 15),
        );

        const wantedCollection = mergedCellsCollection.getByRange(range);

        expect(wantedCollection.row).toEqual(10);
        expect(wantedCollection.col).toEqual(11);
        expect(wantedCollection.rowspan).toEqual(3);
        expect(wantedCollection.colspan).toEqual(4);
      });
    });

    describe('`getWithinRange` method', () => {
      it('should get an array of merged cells within the provided range', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        const wantedCollections = mergedCellsCollection.getWithinRange(
          new CellRange(new CellCoords(0, 0), new CellCoords(0, 0), new CellCoords(19, 20))
        );

        expect(wantedCollections.length).toEqual(2);
        expect(wantedCollections[0].row).toEqual(0);
        expect(wantedCollections[0].col).toEqual(1);
        expect(wantedCollections[0].rowspan).toEqual(3);
        expect(wantedCollections[0].colspan).toEqual(4);
        expect(wantedCollections[1].row).toEqual(10);
        expect(wantedCollections[1].col).toEqual(11);
        expect(wantedCollections[1].rowspan).toEqual(3);
        expect(wantedCollections[1].colspan).toEqual(4);
      });

      it('should return an empty array when no merged cells found', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });
        const wantedCollections = mergedCellsCollection.getWithinRange(
          new CellRange(new CellCoords(0, 0), new CellCoords(0, 0), new CellCoords(5, 5))
        );

        expect(wantedCollections).toEqual([]);
      });
    });

    describe('`shiftCollections` method', () => {
      it('should shift all the appropriate merged cells in the provided direction', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        mergedCellsCollection.shiftCollections('down', 0, 5);

        expect(mergedCellsCollection.mergedCells[0].row).toEqual(5);
        expect(mergedCellsCollection.mergedCells[0].col).toEqual(1);
        expect(mergedCellsCollection.mergedCells[1].row).toEqual(15);
        expect(mergedCellsCollection.mergedCells[1].col).toEqual(11);
        expect(mergedCellsCollection.mergedCells[2].row).toEqual(25);
        expect(mergedCellsCollection.mergedCells[2].col).toEqual(21);

        mergedCellsCollection.shiftCollections('right', 0, 5);

        expect(mergedCellsCollection.mergedCells[0].row).toEqual(5);
        expect(mergedCellsCollection.mergedCells[0].col).toEqual(6);
        expect(mergedCellsCollection.mergedCells[1].row).toEqual(15);
        expect(mergedCellsCollection.mergedCells[1].col).toEqual(16);
        expect(mergedCellsCollection.mergedCells[2].row).toEqual(25);
        expect(mergedCellsCollection.mergedCells[2].col).toEqual(26);

        mergedCellsCollection.shiftCollections('up', 0, 5);

        expect(mergedCellsCollection.mergedCells[0].row).toEqual(0);
        expect(mergedCellsCollection.mergedCells[0].col).toEqual(6);
        expect(mergedCellsCollection.mergedCells[1].row).toEqual(10);
        expect(mergedCellsCollection.mergedCells[1].col).toEqual(16);
        expect(mergedCellsCollection.mergedCells[2].row).toEqual(20);
        expect(mergedCellsCollection.mergedCells[2].col).toEqual(26);

        mergedCellsCollection.shiftCollections('left', 0, 5);

        expect(mergedCellsCollection.mergedCells[0].row).toEqual(0);
        expect(mergedCellsCollection.mergedCells[0].col).toEqual(1);
        expect(mergedCellsCollection.mergedCells[1].row).toEqual(10);
        expect(mergedCellsCollection.mergedCells[1].col).toEqual(11);
        expect(mergedCellsCollection.mergedCells[2].row).toEqual(20);
        expect(mergedCellsCollection.mergedCells[2].col).toEqual(21);

      });

      it('should resize the merged cell (and shift the merged cells that follow) if the change happened inside a merged cell', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        mergedCellsCollection.shiftCollections('down', 1, 5);

        expect(mergedCellsCollection.mergedCells[0].row).toEqual(0);
        expect(mergedCellsCollection.mergedCells[0].col).toEqual(1);
        expect(mergedCellsCollection.mergedCells[0].rowspan).toEqual(8);
        expect(mergedCellsCollection.mergedCells[1].row).toEqual(15);
        expect(mergedCellsCollection.mergedCells[1].col).toEqual(11);
        expect(mergedCellsCollection.mergedCells[1].rowspan).toEqual(3);
        expect(mergedCellsCollection.mergedCells[2].row).toEqual(25);
        expect(mergedCellsCollection.mergedCells[2].col).toEqual(21);
        expect(mergedCellsCollection.mergedCells[2].rowspan).toEqual(3);

        mergedCellsCollection.shiftCollections('right', 2, 5);

        expect(mergedCellsCollection.mergedCells[0].row).toEqual(0);
        expect(mergedCellsCollection.mergedCells[0].col).toEqual(1);
        expect(mergedCellsCollection.mergedCells[0].rowspan).toEqual(8);
        expect(mergedCellsCollection.mergedCells[0].colspan).toEqual(9);
        expect(mergedCellsCollection.mergedCells[1].row).toEqual(15);
        expect(mergedCellsCollection.mergedCells[1].col).toEqual(16);
        expect(mergedCellsCollection.mergedCells[1].rowspan).toEqual(3);
        expect(mergedCellsCollection.mergedCells[2].row).toEqual(25);
        expect(mergedCellsCollection.mergedCells[2].col).toEqual(26);
        expect(mergedCellsCollection.mergedCells[2].rowspan).toEqual(3);

      });
    });

    describe('`isOverlapping` method', () => {
      it('should return whether the provided merged cell overlaps with the others in the merged cell', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        mergedCellsCollection.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        expect(mergedCellsCollection.isOverlapping(createMergedCell(30, 30, 3, 3))).toEqual(false);
        expect(mergedCellsCollection.isOverlapping(createMergedCell(2, 2, 3, 3))).toEqual(true);
        expect(mergedCellsCollection.isOverlapping(createMergedCell(9, 9, 3, 3))).toEqual(true);
        expect(mergedCellsCollection.isOverlapping(createMergedCell(21, 19, 5, 5))).toEqual(true);
        expect(mergedCellsCollection.isOverlapping(createMergedCell(21, 22, 5, 5))).toEqual(true);
        expect(mergedCellsCollection.isOverlapping(createMergedCell(24, 25, 5, 5))).toEqual(false);
      });
    });

    describe('`getStartMostColumnIndex` method', () => {
      it('should return start-most column index of where the merge cells are not intersected', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 1,
          col: 2,
          rowspan: 2,
          colspan: 2
        });
        mergedCellsCollection.add({
          row: 3,
          col: 3,
          rowspan: 2,
          colspan: 2
        });

        const range = createCellRange(0, 1, 5, 5);

        expect(mergedCellsCollection.getStartMostColumnIndex(range, 0)).toBe(0);
        expect(mergedCellsCollection.getStartMostColumnIndex(range, 1)).toBe(1);
        expect(mergedCellsCollection.getStartMostColumnIndex(range, 2)).toBe(2);
        expect(mergedCellsCollection.getStartMostColumnIndex(range, 3)).toBe(2);
        expect(mergedCellsCollection.getStartMostColumnIndex(range, 4)).toBe(2);
        expect(mergedCellsCollection.getStartMostColumnIndex(range, 5)).toBe(5);
        expect(mergedCellsCollection.getStartMostColumnIndex(range, 6)).toBe(5);
      });
    });

    describe('`getEndMostColumnIndex` method', () => {
      it('should return end-most column index of where the merge cells are not intersected', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 1,
          col: 2,
          rowspan: 2,
          colspan: 2
        });
        mergedCellsCollection.add({
          row: 3,
          col: 3,
          rowspan: 2,
          colspan: 2
        });

        const range = createCellRange(0, 1, 5, 5);

        expect(mergedCellsCollection.getEndMostColumnIndex(range, 0)).toBe(1);
        expect(mergedCellsCollection.getEndMostColumnIndex(range, 1)).toBe(1);
        expect(mergedCellsCollection.getEndMostColumnIndex(range, 2)).toBe(4);
        expect(mergedCellsCollection.getEndMostColumnIndex(range, 3)).toBe(4);
        expect(mergedCellsCollection.getEndMostColumnIndex(range, 4)).toBe(4);
        expect(mergedCellsCollection.getEndMostColumnIndex(range, 5)).toBe(5);
        expect(mergedCellsCollection.getEndMostColumnIndex(range, 6)).toBe(6);
      });
    });

    describe('`getTopMostRowIndex` method', () => {
      it('should return top-most row index of where the merge cells are not intersected', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 2,
          col: 1,
          rowspan: 2,
          colspan: 2
        });
        mergedCellsCollection.add({
          row: 3,
          col: 3,
          rowspan: 2,
          colspan: 2
        });

        const range = createCellRange(1, 0, 5, 5);

        expect(mergedCellsCollection.getTopMostRowIndex(range, 0)).toBe(0);
        expect(mergedCellsCollection.getTopMostRowIndex(range, 1)).toBe(1);
        expect(mergedCellsCollection.getTopMostRowIndex(range, 2)).toBe(2);
        expect(mergedCellsCollection.getTopMostRowIndex(range, 3)).toBe(2);
        expect(mergedCellsCollection.getTopMostRowIndex(range, 4)).toBe(2);
        expect(mergedCellsCollection.getTopMostRowIndex(range, 5)).toBe(5);
        expect(mergedCellsCollection.getTopMostRowIndex(range, 6)).toBe(5);
      });
    });

    describe('static `detectContiguousRuns` method', () => {
      it('should return an empty array for an empty input', () => {
        expect(MergedCellsCollection.detectContiguousRuns([])).toEqual([]);
      });

      it('should return a single run for a single index', () => {
        expect(MergedCellsCollection.detectContiguousRuns([5])).toEqual([
          { start: 5, length: 1 },
        ]);
      });

      it('should detect a single contiguous run', () => {
        expect(MergedCellsCollection.detectContiguousRuns([2, 3, 4])).toEqual([
          { start: 2, length: 3 },
        ]);
      });

      it('should split into runs at gaps', () => {
        expect(MergedCellsCollection.detectContiguousRuns([0, 3, 4])).toEqual([
          { start: 0, length: 1 },
          { start: 3, length: 2 },
        ]);
      });

      it('should handle three separated runs', () => {
        expect(MergedCellsCollection.detectContiguousRuns([0, 2, 4, 5])).toEqual([
          { start: 0, length: 1 },
          { start: 2, length: 1 },
          { start: 4, length: 2 },
        ]);
      });
    });

    describe('`capturePhysicalSpans` method', () => {
      it('should map every merge to its visual->physical column indexes', () => {
        const hot = {
          ...hotMock,
          toPhysicalColumn: visualIndex => visualIndex + 100,
          toPhysicalRow: visualIndex => visualIndex,
        };
        const collection = new MergedCellsCollection({ hot });

        collection.add({ row: 0, col: 2, rowspan: 1, colspan: 3 });
        collection.add({ row: 4, col: 7, rowspan: 2, colspan: 1 });

        const snapshot = collection.capturePhysicalSpans('column');

        expect(snapshot.size).toBe(2);
        expect(snapshot.get(collection.mergedCells[0])).toEqual([102, 103, 104]);
        expect(snapshot.get(collection.mergedCells[1])).toEqual([107]);
      });

      it('should map every merge to its visual->physical row indexes', () => {
        const hot = {
          ...hotMock,
          toPhysicalColumn: visualIndex => visualIndex,
          toPhysicalRow: visualIndex => visualIndex + 200,
        };
        const collection = new MergedCellsCollection({ hot });

        collection.add({ row: 3, col: 0, rowspan: 2, colspan: 1 });

        const snapshot = collection.capturePhysicalSpans('row');

        expect(snapshot.size).toBe(1);
        expect(snapshot.get(collection.mergedCells[0])).toEqual([203, 204]);
      });
    });

    describe('`translateAfterAxisMove` method', () => {
      /**
       *
       */
      function createHot(physicalToVisual) {
        return {
          ...hotMock,
          toVisualColumn: physical => (physicalToVisual.has(physical) ? physicalToVisual.get(physical) : -1),
          toPhysicalColumn: visual => visual,
          toVisualRow: physical => (physicalToVisual.has(physical) ? physicalToVisual.get(physical) : -1),
          toPhysicalRow: visual => visual,
        };
      }

      it('should keep a merge intact when its physical span stays contiguous', () => {
        const collection = new MergedCellsCollection({
          hot: createHot(new Map([[2, 3], [3, 4], [4, 5]])),
        });

        collection.add({ row: 0, col: 2, rowspan: 1, colspan: 3 });

        const snapshot = new Map();

        snapshot.set(collection.mergedCells[0], [2, 3, 4]);

        collection.translateAfterAxisMove('column', snapshot);

        expect(collection.mergedCells.length).toBe(1);
        expect(collection.mergedCells[0].col).toBe(3);
        expect(collection.mergedCells[0].colspan).toBe(3);
        expect(collection.mergedCells[0].rowspan).toBe(1);
      });

      it('should split a merge whose physical span becomes non-contiguous', () => {
        const collection = new MergedCellsCollection({
          hot: createHot(new Map([[2, 3], [3, 0], [4, 4]])),
        });

        collection.add({ row: 0, col: 2, rowspan: 2, colspan: 3 });

        const snapshot = new Map();

        snapshot.set(collection.mergedCells[0], [2, 3, 4]);

        collection.translateAfterAxisMove('column', snapshot);

        const sorted = collection.mergedCells.slice().sort((a, b) => a.col - b.col);

        expect(sorted.length).toBe(2);
        expect(sorted[0].col).toBe(0);
        expect(sorted[0].colspan).toBe(1);
        expect(sorted[0].rowspan).toBe(2);
        expect(sorted[1].col).toBe(3);
        expect(sorted[1].colspan).toBe(2);
        expect(sorted[1].rowspan).toBe(2);
      });

      it('should drop fragments that collapse to a single cell', () => {
        const collection = new MergedCellsCollection({
          hot: createHot(new Map([[2, 5], [3, 1]])),
        });

        collection.add({ row: 0, col: 2, rowspan: 1, colspan: 2 });

        const snapshot = new Map();

        snapshot.set(collection.mergedCells[0], [2, 3]);

        collection.translateAfterAxisMove('column', snapshot);

        expect(collection.mergedCells.length).toBe(0);
      });

      it('should drop a merge whose physical indexes are all unmapped', () => {
        const collection = new MergedCellsCollection({
          hot: createHot(new Map()),
        });

        collection.add({ row: 0, col: 2, rowspan: 1, colspan: 2 });

        const snapshot = new Map();

        snapshot.set(collection.mergedCells[0], [2, 3]);

        collection.translateAfterAxisMove('column', snapshot);

        expect(collection.mergedCells.length).toBe(0);
      });
    });

    describe('`relocateInMatrix` method', () => {
      it('should move a merge to its new top-left, clearing the old footprint and writing the new one', () => {
        const collection = new MergedCellsCollection({ hot: hotMock });
        const merge = collection.add({ row: 0, col: 1, rowspan: 2, colspan: 2 }); // (0,1)-(1,2)

        collection.relocateInMatrix([{ mergedCell: merge, row: 5, col: 5 }]);

        // the merge's own coords are updated
        expect(merge.row).toBe(5);
        expect(merge.col).toBe(5);

        // the old footprint no longer resolves to the merge
        expect(collection.get(0, 1)).toBe(false);
        expect(collection.get(1, 2)).toBe(false);

        // the new footprint resolves to the merge across its whole span
        expect(collection.get(5, 5)).toBe(merge);
        expect(collection.get(6, 6)).toBe(merge);

        // the merge stays in the list — only the matrix lookup is touched
        expect(collection.mergedCells).toEqual([merge]);
      });

      it('should keep both merges intact when two merges swap visual positions (two-pass remove-then-add)', () => {
        const collection = new MergedCellsCollection({ hot: hotMock });
        const mergeA = collection.add({ row: 0, col: 0, rowspan: 1, colspan: 2 }); // (0,0)-(0,1)
        const mergeB = collection.add({ row: 0, col: 2, rowspan: 1, colspan: 2 }); // (0,2)-(0,3)

        // swap them: A takes B's old slot and B takes A's old slot, in one batch
        collection.relocateInMatrix([
          { mergedCell: mergeA, row: 0, col: 2 },
          { mergedCell: mergeB, row: 0, col: 0 },
        ]);

        // the second merge's removal (done first, in the remove-all pass) must not clobber the first
        // merge's freshly written entries — each footprint still resolves to the correct merge
        expect(collection.get(0, 0)).toBe(mergeB);
        expect(collection.get(0, 1)).toBe(mergeB);
        expect(collection.get(0, 2)).toBe(mergeA);
        expect(collection.get(0, 3)).toBe(mergeA);
      });

      it('should leave the matrix unchanged for an empty relocation list', () => {
        const collection = new MergedCellsCollection({ hot: hotMock });
        const merge = collection.add({ row: 0, col: 0, rowspan: 2, colspan: 2 });

        collection.relocateInMatrix([]);

        expect(collection.get(0, 0)).toBe(merge);
        expect(collection.get(1, 1)).toBe(merge);
      });
    });

    describe('`removeFromMatrix` method', () => {
      it('should remove the merges\' footprints from the lookup matrix while keeping them in the list', () => {
        const collection = new MergedCellsCollection({ hot: hotMock });
        const mergeA = collection.add({ row: 0, col: 0, rowspan: 2, colspan: 2 });
        const mergeB = collection.add({ row: 5, col: 5, rowspan: 2, colspan: 2 });

        collection.removeFromMatrix([mergeA]);

        // A is gone from the matrix...
        expect(collection.get(0, 0)).toBe(false);
        expect(collection.get(1, 1)).toBe(false);

        // ...but still present in the list, and B is left untouched
        expect(collection.mergedCells).toEqual([mergeA, mergeB]);
        expect(collection.get(5, 5)).toBe(mergeB);
      });

      it('should write a fresh footprint with no stale duplicates when a removed merge is relocated back', () => {
        const collection = new MergedCellsCollection({ hot: hotMock });
        const merge = collection.add({ row: 0, col: 0, rowspan: 2, colspan: 2 });

        collection.removeFromMatrix([merge]);

        expect(collection.get(0, 0)).toBe(false);

        // relocating it back to the same coords re-adds it cleanly
        collection.relocateInMatrix([{ mergedCell: merge, row: 0, col: 0 }]);

        expect(collection.get(0, 0)).toBe(merge);
        expect(collection.get(1, 1)).toBe(merge);
      });
    });

    describe('`getBottomMostRowIndex` method', () => {
      it('should return bottom-most row index of where the merge cells are not intersected', () => {
        const mergedCellsCollection = new MergedCellsCollection({ hot: hotMock });

        mergedCellsCollection.add({
          row: 2,
          col: 1,
          rowspan: 2,
          colspan: 2
        });
        mergedCellsCollection.add({
          row: 3,
          col: 3,
          rowspan: 2,
          colspan: 2
        });

        const range = createCellRange(1, 0, 5, 5);

        expect(mergedCellsCollection.getBottomMostRowIndex(range, 0)).toBe(1);
        expect(mergedCellsCollection.getBottomMostRowIndex(range, 1)).toBe(1);
        expect(mergedCellsCollection.getBottomMostRowIndex(range, 2)).toBe(4);
        expect(mergedCellsCollection.getBottomMostRowIndex(range, 3)).toBe(4);
        expect(mergedCellsCollection.getBottomMostRowIndex(range, 4)).toBe(4);
        expect(mergedCellsCollection.getBottomMostRowIndex(range, 5)).toBe(5);
        expect(mergedCellsCollection.getBottomMostRowIndex(range, 6)).toBe(6);
      });
    });
  });
});
