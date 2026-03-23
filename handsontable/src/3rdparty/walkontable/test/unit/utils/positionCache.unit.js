import { PositionCache } from '../../../src/utils/positionCache';

describe('PositionCache', () => {
  describe('build', () => {
    it('should create a prefix sum array from the size function', () => {
      const cache = new PositionCache();

      cache.build(4, i => (i + 1) * 10, 0);

      expect(cache.isBuilt()).toBe(true);
      expect(cache.totalItems).toBe(4);
      expect(cache.getOffset(0)).toBe(0);
      expect(cache.getOffset(1)).toBe(10);
      expect(cache.getOffset(2)).toBe(30);
      expect(cache.getOffset(3)).toBe(60);
      expect(cache.getTotalSize()).toBe(100);
    });

    it('should fall back to defaultSize when sizeFn returns NaN', () => {
      const cache = new PositionCache();

      cache.build(3, () => NaN, 25);

      expect(cache.getSizeAt(0)).toBe(25);
      expect(cache.getSizeAt(1)).toBe(25);
      expect(cache.getSizeAt(2)).toBe(25);
      expect(cache.getTotalSize()).toBe(75);
    });
  });

  describe('getSizeAt', () => {
    it('should return the individual item size from prefix sum differences', () => {
      const cache = new PositionCache();
      const sizes = [10, 20, 30, 40, 50];

      cache.build(5, i => sizes[i], 0);

      expect(cache.getSizeAt(0)).toBe(10);
      expect(cache.getSizeAt(1)).toBe(20);
      expect(cache.getSizeAt(2)).toBe(30);
      expect(cache.getSizeAt(3)).toBe(40);
      expect(cache.getSizeAt(4)).toBe(50);
    });

    it('should return 0 for out-of-bounds indices', () => {
      const cache = new PositionCache();

      cache.build(3, () => 10, 10);

      expect(cache.getSizeAt(-1)).toBe(0);
      expect(cache.getSizeAt(3)).toBe(0);
      expect(cache.getSizeAt(100)).toBe(0);
    });

    it('should return 0 when cache is not built', () => {
      const cache = new PositionCache();

      expect(cache.getSizeAt(0)).toBe(0);
    });

    it('should handle mixed valid and NaN sizes', () => {
      const cache = new PositionCache();

      cache.build(4, i => (i % 2 === 0 ? 15 : NaN), 20);

      expect(cache.getSizeAt(0)).toBe(15);
      expect(cache.getSizeAt(1)).toBe(20);
      expect(cache.getSizeAt(2)).toBe(15);
      expect(cache.getSizeAt(3)).toBe(20);
    });
  });

  describe('ensureBuilt', () => {
    it('should build the cache when not yet built', () => {
      const cache = new PositionCache();
      const sizeFn = jest.fn(() => 10);

      cache.ensureBuilt(5, sizeFn, 10);

      expect(cache.isBuilt()).toBe(true);
      expect(cache.totalItems).toBe(5);
      expect(sizeFn).toHaveBeenCalledTimes(5);
    });

    it('should not rebuild when already built with the same item count', () => {
      const cache = new PositionCache();
      const sizeFn = jest.fn(() => 10);

      cache.ensureBuilt(5, sizeFn, 10);

      expect(sizeFn).toHaveBeenCalledTimes(5);

      const sizeFn2 = jest.fn(() => 20);

      cache.ensureBuilt(5, sizeFn2, 20);

      expect(sizeFn2).not.toHaveBeenCalled();
      expect(cache.getSizeAt(0)).toBe(10);
    });

    it('should rebuild when item count changes', () => {
      const cache = new PositionCache();

      cache.ensureBuilt(3, () => 10, 10);

      expect(cache.totalItems).toBe(3);

      cache.ensureBuilt(5, () => 20, 20);

      expect(cache.totalItems).toBe(5);
      expect(cache.getSizeAt(0)).toBe(20);
    });

    it('should rebuild after invalidation', () => {
      const cache = new PositionCache();

      cache.ensureBuilt(3, () => 10, 10);
      cache.invalidate();

      expect(cache.isBuilt()).toBe(false);

      cache.ensureBuilt(3, () => 15, 15);

      expect(cache.isBuilt()).toBe(true);
      expect(cache.getSizeAt(0)).toBe(15);
    });
  });

  describe('findIndexAtOffset', () => {
    it('should binary-search to the correct index', () => {
      const cache = new PositionCache();

      cache.build(5, () => 20, 20);

      expect(cache.findIndexAtOffset(0)).toBe(0);
      expect(cache.findIndexAtOffset(19)).toBe(0);
      expect(cache.findIndexAtOffset(20)).toBe(1);
      expect(cache.findIndexAtOffset(39)).toBe(1);
      expect(cache.findIndexAtOffset(40)).toBe(2);
      expect(cache.findIndexAtOffset(99)).toBe(4);
      expect(cache.findIndexAtOffset(100)).toBe(4);
    });

    it('should handle variable sizes', () => {
      const cache = new PositionCache();
      const sizes = [10, 30, 20];

      cache.build(3, i => sizes[i], 0);

      expect(cache.findIndexAtOffset(5)).toBe(0);
      expect(cache.findIndexAtOffset(10)).toBe(1);
      expect(cache.findIndexAtOffset(39)).toBe(1);
      expect(cache.findIndexAtOffset(40)).toBe(2);
    });
  });

  describe('markDirty', () => {
    it('should trigger a rebuild on the next ensureBuilt call', () => {
      const cache = new PositionCache();

      cache.ensureBuilt(3, () => 10, 10);

      expect(cache.getSizeAt(0)).toBe(10);

      cache.markDirty();

      // Cache is still readable while dirty (stale but usable)
      expect(cache.isBuilt()).toBe(true);
      expect(cache.getSizeAt(0)).toBe(10);

      const sizeFn = jest.fn(() => 25);

      cache.ensureBuilt(3, sizeFn, 25);

      // Should have rebuilt with the new sizeFn
      expect(sizeFn).toHaveBeenCalledTimes(3);
      expect(cache.getSizeAt(0)).toBe(25);
    });

    it('should not trigger a rebuild if markDirty was not called', () => {
      const cache = new PositionCache();

      cache.ensureBuilt(3, () => 10, 10);

      const sizeFn = jest.fn(() => 25);

      cache.ensureBuilt(3, sizeFn, 25);

      expect(sizeFn).not.toHaveBeenCalled();
      expect(cache.getSizeAt(0)).toBe(10);
    });

    it('should clear the dirty flag after rebuild', () => {
      const cache = new PositionCache();

      cache.ensureBuilt(3, () => 10, 10);
      cache.markDirty();
      cache.ensureBuilt(3, () => 20, 20);

      // Second ensureBuilt should not rebuild (dirty was cleared)
      const sizeFn = jest.fn(() => 30);

      cache.ensureBuilt(3, sizeFn, 30);

      expect(sizeFn).not.toHaveBeenCalled();
      expect(cache.getSizeAt(0)).toBe(20);
    });
  });

  describe('invalidate', () => {
    it('should clear the cache', () => {
      const cache = new PositionCache();

      cache.build(3, () => 10, 10);
      cache.invalidate();

      expect(cache.isBuilt()).toBe(false);
      expect(cache.totalItems).toBe(0);
      expect(cache.getSizeAt(0)).toBe(0);
      expect(cache.getOffset(1)).toBe(0);
      expect(cache.getTotalSize()).toBe(0);
    });

    it('should clear the dirty flag', () => {
      const cache = new PositionCache();

      cache.ensureBuilt(3, () => 10, 10);
      cache.markDirty();
      cache.invalidate();

      // After invalidate + ensureBuilt, the dirty flag should not cause
      // an extra rebuild beyond the one triggered by !isBuilt()
      const sizeFn = jest.fn(() => 20);

      cache.ensureBuilt(3, sizeFn, 20);

      expect(sizeFn).toHaveBeenCalledTimes(3);

      const sizeFn2 = jest.fn(() => 30);

      cache.ensureBuilt(3, sizeFn2, 30);

      expect(sizeFn2).not.toHaveBeenCalled();
    });
  });
});
