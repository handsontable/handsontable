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

  describe('all-default (compact) representation', () => {
    it('should stay all-default after inserting into an empty map (length grows, values stay default)', () => {
      const hidingMap = new HidingMap();

      hidingMap.init(5);
      hidingMap.insert(2, [2, 3]);

      expect(hidingMap.getValues()).toEqual([false, false, false, false, false, false, false]);
      expect(hidingMap.getLength()).toEqual(7);
    });

    it('should stay all-default after removing from an empty map (length shrinks)', () => {
      const hidingMap = new HidingMap();

      hidingMap.init(5);
      hidingMap.remove([1, 3]);

      expect(hidingMap.getValues()).toEqual([false, false, false]);
      expect(hidingMap.getLength()).toEqual(3);
    });

    it('should ignore out-of-range and duplicate removed indexes while all-default', () => {
      const hidingMap = new HidingMap();

      hidingMap.init(3);
      hidingMap.remove([2, 2, 5]);

      expect(hidingMap.getValues()).toEqual([false, false]);
      expect(hidingMap.getLength()).toEqual(2);
    });

    it('should materialize on the first non-default write and reflect it', () => {
      const hidingMap = new HidingMap();

      hidingMap.init(5);
      hidingMap.setValueAtIndex(2, true);

      expect(hidingMap.getValues()).toEqual([false, false, true, false, false]);
      expect(hidingMap.getValueAtIndex(2)).toBe(true);
      expect(hidingMap.getValueAtIndex(0)).toBe(false);
    });

    it('should reindex a materialized map on insert (default-filled block at the inserted index)', () => {
      const hidingMap = new HidingMap();

      hidingMap.init(5);
      hidingMap.setValueAtIndex(2, true);
      hidingMap.insert(0, [0]);

      // The `true` at physical 2 shifts to physical 3; a `false` is inserted at physical 0.
      expect(hidingMap.getValues()).toEqual([false, false, false, true, false, false]);
      expect(hidingMap.getLength()).toEqual(6);
    });

    it('should reindex a materialized map on remove', () => {
      const hidingMap = new HidingMap();

      hidingMap.init(5);
      hidingMap.setValueAtIndex(2, true);
      hidingMap.remove([0]);

      expect(hidingMap.getValues()).toEqual([false, true, false, false]);
      expect(hidingMap.getLength()).toEqual(4);
    });

    it('should go back to the compact representation when setValues is all-default', () => {
      const hidingMap = new HidingMap();

      hidingMap.init(3);
      hidingMap.setValues([false, true, false]);

      expect(hidingMap.getValues()).toEqual([false, true, false]);

      hidingMap.setValues([false, false, false]);
      hidingMap.remove([0]);

      expect(hidingMap.getValues()).toEqual([false, false]);
      expect(hidingMap.getLength()).toEqual(2);
    });

    it('should report hidden indexes correctly across both representations', () => {
      const hidingMap = new HidingMap();

      hidingMap.init(5);

      expect(hidingMap.getHiddenIndexes()).toEqual([]);

      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(4, true);

      expect(hidingMap.getHiddenIndexes()).toEqual([1, 4]);
    });
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
