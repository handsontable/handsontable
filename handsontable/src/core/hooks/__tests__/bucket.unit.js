import { HooksBucket } from 'handsontable/core/hooks/bucket';

describe('Bucket', () => {
  describe('add()', () => {
    it('should add hook to the collection', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};

      bucket.add('beforeChange', fn2);
      bucket.add('afterChange', fn1);
      bucket.add('afterChange', fn2);

      expect(bucket.getHooks('beforeChange')).toEqual([
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
      ]);
      expect(bucket.getHooks('afterChange')).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
      ]);
    });

    it('should be possible to add hook to the collection that is not registered', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};

      bucket.add('test1', fn2);
      bucket.add('test2', fn1);
      bucket.add('test2', fn2);

      expect(bucket.getHooks('test1')).toEqual([
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
      ]);
      expect(bucket.getHooks('test2')).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
      ]);
    });

    it('should silently ignore adding the same function to the collection', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};

      bucket.add('afterChange', fn1);
      bucket.add('afterChange', fn1);
      bucket.add('afterChange', fn1);

      expect(bucket.getHooks('afterChange')).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
      ]);
    });

    it('should be possible to add hook with order', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};
      const fn3 = function() {};
      const fn4 = function() {};
      const fn5 = function() {};

      bucket.add('test', fn1, { orderIndex: 1 });

      expect(bucket.getHooks('test')).toEqual([
        { callback: fn1, orderIndex: 1, runOnce: false, initialHook: false, skip: false },
      ]);

      bucket.add('test', fn2);

      expect(bucket.getHooks('test')).toEqual([
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
        { callback: fn1, orderIndex: 1, runOnce: false, initialHook: false, skip: false },
      ]);

      bucket.add('test', fn3, { orderIndex: -10 });

      expect(bucket.getHooks('test')).toEqual([
        { callback: fn3, orderIndex: -10, runOnce: false, initialHook: false, skip: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
        { callback: fn1, orderIndex: 1, runOnce: false, initialHook: false, skip: false },
      ]);

      bucket.add('test', fn4, { orderIndex: -2 });

      expect(bucket.getHooks('test')).toEqual([
        { callback: fn3, orderIndex: -10, runOnce: false, initialHook: false, skip: false },
        { callback: fn4, orderIndex: -2, runOnce: false, initialHook: false, skip: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
        { callback: fn1, orderIndex: 1, runOnce: false, initialHook: false, skip: false },
      ]);

      bucket.add('test', fn5, { orderIndex: 0 });

      expect(bucket.getHooks('test')).toEqual([
        { callback: fn3, orderIndex: -10, runOnce: false, initialHook: false, skip: false },
        { callback: fn4, orderIndex: -2, runOnce: false, initialHook: false, skip: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
        { callback: fn5, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
        { callback: fn1, orderIndex: 1, runOnce: false, initialHook: false, skip: false },
      ]);
    });

    it('should be possible to add initial hook (hook that once added stays at the same index after update)', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};
      const fn3 = function() {};
      const fn4 = function() {};

      bucket.add('test', fn1, { initialHook: true });

      expect(bucket.getHooks('test')).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: true, skip: false },
      ]);

      bucket.add('test', fn2);

      expect(bucket.getHooks('test')).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: true, skip: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
      ]);

      bucket.add('test', fn3, { initialHook: true });

      expect(bucket.getHooks('test')).toEqual([
        { callback: fn3, orderIndex: 0, runOnce: false, initialHook: true, skip: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
      ]);

      bucket.add('test', fn4);

      expect(bucket.getHooks('test')).toEqual([
        { callback: fn3, orderIndex: 0, runOnce: false, initialHook: true, skip: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
        { callback: fn4, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
      ]);
    });

    it('should be possible to add hook once', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};
      const fn3 = function() {};
      const fn4 = function() {};

      bucket.add('test', fn1);

      expect(bucket.getHooks('test')).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
      ]);

      bucket.add('test', fn2, { runOnce: true });

      expect(bucket.getHooks('test')).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
        { callback: fn2, orderIndex: 0, runOnce: true, initialHook: false, skip: false },
      ]);

      bucket.add('test', fn3, { runOnce: false });

      expect(bucket.getHooks('test')).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
        { callback: fn2, orderIndex: 0, runOnce: true, initialHook: false, skip: false },
        { callback: fn3, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
      ]);

      bucket.add('test', fn4, { runOnce: true });

      expect(bucket.getHooks('test')).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
        { callback: fn2, orderIndex: 0, runOnce: true, initialHook: false, skip: false },
        { callback: fn3, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
        { callback: fn4, orderIndex: 0, runOnce: true, initialHook: false, skip: false },
      ]);
    });
  });

  describe('has()', () => {
    it('should return `true` for hook name that has some callbacks in the collection', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};

      bucket.add('afterChange', fn1);

      expect(bucket.has('afterChange')).toBe(true);
    });

    it('should return `false` for an empty hooks collection', () => {
      const bucket = new HooksBucket();

      expect(bucket.has('afterChange')).toBe(false);
      expect(bucket.has('test')).toBe(false);
    });
  });

  describe('remove()', () => {
    it('should not remove any hooks and return `false` when the collection does not exist', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};

      bucket.add('afterChange', fn1);

      expect(bucket.remove('test')).toBe(false);
      expect(bucket.getHooks('afterChange')).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
      ]);
    });

    it('should not remove any hook and return `false` when the callback does not exist in the collection', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};

      bucket.add('afterChange', fn1);

      expect(bucket.remove('afterChange', fn2)).toBe(false);
      expect(bucket.getHooks('afterChange')).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
      ]);
    });

    it('should remove hook and return `true` when the callback does exist in the collection', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};
      const fn3 = function() {};

      bucket.add('afterChange', fn1);
      bucket.add('afterChange', fn2);
      bucket.add('afterChange', fn3);

      expect(bucket.remove('afterChange', fn2)).toBe(true);
      expect(bucket.getHooks('afterChange')).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false, skip: true },
        { callback: fn3, orderIndex: 0, runOnce: false, initialHook: false, skip: false },
      ]);
    });

    it('should remove skipped hook entries from the collection after reaching the limit', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};
      const fn3 = function() {};

      for (let i = 0; i < 99; i++) {
        const fnMock = function() {};

        bucket.add('afterChange', fnMock);
        bucket.remove('afterChange', fnMock);
      }

      bucket.add('afterChange', fn1);

      expect(bucket.remove('afterChange', fn1)).toBe(true);
      expect(bucket.getHooks('afterChange').length).toBe(100);

      bucket.add('afterChange', fn2);

      expect(bucket.remove('afterChange', fn2)).toBe(true);
      expect(bucket.getHooks('afterChange').length).toBe(0);

      bucket.add('afterChange', fn3);

      expect(bucket.remove('afterChange', fn3)).toBe(true);
      expect(bucket.getHooks('afterChange').length).toBe(1);
    });
  });
});
