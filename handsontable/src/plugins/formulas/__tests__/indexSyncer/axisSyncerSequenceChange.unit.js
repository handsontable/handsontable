import AxisSyncer from '../../indexSyncer/axisSyncer';

function createMockIndexMapper(indexesSequence) {
  const state = { indexesSequence };

  return {
    state,
    getIndexesSequence: () => state.indexesSequence,
    getNotTrimmedIndexes: () => state.indexesSequence,
    getNumberOfIndexes: () => state.indexesSequence.length,
    addLocalHook: () => {},
  };
}

function createMockIndexSyncer(engine, sheetId = 0) {
  return {
    getEngine: () => engine,
    getSheetId: () => sheetId,
    isPerformingUndoRedo: () => false,
    getPostponeAction: () => () => {},
  };
}

function createMockEngine(initialDimensions = { width: 4, height: 4 }) {
  const calls = { setRowOrder: [], setColumnOrder: [] };
  const dimensions = { ...initialDimensions };

  return {
    calls,
    dimensions,
    setRowOrder: (sheetId, transformation) => {
      if (transformation.length !== dimensions.height) {
        throw new Error('Invalid arguments, expected number of rows provided to be sheet height.');
      }

      calls.setRowOrder.push({ sheetId, transformation });
    },
    setColumnOrder: (sheetId, transformation) => {
      if (transformation.length !== dimensions.width) {
        throw new Error('Invalid arguments, expected number of columns provided to be sheet width.');
      }

      calls.setColumnOrder.push({ sheetId, transformation });
    },
    getSheetDimensions: () => ({ ...dimensions }),
    batch: callback => callback(),
  };
}

describe('AxisSyncer sequence change sync', () => {
  describe('column axis', () => {
    it('should sync the order when the engine sheet is as wide as the reordered sequence', () => {
      const engine = createMockEngine();
      const indexMapper = createMockIndexMapper([0, 1, 2, 3]);
      const axisSyncer = new AxisSyncer('column', indexMapper, createMockIndexSyncer(engine));

      axisSyncer.init();
      indexMapper.state.indexesSequence = [0, 2, 1, 3];
      axisSyncer.getIndexesChangeSyncMethod()('update');

      expect(engine.calls.setColumnOrder).toEqual([
        { sheetId: 0, transformation: [0, 2, 1, 3] },
      ]);
    });

    it('should pad the order up to the engine sheet width when the engine extended the sheet', () => {
      const engine = createMockEngine({ width: 6, height: 4 });
      const indexMapper = createMockIndexMapper([0, 1, 2, 3]);
      const axisSyncer = new AxisSyncer('column', indexMapper, createMockIndexSyncer(engine));

      axisSyncer.init();
      indexMapper.state.indexesSequence = [0, 2, 1, 3];
      axisSyncer.getIndexesChangeSyncMethod()('update');

      expect(engine.calls.setColumnOrder).toEqual([
        { sheetId: 0, transformation: [0, 2, 1, 3, 4, 5] },
      ]);
    });

    it('should not sync the order when the engine sheet holds no columns', () => {
      const engine = createMockEngine({ width: 0, height: 0 });
      const indexMapper = createMockIndexMapper([0, 1, 2, 3]);
      const axisSyncer = new AxisSyncer('column', indexMapper, createMockIndexSyncer(engine, 2));

      axisSyncer.init();
      indexMapper.state.indexesSequence = [0, 1, 2, 3];

      expect(() => axisSyncer.getIndexesChangeSyncMethod()('update')).not.toThrow();
      expect(engine.calls.setColumnOrder).toEqual([]);
    });

    it('should not sync the order when the sequence is longer than the engine sheet', () => {
      const engine = createMockEngine({ width: 2, height: 4 });
      const indexMapper = createMockIndexMapper([0, 1, 2, 3]);
      const axisSyncer = new AxisSyncer('column', indexMapper, createMockIndexSyncer(engine));

      axisSyncer.init();
      indexMapper.state.indexesSequence = [0, 2, 1, 3];

      expect(() => axisSyncer.getIndexesChangeSyncMethod()('update')).not.toThrow();
      expect(engine.calls.setColumnOrder).toEqual([]);
    });

    it('should keep the last synced order as the baseline for the transformation after a skipped sync', () => {
      const engine = createMockEngine({ width: 0, height: 0 });
      const indexMapper = createMockIndexMapper([0, 1, 2, 3]);
      const axisSyncer = new AxisSyncer('column', indexMapper, createMockIndexSyncer(engine, 2));
      const syncMethod = axisSyncer.getIndexesChangeSyncMethod();

      axisSyncer.init();
      indexMapper.state.indexesSequence = [0, 2, 1, 3];
      syncMethod('update');

      expect(engine.calls.setColumnOrder).toEqual([]);

      // The engine's sheet grew, so the same grid order now fits and has to reach the engine — measured
      // against the order the engine actually holds, which is still the one from before the skip.
      engine.dimensions.width = 4;
      syncMethod('update');

      expect(engine.calls.setColumnOrder).toEqual([
        { sheetId: 2, transformation: [0, 2, 1, 3] },
      ]);
    });
  });

  describe('row axis', () => {
    it('should not sync the order when the engine sheet holds no rows', () => {
      const engine = createMockEngine({ width: 0, height: 0 });
      const indexMapper = createMockIndexMapper([0, 1, 2]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine, 2));

      axisSyncer.init();
      indexMapper.state.indexesSequence = [2, 0, 1];

      expect(() => axisSyncer.getIndexesChangeSyncMethod()('update')).not.toThrow();
      expect(engine.calls.setRowOrder).toEqual([]);
    });

    it('should sync the order when the engine sheet is as tall as the reordered sequence', () => {
      const engine = createMockEngine({ width: 4, height: 3 });
      const indexMapper = createMockIndexMapper([0, 1, 2]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine));

      axisSyncer.init();
      indexMapper.state.indexesSequence = [2, 0, 1];
      axisSyncer.getIndexesChangeSyncMethod()('update');

      expect(engine.calls.setRowOrder).toEqual([
        { sheetId: 0, transformation: [1, 2, 0] },
      ]);
    });
  });
});
