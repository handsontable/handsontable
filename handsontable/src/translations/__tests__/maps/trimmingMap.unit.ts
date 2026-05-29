import { TrimmingMap } from 'handsontable/translations';

describe('TrimmingMap', () => {
  it('should work with get, and set functions properly', () => {
    const trimmingMap = new TrimmingMap();

    trimmingMap.setValueAtIndex(0, true);
    trimmingMap.setValueAtIndex(1, true);
    trimmingMap.setValueAtIndex(2, false);

    expect(trimmingMap.getValues()).toEqual([]);
    expect(trimmingMap.getLength()).toEqual(0);

    trimmingMap.init(3);

    expect(trimmingMap.getValues()).toEqual([false, false, false]);
    expect(trimmingMap.getLength()).toEqual(3);

    trimmingMap.setValueAtIndex(0, false);
    trimmingMap.setValueAtIndex(1, false);
    trimmingMap.setValueAtIndex(2, true);

    expect(trimmingMap.getValues()).toEqual([false, false, true]);
    expect(trimmingMap.getLength()).toEqual(3);

    trimmingMap.setValues([true, false, true]);

    expect(trimmingMap.getValues()).toEqual([true, false, true]);
    expect(trimmingMap.getLength()).toEqual(3);
  });

  it('should init map properly when passing function as initialization property', () => {
    const trimmingMap = new TrimmingMap(index => index % 2 === 0);

    trimmingMap.init(3);

    expect(trimmingMap.getValues()).toEqual([true, false, true]);
  });

  it('should init map properly when passing value as initialization property', () => {
    const trimmingMap = new TrimmingMap(true);

    trimmingMap.init(3);

    expect(trimmingMap.getValues()).toEqual([true, true, true]);
  });

  it('should clear values properly', () => {
    const trimmingMap = new TrimmingMap(index => index % 3 === 0);

    trimmingMap.init(3);
    trimmingMap.setValues([false, false, true]);
    trimmingMap.clear();

    expect(trimmingMap.getValues()).toEqual([true, false, false]);
  });

  describe('Triggering `change` hook', () => {
    it('should trigger `change` hook on initialization once', () => {
      const trimmingMap = new TrimmingMap();
      const changeCallback = jasmine.createSpy('change');

      trimmingMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      trimmingMap.init(10);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on insertion once', () => {
      const trimmingMap = new TrimmingMap();
      const changeCallback = jasmine.createSpy('change');

      trimmingMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      trimmingMap.insert(0, [0]);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on removal once', () => {
      const trimmingMap = new TrimmingMap();
      const changeCallback = jasmine.createSpy('change');

      trimmingMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      trimmingMap.remove([0]);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on setting data on index in range', () => {
      const trimmingMap = new TrimmingMap();
      const changeCallback = jasmine.createSpy('change');

      trimmingMap.init(10);
      trimmingMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      trimmingMap.setValueAtIndex(0, true);

      // Triggered for index in range.
      expect(changeCallback.calls.count()).toEqual(1);

      // Not triggered for index out of range.
      trimmingMap.setValueAtIndex(10, true);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on setting data which does not change value', () => {
      const trimmingMap = new TrimmingMap();
      const changeCallback = jasmine.createSpy('change');

      trimmingMap.init(10);
      trimmingMap.addLocalHook('change', changeCallback);

      // Default value is `false`. No real change, but hook is called anyway.
      trimmingMap.setValueAtIndex(0, false);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on setting data on indexes once', () => {
      const trimmingMap = new TrimmingMap();
      const changeCallback = jasmine.createSpy('change');

      trimmingMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      trimmingMap.setValues([0, 1, 2, 3, 4]);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on clearing data once', () => {
      const trimmingMap = new TrimmingMap();
      const changeCallback = jasmine.createSpy('change');

      trimmingMap.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      trimmingMap.clear();

      expect(changeCallback.calls.count()).toEqual(1);
    });
  });
});
