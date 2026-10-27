import AxisSyncer from '../../indexSyncer/axisSyncer';
import IndexSyncer from '../../indexSyncer';

/**
 * Builds an index mapper stub whose sequence a test can replace.
 *
 * @param {number[]} indexesSequence The starting sequence.
 * @returns {object}
 */
function createMockIndexMapper(indexesSequence) {
  const mapper = {
    state: { indexesSequence },
    getIndexesSequence: () => mapper.state.indexesSequence,
    getNotTrimmedIndexes: () => mapper.state.indexesSequence,
    getNumberOfIndexes: () => mapper.state.indexesSequence.length,
    addLocalHook: () => {},
  };

  return mapper;
}

/**
 * Builds an index syncer stub bound to `engine`.
 *
 * @param {object|null} engine The engine stub.
 * @returns {object}
 */
function createMockIndexSyncer(engine) {
  return {
    getEngine: () => engine,
    getSheetId: () => 0,
    getPostponeAction: () => () => {},
    getOwnEngineWrite: () => (_, fn) => fn(),
  };
}

/**
 * Builds an engine stub that records the moves and orders it is handed.
 *
 * @returns {object}
 */
function createRecordingEngine() {
  const calls = [];

  return {
    calls,
    batch: callback => callback(),
    moveRows: (...args) => calls.push(['moveRows', ...args]),
    setRowOrder: (...args) => calls.push(['setRowOrder', ...args]),
    getSheetDimensions: () => ({ width: 1, height: 3 }),
    getSheetName: () => 'Sheet1',
  };
}

describe('AxisSyncer while the order is held', () => {
  it('translates through the order an empty sheet was filled in', () => {
    const axisSyncer = new AxisSyncer('row', createMockIndexMapper([0, 1, 2]), createMockIndexSyncer(null));

    axisSyncer.adoptEngineOrder({ sequence: [], fillSequence: [2, 0, 1] });
    axisSyncer.setOrderHeld(true);

    expect([0, 1, 2].map(physicalRow => axisSyncer.getHfIndexFromPhysicalIndex(physicalRow))).toEqual([1, 2, 0]);
  });

  it('sends the order the grid ends on once, when the hold is released', () => {
    const engine = createRecordingEngine();
    const indexMapper = createMockIndexMapper([0, 1, 2]);
    const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine));

    axisSyncer.setOrderHeld(true);
    indexMapper.state.indexesSequence = [2, 0, 1];
    axisSyncer.getIndexesChangeSyncMethod()('update');
    indexMapper.state.indexesSequence = [1, 2, 0];
    axisSyncer.getIndexesChangeSyncMethod()('update');

    expect(engine.calls).toEqual([]);

    axisSyncer.setOrderHeld(false);

    expect(engine.calls).toEqual([['setRowOrder', 0, [2, 0, 1]]]);
  });

  it('releases the column axis when sending the row order throws', () => {
    const calls = [];
    const engine = {
      getSheetDimensions: () => ({ width: 2, height: 2 }),
      getSheetName: () => 'Sheet1',
      setRowOrder: () => {
        throw new Error('row order');
      },
      setColumnOrder: (...args) => calls.push(args),
    };
    const rows = createMockIndexMapper([0, 1]);
    const columns = createMockIndexMapper([0, 1]);
    const indexSyncer = new IndexSyncer(rows, columns, () => {}, (_, fn) => fn());

    indexSyncer.setupSyncEndpoint(engine, 0);
    indexSyncer.setOrderHeld(true);
    rows.state.indexesSequence = [1, 0];
    columns.state.indexesSequence = [1, 0];

    expect(() => indexSyncer.setOrderHeld(false)).toThrow('row order');
    expect(calls).toEqual([[0, [1, 0]]]);
  });

  it('sends no move and keeps the engine order while an order adopted in the hold is held', () => {
    const engine = createRecordingEngine();
    const indexMapper = createMockIndexMapper([0, 1, 2]);
    const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine));

    axisSyncer.setOrderHeld(true);
    axisSyncer.adoptEngineOrder({ sequence: [2, 0, 1], fillSequence: null });
    axisSyncer.storeMovesInformation([0, 1, 2], 0, true);
    indexMapper.state.indexesSequence = [2, 0, 1];
    axisSyncer.getIndexesChangeSyncMethod()('move');
    axisSyncer.calculateAndSyncMoves(true, true);

    expect(engine.calls).toEqual([]);
    expect(axisSyncer.getEngineOrder().sequence).toEqual([2, 0, 1]);

    axisSyncer.setOrderHeld(false);

    expect(engine.calls).toEqual([]);
  });

  it('sends a move made in the hold when no engine order was adopted, and nothing on release', () => {
    const engine = createRecordingEngine();
    const indexMapper = createMockIndexMapper([0, 1, 2]);
    const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine));

    axisSyncer.setOrderHeld(true);
    axisSyncer.storeMovesInformation([2], 0, true);
    indexMapper.state.indexesSequence = [2, 0, 1];
    axisSyncer.getIndexesChangeSyncMethod()('move');
    axisSyncer.calculateAndSyncMoves(true, true);

    expect(engine.calls.map(([method]) => method)).toEqual(['moveRows']);
    expect(axisSyncer.getEngineOrder().sequence).toEqual([2, 0, 1]);

    axisSyncer.setOrderHeld(false);

    expect(engine.calls.map(([method]) => method)).toEqual(['moveRows']);
  });

  it('forgets an adopted order when the hold ends', () => {
    const engine = createRecordingEngine();
    const indexMapper = createMockIndexMapper([2, 0, 1]);
    const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine));

    axisSyncer.setOrderHeld(true);
    axisSyncer.adoptEngineOrder({ sequence: [2, 0, 1], fillSequence: null });
    axisSyncer.setOrderHeld(false);
    axisSyncer.setOrderHeld(true);
    axisSyncer.storeMovesInformation([0], 2, true);
    indexMapper.state.indexesSequence = [0, 1, 2];
    axisSyncer.getIndexesChangeSyncMethod()('move');
    axisSyncer.calculateAndSyncMoves(true, true);

    expect(engine.calls.map(([method]) => method)).toEqual(['moveRows']);
  });
});
