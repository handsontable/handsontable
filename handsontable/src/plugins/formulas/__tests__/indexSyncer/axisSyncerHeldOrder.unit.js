import AxisSyncer from '../../indexSyncer/axisSyncer';

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

  it('sends no move and keeps the engine order, and sends the order the grid ends on once released', () => {
    const engine = createRecordingEngine();
    const indexMapper = createMockIndexMapper([0, 1, 2]);
    const axisSyncer = new AxisSyncer('row', indexMapper, createMockIndexSyncer(engine));

    axisSyncer.adoptEngineOrder({ sequence: [2, 0, 1], fillSequence: null });
    axisSyncer.setOrderHeld(true);
    axisSyncer.storeMovesInformation([0, 1, 2], 0, true);
    indexMapper.state.indexesSequence = [2, 0, 1];
    axisSyncer.getIndexesChangeSyncMethod()('move');
    axisSyncer.calculateAndSyncMoves(true, true);

    expect(engine.calls).toEqual([]);
    expect(axisSyncer.getEngineOrder().sequence).toEqual([2, 0, 1]);

    axisSyncer.setOrderHeld(false);

    expect(engine.calls).toEqual([]);
  });
});
