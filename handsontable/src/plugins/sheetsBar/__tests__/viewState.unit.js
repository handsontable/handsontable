import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ManualColumnResize } from '../../manualColumnResize';
import { ColumnSorting } from '../../columnSorting';
import { Filters } from '../../filters';
import { DropdownMenu } from '../../dropdownMenu';
import { AutoColumnSize } from '../../autoColumnSize';
import { HiddenRows } from '../../hiddenRows';
import { HiddenColumns } from '../../hiddenColumns';
import { Pagination } from '../../pagination';
import { registerCellType, CheckboxCellType } from '../../../cellTypes';
import { SheetsBar } from '../sheetsBar';
import { captureViewState, keepSelectionOnPage, restoreViewState, restoreViewport } from '../viewState';

describe('SheetsBar view state', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(ManualColumnResize);
    registerPlugin(ColumnSorting);
    registerCellType(CheckboxCellType);
    registerPlugin(AutoColumnSize);
    registerPlugin(DropdownMenu);
    registerPlugin(HiddenRows);
    registerPlugin(Filters);
    registerPlugin(HiddenColumns);
    registerPlugin(Pagination);
    registerPlugin(SheetsBar);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('captures and restores manual column widths', () => {
    hot = new Handsontable(container, {
      data: [['a', 'b'], ['c', 'd']],
      manualColumnResize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('manualColumnResize').setManualSize(0, 260);
    hot.render();

    const state = captureViewState(hot, []);

    expect(state.colWidths).toEqual([[0, 260]]);

    hot.getPlugin('manualColumnResize').setManualSize(0, 100);
    restoreViewState(hot, state);

    expect(hot.getColWidth(0)).toBe(260);
  });

  it('captures and restores the sort config', () => {
    hot = new Handsontable(container, {
      data: [[3], [1], [2]],
      columnSorting: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

    const state = captureViewState(hot, []);

    hot.getPlugin('columnSorting').clearSort();
    restoreViewState(hot, state);

    expect(hot.getDataAtCell(0, 0)).toBe(1);
  });

  it('captures row/column sequences defensively, unaffected by later mapper mutation', () => {
    hot = new Handsontable(container, {
      data: [['a'], ['b'], ['c']],
      licenseKey: 'non-commercial-and-evaluation',
    });

    const state = captureViewState(hot, []);
    const capturedRowSequence = state.rowSequence.slice();
    const capturedColumnSequence = state.columnSequence.slice();

    hot.rowIndexMapper.getIndexesSequence().reverse();
    hot.columnIndexMapper.getIndexesSequence().reverse();

    expect(state.rowSequence).toEqual(capturedRowSequence);
    expect(state.columnSequence).toEqual(capturedColumnSequence);
  });

  it('round-trips width through a sheet switch (240 → 260 survives)', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      manualColumnResize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('manualColumnResize').setManualSize(0, 260);
    hot.render();

    hot.getPlugin('sheetsBar').setActiveSheet('B');
    hot.getPlugin('sheetsBar').setActiveSheet('A');

    expect(hot.getColWidth(0)).toBe(260);
  });

  it('captures only manual overrides, as sparse index-size pairs', () => {
    hot = new Handsontable(container, {
      data: [['a', 'b', 'c']],
      manualColumnResize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('manualColumnResize').setManualSize(1, 260);
    hot.render();

    const state = captureViewState(hot, []);

    expect(state.colWidths).toEqual([[1, 260]]);
  });

  it('captures no row heights for rows with no manual override', () => {
    hot = new Handsontable(container, {
      data: [['a'], ['b']],
      manualRowResize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const state = captureViewState(hot, []);

    expect(state.rowHeights).toEqual([]);
  });

  it('drops the previous sheet manual widths when restoring a sheet that has none', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      manualColumnResize: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const plugin = hot.getPlugin('sheetsBar');

    plugin.setActiveSheet('B');
    plugin.setActiveSheet('A');
    hot.getPlugin('manualColumnResize').setManualSize(0, 260);
    hot.render();
    plugin.setActiveSheet('B');

    expect(hot.getColWidth(0)).not.toBe(260);
  });

  it('does not inherit the previous sheet filters when switching to a never-visited sheet', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'A', data: [['keep'], ['drop']] },
          { name: 'B', data: [['x'], ['y']] },
        ],
      },
      filters: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'eq', ['keep']);
    filters.filter();

    expect(hot.countRows()).toBe(1);

    hot.getPlugin('sheetsBar').setActiveSheet('B');

    expect(hot.countRows()).toBe(2);
    expect(hot.getDataAtCell(0, 0)).toBe('x');
  });

  it('does not inherit the previous sheet hidden columns when switching to a never-visited sheet', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'A', data: [['a1', 'a2']] },
          { name: 'B', data: [['b1', 'b2']] },
        ],
      },
      hiddenColumns: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('hiddenColumns').hideColumn(0);
    hot.render();

    hot.getPlugin('sheetsBar').setActiveSheet('B');

    expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([]);
  });

  it('replays tracked cell meta after a switch round-trip', () => {
    hot = new Handsontable(container, {
      sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.setCellMeta(0, 0, 'readOnly', true);

    hot.getPlugin('sheetsBar').setActiveSheet('B');

    expect(hot.getCellMeta(0, 0).readOnly).not.toBe(true);

    hot.getPlugin('sheetsBar').setActiveSheet('A');

    expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
  });

  it('captures the page and the page size when Pagination is enabled', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 200 }, (_, row) => [`r${row + 1}`]),
      pagination: { pageSize: 10 },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('pagination').setPageSize(20);
    hot.getPlugin('pagination').setPage(4);

    expect(captureViewState(hot, []).pagination).toEqual({ page: 4, pageSize: 20 });
  });

  it('captures no pagination state when Pagination is disabled', () => {
    hot = new Handsontable(container, {
      data: [['a'], ['b']],
      licenseKey: 'non-commercial-and-evaluation',
    });

    expect(captureViewState(hot, []).pagination).toBeNull();
  });

  it('puts the page back before the selection, so the restored row is on the visible page', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 200 }, (_, row) => [`r${row + 1}`]),
      pagination: { pageSize: 10 },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const pagination = hot.getPlugin('pagination');

    pagination.setPage(7);
    hot.selectCell(64, 0);

    const state = captureViewState(hot, []);

    pagination.setPage(2);
    hot.deselectCell();

    expect(hot.rowIndexMapper.isHidden(64)).toBe(true);

    restoreViewport(hot, state);

    expect(pagination.getCurrentPage()).toBe(7);
    expect(hot.rowIndexMapper.isHidden(64)).toBe(false);
    expect(hot.getSelectedLast()).toEqual([64, 0, 64, 0]);
  });

  it('restores a whole row selected from its header', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 20 }, (_, row) => [`r${row + 1}`, row]),
      rowHeaders: true,
      colHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectRows(4);

    const state = captureViewState(hot, []);

    hot.selectCell(10, 1);
    restoreViewport(hot, state);

    expect(hot.getSelected()).toEqual([[4, -1, 4, 1]]);
    expect(hot.selection.isSelectedByRowHeader()).toBe(true);
  });

  it('restores every layer of a selection made from several row headers', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 20 }, (_, row) => [`r${row + 1}`, row]),
      rowHeaders: true,
      colHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectRows(2);

    const firstLayer = hot.selection.exportSelection();

    hot.selectRows(6);

    const secondLayer = hot.selection.exportSelection();

    hot.selection.importSelection({
      ...secondLayer,
      ranges: [firstLayer.ranges[0], secondLayer.ranges[0]],
      selectedByRowHeader: [0, 1],
      activeSelectionLayer: 1,
    });

    const state = captureViewState(hot, []);

    hot.selectCell(10, 1);
    restoreViewport(hot, state);

    expect(hot.getSelected()).toEqual([[2, -1, 2, 1], [6, -1, 6, 1]]);
  });

  it('leaves the current selection alone when a header-anchored one no longer fits the grid', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 20 }, (_, row) => [`r${row + 1}`, row]),
      rowHeaders: true,
      colHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectRows(15);

    const state = captureViewState(hot, []);

    hot.loadData(Array.from({ length: 5 }, (_, row) => [`s${row + 1}`, row]));
    hot.selectCell(1, 1);
    restoreViewport(hot, state);

    expect(hot.getSelected()).toEqual([[1, 1, 1, 1]]);
  });

  it('keeps the page of each sheet across a sheet switch', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'Long', data: Array.from({ length: 200 }, (_, row) => [`Long row ${row + 1}`]) },
          { name: 'Short', data: Array.from({ length: 15 }, (_, row) => [`Short row ${row + 1}`]) },
        ],
      },
      pagination: { pageSize: 10 },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const pagination = hot.getPlugin('pagination');
    const sheetsBar = hot.getPlugin('sheetsBar');

    pagination.setPage(7);
    sheetsBar.setActiveSheet('Short');

    expect(pagination.getCurrentPage()).toBe(1);

    pagination.setPage(2);
    sheetsBar.setActiveSheet('Long');

    expect(pagination.getCurrentPage()).toBe(7);

    sheetsBar.setActiveSheet('Short');

    expect(pagination.getCurrentPage()).toBe(2);
  });

  it('opens a never-visited sheet on the configured page and page size', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'Long', data: Array.from({ length: 200 }, (_, row) => [`Long row ${row + 1}`]) },
          { name: 'Other', data: Array.from({ length: 200 }, (_, row) => [`Other row ${row + 1}`]) },
        ],
      },
      pagination: { pageSize: 10 },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const pagination = hot.getPlugin('pagination');

    pagination.setPageSize(20);
    pagination.setPage(7);
    hot.selectCell(130, 0);
    hot.getPlugin('sheetsBar').setActiveSheet('Other');

    expect(pagination.getCurrentPage()).toBe(1);
    expect(pagination.getCurrentPageSize()).toBe(10);
    expect(hot.getSelected()).toBeUndefined();
  });

  it('leaves the page alone when the rows come from an external data source', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 200 }, (_, row) => [`r${row + 1}`]),
      pagination: { pageSize: 10 },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const pagination = hot.getPlugin('pagination');

    pagination.setPage(7);

    const localState = captureViewState(hot, []);

    hot.addHook('hasExternalDataSource', () => true);

    expect(captureViewState(hot, []).pagination).toBeNull();

    const afterPageChange = jest.fn();

    pagination.setPage(2);
    hot.addHook('afterPageChange', afterPageChange);
    restoreViewport(hot, localState);

    expect(pagination.getCurrentPage()).toBe(2);
    expect(afterPageChange).not.toHaveBeenCalled();
  });

  it('fires the page hooks only when the restored page differs', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 200 }, (_, row) => [`r${row + 1}`]),
      pagination: { pageSize: 10 },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const pagination = hot.getPlugin('pagination');
    const afterPageChange = jest.fn();
    const afterPageSizeChange = jest.fn();

    pagination.setPage(7);

    const state = captureViewState(hot, []);

    hot.addHook('afterPageChange', afterPageChange);
    hot.addHook('afterPageSizeChange', afterPageSizeChange);
    restoreViewport(hot, state);

    expect(afterPageChange).not.toHaveBeenCalled();
    expect(afterPageSizeChange).not.toHaveBeenCalled();

    pagination.setPage(3);
    afterPageChange.mockClear();
    restoreViewport(hot, state);

    expect(afterPageChange).toHaveBeenCalledTimes(1);
    expect(afterPageChange).toHaveBeenCalledWith(3, 7);
  });

  it('clamps a captured page past the end without firing a page change', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 200 }, (_, row) => [`r${row + 1}`]),
      pagination: { pageSize: 10 },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const pagination = hot.getPlugin('pagination');

    pagination.setPage(7);

    const state = captureViewState(hot, []);

    hot.loadData(Array.from({ length: 30 }, (_, row) => [`s${row + 1}`]));

    const afterPageChange = jest.fn();

    hot.addHook('afterPageChange', afterPageChange);
    restoreViewport(hot, state);

    expect(pagination.getCurrentPage()).toBe(3);
    expect(afterPageChange).not.toHaveBeenCalled();
  });

  it('drops the restored selection instead of leaving it on a page a listener refused to open', () => {
    hot = new Handsontable(container, {
      sheetsBar: {
        sheets: [
          { name: 'Long', data: Array.from({ length: 200 }, (_, row) => [`Long row ${row + 1}`]) },
          { name: 'Short', data: Array.from({ length: 15 }, (_, row) => [`Short row ${row + 1}`]) },
        ],
      },
      pagination: { pageSize: 10 },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const pagination = hot.getPlugin('pagination');
    const sheetsBar = hot.getPlugin('sheetsBar');

    pagination.setPage(7);
    hot.selectCell(64, 0);
    sheetsBar.setActiveSheet('Short');
    hot.addHook('beforePageChange', () => false);
    sheetsBar.setActiveSheet('Long');

    expect(pagination.getCurrentPage()).toBe(1);
    expect(hot.getSelected()).toBeUndefined();
  });

  it('follows a restored selection to its page when the page it came back on does not show it', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 200 }, (_, row) => [`r${row + 1}`]),
      pagination: { pageSize: 10 },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const pagination = hot.getPlugin('pagination');

    pagination.setPage(7);
    hot.selectCell(64, 0);
    pagination.setPage(6);

    keepSelectionOnPage(hot, true);

    expect(pagination.getCurrentPage()).toBe(7);
    expect(hot.getSelectedLast()).toEqual([64, 0, 64, 0]);
  });

  it('drops a carried-over selection that is not on the shown page instead of following it', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 200 }, (_, row) => [`r${row + 1}`]),
      pagination: { pageSize: 10 },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const pagination = hot.getPlugin('pagination');

    pagination.setPage(7);
    hot.selectCell(64, 0);
    pagination.setPage(1);

    keepSelectionOnPage(hot, false);

    expect(pagination.getCurrentPage()).toBe(1);
    expect(hot.getSelected()).toBeUndefined();
  });

  it('restores a whole column selected from its header on a later page', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 200 }, (_, row) => [`r${row + 1}`, row]),
      rowHeaders: true,
      colHeaders: true,
      pagination: { pageSize: 10 },
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('pagination').setPage(7);
    hot.selectColumns(1);

    const expected = hot.getSelected();
    const state = captureViewState(hot, []);

    hot.selectCell(62, 0);
    restoreViewport(hot, state);

    expect(hot.getSelected()).toEqual(expected);
    expect(hot.selection.isSelectedByColumnHeader()).toBe(true);
  });

  it('restores select-all made from the corner', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 20 }, (_, row) => [`r${row + 1}`, row]),
      rowHeaders: true,
      colHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectAll();

    const expected = hot.getSelected();
    const flags = () => [
      hot.selection.isSelectedByCorner(),
      hot.selection.isSelectedByRowHeader(),
      hot.selection.isSelectedByColumnHeader(),
    ];
    const expectedFlags = flags();
    const state = captureViewState(hot, []);

    hot.selectCell(3, 1);
    restoreViewport(hot, state);

    expect(hot.getSelected()).toEqual(expected);
    expect(expectedFlags[0]).toBe(true);
    expect(flags()).toEqual(expectedFlags);
  });

  it('runs the selection hooks and marks the header state when a row selection comes back', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 20 }, (_, row) => [`r${row + 1}`, row]),
      rowHeaders: true,
      colHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectRows(4);

    const state = captureViewState(hot, []);
    const afterSelectionEnd = jest.fn();

    hot.selectCell(10, 1);
    hot.addHook('afterSelectionEnd', afterSelectionEnd);
    restoreViewport(hot, state);

    expect(afterSelectionEnd).toHaveBeenCalledWith(4, -1, 4, 1, 0);
    expect(hot.rootElement.classList.contains('ht__selection--rows')).toBe(true);
  });

  it('runs the selection hooks and marks the header state when several row layers come back', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 20 }, (_, row) => [`r${row + 1}`, row]),
      rowHeaders: true,
      colHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectRows(2);

    const firstLayer = hot.selection.exportSelection();

    hot.selectRows(6);

    const secondLayer = hot.selection.exportSelection();

    hot.selection.importSelection({
      ...secondLayer,
      ranges: [firstLayer.ranges[0], secondLayer.ranges[0]],
      selectedByRowHeader: [0, 1],
      columnExtentSpansGrid: [0, 1],
      activeSelectionLayer: 1,
    });

    const state = captureViewState(hot, []);
    const afterSelectionEnd = jest.fn();

    hot.selectCell(10, 1);
    hot.addHook('afterSelectionEnd', afterSelectionEnd);
    restoreViewport(hot, state);

    expect(hot.getSelected()).toEqual([[2, -1, 2, 1], [6, -1, 6, 1]]);
    expect(afterSelectionEnd).toHaveBeenCalled();
    expect(hot.rootElement.classList.contains('ht__selection--rows')).toBe(true);
  });

  it('keeps copies of the selection, so later selection work cannot change a captured one', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 20 }, (_, row) => [`r${row + 1}`, row]),
      rowHeaders: true,
      colHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectRows(4);

    const state = captureViewState(hot, []);
    const live = hot.selection.getActiveSelectedRange();

    expect(state.selectionState.activeRange).not.toBe(live);

    live.highlight.assign({ row: 9, col: 1 });

    expect(state.selectionState.activeRange.highlight.row).toBe(4);

    restoreViewport(hot, state);

    expect(hot.selection.getActiveSelectedRange()).not.toBe(state.selectionState.ranges[0]);
  });

  it('puts the focus back where it was inside a cell range', () => {
    hot = new Handsontable(container, {
      data: Array.from({ length: 20 }, (_, row) => [`r${row + 1}`, row, row]),
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectCell(2, 0, 5, 2);
    hot.selection.setRangeFocus(hot._createCellCoords(4, 1));

    const state = captureViewState(hot, []);

    hot.selectCell(10, 1);
    restoreViewport(hot, state);

    expect(hot.getSelected()).toEqual([[2, 0, 5, 2]]);
    expect(hot.getSelectedRangeActive().highlight.row).toBe(4);
    expect(hot.getSelectedRangeActive().highlight.col).toBe(1);
  });
});
