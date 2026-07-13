import LazyFactoryMap from '../lazyFactoryMap';

/**
 *
 */
function createLazyFactoryMap(valueFactory) {
  if (!valueFactory) {
    valueFactory = key => ({ i: key });
  }

  return new LazyFactoryMap(valueFactory);
}

describe('LazyFactoryMap', () => {
  describe('obtain()', () => {
    it('should lazily create a value through the factory only on first access', () => {
      const spyValueFactory = jest.fn(key => ({ i: key }));
      const map = createLazyFactoryMap(spyValueFactory);

      expect(spyValueFactory).not.toHaveBeenCalled();

      const value = map.obtain(3);

      expect(value).toEqual({ i: 3 });
      expect(spyValueFactory).toHaveBeenCalledTimes(1);
      expect(spyValueFactory).toHaveBeenCalledWith(3);
    });

    it('should call the factory with the current key', () => {
      const spyValueFactory = jest.fn(key => ({ i: key }));
      const map = createLazyFactoryMap(spyValueFactory);

      map.obtain(0);
      map.obtain(10);
      map.obtain(999990);

      expect(spyValueFactory).toHaveBeenNthCalledWith(1, 0);
      expect(spyValueFactory).toHaveBeenNthCalledWith(2, 10);
      expect(spyValueFactory).toHaveBeenNthCalledWith(3, 999990);
    });

    it('should return a stable identity across repeated calls (no re-minting)', () => {
      const spyValueFactory = jest.fn(key => ({ i: key }));
      const map = createLazyFactoryMap(spyValueFactory);

      const first = map.obtain(5);
      const second = map.obtain(5);

      expect(first).toBe(second);
      expect(spyValueFactory).toHaveBeenCalledTimes(1);
    });

    it('should not call the factory again for an already created value', () => {
      const spyValueFactory = jest.fn(key => ({ i: key }));
      const map = createLazyFactoryMap(spyValueFactory);

      map.obtain(3);
      map.obtain(10);
      map.obtain(3);
      map.obtain(10);

      expect(spyValueFactory).toHaveBeenCalledTimes(2);
    });

    it('should throw for a negative key', () => {
      const map = createLazyFactoryMap();

      expect(() => map.obtain(-1)).toThrowError('Assertion failed: Expecting an unsigned number.');
    });

    it('should throw for a non-numeric key', () => {
      const map = createLazyFactoryMap();

      expect(() => map.obtain('3')).toThrowError('Assertion failed: Expecting an unsigned number.');
      expect(() => map.obtain(null)).toThrowError('Assertion failed: Expecting an unsigned number.');
      expect(() => map.obtain(undefined)).toThrowError('Assertion failed: Expecting an unsigned number.');
      expect(() => map.obtain(1.5)).toThrowError('Assertion failed: Expecting an unsigned number.');
    });

    it('should support a far-away key without extra materialization', () => {
      const map = createLazyFactoryMap();

      expect(map.obtain(999990)).toEqual({ i: 999990 });
      expect(map.size()).toBe(1);
      expect(map.has(999990)).toBe(true);
    });
  });

  describe('has()', () => {
    it('should return false for keys that were never obtained, without creating them', () => {
      const spyValueFactory = jest.fn(key => ({ i: key }));
      const map = createLazyFactoryMap(spyValueFactory);

      expect(map.has(0)).toBe(false);
      expect(map.has(5)).toBe(false);
      expect(map.has(999)).toBe(false);
      expect(spyValueFactory).not.toHaveBeenCalled();
    });

    it('should return true only for keys that were already obtained', () => {
      const map = createLazyFactoryMap();

      map.obtain(3);
      map.obtain(10);

      expect(map.has(3)).toBe(true);
      expect(map.has(10)).toBe(true);
      expect(map.has(0)).toBe(false);
      expect(map.has(4)).toBe(false);
    });

    it('should return false for a reserved-but-not-yet-created slot (insert)', () => {
      const spyValueFactory = jest.fn(key => ({ i: key }));
      const map = createLazyFactoryMap(spyValueFactory);

      map.obtain(0);
      map.insert(1, 2); // reserve 2 slots at key 1 without materializing them

      expect(map.has(0)).toBe(true);
      expect(map.has(1)).toBe(false);
      expect(map.has(2)).toBe(false);
      expect(spyValueFactory).toHaveBeenCalledTimes(1); // only obtain(0)
    });
  });

  describe('getIfExists()', () => {
    it('should return the materialized value without calling the factory', () => {
      const spyValueFactory = jest.fn(key => ({ i: key }));
      const map = createLazyFactoryMap(spyValueFactory);

      const value = map.obtain(3);

      spyValueFactory.mockClear();

      expect(map.getIfExists(3)).toBe(value);
      expect(spyValueFactory).not.toHaveBeenCalled();
    });

    it('should return undefined for a key that was never obtained, without materializing it', () => {
      const spyValueFactory = jest.fn(key => ({ i: key }));
      const map = createLazyFactoryMap(spyValueFactory);

      expect(map.getIfExists(3)).toBeUndefined();
      expect(map.has(3)).toBe(false);
      expect(spyValueFactory).not.toHaveBeenCalled();
    });
  });

  describe('insert()', () => {
    it('should shift materialized keys at or after the insertion point up by the amount', () => {
      const map = createLazyFactoryMap();

      const value10 = map.obtain(10);
      const value11 = map.obtain(11);
      const value12 = map.obtain(12);
      const value13 = map.obtain(13);

      map.insert(0, 2);

      // The `{ i: 10 }` item is now accessible under key 12 (same identity).
      expect(map.getIfExists(12)).toBe(value10);
      expect(map.getIfExists(13)).toBe(value11);
      expect(map.getIfExists(14)).toBe(value12);
      expect(map.getIfExists(15)).toBe(value13);
      expect(map.has(10)).toBe(false);
      expect(map.has(11)).toBe(false);
    });

    it('should not shift keys below the insertion point', () => {
      const map = createLazyFactoryMap();

      const value0 = map.obtain(0);

      map.obtain(1);
      map.obtain(2);
      map.obtain(3);

      map.insert(1, 3);

      // Key 0 is below the insertion point, so it stays put with the same identity.
      expect(map.getIfExists(0)).toBe(value0);
      // Keys 1..3 shifted up to 4..6.
      expect(map.has(1)).toBe(false);
      expect(map.has(2)).toBe(false);
      expect(map.has(3)).toBe(false);
      expect(map.has(4)).toBe(true);
      expect(map.has(5)).toBe(true);
      expect(map.has(6)).toBe(true);
    });

    it('should keep the reserved slots unmaterialized, refilling them lazily on obtain', () => {
      const map = createLazyFactoryMap();

      const value1 = map.obtain(1);

      map.insert(1, 3);

      // The old value moved to key 4; keys 1..3 are fresh, empty slots.
      expect(map.has(1)).toBe(false);
      expect(map.getIfExists(4)).toBe(value1);

      // Obtaining a reserved slot mints a fresh value with the current key.
      expect(map.obtain(1)).toEqual({ i: 1 });
      expect(map.getIfExists(4)).toBe(value1);
    });

    it('should append at the logical end when the key is null/undefined', () => {
      const map = createLazyFactoryMap();

      const value0 = map.obtain(0);
      const value1 = map.obtain(1);
      const value2 = map.obtain(2);

      map.insert(null); // append one slot at the current logical end (index 3)

      // The already-materialized keys are untouched.
      expect(map.getIfExists(0)).toBe(value0);
      expect(map.getIfExists(1)).toBe(value1);
      expect(map.getIfExists(2)).toBe(value2);

      // Obtaining the appended slot mints a fresh value.
      expect(map.has(3)).toBe(false);
      expect(map.obtain(3)).toEqual({ i: 3 });
    });

    it('should append with an explicit amount when the key is null/undefined', () => {
      const map = createLazyFactoryMap();

      map.obtain(0);
      map.obtain(1);

      map.insert(null, 5); // reserve 5 slots at the end (indexes 2..6)

      expect(map.obtain(2)).toEqual({ i: 2 });
      expect(map.obtain(6)).toEqual({ i: 6 });
    });

    it('should not throw and should still grow the logical length when nothing is materialized', () => {
      const map = createLazyFactoryMap();

      expect(() => map.insert(0, 2)).not.toThrow();
      expect(map.size()).toBe(0);

      // The reserved slots are obtainable afterwards.
      expect(map.obtain(0)).toEqual({ i: 0 });
      expect(map.obtain(1)).toEqual({ i: 1 });
    });

    it('should throw for an invalid non-nullish key', () => {
      const map = createLazyFactoryMap();

      expect(() => map.insert(-1))
        .toThrowError('Assertion failed: Expecting an unsigned number or null/undefined argument.');
      expect(() => map.insert('1'))
        .toThrowError('Assertion failed: Expecting an unsigned number or null/undefined argument.');
      expect(() => map.insert(1.5))
        .toThrowError('Assertion failed: Expecting an unsigned number or null/undefined argument.');
    });
  });

  describe('remove()', () => {
    it('should drop values in the removed range and shift higher keys down', () => {
      const map = createLazyFactoryMap();

      const value10 = map.obtain(10);
      const value11 = map.obtain(11);
      const value12 = map.obtain(12);
      const value13 = map.obtain(13);

      map.remove(0, 2);

      // The `{ i: 10 }` item is now accessible under key 8 (same identity).
      expect(map.getIfExists(8)).toBe(value10);
      expect(map.getIfExists(9)).toBe(value11);
      expect(map.getIfExists(10)).toBe(value12);
      expect(map.getIfExists(11)).toBe(value13);
    });

    it('should drop the values that fall inside the removed range', () => {
      const map = createLazyFactoryMap();

      const value10 = map.obtain(10);

      map.obtain(11);
      map.obtain(12);
      const value13 = map.obtain(13);

      map.remove(11, 2); // drop keys 11 and 12

      expect(map.getIfExists(10)).toBe(value10);
      // Key 13 shifted down to 11 (same identity).
      expect(map.getIfExists(11)).toBe(value13);
      expect(map.size()).toBe(2);
    });

    it('should not throw and should still shrink the logical length when nothing is materialized', () => {
      const map = createLazyFactoryMap();

      expect(() => map.remove(0, 2)).not.toThrow();
      expect(() => map.remove(4, 5)).not.toThrow();
      expect(() => map.remove(100)).not.toThrow();
      expect(map.size()).toBe(0);
    });

    it('should remove the last `amount` logical slots when the key is null/undefined', () => {
      const map = createLazyFactoryMap();

      const value0 = map.obtain(0);
      const value1 = map.obtain(1);

      map.obtain(2);

      map.remove(null); // remove the last slot (key 2)

      expect(map.has(2)).toBe(false);
      expect(map.getIfExists(0)).toBe(value0);
      expect(map.getIfExists(1)).toBe(value1);
      expect(map.size()).toBe(2);
    });

    it('should remove several slots from the end when the key is null/undefined', () => {
      const map = createLazyFactoryMap();

      const value0 = map.obtain(0);

      map.obtain(1);
      map.obtain(2);

      map.remove(null, 2); // remove the last 2 slots (keys 1 and 2)

      expect(map.getIfExists(0)).toBe(value0);
      expect(map.has(1)).toBe(false);
      expect(map.has(2)).toBe(false);
      expect(map.size()).toBe(1);
    });

    it('should reproduce Array.prototype.splice negative-start semantics when amount exceeds logical length', () => {
      const map = createLazyFactoryMap();

      const value0 = map.obtain(0); // logical length becomes 3 after the three obtains
      const value1 = map.obtain(1);

      map.obtain(2);

      // length - amount = 3 - 5 = -2, clamped like splice to start index 3 + (-2) = 1.
      map.remove(null, 5);

      // Key 0 survives with its original identity; keys 1 and 2 are dropped.
      expect(map.getIfExists(0)).toBe(value0);
      expect(map.getIfExists(0)).not.toBe(value1);
      expect(map.has(1)).toBe(false);
      expect(map.has(2)).toBe(false);
      expect(map.size()).toBe(1);
    });

    it('should throw for an invalid non-nullish key', () => {
      const map = createLazyFactoryMap();

      expect(() => map.remove(-1))
        .toThrowError('Assertion failed: Expecting an unsigned number or null/undefined argument.');
      expect(() => map.remove('1'))
        .toThrowError('Assertion failed: Expecting an unsigned number or null/undefined argument.');
      expect(() => map.remove(1.5))
        .toThrowError('Assertion failed: Expecting an unsigned number or null/undefined argument.');
    });

    it('should remove a far-away key from the end', () => {
      const map = createLazyFactoryMap();

      map.obtain(999990);

      expect(map.has(999990)).toBe(true);

      map.remove(null, 1);

      expect(map.has(999990)).toBe(false);
      expect(map.size()).toBe(0);
    });
  });

  describe('evict()', () => {
    it('should release the value without shifting neighbors, re-minting a new identity on next obtain', () => {
      const spyValueFactory = jest.fn(key => ({ i: key }));
      const map = createLazyFactoryMap(spyValueFactory);

      const value3 = map.obtain(3);
      const value10 = map.obtain(10);

      expect(spyValueFactory).toHaveBeenCalledTimes(2);

      map.evict(3);

      // The value is released and `has` reports it gone.
      expect(map.has(3)).toBe(false);
      // Neighbors keep their identity (no key shifts).
      expect(map.getIfExists(10)).toBe(value10);

      // The next obtain re-mints the value with a NEW identity.
      const reminted = map.obtain(3);

      expect(reminted).toEqual({ i: 3 });
      expect(reminted).not.toBe(value3);
      expect(spyValueFactory).toHaveBeenCalledTimes(3);
    });

    it('should not call the factory again for a key that was not evicted', () => {
      const spyValueFactory = jest.fn(key => ({ i: key }));
      const map = createLazyFactoryMap(spyValueFactory);

      map.obtain(3);
      map.obtain(10);
      map.evict(3);

      map.obtain(10);

      expect(spyValueFactory).toHaveBeenCalledTimes(2);
    });

    it('should be a no-op for a key with no materialized value', () => {
      const spyValueFactory = jest.fn(key => ({ i: key }));
      const map = createLazyFactoryMap(spyValueFactory);

      const value3 = map.obtain(3);

      expect(() => map.evict(99)).not.toThrow();
      expect(map.getIfExists(3)).toBe(value3);
      expect(map.size()).toBe(1);
    });

    it('should skip the evicted value when iterating values/entries', () => {
      const map = createLazyFactoryMap();

      map.obtain(0);
      map.obtain(1);
      map.obtain(2);

      map.evict(1);

      expect(Array.from(map.values())).toEqual([{ i: 0 }, { i: 2 }]);
      expect(Array.from(map)).toEqual([[0, { i: 0 }], [2, { i: 2 }]]);
    });
  });

  describe('size()', () => {
    it('should return the number of materialized values', () => {
      const map = createLazyFactoryMap(index => index);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      expect(map.size()).toBe(5);
    });

    it('should count only materialized values, not reserved slots', () => {
      const map = createLazyFactoryMap();

      map.insert(0, 5); // reserve 5 slots without obtaining any

      expect(map.size()).toBe(0);

      map.obtain(2);

      expect(map.size()).toBe(1);
    });

    it('should decrement on evict', () => {
      const map = createLazyFactoryMap();

      map.obtain(0);
      map.obtain(1);
      map.obtain(2);

      expect(map.size()).toBe(3);

      map.evict(1);

      expect(map.size()).toBe(2);
    });

    it('should decrement on remove', () => {
      const map = createLazyFactoryMap(index => index);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      map.remove(10, 2); // drop keys 10 and 11
      map.remove(null); // drop the last slot

      expect(map.size()).toBe(2);
    });
  });

  describe('values()', () => {
    it('should iterate values in order of initialization', () => {
      const map = createLazyFactoryMap(index => index);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      expect(Array.from(map.values())).toEqual([10, 11, 90, 12, 13]);
    });

    it('should preserve initialization order across insert key shifts', () => {
      const map = createLazyFactoryMap(index => index);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);

      map.insert(0, 5); // shifts every key up, order stays the same

      expect(Array.from(map.values())).toEqual([10, 11, 90]);
    });

    it('should preserve initialization order across remove key shifts', () => {
      const map = createLazyFactoryMap(index => index);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      map.remove(10, 2); // drop the first two, order of survivors preserved
      map.remove(null); // drop the last logical slot (the shifted key 88, value 90)

      expect(Array.from(map.values())).toEqual([12, 13]);
    });

    it('should skip reserved-but-not-obtained slots', () => {
      const map = createLazyFactoryMap(index => index / 2);

      map.obtain(10);
      map.obtain(11);

      map.insert(null); // reserve one more slot, never obtained

      expect(Array.from(map.values())).toEqual([5, 5.5]);
    });
  });

  describe('entries()', () => {
    it('should yield [currentKey, value] pairs in order of initialization', () => {
      const map = createLazyFactoryMap(index => index / 2);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      expect(Array.from(map.entries())).toEqual([[10, 5], [11, 5.5], [90, 45], [12, 6], [13, 6.5]]);
    });

    it('should yield shifted keys after insert while keeping the values intact', () => {
      const map = createLazyFactoryMap(index => index / 2);

      map.obtain(10);
      map.obtain(11);

      map.insert(0, 2); // keys shift up by 2, values unchanged

      expect(Array.from(map.entries())).toEqual([[12, 5], [13, 5.5]]);
    });

    it('should yield shifted keys after remove while keeping the values intact', () => {
      const map = createLazyFactoryMap(index => index / 2);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      map.remove(10, 2); // drop first two, shift the rest down by 2
      map.remove(null); // drop the highest logical slot (the shifted key 88, value 45)

      // Physical key changed but data value stays intact.
      expect(Array.from(map.entries())).toEqual([[10, 6], [11, 6.5]]);
    });

    it('should keep visiting the remaining entries when the currently visited key is evicted mid-iteration', () => {
      const map = createLazyFactoryMap();

      map.obtain(0);
      map.obtain(1);
      map.obtain(2);

      const visited = [];

      // Mirrors CellMeta.evictRow: releasing the current key while iterating must be safe.
      for (const [key, value] of map.entries()) {
        visited.push([key, value]);
        map.evict(key);
      }

      expect(visited).toEqual([[0, { i: 0 }], [1, { i: 1 }], [2, { i: 2 }]]);
      expect(map.size()).toBe(0);
    });
  });

  describe('Iterator protocol', () => {
    it('should iterate [index, value] pairs through Symbol.iterator', () => {
      const map = createLazyFactoryMap(index => index / 2);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      expect(Array.from(map)).toEqual([[10, 5], [11, 5.5], [90, 45], [12, 6], [13, 6.5]]);
    });

    it('should reflect shifted keys after remove', () => {
      const map = createLazyFactoryMap(index => index / 2);

      map.obtain(10);
      map.obtain(11);
      map.obtain(90);
      map.obtain(12);
      map.obtain(13);

      map.remove(10, 2);
      map.remove(null);

      expect(Array.from(map)).toEqual([[10, 6], [11, 6.5]]);
    });

    it('should skip reserved-but-not-obtained slots', () => {
      const map = createLazyFactoryMap(index => index / 2);

      map.obtain(10);
      map.obtain(11);

      map.insert(null);

      expect(Array.from(map)).toEqual([[10, 5], [11, 5.5]]);
    });
  });

  describe('clear()', () => {
    it('should empty every materialized value', () => {
      const map = createLazyFactoryMap();

      map.obtain(0);
      map.obtain(1);
      map.obtain(2);

      map.clear();

      expect(map.size()).toBe(0);
      expect(map.has(0)).toBe(false);
      expect(Array.from(map.values())).toEqual([]);
    });

    it('should reset the logical length so insert(null) appends at key 0 again', () => {
      const map = createLazyFactoryMap();

      map.obtain(0);
      map.obtain(1);
      map.obtain(2);

      map.clear();

      map.insert(null); // append at the reset logical end (index 0)

      expect(map.has(0)).toBe(false);
      expect(map.obtain(0)).toEqual({ i: 0 });
    });
  });

  describe('batched insert/remove (shifts buffered until the next read)', () => {
    it('should apply a run of single-slot removes as one consistent shift', () => {
      const map = createLazyFactoryMap();
      const values = [];

      for (let i = 0; i < 10; i++) {
        values.push(map.obtain(i));
      }

      // mirrors DataMap.removeRow: one remove(key, 1) call per removed physical row
      map.remove(1, 1);
      map.remove(1, 1);
      map.remove(1, 1);

      expect(map.size()).toBe(7);
      expect(map.obtain(0)).toBe(values[0]);
      expect(map.obtain(1)).toBe(values[4]);
      expect(map.obtain(6)).toBe(values[9]);
      expect(map.has(7)).toBe(false);
    });

    it('should apply interleaved inserts and removes in call order', () => {
      const map = createLazyFactoryMap();
      const a = map.obtain(0);
      const b = map.obtain(1);
      const c = map.obtain(2);

      map.insert(1, 2); // a, _, _, b, c
      map.remove(0, 1); // _, _, b, c
      map.insert(0, 1); // _, _, _, b, c

      expect(map.has(0)).toBe(false);
      expect(map.has(1)).toBe(false);
      expect(map.has(2)).toBe(false);
      expect(map.obtain(3)).toBe(b);
      expect(map.obtain(4)).toBe(c);
      expect(a).toEqual({ i: 0 }); // dropped from the map, caller-held reference intact
    });

    it('should preserve initialization order across a batched run of shifts', () => {
      const map = createLazyFactoryMap();

      map.obtain(5);
      map.obtain(0);
      map.obtain(9);

      map.insert(1, 1);
      map.remove(7, 1);
      map.insert(0, 3);

      expect(Array.from(map.values())).toEqual([{ i: 5 }, { i: 0 }, { i: 9 }]);
    });

    it('should stay correct when the buffered shifts exceed the internal flush backstop', () => {
      const map = createLazyFactoryMap();
      const kept = map.obtain(0);
      const moved = map.obtain(1);

      for (let i = 0; i < 2000; i++) {
        map.insert(1, 1);
      }

      expect(map.obtain(0)).toBe(kept);
      expect(map.obtain(2001)).toBe(moved);
      expect(map.size()).toBe(2);
    });

    it('should not resurrect values removed within a batch', () => {
      const map = createLazyFactoryMap();

      map.obtain(0);
      map.obtain(1);
      map.obtain(2);

      map.remove(0, 3);
      map.insert(0, 3);

      expect(map.size()).toBe(0);
      expect(map.has(0)).toBe(false);
      expect(map.has(1)).toBe(false);
      expect(map.has(2)).toBe(false);
    });
  });
});
