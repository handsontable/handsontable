import { IndexMap } from 'handsontable/translations';

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
