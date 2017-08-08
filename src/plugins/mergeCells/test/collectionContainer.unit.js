import CollectionContainer from '../cellCollection/collectionContainer';

describe('MergeCells', () => {
  describe('CollectionContainer', () => {
    describe('`add` method', () => {
      it('should add a collection object to the array of collections', () => {
        const collectionContainer = new CollectionContainer({hot: null});

        collectionContainer.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        expect(collectionContainer.collections.length).toEqual(3);
        expect(collectionContainer.collections[0].row).toEqual(0);
        expect(collectionContainer.collections[0].col).toEqual(1);
        expect(collectionContainer.collections[0].rowspan).toEqual(3);
        expect(collectionContainer.collections[0].colspan).toEqual(4);
        expect(collectionContainer.collections[1].row).toEqual(10);
        expect(collectionContainer.collections[1].col).toEqual(11);
        expect(collectionContainer.collections[1].rowspan).toEqual(3);
        expect(collectionContainer.collections[1].colspan).toEqual(4);
        expect(collectionContainer.collections[2].row).toEqual(20);
        expect(collectionContainer.collections[2].col).toEqual(21);
        expect(collectionContainer.collections[2].rowspan).toEqual(3);
        expect(collectionContainer.collections[2].colspan).toEqual(4);
      });
    });

    describe('`remove` method', () => {
      it('should remove a collection object from the array of collections by passing the starting coordinates', () => {
        const collectionContainer = new CollectionContainer({hot: null});

        collectionContainer.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        collectionContainer.remove(10, 11);

        expect(collectionContainer.collections.length).toEqual(2);
        expect(collectionContainer.collections[0].row).toEqual(0);
        expect(collectionContainer.collections[0].col).toEqual(1);
        expect(collectionContainer.collections[0].rowspan).toEqual(3);
        expect(collectionContainer.collections[0].colspan).toEqual(4);
        expect(collectionContainer.collections[1].row).toEqual(20);
        expect(collectionContainer.collections[1].col).toEqual(21);
        expect(collectionContainer.collections[1].rowspan).toEqual(3);
        expect(collectionContainer.collections[1].colspan).toEqual(4);
      });

      it('should remove a collection object from the array of collections by passing the coordinates from the middle of the collection', () => {
        const collectionContainer = new CollectionContainer({hot: null});

        collectionContainer.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        collectionContainer.remove(12, 13);

        expect(collectionContainer.collections.length).toEqual(2);
        expect(collectionContainer.collections[0].row).toEqual(0);
        expect(collectionContainer.collections[0].col).toEqual(1);
        expect(collectionContainer.collections[0].rowspan).toEqual(3);
        expect(collectionContainer.collections[0].colspan).toEqual(4);
        expect(collectionContainer.collections[1].row).toEqual(20);
        expect(collectionContainer.collections[1].col).toEqual(21);
        expect(collectionContainer.collections[1].rowspan).toEqual(3);
        expect(collectionContainer.collections[1].colspan).toEqual(4);
      });
    });

    describe('`get` method', () => {
      it('should get a collection object from the array of collections by passing the starting coordinates', () => {
        const collectionContainer = new CollectionContainer({hot: null});

        collectionContainer.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        const wantedCollection = collectionContainer.get(10, 11);

        expect(wantedCollection.row).toEqual(10);
        expect(wantedCollection.col).toEqual(11);
        expect(wantedCollection.rowspan).toEqual(3);
        expect(wantedCollection.colspan).toEqual(4);
      });

      it('should get a collection object from the array of collections by passing coordinates from the middle of the collection', () => {
        const collectionContainer = new CollectionContainer({hot: null});

        collectionContainer.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        const wantedCollection = collectionContainer.get(12, 13);

        expect(wantedCollection.row).toEqual(10);
        expect(wantedCollection.col).toEqual(11);
        expect(wantedCollection.rowspan).toEqual(3);
        expect(wantedCollection.colspan).toEqual(4);
      });
    });

    describe('`getByRange` method', () => {
      it('should get a collection object from the array of collections by passing coordinates from the middle of the collection', () => {
        const collectionContainer = new CollectionContainer({hot: null});

        collectionContainer.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        const wantedCollection = collectionContainer.getByRange({
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
      it('should get an array of collections within the provided range', () => {
        const collectionContainer = new CollectionContainer({hot: null});

        collectionContainer.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        const wantedCollections = collectionContainer.getWithinRange({
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
      it('should shift all the appropriate collections in the provided direction', () => {
        const collectionContainer = new CollectionContainer({hot: null});

        collectionContainer.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        collectionContainer.shiftCollections('down', 0, 5);

        expect(collectionContainer.collections[0].row).toEqual(5);
        expect(collectionContainer.collections[0].col).toEqual(1);
        expect(collectionContainer.collections[1].row).toEqual(15);
        expect(collectionContainer.collections[1].col).toEqual(11);
        expect(collectionContainer.collections[2].row).toEqual(25);
        expect(collectionContainer.collections[2].col).toEqual(21);

        collectionContainer.shiftCollections('right', 0, 5);

        expect(collectionContainer.collections[0].row).toEqual(5);
        expect(collectionContainer.collections[0].col).toEqual(6);
        expect(collectionContainer.collections[1].row).toEqual(15);
        expect(collectionContainer.collections[1].col).toEqual(16);
        expect(collectionContainer.collections[2].row).toEqual(25);
        expect(collectionContainer.collections[2].col).toEqual(26);

        collectionContainer.shiftCollections('up', 0, 5);

        expect(collectionContainer.collections[0].row).toEqual(0);
        expect(collectionContainer.collections[0].col).toEqual(6);
        expect(collectionContainer.collections[1].row).toEqual(10);
        expect(collectionContainer.collections[1].col).toEqual(16);
        expect(collectionContainer.collections[2].row).toEqual(20);
        expect(collectionContainer.collections[2].col).toEqual(26);

        collectionContainer.shiftCollections('left', 0, 5);

        expect(collectionContainer.collections[0].row).toEqual(0);
        expect(collectionContainer.collections[0].col).toEqual(1);
        expect(collectionContainer.collections[1].row).toEqual(10);
        expect(collectionContainer.collections[1].col).toEqual(11);
        expect(collectionContainer.collections[2].row).toEqual(20);
        expect(collectionContainer.collections[2].col).toEqual(21);

      });

      it('should resize the merged collection (and shift the collections that follow) if the change happened inside a collection', () => {
        const collectionContainer = new CollectionContainer({hot: null});

        collectionContainer.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        collectionContainer.shiftCollections('down', 1, 5);

        expect(collectionContainer.collections[0].row).toEqual(0);
        expect(collectionContainer.collections[0].col).toEqual(1);
        expect(collectionContainer.collections[0].rowspan).toEqual(8);
        expect(collectionContainer.collections[1].row).toEqual(15);
        expect(collectionContainer.collections[1].col).toEqual(11);
        expect(collectionContainer.collections[1].rowspan).toEqual(3);
        expect(collectionContainer.collections[2].row).toEqual(25);
        expect(collectionContainer.collections[2].col).toEqual(21);
        expect(collectionContainer.collections[2].rowspan).toEqual(3);

        collectionContainer.shiftCollections('right', 2, 5);

        expect(collectionContainer.collections[0].row).toEqual(0);
        expect(collectionContainer.collections[0].col).toEqual(1);
        expect(collectionContainer.collections[0].rowspan).toEqual(8);
        expect(collectionContainer.collections[0].colspan).toEqual(9);
        expect(collectionContainer.collections[1].row).toEqual(15);
        expect(collectionContainer.collections[1].col).toEqual(16);
        expect(collectionContainer.collections[1].rowspan).toEqual(3);
        expect(collectionContainer.collections[2].row).toEqual(25);
        expect(collectionContainer.collections[2].col).toEqual(26);
        expect(collectionContainer.collections[2].rowspan).toEqual(3);

      });
    });

    describe('`checkIfOverlaps` method', () => {
      it('should return whether the provided collection overlaps with the others in the collection', () => {
        const collectionContainer = new CollectionContainer({hot: null});

        collectionContainer.add({
          row: 0,
          col: 1,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 10,
          col: 11,
          rowspan: 3,
          colspan: 4
        });
        collectionContainer.add({
          row: 20,
          col: 21,
          rowspan: 3,
          colspan: 4
        });

        expect(collectionContainer.checkIfOverlaps({row: 30, col: 30, rowspan: 3, colspan: 3})).toEqual(false);
        expect(collectionContainer.checkIfOverlaps({row: 2, col: 2, rowspan: 3, colspan: 3})).toEqual(true);
        expect(collectionContainer.checkIfOverlaps({row: 9, col: 9, rowspan: 3, colspan: 3})).toEqual(true);
        expect(collectionContainer.checkIfOverlaps({row: 21, col: 19, rowspan: 5, colspan: 5})).toEqual(true);
        expect(collectionContainer.checkIfOverlaps({row: 21, col: 22, rowspan: 5, colspan: 5})).toEqual(true);
        expect(collectionContainer.checkIfOverlaps({row: 24, col: 25, rowspan: 5, colspan: 5})).toEqual(false);

      });
    });
  });
});
