import { PositionCache } from '../../../src/utils/positionCache';

/**
 * Helper to create a PositionCache with mutable config functions.
 *
 * @param {number} totalItems The total number of items.
 * @param {Function} sizeFn A function that returns the size for a given index.
 * @param {number} defaultSize The default size.
 * @returns {object} An object with `cache` and setters to swap config at runtime.
 */
function createCache(totalItems, sizeFn, defaultSize) {
  let _totalItems = totalItems;
  let _sizeFn = sizeFn;
  let _defaultSize = defaultSize;

  const cache = new PositionCache({
    totalItemsFn: () => _totalItems,
    sizeFn: i => _sizeFn(i),
    defaultSizeFn: () => _defaultSize,
  });

  return {
    cache,
    setTotalItems(n) { _totalItems = n; },
    setSizeFn(fn) { _sizeFn = fn; },
    setDefaultSize(v) { _defaultSize = v; },
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
});
