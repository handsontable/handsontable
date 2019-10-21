/* eslint-disable no-sparse-arrays */
import LazyGridMap from 'handsontable/dataMap/metaManager/lazyGridMap';

function createLazyGridMap(valueFactory) {
  if (!valueFactory) {
    let incr = -1;

    valueFactory = () => {
      incr += 1;

      return { i: incr };
    };
  }

  return new LazyGridMap(valueFactory);
}

describe('LazyGridMap', () => {
  it('should reuse data marked as "holes" for obtaining new items', () => {
    const map = createLazyGridMap();

    map.obtain(10);
    map.obtain(11);
    map.obtain(12);
    map.obtain(13);

    map.remove(10, 2);

    expect(map.index).toEqual([,,,,,,,,,, 2, 3]); // <10 empty items>
    expect(map.data).toEqual([{ i: 0 }, { i: 1 }, { i: 2 }, { i: 3 }]);
    expect(map.holes).toEqual([0, 1]);
    expect(map.length).toBe(2);

    map.obtain(1);

    expect(map.index).toEqual([, 1,,,,,,,,, 2, 3]); // <1 empty items>, 1, <8 empty items>, 2, 3
    expect(map.data).toEqual([{ i: 0 }, { i: 4 }, { i: 2 }, { i: 3 }]);
    expect(map.holes).toEqual([0]);
    expect(map.length).toBe(3);

    map.obtain(3);

    expect(map.index).toEqual([, 1,, 0,,,,,,, 2, 3]); // <1 empty item>, 1, <1 empty item>, 0, <6 empty items>, 2, 3
    expect(map.data).toEqual([{ i: 5 }, { i: 4 }, { i: 2 }, { i: 3 }]);
    expect(map.holes).toEqual([]);
    expect(map.length).toBe(4);
  });

  describe('obtain()', () => {
    it('should lazy create data', () => {
      const map = createLazyGridMap();

      expect(map.obtain(3)).toEqual({ i: 0 });
      expect(map.obtain(10)).toEqual({ i: 1 });
      expect(map.obtain(9)).toEqual({ i: 2 });
      expect(map.obtain(0)).toEqual({ i: 3 });

      expect(map.index).toEqual([3,,, 0,,,,,, 2, 1]); // [ 3, <2 empty items>, 0, <5 empty items>, 2, 1 ]
      expect(map.data).toEqual([{ i: 0 }, { i: 1 }, { i: 2 }, { i: 3 }]);
      expect(map.length).toBe(4);
    });

    it('should get already created map values', () => {
      const spyValueFactory = jest.fn();
      const map = createLazyGridMap(spyValueFactory);

      map.index = [,,, 0, 1, 2, 3];
      map.data = [{ i: 0 }, { i: 1 }, { i: 2 }, { i: 3 }];
      map.length = 4;

      expect(spyValueFactory).not.toHaveBeenCalled();
      expect(map.obtain(3)).toEqual({ i: 0 });
      expect(map.obtain(4)).toEqual({ i: 1 });
      expect(map.obtain(5)).toEqual({ i: 2 });
      expect(map.obtain(6)).toEqual({ i: 3 });
    });
  });

  describe('insert()', () => {
    it('should update index map leaving the data intact (an instance with no data)', () => {
      const map = createLazyGridMap();

      map.insert(0, 2);

      expect(map.index).toEqual([0, 1]);
      expect(map.data).toEqual([]);
      expect(map.length).toBe(2);

      map.insert(0, 2);

      expect(map.index).toEqual([2, 3, 0, 1]);
      expect(map.data).toEqual([]);
      expect(map.length).toBe(4);

      map.insert(1, 3);

      expect(map.index).toEqual([2, 4, 5, 6, 3, 0, 1]);
      expect(map.data).toEqual([]);
      expect(map.length).toBe(7);

      map.insert(100);

      expect(map.index).toEqual([2, 4, 5, 6, 3, 0, 1, 7]);
      expect(map.data).toEqual([]);
      expect(map.length).toBe(8);
    });

    it('should update index map leaving the data intact (an instance with sample data)', () => {
      const map = createLazyGridMap();

      map.obtain(10);
      map.obtain(11);
      map.obtain(12);
      map.obtain(13);

      map.insert(0, 2);

      // After inserting new rows the `{i: 0}` item will be accessible under index 12
      expect(map.obtain(12)).toEqual({ i: 0 });

      expect(map.index).toEqual([4, 5, ,,,,,,,,,, 0, 1, 2, 3]); // <10 empty items>
      expect(map.data).toEqual([{ i: 0 }, { i: 1 }, { i: 2 }, { i: 3 }]);
      expect(map.length).toBe(6);
    });

    it('should refill an empty created row with data after inserting and obtaining data from a new index', () => {
      const map = createLazyGridMap();

      map.obtain(0);
      map.obtain(1);
      map.obtain(2);
      map.obtain(3);

      map.insert(1, 3);

      expect(map.obtain(0)).toEqual({ i: 0 });
      expect(map.obtain(1)).toEqual({ i: 4 }); // newly created value
      expect(map.obtain(2)).toEqual({ i: 5 }); // newly created value
      expect(map.obtain(3)).toEqual({ i: 6 }); // newly created value
      expect(map.obtain(4)).toEqual({ i: 1 });
      expect(map.obtain(5)).toEqual({ i: 2 });
      expect(map.obtain(6)).toEqual({ i: 3 });

      expect(map.index).toEqual([0, 4, 5, 6, 1, 2, 3]);
      expect(map.data).toEqual([{ i: 0 }, { i: 1 }, { i: 2 }, { i: 3 }, { i: 4 }, { i: 5 }, { i: 6 }]);
      expect(map.length).toBe(7);
    });
  });

  describe('remove()', () => {
    it('should update index map leaving the data intact (an instance with no data)', () => {
      const map = createLazyGridMap();

      map.remove(0, 2);

      expect(map.index).toEqual([]);
      expect(map.data).toEqual([]);
      expect(map.holes).toEqual([]);
      expect(map.length).toBe(0);

      map.remove(4, 5);

      expect(map.index).toEqual([]);
      expect(map.data).toEqual([]);
      expect(map.holes).toEqual([]);
      expect(map.length).toBe(0);

      map.remove(100);

      expect(map.index).toEqual([]);
      expect(map.data).toEqual([]);
      expect(map.holes).toEqual([]);
      expect(map.length).toBe(0);
    });

    it('should update index map leaving the data intact (an instance with sample data)', () => {
      const map = createLazyGridMap();

      expect(map.obtain(10)).toEqual({ i: 0 });

      map.obtain(11);
      map.obtain(12);
      map.obtain(13);

      map.remove(0, 2);

      // After removing rows the `{i: 0}` item will be accessible under index 8
      expect(map.obtain(8)).toEqual({ i: 0 });

      expect(map.index).toEqual([,,,,,,,, 0, 1, 2, 3]); // <8 empty items>
      expect(map.data).toEqual([{ i: 0 }, { i: 1 }, { i: 2 }, { i: 3 }]);
      expect(map.holes).toEqual([]);
      expect(map.length).toBe(4);

      map.remove(9, 2);

      expect(map.index).toEqual([,,,,,,,, 0, 3]); // <8 empty items>
      expect(map.data).toEqual([{ i: 0 }, { i: 1 }, { i: 2 }, { i: 3 }]);
      expect(map.holes).toEqual([1, 2]); // Data at index 1 and 2 are marked as the hole so that slots will be used for obtaining new ones
      expect(map.length).toBe(2);
    });

    it('should update index map leaving the data intact (an instance with sample data)', () => {
      const map = createLazyGridMap();

      expect(map.obtain(10)).toEqual({ i: 0 });

      map.obtain(11);
      map.obtain(12);
      map.obtain(13);

      map.remove(0, 2);

      // After removing rows the `{i: 0}` item will be accessible under index 8
      expect(map.obtain(8)).toEqual({ i: 0 });

      expect(map.index).toEqual([,,,,,,,, 0, 1, 2, 3]); // <8 empty items>
      expect(map.data).toEqual([{ i: 0 }, { i: 1 }, { i: 2 }, { i: 3 }]);
      expect(map.holes).toEqual([]);
      expect(map.length).toBe(4);

      map.remove(9, 2);

      expect(map.index).toEqual([,,,,,,,, 0, 3]); // <8 empty items>, 0, 3
      expect(map.data).toEqual([{ i: 0 }, { i: 1 }, { i: 2 }, { i: 3 }]);
      expect(map.holes).toEqual([1, 2]); // Data under index 1 and 2 are marked as hole
      expect(map.length).toBe(2);
    });
  });

  describe('values()', () => {
    it('should return new Iterator object that contains values for each item', () => {
      const map = createLazyGridMap(index => index);

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
  });

  describe('entries()', () => {
    it('should return new Iterator object that contains an array of [index, value] for each item', () => {
      const map = createLazyGridMap(index => index / 2);

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
  });
});
