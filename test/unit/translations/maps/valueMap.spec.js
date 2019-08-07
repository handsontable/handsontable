import { ValueMap } from 'handsontable/translations';

describe('Triggering `change` hook', () => {
  it('should trigger `change` hook on initialization once', () => {
    const valueMap = new ValueMap();
    const changeCallback = jasmine.createSpy('change');

    valueMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    valueMap.init(10);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on insertion once', () => {
    const valueMap = new ValueMap();
    const changeCallback = jasmine.createSpy('change');

    valueMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);
    valueMap.insert(0, [0]);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on removal once', () => {
    const valueMap = new ValueMap();
    const changeCallback = jasmine.createSpy('change');

    valueMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    valueMap.remove([0]);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on setting data on index in range', () => {
    const valueMap = new ValueMap();
    const changeCallback = jasmine.createSpy('change');

    valueMap.init(10);
    valueMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    valueMap.setValueAtIndex(0, true);

    // Triggered for index in range.
    expect(changeCallback.calls.count()).toEqual(1);

    // Not triggered for index out of range.
    valueMap.setValueAtIndex(10, true);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on setting data on indexes once', () => {
    const valueMap = new ValueMap();
    const changeCallback = jasmine.createSpy('change');

    valueMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    valueMap.setValues([0, 1, 2, 3, 4]);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on clearing data once', () => {
    const valueMap = new ValueMap();
    const changeCallback = jasmine.createSpy('change');

    valueMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    valueMap.clear();

    expect(changeCallback.calls.count()).toEqual(1);
  });
});
