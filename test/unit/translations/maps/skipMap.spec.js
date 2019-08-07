import { SkipMap } from 'handsontable/translations';

describe('Triggering `change` hook', () => {
  it('should trigger `change` hook on initialization once', () => {
    const skipMap = new SkipMap();
    const changeCallback = jasmine.createSpy('change');

    skipMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    skipMap.init(10);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on insertion once', () => {
    const skipMap = new SkipMap();
    const changeCallback = jasmine.createSpy('change');

    skipMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);
    skipMap.insert(0, [0]);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on removal once', () => {
    const skipMap = new SkipMap();
    const changeCallback = jasmine.createSpy('change');

    skipMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    skipMap.remove([0]);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on setting data on index in range', () => {
    const skipMap = new SkipMap();
    const changeCallback = jasmine.createSpy('change');

    skipMap.init(10);
    skipMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    skipMap.setValueAtIndex(0, true);

    // Triggered for index in range.
    expect(changeCallback.calls.count()).toEqual(1);

    // Not triggered for index out of range.
    skipMap.setValueAtIndex(10, true);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on setting data on indexes once', () => {
    const skipMap = new SkipMap();
    const changeCallback = jasmine.createSpy('change');

    skipMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    skipMap.setValues([0, 1, 2, 3, 4]);

    expect(changeCallback.calls.count()).toEqual(1);
  });

  it('should trigger `change` hook on clearing data once', () => {
    const skipMap = new SkipMap();
    const changeCallback = jasmine.createSpy('change');

    skipMap.addLocalHook('change', changeCallback);

    expect(changeCallback.calls.count()).toEqual(0);

    skipMap.clear();

    expect(changeCallback.calls.count()).toEqual(1);
  });
});
