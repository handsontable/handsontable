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

  describe('identity (incremental) representation', () => {
    it('should keep the identity sequence after init without materializing an array', () => {
      const indexesSequence = new IndexesSequence();

      indexesSequence.init(5);

      expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4]);
      expect(indexesSequence.getLength()).toEqual(5);
      expect(indexesSequence.getValueAtIndex(0)).toEqual(0);
      expect(indexesSequence.getValueAtIndex(4)).toEqual(4);
      expect(indexesSequence.getValueAtIndex(5)).toBe(undefined);
    });

    it('should stay identity after inserting a contiguous block at its own position', () => {
      const indexesSequence = new IndexesSequence();

      indexesSequence.init(5);
      indexesSequence.insert(2, [2, 3]);

      // Equivalent to the array-based reindex: [0,1,2,3,4] + 2 rows at position 2 -> [0..6].
      expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6]);
      expect(indexesSequence.getLength()).toEqual(7);
    });

    it('should stay identity after appending', () => {
      const indexesSequence = new IndexesSequence();

      indexesSequence.init(3);
      indexesSequence.insert(3, [3, 4]);

      expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3, 4]);
      expect(indexesSequence.getLength()).toEqual(5);
    });

    it('should stay identity after removing any subset', () => {
      const indexesSequence = new IndexesSequence();

      indexesSequence.init(5);
      indexesSequence.remove([1, 3]);

      // Survivors {0,2,4} reindexed to ranks -> [0,1,2].
      expect(indexesSequence.getValues()).toEqual([0, 1, 2]);
      expect(indexesSequence.getLength()).toEqual(3);
    });

    it('should ignore out-of-range and duplicate removed indexes while identity', () => {
      const indexesSequence = new IndexesSequence();

      indexesSequence.init(3);
      indexesSequence.remove([2, 2, 5]);

      // Only the distinct in-range index `2` counts.
      expect(indexesSequence.getValues()).toEqual([0, 1]);
      expect(indexesSequence.getLength()).toEqual(2);
    });

    it('should materialize and reindex correctly when inserting a non-contiguous block', () => {
      const indexesSequence = new IndexesSequence();

      indexesSequence.init(5);
      indexesSequence.insert(0, [3, 4]);

      // Fallback (array-based) path: increase values >= 3 by 2, then splice [3,4] at position 0.
      expect(indexesSequence.getValues()).toEqual([3, 4, 0, 1, 2, 5, 6]);
      expect(indexesSequence.getLength()).toEqual(7);
    });

    it('should detect a non-identity sequence on setValues and reindex it on insert/remove', () => {
      const indexesSequence = new IndexesSequence();

      indexesSequence.init(3);
      indexesSequence.setValues([2, 0, 1]);

      expect(indexesSequence.getValues()).toEqual([2, 0, 1]);

      indexesSequence.insert(0, [3]);

      expect(indexesSequence.getValues()).toEqual([3, 2, 0, 1]);

      indexesSequence.setValues([2, 0, 1]);
      indexesSequence.remove([0]);

      expect(indexesSequence.getValues()).toEqual([1, 0]);
    });

    it('should recognize an identity permutation passed to setValues and keep the fast path', () => {
      const indexesSequence = new IndexesSequence();

      indexesSequence.init(3);
      indexesSequence.setValues([2, 0, 1]);
      indexesSequence.setValues([0, 1, 2, 3]);

      // Back to identity: removing keeps it an identity sequence.
      indexesSequence.remove([1]);

      expect(indexesSequence.getValues()).toEqual([0, 1, 2]);
      expect(indexesSequence.getLength()).toEqual(3);
    });

    it('should keep working after getValues materializes a copy while identity', () => {
      const indexesSequence = new IndexesSequence();

      indexesSequence.init(4);

      // Reading the full list must not flip the internal representation.
      expect(indexesSequence.getValues()).toEqual([0, 1, 2, 3]);

      indexesSequence.remove([0]);

      expect(indexesSequence.getValues()).toEqual([0, 1, 2]);
      expect(indexesSequence.getLength()).toEqual(3);
    });

    it('should materialize on setValueAtIndex and reflect the change', () => {
      const indexesSequence = new IndexesSequence();

      indexesSequence.init(3);
      indexesSequence.setValueAtIndex(1, 5);

      expect(indexesSequence.getValues()).toEqual([0, 5, 2]);
      expect(indexesSequence.getValueAtIndex(1)).toEqual(5);
    });
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
