import { HidingMap } from 'handsontable/translations';

describe('HidingMap', () => {
  it('should work with get, and set functions properly', () => {
    const hidingMap = new HidingMap();

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, false);

    expect(hidingMap.getValues()).toEqual([]);
    expect(hidingMap.getLength()).toEqual(0);

    hidingMap.init(3);

    expect(hidingMap.getValues()).toEqual([false, false, false]);
    expect(hidingMap.getLength()).toEqual(3);

    hidingMap.setValueAtIndex(0, false);
    hidingMap.setValueAtIndex(1, false);
    hidingMap.setValueAtIndex(2, true);

    expect(hidingMap.getValues()).toEqual([false, false, true]);
    expect(hidingMap.getLength()).toEqual(3);

    hidingMap.setValues([true, false, true]);

    expect(hidingMap.getValues()).toEqual([true, false, true]);
    expect(hidingMap.getLength()).toEqual(3);
  });

  it('should init map properly when passing function as initialization property', () => {
    const hidingMap = new HidingMap(index => index % 2 === 0);

    hidingMap.init(3);

    expect(hidingMap.getValues()).toEqual([true, false, true]);
  });

  it('should init map properly when passing value as initialization property', () => {
    const hidingMap = new HidingMap(true);

    hidingMap.init(3);

    expect(hidingMap.getValues()).toEqual([true, true, true]);
  });

  it('should clear values properly', () => {
    const hidingMap = new HidingMap(index => index % 3 === 0);

    hidingMap.init(3);
    hidingMap.setValues([false, false, true]);
    hidingMap.clear();

    expect(hidingMap.getValues()).toEqual([true, false, false]);
  });

  describe('Triggering `change` hook', () => {
    it('should trigger `change` hook on initialization once', () => {
      const hidingMap = new HidingMap();
      const changeCallback = jasmine.createSpy('change');

      hidingMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      hidingMap.init(10);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on insertion once', () => {
      const hidingMap = new HidingMap();
      const changeCallback = jasmine.createSpy('change');

      hidingMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      hidingMap.insert(0, [0]);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on removal once', () => {
      const hidingMap = new HidingMap();
      const changeCallback = jasmine.createSpy('change');

      hidingMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      hidingMap.remove([0]);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on setting data on index in range', () => {
      const hidingMap = new HidingMap();
      const changeCallback = jasmine.createSpy('change');

      hidingMap.init(10);
      hidingMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      hidingMap.setValueAtIndex(0, true);

      // Triggered for index in range.
      expect(changeCallback.calls.count()).toEqual(1);

      // Not triggered for index out of range.
      hidingMap.setValueAtIndex(10, true);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on setting data which does not change value', () => {
      const hidingMap = new HidingMap();
      const changeCallback = jasmine.createSpy('change');

      hidingMap.init(10);
      hidingMap.addLocalHook('change', changeCallback);

      // Default value is `false`. No real change, but hook is called anyway.
      hidingMap.setValueAtIndex(0, false);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on setting data on indexes once', () => {
      const hidingMap = new HidingMap();
      const changeCallback = jasmine.createSpy('change');

      hidingMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      hidingMap.setValues([0, 1, 2, 3, 4]);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on clearing data once', () => {
      const hidingMap = new HidingMap();
      const changeCallback = jasmine.createSpy('change');

      hidingMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      hidingMap.clear();

      expect(changeCallback.calls.count()).toEqual(1);
    });
  });
});
