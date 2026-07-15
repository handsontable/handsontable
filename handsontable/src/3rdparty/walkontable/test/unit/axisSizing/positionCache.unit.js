import { PositionCache } from '../../../src/axisSizing/positionCache';

/**
 * Helper to create a PositionCache with mutable config functions.
 *
 * @param {number} totalItems The total number of items.
 * @param {Function} sizeFn A function that returns the size for a given index.
 * @param {number} defaultSize The default size.
 * @param {boolean|Function} [isUniformFn] Whether (or a predicate returning whether) all items share one size.
 * @returns {object} An object with `cache` and setters to swap config at runtime.
 */
function createCache(totalItems, sizeFn, defaultSize, isUniformFn) {
  let _totalItems = totalItems;
  let _sizeFn = sizeFn;
  let _defaultSize = defaultSize;
  let _isUniform = typeof isUniformFn === 'function' ? isUniformFn() : !!isUniformFn;

  const cache = new PositionCache({
    totalItemsFn: () => _totalItems,
    sizeFn: i => _sizeFn(i),
    defaultSizeFn: () => _defaultSize,
    isUniformFn: () => _isUniform,
  });

  return {
    cache,
    setTotalItems(n) { _totalItems = n; },
    setSizeFn(fn) { _sizeFn = fn; },
    setDefaultSize(v) { _defaultSize = v; },
    setUniform(v) { _isUniform = v; },
  };
}

describe('PositionCache', () => {
  describe('build', () => {
    it('should create a prefix sum array from the size function', () => {
      const { cache } = createCache(4, i => (i + 1) * 10, 0);

      cache.build();

      expect(cache.isBuilt()).toBe(true);
      expect(cache.totalItems).toBe(4);
      expect(cache.getOffset(0)).toBe(0);
      expect(cache.getOffset(1)).toBe(10);
      expect(cache.getOffset(2)).toBe(30);
      expect(cache.getOffset(3)).toBe(60);
      expect(cache.getTotalSize()).toBe(100);
    });

    it('should fall back to defaultSize when sizeFn returns NaN', () => {
      const { cache } = createCache(3, () => NaN, 25);

      cache.build();

      expect(cache.getSizeAt(0)).toBe(25);
      expect(cache.getSizeAt(1)).toBe(25);
      expect(cache.getSizeAt(2)).toBe(25);
      expect(cache.getTotalSize()).toBe(75);
    });
  });

  describe('getSizeAt', () => {
    it('should return the individual item size from prefix sum differences', () => {
      const sizes = [10, 20, 30, 40, 50];
      const { cache } = createCache(5, i => sizes[i], 0);

      cache.build();

      expect(cache.getSizeAt(0)).toBe(10);
      expect(cache.getSizeAt(1)).toBe(20);
      expect(cache.getSizeAt(2)).toBe(30);
      expect(cache.getSizeAt(3)).toBe(40);
      expect(cache.getSizeAt(4)).toBe(50);
    });

    it('should return 0 for out-of-bounds indices', () => {
      const { cache } = createCache(3, () => 10, 10);

      cache.build();

      expect(cache.getSizeAt(-1)).toBe(0);
      expect(cache.getSizeAt(3)).toBe(0);
      expect(cache.getSizeAt(100)).toBe(0);
    });

    it('should return 0 when cache is not built', () => {
      const { cache } = createCache(3, () => 10, 10);

      expect(cache.getSizeAt(0)).toBe(0);
    });

    it('should handle mixed valid and NaN sizes', () => {
      const { cache } = createCache(4, i => (i % 2 === 0 ? 15 : NaN), 20);

      cache.build();

      expect(cache.getSizeAt(0)).toBe(15);
      expect(cache.getSizeAt(1)).toBe(20);
      expect(cache.getSizeAt(2)).toBe(15);
      expect(cache.getSizeAt(3)).toBe(20);
    });
  });

  describe('ensureBuilt', () => {
    it('should build the cache when not yet built', () => {
      const sizeFn = jest.fn(() => 10);
      const { cache } = createCache(5, sizeFn, 10);

      cache.ensureBuilt();

      expect(cache.isBuilt()).toBe(true);
      expect(cache.totalItems).toBe(5);
      expect(sizeFn).toHaveBeenCalledTimes(5);
    });

    it('should not rebuild when already built with the same item count', () => {
      const sizeFn = jest.fn(() => 10);
      const { cache, setSizeFn } = createCache(5, sizeFn, 10);

      cache.ensureBuilt();

      expect(sizeFn).toHaveBeenCalledTimes(5);

      const sizeFn2 = jest.fn(() => 20);

      setSizeFn(sizeFn2);

      cache.ensureBuilt();

      expect(sizeFn2).not.toHaveBeenCalled();
      expect(cache.getSizeAt(0)).toBe(10);
    });

    it('should rebuild when item count changes', () => {
      const { cache, setTotalItems, setSizeFn, setDefaultSize } = createCache(3, () => 10, 10);

      cache.ensureBuilt();

      expect(cache.totalItems).toBe(3);

      setTotalItems(5);
      setSizeFn(() => 20);
      setDefaultSize(20);

      cache.ensureBuilt();

      expect(cache.totalItems).toBe(5);
      expect(cache.getSizeAt(0)).toBe(20);
    });

    it('should rebuild after invalidation', () => {
      const { cache, setSizeFn, setDefaultSize } = createCache(3, () => 10, 10);

      cache.ensureBuilt();
      cache.invalidate();

      expect(cache.isBuilt()).toBe(false);

      setSizeFn(() => 15);
      setDefaultSize(15);

      cache.ensureBuilt();

      expect(cache.isBuilt()).toBe(true);
      expect(cache.getSizeAt(0)).toBe(15);
    });
  });

  describe('findIndexAtOffset', () => {
    it('should binary-search to the correct index', () => {
      const { cache } = createCache(5, () => 20, 20);

      cache.build();

      expect(cache.findIndexAtOffset(0)).toBe(0);
      expect(cache.findIndexAtOffset(19)).toBe(0);
      expect(cache.findIndexAtOffset(20)).toBe(1);
      expect(cache.findIndexAtOffset(39)).toBe(1);
      expect(cache.findIndexAtOffset(40)).toBe(2);
      expect(cache.findIndexAtOffset(99)).toBe(4);
      expect(cache.findIndexAtOffset(100)).toBe(4);
    });

    it('should handle variable sizes', () => {
      const sizes = [10, 30, 20];
      const { cache } = createCache(3, i => sizes[i], 0);

      cache.build();

      expect(cache.findIndexAtOffset(5)).toBe(0);
      expect(cache.findIndexAtOffset(10)).toBe(1);
      expect(cache.findIndexAtOffset(39)).toBe(1);
      expect(cache.findIndexAtOffset(40)).toBe(2);
    });

    it('should return 0 when there are no items and offset is positive', () => {
      const { cache } = createCache(0, () => 10, 10);

      cache.build();

      expect(cache.totalItems).toBe(0);
      expect(cache.findIndexAtOffset(1)).toBe(0);
      expect(cache.findIndexAtOffset(100)).toBe(0);
    });
  });

  describe('invalidate', () => {
    it('should clear the cache', () => {
      const { cache } = createCache(3, () => 10, 10);

      cache.build();
      cache.invalidate();

      expect(cache.isBuilt()).toBe(false);
      expect(cache.totalItems).toBe(0);
      expect(cache.getSizeAt(0)).toBe(0);
      expect(cache.getOffset(1)).toBe(0);
      expect(cache.getTotalSize()).toBe(0);
    });

    it('should trigger a rebuild on the next ensureBuilt call', () => {
      const { cache, setSizeFn, setDefaultSize } = createCache(3, () => 10, 10);

      cache.ensureBuilt();

      expect(cache.getSizeAt(0)).toBe(10);

      cache.invalidate();

      const sizeFn = jest.fn(() => 25);

      setSizeFn(sizeFn);
      setDefaultSize(25);

      cache.ensureBuilt();

      expect(sizeFn).toHaveBeenCalledTimes(3);
      expect(cache.getSizeAt(0)).toBe(25);
    });

    it('should not trigger a rebuild if invalidate was not called', () => {
      const { cache, setSizeFn, setDefaultSize } = createCache(3, () => 10, 10);

      cache.ensureBuilt();

      const sizeFn = jest.fn(() => 25);

      setSizeFn(sizeFn);
      setDefaultSize(25);

      cache.ensureBuilt();

      expect(sizeFn).not.toHaveBeenCalled();
      expect(cache.getSizeAt(0)).toBe(10);
    });
  });

  describe('uniform mode', () => {
    it('should skip the prefix sum array when the uniform predicate is true', () => {
      const { cache } = createCache(1000, () => 20, 20, true);

      cache.build();

      expect(cache.prefixSum).toBe(null);
      expect(cache.totalItems).toBe(1000);
    });

    it('should not scan every item to build (only samples the last one)', () => {
      const sizeFn = jest.fn(() => 20);
      const { cache } = createCache(100000, sizeFn, 20, true);

      cache.build();

      // arithmetic mode reads a single representative size, never the full O(n) loop
      expect(sizeFn).toHaveBeenCalledTimes(1);
    });

    it('should compute offsets/sizes/total arithmetically and equal a full prefix-sum build', () => {
      const SIZE = 23;
      const COUNT = 5000;
      const uniform = createCache(COUNT, () => SIZE, SIZE, true).cache;
      const full = createCache(COUNT, () => SIZE, SIZE, false).cache;

      uniform.build();
      full.build();

      expect(uniform.prefixSum).toBe(null);
      expect(full.prefixSum).not.toBe(null);

      for (const i of [0, 1, 2, 1000, 2500, COUNT - 1, COUNT, COUNT + 10]) {
        expect(uniform.getOffset(i)).toBe(full.getOffset(i));
        expect(uniform.getSizeAt(i)).toBe(full.getSizeAt(i));
      }
      for (const off of [-5, 0, 1, 22, 23, 24, 100000, SIZE * COUNT, (SIZE * COUNT) + 50]) {
        expect(uniform.findIndexAtOffset(off)).toBe(full.findIndexAtOffset(off));
      }
      expect(uniform.getTotalSize()).toBe(full.getTotalSize());
      expect(uniform.getTotalSize()).toBe(SIZE * COUNT);
    });

    it('should sample the LAST item for the uniform size (avoids first-item border compensation)', () => {
      // index 0 is intentionally larger (mirrors the +1 first-rendered-row compensation);
      // a correct uniform cache must NOT propagate it to every row.
      const { cache } = createCache(10, i => (i === 0 ? 24 : 23), 23, true);

      cache.build();

      expect(cache.getSizeAt(0)).toBe(23);
      expect(cache.getOffset(10)).toBe(230);
      expect(cache.getTotalSize()).toBe(230);
    });

    it('should fall back to defaultSize when the sampled item returns NaN', () => {
      const { cache } = createCache(100, () => NaN, 18, true);

      cache.build();

      expect(cache.getSizeAt(0)).toBe(18);
      expect(cache.getTotalSize()).toBe(1800);
    });

    it('should treat uniform mode as built so ensureBuilt does not rebuild', () => {
      const sizeFn = jest.fn(() => 20);
      const { cache } = createCache(50, sizeFn, 20, true);

      cache.ensureBuilt();
      const callsAfterFirst = sizeFn.mock.calls.length;

      cache.ensureBuilt();

      expect(sizeFn.mock.calls.length).toBe(callsAfterFirst);
    });

    it('should rebuild as a full prefix sum after the predicate flips to false (e.g. an oversized row appears)', () => {
      const sizes = { 3: 50 };
      const { cache, setUniform } = createCache(10, i => sizes[i] ?? 20, 20, true);

      cache.build();
      expect(cache.prefixSum).toBe(null);
      expect(cache.getSizeAt(3)).toBe(20); // uniform: ignores the override

      // a per-row override appears → caller flips the predicate and invalidates
      setUniform(false);
      cache.invalidate();
      cache.ensureBuilt();

      expect(cache.prefixSum).not.toBe(null);
      expect(cache.getSizeAt(3)).toBe(50); // heterogeneous: honors the override
      expect(cache.getOffset(4)).toBe((20 * 3) + 50);
    });

    it('should clear uniform mode on invalidate', () => {
      const { cache } = createCache(100, () => 20, 20, true);

      cache.build();
      cache.invalidate();

      expect(cache.getSizeAt(0)).toBe(0);
      expect(cache.getOffset(5)).toBe(0);
      expect(cache.getTotalSize()).toBe(0);
    });
  });

  describe('onBuildFn', () => {
    it('should be called once per build, in both modes', () => {
      const onBuildFn = jest.fn();
      const heterogeneous = new PositionCache({
        totalItemsFn: () => 3,
        sizeFn: () => 10,
        defaultSizeFn: () => 10,
        onBuildFn,
      });

      heterogeneous.build();

      expect(onBuildFn).toHaveBeenCalledTimes(1);

      const onBuildFnUniform = jest.fn();
      const uniform = new PositionCache({
        totalItemsFn: () => 3,
        sizeFn: () => 10,
        defaultSizeFn: () => 10,
        isUniformFn: () => true,
        onBuildFn: onBuildFnUniform,
      });

      uniform.build();

      expect(onBuildFnUniform).toHaveBeenCalledTimes(1);
    });

    it('should be called by ensureBuilt only when it actually rebuilds', () => {
      const onBuildFn = jest.fn();
      let totalItems = 3;
      const cache = new PositionCache({
        totalItemsFn: () => totalItems,
        sizeFn: () => 10,
        defaultSizeFn: () => 10,
        onBuildFn,
      });

      cache.ensureBuilt();

      expect(onBuildFn).toHaveBeenCalledTimes(1);

      // no-op: already built, same item count
      cache.ensureBuilt();

      expect(onBuildFn).toHaveBeenCalledTimes(1);

      // rebuild via invalidation
      cache.invalidate();
      cache.ensureBuilt();

      expect(onBuildFn).toHaveBeenCalledTimes(2);

      // rebuild via item-count change
      totalItems = 5;
      cache.ensureBuilt();

      expect(onBuildFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('isCurrent', () => {
    it('should be false before the cache is built', () => {
      const { cache } = createCache(3, () => 10, 10);

      expect(cache.isCurrent()).toBe(false);
    });

    it('should be true after a heterogeneous build and false after invalidate', () => {
      const { cache } = createCache(3, i => (i + 1) * 10, 0);

      cache.build();

      expect(cache.isCurrent()).toBe(true);

      cache.invalidate();

      expect(cache.isCurrent()).toBe(false);
    });

    it('should be true in uniform mode even though isBuilt() (prefix-sum guard) is false', () => {
      const { cache } = createCache(1000, () => 20, 20, true);

      cache.build();

      // isBuilt() reports prefix-sum mode only, so it is false for a uniform cache...
      expect(cache.isBuilt()).toBe(false);
      // ...but the cache IS built and current — this is the distinction the single-pass skip relies on.
      expect(cache.isCurrent()).toBe(true);

      cache.invalidate();

      expect(cache.isCurrent()).toBe(false);
    });

    it('should become stale when the item count changes (mirrors ensureBuilt)', () => {
      const { cache, setTotalItems } = createCache(3, () => 10, 10);

      cache.build();

      expect(cache.isCurrent()).toBe(true);

      setTotalItems(5);

      expect(cache.isCurrent()).toBe(false);
    });
  });

  describe('sparse mode', () => {
    /**
     * Creates a cache whose sizes are a uniform base plus the given exception record —
     * the shape `sparseExceptionsFn` receives from `wtViewport.oversizedRows`.
     *
     * @param {number} totalItems The total number of items.
     * @param {number} base The uniform base size.
     * @param {object} exceptions Per-index size overrides.
     * @returns {object} An object with the `cache` and the mutable `exceptions` record.
     */
    function createSparseCache(totalItems, base, exceptions) {
      let _totalItems = totalItems;

      const cache = new PositionCache({
        totalItemsFn: () => _totalItems,
        sizeFn: i => (exceptions[i] === undefined ? base : exceptions[i]),
        defaultSizeFn: () => base,
        isUniformFn: () => Object.keys(exceptions).length === 0,
        sparseExceptionsFn: () => exceptions,
      });

      return { cache, exceptions, setTotalItems(n) { _totalItems = n; } };
    }

    it('should not allocate a prefix sum array (isBuilt stays false, like uniform mode)', () => {
      const { cache } = createSparseCache(1000, 10, { 5: 30 });

      cache.build();

      expect(cache.isBuilt()).toBe(false);
      expect(cache.isCurrent()).toBe(true);
      expect(cache.prefixSum).toBe(null);
    });

    it('should compute offsets as base * index plus the deltas of preceding exceptions', () => {
      const { cache } = createSparseCache(1000, 10, { 2: 35, 5: 50 });

      cache.build();

      expect(cache.getOffset(0)).toBe(0);
      expect(cache.getOffset(1)).toBe(10);
      expect(cache.getOffset(2)).toBe(20);
      expect(cache.getOffset(3)).toBe(55); // 30 + (35 - 10)
      expect(cache.getOffset(5)).toBe(75);
      expect(cache.getOffset(6)).toBe(125); // 75 + 50
      expect(cache.getOffset(1000)).toBe(10065);
      expect(cache.getOffset(2000)).toBe(10065); // clamped to totalItems
    });

    it('should produce byte-identical offsets to the full prefix-sum walk', () => {
      const exceptions = { 0: 41, 7: 23, 63: 120, 64: 121, 999: 77 };
      const sizeFn = i => (exceptions[i] === undefined ? 10 : exceptions[i]);
      const { cache: sparse } = createSparseCache(1000, 10, exceptions);
      const { cache: full } = createCache(1000, sizeFn, 10);

      sparse.build();
      full.build();

      for (let i = 0; i <= 1000; i += 1) {
        expect(sparse.getOffset(i)).toBe(full.getOffset(i));
      }
      expect(sparse.getTotalSize()).toBe(full.getTotalSize());
    });

    it('should return exception sizes from getSizeAt and the base for other items', () => {
      const { cache } = createSparseCache(100, 10, { 3: 42 });

      cache.build();

      expect(cache.getSizeAt(2)).toBe(10);
      expect(cache.getSizeAt(3)).toBe(42);
      expect(cache.getSizeAt(4)).toBe(10);
      expect(cache.getSizeAt(-1)).toBe(0);
      expect(cache.getSizeAt(100)).toBe(0);
    });

    it('should find indexes at offsets identically to the full prefix-sum walk', () => {
      const exceptions = { 1: 30, 50: 200, 51: 200 };
      const sizeFn = i => (exceptions[i] === undefined ? 10 : exceptions[i]);
      const { cache: sparse } = createSparseCache(100, 10, exceptions);
      const { cache: full } = createCache(100, sizeFn, 10);

      sparse.build();
      full.build();

      for (let offset = -5; offset <= 1500; offset += 7) {
        expect(sparse.findIndexAtOffset(offset)).toBe(full.findIndexAtOffset(offset));
      }
    });

    it('should skip wiped (undefined) records and records past the item count', () => {
      const { cache } = createSparseCache(10, 10, { 2: undefined, 5: 60, 50: 999 });

      cache.build();

      expect(cache.getSizeAt(2)).toBe(10);
      expect(cache.getSizeAt(5)).toBe(60);
      expect(cache.getTotalSize()).toBe(150); // 10 * 10 + (60 - 10)
    });

    it('should fall back to the default size when every item is an exception', () => {
      const { cache } = createSparseCache(2, 10, { 0: 30, 1: 40 });

      cache.build();

      expect(cache.getSizeAt(0)).toBe(30);
      expect(cache.getSizeAt(1)).toBe(40);
      expect(cache.getTotalSize()).toBe(70);
    });

    it('should rebuild into uniform mode when the exceptions empty out', () => {
      const { cache, exceptions } = createSparseCache(100, 10, { 5: 60 });

      cache.build();

      expect(cache.getTotalSize()).toBe(1050);

      delete exceptions[5];
      cache.invalidate();
      cache.build();

      expect(cache.getTotalSize()).toBe(1000);
      expect(cache.getSizeAt(5)).toBe(10);
    });

    it('should clear sparse state on invalidate', () => {
      const { cache } = createSparseCache(100, 10, { 5: 60 });

      cache.build();
      cache.invalidate();

      expect(cache.isCurrent()).toBe(false);
      expect(cache.getOffset(50)).toBe(0);
      expect(cache.getTotalSize()).toBe(0);
    });
  });
});
