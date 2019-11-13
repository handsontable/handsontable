import { VisualIndexToPhysicalIndexMap as IndexToIndexMap } from 'handsontable/translations';

it('should work with get, and set functions properly', () => {
  const indexToIndexMap = new IndexToIndexMap();

  indexToIndexMap.setValueAtIndex(0, 2);
  indexToIndexMap.setValueAtIndex(1, 1);
  indexToIndexMap.setValueAtIndex(2, 0);

  expect(indexToIndexMap.getValues()).toEqual([]);
  expect(indexToIndexMap.getLength()).toEqual(0);

  indexToIndexMap.init(3);

  expect(indexToIndexMap.getValues()).toEqual([0, 1, 2]);
  expect(indexToIndexMap.getLength()).toEqual(3);

  indexToIndexMap.setValueAtIndex(0, 2);
  indexToIndexMap.setValueAtIndex(1, 1);
  indexToIndexMap.setValueAtIndex(2, 0);

  expect(indexToIndexMap.getValues()).toEqual([2, 1, 0]);
  expect(indexToIndexMap.getLength()).toEqual(3);

  indexToIndexMap.setValues([1, 2, 0]);

  expect(indexToIndexMap.getValues()).toEqual([1, 2, 0]);
  expect(indexToIndexMap.getLength()).toEqual(3);
});

it('should clear values properly', () => {
  const indexToIndexMap = new IndexToIndexMap();

  indexToIndexMap.init(3);
  indexToIndexMap.setValues([1, 2, 0]);
  indexToIndexMap.clear();

  expect(indexToIndexMap.getValues()).toEqual([0, 1, 2]);
});

describe('Triggering `change` hook', () => {
  it('should trigger `change` hook on initialization once', () => {
    const indexToIndexMap = new IndexToIndexMap();
    const changeCallback = jasmine.createSpy('change');

    indexToIndexMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    indexToIndexMap.init(10);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on insertion once', () => {
    const indexToIndexMap = new IndexToIndexMap();
    const changeCallback = jasmine.createSpy('change');

    indexToIndexMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    indexToIndexMap.insert(0, [0]);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on removal once', () => {
    const indexToIndexMap = new IndexToIndexMap();
    const changeCallback = jasmine.createSpy('change');

    indexToIndexMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    indexToIndexMap.remove([0]);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on setting data on index in range', () => {
    const indexToIndexMap = new IndexToIndexMap();
    const changeCallback = jasmine.createSpy('change');

    indexToIndexMap.init(10);
    indexToIndexMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    indexToIndexMap.setValueAtIndex(0, true);

    // Triggered for index in range.
    expect(changeCallback.calls.count()).toEqual(1);

    // Not triggered for index out of range.
    indexToIndexMap.setValueAtIndex(10, true);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on setting data which does not change value', () => {
    const indexToIndexMap = new IndexToIndexMap();
    const changeCallback = jasmine.createSpy('change');

    indexToIndexMap.init(10);
    indexToIndexMap.addLocalHook('change', changeCallback);

    // Default value is `0` for index at position `0`. No real change, but hook is called anyway.
    indexToIndexMap.setValueAtIndex(0, 0);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on setting data on indexes once', () => {
    const indexToIndexMap = new IndexToIndexMap();
    const changeCallback = jasmine.createSpy('change');

    indexToIndexMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    indexToIndexMap.setValues([0, 1, 2, 3, 4]);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on clearing data once', () => {
    const indexToIndexMap = new IndexToIndexMap();
    const changeCallback = jasmine.createSpy('change');

    indexToIndexMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    indexToIndexMap.clear();

    expect(changeCallback.calls.count()).toEqual(1);
  });
});
