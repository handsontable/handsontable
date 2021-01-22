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
} from 'handsontable/cellTypes';

registerCellType(CheckboxCellType);

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

  it('should reset cache only once after initialization', () => {
    const core = new Core(container, {
      data: [['a'], ['b'], ['c']],
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
});
