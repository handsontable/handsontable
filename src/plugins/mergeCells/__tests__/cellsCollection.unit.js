import MergedCellsCollection from '../cellsCollection';

describe('MergeCells', () => {
  describe('MergedCellsCollection', () => {
    const hotMock = {
      render: () => {
      },
      countCols: () => 100,
      countRows: () => 100,
    };

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

        const wantedCollection = mergedCellsCollection.getByRange({
          from: {
            row: 12,
            col: 12,
          },
          to: {
            row: 12,
            col: 13
          }
        });

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

        const wantedCollections = mergedCellsCollection.getWithinRange({
          from: {
            row: 0,
            col: 0,
          },
          to: {
            row: 19,
            col: 20
          }
        });

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

        expect(mergedCellsCollection.isOverlapping({ row: 30, col: 30, rowspan: 3, colspan: 3 })).toEqual(false);
        expect(mergedCellsCollection.isOverlapping({ row: 2, col: 2, rowspan: 3, colspan: 3 })).toEqual(true);
        expect(mergedCellsCollection.isOverlapping({ row: 9, col: 9, rowspan: 3, colspan: 3 })).toEqual(true);
        expect(mergedCellsCollection.isOverlapping({ row: 21, col: 19, rowspan: 5, colspan: 5 })).toEqual(true);
        expect(mergedCellsCollection.isOverlapping({ row: 21, col: 22, rowspan: 5, colspan: 5 })).toEqual(true);
        expect(mergedCellsCollection.isOverlapping({ row: 24, col: 25, rowspan: 5, colspan: 5 })).toEqual(false);

      });
    });
  });
});
