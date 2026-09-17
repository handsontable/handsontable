import { applyImportResult, installImportedStyles, removeImportedStyles } from '../applier';
import * as consoleHelpers from '../../../helpers/console';

const STYLE_SELECTOR = 'style[data-hot-imported-styles="hot-1"]';

function fakeHot({ commentsEnabled = false, nestedHeaders } = {}) {
  const calls = [];
  const commentsPlugin = {
    isEnabled: () => commentsEnabled,
    setCommentAtCell: (row, col, value) => calls.push(['setCommentAtCell', row, col, value]),
  };

  return {
    calls,
    guid: 'hot-1',
    rootDocument: document,
    batch: (fn) => {
      calls.push(['batch:start']); const out = fn();

      calls.push(['batch:end']);

      return out;
    },
    updateSettings: settings => calls.push(['updateSettings', settings]),
    loadData: data => calls.push(['loadData', data]),
    setCellMetaObject: (row, col, meta) => calls.push(['setCellMetaObject', row, col, meta]),
    getPlugin: name => (name === 'comments' ? commentsPlugin : undefined),
    getSettings: () => ({ nestedHeaders }),
  };
}

describe('applyImportResult', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    document.head.querySelectorAll(STYLE_SELECTOR).forEach(element => element.remove());
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

    const styleEl = document.head.querySelector('style[data-hot-imported-styles="hot-1"]');

    expect(styleEl.textContent).toBe('.handsontable tbody > tr > td.htImported-a{font-weight:bold}');

    applyImportResult(
      hot, { data: [['b']], styles: { 'htImported-b': 'color:#ff0000' }, sheetNames: [], dropped: [] }
    );

    expect(document.head.querySelectorAll(STYLE_SELECTOR)).toHaveLength(1);
    expect(styleEl.textContent).toBe('.handsontable tbody > tr > td.htImported-b{color:#ff0000}');
  });

  it('should remove the stale stylesheet when the next import carries no styles at all', () => {
    const hot = fakeHot();

    applyImportResult(
      hot, { data: [['a']], styles: { 'htImported-a': 'font-weight:bold' }, sheetNames: [], dropped: [] }
    );

    expect(document.head.querySelector(STYLE_SELECTOR)).not.toBeNull();

    applyImportResult(hot, { data: [['b']], sheetNames: [], dropped: [] });

    expect(document.head.querySelector(STYLE_SELECTOR)).toBeNull();
  });

  it('should pass customBorders through updateSettings and install no stylesheet when there are no styles', () => {
    const hot = fakeHot();
    const borders = [{ row: 0, col: 0, top: { width: 1, color: '#0000ff' } }];

    applyImportResult(hot, { data: [['a']], customBorders: borders, sheetNames: [], dropped: [] });

    expect(hot.calls).toEqual([
      ['batch:start'], ['loadData', [['a']]], ['updateSettings', { customBorders: borders }], ['batch:end'],
    ]);
    expect(document.head.querySelector(STYLE_SELECTOR)).toBeNull();
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
    document.head.querySelectorAll(STYLE_SELECTOR).forEach(element => element.remove());
  });

  it('should remove a real installed stylesheet element from the document', () => {
    const hot = fakeHot();

    installImportedStyles(hot, { 'htImported-a': 'font-weight:bold' });

    expect(document.head.querySelector(STYLE_SELECTOR)).not.toBeNull();

    removeImportedStyles(hot);

    expect(document.head.querySelector(STYLE_SELECTOR)).toBeNull();
  });

  it('should not install a declaration that breaks out of the generated rule, and should warn once', () => {
    const hot = fakeHot();

    installImportedStyles(hot, {
      'htImported-a': 'font-weight:bold',
      'htImported-b': 'background-color:#0000ff}*{background-image:url(https://attacker.example/x)}',
    });

    const styleEl = document.head.querySelector(STYLE_SELECTOR);

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

    const styleEl = document.head.querySelector(STYLE_SELECTOR);

    expect(styleEl.textContent).toBe('.handsontable tbody > tr > td.htImported-9z-2{color:#00ff00}');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('htImported-a, body');
  });

  it('should install nothing and leave no element when every rule is rejected', () => {
    const hot = fakeHot();

    installImportedStyles(hot, { 'htImported-a': 'background-image:url("https://attacker.example/x")' });

    expect(document.head.querySelector(STYLE_SELECTOR)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
