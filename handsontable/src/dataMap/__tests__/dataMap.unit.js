import DataMap from 'handsontable/dataMap/dataMap';
import Handsontable from 'handsontable/base';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();

describe('DataMap', () => {
  describe('filterData', () => {
    /**
     * Builds the minimal context `filterData` needs: a hot mock whose `filterData` hook
     * returns its first argument (the default hook behavior) and a data source array.
     *
     * @param {number} rowCount The number of single-cell rows to create in the data source.
     * @returns {object}
     */
    function createFilterDataContext(rowCount) {
      const dataSource = [];

      for (let i = 0; i < rowCount; i++) {
        dataSource.push([i]);
      }

      return {
        hot: {
          runHooks: (name, firstArg) => firstArg,
        },
        dataSource,
      };
    }

    it('should remove the given physical rows from the data source', () => {
      const context = createFilterDataContext(5);

      DataMap.prototype.filterData.call(context, 1, 2, [1, 2]);

      expect(context.dataSource).toEqual([[0], [3], [4]]);
    });

    it('should not overflow the call stack when the data source holds hundreds of thousands of rows', () => {
      const context = createFilterDataContext(300000);

      expect(() => {
        DataMap.prototype.filterData.call(context, 0, 1, [0]);
      }).not.toThrow();

      expect(context.dataSource.length).toBe(299999);
      expect(context.dataSource[0]).toEqual([1]);
      expect(context.dataSource[299998]).toEqual([299999]);
    });
  });
});

describe('DataMap.get with function column accessors', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
  });

  it('should return null and not call the accessor when the row index maps past the source data', () => {
    const accessor = jest.fn(row => row.value);

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [{ value: 'A1' }, { value: 'A2' }],
      dataSchema: () => ({ value: null }),
      columns: [{ data: accessor }],
    });

    accessor.mockClear();
    // Reproduces the transient state RemoveRowAction.undo creates: the mapper is one index
    // longer than the source array until alter() splices the row in.
    hot.rowIndexMapper.setIndexesSequence([0, 1, 2]);

    expect(hot.getDataAtCell(2, 0)).toBe(null);
    expect(accessor).not.toHaveBeenCalledWith(undefined);
  });
});

describe('DataMap.get/set with function column accessors and `modifyRowData`', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
  });

  it('should read through the row swapped in by the `modifyRowData` hook', () => {
    const swappedRow = { value: 'swapped' };

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [{ value: 'A1' }, { value: 'A2' }],
      columns: [{ data: row => row.value }],
      modifyRowData(physicalRow) {
        return physicalRow === 1 ? swappedRow : undefined;
      },
    });

    expect(hot.getDataAtCell(0, 0)).toBe('A1');
    expect(hot.getDataAtCell(1, 0)).toBe('swapped');
  });

  it('should write through the row swapped in by the `modifyRowData` hook', () => {
    const swappedRow = { value: 'swapped' };
    const sourceRows = [{ value: 'A1' }, { value: 'A2' }];

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: sourceRows,
      columns: [{
        data: (row, value) => {
          if (value === undefined) {
            return row.value;
          }

          row.value = value;
        },
      }],
      modifyRowData(physicalRow) {
        return physicalRow === 1 ? swappedRow : undefined;
      },
    });

    hot.setDataAtCell(1, 0, 'changed');

    expect(swappedRow.value).toBe('changed');
    expect(sourceRows[1].value).toBe('A2');
  });

  it('should not call the accessor on write when the row index maps past the source data', () => {
    const accessor = jest.fn((row, value) => {
      if (value === undefined) {
        return row.value;
      }

      row.value = value;
    });

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [{ value: 'A1' }, { value: 'A2' }],
      dataSchema: () => ({ value: null }),
      columns: [{ data: accessor }],
    });

    accessor.mockClear();
    // The same transient mid-undo state as the read-path test above.
    hot.rowIndexMapper.setIndexesSequence([0, 1, 2]);

    expect(() => hot.setDataAtCell(2, 0, 'changed')).not.toThrow();
    expect(accessor).not.toHaveBeenCalledWith(undefined, 'changed');
  });
});

describe('DataMap.getAtColumnForRows', () => {
  // These run against a hand-built context rather than a live grid on purpose. In jsdom every row is
  // rendered, so every cell ends up carrying stored meta and the per-row fallback alone would make
  // any value come out right - which would leave the column-layer probe untested. Here the stored
  // meta is exactly what each case declares.
  /**
   * Builds the minimal context `getAtColumnForRows` needs.
   *
   * @param {object} [options] Case options.
   * @param {Array} [options.dataSource] The data source rows.
   * @param {object} [options.columnMeta] The column meta layer the probe reads.
   * @param {object} [options.storedMeta] Stored cell meta keyed by physical row index.
   * @param {string[]} [options.hooks] Hook names that have a listener.
   * @param {boolean} [options.dataDotNotation] The `dataDotNotation` setting.
   * @param {string|number|Function} [options.prop] The property the column resolves to.
   * @returns {object}
   */
  function createColumnReadContext({
    dataSource = [['A'], ['B'], ['C']],
    columnMeta = {},
    storedMeta = {},
    hooks = [],
    dataDotNotation = true,
    prop = 0,
  } = {}) {
    const perCellReads = [];

    return {
      dataSource,
      perCellReads,
      colToProp: () => prop,
      propToCol: () => 0,
      get(row) {
        perCellReads.push(row);

        return `per-cell:${row}`;
      },
      hot: {
        toPhysicalColumn: column => column,
        // Identity mapping, so a fallback that translates a physical row back to a visual one lands
        // on the row it was given.
        toVisualRow: physicalRow => physicalRow,
        getSettings: () => ({ dataDotNotation }),
        hasHook: hookName => hooks.includes(hookName),
      },
      metaManager: {
        getColumnMeta: () => columnMeta,
        getCellMetaIfExists: physicalRow => storedMeta[physicalRow],
      },
    };
  }

  /**
   * Calls the accessor on a hand-built context.
   *
   * @param {object} context The context built by `createColumnReadContext`.
   * @param {Array} physicalRows Physical row indexes.
   * @returns {Array}
   */
  function readColumn(context, physicalRows = [0, 1, 2]) {
    return DataMap.prototype.getAtColumnForRows.call(context, 0, physicalRows);
  }

  it('should read the source rows directly when no probe fires', () => {
    const context = createColumnReadContext();

    expect(readColumn(context)).toEqual(['A', 'B', 'C']);
    expect(context.perCellReads).toEqual([]);
  });

  it('should fall back to the per-cell path when the column layer declares a `valueGetter`', () => {
    // No cell here has stored meta, so only the column-layer probe can catch this. A `dropdown`,
    // `autocomplete` or `multiSelect` column reaches exactly this state for every unrendered row.
    const context = createColumnReadContext({ columnMeta: { valueGetter: value => value } });

    expect(readColumn(context)).toEqual(['per-cell:0', 'per-cell:1', 'per-cell:2']);
    expect(context.perCellReads).toEqual([0, 1, 2]);
  });

  it('should fall back for the rows that carry stored cell meta, and only those', () => {
    const context = createColumnReadContext({ storedMeta: { 1: { valueGetter: value => value } } });

    expect(readColumn(context)).toEqual(['A', 'per-cell:1', 'C']);
    expect(context.perCellReads).toEqual([1]);
  });

  it('should fall back for a stored meta object that declares nothing', () => {
    // The probe asks whether meta is stored, not what it holds: `getCellMetaUncached()` returns the
    // stored object itself, so anything on it - including a `valueGetter` assigned later - applies.
    const context = createColumnReadContext({ storedMeta: { 2: {} } });

    expect(readColumn(context)).toEqual(['A', 'B', 'per-cell:2']);
  });

  it('should fall back for a `columns[].data` accessor function', () => {
    const context = createColumnReadContext({ prop: row => row[0] });

    expect(context.perCellReads).toEqual([]);
    expect(readColumn(context)).toEqual(['per-cell:0', 'per-cell:1', 'per-cell:2']);
  });

  it('should fall back for a dot-notation property when `dataDotNotation` is on', () => {
    const context = createColumnReadContext({ prop: 'nested.label' });

    expect(readColumn(context)).toEqual(['per-cell:0', 'per-cell:1', 'per-cell:2']);
  });

  it('should read directly for a dotted property when `dataDotNotation` is off', () => {
    const context = createColumnReadContext({
      prop: 'nested.label',
      dataDotNotation: false,
      dataSource: [{ 'nested.label': 'A' }, { 'nested.label': 'B' }, { 'nested.label': 'C' }],
    });

    expect(readColumn(context)).toEqual(['A', 'B', 'C']);
  });

  it.each(['modifyRowData', 'modifyData', 'modifySourceData'])(
    'should fall back when the `%s` hook has a listener',
    (hookName) => {
      const context = createColumnReadContext({ hooks: [hookName] });

      expect(readColumn(context)).toEqual(['per-cell:0', 'per-cell:1', 'per-cell:2']);
    }
  );

  it('should read a row with no source data as empty', () => {
    const context = createColumnReadContext({ dataSource: [['A']] });

    expect(readColumn(context, [0, 1, null])).toEqual(['A', null, null]);
    expect(context.perCellReads).toEqual([]);
  });

  it('should read a missing property as empty', () => {
    const context = createColumnReadContext({
      prop: 'label',
      dataSource: [{ label: 'A' }, {}, { label: 'C' }],
    });

    expect(readColumn(context)).toEqual(['A', null, 'C']);
  });

  it('should follow the physical row indexes it is given, in the order given', () => {
    const context = createColumnReadContext();

    expect(readColumn(context, [2, 0])).toEqual(['C', 'A']);
  });

  it('should follow the same row indexes when the whole column falls back to the per-cell path', () => {
    // `physicalRows` is the only row source. A fallback that walked the block as a contiguous visual
    // band would read rows 0 and 1 here, so the two paths would answer for different rows.
    const context = createColumnReadContext({ columnMeta: { valueGetter: value => value } });

    expect(readColumn(context, [2, 0])).toEqual(['per-cell:2', 'per-cell:0']);
    expect(context.perCellReads).toEqual([2, 0]);
  });

  it('should follow the same row indexes when a single row falls back to the per-cell path', () => {
    const context = createColumnReadContext({ storedMeta: { 0: { valueGetter: value => value } } });

    expect(readColumn(context, [2, 0])).toEqual(['C', 'per-cell:0']);
    expect(context.perCellReads).toEqual([0]);
  });
});
