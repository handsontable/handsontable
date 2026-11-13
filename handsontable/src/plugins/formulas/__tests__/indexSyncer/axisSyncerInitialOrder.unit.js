import AxisSyncer from '../../indexSyncer/axisSyncer';
import { createMockEngine } from './helpers/mockEngine';

function createMockIndexMapper(indexesSequence, notTrimmedIndexes = indexesSequence) {
  const state = { indexesSequence, notTrimmedIndexes };
  const localHooks = new Map();

  return {
    state,
    getIndexesSequence: () => state.indexesSequence,
    getNotTrimmedIndexes: () => state.notTrimmedIndexes,
    getNumberOfIndexes: () => state.indexesSequence.length,
    addLocalHook: (key, callback) => {
      localHooks.set(key, [...(localHooks.get(key) ?? []), callback]);
    },
    // Runs the local hooks the way the index mapper does after an insert or a removal.
    runLocalHooks: (key, ...args) => {
      (localHooks.get(key) ?? []).forEach(callback => callback(...args));
    },
  };
}

function createMockIndexSyncer(engine, sheetId = 0) {
  return {
    getEngine: () => engine,
    getSheetId: () => sheetId,
    getPostponeAction: () => () => {},
    getOwnEngineWrite: () => (_, fn) => fn(),
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

    it('should send a non-identity initial sequence as column moves', () => {
      const engine = createMockEngine();

      engine.held.columns = ['a', 'b', 'c', 'd'];
      // manualColumnMove: [0, 2, 1, 3] -> visual order in physical indexes is [0, 2, 1, 3].
      const indexMapper = createMockIndexMapper([0, 2, 1, 3]);
      const indexSyncer = createMockIndexSyncer(engine);
      const axisSyncer = new AxisSyncer('column', indexMapper, indexSyncer);

      axisSyncer.init();

      // A move keeps every reference on its cell, where an order would shift the moved formulas' references.
      expect(engine.calls.setColumnOrder).toEqual([]);
      expect(engine.calls.moveColumns).toEqual([
        { sheetId: 0, start: 2, count: 1, target: 1 },
      ]);
      expect(engine.held.columns).toEqual(['a', 'c', 'b', 'd']);
      expect(engine.calls.setRowOrder).toEqual([]);
      expect(engine.calls.moveRows).toEqual([]);
    });

    it('should leave the columns the engine holds past the sequence in place when HF has extended dimensions', () => {
      const engine = createMockEngine();

      engine.dimensions.width = 6;
      engine.held.columns = ['a', 'b', 'c', 'd', 'e', 'f'];
      const indexMapper = createMockIndexMapper([0, 2, 1, 3]);
      const indexSyncer = createMockIndexSyncer(engine);
      const axisSyncer = new AxisSyncer('column', indexMapper, indexSyncer);

      axisSyncer.init();

      expect(engine.calls.moveColumns).toEqual([
        { sheetId: 0, start: 2, count: 1, target: 1 },
      ]);
      expect(engine.held.columns).toEqual(['a', 'c', 'b', 'd', 'e', 'f']);
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

      engine.held.columns = ['a', 'b'];
      axisSyncer.init();

      expect(engine.calls.moveColumns).toEqual([
        { sheetId: 0, start: 1, count: 1, target: 0 },
      ]);
      expect(engine.held.columns).toEqual(['b', 'a']);
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
    it('should send a non-identity initial row sequence as row moves', () => {
      const engine = createMockEngine();
      const indexMapper = createMockIndexMapper([2, 0, 1]);

      engine.dimensions.height = 3;
      engine.held.rows = ['r0', 'r1', 'r2'];
      const indexSyncer = createMockIndexSyncer(engine);
      const axisSyncer = new AxisSyncer('row', indexMapper, indexSyncer);

      axisSyncer.init();

      expect(engine.calls.setRowOrder).toEqual([]);
      expect(engine.calls.moveRows).toEqual([
        { sheetId: 0, start: 2, count: 1, target: 0 },
      ]);
      expect(engine.held.rows).toEqual(['r2', 'r0', 'r1']);
      expect(engine.calls.setColumnOrder).toEqual([]);
    });

    it('should move a block of rows that keeps its order in one move', () => {
      const engine = createMockEngine({ width: 2, height: 5 });
      const indexMapper = createMockIndexMapper([2, 3, 4, 0, 1]);

      engine.held.rows = ['r0', 'r1', 'r2', 'r3', 'r4'];
      new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine)).init();

      expect(engine.calls.moveRows).toEqual([
        { sheetId: 0, start: 0, count: 2, target: 5 },
      ]);
      expect(engine.held.rows).toEqual(['r2', 'r3', 'r4', 'r0', 'r1']);
    });

    it('should send an initial order whose moves cost more than one order as one order', () => {
      const size = 2000;
      const sequence = Array.from({ length: size }, (_, place) => (place * 7) % size);
      const engine = createMockEngine({ width: 1, height: size });
      const axisSyncer = new AxisSyncer('row', createMockIndexMapper(sequence), createMockIndexSyncer(engine));

      axisSyncer.init();

      expect(engine.calls.moveRows).toEqual([]);
      expect(engine.calls.setRowOrder.length).toBe(1);
      // Sent as an order, it counts as one: the reload replays it the same way.
      expect(axisSyncer.getOrderShift(7)).toBe(-6);
    });

    it('should send the order as an order again when a reload follows an order the engine took as one', () => {
      const engine = createMockEngine({ width: 2, height: 4 });
      const indexMapper = createMockIndexMapper([0, 1, 2, 3]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine));

      axisSyncer.init();
      // A sort reaches the engine as an order, which keeps the moved formulas' relative references.
      indexMapper.state.indexesSequence = [3, 2, 1, 0];
      axisSyncer.getIndexesChangeSyncMethod()('update');

      expect(engine.calls.setRowOrder.length).toBe(1);

      // The reload feeds the content in physical order again, and the order is replayed the same way, so
      // the grid shows what it showed before the reload.
      axisSyncer.init();

      expect(engine.calls.setRowOrder).toEqual([
        { sheetId: 0, transformation: [3, 2, 1, 0] },
        { sheetId: 0, transformation: [3, 2, 1, 0] },
      ]);
      expect(engine.calls.moveRows).toEqual([]);
    });
  });

  describe('an order a sort set', () => {
    it('should send a sorted order as one order from a syncer with no history of the sort', () => {
      const engine = createMockEngine({ width: 2, height: 4 });
      const indexSyncer = { ...createMockIndexSyncer(engine), isOrderSorted: () => true };
      const axisSyncer = new AxisSyncer('row', createMockIndexMapper([3, 2, 1, 0]), indexSyncer);

      axisSyncer.init();

      expect(engine.calls.moveRows).toEqual([]);
      expect(engine.calls.setRowOrder).toEqual([{ sheetId: 0, transformation: [3, 2, 1, 0] }]);
    });

    it('should send a sorted order as one order when the sync was postponed', () => {
      const engine = createMockEngine({ width: 2, height: 4 });
      const indexMapper = createMockIndexMapper([0, 1, 2, 3]);
      const postponedCallbacks = [];
      let sheetId = 0;
      const indexSyncer = {
        ...createMockIndexSyncer(engine),
        getSheetId: () => sheetId,
        getPostponeAction: () => callback => postponedCallbacks.push(callback),
      };
      const axisSyncer = new AxisSyncer('row', indexMapper, indexSyncer);

      axisSyncer.init();
      indexMapper.state.indexesSequence = [3, 2, 1, 0];
      axisSyncer.getIndexesChangeSyncMethod()('update');

      sheetId = null;
      axisSyncer.init();
      sheetId = 0;
      postponedCallbacks.forEach(callback => callback());

      expect(engine.calls.moveRows).toEqual([]);
      expect(engine.calls.setRowOrder.length).toBe(2);
    });
  });

  describe('an order sent on top of moves', () => {
    it('should replay the moves as moves and only the rest as one order', () => {
      const engine = createMockEngine({ width: 2, height: 5 });

      engine.held.rows = ['r0', 'r1', 'r2', 'r3', 'r4'];

      const indexMapper = createMockIndexMapper([2, 3, 4, 0, 1]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine));

      axisSyncer.init();

      expect(engine.calls.moveRows.length).toBe(1);

      // A sort on top of the moved order reaches the engine as an order.
      indexMapper.state.indexesSequence = [4, 3, 2, 1, 0];
      axisSyncer.getIndexesChangeSyncMethod()('update');

      expect(engine.calls.setRowOrder.length).toBe(1);

      // The reload feeds the content in physical order again.
      engine.held.rows = ['r0', 'r1', 'r2', 'r3', 'r4'];
      axisSyncer.init();

      // The moves are replayed as moves, and the sort's part as one order, as the grid reached it.
      expect(engine.calls.moveRows.length).toBe(2);
      expect(engine.calls.moveRows[1]).toEqual(engine.calls.moveRows[0]);
      expect(engine.calls.setRowOrder.length).toBe(2);
      expect(engine.calls.setRowOrder[1]).toEqual(engine.calls.setRowOrder[0]);
      expect(engine.held.rows).toEqual(['r4', 'r3', 'r2', 'r1', 'r0']);
    });

    it('should send one order on a reload when lines were inserted after the order', () => {
      const engine = createMockEngine({ width: 2, height: 5 });
      const indexMapper = createMockIndexMapper([2, 3, 4, 0, 1]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine));

      axisSyncer.init();
      indexMapper.state.indexesSequence = [4, 3, 2, 1, 0];
      axisSyncer.getIndexesChangeSyncMethod()('update');
      // An insert renumbers the lines, and the recorded moves no longer describe them.
      engine.dimensions.height = 6;
      indexMapper.state.indexesSequence = [5, 4, 3, 2, 1, 0];
      axisSyncer.getIndexesChangeSyncMethod()('insert');
      axisSyncer.init();

      expect(engine.calls.moveRows.length).toBe(1);
      expect(engine.calls.setRowOrder.length).toBe(2);
    });

    it('should send one order on a reload when an insert and a removal kept the number of lines', () => {
      const engine = createMockEngine({ width: 2, height: 5 });
      const indexMapper = createMockIndexMapper([2, 3, 4, 0, 1]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine));
      const syncMethod = axisSyncer.getIndexesChangeSyncMethod();

      axisSyncer.init();
      indexMapper.state.indexesSequence = [4, 3, 2, 1, 0];
      syncMethod('update');

      // A line inserted at physical 0 and the last one removed: the base still has as many lines as the
      // sequence, but the moves it recorded no longer lead to it.
      indexMapper.runLocalHooks('indexesInserted', [0]);
      indexMapper.state.indexesSequence = [5, 0, 4, 3, 2, 1];
      syncMethod('insert');
      indexMapper.runLocalHooks('indexesRemoved', [5]);
      indexMapper.state.indexesSequence = [0, 4, 3, 2, 1];
      syncMethod('remove');
      axisSyncer.init();

      expect(engine.calls.moveRows.length).toBe(1);
      expect(engine.calls.setRowOrder.length).toBe(2);
    });

    it('should warn once when the order cannot be sent, not again for the moves tried under it', () => {
      const engine = createMockEngine({ width: 2, height: 5 });
      const indexMapper = createMockIndexMapper([2, 3, 4, 0, 1]);
      const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine));
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        axisSyncer.init();
        indexMapper.state.indexesSequence = [4, 3, 2, 1, 0];
        axisSyncer.getIndexesChangeSyncMethod()('update');

        // An array formula in a moved row: neither the moves nor the order can reach the engine.
        engine.isCellPartOfArray = () => true;
        engine.isItPossibleToSetRowOrder = () => false;
        axisSyncer.init();

        expect(warnSpy).toHaveBeenCalledTimes(1);
      } finally {
        warnSpy.mockRestore();
      }
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
        getPostponeAction: () => callback => postponedCallbacks.push(callback),
        getOwnEngineWrite: () => (_, fn) => fn(),
      };
      const axisSyncer = new AxisSyncer('column', indexMapper, indexSyncer);

      axisSyncer.init();

      expect(engine.calls.setColumnOrder).toEqual([]);
      expect(postponedCallbacks.length).toBe(1);

      // Once the endpoint is ready, the postponed action should be executed.
      indexSyncer.getSheetId = () => 0;
      postponedCallbacks[0]();

      expect(engine.calls.moveColumns).toEqual([
        { sheetId: 0, start: 2, count: 1, target: 1 },
      ]);
    });
  });
});
