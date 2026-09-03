import Core from 'handsontable/core';
import {
  registerPlugin,
  AutoColumnSize,
  AutoRowSize,
  BindRowsWithHeaders,
  ColumnSorting,
  DropdownMenu,
  Filters,
  HiddenRows,
  ManualColumnResize,
  ManualRowResize,
  NestedRows,
  TrimRows,
} from 'handsontable/plugins';
import {
  registerCellType,
  CheckboxCellType,
  TextCellType,
} from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';
import { _resetDeprecationWarnings } from 'handsontable/helpers/console';
import { staticRegister, resolveWithInstance } from '../../utils/staticRegister';

registerCellType(CheckboxCellType);
registerCellType(TextCellType);

registerRenderer(baseRenderer);
registerRenderer(textRenderer);

registerPlugin(AutoColumnSize);
registerPlugin(AutoRowSize);
registerPlugin(BindRowsWithHeaders);
registerPlugin(ColumnSorting);
registerPlugin(DropdownMenu);
registerPlugin(Filters);
registerPlugin(HiddenRows);
registerPlugin(ManualColumnResize);
registerPlugin(ManualRowResize);
registerPlugin(NestedRows);
registerPlugin(TrimRows);

describe('Core', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    container.remove();
  });

  it('should reset cache only once after initialization with an Array of Arrays data source', () => {
    const core = new Core(container, {
      data: [['a'], ['b'], ['c']],
      autoRowSize: true,
      autoColumnSize: true,
      bindRowsWithHeaders: 'strict',
      columnSorting: true,
      filters: true,
      manualColumnResize: true,
      manualRowResize: true,
      trimRows: true,
      columns: [{}, {}] // Setting `columns` property at the start shouldn't update the index mappers.
    });

    const rowCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
    const columnCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

    core.rowIndexMapper.addLocalHook('cacheUpdated', rowCacheUpdatedCallback);
    core.columnIndexMapper.addLocalHook('cacheUpdated', columnCacheUpdatedCallback);

    core.init();

    expect(rowCacheUpdatedCallback.calls.count()).toEqual(1);
    expect(columnCacheUpdatedCallback.calls.count()).toEqual(1);
  });

  it('should reset cache only once after initialization with an Array of Objects data source', () => {
    const core = new Core(container, {
      data: [
        { test: 'a1', foo: 'b1' },
        { test: 'a2', foo: 'b2' }
      ],
      autoRowSize: true,
      autoColumnSize: true,
      bindRowsWithHeaders: 'strict',
      columnSorting: true,
      filters: true,
      manualColumnResize: true,
      manualRowResize: true,
      nestedRows: true,
      trimRows: true,
      columns: [{}, {}] // Setting `columns` property at the start shouldn't update the index mappers.
    });

    const rowCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
    const columnCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

    core.rowIndexMapper.addLocalHook('cacheUpdated', rowCacheUpdatedCallback);
    core.columnIndexMapper.addLocalHook('cacheUpdated', columnCacheUpdatedCallback);

    core.init();

    expect(rowCacheUpdatedCallback.calls.count()).toEqual(1);
    expect(columnCacheUpdatedCallback.calls.count()).toEqual(1);
  });

  it('should return -1 from the rendered/visible counting methods when the instance is not initialized yet', () => {
    const core = new Core(container, {
      data: [['a'], ['b'], ['c']],
    });

    expect(core.countRenderedRows()).toBe(-1);
    expect(core.countRenderedCols()).toBe(-1);
    expect(core.countVisibleRows()).toBe(-1);
    expect(core.countVisibleCols()).toBe(-1);
  });

  it('should clear the DI container collection after destroy', () => {
    const core = new Core(container, {
      data: [['a'], ['b'], ['c']],
    });

    core.init();

    const moduleRegisterer = staticRegister(core.guid);

    moduleRegisterer.register('testValue', 'test');

    expect(moduleRegisterer.getNames()).toEqual(['cellRangeMapper', 'testValue']);
    expect(resolveWithInstance(core, 'testValue')).toBe('test');

    core.destroy();

    expect(moduleRegisterer.getNames()).toEqual([]);
    expect(resolveWithInstance(core, 'testValue')).toBeUndefined();
  });

  it('should pass the index sequence change source to public cache-update hooks', () => {
    const afterRowSequenceCacheUpdate = jasmine.createSpy('afterRowSequenceCacheUpdate');
    const afterColumnSequenceCacheUpdate = jasmine.createSpy('afterColumnSequenceCacheUpdate');
    const core = new Core(container, {
      data: [['a', 'b'], ['c', 'd']],
      afterRowSequenceCacheUpdate,
      afterColumnSequenceCacheUpdate,
    });

    core.init();
    afterRowSequenceCacheUpdate.calls.reset();
    afterColumnSequenceCacheUpdate.calls.reset();

    core.rowIndexMapper.insertIndexes(1, 1);
    core.columnIndexMapper.insertIndexes(1, 1);

    expect(afterRowSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
      indexesChangeSource: 'insert',
    }));
    expect(afterColumnSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
      indexesChangeSource: 'insert',
    }));

    core.destroy();
  });
});

describe('Core.setDataAtCell past the last column', () => {
  let container;
  let warnSpy;

  beforeEach(() => {
    container = document.createElement('div');
    // `deprecatedWarnOnce` records printed warnings module-globally, so without this the
    // assertions below would depend on the order the specs run in.
    _resetDeprecationWarnings();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    container.remove();
  });

  /**
   * Collects every deprecation warning printed so far that mentions the last-column write.
   *
   * @returns {Array} The matching `console.warn` messages.
   */
  function pastLastColumnWarnings() {
    return warnSpy.mock.calls
      .map(args => String(args[0]))
      .filter(message => message.includes('past the last column of an object data source'));
  }

  /**
   * Builds and initializes a grid.
   *
   * @param {object} settings The grid settings.
   * @returns {object} The initialized instance.
   */
  function build(settings) {
    const core = new Core(container, { licenseKey: 'non-commercial-and-evaluation', ...settings });

    core.init();

    return core;
  }

  it('should warn when the write lands past the last column of an object data source', () => {
    const data = [{ id: 1, name: 'Ted Right' }];
    const core = build({ data, dataSchema: { id: null, name: null } });

    core.setDataAtCell(0, 2, 'x');

    const warnings = pastLastColumnWarnings();

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('19.0.0');
    expect(warnings[0]).toContain('setDataAtRowProp()');
    // The write still stands while the behavior is only deprecated.
    expect(data[0]).toEqual({ 2: 'x', id: 1, name: 'Ted Right' });

    core.destroy();
  });

  it('should warn for a `dataSchema` given as a function, which is object-rowed too', () => {
    const data = [{ id: 1, name: 'Ted Right' }];
    const core = build({ data, dataSchema: () => ({ id: null, name: null }) });

    core.setDataAtCell(0, 2, 'x');

    // A function `dataSchema` sets `dataType` to 'function', not 'object'. It is just as unable to
    // gain a column, so a predicate naming only 'object' would leave this case writing the key.
    expect(core.dataType).toBe('function');
    expect(pastLastColumnWarnings()).toHaveLength(1);

    core.destroy();
  });

  it('should warn only once across repeated writes', () => {
    const core = build({
      data: [{ id: 1, name: 'Ted Right' }],
      dataSchema: { id: null, name: null },
    });

    core.setDataAtCell(0, 2, 'x');
    core.setDataAtCell(0, 3, 'y');

    expect(pastLastColumnWarnings()).toHaveLength(1);

    core.destroy();
  });

  it('should not warn for an array data source, which can grow a column', () => {
    const core = build({ data: [['A1', 'B1']] });

    core.setDataAtCell(0, 2, 'x');

    expect(pastLastColumnWarnings()).toHaveLength(0);
    expect(core.countCols()).toBe(3);

    core.destroy();
  });

  it('should not warn for an array data source that sets the `columns` option', () => {
    const core = build({ data: [['A1', 'B1']], columns: [{}, {}] });

    core.setDataAtCell(0, 2, 'x');

    // No column is created here either, but the row is an array, so the index names a real array
    // slot rather than a property no schema declared. Nothing is deprecated.
    expect(pastLastColumnWarnings()).toHaveLength(0);

    core.destroy();
  });

  it('should not warn for a grid that declares no columns at all', () => {
    const core = build({ data: [] });

    core.setDataAtCell(0, 0, 'WRITE');

    // An empty `data: []` is duck-typed to 'object' because there is no `data[0]` to inspect, and
    // `countCols()` is 0 - so every index is "past the last column". Writing to such a grid is how
    // an empty dataset gets bootstrapped, and it is deliberately left alone.
    expect(core.dataType).toBe('object');
    expect(pastLastColumnWarnings()).toHaveLength(0);
    expect(core.getDataAtCell(0, 0)).toBe('WRITE');

    core.destroy();
  });
});
