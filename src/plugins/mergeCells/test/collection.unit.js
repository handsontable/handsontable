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
  });
});
