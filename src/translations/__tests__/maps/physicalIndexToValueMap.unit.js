import { PhysicalIndexToValueMap as IndexToValueMap } from 'handsontable/translations';

describe('PhysicalIndexToValueMap', () => {
  it('should work with get, and set functions properly', () => {
    const indexToValueMap = new IndexToValueMap();

    indexToValueMap.setValueAtIndex(0, 2);
    indexToValueMap.setValueAtIndex(1, 1);
    indexToValueMap.setValueAtIndex(2, 0);

    expect(indexToValueMap.getValues()).toEqual([]);
    expect(indexToValueMap.getLength()).toEqual(0);

    indexToValueMap.init(3);

    expect(indexToValueMap.getValues()).toEqual([null, null, null]);
    expect(indexToValueMap.getLength()).toEqual(3);

    indexToValueMap.setValueAtIndex(0, 2);
    indexToValueMap.setValueAtIndex(1, 1);
    indexToValueMap.setValueAtIndex(2, 0);

    expect(indexToValueMap.getValues()).toEqual([2, 1, 0]);
    expect(indexToValueMap.getLength()).toEqual(3);

    indexToValueMap.setValues([1, 2, 0]);

    expect(indexToValueMap.getValues()).toEqual([1, 2, 0]);
    expect(indexToValueMap.getLength()).toEqual(3);
  });

  it('should init map properly when passing function as initialization property', () => {
    const indexToValueMap = new IndexToValueMap(index => ({ key: index }));

    indexToValueMap.init(3);

    expect(indexToValueMap.getValues()).toEqual([{ key: 0 }, { key: 1 }, { key: 2 }]);
  });

  it('should init map properly when passing value as initialization property', () => {
    const indexToValueMap = new IndexToValueMap({ key: 1 });

    indexToValueMap.init(3);

    expect(indexToValueMap.getValues()).toEqual([{ key: 1 }, { key: 1 }, { key: 1 }]);
  });

  it('should clear values properly', () => {
    const indexToValueMap = new IndexToValueMap(index => ({ key: index + 2 }));

    indexToValueMap.init(3);
    indexToValueMap.setValues([{ key: 1 }, { key: 2 }, { key: 0 }]);
    indexToValueMap.clear();

    expect(indexToValueMap.getValues()).toEqual([{ key: 2 }, { key: 3 }, { key: 4 }]);
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
  });
});
