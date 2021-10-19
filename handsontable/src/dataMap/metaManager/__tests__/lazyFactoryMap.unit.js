/* eslint-disable no-sparse-arrays */
/* eslint-disable comma-spacing */
import LazyFactoryMap from '../lazyFactoryMap';

function createLazyFactoryMap(valueFactory) {
  if (!valueFactory) {
    valueFactory = key => ({ i: key });
  }

  return new LazyFactoryMap(valueFactory);
}

describe('LazyFactoryMap', () => {
  it('should reuse data marked as "holes" for obtaining new items', () => {
    const map = createLazyFactoryMap();

    map.obtain(10);
    map.obtain(11);
    map.obtain(12);
    map.obtain(13);

    map.remove(10, 2);

    expect(map.index).toEqual([,,,,,,,,,, 2, 3]); // <10 empty items>
    expect(map.data).toEqual([{ i: 10 }, { i: 11 }, { i: 12 }, { i: 13 }]);
    expect(Array.from(map.holes)).toEqual([0, 1]);

    map.obtain(1);

    expect(map.index).toEqual([, 0,,,,,,,,, 2, 3]); // <1 empty items>, 0, <8 empty items>, 2, 3
    expect(map.data).toEqual([{ i: 1 }, { i: 11 }, { i: 12 }, { i: 13 }]);
    expect(Array.from(map.holes)).toEqual([1]);

    map.obtain(3);

    expect(map.index).toEqual([, 0,, 1,,,,,,, 2, 3]); // <1 empty item>, 0, <1 empty item>, 1, <6 empty items>, 2, 3
    expect(map.data).toEqual([{ i: 1 }, { i: 3 }, { i: 12 }, { i: 13 }]);
    expect(Array.from(map.holes)).toEqual([]);
  });

  describe('obtain()', () => {
    it('should lazy create data', () => {
      const map = createLazyFactoryMap();

      expect(map.obtain(3)).toEqual({ i: 3 });
      expect(map.obtain(10)).toEqual({ i: 10 });
      expect(map.obtain(9)).toEqual({ i: 9 });
      expect(map.obtain(0)).toEqual({ i: 0 });

      expect(map.index).toEqual([3,,, 0,,,,,, 2, 1]); // [ 3, <2 empty items>, 0, <5 empty items>, 2, 1 ]
      expect(map.data).toEqual([{ i: 3 }, { i: 10 }, { i: 9 }, { i: 0 }]);
    });

    it('should get already created map values', () => {
      const spyValueFactory = jest.fn();
      const map = createLazyFactoryMap(spyValueFactory);

      map.index = [,,, 0, 1, 2, 3];
      map.data = [{ i: 0 }, { i: 1 }, { i: 2 }, { i: 3 }];

      expect(spyValueFactory).not.toHaveBeenCalled();
      expect(map.obtain(3)).toEqual({ i: 0 });
      expect(map.obtain(4)).toEqual({ i: 1 });
      expect(map.obtain(5)).toEqual({ i: 2 });
      expect(map.obtain(6)).toEqual({ i: 3 });
    });
  });

  describe('insert()', () => {
    it('should update index map and fill the data with empty values (an instance with an empty data)', () => {
      const map = createLazyFactoryMap();

      map.insert(0, 2);

      expect(map.index).toEqual([0, 1]);
      expect(map.data).toEqual([,,]); // <2 empty items>

      map.insert(0, 2);

      expect(map.index).toEqual([2, 3, 0, 1]);
      expect(map.data).toEqual([,,,,]); // <4 empty items>

      map.insert(1, 3);

      expect(map.index).toEqual([2, 4, 5, 6, 3, 0, 1]);
      expect(map.data).toEqual([,,,,,,,]); // <7 empty items>

      map.insert();

      expect(map.index).toEqual([2, 4, 5, 6, 3, 0, 1, 7]);
      expect(map.data).toEqual([,,,,,,,,]); // <8 empty items>
    });

    it('should update index map leaving the data intact (an instance with sample data)', () => {
      const map = createLazyFactoryMap();

      map.obtain(10);
      map.obtain(11);
      map.obtain(12);
      map.obtain(13);

      map.insert(0, 2);

      // After inserting new rows the `{i: 10}` item will be accessible under index 12
      expect(map.obtain(12)).toEqual({ i: 10 });

      expect(map.index).toEqual([4, 5, ,,,,,,,,,, 0, 1, 2, 3]); // [ 4, 5, <10 empty items>, 0, 1, 2, 3 ]
      expect(map.data).toEqual([{ i: 10 }, { i: 11 }, { i: 12 }, { i: 13 },,,]);
    });

    it('should update index map by inserting the items at the end of the data when method is called without arguments', () => {
      const map = createLazyFactoryMap();

      map.insert();

      expect(map.index).toEqual([0]);
      expect(map.data).toEqual([,]);

      map.obtain(3);
      map.insert();

      expect(map.index).toEqual([0 ,,, 1, 2]);
      expect(map.data).toEqual([, { i: 3 },,]);

      expect(map.obtain(3)).toEqual({ i: 3 });
      expect(map.obtain(4)).toEqual({ i: 4 });

      expect(map.index).toEqual([0 ,,, 1, 2]);
      expect(map.data).toEqual([, { i: 3 }, { i: 4 }]);

      map.insert(null, 5);

      expect(map.index).toEqual([0 ,,, 1, 2, 3, 4, 5, 6, 7]); // [ 0, <2 empty items>, 1, 2, 3, 4, 5, 6, 7 ]
      expect(map.data).toEqual([, { i: 3 }, { i: 4 },,,,,,]); // [ <1 empty item>, { i: 3 }, { i: 4 }, <5 empty items> ]

      expect(map.obtain(0)).toEqual({ i: 0 });
      expect(map.obtain(3)).toEqual({ i: 3 });
      expect(map.obtain(4)).toEqual({ i: 4 });
    });

    it('should refill an empty created row with data after inserting and obtaining data from a new index', () => {
      const map = createLazyFactoryMap();

      map.obtain(0);
      map.obtain(1);
      map.obtain(2);
      map.obtain(3);

      map.insert(1, 3);

      expect(map.obtain(0)).toEqual({ i: 0 });
      expect(map.obtain(1)).toEqual({ i: 1 }); // newly created value/object
      expect(map.obtain(2)).toEqual({ i: 2 }); // newly created value/object
      expect(map.obtain(3)).toEqual({ i: 3 }); // newly created value/object
      expect(map.obtain(4)).toEqual({ i: 1 });
      expect(map.obtain(5)).toEqual({ i: 2 });
      expect(map.obtain(6)).toEqual({ i: 3 });

      expect(map.index).toEqual([0, 4, 5, 6, 1, 2, 3]);
      expect(map.data).toEqual([{ i: 0 }, { i: 1 }, { i: 2 }, { i: 3 }, { i: 1 }, { i: 2 }, { i: 3 }]);
    });
  });

  describe('remove()', () => {
    it('should update index map leaving the data intact (an instance with no data)', () => {
      const map = createLazyFactoryMap();

      map.remove(0, 2);

      expect(map.index).toEqual([]);
      expect(map.data).toEqual([]);
      expect(Array.from(map.holes)).toEqual([]);

      map.remove(4, 5);

      expect(map.index).toEqual([]);
      expect(map.data).toEqual([]);
      expect(Array.from(map.holes)).toEqual([]);

      map.remove(100);

      expect(map.index).toEqual([]);
      expect(map.data).toEqual([]);
      expect(Array.from(map.holes)).toEqual([]);
    });

    it('should update index map leaving the data intact (an instance with sample data)', () => {
      const map = createLazyFactoryMap();

      expect(map.obtain(10)).toEqual({ i: 10 });

      map.obtain(11);
      map.obtain(12);
      map.obtain(13);

      map.remove(0, 2);

      // After removing rows the `{i: 0}` item will be accessible under index 8
      expect(map.obtain(8)).toEqual({ i: 10 });

      expect(map.index).toEqual([,,,,,,,, 0, 1, 2, 3]); // <8 empty items>
      expect(map.data).toEqual([{ i: 10 }, { i: 11 }, { i: 12 }, { i: 13 }]);
      expect(Array.from(map.holes)).toEqual([]);

      map.remove(9, 2);

      expect(map.index).toEqual([,,,,,,,, 0, 3]); // <8 empty items>
      expect(map.data).toEqual([{ i: 10 }, { i: 11 }, { i: 12 }, { i: 13 }]);
      expect(Array.from(map.holes)).toEqual([1, 2]); // Data at index 1 and 2 are marked as the hole so that slots will be used for obtaining new ones
    });

    it('should update index map by removing the items from the end of the data when method is called without arguments', () => {
      let inc = 0;
      const map = createLazyFactoryMap(() => {
        inc += 1;

        return { i: inc };
      });

      map.obtain(10);
      map.obtain(11);
      map.obtain(12);

      map.remove();

      expect(map.index).toEqual([,,,,,,,,,, 0, 1]); // [ <10 empty items>, 0, 1 ]
      expect(map.data).toEqual([{ i: 1 }, { i: 2 }, { i: 3 }]);
      expect(Array.from(map.holes)).toEqual([2]);

      // Generates object with i=4 so this is a proof that previous entry marked as "hole" was replaced
      expect(map.obtain(12)).toEqual({ i: 4 });

      map.remove(null, 3);

      expect(map.index).toEqual([,,,,,,,,,,]); // [ <10 empty items> ]
      expect(map.data).toEqual([{ i: 1 }, { i: 2 }, { i: 4 }]);
      expect(Array.from(map.holes)).toEqual([0, 1, 2]);

      expect(map.obtain(10)).toEqual({ i: 5 });
      expect(map.obtain(11)).toEqual({ i: 6 });
      expect(map.obtain(12)).toEqual({ i: 7 });

      expect(map.index).toEqual([,,,,,,,,,, 0, 1, 2]); // [ <10 empty items> ]
      expect(map.data).toEqual([{ i: 5 }, { i: 6 }, { i: 7 }]);
      expect(Array.from(map.holes)).toEqual([]);
    });
  });

  describe('size()', () => {
    it('should return a proper size collection', () => {
      const map = createLazyFactoryMap(index => index);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      expect(map.size()).toBe(5);
    });

    it('should return a proper size collection omitting removed objects', () => {
      const map = createLazyFactoryMap(index => index);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      map.remove(10, 2);
      map.remove(); // Remove last row

      expect(map.size()).toBe(2);
    });
  });

  describe('values()', () => {
    it('should return new Iterator object that contains values for each item', () => {
      const map = createLazyFactoryMap(index => index);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      const iterator = map.values();

      expect(iterator.next()).toEqual({ done: false, value: 10 });
      expect(iterator.next()).toEqual({ done: false, value: 11 });
      expect(iterator.next()).toEqual({ done: false, value: 90 });
      expect(iterator.next()).toEqual({ done: false, value: 12 });
      expect(iterator.next()).toEqual({ done: false, value: 13 });
      expect(iterator.next()).toEqual({ done: true, value: void 0 });
    });

    it('should return all values in the collection except that marked as "hole"', () => {
      const map = createLazyFactoryMap(index => index);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      map.remove(10, 2);
      map.remove(); // Remove last row

      const iterator = map.values();

      expect(iterator.next()).toEqual({ done: false, value: 12 });
      expect(iterator.next()).toEqual({ done: false, value: 13 });
      expect(iterator.next()).toEqual({ done: true, value: void 0 });
    });
  });

  describe('entries()', () => {
    it('should return new Iterator object that contains an array of [index, value] for each item', () => {
      const map = createLazyFactoryMap(index => index / 2);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      const iterator = map.entries();

      expect(iterator.next()).toEqual({ done: false, value: [10, 5] });
      expect(iterator.next()).toEqual({ done: false, value: [11, 5.5] });
      expect(iterator.next()).toEqual({ done: false, value: [90, 45] });
      expect(iterator.next()).toEqual({ done: false, value: [12, 6] });
      expect(iterator.next()).toEqual({ done: false, value: [13, 6.5] });
      expect(iterator.next()).toEqual({ done: true, value: void 0 });
    });

    it('should return all values in the collection except that marked as "hole"', () => {
      const map = createLazyFactoryMap(index => index / 2);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      map.remove(10, 2);
      map.remove(); // Remove last row

      const iterator = map.entries();

      expect(iterator.next()).toEqual({ done: false, value: [10, 6] });
      expect(iterator.next()).toEqual({ done: false, value: [11, 6.5] });
      expect(iterator.next()).toEqual({ done: true, value: void 0 });
    });
  });

  describe('Iterator protocol', () => {
    it('should return new Iterator object that contains an array of [index, value] for each item', () => {
      const map = createLazyFactoryMap(index => index / 2);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      expect(Array.from(map)).toEqual([[10, 5], [11, 5.5], [90, 45], [12, 6], [13, 6.5]]);
    });

    it('should return all values in the collection except that marked as "hole"', () => {
      const map = createLazyFactoryMap(index => index / 2);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      map.remove(10, 2);
      map.remove(); // Remove last row

      // Proof that physical index was changed but data value is still intact.
      expect(Array.from(map)).toEqual([[10, 6], [11, 6.5]]);
    });
  });
});
