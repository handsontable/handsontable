import AxisSyncer from '../../indexSyncer/axisSyncer';

/**
 * Builds an index mapper stub whose sequence a test can replace and whose local hooks a test can run.
 *
 * @param {number[]} indexesSequence The starting sequence.
 * @returns {object}
 */
function createMockIndexMapper(indexesSequence) {
  const hooks = {};
  const mapper = {
    state: { indexesSequence },
    getIndexesSequence: () => mapper.state.indexesSequence,
    getNotTrimmedIndexes: () => mapper.state.indexesSequence,
    getNumberOfIndexes: () => mapper.state.indexesSequence.length,
    addLocalHook: (name, callback) => {
      hooks[name] = callback;
    },
    runLocalHook: (name, ...args) => hooks[name]?.(...args),
  };

  return mapper;
}

/**
 * Builds an axis syncer over a three-row engine stub that takes every order it is handed.
 *
 * @param {number[]} sequence The grid's starting sequence.
 * @returns {object}
 */
function createAxisSyncer(sequence = [0, 1, 2]) {
  const engine = {
    batch: callback => callback(),
    moveRows: () => {},
    setRowOrder: () => {},
    isItPossibleToSetRowOrder: () => true,
    isCellEmpty: () => false,
    getSheetDimensions: () => ({ width: 1, height: 3 }),
    getSheetName: () => 'Sheet1',
  };
  const indexMapper = createMockIndexMapper(sequence);
  const axisSyncer = new AxisSyncer('row', indexMapper, {
    getEngine: () => engine,
    getSheetId: () => 0,
    getPostponeAction: () => () => {},
    getOwnEngineWrite: () => (_, fn) => fn(),
  });

  /**
   * Gives the grid a new sequence and runs the syncer's sequence change callback for it.
   *
   * @param {number[]} nextSequence The new sequence.
   * @param {string} source The change's source.
   */
  const changeSequence = (nextSequence, source) => {
    indexMapper.state.indexesSequence = nextSequence;
    axisSyncer.getIndexesChangeSyncMethod()(source);
  };

  return { axisSyncer, indexMapper, changeSequence };
}

/**
 * Reads the order shift of every physical row of a three-row axis.
 *
 * @param {AxisSyncer} axisSyncer The syncer.
 * @returns {number[]}
 */
function shiftsOf(axisSyncer) {
  return [0, 1, 2].map(physicalRow => axisSyncer.getOrderShift(physicalRow));
}

describe('AxisSyncer order shifts', () => {
  it('records how far an order the engine is handed moved each row', () => {
    const { axisSyncer, changeSequence } = createAxisSyncer();

    changeSequence([2, 0, 1], 'update');

    expect(shiftsOf(axisSyncer)).toEqual([1, 1, -2]);
  });

  it('records nothing for a move, which keeps every reference on its cell', () => {
    const { axisSyncer, changeSequence } = createAxisSyncer();

    changeSequence([2, 0, 1], 'move');

    expect(shiftsOf(axisSyncer)).toEqual([0, 0, 0]);
  });

  it('records only what the order moved on a sheet that was moved first', () => {
    const { axisSyncer, changeSequence } = createAxisSyncer();

    changeSequence([2, 0, 1], 'move');
    changeSequence([2, 1, 0], 'update');

    expect(shiftsOf(axisSyncer)).toEqual([1, -1, 0]);
  });

  it('forgets the shifts once the engine holds its rows in physical order again', () => {
    const { axisSyncer, changeSequence } = createAxisSyncer();

    changeSequence([2, 0, 1], 'move');
    changeSequence([0, 1, 2], 'update');
    changeSequence([1, 0, 2], 'move');

    expect(shiftsOf(axisSyncer)).toEqual([0, 0, 0]);
  });

  it('keeps each shift on its row when a row is inserted or removed', () => {
    const { axisSyncer, indexMapper, changeSequence } = createAxisSyncer();

    changeSequence([2, 0, 1], 'update');
    indexMapper.runLocalHook('indexesInserted', [0]);

    expect([0, 1, 2, 3].map(physicalRow => axisSyncer.getOrderShift(physicalRow))).toEqual([0, 1, 1, -2]);

    indexMapper.runLocalHook('indexesRemoved', [1]);

    expect(shiftsOf(axisSyncer)).toEqual([0, 1, -2]);
  });

  it('carries the shifts through getEngineOrder() and adoptEngineOrder()', () => {
    const { axisSyncer, changeSequence } = createAxisSyncer();

    changeSequence([2, 0, 1], 'update');

    const order = axisSyncer.getEngineOrder();
    const other = createAxisSyncer([2, 0, 1]).axisSyncer;

    other.setOrderHeld(true);
    other.adoptEngineOrder(order);

    expect(shiftsOf(other)).toEqual([1, 1, -2]);
  });
});
