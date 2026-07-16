import AxisSyncer from '../../indexSyncer/axisSyncer';

function createMockIndexMapper(indexesSequence, notTrimmedIndexes = indexesSequence) {
  const localHooks = {};
  const calls = { getIndexesSequence: 0 };
  const mapper = {
    calls,
    state: { indexesSequence, notTrimmedIndexes },
    getIndexesSequence: () => {
      calls.getIndexesSequence += 1;

      return mapper.state.indexesSequence;
    },
    getNotTrimmedIndexes: () => mapper.state.notTrimmedIndexes,
    getNumberOfIndexes: () => mapper.state.indexesSequence.length,
    getVisualFromPhysicalIndex:
      physicalIndex => (mapper.state.notTrimmedIndexes.includes(physicalIndex) ?
        mapper.state.notTrimmedIndexes.indexOf(physicalIndex) : null),
    addLocalHook: (key, callback) => {
      localHooks[key] = localHooks[key] ?? [];
      localHooks[key].push(callback);
    },
    runLocalHooks: (key, ...args) => {
      (localHooks[key] ?? []).forEach(callback => callback(...args));
    },
  };

  return mapper;
}

function createMockIndexSyncer() {
  return {
    getEngine: () => null,
    getSheetId: () => 0,
    isPerformingUndoRedo: () => false,
    getPostponeAction: () => () => {},
  };
}

describe('AxisSyncer index translations', () => {
  describe('getHfIndexFromVisualIndex', () => {
    it('should return the same index when the sequence is the identity and nothing is trimmed', () => {
      const indexMapper = createMockIndexMapper([0, 1, 2, 3, 4]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer());

      expect(axisSyncer.getHfIndexFromVisualIndex(0)).toBe(0);
      expect(axisSyncer.getHfIndexFromVisualIndex(2)).toBe(2);
      expect(axisSyncer.getHfIndexFromVisualIndex(4)).toBe(4);
    });

    it('should return the position within the full sequence when some indexes are trimmed', () => {
      // Physical indexes 1 and 3 are trimmed. Visual 0 -> physical 0 (HF 0),
      // visual 1 -> physical 2 (HF 2), visual 2 -> physical 4 (HF 4).
      const indexMapper = createMockIndexMapper([0, 1, 2, 3, 4], [0, 2, 4]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer());

      expect(axisSyncer.getHfIndexFromVisualIndex(0)).toBe(0);
      expect(axisSyncer.getHfIndexFromVisualIndex(1)).toBe(2);
      expect(axisSyncer.getHfIndexFromVisualIndex(2)).toBe(4);
    });

    it('should respect a reordered sequence combined with trimming', () => {
      // Sequence [2, 0, 1] with physical 0 trimmed: visual 0 -> physical 2 (HF 0),
      // visual 1 -> physical 1 (HF 2).
      const indexMapper = createMockIndexMapper([2, 0, 1], [2, 1]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer());

      expect(axisSyncer.getHfIndexFromVisualIndex(0)).toBe(0);
      expect(axisSyncer.getHfIndexFromVisualIndex(1)).toBe(2);
    });

    it('should return -1 for out-of-range and negative visual indexes', () => {
      const indexMapper = createMockIndexMapper([0, 1, 2]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer());

      expect(axisSyncer.getHfIndexFromVisualIndex(3)).toBe(-1);
      expect(axisSyncer.getHfIndexFromVisualIndex(100)).toBe(-1);
      expect(axisSyncer.getHfIndexFromVisualIndex(-1)).toBe(-1);
    });
  });

  describe('getVisualIndexFromHfIndex', () => {
    it('should be the inverse of getHfIndexFromVisualIndex for not-trimmed indexes', () => {
      const indexMapper = createMockIndexMapper([2, 0, 1], [2, 1]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer());

      expect(axisSyncer.getVisualIndexFromHfIndex(0)).toBe(0); // physical 2 -> visual 0
      expect(axisSyncer.getVisualIndexFromHfIndex(2)).toBe(1); // physical 1 -> visual 1
    });

    it('should return -1 when the HF index points to a trimmed element', () => {
      const indexMapper = createMockIndexMapper([0, 1, 2, 3, 4], [0, 2, 4]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer());

      expect(axisSyncer.getVisualIndexFromHfIndex(1)).toBe(-1);
      expect(axisSyncer.getVisualIndexFromHfIndex(3)).toBe(-1);
    });

    it('should return -1 for out-of-range HF indexes', () => {
      const indexMapper = createMockIndexMapper([0, 1, 2]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer());

      expect(axisSyncer.getVisualIndexFromHfIndex(3)).toBe(-1);
      expect(axisSyncer.getVisualIndexFromHfIndex(-1)).toBe(-1);
    });
  });

  describe('translation cache', () => {
    it('should not rebuild the translation tables between calls when indexes do not change', () => {
      const indexMapper = createMockIndexMapper([0, 1, 2, 3]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer());

      axisSyncer.getHfIndexFromVisualIndex(0);
      axisSyncer.getHfIndexFromVisualIndex(1);
      axisSyncer.getVisualIndexFromHfIndex(2);
      axisSyncer.getVisualIndexFromHfIndex(3);

      expect(indexMapper.calls.getIndexesSequence).toBe(1);
    });

    it('should rebuild the translation tables after the `indexesSequenceChange` hook fires', () => {
      const indexMapper = createMockIndexMapper([0, 1, 2]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer());

      expect(axisSyncer.getHfIndexFromVisualIndex(0)).toBe(0);

      indexMapper.state.indexesSequence = [2, 0, 1];
      indexMapper.state.notTrimmedIndexes = [2, 0, 1];
      indexMapper.runLocalHooks('indexesSequenceChange', 'update');

      expect(axisSyncer.getHfIndexFromVisualIndex(0)).toBe(0); // physical 2 at HF position 0
      expect(axisSyncer.getHfIndexFromVisualIndex(1)).toBe(1); // physical 0 at HF position 1
      expect(axisSyncer.getVisualIndexFromHfIndex(2)).toBe(2); // physical 1 -> visual 2
    });

    it('should rebuild the translation tables after the `cacheUpdated` hook reports a trimming change', () => {
      const indexMapper = createMockIndexMapper([0, 1, 2, 3]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer());

      expect(axisSyncer.getHfIndexFromVisualIndex(1)).toBe(1);

      indexMapper.state.notTrimmedIndexes = [0, 2, 3];
      indexMapper.runLocalHooks('cacheUpdated', { trimmedIndexesChanged: true });

      expect(axisSyncer.getHfIndexFromVisualIndex(1)).toBe(2);
      expect(axisSyncer.getVisualIndexFromHfIndex(1)).toBe(-1);
    });

    it('should keep the translation tables when the `cacheUpdated` hook reports no trimming change', () => {
      const indexMapper = createMockIndexMapper([0, 1, 2, 3]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer());

      axisSyncer.getHfIndexFromVisualIndex(1);
      indexMapper.runLocalHooks('cacheUpdated', { trimmedIndexesChanged: false });
      axisSyncer.getHfIndexFromVisualIndex(2);

      expect(indexMapper.calls.getIndexesSequence).toBe(1);
    });
  });

  describe('setRemovedHfIndexes', () => {
    it('should translate the removed physical indexes to HF indexes', () => {
      const indexMapper = createMockIndexMapper([0, 1, 2, 3, 4]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer());

      expect(axisSyncer.setRemovedHfIndexes([1, 3])).toEqual([1, 3]);
      expect(axisSyncer.getRemovedHfIndexes()).toEqual([1, 3]);
    });

    it('should translate removed physical indexes to -1 when they are trimmed', () => {
      const indexMapper = createMockIndexMapper([0, 1, 2, 3, 4], [0, 2, 4]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer());

      expect(axisSyncer.setRemovedHfIndexes([1, 2])).toEqual([-1, 2]);
    });
  });
});
