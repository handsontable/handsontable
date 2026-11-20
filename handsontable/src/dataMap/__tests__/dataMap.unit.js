import DataMap from 'handsontable/dataMap/dataMap';
import Handsontable from 'handsontable/base';
import { registerAllCellTypes } from 'handsontable/registry';
import { ColumnSorting, registerPlugin } from 'handsontable/plugins';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

registerAllCellTypes();
registerPlugin(ColumnSorting);

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
      licenseKey: TEST_LICENSE_KEY,
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
      licenseKey: TEST_LICENSE_KEY,
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
      licenseKey: TEST_LICENSE_KEY,
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
      licenseKey: TEST_LICENSE_KEY,
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

describe('DataMap duck columns for nested object data without `columns`', () => {
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

  /**
   * @param {object[]} data The source data.
   * @returns {Handsontable} A grid with no `columns` option.
   */
  function createGrid(data) {
    return new Handsontable(container, { licenseKey: TEST_LICENSE_KEY, data });
  }

  it('should name a column nested two levels deep by its full path', () => {
    hot = createGrid([{ id: 1, a: { b: { c: 'deep0' }, x: 'ax0' } }, { id: 2, a: { b: { c: 'deep1' }, x: 'ax1' } }]);

    expect(hot.countCols()).toBe(3);
    expect(hot.colToProp(0)).toBe('id');
    expect(hot.colToProp(1)).toBe('a.b.c');
    expect(hot.colToProp(2)).toBe('a.x');
    expect(hot.propToCol('a.b.c')).toBe(1);
  });

  it('should read the nested value through the column', () => {
    hot = createGrid([{ id: 1, a: { b: { c: 'deep0' }, x: 'ax0' } }, { id: 2, a: { b: { c: 'deep1' }, x: 'ax1' } }]);

    expect(hot.getDataAtRow(0)).toEqual([1, 'deep0', 'ax0']);
    expect(hot.getDataAtCol(1)).toEqual(['deep0', 'deep1']);
  });

  it('should write an edit back to the nested path and add no top-level key', () => {
    const data = [{ id: 1, a: { b: { c: 'deep0' }, x: 'ax0' } }];

    hot = createGrid(data);
    hot.setDataAtCell(0, 1, 'EDITED');

    expect(data[0].a.b.c).toBe('EDITED');
    expect(Object.keys(data[0]).sort()).toEqual(['a', 'id']);
    expect(hot.getDataAtCell(0, 1)).toBe('EDITED');
  });

  it('should keep every parent in the path for a property nested four levels deep', () => {
    hot = createGrid([{ p: { q: { r: { s: 'leaf' } } } }]);

    expect(hot.colToProp(0)).toBe('p.q.r.s');
    expect(hot.getDataAtCell(0, 0)).toBe('leaf');
  });

  it('should keep naming a column nested one level deep by its path', () => {
    hot = createGrid([{ a: { x: 'ax0' } }]);

    expect(hot.colToProp(0)).toBe('a.x');
    expect(hot.getDataAtCell(0, 0)).toBe('ax0');
  });

  it('should keep resolving a nested path declared in `columns`', () => {
    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: [{ a: { b: { c: 'deep0' } } }],
      columns: [{ data: 'a.b.c' }],
    });

    expect(hot.colToProp(0)).toBe('a.b.c');
    expect(hot.getDataAtCell(0, 0)).toBe('deep0');
  });

  it('should keep the sibling order and indexes when nested groups sit between other keys', () => {
    hot = createGrid([{ a: { b: { c: 1 } }, d: { e: { f: 2 } }, z: 3 }]);

    expect([0, 1, 2, 3].map(col => hot.colToProp(col))).toEqual(['a.b.c', 'd.e.f', 'z', null]);
    expect(hot.propToCol('d.e.f')).toBe(1);
    expect(hot.propToCol('z')).toBe(2);
    expect(hot.getDataAtRow(0)).toEqual([1, 2, 3]);
  });

  it('should name columns nested two levels deep by full path when they come from `dataSchema`', () => {
    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: [],
      dataSchema: { a: { b: { c: null } }, id: null },
      minSpareRows: 1,
    });

    expect(hot.colToProp(0)).toBe('a.b.c');
    expect(hot.colToProp(1)).toBe('id');
  });

  it('should read a nested column as `null` and not throw when a parent is `null` in some rows', () => {
    hot = createGrid([{ a: { b: { c: 'deep0' } } }, { a: { b: null } }, { a: null }, { a: { b: { c: null } } }]);

    expect(hot.colToProp(0)).toBe('a.b.c');
    expect(hot.getDataAtCol(0)).toEqual(['deep0', null, null, null]);
    expect(hot.getDataAtRowProp(1, 'a.b.c')).toBe(null);
  });

  it('should write into a nested column whose parent is `null` in that row', () => {
    const data = [{ a: { b: { c: 'deep0' } } }, { a: { b: null } }, { a: null }];

    hot = createGrid(data);
    hot.setDataAtCell(1, 0, 'one');
    hot.setDataAtCell(2, 0, 'two');

    expect(data[1].a.b.c).toBe('one');
    expect(data[2].a.b.c).toBe('two');
    expect(hot.getDataAtCol(0)).toEqual(['deep0', 'one', 'two']);
  });
});

describe('DataMap with a `dataSchema` and no `columns` option', () => {
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

  /**
   * Builds a grid from object data and a schema, without `columns`.
   *
   * @param {object} dataSchema The schema.
   * @param {object[]} data The data rows.
   * @param {object} [settings] Extra settings.
   */
  function build(dataSchema, data, settings = {}) {
    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data,
      dataSchema,
      ...settings,
    });
  }

  it.each([
    ['number', 0, 7],
    ['string', 'x', 'a'],
    ['boolean', false, true],
    ['undefined', undefined, 'a'],
  ])('should register a column for a `%s` schema leaf', (_, leaf, value) => {
    build({ id: leaf, name: null }, [{ id: value, name: 'n' }]);

    expect(hot.countCols()).toBe(2);
    expect(hot.colToProp(0)).toBe('id');
    expect(hot.colToProp(1)).toBe('name');
    expect(hot.getDataAtRow(0)).toEqual([value, 'n']);
  });

  it('should register every leaf of a schema holding only non-null defaults', () => {
    build({ id: 0, name: 'x' }, [{ id: 1, name: 'a' }]);

    expect(hot.countCols()).toBe(2);
    expect(hot.getDataAtRow(0)).toEqual([1, 'a']);
  });

  it('should register nested non-null leaves under their full property path', () => {
    build({ a: { b: 'x' }, id: 0 }, [{ id: 1, a: { b: 'deep' } }]);

    expect(hot.colToProp(0)).toBe('a.b');
    expect(hot.colToProp(1)).toBe('id');
    expect(hot.getDataAtRow(0)).toEqual(['deep', 1]);
  });

  it('should write an edit back through a column bound to a non-null schema leaf', () => {
    build({ id: 0, name: 'x' }, [{ id: 1, name: 'a' }]);

    hot.setDataAtCell(0, 1, 'changed');

    expect(hot.getSourceDataAtRow(0)).toEqual({ id: 1, name: 'changed' });
  });

  it('should keep an array leaf unregistered, as before', () => {
    build({ id: 0, tags: [] }, [{ id: 1, tags: [] }]);

    expect(hot.colToProp(0)).toBe('id');
  });

  it.each([
    ['function', () => 1, () => 2],
    ['Date', new Date(2020, 0, 1), new Date(2021, 0, 1)],
    ['Map', new Map(), new Map()],
  ])('should keep a `%s` leaf unregistered, so typing there never replaces the value', (_, leaf, value) => {
    build({ id: 0, extra: leaf }, [{ id: 1, extra: value }]);

    expect(hot.colToProp(0)).toBe('id');
    expect(hot.getDataAtRow(0)[0]).toBe(1);
  });

  it('should not register a column for the `__children` key', () => {
    build({ id: 0, __children: null }, [{ id: 1 }]);

    expect(hot.countCols()).toBe(1);
    expect(hot.colToProp(0)).toBe('id');
  });

  it('should register the leaves of a `dataSchema` given as a function', () => {
    build(() => ({ id: 0, name: 'x' }), [{ id: 1, name: 'a' }]);

    expect(hot.getDataAtRow(0)).toEqual([1, 'a']);
  });

  it('should keep mapping `null` leaves and a schema derived from the data', () => {
    build({ id: null, name: null }, [{ id: 1, name: 'a' }]);

    expect(hot.getDataAtRow(0)).toEqual([1, 'a']);

    hot.destroy();
    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: [{ id: 1, nested: { name: 'a' } }],
    });

    expect(hot.getDataAtRow(0)).toEqual([1, 'a']);
  });

  it('should keep a spare row holding only schema defaults empty, with readable columns', () => {
    build({ id: 0, name: 'x' }, [{ id: 1, name: 'a' }], { minSpareRows: 2 });

    expect(hot.countRows()).toBe(3);
    expect(hot.countEmptyRows(true)).toBe(2);
    expect(hot.getDataAtRow(1)).toEqual([0, 'x']);

    hot.setDataAtCell(0, 1, 'edited');

    expect(hot.countRows()).toBe(3);
  });

  it('should keep a spare row of a function `dataSchema` empty when a default depends on the row index', () => {
    build(index => ({ index, name: null }), [{ index: 0, name: 'a' }], { minSpareRows: 1 });

    expect(hot.countRows()).toBe(2);
    expect(hot.countEmptyRows(true)).toBe(1);

    hot.setDataAtCell(0, 1, 'edited');

    expect(hot.countRows()).toBe(2);
  });
});

describe('DataMap column modification errors', () => {
  const CREATE_COLUMN_ERROR =
    'Cannot create a new column when the data source holds objects or the "columns" option is set. ' +
    'You can only have as many columns as defined in the first data row, the data schema, ' +
    'or the "columns" setting. To add new columns, use an array data source without the "columns" option.';
  const REMOVE_COLUMN_ERROR =
    'Cannot remove a column when the data source holds objects or the "columns" option is set.';
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot.destroy();
    hot = null;
    container.remove();
  });

  describe.each([
    ['an array of objects', { data: [{ name: 'a' }, { name: 'b' }], columns: [{ data: 'name' }] }],
    ['an array of arrays with the `columns` option', { data: [['a'], ['b']], columns: [{}] }],
  ])('with %s', (name, settings) => {
    beforeEach(() => {
      hot = new Handsontable(container, { licenseKey: TEST_LICENSE_KEY, ...settings });
    });

    it('should explain why a column cannot be created', () => {
      expect(() => hot.alter('insert_col_end')).toThrow(CREATE_COLUMN_ERROR);
      expect(() => hot.alter('insert_col_start', 0)).toThrow(CREATE_COLUMN_ERROR);
    });

    it('should explain why a column cannot be removed', () => {
      expect(() => hot.alter('remove_col', 0)).toThrow(REMOVE_COLUMN_ERROR);
    });
  });
});

describe('DataMap bulk reads through `getRange()`', () => {
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

  /**
   * Creates a grid and drops the cell meta its first render stored. In jsdom every cell is rendered,
   * so without this each cell would carry stored meta - the state only the rendered rows of a large
   * grid are in.
   *
   * @param {object} settings Grid settings.
   * @returns {Handsontable}
   */
  function createUnrenderedGrid(settings) {
    const instance = new Handsontable(container, { licenseKey: TEST_LICENSE_KEY, ...settings });

    instance._getMetaManager().clearCellsCache();

    return instance;
  }

  it('should not create a cell meta object for a cell with no stored meta and no `valueGetter`', () => {
    hot = createUnrenderedGrid({ data: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']] });

    const createTransientMeta = jest.spyOn(hot._getMetaManager().cellMeta, 'createTransientMeta');

    expect(hot.getData()).toEqual([['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']]);
    expect(createTransientMeta).not.toHaveBeenCalled();
  });

  it('should look a cell with stored meta up once, its own `valueGetter` included', () => {
    hot = createUnrenderedGrid({ data: [['A1', 'B1'], ['A2', 'B2']] });
    hot.setCellMeta(0, 0, 'className', 'marked');
    hot.setCellMeta(1, 1, 'valueGetter', value => value.toLowerCase());

    const metaManager = hot._getMetaManager();
    const getCellMetaIfExists = jest.spyOn(metaManager, 'getCellMetaIfExists');
    const getCellMetaUncached = jest.spyOn(metaManager, 'getCellMetaUncached');

    expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'b2']]);
    expect(getCellMetaIfExists).toHaveBeenCalledTimes(4);
    expect(getCellMetaUncached).not.toHaveBeenCalled();
  });

  it('should stamp the current coordinates on stored meta it reads, after the rows moved', () => {
    hot = createUnrenderedGrid({ data: [['A1'], ['A2'], ['A3']] });

    for (let row = 0; row < 3; row++) {
      hot.setCellMeta(row, 0, 'className', 'marked');
    }

    hot.rowIndexMapper.setIndexesSequence([2, 0, 1]);
    hot.getData();

    const visualRowOf = physicalRow => hot.getCellsMeta().find(meta => meta.row === physicalRow).visualRow;

    expect([visualRowOf(0), visualRowOf(1), visualRowOf(2)]).toEqual([1, 2, 0]);
  });

  it('should resolve each column\'s property once per read, not once per cell', () => {
    hot = createUnrenderedGrid({
      data: [{ a: 1, b: 2 }, { a: 3, b: 4 }, { a: 5, b: 6 }],
      columns: [{ data: 'a' }, { data: 'b' }],
    });

    const colToProp = jest.spyOn(hot, 'colToProp');

    expect(hot.getData()).toEqual([[1, 2], [3, 4], [5, 6]]);
    expect(colToProp).toHaveBeenCalledTimes(2);
  });

  it('should apply a `valueGetter` declared at the column level', () => {
    hot = createUnrenderedGrid({
      data: [['A1', 'B1'], ['A2', 'B2']],
      columns: [{}, { valueGetter: (value, row, column) => `${value}@${row},${column}` }],
    });

    expect(hot.getData()).toEqual([['A1', 'B1@0,1'], ['A2', 'B2@1,1']]);
  });

  it('should apply a `valueGetter` declared at the grid level', () => {
    hot = createUnrenderedGrid({
      data: [['A1', 'B1'], ['A2', 'B2']],
      valueGetter: value => `<${value}>`,
    });

    expect(hot.getData()).toEqual([['<A1>', '<B1>'], ['<A2>', '<B2>']]);
  });

  it('should apply a `valueGetter` stored on a single cell, and only to that cell', () => {
    hot = createUnrenderedGrid({ data: [['A1', 'B1'], ['A2', 'B2']] });
    hot.setCellMeta(1, 0, 'valueGetter', (value, row, column) => `${value}@${row},${column}`);

    expect(hot.getData()).toEqual([['A1', 'B1'], ['A2@1,0', 'B2']]);
  });

  it('should apply a `valueGetter` declared through the `cell` option', () => {
    // Built without dropping the stored meta: the `cell` option is stored meta, and clearing it would
    // remove the entry under test.
    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: [['A1', 'B1'], ['A2', 'B2']],
      cell: [{ row: 0, col: 1, valueGetter: value => value.toLowerCase() }],
    });

    expect(hot.getData()).toEqual([['A1', 'b1'], ['A2', 'B2']]);
  });

  it('should run `modifyData` once per cell with the visual coordinates', () => {
    const calls = [];

    hot = createUnrenderedGrid({
      data: [['A1', 'B1'], ['A2', 'B2']],
      modifyData(row, column, valueHolder, ioMode) {
        calls.push([row, column, valueHolder.value, ioMode]);

        if (row === 1 && column === 1) {
          valueHolder.value = 'changed';
        }
      },
    });

    calls.length = 0;

    expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'changed']]);
    expect(calls).toEqual([
      [0, 0, 'A1', 'get'], [0, 1, 'B1', 'get'],
      [1, 0, 'A2', 'get'], [1, 1, 'B2', 'get'],
    ]);
  });

  it('should run `modifyRowData` once per cell and read through the row it returns', () => {
    const modifyRowData = jest.fn(physicalRow => (physicalRow === 0 ? ['X1', 'Y1'] : undefined));

    hot = createUnrenderedGrid({ data: [['A1', 'B1'], ['A2', 'B2']], modifyRowData });
    modifyRowData.mockClear();

    expect(hot.getData()).toEqual([['X1', 'Y1'], ['A2', 'B2']]);
    expect(modifyRowData).toHaveBeenCalledTimes(4);
  });

  it('should hand `modifyData` the column the property resolves to when two columns share a property', () => {
    const columns = [];

    hot = createUnrenderedGrid({
      data: [{ a: 1 }, { a: 2 }],
      columns: [{ data: 'a' }, { data: 'a' }],
      modifyData(row, column) {
        columns.push(column);
      },
    });

    const resolvedColumn = hot.propToCol('a');

    columns.length = 0;

    expect(hot.getData()).toEqual([[1, 1], [2, 2]]);
    expect(columns).toEqual([resolvedColumn, resolvedColumn, resolvedColumn, resolvedColumn]);
  });

  it('should read through a `columns[].data` accessor function and a dot-notation property', () => {
    hot = createUnrenderedGrid({
      data: [{ name: { first: 'Ann' }, age: 30 }, { name: { first: 'Bob' }, age: 40 }],
      columns: [{ data: 'name.first' }, { data: row => row.age * 2 }],
    });

    expect(hot.getData()).toEqual([['Ann', 60], ['Bob', 80]]);
  });

  it('should follow trimmed rows and moved columns', () => {
    hot = createUnrenderedGrid({
      data: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2'], ['A3', 'B3', 'C3']],
      columns: [{}, {}, { valueGetter: value => value.toLowerCase() }],
    });

    const trimmingMap = hot.rowIndexMapper.createAndRegisterIndexMap('bulkReadTest', 'trimming', false);

    hot.batchExecution(() => {
      trimmingMap.setValueAtIndex(1, true);
      hot.columnIndexMapper.setIndexesSequence([2, 0, 1]);
    }, true);
    // The batch rendered again, so drop that meta too: the column-level `valueGetter` must be found
    // through the column layer, not through meta the render stored.
    hot._getMetaManager().clearCellsCache();

    expect(hot.getData()).toEqual([['c1', 'A1', 'B1'], ['c3', 'A3', 'B3']]);
  });

  it('should run a `modifyData` listener added during a read from that cell on', () => {
    const listener = jest.fn();
    let added = false;

    hot = createUnrenderedGrid({
      data: [['A1', 'B1'], ['A2', 'B2']],
      columns: [{
        valueGetter(value) {
          if (!added) {
            added = true;
            // `this` is the grid: the first render runs this before the constructor returns.
            this.addHook('modifyData', listener);
          }

          return value;
        },
      }, {}],
    });

    added = false;
    hot.removeHook('modifyData', listener);
    listener.mockClear();

    expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'B2']]);
    // The first cell's `valueGetter` adds the listener before that cell's `modifyData` check.
    expect(listener.mock.calls.map(([row, column]) => [row, column])).toEqual([[0, 0], [0, 1], [1, 0], [1, 1]]);
  });

  it('should read a header row through its own translation', () => {
    const modifyRowDataRows = [];

    hot = createUnrenderedGrid({
      data: [['A1', 'B1'], ['A2', 'B2']],
      modifyRowData(physicalRow) {
        modifyRowDataRows.push(physicalRow);
      },
    });

    modifyRowDataRows.length = 0;

    expect(hot.getData(-1, 0, 0, 1)).toEqual([[null, null], ['A1', 'B1']]);
    expect(modifyRowDataRows).toEqual([null, null, 0, 0]);
  });

  it('should read a dotted property as a flat key when `dataDotNotation` is off', () => {
    hot = createUnrenderedGrid({
      dataDotNotation: false,
      data: [{ 'name.first': 'flat', name: { first: 'nested' } }],
      columns: [{ data: 'name.first' }],
    });

    expect(hot.getData()).toEqual([['flat']]);
  });

  it('should leave a cell the `cells` function marks not copyable out of the copied text', () => {
    hot = createUnrenderedGrid({
      data: [['A1', 'B1'], ['A2', 'B2']],
      cells(row, column) {
        return row === 1 && column === 0 ? { copyable: false } : {};
      },
    });

    expect(hot.getCopyableText(0, 0, 1, 1)).toBe('A1\tB1\n\tB2');
    expect(hot.getData(0, 0, 1, 1)).toEqual([['A1', 'B1'], ['A2', 'B2']]);
  });
});

describe('DataMap reads of a `valueGetter` set through the `cells` function', () => {
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

  /**
   * Creates a grid with `applyCellsToDataReads` on (unless `settings` says otherwise) and drops the
   * cell meta its first render stored, and the record of which cells were extended, which is the state
   * of every row a large grid has not rendered, or has evicted after a scroll.
   *
   * @param {object} settings Grid settings.
   * @returns {Handsontable}
   */
  function createUnrenderedGrid(settings) {
    const instance = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      applyCellsToDataReads: true,
      ...settings,
    });
    const metaManager = instance._getMetaManager();

    metaManager.clearCellsCache();
    metaManager.invalidateMetaExtensions();

    return instance;
  }

  /**
   * A `cells` function that gives the first column a `valueGetter` and leaves the others alone.
   *
   * @param {number} row The physical row index.
   * @param {number} column The physical column index.
   * @returns {object}
   */
  function prefixFirstColumn(row, column) {
    return column === 0 ? { valueGetter: value => `X${value}` } : {};
  }

  it('should not call the `cells` function for a data read when `applyCellsToDataReads` is not set', () => {
    const cells = jest.fn(prefixFirstColumn);

    hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      data: [['A1', 'B1'], ['A2', 'B2']],
      cells,
    });
    hot._getMetaManager().clearCellsCache();
    hot._getMetaManager().invalidateMetaExtensions();
    cells.mockClear();

    expect(hot.getSettings().applyCellsToDataReads).toBe(false);
    expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'B2']]);
    expect(cells).not.toHaveBeenCalled();
  });

  it('should call the `cells` function only for the columns that turn `applyCellsToDataReads` on', () => {
    const cells = jest.fn((row, column) => ({ valueGetter: value => `${column}:${value}` }));

    hot = createUnrenderedGrid({
      data: [['A1', 'B1'], ['A2', 'B2']],
      applyCellsToDataReads: false,
      columns: [{ applyCellsToDataReads: true }, {}],
      cells,
    });
    cells.mockClear();

    expect(hot.getData()).toEqual([['0:A1', 'B1'], ['0:A2', 'B2']]);
    expect(cells.mock.calls.map(call => call[1])).toEqual([0, 0]);
  });

  it('should keep the raw value of a column with `applyCellsToDataReads` off when sorting', () => {
    hot = createUnrenderedGrid({
      data: [[1], [2], [3]],
      applyCellsToDataReads: false,
      columnSorting: true,
      cells: () => ({ valueGetter: value => -value }),
    });

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect([0, 1, 2].map(row => hot.toPhysicalRow(row))).toEqual([0, 1, 2]);
  });

  it('should apply the getter to every read of a row without stored meta', () => {
    hot = createUnrenderedGrid({
      data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']],
      cells: prefixFirstColumn,
    });

    expect(hot.getDataAtCell(2, 0)).toBe('XA3');
    expect(hot.getDataAtCol(0)).toEqual(['XA1', 'XA2', 'XA3']);
    expect(hot.getDataAtRow(1)).toEqual(['XA2', 'B2']);
    expect(hot.getData()).toEqual([['XA1', 'B1'], ['XA2', 'B2'], ['XA3', 'B3']]);
  });

  it('should apply the getter of a `cells` function declared on a column', () => {
    hot = createUnrenderedGrid({
      data: [['A1', 'B1'], ['A2', 'B2']],
      columns: [{}, { cells: () => ({ valueGetter: value => value.toLowerCase() }) }],
    });

    expect(hot.getData()).toEqual([['A1', 'b1'], ['A2', 'b2']]);
  });

  it('should read a key/value dropdown the `cells` function sets as its label', () => {
    const source = [{ key: 'kg', value: 'Kilogram' }, { key: 'lb', value: 'Pound' }];

    hot = createUnrenderedGrid({
      data: [[source[0]], [source[1]]],
      cells: () => ({ type: 'dropdown', source }),
    });

    expect(hot.getDataAtCol(0)).toEqual(['Kilogram', 'Pound']);
  });

  it('should apply the getter to a cell whose stored meta was never extended', () => {
    hot = createUnrenderedGrid({
      data: [['A1'], ['A2']],
      cells: prefixFirstColumn,
    });

    hot.setCellMeta(1, 0, 'className', 'marked');

    expect(hot.getDataAtCell(1, 0)).toBe('XA2');
    expect(hot.getCellMeta(1, 0).className).toBe('marked');
  });

  it('should call the `cells` function once per cell a full read returns', () => {
    const cells = jest.fn(prefixFirstColumn);

    hot = createUnrenderedGrid({ data: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']], cells });
    cells.mockClear();

    hot.getData();

    expect(cells).toHaveBeenCalledTimes(6);
  });

  it('should copy the getter output of the rows a copy reads', () => {
    hot = createUnrenderedGrid({ data: [['A1', 'B1'], ['A2', 'B2']], cells: prefixFirstColumn });

    expect(hot.getCopyableText(0, 0, 1, 1)).toBe('XA1\tB1\nXA2\tB2');
  });

  it('should copy what `getData()` reads when a meta hook alone adds a getter', () => {
    hot = createUnrenderedGrid({
      data: [['A1'], ['A2']],
      cells: () => ({}),
      afterGetCellMeta(row, column, cellProperties) {
        cellProperties.valueGetter = value => `H${value}`;
      },
    });

    expect(hot.getCopyableData(1, 0)).toBe(String(hot.getDataAtCell(1, 0)));
  });

  it('should fire no meta hook for a data read, in a column with a `valueGetter` of its own too', () => {
    const source = [{ key: 'kg', value: 'Kilogram' }];
    const hookCalls = { before: 0, after: 0 };

    hot = createUnrenderedGrid({
      data: [[source[0]], [source[0]]],
      columns: [{ type: 'dropdown', source }],
      cells: () => ({}),
      beforeGetCellMeta() {
        hookCalls.before += 1;
      },
      afterGetCellMeta() {
        hookCalls.after += 1;
      },
    });
    hookCalls.before = 0;
    hookCalls.after = 0;

    expect(hot.getDataAtCol(0)).toEqual(['Kilogram', 'Kilogram']);
    expect(hookCalls).toEqual({ before: 0, after: 0 });
  });

  it('should leave stored meta as it was after a read', () => {
    hot = createUnrenderedGrid({ data: [['A1'], ['A2']], cells: () => ({ readOnly: true }) });
    hot.setCellMeta(0, 0, 'readOnly', false);

    const metaManager = hot._getMetaManager();

    metaManager.invalidateMetaExtensions();
    hot.getDataAtCell(0, 0);

    expect(metaManager.getCellMetaIfExists(0, 0).readOnly).toBe(false);
  });

  it('should not store cell meta for the cells a full read extends', () => {
    hot = createUnrenderedGrid({ data: [['A1', 'B1'], ['A2', 'B2']], cells: prefixFirstColumn });

    hot.getData();

    const metaManager = hot._getMetaManager();

    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 2; column++) {
        expect(metaManager.getCellMetaIfExists(row, column)).toBeUndefined();
      }
    }
  });

  it('should not recurse when the `cells` function reads the data of its own cell or another', () => {
    const readValues = [];

    hot = createUnrenderedGrid({
      data: [['A1', 'B1'], ['A2', 'B2']],
      cells(row, column) {
        readValues.push(this.instance.getDataAtCell(row, column), this.instance.getDataAtCell(row, 0));

        return prefixFirstColumn(row, column);
      },
    });
    readValues.length = 0;

    expect(hot.getDataAtCell(1, 0)).toBe('XA2');
    expect(hot.getDataAtCell(1, 1)).toBe('B2');
    expect(readValues).toEqual(['A2', 'A2', 'B2', 'A2']);
    expect(() => hot.render()).not.toThrow();
    expect(hot.getDataAtCell(0, 0)).toBe('XA1');
  });

  it('should not recurse when an `afterGetCellMeta` listener reads the data of the cell it extends', () => {
    const readValues = [];

    hot = createUnrenderedGrid({
      data: [['A1'], ['A2']],
      cells: prefixFirstColumn,
      afterGetCellMeta(row, column) {
        readValues.push(this.getDataAtCell(row, column));
      },
    });
    readValues.length = 0;

    // The render extends every cell, and the listener's read runs inside that extension. The hook fires
    // after the `cells()` result is on the stored meta, so the nested read already sees the getter.
    expect(() => hot.render()).not.toThrow();
    expect(readValues).toEqual(['XA1', 'XA2']);
    expect(hot.getDataAtCell(1, 0)).toBe('XA2');
  });

  it('should create one cell meta object per column for a full read when the `cells` function writes nothing', () => {
    hot = createUnrenderedGrid({
      data: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']],
      cells: () => ({ readOnly: true }),
    });

    const createTransientMeta = jest.spyOn(hot._getMetaManager().cellMeta, 'createTransientMeta');

    hot.getData();

    expect(createTransientMeta).toHaveBeenCalledTimes(3);
  });

  it('should not let a cell see what the `cells` function wrote to `this` for another cell', () => {
    const seenFlags = [];

    hot = createUnrenderedGrid({
      data: [['A1'], ['A2'], ['A3']],
      cells(row) {
        seenFlags.push(this.flag);

        if (row === 0) {
          this.flag = 'set for row 0';
        }

        return {};
      },
    });
    seenFlags.length = 0;

    hot.getData();

    expect(seenFlags).toEqual([undefined, undefined, undefined]);
  });

  it('should apply a `valueGetter` the `cells` function writes to `this`', () => {
    hot = createUnrenderedGrid({
      data: [['A1'], ['A2']],
      cells() {
        this.valueGetter = value => `T${value}`;
      },
    });

    expect(hot.getDataAtCol(0)).toEqual(['TA1', 'TA2']);
  });

  it('should leave values alone when the `cells` function returns settings that set no `valueGetter`', () => {
    hot = createUnrenderedGrid({
      data: [[1], [2]],
      cells: () => ({ readOnly: true, type: 'numeric' }),
    });

    expect(hot.getDataAtCol(0)).toEqual([1, 2]);
  });

  it('should hand a column `valueGetter` the settings the `cells` function returns for the row', () => {
    const source = [{ key: 'kg', value: { name: 'Kilogram', short: 'kg' } }];

    hot = createUnrenderedGrid({
      data: [[source[0]], [source[0]]],
      columns: [{ type: 'dropdown', source, sourceLabel: 'name' }],
      cells: row => (row === 1 ? { sourceLabel: 'short' } : {}),
    });

    expect(hot.getDataAtCol(0)).toEqual(['Kilogram', 'kg']);
  });

  it('should extend the cells of a read again after a `cells` function call threw', () => {
    let throwsForSecondRow = false;

    hot = createUnrenderedGrid({
      data: [['A1'], ['A2']],
      cells(row, column) {
        if (throwsForSecondRow && row === 1) {
          throw new Error('cells failed');
        }

        return prefixFirstColumn(row, column);
      },
    });

    throwsForSecondRow = true;

    expect(() => hot.getDataAtCell(1, 0)).toThrow('cells failed');

    throwsForSecondRow = false;

    expect(hot.getDataAtCell(1, 0)).toBe('XA2');
  });

  it('should run the `cells` function on reads again after it threw inside a meta extension', () => {
    let throwsForSecondRow = false;

    hot = createUnrenderedGrid({
      data: [['A1'], ['A2']],
      cells(row, column) {
        if (throwsForSecondRow && row === 1) {
          throw new Error('cells failed');
        }

        return prefixFirstColumn(row, column);
      },
    });

    throwsForSecondRow = true;

    expect(() => hot.getCellMetaTransient(1, 0)).toThrow('cells failed');

    throwsForSecondRow = false;

    expect(hot.getDataAtCell(1, 0)).toBe('XA2');
  });

  it('should sort a column by the output of the getter the `cells` function sets', () => {
    hot = createUnrenderedGrid({
      data: [[1], [2], [3]],
      columnSorting: true,
      cells: () => ({ valueGetter: value => -value }),
    });

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect([0, 1, 2].map(row => hot.toPhysicalRow(row))).toEqual([2, 1, 0]);
  });

  it('should sort a column by the output of the getter a column-level `cells` function sets', () => {
    hot = createUnrenderedGrid({
      data: [[1, 'a'], [2, 'b'], [3, 'c']],
      columnSorting: true,
      columns: [{ cells: () => ({ valueGetter: value => -value }) }, {}],
    });

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect([0, 1, 2].map(row => hot.toPhysicalRow(row))).toEqual([2, 1, 0]);
  });

  it('should not create a cell meta object for a grid without a `cells` function', () => {
    hot = createUnrenderedGrid({ data: [['A1', 'B1'], ['A2', 'B2']] });

    const createTransientMeta = jest.spyOn(hot._getMetaManager().cellMeta, 'createTransientMeta');

    expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'B2']]);
    expect(createTransientMeta).not.toHaveBeenCalled();
  });
});
