import { HooksBucket } from 'handsontable/core/hooks/bucket';

// The entries are intrusive linked-list nodes (they carry a `next` pointer). Project the comparable
// fields so `toEqual` does not walk the `next` chain.
const shape = hookEntry => ({
  callback: hookEntry.callback,
  orderIndex: hookEntry.orderIndex,
  runOnce: hookEntry.runOnce,
  initialHook: hookEntry.initialHook,
});
const shapes = hooks => hooks.map(shape);

describe('Bucket', () => {
  describe('add()', () => {
    it('should add hook to the collection', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};

      bucket.add('beforeChange', fn2);
      bucket.add('afterChange', fn1);
      bucket.add('afterChange', fn2);

      expect(shapes(bucket.getHooks('beforeChange'))).toEqual([
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false },
      ]);
      expect(shapes(bucket.getHooks('afterChange'))).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false },
      ]);
    });

    it('should be possible to add hook to the collection that is not registered', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};

      bucket.add('test1', fn2);
      bucket.add('test2', fn1);
      bucket.add('test2', fn2);

      expect(shapes(bucket.getHooks('test1'))).toEqual([
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false },
      ]);
      expect(shapes(bucket.getHooks('test2'))).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false },
      ]);
    });

    it('should silently ignore adding the same function to the collection', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};

      bucket.add('afterChange', fn1);
      bucket.add('afterChange', fn1);
      bucket.add('afterChange', fn1);

      expect(shapes(bucket.getHooks('afterChange'))).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false },
      ]);
    });

    it('should fully remove a hook on remove and re-add it as a fresh entry (true delete, no skip flag)', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};

      bucket.add('afterChange', fn1);
      bucket.remove('afterChange', fn1);

      // true delete: the entry is gone, not soft-deleted
      expect(bucket.getHooks('afterChange')).toEqual([]);

      bucket.add('afterChange', fn1);

      expect(shapes(bucket.getHooks('afterChange'))).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false },
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

      expect(shapes(bucket.getHooks('test'))).toEqual([
        { callback: fn1, orderIndex: 1, runOnce: false, initialHook: false },
      ]);

      bucket.add('test', fn2);

      expect(shapes(bucket.getHooks('test'))).toEqual([
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn1, orderIndex: 1, runOnce: false, initialHook: false },
      ]);

      bucket.add('test', fn3, { orderIndex: -10 });

      expect(shapes(bucket.getHooks('test'))).toEqual([
        { callback: fn3, orderIndex: -10, runOnce: false, initialHook: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn1, orderIndex: 1, runOnce: false, initialHook: false },
      ]);

      bucket.add('test', fn4, { orderIndex: -2 });

      expect(shapes(bucket.getHooks('test'))).toEqual([
        { callback: fn3, orderIndex: -10, runOnce: false, initialHook: false },
        { callback: fn4, orderIndex: -2, runOnce: false, initialHook: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn1, orderIndex: 1, runOnce: false, initialHook: false },
      ]);

      bucket.add('test', fn5, { orderIndex: 0 });

      expect(shapes(bucket.getHooks('test'))).toEqual([
        { callback: fn3, orderIndex: -10, runOnce: false, initialHook: false },
        { callback: fn4, orderIndex: -2, runOnce: false, initialHook: false },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn5, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn1, orderIndex: 1, runOnce: false, initialHook: false },
      ]);
    });

    it('should be possible to add initial hook (hook that once added stays at the same index after update)', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};
      const fn3 = function() {};
      const fn4 = function() {};

      bucket.add('test', fn1, { initialHook: true });

      expect(shapes(bucket.getHooks('test'))).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: true },
      ]);

      bucket.add('test', fn2);

      expect(shapes(bucket.getHooks('test'))).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: true },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false },
      ]);

      bucket.add('test', fn3, { initialHook: true });

      expect(shapes(bucket.getHooks('test'))).toEqual([
        { callback: fn3, orderIndex: 0, runOnce: false, initialHook: true },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false },
      ]);

      bucket.add('test', fn4);

      expect(shapes(bucket.getHooks('test'))).toEqual([
        { callback: fn3, orderIndex: 0, runOnce: false, initialHook: true },
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn4, orderIndex: 0, runOnce: false, initialHook: false },
      ]);
    });

    it('should keep the same entry object when an initial hook callback is swapped (reference stability)', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};

      bucket.add('test', fn1, { initialHook: true });

      // Simulate a wrapper holding the array reference across an update.
      const held = bucket.getHooks('test');
      const entry = held[0];

      bucket.add('test', fn2, { initialHook: true });

      // Same entry object, callback swapped in place — the held reference reflects it.
      expect(bucket.getHooks('test')[0]).toBe(entry);
      expect(entry.callback).toBe(fn2);
      expect(held[0].callback).toBe(fn2);
    });

    it('should be possible to add hook once', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};
      const fn3 = function() {};
      const fn4 = function() {};

      bucket.add('test', fn1);

      expect(shapes(bucket.getHooks('test'))).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false },
      ]);

      bucket.add('test', fn2, { runOnce: true });

      expect(shapes(bucket.getHooks('test'))).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn2, orderIndex: 0, runOnce: true, initialHook: false },
      ]);

      bucket.add('test', fn3, { runOnce: false });

      expect(shapes(bucket.getHooks('test'))).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn2, orderIndex: 0, runOnce: true, initialHook: false },
        { callback: fn3, orderIndex: 0, runOnce: false, initialHook: false },
      ]);

      bucket.add('test', fn4, { runOnce: true });

      expect(shapes(bucket.getHooks('test'))).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn2, orderIndex: 0, runOnce: true, initialHook: false },
        { callback: fn3, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn4, orderIndex: 0, runOnce: true, initialHook: false },
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

    it('should return `false` after the last hook is removed', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};

      bucket.add('afterChange', fn1);
      bucket.remove('afterChange', fn1);

      expect(bucket.has('afterChange')).toBe(false);
    });
  });

  describe('remove()', () => {
    it('should not remove any hooks and return `false` when the collection does not exist', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};

      bucket.add('afterChange', fn1);

      expect(bucket.remove('test')).toBe(false);
      expect(shapes(bucket.getHooks('afterChange'))).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false },
      ]);
    });

    it('should not remove any hook and return `false` when the callback does not exist in the collection', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};

      bucket.add('afterChange', fn1);

      expect(bucket.remove('afterChange', fn2)).toBe(false);
      expect(shapes(bucket.getHooks('afterChange'))).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false },
      ]);
    });

    it('should remove the hook (true delete) and return `true` when the callback exists in the collection', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};
      const fn3 = function() {};

      bucket.add('afterChange', fn1);
      bucket.add('afterChange', fn2);
      bucket.add('afterChange', fn3);

      expect(bucket.remove('afterChange', fn2)).toBe(true);
      // fn2 is gone entirely (no soft-delete), fn1 and fn3 remain in order
      expect(shapes(bucket.getHooks('afterChange'))).toEqual([
        { callback: fn1, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn3, orderIndex: 0, runOnce: false, initialHook: false },
      ]);
    });

    it('should remove the head and the tail correctly', () => {
      const bucket = new HooksBucket();
      const fn1 = function() {};
      const fn2 = function() {};
      const fn3 = function() {};

      bucket.add('afterChange', fn1);
      bucket.add('afterChange', fn2);
      bucket.add('afterChange', fn3);

      bucket.remove('afterChange', fn1); // head
      bucket.remove('afterChange', fn3); // tail

      expect(shapes(bucket.getHooks('afterChange'))).toEqual([
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false },
      ]);

      // adding after removing the tail still appends correctly
      const fn4 = function() {};

      bucket.add('afterChange', fn4);

      expect(shapes(bucket.getHooks('afterChange'))).toEqual([
        { callback: fn2, orderIndex: 0, runOnce: false, initialHook: false },
        { callback: fn4, orderIndex: 0, runOnce: false, initialHook: false },
      ]);
    });

    it('should delete entries immediately without accumulating skipped slots', () => {
      const bucket = new HooksBucket();

      for (let i = 0; i < 150; i++) {
        const fnMock = function() {};

        bucket.add('afterChange', fnMock);
        bucket.remove('afterChange', fnMock);

        // every add/remove pair leaves the collection empty — no growth, no skipped entries
        expect(bucket.getHooks('afterChange').length).toBe(0);
      }
    });
  });
  describe('replaceFromSettings()', () => {
    const callbacks = (bucket, hookName) => bucket.getHooks(hookName).map(entry => entry.callback);

    it('swaps a function into the fixed settings entry in place', () => {
      const bucket = new HooksBucket();
      const settingsFn = function() {};
      const listener = function() {};
      const next = function() {};

      bucket.add('afterChange', settingsFn, { initialHook: true, fromSettings: true });
      bucket.add('afterChange', listener);
      bucket.replaceFromSettings('afterChange', next);

      expect(callbacks(bucket, 'afterChange')).toEqual([next, listener]);
    });

    it('removes the other settings entries when it sets a function', () => {
      const bucket = new HooksBucket();
      const arrayItem = function() {};
      const listener = function() {};
      const next = function() {};

      bucket.add('afterChange', arrayItem, { fromSettings: true });
      bucket.add('afterChange', listener);
      bucket.replaceFromSettings('afterChange', next);

      expect(callbacks(bucket, 'afterChange')).toEqual([listener, next]);
      expect(bucket.getHooks('afterChange')[1].initialHook).toBe(true);
    });

    it('keeps the settings entries an array names, in place, and removes the rest', () => {
      const bucket = new HooksBucket();
      const kept = function() {};
      const dropped = function() {};
      const fixed = function() {};
      const listener = function() {};
      const added = function() {};

      bucket.add('afterChange', fixed, { initialHook: true, fromSettings: true });
      bucket.add('afterChange', kept, { fromSettings: true });
      bucket.add('afterChange', listener);
      bucket.add('afterChange', dropped, { fromSettings: true });
      bucket.replaceFromSettings('afterChange', [kept, added]);

      expect(callbacks(bucket, 'afterChange')).toEqual([kept, listener, added]);
    });

    it('leaves a listener an `addHook()` call registered for the same function', () => {
      const bucket = new HooksBucket();
      const fn = function() {};
      const previous = function() {};

      bucket.add('afterChange', previous, { initialHook: true, fromSettings: true });
      bucket.add('afterChange', fn);
      bucket.replaceFromSettings('afterChange', fn);

      expect(callbacks(bucket, 'afterChange')).toEqual([fn]);
      expect(bucket.getHooks('afterChange')[0].fromSettings).toBe(false);
    });
  });

  describe('a function that forwards to a callback', () => {
    const FORWARDED_HOOK_CALLBACK = Symbol.for('handsontable.forwardedHookCallback');
    const forwardingTo = (callback: () => void) => Object.assign(() => callback(), {
      [FORWARDED_HOOK_CALLBACK]: callback,
    });

    it('should take the place of the callback it forwards to, not be added beside it', () => {
      const bucket = new HooksBucket();
      const callback = function() {};
      const forwarding = forwardingTo(callback);

      bucket.add('afterChange', callback);
      bucket.add('afterChange', forwarding, { initialHook: true, fromSettings: true });

      expect(bucket.getHooks('afterChange').map(entry => entry.callback)).toEqual([forwarding]);
      expect(bucket.getHooks('afterChange')[0].fromSettings).toBe(false);
    });

    it('should keep the forwarding function when the callback is added after it', () => {
      const bucket = new HooksBucket();
      const callback = function() {};
      const forwarding = forwardingTo(callback);

      bucket.add('afterChange', forwarding, { initialHook: true, fromSettings: true });
      bucket.add('afterChange', callback);

      expect(bucket.getHooks('afterChange').map(entry => entry.callback)).toEqual([forwarding]);
    });

    it('should be removed with the callback it forwards to', () => {
      const bucket = new HooksBucket();
      const callback = function() {};

      bucket.add('afterChange', forwardingTo(callback), { initialHook: true, fromSettings: true });

      expect(bucket.remove('afterChange', callback)).toBe(true);
      expect(bucket.getHooks('afterChange')).toEqual([]);
    });

    it('should count as the callback when the settings replace their callbacks', () => {
      const bucket = new HooksBucket();
      const callback = function() {};

      const forwarding = forwardingTo(callback);

      bucket.add('afterChange', callback);
      bucket.replaceFromSettings('afterChange', forwarding);

      expect(bucket.getHooks('afterChange').map(entry => entry.callback)).toEqual([forwarding]);
    });

    it('should leave no earlier settings function running when the settings pass one already added', () => {
      const bucket = new HooksBucket();
      const first = function() {};
      const second = function() {};

      bucket.add('afterChange', forwardingTo(first), { initialHook: true, fromSettings: true });
      bucket.add('afterChange', second);
      bucket.add('afterChange', forwardingTo(second), { initialHook: true, fromSettings: true });

      expect(bucket.getHooks('afterChange').map(entry => entry.callback === second || entry.identity === second))
        .toEqual([true]);
    });
  });

  describe('a settings function already added through `addHook()`', () => {
    it('should stop the earlier settings function', () => {
      const bucket = new HooksBucket();
      const first = function() {};
      const second = function() {};

      bucket.add('afterChange', first, { initialHook: true, fromSettings: true });
      bucket.add('afterChange', second);
      bucket.add('afterChange', second, { initialHook: true, fromSettings: true });

      expect(bucket.getHooks('afterChange').map(entry => entry.callback)).toEqual([second]);
    });
  });
});
