import AxisSyncer from '../../indexSyncer/axisSyncer';
import { createMockEngine } from './helpers/mockEngine';

function createMockIndexMapper(indexesSequence, notTrimmedIndexes = indexesSequence) {
  const state = { indexesSequence, notTrimmedIndexes };

  return {
    state,
    getIndexesSequence: () => state.indexesSequence,
    getNotTrimmedIndexes: () => state.notTrimmedIndexes,
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

describe('AxisSyncer initial order sync', () => {
  describe('column axis', () => {
    it('should not call setColumnOrder on the engine when initial sequence is identity', () => {
      const engine = createMockEngine();
      const indexMapper = createMockIndexMapper([0, 1, 2, 3]);
      const indexSyncer = createMockIndexSyncer(engine);
      const axisSyncer = new AxisSyncer('column', indexMapper, indexSyncer);

      axisSyncer.init();

      expect(engine.calls.setColumnOrder).toEqual([]);
    });

    it('should call setColumnOrder with the correct transformation when initial sequence is non-identity', () => {
      const engine = createMockEngine();
      // manualColumnMove: [0, 2, 1, 3] -> visual order in physical indexes is [0, 2, 1, 3].
      const indexMapper = createMockIndexMapper([0, 2, 1, 3]);
      const indexSyncer = createMockIndexSyncer(engine);
      const axisSyncer = new AxisSyncer('column', indexMapper, indexSyncer);

      axisSyncer.init();

      // Transformation: each currently-physical position i moves to the position
      // newSequence.indexOf(i). For [0, 2, 1, 3] this yields [0, 2, 1, 3].
      expect(engine.calls.setColumnOrder).toEqual([
        { sheetId: 0, transformation: [0, 2, 1, 3] },
      ]);
      expect(engine.calls.setRowOrder).toEqual([]);
    });

    it('should pad the transformation array to match the HF sheet width when HF has extended dimensions', () => {
      const engine = createMockEngine();

      engine.dimensions.width = 6;
      const indexMapper = createMockIndexMapper([0, 2, 1, 3]);
      const indexSyncer = createMockIndexSyncer(engine);
      const axisSyncer = new AxisSyncer('column', indexMapper, indexSyncer);

      axisSyncer.init();

      expect(engine.calls.setColumnOrder).toEqual([
        { sheetId: 0, transformation: [0, 2, 1, 3, 4, 5] },
      ]);
    });
  });

  describe('engine sheet smaller than the sequence', () => {
    it('should not sync the initial order when the engine sheet holds no columns', () => {
      const engine = createMockEngine({ width: 0, height: 0 });
      const indexMapper = createMockIndexMapper([0, 2, 1, 3]);
      const axisSyncer = new AxisSyncer('column', indexMapper, createMockIndexSyncer(engine));

      expect(() => axisSyncer.init()).not.toThrow();
      expect(engine.calls.setColumnOrder).toEqual([]);
    });

    it('should compress the initial order onto the columns the engine holds', () => {
      const engine = createMockEngine({ width: 2, height: 4 });
      const indexMapper = createMockIndexMapper([1, 0, 2, 3]);
      const axisSyncer = new AxisSyncer('column', indexMapper, createMockIndexSyncer(engine));

      axisSyncer.init();

      expect(engine.calls.setColumnOrder).toEqual([
        { sheetId: 0, transformation: [1, 0] },
      ]);
    });

    it('should fill a sheet that was empty at init in the order the grid had then', () => {
      const engine = createMockEngine({ width: 0, height: 0 });
      const indexMapper = createMockIndexMapper([0, 2, 1, 3]);
      const axisSyncer = new AxisSyncer('column', indexMapper, createMockIndexSyncer(engine));
      const syncMethod = axisSyncer.getIndexesChangeSyncMethod();

      axisSyncer.init();
      // The sheet gains its columns through addresses the grid computes from the order it had at init, so
      // they already sit that way and there is nothing to reorder.
      engine.dimensions.width = 4;
      syncMethod('update');

      expect(engine.calls.setColumnOrder).toEqual([]);

      // A later reorder is measured against those columns: the engine holds [0, 2, 1, 3].
      indexMapper.state.indexesSequence = [3, 1, 2, 0];
      syncMethod('update');

      expect(engine.calls.setColumnOrder).toEqual([
        { sheetId: 0, transformation: [3, 2, 1, 0] },
      ]);
    });
  });

  describe('row axis', () => {
    it('should call setRowOrder when row sequence is non-identity', () => {
      const engine = createMockEngine();
      const indexMapper = createMockIndexMapper([2, 0, 1]);

      engine.dimensions.height = 3;
      const indexSyncer = createMockIndexSyncer(engine);
      const axisSyncer = new AxisSyncer('row', indexMapper, indexSyncer);

      axisSyncer.init();

      // For [2, 0, 1]: transformation[i] = newSequence.indexOf(i)
      //   i=0 -> indexOf(0) = 1
      //   i=1 -> indexOf(1) = 2
      //   i=2 -> indexOf(2) = 0
      expect(engine.calls.setRowOrder).toEqual([
        { sheetId: 0, transformation: [1, 2, 0] },
      ]);
      expect(engine.calls.setColumnOrder).toEqual([]);
    });
  });

  describe('postponed actions', () => {
    it('should postpone the sync when the sheet id is null', () => {
      const engine = createMockEngine();
      const indexMapper = createMockIndexMapper([0, 2, 1, 3]);
      const postponedCallbacks = [];
      const indexSyncer = {
        getEngine: () => engine,
        getSheetId: () => null,
        isPerformingUndoRedo: () => false,
        getPostponeAction: () => callback => postponedCallbacks.push(callback),
      };
      const axisSyncer = new AxisSyncer('column', indexMapper, indexSyncer);

      axisSyncer.init();

      expect(engine.calls.setColumnOrder).toEqual([]);
      expect(postponedCallbacks.length).toBe(1);

      // Once the endpoint is ready, the postponed action should be executed.
      indexSyncer.getSheetId = () => 0;
      postponedCallbacks[0]();

      expect(engine.calls.setColumnOrder).toEqual([
        { sheetId: 0, transformation: [0, 2, 1, 3] },
      ]);
    });
  });
});
