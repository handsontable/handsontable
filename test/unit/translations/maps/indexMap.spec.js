import { IndexMap } from 'handsontable/translations';

it('should work with get, and set functions properly', () => {
  const indexMap = new IndexMap();

  indexMap.setValueAtIndex(0, 2);
  indexMap.setValueAtIndex(1, 1);
  indexMap.setValueAtIndex(2, 0);

  expect(indexMap.getValues()).toEqual([]);
  expect(indexMap.getLength()).toEqual(0);

  indexMap.init(3);

  expect(indexMap.getValues()).toEqual([0, 1, 2]);
  expect(indexMap.getLength()).toEqual(3);

  indexMap.setValueAtIndex(0, 2);
  indexMap.setValueAtIndex(1, 1);
  indexMap.setValueAtIndex(2, 0);

  expect(indexMap.getValues()).toEqual([2, 1, 0]);
  expect(indexMap.getLength()).toEqual(3);

  indexMap.setValues([1, 2, 0]);

  expect(indexMap.getValues()).toEqual([1, 2, 0]);
  expect(indexMap.getLength()).toEqual(3);
});

it('should clear values properly', () => {
  const indexMap = new IndexMap();

  indexMap.init(3);
  indexMap.setValues([1, 2, 0]);
  indexMap.clear();

  expect(indexMap.getValues()).toEqual([0, 1, 2]);
});

describe('Triggering `change` hook', () => {
  it('should trigger `change` hook on initialization once', () => {
    const indexMap = new IndexMap();
    const changeCallback = jasmine.createSpy('change');

    indexMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    indexMap.init(10);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on insertion once', () => {
    const indexMap = new IndexMap();
    const changeCallback = jasmine.createSpy('change');

    indexMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);
    indexMap.insert(0, [0]);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on removal once', () => {
    const indexMap = new IndexMap();
    const changeCallback = jasmine.createSpy('change');

    indexMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    indexMap.remove([0]);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on setting data on index in range', () => {
    const indexMap = new IndexMap();
    const changeCallback = jasmine.createSpy('change');

    indexMap.init(10);
    indexMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    indexMap.setValueAtIndex(0, true);

    // Triggered for index in range.
    expect(changeCallback.calls.count()).toEqual(1);

    // Not triggered for index out of range.
    indexMap.setValueAtIndex(10, true);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on setting data on indexes once', () => {
    const indexMap = new IndexMap();
    const changeCallback = jasmine.createSpy('change');

    indexMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    indexMap.setValues([0, 1, 2, 3, 4]);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on clearing data once', () => {
    const indexMap = new IndexMap();
    const changeCallback = jasmine.createSpy('change');

    indexMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    indexMap.clear();

    expect(changeCallback.calls.count()).toEqual(1);
  });
});
