import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('SheetsBar applies a sheet against its own data', () => {
  let container;
  let hot;

  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
  });

  afterAll(() => {
    delete Element.prototype.scrollIntoView;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  /**
   * Builds a grid with a sheets bar over the given sheets.
   *
   * @param {object[]} sheets The `sheets` setting.
   * @param {object} [settings] Grid-level settings.
   * @returns {object} The SheetsBar plugin.
   */
  function buildWorkbook(sheets, settings = {}) {
    hot = new Handsontable(container, {
      ...settings,
      sheetsBar: { sheets },
      licenseKey: LICENSE_KEY,
    });

    return hot.getPlugin('sheetsBar');
  }

  it('keeps the rows typed into spare rows when the next sheet has another `columns` schema', () => {
    const orders = [['o-1', 10], ['o-2', 20]];
    const bar = buildWorkbook([
      { name: 'Orders', data: orders, settings: { minSpareRows: 1 } },
      {
        name: 'Customers',
        data: [{ name: 'Ann', city: 'Oslo' }],
        settings: { columns: [{ data: 'name' }, { data: 'city' }] },
      },
    ]);

    hot.setDataAtCell(2, 0, 'o-3');
    hot.setDataAtCell(3, 0, 'o-4');
    bar.setActiveSheet('Customers');

    expect(orders.map(row => row[0])).toEqual(['o-1', 'o-2', 'o-3', 'o-4', null]);

    bar.setActiveSheet('Orders');

    expect(hot.getDataAtCol(0)).toEqual(['o-1', 'o-2', 'o-3', 'o-4', null]);
  });

  it('applies a sheet\'s own `cell` option at init and after a round trip', () => {
    const bar = buildWorkbook([
      { name: 'Alpha', data: [['a', 'b']], settings: { cell: [{ row: 0, col: 0, readOnly: true }] } },
      { name: 'Beta', data: [['c', 'd']] },
    ]);

    expect(hot.getCellMeta(0, 0).readOnly).toBe(true);

    bar.setActiveSheet('Beta');

    expect(hot.getCellMeta(0, 0).readOnly).toBe(false);

    bar.setActiveSheet('Alpha');

    expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
    expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
  });

  it('applies a grid-level `cell` option to every sheet that declares none', () => {
    const bar = buildWorkbook([
      { name: 'Alpha', data: [['a', 'b']] },
      { name: 'Beta', data: [['c', 'd']] },
    ], { cell: [{ row: 0, col: 1, readOnly: true }] });

    expect(hot.getCellMeta(0, 1).readOnly).toBe(true);

    bar.setActiveSheet('Beta');

    expect(hot.getCellMeta(0, 1).readOnly).toBe(true);
  });

  it('opens a sheet declaring the same frozen rows as the previous sheet with those rows frozen', () => {
    const bar = buildWorkbook([
      { name: 'A', data: [[1], [2], [3]], settings: { fixedRowsTop: 1, fixedColumnsStart: 1 } },
      { name: 'B', data: [[1], [2], [3]], settings: { fixedRowsTop: 1, fixedColumnsStart: 1 } },
    ]);

    bar.setActiveSheet('B');

    expect(hot.getSettings().fixedRowsTop).toBe(1);
    expect(hot.getSettings().fixedColumnsStart).toBe(1);

    bar.setActiveSheet('A');

    expect(hot.getSettings().fixedRowsTop).toBe(1);
  });

  it('runs the opening sheet\'s own hook in place of the grid-level one, and the grid-level one elsewhere', () => {
    const gridHook = jest.fn();
    const sheetHook = jest.fn();
    const bar = buildWorkbook([
      { name: 'A', data: [[1]], settings: { afterChange: sheetHook } },
      { name: 'B', data: [[1]] },
    ], { afterChange: gridHook });
    const callsOnEdit = () => {
      gridHook.mockClear();
      sheetHook.mockClear();
      hot.setDataAtCell(0, 0, Math.random());

      return [gridHook.mock.calls.length, sheetHook.mock.calls.length];
    };

    expect(callsOnEdit()).toEqual([0, 1]);

    bar.setActiveSheet('B');

    expect(callsOnEdit()).toEqual([1, 0]);

    bar.setActiveSheet('A');

    expect(callsOnEdit()).toEqual([0, 1]);
  });

  it('keeps a paginated sheet paginated when returning from a sheet frozen at runtime', () => {
    const bar = buildWorkbook([
      { name: 'Paged', data: [[1], [2], [3]], settings: { pagination: true } },
      { name: 'Plain', data: [[1], [2], [3]] },
    ]);

    bar.setActiveSheet('Plain');
    hot.getSettings().fixedRowsTop = 1;
    hot.render();
    bar.setActiveSheet('Paged');

    expect(hot.getPlugin('pagination').enabled).toBe(true);
    expect(hot.getSettings().fixedRowsTop).toBe(0);

    bar.setActiveSheet('Plain');

    expect(hot.getSettings().fixedRowsTop).toBe(1);
  });

  it('sorts a sheet by its own `initialConfig` on its first visit', () => {
    const bar = buildWorkbook([
      { name: 'A', data: [[1]] },
      {
        name: 'B',
        data: [[3], [1], [2]],
        settings: { columnSorting: { initialConfig: { column: 0, sortOrder: 'asc' } } },
      },
    ]);

    bar.setActiveSheet('B');

    expect(hot.getDataAtCol(0)).toEqual([1, 2, 3]);
    expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'asc' }]);
  });

  it('keeps a declared border on a sheet larger than the sheet the user arrives from', () => {
    const bar = buildWorkbook([
      { name: 'Small', data: [[1, 1]] },
      {
        name: 'Large',
        data: Array.from({ length: 10 }, (_, row) => [row, row]),
        settings: { customBorders: [{ row: 5, col: 1, top: { width: 2, color: 'red' } }] },
      },
    ]);

    bar.setActiveSheet('Large');

    expect(hot.getPlugin('customBorders').getBorders([[5, 1, 5, 1]]).length).toBe(1);
  });

  it('keeps a ColumnSummary endpoint where a row insert moved it after a round trip', () => {
    const totals = [[1], [2], [null]];
    const bar = buildWorkbook([
      { name: 'Notes', data: [['a']] },
      {
        name: 'Totals',
        data: totals,
        settings: {
          columnSummary: [{ sourceColumn: 0, destinationRow: 2, destinationColumn: 0, type: 'sum', ranges: [[0, 1]] }],
        },
      },
    ]);

    bar.setActiveSheet('Totals');
    hot.alter('insert_row_above', 2, 1);
    hot.setDataAtCell(2, 0, 7);
    bar.setActiveSheet('Notes');
    bar.setActiveSheet('Totals');

    expect(hot.getDataAtCol(0)).toEqual([1, 2, 7, 3]);
    expect(totals.map(row => row[0])).toEqual([1, 2, 7, 3]);
  });

  it('keeps a ColumnSummary counted from the bottom where a removal parked it after a round trip', () => {
    const totals = [[1], [2], [3], [4], [5], [6], [7], [null], [null], [null]];
    const bar = buildWorkbook([
      { name: 'Notes', data: [['a']] },
      {
        name: 'Totals',
        data: totals,
        settings: {
          columnSummary: [{
            sourceColumn: 0,
            destinationRow: 2,
            destinationColumn: 0,
            reversedRowCoords: true,
            type: 'sum',
            ranges: [[0, 6]],
          }],
        },
      },
    ]);

    bar.setActiveSheet('Totals');
    hot.alter('remove_row', 9, 1);

    expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, 4, 5, 6, 7, 28, null]);

    bar.setActiveSheet('Notes');
    bar.setActiveSheet('Totals');

    expect(hot.getDataAtCol(0)).toEqual([1, 2, 3, 4, 5, 6, 7, 28, null]);
  });

  it('does not carry a resized sheet\'s sizes to a never-visited sheet past one with resizing off', () => {
    const bar = buildWorkbook([
      { name: 'A', data: [[1, 2]] },
      { name: 'B', data: [[1, 2]], settings: { manualColumnResize: false, manualRowResize: false } },
      { name: 'C', data: [[1, 2]] },
    ], { manualColumnResize: true, manualRowResize: true });

    hot.getPlugin('manualColumnResize').setManualSize(0, 222);
    hot.getPlugin('manualRowResize').setManualSize(0, 77);
    hot.render();
    bar.setActiveSheet('B');
    bar.setActiveSheet('A');

    expect(hot.getColWidth(0)).toBe(222);

    bar.setActiveSheet('B');
    bar.setActiveSheet('C');

    expect(hot.getColWidth(0)).not.toBe(222);
    expect(hot.getRowHeight(0)).not.toBe(77);

    bar.setActiveSheet('A');

    expect(hot.getColWidth(0)).toBe(222);
  });

  it('switches onto a sheet with deeper nested headers that turns collapsible columns off', () => {
    const bar = buildWorkbook([
      { name: 'Flat', data: [[1, 2, 3]], settings: { nestedHeaders: [['A', { label: 'G', colspan: 2 }]] } },
      {
        name: 'Deep',
        data: [[1, 2, 3]],
        settings: {
          nestedHeaders: [[{ label: 'Top', colspan: 3 }], ['A', { label: 'G', colspan: 2 }]],
          collapsibleColumns: false,
        },
      },
    ], { colHeaders: true, collapsibleColumns: true });

    expect(() => bar.setActiveSheet('Deep')).not.toThrow();
    expect(bar.getSheets().find(sheet => sheet.isActive).name).toBe('Deep');
    expect(hot.getPlugin('collapsibleColumns').enabled).toBe(false);
  });

  it('runs no filter pass over the departing rows when switching to a never-visited sheet', () => {
    const afterFilter = jest.fn();
    const beforeFilter = jest.fn();
    const departing = [[1], [2], [3]];
    const bar = buildWorkbook([
      { name: 'Filtered', data: departing },
      { name: 'Fresh', data: [[4], [5]] },
    ], { filters: true, dropdownMenu: true, afterFilter, beforeFilter });
    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'eq', [2]);
    filters.filter();
    afterFilter.mockClear();
    beforeFilter.mockClear();
    bar.setActiveSheet('Fresh');

    expect(beforeFilter).not.toHaveBeenCalled();
    expect(afterFilter).not.toHaveBeenCalled();
    expect(hot.getDataAtCol(0)).toEqual([4, 5]);
    expect(filters.exportConditions()).toEqual([]);

    bar.setActiveSheet('Filtered');

    expect(hot.getDataAtCol(0)).toEqual([2]);
  });

  it('does not track the opening sheet\'s declared `cell` entries as cell meta the user set', () => {
    const captured = [];

    hot = new Handsontable(container, {
      sheetsBar: { sheets: [
        { name: 'A', data: [['a', 'b']], settings: { cell: [{ row: 0, col: 0, readOnly: true }] } },
        { name: 'B', data: [['c', 'd']] },
      ] },
      afterSheetTabStateCapture(sheetId, viewState) {
        captured.push(viewState);
      },
      licenseKey: LICENSE_KEY,
    });

    hot.setCellMeta(0, 1, 'className', 'user-marked');
    hot.getPlugin('sheetsBar').setActiveSheet('B');

    const keys = captured[0].cellMeta.map(entry => entry.key ?? entry[2]);

    expect(JSON.stringify(captured[0].cellMeta)).toContain('user-marked');
    expect(keys).not.toContain('readOnly');
  });

  it('gives a duplicated sheet the summary positions its original holds now', () => {
    const bar = buildWorkbook([
      {
        name: 'Totals',
        data: [[1], [2], [null]],
        settings: {
          columnSummary: [{ sourceColumn: 0, destinationRow: 2, destinationColumn: 0, type: 'sum', ranges: [[0, 1]] }],
        },
      },
    ]);

    hot.alter('insert_row_above', 2, 1);
    hot.setDataAtCell(2, 0, 7);

    const copy = bar.duplicateSheet(bar.getSheets()[0].id);

    bar.setActiveSheet(copy.id);

    expect(hot.getDataAtCol(0)).toEqual([1, 2, 7, 3]);
  });

  it('validates the opening sheet\'s data once while the grid is built', () => {
    const sources = [];

    buildWorkbook([{
      name: 'Only',
      data: [['a']],
      settings: {
        columns: [{
          sourceDataValidator: (value, cellMeta, source) => {
            sources.push(source);

            return true;
          },
        }],
      },
    }]);

    expect(sources).toEqual(['init']);
  });

  it('builds the merges an afterLoadData listener declares on a return to a sheet with a stored state', () => {
    const bar = buildWorkbook([
      { name: 'A', data: [[1, 2], [3, 4]] },
      { name: 'B', data: [[5, 6], [7, 8]] },
    ]);

    bar.setActiveSheet('B');

    const declareMerge = () => {
      hot.removeHook('afterLoadData', declareMerge);
      hot.updateSettings({ mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }] });
    };

    hot.addHook('afterLoadData', declareMerge);
    bar.setActiveSheet('A');

    expect(hot.getCellMeta(0, 0).rowspan).toBe(2);
  });

  it('keeps a grid-level ColumnSummary on its declared row on a sheet that was not altered', () => {
    const bar = buildWorkbook([
      { name: 'Altered', data: [[1], [2], [null]] },
      { name: 'Untouched', data: [[10], [20], [null]] },
    ], {
      columnSummary: [{ sourceColumn: 0, destinationRow: 2, destinationColumn: 0, type: 'sum', ranges: [[0, 1]] }],
    });

    hot.alter('insert_row_above', 2, 1);
    hot.setDataAtCell(2, 0, 7);
    bar.setActiveSheet('Untouched');

    expect(hot.getDataAtCol(0)).toEqual([10, 20, 30]);

    bar.setActiveSheet('Altered');

    expect(hot.getDataAtCol(0)).toEqual([1, 2, 7, 3]);
  });

  it('builds the grid with the opening sheet\'s `cell` and hooks without a settings update of their own', () => {
    const events = [];
    const sources = [];

    buildWorkbook([{
      name: 'Only',
      data: [['a', 'b']],
      settings: {
        cell: [{ row: 0, col: 1, readOnly: true }],
        afterChange() {},
        columns: [{
          sourceDataValidator: (value, cellMeta, source) => {
            sources.push(source);

            return true;
          },
        }, {}],
      },
    }], {
      afterUpdateSettings() {
        events.push('afterUpdateSettings');
      },
      afterInit() {
        events.push('afterInit');
      },
    });

    expect(events).toEqual(['afterInit']);
    expect(sources).toEqual(['init']);
    expect(hot.getCellMeta(0, 1).readOnly).toBe(true);
  });

  it('keeps a declared `cell` entry on its record across a row insert and a round trip', () => {
    const bar = buildWorkbook([
      { name: 'Alpha', data: [['locked', 'free']], settings: { cell: [{ row: 0, col: 0, readOnly: true }] } },
      { name: 'Beta', data: [['b']] },
    ]);

    hot.alter('insert_row_above', 0, 1);
    bar.setActiveSheet('Beta');
    bar.setActiveSheet('Alpha');

    expect([hot.getCellMeta(0, 0).readOnly, hot.getCellMeta(1, 0).readOnly]).toEqual([false, true]);
    expect(hot.getDataAtCell(1, 0)).toBe('locked');
  });

  it('keeps a declared `cell` entry on its record on a sheet that is not the opening one', () => {
    const bar = buildWorkbook([
      { name: 'Beta', data: [['b']] },
      { name: 'Alpha', data: [['locked', 'free']], settings: { cell: [{ row: 0, col: 0, readOnly: true }] } },
    ]);

    bar.setActiveSheet('Alpha');
    hot.alter('insert_row_above', 0, 1);
    bar.setActiveSheet('Beta');
    bar.setActiveSheet('Alpha');

    expect([hot.getCellMeta(0, 0).readOnly, hot.getCellMeta(1, 0).readOnly]).toEqual([false, true]);
  });

  it('gives a duplicated sheet the `cell` entries at the records its original holds them on now', () => {
    const bar = buildWorkbook([
      { name: 'Alpha', data: [['locked', 'free']], settings: { cell: [{ row: 0, col: 0, readOnly: true }] } },
    ]);

    hot.alter('insert_row_above', 0, 1);

    const copy = bar.duplicateSheet(bar.getSheets()[0].id);

    bar.setActiveSheet(copy.id);

    expect([hot.getCellMeta(0, 0).readOnly, hot.getCellMeta(1, 0).readOnly]).toEqual([false, true]);
  });
});
