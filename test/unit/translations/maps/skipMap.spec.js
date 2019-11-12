import { SkipMap } from 'handsontable/translations';

it('should work with get, and set functions properly', () => {
  const skipMap = new SkipMap();

  skipMap.setValueAtIndex(0, true);
  skipMap.setValueAtIndex(1, true);
  skipMap.setValueAtIndex(2, false);

  expect(skipMap.getValues()).toEqual([]);
  expect(skipMap.getLength()).toEqual(0);

  skipMap.init(3);

  expect(skipMap.getValues()).toEqual([false, false, false]);
  expect(skipMap.getLength()).toEqual(3);

  skipMap.setValueAtIndex(0, false);
  skipMap.setValueAtIndex(1, false);
  skipMap.setValueAtIndex(2, true);

  expect(skipMap.getValues()).toEqual([false, false, true]);
  expect(skipMap.getLength()).toEqual(3);

  skipMap.setValues([true, false, true]);

  expect(skipMap.getValues()).toEqual([true, false, true]);
  expect(skipMap.getLength()).toEqual(3);
});

it('should init map properly when passing function as initialization property', () => {
  const skipMap = new SkipMap(index => index % 2 === 0);

  skipMap.init(3);

  expect(skipMap.getValues()).toEqual([true, false, true]);
});

it('should init map properly when passing value as initialization property', () => {
  const skipMap = new SkipMap(true);

  skipMap.init(3);

  expect(skipMap.getValues()).toEqual([true, true, true]);
});

it('should clear values properly', () => {
  const skipMap = new SkipMap(index => index % 3 === 0);

  skipMap.init(3);
  skipMap.setValues([false, false, true]);
  skipMap.clear();

  expect(skipMap.getValues()).toEqual([true, false, false]);
});

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

  it('should trigger `change` hook on setting data which does not change value', () => {
    const skipMap = new SkipMap();
    const changeCallback = jasmine.createSpy('change');

    skipMap.init(10);
    skipMap.addLocalHook('change', changeCallback);

    // Default value is `false`. No real change, but hook is called anyway.
    skipMap.setValueAtIndex(0, false);

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
