import AutofillCalculations from '../calculations/autofill';
import MergedCellCoords from '../cellCoords';
import MergedCellsCollection from '../cellsCollection';

describe('MergeCells-Autofill calculations', () => {
  describe('correctSelectionAreaSize', () => {
    it('Should correct the provided selection area, so it\'s not selecting only a part of a merged cell', () => {
      const instance = new AutofillCalculations({
        // mock
        mergedCellsCollection: {
          get: () => ({
            row: 0,
            col: 0,
            rowspan: 3,
            colspan: 3
          })
        }
      });

      const area = [0, 0, 0, 0];

      instance.correctSelectionAreaSize(area);

      expect(area).toEqual([0, 0, 2, 2]);
    });
  });

  describe('getDirection', () => {
    it('Should get the direction of the autofill process.', () => {
      const instance = new AutofillCalculations({});

      expect(instance.getDirection([0, 0, 2, 2], [0, 0, 5, 2])).toEqual('down');
      expect(instance.getDirection([2, 0, 4, 2], [0, 0, 4, 2])).toEqual('up');
      expect(instance.getDirection([0, 2, 2, 3], [0, 0, 2, 3])).toEqual('left');
      expect(instance.getDirection([0, 0, 2, 1], [0, 0, 2, 333])).toEqual('right');
    });
  });

  describe('snapDragArea', () => {
    it('Should snap the drag area to the farthest merged cell, so it won\'t clip any of the merged cells.', () => {
      const instance = new AutofillCalculations({
        hot: {
          countRows: () => 555,
          countCols: () => 555
        }
      });

      let baseArea = [5, 4, 6, 5];
      let dragArea = [4, 4, 6, 5];
      let dragDirection = 'up';
      const foundMergedCells = [new MergedCellCoords(5, 4, 2, 2)];

      expect(JSON.stringify(instance.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells)))
        .toEqual('[3,4,6,5]');

      dragArea = [2, 4, 6, 5];
      expect(JSON.stringify(instance.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells)))
        .toEqual('[1,4,6,5]');

      baseArea = [5, 4, 7, 5];
      dragArea = [4, 4, 6, 5];
      expect(JSON.stringify(instance.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells)))
        .toEqual('[4,4,6,5]');

      dragArea = [3, 4, 6, 5];
      expect(JSON.stringify(instance.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells)))
        .toEqual('[2,4,6,5]');

      dragDirection = 'down';
      baseArea = [5, 4, 6, 5];
      dragArea = [5, 4, 7, 5];
      expect(JSON.stringify(instance.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells)))
        .toEqual('[5,4,8,5]');

      baseArea = [5, 4, 7, 5];
      dragArea = [5, 4, 8, 5];
      expect(JSON.stringify(instance.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells)))
        .toEqual('[5,4,9,5]');

      dragArea = [5, 4, 10, 5];
      expect(JSON.stringify(instance.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells)))
        .toEqual('[5,4,10,5]');

      dragDirection = 'left';
      baseArea = [5, 4, 6, 5];
      dragArea = [5, 3, 6, 5];
      expect(JSON.stringify(instance.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells)))
        .toEqual('[5,2,6,5]');

      baseArea = [5, 4, 6, 6];
      dragArea = [5, 3, 6, 6];
      expect(JSON.stringify(instance.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells)))
        .toEqual('[5,3,6,6]');

      dragArea = [5, 2, 6, 6];
      expect(JSON.stringify(instance.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells)))
        .toEqual('[5,1,6,6]');

      dragDirection = 'right';
      baseArea = [5, 4, 6, 5];
      dragArea = [5, 4, 6, 6];
      expect(JSON.stringify(instance.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells)))
        .toEqual('[5,4,6,7]');

      baseArea = [5, 3, 6, 5];
      dragArea = [5, 3, 6, 6];
      expect(JSON.stringify(instance.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells)))
        .toEqual('[5,3,6,6]');

      dragArea = [5, 3, 6, 7];
      expect(JSON.stringify(instance.snapDragArea(baseArea, dragArea, dragDirection, foundMergedCells)))
        .toEqual('[5,3,6,8]');
    });
  });

  describe('getAutofillSize', () => {
    it('Should get the \'length\' of the drag area.', () => {
      const instance = new AutofillCalculations({});

      const baseArea = [5, 4, 6, 5];
      let dragArea = [5, 4, 10, 5];
      let direction = 'down';

      expect(instance.getAutofillSize(baseArea, dragArea, direction)).toEqual(4);

      dragArea = [5, 0, 6, 5];
      direction = 'left';
      expect(instance.getAutofillSize(baseArea, dragArea, direction)).toEqual(4);

      dragArea = [0, 4, 6, 5];
      direction = 'up';
      expect(instance.getAutofillSize(baseArea, dragArea, direction)).toEqual(5);

      dragArea = [5, 4, 6, 10];
      direction = 'right';
      expect(instance.getAutofillSize(baseArea, dragArea, direction)).toEqual(5);
    });
  });

  describe('getFarthestCollection', () => {
    it('Should get the to-be-farthest merged cell in the newly filled area.', () => {
      const instance = new AutofillCalculations({});

      const baseArea = [3, 3, 10, 11];
      let dragArea = [3, 3, 13, 11];
      let direction = 'down';
      const mergedCellArray = [new MergedCellCoords(5, 4, 2, 2), new MergedCellCoords(8, 8, 2, 3)];

      expect(instance.getFarthestCollection(baseArea, dragArea, direction, mergedCellArray))
        .toEqual(mergedCellArray[0]);

      dragArea = [3, 3, 16, 11];
      expect(instance.getFarthestCollection(baseArea, dragArea, direction, mergedCellArray))
        .toEqual(mergedCellArray[1]);

      dragArea = [3, 3, 10, 13];
      direction = 'right';
      expect(instance.getFarthestCollection(baseArea, dragArea, direction, mergedCellArray))
        .toEqual(mergedCellArray[0]);

      dragArea = [3, 3, 10, 17];
      expect(instance.getFarthestCollection(baseArea, dragArea, direction, mergedCellArray))
        .toEqual(mergedCellArray[1]);

      dragArea = [1, 3, 10, 11];
      direction = 'up';
      expect(instance.getFarthestCollection(baseArea, dragArea, direction, mergedCellArray))
        .toEqual(mergedCellArray[1]);

      dragArea = [3, 3, 13, 11];
      direction = 'down';
      expect(instance.getFarthestCollection(baseArea, dragArea, direction, mergedCellArray))
        .toEqual(mergedCellArray[0]);

      dragArea = [3, 3, 16, 11];
      expect(instance.getFarthestCollection(baseArea, dragArea, direction, mergedCellArray))
        .toEqual(mergedCellArray[1]);

    });
  });

  describe('isFarther', () => {
    it('Should check if the second provided merged cell is \'farther\' in the provided direction.', () => {
      const first = new MergedCellCoords(5, 4, 2, 2);
      const second = new MergedCellCoords(8, 8, 2, 3);
      let direction = 'up';

      expect(second.isFarther(first, direction)).toEqual(false);

      direction = 'down';
      expect(second.isFarther(first, direction)).toEqual(true);

      direction = 'left';
      expect(second.isFarther(first, direction)).toEqual(false);

      direction = 'right';
      expect(second.isFarther(first, direction)).toEqual(true);
    });
  });

  describe('recreateAfterDataPopulation', () => {
    it('Should recreate the merged cells after the autofill process.', () => {
      const hotMock = {
        render: () => {
        },
        countCols: () => 100,
        countRows: () => 100,
        propToCol: el => el
      };
      const instance = new AutofillCalculations({
        mergedCellsCollection: new MergedCellsCollection({ hot: hotMock }),
        hot: hotMock
      });

      const changes = [
        [10, 3, '[10, 3]', '[5, 3]'], [10, 4, '[10, 4]', '[5, 4]'], [10, 5, '[10, 5]', null],
        [10, 6, '[10, 6]', '[5, 6]'], [10, 7, '[10, 7]', '[5, 7]'], [10, 8, '[10, 8]', '[5, 8]'],
        [10, 9, '[10, 9]', '[5, 9]'], [10, 10, '[10, 10]', '[5, 10]'], [10, 11, '[10, 11]', '[5, 11]'],
        [11, 3, '[11, 3]', '[6, 3]'], [11, 4, '[11, 4]', null], [11, 5, '[11, 5]', null],
        [11, 6, '[11, 6]', '[6, 6]'], [11, 7, '[11, 7]', '[6, 7]'], [11, 8, '[11, 8]', '[6, 8]'],
        [11, 9, '[11, 9]', '[6, 9]'], [11, 10, '[11, 10]', '[6, 10]'], [11, 11, '[11, 11]', '[6, 11]'],
        [12, 3, '[12, 3]', '[7, 3]'], [12, 4, '[12, 4]', '[7, 4]'], [12, 5, '[12, 5]', '[7, 5]'],
        [12, 6, '[12, 6]', '[7, 6]'], [12, 7, '[12, 7]', '[7, 7]'], [12, 8, '[12, 8]', '[7, 8]'],
        [12, 9, '[12, 9]', '[7, 9]'], [12, 10, '[12, 10]', '[7, 10]'], [12, 11, '[12, 11]', '[7, 11]'],
        [13, 3, '[13, 3]', '[8, 3]'], [13, 4, '[13, 4]', '[8, 4]'], [13, 5, '[13, 5]', '[8, 5]'],
        [13, 6, '[13, 6]', '[8, 6]'], [13, 7, '[13, 7]', '[8, 7]'], [13, 8, '[13, 8]', '[8, 8]'],
        [13, 9, '[13, 9]', null], [13, 10, '[13, 10]', null], [13, 11, '[13, 11]', '[8, 11]'],
        [14, 3, '[14, 3]', '[9, 3]'], [14, 4, '[14, 4]', '[9, 4]'], [14, 5, '[14, 5]', '[9, 5]'],
        [14, 6, '[14, 6]', '[9, 6]'], [14, 7, '[14, 7]', '[9, 7]'], [14, 8, '[14, 8]', null],
        [14, 9, '[14, 9]', null], [14, 10, '[14, 10]', null], [14, 11, '[14, 11]', '[9, 11]'],
        [15, 3, '[15, 3]', '[5, 3]'], [15, 4, '[15, 4]', '[5, 4]'], [15, 5, '[15, 5]', null],
        [15, 6, '[15, 6]', '[5, 6]'], [15, 7, '[15, 7]', '[5, 7]'], [15, 8, '[15, 8]', '[5, 8]'],
        [15, 9, '[15, 9]', '[5, 9]'], [15, 10, '[15, 10]', '[5, 10]'], [15, 11, '[15, 11]', '[5, 11]'],
        [16, 3, '[16, 3]', '[6, 3]'], [16, 4, '[16, 4]', null], [16, 5, '[16, 5]', null],
        [16, 6, '[16, 6]', '[6, 6]'], [16, 7, '[16, 7]', '[6, 7]'], [16, 8, '[16, 8]', '[6, 8]'],
        [16, 9, '[16, 9]', '[6, 9]'], [16, 10, '[16, 10]', '[6, 10]'], [16, 11, '[16, 11]', '[6, 11]']];

      instance.currentFillData = {
        dragDirection: 'down',
        foundMergedCells: [new MergedCellCoords(5, 4, 2, 2), new MergedCellCoords(8, 8, 2, 3)],
        cycleLength: 5
      };

      instance.recreateAfterDataPopulation(changes);
      expect(instance.mergedCellsCollection.mergedCells.length).toEqual(3);
      expect(JSON.stringify(instance.mergedCellsCollection.mergedCells[0])).toEqual(JSON.stringify({
        row: 5 + 5,
        col: 4,
        rowspan: 2,
        colspan: 2,
        removed: false
      }));
      expect(JSON.stringify(instance.mergedCellsCollection.mergedCells[1])).toEqual(JSON.stringify({
        row: 8 + 5,
        col: 8,
        rowspan: 2,
        colspan: 3,
        removed: false
      }));
      expect(JSON.stringify(instance.mergedCellsCollection.mergedCells[2])).toEqual(JSON.stringify({
        row: 5 + 10,
        col: 4,
        rowspan: 2,
        colspan: 2,
        removed: false
      }));
    });

    it('Should recreate the merged cells after the autofill process, when the dataset is an array of objects', () => {
      const hotMock = {
        render: () => {
        },
        countCols: () => 100,
        countRows: () => 100,
        propToCol: string => parseInt(string.replace('propFor', ''), 10)
      };
      const instance = new AutofillCalculations({
        mergedCellsCollection: new MergedCellsCollection({ hot: hotMock }),
        hot: hotMock
      });

      const changes = [
        [2, 'propFor4', 'test', 'test'],
        [2, 'propFor5', 'test', 'test'],
        [2, 'propFor4', 'test', null],
        [2, 'propFor5', 'test', null]
      ];

      instance.currentFillData = {
        dragDirection: 'right',
        foundMergedCells: [new MergedCellCoords(2, 2, 2, 2)],
        cycleLength: 2
      };

      instance.recreateAfterDataPopulation(changes);

      expect(instance.mergedCellsCollection.mergedCells.length).toEqual(1);
      expect(JSON.stringify(instance.mergedCellsCollection.mergedCells[0])).toEqual(JSON.stringify({
        row: 2,
        col: 4,
        rowspan: 2,
        colspan: 2,
        removed: false
      }));
    });
  });

  describe('getRangeFromChanges', () => {
    it('Should get the drag range from the changes made.', () => {
      const instance = new AutofillCalculations({
        hot: {
          propToCol: el => el
        }
      });
      const changes = [[7, 4, '[7, 4]', '[3, 4]'], [7, 5, '[7, 5]', null], [7, 6, '[7, 6]', '[3, 6]'],
        [7, 7, '[7, 7]', '[3, 7]'], [7, 8, '[7, 8]', '[3, 8]'], [8, 4, '[8, 4]', null],
        [8, 5, '[8, 5]', null], [8, 6, '[8, 6]', '[4, 6]'], [8, 7, '[8, 7]', null],
        [8, 8, '[8, 8]', null], [9, 4, '[9, 4]', '[5, 4]'], [9, 5, '[9, 5]', '[5, 5]'],
        [9, 6, '[9, 6]', null], [9, 7, '[9, 7]', null], [9, 8, '[9, 8]', null],
        [10, 4, '[10, 4]', '[6, 4]'], [10, 5, '[10, 5]', '[6, 5]'], [10, 6, '[10, 6]', null],
        [10, 7, '[10, 7]', null], [10, 8, '[10, 8]', null]];

      expect(JSON.stringify(instance.getRangeFromChanges(changes))).toEqual(JSON.stringify({
        from: { row: 7, column: 4 },
        to: { row: 10, column: 8 }
      }));
    });

    it('Should get the drag range from the changes made, when the column indexes are set to properties', () => {
      const instance = new AutofillCalculations({
        hot: {
          propToCol: string => parseInt(string.replace('propFor', ''), 10)
        }
      });
      const changes = [[7, 'propFor4', '[7, 4]', '[3, 4]'], [7, 'propFor5', '[7, 5]', null],
        [7, 'propFor6', '[7, 6]', '[3, 6]'], [7, 'propFor7', '[7, 7]', '[3, 7]'],
        [7, 'propFor8', '[7, 8]', '[3, 8]'], [8, 'propFor4', '[8, 4]', null],
        [8, 'propFor5', '[8, 5]', null], [8, 'propFor6', '[8, 6]', '[4, 6]'],
        [8, 'propFor7', '[8, 7]', null], [8, 'propFor8', '[8, 8]', null],
        [9, 'propFor4', '[9, 4]', '[5, 4]'], [9, 'propFor5', '[9, 5]', '[5, 5]'],
        [9, 'propFor6', '[9, 6]', null], [9, 'propFor7', '[9, 7]', null],
        [9, 'propFor8', '[9, 8]', null], [10, 'propFor4', '[10, 4]', '[6, 4]'],
        [10, 'propFor5', '[10, 5]', '[6, 5]'], [10, 'propFor6', '[10, 6]', null],
        [10, 'propFor7', '[10, 7]', null], [10, 'propFor8', '[10, 8]', null]];

      expect(JSON.stringify(instance.getRangeFromChanges(changes))).toEqual(JSON.stringify({
        from: { row: 7, column: 4 },
        to: { row: 10, column: 8 }
      }));
    });
  });
});
