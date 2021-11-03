import { LinkedPhysicalIndexToValueMap as IndexToValueMap } from 'handsontable/translations';

describe('LinkedPhysicalIndexToValueMap', () => {
  it('should return proper length by the `getLength` method', () => {
    const indexToValueMap = new IndexToValueMap();

    indexToValueMap.setValueAtIndex(0, 2);
    indexToValueMap.setValueAtIndex(1, 1);
    indexToValueMap.setValueAtIndex(2, 0);

    expect(indexToValueMap.getValues()).toEqual([]);
    expect(indexToValueMap.getLength()).toBe(0);

    indexToValueMap.init(5);

    indexToValueMap.setValueAtIndex(0, 2);
    indexToValueMap.setValueAtIndex(1, 1);
    indexToValueMap.setValueAtIndex(2, 0);

    expect(indexToValueMap.getValues()).toEqual([2, 1, 0]);
    expect(indexToValueMap.getLength()).toBe(3);
    expect(indexToValueMap.orderOfIndexes).toEqual([0, 1, 2]);

    // fake value, checking whether method checks length of the array (which is faster than going through all values)
    indexToValueMap.orderOfIndexes.length = 5;
    indexToValueMap.getValues = jasmine.createSpy('getValues').and.callFake(() => []);

    expect(indexToValueMap.getLength()).toBe(5);
    expect(indexToValueMap.getValues).not.toHaveBeenCalled();
  });

  it('should work with get, and set functions properly', () => {
    const indexToValueMap = new IndexToValueMap();

    indexToValueMap.setValueAtIndex(0, 2);
    indexToValueMap.setValueAtIndex(1, 1);
    indexToValueMap.setValueAtIndex(2, 0);

    expect(indexToValueMap.getValues()).toEqual([]);
    expect(indexToValueMap.getLength()).toBe(0);

    indexToValueMap.init(3);

    expect(indexToValueMap.indexedValues).toEqual([null, null, null]);
    expect(indexToValueMap.getValues()).toEqual([]);
    expect(indexToValueMap.getLength()).toBe(0);

    indexToValueMap.setValueAtIndex(0, 2);
    indexToValueMap.setValueAtIndex(1, 1);
    indexToValueMap.setValueAtIndex(2, 0);

    expect(indexToValueMap.indexedValues).toEqual([2, 1, 0]);
    expect(indexToValueMap.getValues()).toEqual([2, 1, 0]);
    expect(indexToValueMap.getLength()).toBe(3);

    indexToValueMap.setValues([1, 2, 0]);

    expect(indexToValueMap.indexedValues).toEqual([1, 2, 0]);
    expect(indexToValueMap.getValues()).toEqual([1, 2, 0]);
    expect(indexToValueMap.getLength()).toBe(3);
  });

  it('should work with set function properly (working with the "position" argument)', () => {
    const indexToValueMap = new IndexToValueMap();

    indexToValueMap.init(5);
    indexToValueMap.setValueAtIndex(0, 2);
    indexToValueMap.setValueAtIndex(2, 0);
    indexToValueMap.setValueAtIndex(1, 1);

    expect(indexToValueMap.orderOfIndexes).toEqual([0, 2, 1]);

    indexToValueMap.setValueAtIndex(4, 3, 0);

    expect(indexToValueMap.orderOfIndexes).toEqual([4, 0, 2, 1]);

    indexToValueMap.setValueAtIndex(3, 4, 2);

    expect(indexToValueMap.orderOfIndexes).toEqual([4, 0, 3, 2, 1]);
  });

  it('should init map properly when passing function as initialization property', () => {
    const indexToValueMap = new IndexToValueMap(index => ({ key: index }));

    indexToValueMap.init(3);

    expect(indexToValueMap.indexedValues).toEqual([{ key: 0 }, { key: 1 }, { key: 2 }]);
    expect(indexToValueMap.getValues()).toEqual([]);
    expect(indexToValueMap.getLength()).toBe(0);
  });

  it('should init map properly when passing value as initialization property', () => {
    const indexToValueMap = new IndexToValueMap({ key: 1 });

    indexToValueMap.init(3);

    expect(indexToValueMap.indexedValues).toEqual([{ key: 1 }, { key: 1 }, { key: 1 }]);
    expect(indexToValueMap.getValues()).toEqual([]);
    expect(indexToValueMap.getLength()).toBe(0);
  });

  it('should clear values properly', () => {
    const indexToValueMap = new IndexToValueMap(index => ({ key: index + 2 }));

    indexToValueMap.init(3);
    indexToValueMap.setValues([{ key: 1 }, { key: 2 }, { key: 0 }]);
    expect(indexToValueMap.orderOfIndexes).toEqual([0, 1, 2]);
    indexToValueMap.clear();

    expect(indexToValueMap.indexedValues).toEqual([{ key: 2 }, { key: 3 }, { key: 4 }]);
    expect(indexToValueMap.getValues()).toEqual([]);
    expect(indexToValueMap.getLength()).toBe(0);
    expect(indexToValueMap.orderOfIndexes).toEqual([]);
  });

  it('should clear single value properly', () => {
    const indexToValueMap = new IndexToValueMap();

    indexToValueMap.init(3);
    indexToValueMap.setValues([{ key: 1 }, { key: 2 }, { key: 0 }]);
    expect(indexToValueMap.orderOfIndexes).toEqual([0, 1, 2]);

    indexToValueMap.clearValue(1);

    expect(indexToValueMap.indexedValues).toEqual([{ key: 1 }, null, { key: 0 }]);
    expect(indexToValueMap.getValues()).toEqual([{ key: 1 }, { key: 0 }]);
    expect(indexToValueMap.getLength()).toBe(2);
    expect(indexToValueMap.orderOfIndexes).toEqual([0, 2]);

    indexToValueMap.clearValue(0);

    expect(indexToValueMap.indexedValues).toEqual([null, null, { key: 0 }]);
    expect(indexToValueMap.getValues()).toEqual([{ key: 0 }]);
    expect(indexToValueMap.getLength()).toBe(1);
    expect(indexToValueMap.orderOfIndexes).toEqual([2]);
  });

  it('should handle `insert` method properly', () => {
    const indexToValueMap = new IndexToValueMap();

    indexToValueMap.init(5);

    indexToValueMap.setValueAtIndex(3, 0);
    indexToValueMap.setValueAtIndex(2, 1);
    indexToValueMap.setValueAtIndex(0, 2);

    indexToValueMap.insert(0, [0]);

    expect(indexToValueMap.indexedValues).toEqual([null, 2, null, 1, 0, null]);
    expect(indexToValueMap.getValues()).toEqual([0, 1, 2]);
    expect(indexToValueMap.orderOfIndexes).toEqual([4, 3, 1]);
    expect(indexToValueMap.getLength()).toBe(3);

    indexToValueMap.insert(2, [2]);

    expect(indexToValueMap.indexedValues).toEqual([null, 2, null, null, 1, 0, null]);
    expect(indexToValueMap.getValues()).toEqual([0, 1, 2]);
    expect(indexToValueMap.orderOfIndexes).toEqual([5, 4, 1]);
    expect(indexToValueMap.getLength()).toBe(3);

    indexToValueMap.insert(6, [6]);

    expect(indexToValueMap.getValues()).toEqual([0, 1, 2]);
    expect(indexToValueMap.orderOfIndexes).toEqual([5, 4, 1]);
    expect(indexToValueMap.getLength()).toBe(3);
  });

  it('should handle `remove` method properly', () => {
    const indexToValueMap = new IndexToValueMap();

    indexToValueMap.init(5);

    indexToValueMap.setValueAtIndex(3, 0);
    indexToValueMap.setValueAtIndex(2, 1);
    indexToValueMap.setValueAtIndex(0, 2);

    indexToValueMap.remove([0]);

    expect(indexToValueMap.indexedValues).toEqual([null, 1, 0, null]);
    expect(indexToValueMap.getValues()).toEqual([0, 1]);
    expect(indexToValueMap.orderOfIndexes).toEqual([2, 1]);
    expect(indexToValueMap.getLength()).toBe(2);

    indexToValueMap.remove([3]);

    expect(indexToValueMap.indexedValues).toEqual([null, 1, 0]);
    expect(indexToValueMap.getValues()).toEqual([0, 1]);
    expect(indexToValueMap.orderOfIndexes).toEqual([2, 1]);
    expect(indexToValueMap.getLength()).toBe(2);

    indexToValueMap.remove([2]);

    expect(indexToValueMap.indexedValues).toEqual([null, 1]);
    expect(indexToValueMap.getValues()).toEqual([1]);
    expect(indexToValueMap.orderOfIndexes).toEqual([1]);
    expect(indexToValueMap.getLength()).toBe(1);

    indexToValueMap.remove([0]);

    expect(indexToValueMap.indexedValues).toEqual([1]);
    expect(indexToValueMap.getValues()).toEqual([1]);
    expect(indexToValueMap.orderOfIndexes).toEqual([0]);
    expect(indexToValueMap.getLength()).toBe(1);

    indexToValueMap.remove([0]);

    expect(indexToValueMap.indexedValues).toEqual([]);
    expect(indexToValueMap.getValues()).toEqual([]);
    expect(indexToValueMap.orderOfIndexes).toEqual([]);
    expect(indexToValueMap.getLength()).toBe(0);
  });

  it('should handle `setDefaultValues` method properly', () => {
    const indexToValueMap = new IndexToValueMap();

    indexToValueMap.init(5);

    indexToValueMap.setValueAtIndex(0, 2);
    indexToValueMap.setValueAtIndex(1, 1);
    indexToValueMap.setValueAtIndex(2, 0);

    indexToValueMap.setDefaultValues();

    expect(indexToValueMap.indexedValues).toEqual([null, null, null, null, null]);
    expect(indexToValueMap.getValues()).toEqual([]);
    expect(indexToValueMap.orderOfIndexes).toEqual([]);
    expect(indexToValueMap.getLength()).toBe(0);
  });

  it('should return entries by `getEntries` method properly', () => {
    const indexToValueMap = new IndexToValueMap();

    indexToValueMap.setValueAtIndex(0, 2);
    indexToValueMap.setValueAtIndex(1, 1);
    indexToValueMap.setValueAtIndex(2, 0);

    expect(indexToValueMap.getEntries()).toEqual([]);

    indexToValueMap.init(5);

    expect(indexToValueMap.getEntries()).toEqual([]);

    indexToValueMap.setValueAtIndex(0, 2);
    indexToValueMap.setValueAtIndex(1, 1);
    indexToValueMap.setValueAtIndex(2, 0);

    expect(indexToValueMap.getEntries()).toEqual([
      [0, 2],
      [1, 1],
      [2, 0],
    ]);
  });

  describe('Triggering `change` hook', () => {
    it('should trigger `change` hook on initialization once', () => {
      const indexToValueMap = new IndexToValueMap();
      const changeCallback = jasmine.createSpy('change');

      indexToValueMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      indexToValueMap.init(10);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on insertion once', () => {
      const indexToValueMap = new IndexToValueMap();
      const changeCallback = jasmine.createSpy('change');

      indexToValueMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      indexToValueMap.insert(0, [0]);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on removal once', () => {
      const indexToValueMap = new IndexToValueMap();
      const changeCallback = jasmine.createSpy('change');

      indexToValueMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      indexToValueMap.remove([0]);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on setting data on index in range', () => {
      const indexToValueMap = new IndexToValueMap();
      const changeCallback = jasmine.createSpy('change');

      indexToValueMap.init(10);
      indexToValueMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      indexToValueMap.setValueAtIndex(0, true);

      // Triggered for index in range.
      expect(changeCallback.calls.count()).toEqual(1);

      // Not triggered for index out of range.
      indexToValueMap.setValueAtIndex(10, true);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on setting data which does not change value', () => {
      const indexToValueMap = new IndexToValueMap();
      const changeCallback = jasmine.createSpy('change');

      indexToValueMap.init(10);
      indexToValueMap.addLocalHook('change', changeCallback);

      // Default value is `null`. No real change, but hook is called anyway.
      indexToValueMap.setValueAtIndex(0, null);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on setting data on indexes once', () => {
      const indexToValueMap = new IndexToValueMap();
      const changeCallback = jasmine.createSpy('change');

      indexToValueMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      indexToValueMap.setValues([0, 1, 2, 3, 4]);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on clearing data once', () => {
      const indexToValueMap = new IndexToValueMap();
      const changeCallback = jasmine.createSpy('change');

      indexToValueMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      indexToValueMap.clear();

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook after setting also order of indexes (not before it)', () => {
      const indexToValueMap = new IndexToValueMap();
      let indexedValues;
      let values;
      let length;
      let orderOfIndexes;

      const changeCallback = () => {
        indexedValues = indexToValueMap.indexedValues;
        values = indexToValueMap.getValues();
        length = indexToValueMap.getLength();
        orderOfIndexes = indexToValueMap.orderOfIndexes;
      };

      indexToValueMap.addLocalHook('change', changeCallback);

      indexToValueMap.init(3);

      expect(indexedValues).toEqual([null, null, null]);
      expect(values).toEqual([]);
      expect(length).toBe(0);
      expect(orderOfIndexes).toEqual([]);

      indexToValueMap.setValues([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);

      expect(indexedValues).toEqual([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);
      expect(values).toEqual([{ a: 'b' }, { c: 'd' }, { e: 'f' }]);
      expect(length).toBe(3);
      expect(orderOfIndexes).toEqual([0, 1, 2]);

      indexToValueMap.setValueAtIndex(1, { g: 'h' });

      expect(indexedValues).toEqual([{ a: 'b' }, { g: 'h' }, { e: 'f' }]);
      expect(values).toEqual([{ a: 'b' }, { g: 'h' }, { e: 'f' }]);
      expect(length).toBe(3);
      expect(orderOfIndexes).toEqual([0, 1, 2]);

      indexToValueMap.clear();

      expect(indexedValues).toEqual([null, null, null]);
      expect(values).toEqual([]);
      expect(length).toBe(0);
      expect(orderOfIndexes).toEqual([]);

      indexToValueMap.setValueAtIndex(1, { a: 'b' });
      indexToValueMap.setValueAtIndex(0, { c: 'd' });

      expect(indexedValues).toEqual([{ c: 'd' }, { a: 'b' }, null]);
      expect(values).toEqual([{ a: 'b' }, { c: 'd' }]);
      expect(length).toBe(2);
      expect(orderOfIndexes).toEqual([1, 0]);
    });
  });
});
