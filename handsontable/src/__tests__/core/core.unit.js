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

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    container.remove();
  });

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

  it('should skip the write when it lands past the last column of an object data source', () => {
    const data = [{ id: 1, name: 'Ted Right' }];
    const core = build({ data, dataSchema: { id: null, name: null } });

    core.setDataAtCell(0, 2, 'x');

    // The value would land on a literal `2` key beside the declared ones, which no column can
    // display and every consumer serializing the row would then see (#5409).
    expect(data[0]).toEqual({ id: 1, name: 'Ted Right' });

    core.destroy();
  });

  it('should skip the write for a `dataSchema` given as a function, which is object-rowed too', () => {
    const data = [{ id: 1, name: 'Ted Right' }];
    const core = build({ data, dataSchema: () => ({ id: null, name: null }) });

    core.setDataAtCell(0, 2, 'x');

    // A function `dataSchema` sets `dataType` to 'function', not 'object'. It is just as unable to
    // gain a column, so a predicate naming only 'object' would leave this case writing the key.
    expect(core.dataType).toBe('function');
    expect(data[0]).toEqual({ id: 1, name: 'Ted Right' });

    core.destroy();
  });

  it('should report the skipped write to neither beforeChange nor afterChange', () => {
    const seen = { before: [], after: [] };
    const core = build({
      data: [{ id: 1, name: 'Ted Right' }],
      dataSchema: { id: null, name: null },
      beforeChange: changes => seen.before.push(changes),
      afterChange: (changes, source) => {
        if (source !== 'loadData') {
          seen.after.push(changes);
        }
      },
    });

    core.setDataAtCell(0, 2, 'x');

    // Reporting a change for a value the grid did not write would send an integrator syncing from
    // either hook a property its own schema does not have.
    expect(seen.before).toEqual([]);
    expect(seen.after).toEqual([]);

    core.destroy();
  });

  it('should keep writing into an array data source, which can grow a column', () => {
    const core = build({ data: [['A1', 'B1']] });

    core.setDataAtCell(0, 2, 'x');

    expect(core.countCols()).toBe(3);
    expect(core.getDataAtCell(0, 2)).toBe('x');

    core.destroy();
  });

  it('should keep writing into an array data source that sets the `columns` option', () => {
    const data = [['A1', 'B1']];
    const core = build({ data, columns: [{}, {}] });

    core.setDataAtCell(0, 2, 'x');

    // No column is created here either, but the row is an array, so the index names a real array
    // slot rather than a property no schema declared. The write stands.
    expect(data[0][2]).toBe('x');
    expect(core.getDataAtCell(0, 2)).toBe('x');

    core.destroy();
  });

  it('should keep writing into a grid that declares no columns at all', () => {
    const core = build({ data: [] });

    core.setDataAtCell(0, 0, 'WRITE');

    // An empty `data: []` is duck-typed to 'object' because there is no `data[0]` to inspect, and
    // `countCols()` is 0 - so every index is "past the last column". Writing to such a grid is how
    // an empty dataset gets bootstrapped, and it is deliberately left alone.
    expect(core.dataType).toBe('object');
    expect(core.getDataAtCell(0, 0)).toBe('WRITE');

    core.destroy();
  });
});
