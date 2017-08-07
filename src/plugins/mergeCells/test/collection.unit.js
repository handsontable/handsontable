import Collection from '../cellCollection/collection';

describe('MergeCells', () => {
  describe('Collection', () => {
    describe('constructor', () => {
      it('should create an collection object when creating a new instance', () => {
        const collection = new Collection(1, 2, 3, 4);

        expect(collection.row).toEqual(1);
        expect(collection.col).toEqual(2);
        expect(collection.rowspan).toEqual(3);
        expect(collection.colspan).toEqual(4);
      });
    });

    describe('`includes` method', () => {
      it('should return `true` if the provided coordinates are inside the collection', () => {
        const collection = new Collection(2, 2, 3, 3);

        expect(collection.includes(2, 2)).toEqual(true);
        expect(collection.includes(3, 3)).toEqual(true);
        expect(collection.includes(4, 4)).toEqual(true);
        expect(collection.includes(5, 5)).toEqual(false);
        expect(collection.includes(3, 5)).toEqual(false);
        expect(collection.includes(5, 3)).toEqual(false);
      });
    });

    describe('`includesHorizontally` method', () => {
      it('should returns `true` if the provided `column` property is within the column span of the collection', () => {
        const collection = new Collection(2, 2, 3, 3);

        expect(collection.includesHorizontally(1)).toEqual(false);
        expect(collection.includesHorizontally(2)).toEqual(true);
        expect(collection.includesHorizontally(3)).toEqual(true);
        expect(collection.includesHorizontally(4)).toEqual(true);
        expect(collection.includesHorizontally(5)).toEqual(false);
      });
    });

    describe('`includesVertically` method', () => {
      it('should returns `true` if the provided `row` property is within the row span of the collection', () => {
        const collection = new Collection(2, 2, 3, 3);

        expect(collection.includesVertically(1)).toEqual(false);
        expect(collection.includesVertically(2)).toEqual(true);
        expect(collection.includesVertically(3)).toEqual(true);
        expect(collection.includesVertically(4)).toEqual(true);
        expect(collection.includesVertically(5)).toEqual(false);
      });
    });

    describe('`normalize` method', () => {
      it('should trim the collection data to the Handsontable boundaries', () => {
        const hotMock = {
          countRows: () => 5,
          countCols: () => 3
        };

        let collection = new Collection(0, 0, 100, 100);

        collection.normalize(hotMock);
        expect(collection.row).toEqual(0);
        expect(collection.col).toEqual(0);
        expect(collection.rowspan).toEqual(5);
        expect(collection.colspan).toEqual(3);

        collection = new Collection(2, 2, 100, 100);
        collection.normalize(hotMock);
        expect(collection.row).toEqual(2);
        expect(collection.col).toEqual(2);
        expect(collection.rowspan).toEqual(3);
        expect(collection.colspan).toEqual(1);

        collection = new Collection(1, 1, 2, 2);
        collection.normalize(hotMock);
        expect(collection.row).toEqual(1);
        expect(collection.col).toEqual(1);
        expect(collection.rowspan).toEqual(2);
        expect(collection.colspan).toEqual(2);

      });
    });

    describe('`shift` method', () => {
      it('should shift the merged collection right, when there was a column added to its left', () => {
        const collection = new Collection(3, 3, 4, 4);

        // Adding one column at index 1
        collection.shift([1, 0], 1);

        expect(collection.row).toEqual(3);
        expect(collection.col).toEqual(4);
        expect(collection.rowspan).toEqual(4);
        expect(collection.colspan).toEqual(4);
      });

      it('should shift the merged collection left, when there was a column removed to its left', () => {
        const collection = new Collection(3, 3, 4, 4);

        // Removing one column at index 1
        collection.shift([-1, 0], 1);

        expect(collection.row).toEqual(3);
        expect(collection.col).toEqual(2);
        expect(collection.rowspan).toEqual(4);
        expect(collection.colspan).toEqual(4);
      });

      it('should shift the merged collection down, when there was a row added above', () => {
        const collection = new Collection(3, 3, 4, 4);

        // Adding one row at index 1
        collection.shift([0, 1], 1);

        expect(collection.row).toEqual(4);
        expect(collection.col).toEqual(3);
        expect(collection.rowspan).toEqual(4);
        expect(collection.colspan).toEqual(4);
      });

      it('should shift the merged collection up, when there was a row removed above', () => {
        const collection = new Collection(3, 3, 4, 4);

        // Removing one column at index 1
        collection.shift([0, -1], 1);

        expect(collection.row).toEqual(2);
        expect(collection.col).toEqual(3);
        expect(collection.rowspan).toEqual(4);
        expect(collection.colspan).toEqual(4);
      });

      it('should expand the merged collection, when there was a column added between its borders', () => {
        const collection = new Collection(3, 3, 4, 4);

        // Adding one column at index 4
        collection.shift([1, 0], 4);

        expect(collection.row).toEqual(3);
        expect(collection.col).toEqual(3);
        expect(collection.rowspan).toEqual(4);
        expect(collection.colspan).toEqual(5);
      });

      it('should contract the merged collection, when there was a column removed between its borders', () => {
        const collection = new Collection(3, 3, 4, 4);

        // Removing one column at index 4
        collection.shift([-1, 0], 4);

        expect(collection.row).toEqual(3);
        expect(collection.col).toEqual(3);
        expect(collection.rowspan).toEqual(4);
        expect(collection.colspan).toEqual(3);
      });

      it('should expand the merged collection, when there was a row added between its borders', () => {
        const collection = new Collection(3, 3, 4, 4);

        // Adding one row at index 4
        collection.shift([0, 1], 4);

        expect(collection.row).toEqual(3);
        expect(collection.col).toEqual(3);
        expect(collection.rowspan).toEqual(5);
        expect(collection.colspan).toEqual(4);
      });

      it('should contract the merged collection, when there was a row removed between its borders', () => {
        const collection = new Collection(3, 3, 4, 4);

        // Removing one row at index 4
        collection.shift([0, -1], 4);

        expect(collection.row).toEqual(3);
        expect(collection.col).toEqual(3);
        expect(collection.rowspan).toEqual(3);
        expect(collection.colspan).toEqual(4);
      });
    });

    describe('`isFarther` method', () => {
      it('should return whether the "base" collection is farther in the defined direction than the provided collection', () => {
        const TopLeftcollection = new Collection(1, 1, 2, 2);
        const TopRightcollection = new Collection(1, 5, 2, 2);
        const BottomLeftcollection = new Collection(5, 1, 2, 2);
        const BottomRightcollection = new Collection(5, 5, 2, 2);

        expect(TopRightcollection.isFarther(TopLeftcollection, 'left')).toBe(false);
        expect(TopRightcollection.isFarther(TopLeftcollection, 'up')).toBe(false);
        expect(TopRightcollection.isFarther(BottomLeftcollection, 'left')).toBe(false);

        expect(TopLeftcollection.isFarther(TopRightcollection, 'left')).toBe(true);
        expect(TopRightcollection.isFarther(TopLeftcollection, 'right')).toBe(true);
        expect(BottomLeftcollection.isFarther(TopRightcollection, 'down')).toBe(true);
        expect(TopLeftcollection.isFarther(BottomRightcollection, 'up')).toBe(true);
      });
    });
  });
});
