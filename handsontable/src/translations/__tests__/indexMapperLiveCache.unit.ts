import { IndexMapper, TrimmingMap, HidingMap } from 'handsontable/translations';

describe('IndexMapper#runWithLiveCache', () => {
  /**
   * Builds a mapper of eight indexes and moves index 5 to the front while the operations are suspended, so
   * the caches still hold the identity order and the indexes sequence holds the moved one.
   *
   * @returns {IndexMapper} The mapper, with its operations suspended.
   */
  function createBatchedMapper() {
    const indexMapper = new IndexMapper();

    indexMapper.initToLength(8);
    indexMapper.suspendOperations();
    indexMapper.moveIndexes([5], 0);

    return indexMapper;
  }

  it('should translate by the live order inside the callback and by the cached one outside it', () => {
    const indexMapper = createBatchedMapper();

    expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(0);

    const inside = indexMapper.runWithLiveCache(() => ({
      physical: indexMapper.getPhysicalFromVisualIndex(0),
      visual: indexMapper.getVisualFromPhysicalIndex(5),
      renderable: indexMapper.getRenderableFromVisualIndex(0),
    }));

    expect(inside).toEqual({ physical: 5, visual: 0, renderable: 0 });
    expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(0);
    expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(5);
    expect(indexMapper.getNotTrimmedIndexes()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('should return what the callback returns', () => {
    const indexMapper = createBatchedMapper();

    expect(indexMapper.runWithLiveCache(() => 'result')).toBe('result');
  });

  it('should restore the caches when the callback throws', () => {
    const indexMapper = createBatchedMapper();

    expect(() => indexMapper.runWithLiveCache(() => {
      throw new Error('stop');
    })).toThrow('stop');

    expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(0);
    expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(5);
  });

  it('should leave the update at the end of the batch to see the previous order as the old one', () => {
    const indexMapper = createBatchedMapper();
    const beforeCacheUpdate = jest.fn(() => indexMapper.getPhysicalFromVisualIndex(0));
    const cacheUpdated = jest.fn();

    indexMapper.addLocalHook('beforeCacheUpdate', beforeCacheUpdate);
    indexMapper.addLocalHook('cacheUpdated', cacheUpdated);

    indexMapper.runWithLiveCache(() => indexMapper.getPhysicalFromVisualIndex(0));

    expect(beforeCacheUpdate).not.toHaveBeenCalled();
    expect(cacheUpdated).not.toHaveBeenCalled();
    expect(indexMapper.indexesSequenceChanged).toBe(true);

    indexMapper.resumeOperations();

    expect(beforeCacheUpdate).toHaveBeenCalledTimes(1);
    expect(beforeCacheUpdate).toHaveReturnedWith(0);
    expect(cacheUpdated).toHaveBeenCalledTimes(1);
    expect(cacheUpdated).toHaveBeenCalledWith(expect.objectContaining({ indexesSequenceChanged: true }));
    expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(5);
  });

  it('should nest', () => {
    const indexMapper = createBatchedMapper();

    const result = indexMapper.runWithLiveCache(() => indexMapper.runWithLiveCache(
      () => indexMapper.getPhysicalFromVisualIndex(0)
    ));

    expect(result).toBe(5);
    expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(0);
  });

  it('should honor the trimmed and hidden indexes set before the batch', () => {
    const indexMapper = new IndexMapper();
    const trimmingMap = indexMapper.registerMap('trimming', new TrimmingMap());
    const hidingMap = indexMapper.registerMap('hiding', new HidingMap());

    indexMapper.initToLength(8);
    trimmingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    indexMapper.suspendOperations();
    indexMapper.moveIndexes([5], 0);

    const inside = indexMapper.runWithLiveCache(() => ({
      notTrimmed: indexMapper.getNotTrimmedIndexes(),
      renderable: indexMapper.getRenderableIndexes(),
    }));

    // Visual index 5 is physical 6 here, because physical 1 is trimmed.
    expect(inside.notTrimmed).toEqual([6, 0, 2, 3, 4, 5, 7]);
    expect(inside.renderable).toEqual([6, 0, 3, 4, 5, 7]);
  });

  it('should build the live caches once for many calls and again after the sequence changes', () => {
    const indexMapper = createBatchedMapper();
    const read = () => indexMapper.runWithLiveCache(() => indexMapper.getNotTrimmedIndexes());

    const first = read();

    expect(read()).toBe(first);

    // A move made inside the batch still translates its own visual index through the cached order.
    indexMapper.moveIndexes([3], 0);

    const second = read();

    expect(second).not.toBe(first);
    expect(second).not.toEqual(first);
    expect(second).toEqual(indexMapper.getIndexesSequence());
  });

  it('should keep the caches a real rebuild made inside the callback', () => {
    const indexMapper = createBatchedMapper();

    indexMapper.runWithLiveCache(() => {
      indexMapper.updateCache(true);
    });

    expect(indexMapper.getNotTrimmedIndexes()).toEqual([5, 0, 1, 2, 3, 4, 6, 7]);
    expect(indexMapper.getPhysicalFromVisualIndex(0)).toBe(5);
    expect(indexMapper.getVisualFromPhysicalIndex(5)).toBe(0);
  });

  it('should run the callback as is when the operations are not suspended', () => {
    const indexMapper = new IndexMapper();

    indexMapper.initToLength(8);
    indexMapper.moveIndexes([5], 0);

    const cache = indexMapper.getNotTrimmedIndexes();

    expect(indexMapper.runWithLiveCache(() => indexMapper.getNotTrimmedIndexes())).toBe(cache);
  });

  it('should run the callback as is when the indexes sequence did not change', () => {
    const indexMapper = new IndexMapper();

    indexMapper.initToLength(8);
    indexMapper.suspendOperations();

    const cache = indexMapper.getNotTrimmedIndexes();

    expect(indexMapper.runWithLiveCache(() => indexMapper.getNotTrimmedIndexes())).toBe(cache);
  });
});
