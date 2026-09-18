import { applyImportResult, installImportedStyles, removeImportedStyles } from '../applier';
import * as consoleHelpers from '../../../helpers/console';

const STYLE_SELECTOR = 'style[data-hot-imported-styles="hot-1"]';

function fakeHot({ commentsEnabled = false, nestedHeaders, gridSettings = {}, toVisualRow = row => row } = {}) {
  const calls = [];
  const rootWrapperElement = document.createElement('div');

  document.body.appendChild(rootWrapperElement);
  const commentsPlugin = {
    isEnabled: () => commentsEnabled,
    setCommentAtCell: (row, col, value) => calls.push(['setCommentAtCell', row, col, value]),
  };

  return {
    calls,
    guid: 'hot-1',
    rootDocument: document,
    rootWrapperElement,
    toVisualRow,
    toVisualColumn: col => col,
    batch: (fn) => {
      calls.push(['batch:start']); const out = fn();

      calls.push(['batch:end']);

      return out;
    },
    updateSettings: settings => calls.push(['updateSettings', settings]),
    loadData: data => calls.push(['loadData', data]),
    setCellMetaObject: (row, col, meta) => calls.push(['setCellMetaObject', row, col, meta]),
    getPlugin: name => (name === 'comments' ? commentsPlugin : undefined),
    getSettings: () => ({ nestedHeaders, ...gridSettings }),
  };
}

describe('applyImportResult', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    document.querySelectorAll(STYLE_SELECTOR).forEach(element => element.remove());
  });

  it('should load the data first, then update only the settings the result carries, inside one batch', () => {
    const hot = fakeHot();

    applyImportResult(hot, {
      data: [['a', 1]],
      colHeaders: ['Name', 'Amount'],
      columns: [{ type: 'text' }, { type: 'numeric', numericFormat: { minimumFractionDigits: 0, useGrouping: false } }],
      mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
      hiddenColumns: [1],
      fixedRowsTop: 1,
      colWidths: [70, undefined],
      sheetNames: ['Data'],
      dropped: [],
    });

    expect(hot.calls).toEqual([
      ['batch:start'],
      ['loadData', [['a', 1]]],
      ['updateSettings', {
        colHeaders: ['Name', 'Amount'],
        columns: [
          { type: 'text' },
          { type: 'numeric', numericFormat: { minimumFractionDigits: 0, useGrouping: false } },
        ],
        mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
        hiddenColumns: { columns: [1] },
        fixedRowsTop: 1,
        colWidths: [70, undefined],
      }],
      ['batch:end'],
    ]);
  });

  it('should have the data in the grid before a merge is applied, so it is not validated against an empty table', () => {
    const hot = fakeHot();

    applyImportResult(hot, {
      data: [['a'], ['b'], ['c']],
      mergeCells: [{ row: 1, col: 0, rowspan: 2, colspan: 1 }],
      fixedRowsTop: 1,
      hiddenRows: [2],
      sheetNames: [],
      dropped: [],
    });

    const loadDataIndex = hot.calls.findIndex(call => call[0] === 'loadData');
    const settingsIndex = hot.calls.findIndex(
      call => call[0] === 'updateSettings' && call[1].mergeCells !== undefined
    );

    expect(loadDataIndex).toBeGreaterThan(-1);
    expect(settingsIndex).toBeGreaterThan(loadDataIndex);
    expect(hot.calls[settingsIndex][1]).toEqual({
      mergeCells: [{ row: 1, col: 0, rowspan: 2, colspan: 1 }],
      fixedRowsTop: 1,
      hiddenRows: { rows: [2] },
    });
  });

  it('should wrap hidden rows and columns in their plugin option shapes and set rowHeaders', () => {
    const hot = fakeHot();

    applyImportResult(
      hot, { data: [], rowHeaders: true, hiddenRows: [2], hiddenColumns: [0], sheetNames: [], dropped: [] }
    );

    expect(hot.calls[2]).toEqual(['updateSettings', {
      rowHeaders: true,
      hiddenRows: { rows: [2] },
      hiddenColumns: { columns: [0] },
    }]);
  });

  it('should apply per-cell meta after the data and comments only when the plugin is enabled', () => {
    const hot = fakeHot({ commentsEnabled: true });

    applyImportResult(hot, {
      data: [['a']],
      cellsMeta: [{ row: 0, col: 0, meta: { readOnly: true } }],
      comments: [{ row: 0, col: 0, value: 'note' }],
      sheetNames: [],
      dropped: [],
    });

    expect(hot.calls.slice(1)).toEqual([
      ['loadData', [['a']]],
      ['setCellMetaObject', 0, 0, { readOnly: true }],
      ['setCommentAtCell', 0, 0, 'note'],
      ['batch:end'],
    ]);
  });

  it('should skip comments when the comments plugin is disabled', () => {
    const hot = fakeHot({ commentsEnabled: false });

    applyImportResult(
      hot, { data: [['a']], comments: [{ row: 0, col: 0, value: 'note' }], sheetNames: [], dropped: [] }
    );

    expect(hot.calls.some(call => call[0] === 'setCommentAtCell')).toBe(false);
  });

  it('should call loadData even when nothing else is in the result', () => {
    const hot = fakeHot();

    applyImportResult(hot, { data: [[1]], sheetNames: [], dropped: [] });

    expect(hot.calls).toEqual([['batch:start'], ['loadData', [[1]]], ['batch:end']]);
  });

  it('should install one owned stylesheet with the generated rules and replace it on the next import', () => {
    const hot = fakeHot();

    applyImportResult(
      hot, { data: [['a']], styles: { 'htImported-a': 'font-weight:bold' }, sheetNames: [], dropped: [] }
    );

    const styleEl = document.querySelector('style[data-hot-imported-styles="hot-1"]');

    expect(styleEl.textContent).toBe('.handsontable tbody > tr > td.htImported-a{font-weight:bold}');

    applyImportResult(
      hot, { data: [['b']], styles: { 'htImported-b': 'color:#ff0000' }, sheetNames: [], dropped: [] }
    );

    expect(document.querySelectorAll(STYLE_SELECTOR)).toHaveLength(1);
    expect(styleEl.textContent).toBe('.handsontable tbody > tr > td.htImported-b{color:#ff0000}');
  });

  it('should remove the stale stylesheet when the next import carries no styles at all', () => {
    const hot = fakeHot();

    applyImportResult(
      hot, { data: [['a']], styles: { 'htImported-a': 'font-weight:bold' }, sheetNames: [], dropped: [] }
    );

    expect(document.querySelector(STYLE_SELECTOR)).not.toBeNull();

    applyImportResult(hot, { data: [['b']], sheetNames: [], dropped: [] });

    expect(document.querySelector(STYLE_SELECTOR)).toBeNull();
  });

  it('should pass customBorders through updateSettings and install no stylesheet when there are no styles', () => {
    const hot = fakeHot();
    const borders = [{ row: 0, col: 0, top: { width: 1, color: '#0000ff' } }];

    applyImportResult(hot, { data: [['a']], customBorders: borders, sheetNames: [], dropped: [] });

    expect(hot.calls).toEqual([
      ['batch:start'], ['loadData', [['a']]], ['updateSettings', { customBorders: borders }], ['batch:end'],
    ]);
    expect(document.querySelector(STYLE_SELECTOR)).toBeNull();
  });

  it('should never pass layoutDirection to updateSettings, since the grid reads it at construction only', () => {
    const hot = fakeHot();

    applyImportResult(hot, {
      data: [['a']],
      layoutDirection: 'rtl',
      fixedRowsTop: 1,
      sheetNames: ['Data'],
      dropped: [],
    });

    expect(hot.calls).toEqual([
      ['batch:start'],
      ['loadData', [['a']]],
      ['updateSettings', { fixedRowsTop: 1 }],
      ['batch:end'],
    ]);
  });

  it('should pass nestedHeaders through updateSettings, which is what enables the plugin', () => {
    const hot = fakeHot();
    const nestedHeaders = [[{ label: 'Team', colspan: 2 }, 'Totals'], ['Name', 'Role', 'Revenue']];

    applyImportResult(hot, {
      data: [['Ana García', 'Analyst', 4200.5]],
      nestedHeaders,
      sheetNames: ['Data'],
      dropped: [],
    });

    expect(hot.calls).toEqual([
      ['batch:start'],
      ['loadData', [['Ana García', 'Analyst', 4200.5]]],
      ['updateSettings', { nestedHeaders }],
      ['batch:end'],
    ]);
  });

  it('should clear a configured nestedHeaders setting when a later import promotes a single header row', () => {
    const hot = fakeHot({ nestedHeaders: [['Team', 'Role']] });

    applyImportResult(hot, { data: [['Ana']], colHeaders: ['Name'], sheetNames: [], dropped: [] });

    expect(hot.calls[2]).toEqual(['updateSettings', { colHeaders: ['Name'], nestedHeaders: false }]);
  });

  it('should not add nestedHeaders: false when the grid has no nestedHeaders configured', () => {
    const hot = fakeHot();

    applyImportResult(hot, { data: [['Ana']], colHeaders: ['Name'], sheetNames: [], dropped: [] });

    expect(hot.calls[2]).toEqual(['updateSettings', { colHeaders: ['Name'] }]);
  });

  it('should not touch nestedHeaders when the result carries no colHeaders at all', () => {
    const hot = fakeHot({ nestedHeaders: [['Team', 'Role']] });

    applyImportResult(hot, { data: [['Ana']], fixedRowsTop: 1, sheetNames: [], dropped: [] });

    expect(hot.calls[2]).toEqual(['updateSettings', { fixedRowsTop: 1 }]);
  });
});

describe('installImportedStyles / removeImportedStyles', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    document.querySelectorAll(STYLE_SELECTOR).forEach(element => element.remove());
  });

  it('should remove a real installed stylesheet element from the document', () => {
    const hot = fakeHot();

    installImportedStyles(hot, { 'htImported-a': 'font-weight:bold' });

    expect(document.querySelector(STYLE_SELECTOR)).not.toBeNull();

    removeImportedStyles(hot);

    expect(document.querySelector(STYLE_SELECTOR)).toBeNull();
  });

  it('should not install a declaration that breaks out of the generated rule, and should warn once', () => {
    const hot = fakeHot();

    installImportedStyles(hot, {
      'htImported-a': 'font-weight:bold',
      'htImported-b': 'background-color:#0000ff}*{background-image:url(https://attacker.example/x)}',
    });

    const styleEl = document.querySelector(STYLE_SELECTOR);

    expect(styleEl.textContent).toBe('.handsontable tbody > tr > td.htImported-a{font-weight:bold}');
    expect(styleEl.textContent).not.toContain('attacker.example');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('htImported-b');
  });

  it('should reject a class name that is not the generated shape, so it can never become a selector', () => {
    const hot = fakeHot();

    installImportedStyles(hot, {
      'htImported-a, body': 'background-color:#ff0000',
      'htImported-9z-2': 'color:#00ff00',
    });

    const styleEl = document.querySelector(STYLE_SELECTOR);

    expect(styleEl.textContent).toBe('.handsontable tbody > tr > td.htImported-9z-2{color:#00ff00}');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('htImported-a, body');
  });

  it('should install nothing and leave no element when every rule is rejected', () => {
    const hot = fakeHot();

    installImportedStyles(hot, { 'htImported-a': 'background-image:url("https://attacker.example/x")' });

    expect(document.querySelector(STYLE_SELECTOR)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

});

describe('applyImportResult – layout across imports', () => {
  it('should clear the layout a previous import left when the new result carries none', () => {
    // Import a merged, frozen sheet with hidden rows, then a plain one: the first file's layout used
    // to stay on the second file's data.
    const hot = fakeHot({
      gridSettings: {
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }],
        hiddenRows: { rows: [1], indicators: true },
        hiddenColumns: { columns: [0] },
        fixedRowsTop: 1,
        fixedColumnsStart: 1,
        customBorders: [{ row: 0, col: 0, top: { width: 1, color: 'red' } }],
      },
    });

    applyImportResult(hot, { data: [['a']], sheetNames: ['Plain'], dropped: [] }, { importLayout: true });

    expect(hot.calls[2]).toEqual(['updateSettings', {
      mergeCells: [],
      hiddenRows: { rows: [], indicators: true },
      hiddenColumns: { columns: [] },
      fixedRowsTop: 0,
      fixedColumnsStart: 0,
      customBorders: [],
    }]);
  });

  it('should reset widths and heights as own undefined properties, and columns as empty column settings', () => {
    // `updateSettings` writes every own property it is handed, so an explicit `undefined` restores a
    // width or height default. `columns` needs a defined value: the column-meta cache reset and
    // `initIndexMappers` run only for one, so an empty setting per imported column is sent instead.
    const hot = fakeHot({
      gridSettings: { colWidths: [70, 90], rowHeights: [40], columns: [{ type: 'numeric', readOnly: true }] },
    });

    applyImportResult(hot, { data: [['a', 'b'], ['c']], sheetNames: ['Plain'], dropped: [] }, { importLayout: true });

    const [, settings] = hot.calls[2];

    expect(Object.keys(settings).sort()).toEqual(['colWidths', 'columns', 'rowHeights']);
    expect(settings).toEqual({ colWidths: undefined, rowHeights: undefined, columns: [{}, {}] });
  });

  it('should reset columns even without importLayout, since types are not layout', () => {
    const hot = fakeHot({ gridSettings: { columns: [{ type: 'numeric' }], colWidths: [70] } });

    applyImportResult(hot, { data: [['a']], sheetNames: ['Plain'], dropped: [] }, { importLayout: false });

    expect(hot.calls[2]).toEqual(['updateSettings', { columns: [{}] }]);
  });

  it('should size the reset from the headers when the sheet has no data cells', () => {
    // A header-only sheet: `data` is empty, but `colHeaders` says two columns. `columns: []` would
    // pin the grid at zero columns and the headers would never appear.
    const hot = fakeHot({ gridSettings: { columns: [{ type: 'numeric' }] } });

    applyImportResult(hot, { data: [], colHeaders: ['A', 'B'], sheetNames: ['Head'], dropped: [] });

    expect(hot.calls[2]).toEqual(['updateSettings', { colHeaders: ['A', 'B'], columns: [{}, {}] }]);

    const nested = fakeHot({ gridSettings: { columns: [{ type: 'numeric' }] } });

    applyImportResult(nested, {
      data: [], nestedHeaders: [[{ label: 'G', colspan: 2 }, 'C'], ['a', 'b', 'c']], sheetNames: ['Head'], dropped: [],
    });

    expect(nested.calls[2][1].columns).toEqual([{}, {}, {}]);
  });

  it('should leave columns alone when the result describes no width at all', () => {
    const hot = fakeHot({ gridSettings: { columns: [{ type: 'numeric' }] } });

    applyImportResult(hot, { data: [], sheetNames: ['Empty'], dropped: [] });

    expect(hot.calls.map(call => call[0])).toEqual(['batch:start', 'loadData', 'batch:end']);
  });

  it('should not send columns to a grid that never had any', () => {
    const hot = fakeHot({ gridSettings: {} });

    applyImportResult(hot, { data: [['a']], sheetNames: ['Plain'], dropped: [] });

    expect(hot.calls.map(call => call[0])).toEqual(['batch:start', 'loadData', 'batch:end']);
  });

  it('should leave the grid layout alone when the result was produced without importLayout', () => {
    const hot = fakeHot({
      gridSettings: { mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }], fixedRowsTop: 1 },
    });

    applyImportResult(hot, { data: [['a']], sheetNames: ['Plain'], dropped: [] }, { importLayout: false });

    expect(hot.calls.map(call => call[0])).toEqual(['batch:start', 'loadData', 'batch:end']);
  });

  it('should not touch a layout plugin the grid never enabled', () => {
    const hot = fakeHot({ gridSettings: {} });

    applyImportResult(hot, { data: [['a']], sheetNames: ['Plain'], dropped: [] }, { importLayout: true });

    expect(hot.calls.map(call => call[0])).toEqual(['batch:start', 'loadData', 'batch:end']);
  });

  it('should merge the imported list into an options-object setting instead of replacing it', () => {
    const hot = fakeHot({
      gridSettings: {
        hiddenRows: { indicators: true, copyPasteEnabled: false },
        hiddenColumns: { indicators: true },
        mergeCells: { virtualized: true },
      },
    });

    applyImportResult(hot, {
      data: [['a'], ['b']],
      hiddenRows: [1],
      hiddenColumns: [0],
      mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }],
      sheetNames: ['Data'],
      dropped: [],
    });

    expect(hot.calls[2]).toEqual(['updateSettings', {
      mergeCells: { virtualized: true, cells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }] },
      hiddenRows: { indicators: true, copyPasteEnabled: false, rows: [1] },
      hiddenColumns: { indicators: true, columns: [0] },
    }]);
  });
});

describe('applyImportResult – coordinates', () => {
  it('should translate sheet rows to visual rows before writing meta and comments', () => {
    // A `manualRowMove` array reorders rows inside `loadData`, so sheet row 0 may render as visual
    // row 1; `setCellMetaObject` and `setCommentAtCell` take the visual index.
    const hot = fakeHot({ commentsEnabled: true, toVisualRow: row => [1, 0][row] });

    applyImportResult(hot, {
      data: [['a'], ['b']],
      cellsMeta: [{ row: 0, col: 0, meta: { readOnly: true } }],
      comments: [{ row: 1, col: 0, value: 'note' }],
      sheetNames: ['Data'],
      dropped: [],
    });

    expect(hot.calls).toEqual(expect.arrayContaining([
      ['setCellMetaObject', 1, 0, { readOnly: true }],
      ['setCommentAtCell', 0, 0, 'note'],
    ]));
  });
});

describe('applyImportResult – trimmed indexes', () => {
  it('should skip meta and comments whose physical index has no visual counterpart', () => {
    // `trimRows` leaves a trimmed physical row with `toVisualRow() === null`; there is no cell to
    // write to, and passing `null` on used to throw mid-batch and skip the rest.
    const hot = fakeHot({ commentsEnabled: true, toVisualRow: row => (row === 0 ? null : row) });

    applyImportResult(hot, {
      data: [['a'], ['b']],
      cellsMeta: [{ row: 0, col: 0, meta: { readOnly: true } }, { row: 1, col: 0, meta: { className: 'x' } }],
      comments: [{ row: 0, col: 0, value: 'gone' }, { row: 1, col: 0, value: 'kept' }],
      sheetNames: ['Data'],
      dropped: [],
    });

    const writes = hot.calls.filter(([name]) => name === 'setCellMetaObject' || name === 'setCommentAtCell');

    expect(writes).toEqual([
      ['setCellMetaObject', 1, 0, { className: 'x' }],
      ['setCommentAtCell', 1, 0, 'kept'],
    ]);
  });
});

describe('installImportedStyles – mount point', () => {
  it('should mount the stylesheet inside the instance wrapper, where a shadow root can see it', () => {
    const hot = fakeHot();

    installImportedStyles(hot, { 'htImported-a1': 'color:#ff0000' });

    const styleEl = hot.rootWrapperElement.querySelector(STYLE_SELECTOR);

    expect(styleEl).not.toBeNull();
    expect(document.head.querySelector(STYLE_SELECTOR)).toBeNull();

    removeImportedStyles(hot);

    expect(hot.rootWrapperElement.querySelector(STYLE_SELECTOR)).toBeNull();
  });
});
