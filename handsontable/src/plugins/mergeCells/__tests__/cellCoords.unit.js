import MergedCellCoords from '../cellCoords';

describe('MergeCells', () => {
  describe('MergedCellCoords', () => {
    describe('constructor', () => {
      it('should create an merged cell object when creating a new instance', () => {
        const mergedCell = new MergedCellCoords(1, 2, 3, 4);

        expect(mergedCell.row).toEqual(1);
        expect(mergedCell.col).toEqual(2);
        expect(mergedCell.rowspan).toEqual(3);
        expect(mergedCell.colspan).toEqual(4);
      });
    });

    describe('`includes` method', () => {
      it('should return `true` if the provided coordinates are inside the merged cell', () => {
        const mergedCell = new MergedCellCoords(2, 2, 3, 3);

        expect(mergedCell.includes(2, 2)).toEqual(true);
        expect(mergedCell.includes(3, 3)).toEqual(true);
        expect(mergedCell.includes(4, 4)).toEqual(true);
        expect(mergedCell.includes(5, 5)).toEqual(false);
        expect(mergedCell.includes(3, 5)).toEqual(false);
        expect(mergedCell.includes(5, 3)).toEqual(false);
      });
    });

    describe('`includesHorizontally` method', () => {
      it('should returns `true` if the provided `column` property is within the column span of the merged cell', () => {
        const mergedCell = new MergedCellCoords(2, 2, 3, 3);

        expect(mergedCell.includesHorizontally(1)).toEqual(false);
        expect(mergedCell.includesHorizontally(2)).toEqual(true);
        expect(mergedCell.includesHorizontally(3)).toEqual(true);
        expect(mergedCell.includesHorizontally(4)).toEqual(true);
        expect(mergedCell.includesHorizontally(5)).toEqual(false);
      });
    });

    describe('`includesVertically` method', () => {
      it('should returns `true` if the provided `row` property is within the row span of the merged cell', () => {
        const mergedCell = new MergedCellCoords(2, 2, 3, 3);

        expect(mergedCell.includesVertically(1)).toEqual(false);
        expect(mergedCell.includesVertically(2)).toEqual(true);
        expect(mergedCell.includesVertically(3)).toEqual(true);
        expect(mergedCell.includesVertically(4)).toEqual(true);
        expect(mergedCell.includesVertically(5)).toEqual(false);
      });
    });

    describe('`normalize` method', () => {
      it('should trim the merged cell data to the Handsontable boundaries', () => {
        const hotMock = {
          countRows: () => 5,
          countCols: () => 3
        };

        let mergedCell = new MergedCellCoords(0, 0, 100, 100);

        mergedCell.normalize(hotMock);
        expect(mergedCell.row).toEqual(0);
        expect(mergedCell.col).toEqual(0);
        expect(mergedCell.rowspan).toEqual(5);
        expect(mergedCell.colspan).toEqual(3);

        mergedCell = new MergedCellCoords(2, 2, 100, 100);
        mergedCell.normalize(hotMock);
        expect(mergedCell.row).toEqual(2);
        expect(mergedCell.col).toEqual(2);
        expect(mergedCell.rowspan).toEqual(3);
        expect(mergedCell.colspan).toEqual(1);

        mergedCell = new MergedCellCoords(1, 1, 2, 2);
        mergedCell.normalize(hotMock);
        expect(mergedCell.row).toEqual(1);
        expect(mergedCell.col).toEqual(1);
        expect(mergedCell.rowspan).toEqual(2);
        expect(mergedCell.colspan).toEqual(2);

      });
    });

    describe('`shift` method', () => {
      it('should shift the merged cell right, when there was a column added to its left', () => {
        const mergedCell = new MergedCellCoords(3, 3, 4, 4);

        // Adding one column at index 1
        mergedCell.shift([1, 0], 1);

        expect(mergedCell.row).toEqual(3);
        expect(mergedCell.col).toEqual(4);
        expect(mergedCell.rowspan).toEqual(4);
        expect(mergedCell.colspan).toEqual(4);
      });

      it('should shift the merged cell left, when there was a column removed to its left', () => {
        const mergedCell = new MergedCellCoords(3, 3, 4, 4);

        // Removing one column at index 1
        mergedCell.shift([-1, 0], 1);

        expect(mergedCell.row).toEqual(3);
        expect(mergedCell.col).toEqual(2);
        expect(mergedCell.rowspan).toEqual(4);
        expect(mergedCell.colspan).toEqual(4);
      });

      it('should shift the merged cell down, when there was a row added above', () => {
        const mergedCell = new MergedCellCoords(3, 3, 4, 4);

        // Adding one row at index 1
        mergedCell.shift([0, 1], 1);

        expect(mergedCell.row).toEqual(4);
        expect(mergedCell.col).toEqual(3);
        expect(mergedCell.rowspan).toEqual(4);
        expect(mergedCell.colspan).toEqual(4);
      });

      it('should shift the merged cell up, when there was a row removed above', () => {
        const mergedCell = new MergedCellCoords(3, 3, 4, 4);

        // Removing one column at index 1
        mergedCell.shift([0, -1], 1);

        expect(mergedCell.row).toEqual(2);
        expect(mergedCell.col).toEqual(3);
        expect(mergedCell.rowspan).toEqual(4);
        expect(mergedCell.colspan).toEqual(4);
      });

      it('should expand the merged cell, when there was a column added between its borders', () => {
        const mergedCell = new MergedCellCoords(3, 3, 4, 4);

        // Adding one column at index 4
        mergedCell.shift([1, 0], 4);

        expect(mergedCell.row).toEqual(3);
        expect(mergedCell.col).toEqual(3);
        expect(mergedCell.rowspan).toEqual(4);
        expect(mergedCell.colspan).toEqual(5);
      });

      it('should contract the merged cell, when there was a column removed between its borders', () => {
        const mergedCell = new MergedCellCoords(3, 3, 4, 4);

        // Removing one column at index 4
        mergedCell.shift([-1, 0], 4);

        expect(mergedCell.row).toEqual(3);
        expect(mergedCell.col).toEqual(3);
        expect(mergedCell.rowspan).toEqual(4);
        expect(mergedCell.colspan).toEqual(3);
      });

      it('should expand the merged cell, when there was a row added between its borders', () => {
        const mergedCell = new MergedCellCoords(3, 3, 4, 4);

        // Adding one row at index 4
        mergedCell.shift([0, 1], 4);

        expect(mergedCell.row).toEqual(3);
        expect(mergedCell.col).toEqual(3);
        expect(mergedCell.rowspan).toEqual(5);
        expect(mergedCell.colspan).toEqual(4);
      });

      it('should contract the merged cell, when there was a row removed between its borders', () => {
        const mergedCell = new MergedCellCoords(3, 3, 4, 4);

        // Removing one row at index 4
        mergedCell.shift([0, -1], 4);

        expect(mergedCell.row).toEqual(3);
        expect(mergedCell.col).toEqual(3);
        expect(mergedCell.rowspan).toEqual(3);
        expect(mergedCell.colspan).toEqual(4);
      });
    });

    describe('`isFarther` method', () => {
      it('should return whether the "base" merged cell is farther in the defined direction than the provided merged cell', () => {
        const TopLeftMergedCell = new MergedCellCoords(1, 1, 2, 2);
        const TopRightMergedCell = new MergedCellCoords(1, 5, 2, 2);
        const BottomLeftMergedCell = new MergedCellCoords(5, 1, 2, 2);
        const BottomRightMergedCell = new MergedCellCoords(5, 5, 2, 2);

        expect(TopRightMergedCell.isFarther(TopLeftMergedCell, 'left')).toBe(false);
        expect(TopRightMergedCell.isFarther(TopLeftMergedCell, 'up')).toBe(false);
        expect(TopRightMergedCell.isFarther(BottomLeftMergedCell, 'left')).toBe(false);

        expect(TopLeftMergedCell.isFarther(TopRightMergedCell, 'left')).toBe(true);
        expect(TopRightMergedCell.isFarther(TopLeftMergedCell, 'right')).toBe(true);
        expect(BottomLeftMergedCell.isFarther(TopRightMergedCell, 'down')).toBe(true);
        expect(TopLeftMergedCell.isFarther(BottomRightMergedCell, 'up')).toBe(true);
      });
    });
  });
});
