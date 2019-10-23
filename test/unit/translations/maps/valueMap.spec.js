import { ValueMap } from 'handsontable/translations';

it('should work with get, and set functions properly', () => {
  const valueMap = new ValueMap();

  valueMap.setValueAtIndex(0, 2);
  valueMap.setValueAtIndex(1, 1);
  valueMap.setValueAtIndex(2, 0);

  expect(valueMap.getValues()).toEqual([]);
  expect(valueMap.getLength()).toEqual(0);

  valueMap.init(3);

  expect(valueMap.getValues()).toEqual([null, null, null]);
  expect(valueMap.getLength()).toEqual(3);

  valueMap.setValueAtIndex(0, 2);
  valueMap.setValueAtIndex(1, 1);
  valueMap.setValueAtIndex(2, 0);

  expect(valueMap.getValues()).toEqual([2, 1, 0]);
  expect(valueMap.getLength()).toEqual(3);

  valueMap.setValues([1, 2, 0]);

  expect(valueMap.getValues()).toEqual([1, 2, 0]);
  expect(valueMap.getLength()).toEqual(3);
});

it('should init map properly when passing function as initialization property', () => {
  const valueMap = new ValueMap(index => ({ key: index }));

  valueMap.init(3);

  expect(valueMap.getValues()).toEqual([{ key: 0 }, { key: 1 }, { key: 2 }]);
});

it('should init map properly when passing value as initialization property', () => {
  const valueMap = new ValueMap({ key: 1 });

  valueMap.init(3);

  expect(valueMap.getValues()).toEqual([{ key: 1 }, { key: 1 }, { key: 1 }]);
});

it('should clear values properly', () => {
  const valueMap = new ValueMap(index => ({ key: index + 2 }));

  valueMap.init(3);
  valueMap.setValues([{ key: 1 }, { key: 2 }, { key: 0 }]);
  valueMap.clear();

  expect(valueMap.getValues()).toEqual([{ key: 2 }, { key: 3 }, { key: 4 }]);
});

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

  it('should trigger `change` hook on setting data which does not change value', () => {
    const valueMap = new ValueMap();
    const changeCallback = jasmine.createSpy('change');

    valueMap.init(10);
    valueMap.addLocalHook('change', changeCallback);

    // Default value is `null`. No real change, but hook is called anyway.
    valueMap.setValueAtIndex(0, null);

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
