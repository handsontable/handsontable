import { IndexesSequence } from 'handsontable/translations';

describe('IndexesSequence', () => {
  it('should work with get, and set functions properly', () => {
    const indexesSequence = new IndexesSequence();

    indexesSequence.setValueAtIndex(0, 2);
    indexesSequence.setValueAtIndex(1, 1);
    indexesSequence.setValueAtIndex(2, 0);

    expect(indexesSequence.getValues()).toEqual([]);
    expect(indexesSequence.getLength()).toEqual(0);

    indexesSequence.init(3);

    expect(indexesSequence.getValues()).toEqual([0, 1, 2]);
    expect(indexesSequence.getLength()).toEqual(3);

    indexesSequence.setValueAtIndex(0, 2);
    indexesSequence.setValueAtIndex(1, 1);
    indexesSequence.setValueAtIndex(2, 0);

    expect(indexesSequence.getValues()).toEqual([2, 1, 0]);
    expect(indexesSequence.getLength()).toEqual(3);

    indexesSequence.setValues([1, 2, 0]);

    expect(indexesSequence.getValues()).toEqual([1, 2, 0]);
    expect(indexesSequence.getLength()).toEqual(3);
  });

  it('should clear values properly', () => {
    const indexesSequence = new IndexesSequence();

    indexesSequence.init(3);
    indexesSequence.setValues([1, 2, 0]);
    indexesSequence.clear();

    expect(indexesSequence.getValues()).toEqual([0, 1, 2]);
  });

  describe('Triggering `change` hook', () => {
    it('should trigger `change` hook on initialization once', () => {
      const indexesSequence = new IndexesSequence();
      const changeCallback = jasmine.createSpy('change');

      indexesSequence.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      indexesSequence.init(10);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on insertion once', () => {
      const indexesSequence = new IndexesSequence();
      const changeCallback = jasmine.createSpy('change');

      indexesSequence.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      indexesSequence.insert(0, [0]);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on removal once', () => {
      const indexesSequence = new IndexesSequence();
      const changeCallback = jasmine.createSpy('change');

      indexesSequence.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      indexesSequence.remove([0]);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on setting data on index in range', () => {
      const indexesSequence = new IndexesSequence();
      const changeCallback = jasmine.createSpy('change');

      indexesSequence.init(10);
      indexesSequence.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      indexesSequence.setValueAtIndex(0, true);

      // Triggered for index in range.
      expect(changeCallback.calls.count()).toEqual(1);

      // Not triggered for index out of range.
      indexesSequence.setValueAtIndex(10, true);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on setting data which does not change value', () => {
      const indexesSequence = new IndexesSequence();
      const changeCallback = jasmine.createSpy('change');

      indexesSequence.init(10);
      indexesSequence.addLocalHook('change', changeCallback);

      // Default value is `0` for index at position `0`. No real change, but hook is called anyway.
      indexesSequence.setValueAtIndex(0, 0);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on setting data on indexes once', () => {
      const indexesSequence = new IndexesSequence();
      const changeCallback = jasmine.createSpy('change');

      indexesSequence.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      indexesSequence.setValues([0, 1, 2, 3, 4]);

      expect(changeCallback.calls.count()).toEqual(1);
    });

    it('should trigger `change` hook on clearing data once', () => {
      const indexesSequence = new IndexesSequence();
      const changeCallback = jasmine.createSpy('change');

      indexesSequence.addLocalHook('change', changeCallback);

      expect(changeCallback.calls.count()).toEqual(0);

      indexesSequence.clear();

      expect(changeCallback.calls.count()).toEqual(1);
    });
  });
});
