import AxisSyncer from '../../indexSyncer/axisSyncer';
import { createMockEngine } from './helpers/mockEngine';

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

    it('should compress the order onto the columns the engine holds when the sequence is longer', () => {
      const engine = createMockEngine({ width: 2, height: 4 });
      const indexMapper = createMockIndexMapper([0, 1, 2, 3]);
      const axisSyncer = new AxisSyncer('column', indexMapper, createMockIndexSyncer(engine));

      axisSyncer.init();
      // The engine holds the first two columns only, and the reorder keeps them in that relative order.
      indexMapper.state.indexesSequence = [0, 2, 1, 3];
      axisSyncer.getIndexesChangeSyncMethod()('update');

      expect(engine.calls.setColumnOrder).toEqual([
        { sheetId: 0, transformation: [0, 1] },
      ]);
    });

    it('should compress a reorder that swaps two columns the engine holds', () => {
      const engine = createMockEngine({ width: 2, height: 4 });
      const indexMapper = createMockIndexMapper([0, 1, 2, 3]);
      const axisSyncer = new AxisSyncer('column', indexMapper, createMockIndexSyncer(engine));

      axisSyncer.init();
      indexMapper.state.indexesSequence = [1, 0, 2, 3];
      axisSyncer.getIndexesChangeSyncMethod()('update');

      expect(engine.calls.setColumnOrder).toEqual([
        { sheetId: 0, transformation: [1, 0] },
      ]);
    });

    it('should measure a later order against the columns the engine holds, not the grid sequence', () => {
      const engine = createMockEngine({ width: 3, height: 4 });
      const indexMapper = createMockIndexMapper([0, 1, 2, 3, 4]);
      const axisSyncer = new AxisSyncer('column', indexMapper, createMockIndexSyncer(engine));
      const syncMethod = axisSyncer.getIndexesChangeSyncMethod();

      axisSyncer.init();
      // Column 3 is empty, so the engine does not hold it, and moving it to the front leaves the three
      // columns the engine does hold in their existing order.
      indexMapper.state.indexesSequence = [3, 0, 1, 2, 4];
      syncMethod('update');

      expect(engine.calls.setColumnOrder).toEqual([
        { sheetId: 0, transformation: [0, 1, 2] },
      ]);

      indexMapper.state.indexesSequence = [3, 2, 1, 0, 4];
      syncMethod('update');

      expect(engine.calls.setColumnOrder[1]).toEqual({ sheetId: 0, transformation: [2, 1, 0] });
    });

    it('should follow the grid sequence through an insert before ordering the engine again', () => {
      const engine = createMockEngine({ width: 3, height: 4 });
      const indexMapper = createMockIndexMapper([0, 1, 2]);
      const axisSyncer = new AxisSyncer('column', indexMapper, createMockIndexSyncer(engine));
      const syncMethod = axisSyncer.getIndexesChangeSyncMethod();

      axisSyncer.init();
      indexMapper.state.indexesSequence = [2, 0, 1];
      syncMethod('update');

      // The engine inserts the column itself, through `addColumns`, and both sides renumber their physical
      // indexes — so the order the engine holds afterwards is the grid's new sequence, with the new column
      // where the grid put it rather than appended at the end.
      indexMapper.state.indexesSequence = [2, 0, 3, 1];
      syncMethod('insert');
      engine.dimensions.width = 4;

      indexMapper.state.indexesSequence = [1, 3, 0, 2];
      syncMethod('update');

      expect(engine.calls.setColumnOrder[1]).toEqual({ sheetId: 0, transformation: [3, 2, 1, 0] });
    });

    it('should rank an index the sequence no longer covers last instead of sending it as -1', () => {
      const engine = createMockEngine({ width: 3, height: 4 });
      const indexMapper = createMockIndexMapper([0, 1, 2]);
      const axisSyncer = new AxisSyncer('column', indexMapper, createMockIndexSyncer(engine));

      axisSyncer.init();
      // Mid-batch the mapper can drop an index the stored sequence still carries; it arrives as `-1`,
      // which the engine rejects as a non-permutation.
      indexMapper.state.indexesSequence = [2, 0];
      axisSyncer.getIndexesChangeSyncMethod()('update');

      expect(engine.calls.setColumnOrder).toEqual([
        { sheetId: 0, transformation: [1, 2, 0] },
      ]);
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

    it('should compress the order onto the rows the engine holds when the sequence is longer', () => {
      const engine = createMockEngine({ width: 4, height: 2 });
      const indexMapper = createMockIndexMapper([0, 1, 2]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine));

      axisSyncer.init();
      indexMapper.state.indexesSequence = [1, 0, 2];
      axisSyncer.getIndexesChangeSyncMethod()('update');

      expect(engine.calls.setRowOrder).toEqual([
        { sheetId: 0, transformation: [1, 0] },
      ]);
    });

    it('should keep the last synced order as the baseline for the transformation after a skipped sync', () => {
      const engine = createMockEngine({ width: 0, height: 0 });
      const indexMapper = createMockIndexMapper([0, 1, 2]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine, 2));
      const syncMethod = axisSyncer.getIndexesChangeSyncMethod();

      axisSyncer.init();
      indexMapper.state.indexesSequence = [2, 0, 1];
      syncMethod('update');

      expect(engine.calls.setRowOrder).toEqual([]);

      engine.dimensions.height = 3;
      syncMethod('update');

      expect(engine.calls.setRowOrder).toEqual([
        { sheetId: 2, transformation: [1, 2, 0] },
      ]);
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
