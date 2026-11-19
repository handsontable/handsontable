import { HyperFormula } from 'hyperformula';
import { applyImportResult, installImportedStyles, removeImportedStyles } from '../applier';
import { fontFillRule } from '../styles';
import { READ_ONLY_FILL_ARGB, READ_ONLY_TEXT_ARGB } from '../../../utils/xlsxEngine/readOnlyStyle';
import * as consoleHelpers from '../../../helpers/console';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../../formulas/formulas';
import { UndoRedo } from '../../undoRedo/undoRedo';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerPlugin(Formulas);
registerPlugin(UndoRedo);

const STYLE_SELECTOR = 'style[data-hot-imported-styles="hot-1"]';

function fakeHot({
  commentsEnabled = false,
  commentsRuns = commentsEnabled,
  nestedHeaders,
  gridSettings = {},
  toVisualRow = row => row,
  formulas,
} = {}) {
  const calls = [];
  const rootWrapperElement = document.createElement('div');

  document.body.appendChild(rootWrapperElement);
  const commentsPlugin = {
    isEnabled: () => commentsEnabled,
    enabled: commentsRuns,
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
    getPlugin: name => ({ comments: commentsPlugin, formulas })[name],
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

  it('should apply the column types once, then the data, then the other settings the result carries, in one batch', () => {
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

    // The column types go first, so `loadData` validates the new data against them rather than
    // against the previous grid's types; the layout keys (merges, freeze, widths) stay after it.
    expect(hot.calls).toEqual([
      ['batch:start'],
      ['updateSettings', {
        columns: [
          { type: 'text' },
          { type: 'numeric', numericFormat: { minimumFractionDigits: 0, useGrouping: false } },
        ],
      }],
      ['loadData', [['a', 1]]],
      // `loadData` keeps the `columns` option, so it is not sent a second time (review round 12).
      ['updateSettings', {
        colHeaders: ['Name', 'Amount'],
        mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
        hiddenColumns: { columns: [1] },
        fixedRowsTop: 1,
        colWidths: [70, undefined],
      }],
      ['batch:end'],
    ]);
  });

  it('should apply the row heights of the workbook as a floor (`minRowHeights`), never as exact `rowHeights`', () => {
    // The reader keeps every row's `ht`, also the height the producing app measured. As exact heights,
    // a LibreOffice file (20 px on every row) would clip its text below the theme's row height.
    const hot = fakeHot();

    applyImportResult(hot, {
      data: [['a'], ['b']],
      rowHeights: [20, undefined],
      sheetNames: [],
      dropped: [],
    });

    const [, settings] = hot.calls.find(([name, value]) => name === 'updateSettings' && value.minRowHeights);

    // The exact heights the grid held are dropped, or they would win over the imported ones per row.
    expect(settings).toEqual({ minRowHeights: [20, undefined], rowHeights: undefined });
    expect(Object.keys(settings)).toContain('rowHeights');
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

  it('should skip comments when the comments option is on but the plugin does not run', () => {
    // A license key can keep the plugin off while its option stays on.
    const hot = fakeHot({ commentsEnabled: true, commentsRuns: false });

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

  it('should return the rules it installed without the rejected ones, so installing them again warns about nothing', () => {
    const hot = fakeHot();
    const installed = installImportedStyles(hot, {
      'htImported-a': 'font-weight:bold',
      'htImported-b': 'background-image:url("https://attacker.example/x")',
    });

    expect(installed).toEqual({ 'htImported-a': 'font-weight:bold' });

    warnSpy.mockClear();

    expect(installImportedStyles(hot, installed)).toEqual(installed);
    expect(warnSpy).not.toHaveBeenCalled();
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
      gridSettings: { colWidths: [70, 90], minRowHeights: [40], columns: [{ type: 'numeric', readOnly: true }] },
    });

    applyImportResult(hot, { data: [['a', 'b'], ['c']], sheetNames: ['Plain'], dropped: [] }, { importLayout: true });

    expect(hot.calls[1]).toEqual(['updateSettings', { columns: [{}, {}] }]);

    const [, settings] = hot.calls[3];

    expect(Object.keys(settings).sort()).toEqual(['colWidths', 'minRowHeights', 'rowHeights']);
    expect(settings).toEqual({ colWidths: undefined, minRowHeights: undefined, rowHeights: undefined });
  });

  it('should reset columns even without importLayout, since types are not layout', () => {
    const hot = fakeHot({ gridSettings: { columns: [{ type: 'numeric' }], colWidths: [70] } });

    applyImportResult(hot, { data: [['a']], sheetNames: ['Plain'], dropped: [] }, { importLayout: false });

    expect(hot.calls[1]).toEqual(['updateSettings', { columns: [{}] }]);
    expect(hot.calls.filter(call => call[0] === 'updateSettings')).toHaveLength(1);
  });

  it('should size the reset from the headers when the sheet has no data cells', () => {
    // A header-only sheet: `data` is empty, but `colHeaders` says two columns. `columns: []` would
    // pin the grid at zero columns and the headers would never appear.
    const hot = fakeHot({ gridSettings: { columns: [{ type: 'numeric' }] } });

    applyImportResult(hot, { data: [], colHeaders: ['A', 'B'], sheetNames: ['Head'], dropped: [] });

    expect(hot.calls[1]).toEqual(['updateSettings', { columns: [{}, {}] }]);
    expect(hot.calls[3]).toEqual(['updateSettings', { colHeaders: ['A', 'B'] }]);

    const nested = fakeHot({ gridSettings: { columns: [{ type: 'numeric' }] } });

    applyImportResult(nested, {
      data: [], nestedHeaders: [[{ label: 'G', colspan: 2 }, 'C'], ['a', 'b', 'c']], sheetNames: ['Head'], dropped: [],
    });

    expect(nested.calls[1][1].columns).toEqual([{}, {}, {}]);
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

describe('installImportedStyles - declaration allow-list', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    document.querySelectorAll(STYLE_SELECTOR).forEach(element => element.remove());
  });

  function installs(declarations) {
    const hot = fakeHot();

    installImportedStyles(hot, { 'htImported-a': declarations });

    const installed = document.querySelector(STYLE_SELECTOR) !== null;

    removeImportedStyles(hot);

    return installed;
  }

  /**
   * Every rule `fontFillRule` can produce: each combination of the three font flags and the two
   * colors, with six- and eight-digit, upper- and lower-case ARGB input, on read-only and editable
   * cells alike. Derived from `fontFillRule` itself, so the allow-list cannot drift from it.
   */
  function everyFontFillRule() {
    const rules = [];
    const colors = [undefined, 'FF00FF00', 'ab12cd', READ_ONLY_TEXT_ARGB, READ_ONLY_FILL_ARGB];

    [false, true].forEach((bold) => {
      [false, true].forEach((italic) => {
        [false, true].forEach((underline) => {
          colors.forEach((color) => {
            colors.forEach((fill) => {
              [false, true].forEach((readOnly) => {
                const rule = fontFillRule({
                  font: { bold, italic, underline, color: color ? { argb: color } : undefined },
                  fill: fill ? { fgColor: { argb: fill } } : undefined,
                }, { readOnly });

                if (rule) {
                  rules.push(rule.declarations);
                }
              });
            });
          });
        });
      });
    });

    return rules;
  }

  it('should accept every declaration block fontFillRule can produce', () => {
    const rules = everyFontFillRule();

    // Sanity: the derivation reaches every declaration shape the builder writes.
    expect(rules).toContain('font-weight:bold;font-style:italic;text-decoration:underline;color:#00ff00;'
      + 'background-color:#ab12cd');
    expect(rules.length).toBeGreaterThan(100);

    rules.forEach((declarations) => {
      expect([declarations, installs(declarations)]).toEqual([declarations, true]);
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  [
    'color:expression(alert(1))',
    'background-color:rgb(1,2,3)',
    'background-image:url(x.png)',
    'background:url(x.png)',
    '-moz-binding:url(x.xml)',
    'behavior:url(x.htc)',
    'list-style-image:url(x.png)',
    'cursor:url(x.cur)',
    'content:attr(title)',
    'color:red',
    'color:#ff0000 ',
    'color:#ff00',
    'color:#ff0000;font-weight:900',
    'font-weight:bold;position:fixed',
    'font-style:oblique',
    // Text after an allowed keyword breaks out of the rule.
    'font-weight:bold}td{background:url(x.png)',
    'font-style:italic}td{background:url(x.png)',
    // Text before an allowed color breaks out of the rule.
    'color:red}td{background:url(//x.example/a.png)}td{color:#000000',
    'background-color:x#000000',
    'color:##000000',
    'text-decoration:underline overline',
    'font-weight:bold;',
    'font-weight:bold;;color:#000000',
    'constructor:#000000',
    '',
  ].forEach((declarations) => {
    it(`should reject "${declarations}"`, () => {
      expect(installs(declarations)).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });
});

describe('applyImportResult – named expressions', () => {
  /**
   * A Formulas plugin stand-in whose engine records `addNamedExpression` into `calls` and refuses
   * the names in `refused`, the way HyperFormula refuses a name it already defines.
   *
   * @param {Array} calls The call log.
   * @param {boolean} enabled Whether the plugin is enabled.
   * @param {string[]} [refused] The names the engine refuses.
   * @returns {object}
   */
  function formulasPlugin(calls, enabled, refused = []) {
    return {
      isEnabled: () => enabled,
      enabled,
      engine: {
        // Never used: in HyperFormula 3.3 a batch makes every add walk the batch's undo entry.
        batch: () => {
          throw new Error('engine.batch() called');
        },
        suspended: false,
        suspendEvaluation() {
          calls.push(['engine.suspend']);
          this.suspended = true;
        },
        resumeEvaluation() {
          calls.push(['engine.resume']);
          this.suspended = false;
        },
        isEvaluationSuspended() {
          return this.suspended;
        },
        isItPossibleToAddNamedExpression: name => !refused.includes(name),
        addNamedExpression: (name, expression) => {
          if (refused.includes(name)) {
            throw new Error(`Name ${name} already exists`);
          }

          calls.push(['addNamedExpression', name, expression]);
        },
      },
    };
  }

  /**
   * A fake grid whose own calls go into the engine's log too, so their order is visible.
   *
   * @param {Array} order The shared call log.
   * @param {string[]} [refused] The names the engine refuses.
   * @returns {object}
   */
  function orderedHot(order, refused) {
    const hot = fakeHot({ formulas: formulasPlugin(order, true, refused) });

    hot.loadData = data => order.push(['loadData', data]);
    hot.updateSettings = settings => order.push(['updateSettings', Object.keys(settings)]);
    hot.batch = (fn) => {
      order.push(['batch:start']);
      fn();
      order.push(['batch:end']);
    };

    return hot;
  }

  it('should add every named expression inside the grid batch, before the column types and the data', () => {
    const order = [];

    applyImportResult(orderedHot(order), {
      data: [['=SUM(Sales)']],
      columns: [{ type: 'numeric' }],
      namedExpressions: [{ name: 'Sales', formula: 'Sheet1!$F$1:$F$3' }, { name: 'TaxRate', formula: '0.07' }],
    });

    expect(order).toEqual([
      ['batch:start'],
      ['engine.suspend'],
      ['addNamedExpression', 'Sales', '=Sheet1!$F$1:$F$3'],
      ['addNamedExpression', 'TaxRate', '=0.07'],
      ['engine.resume'],
      ['updateSettings', ['columns']],
      ['loadData', [['=SUM(Sales)']]],
      ['batch:end'],
    ]);
  });

  it('should skip and report a name the engine defined since the mapper asked, instead of throwing mid-batch', () => {
    // A `beforeImport` handler, or another grid on a shared engine, defined `Sales` in between. The
    // formula over it stays live, so the report says why it does not read the file's `Sales`.
    const order = [];
    const result = {
      data: [['=SUM(Sales)']],
      namedExpressions: [{ name: 'Sales', formula: 'Sheet1!$F$1:$F$3' }, { name: 'TaxRate', formula: '0.07' }],
      dropped: [],
    };

    expect(() => applyImportResult(orderedHot(order, ['Sales']), result)).not.toThrow();
    expect(order).toEqual([
      ['batch:start'],
      ['engine.suspend'],
      ['addNamedExpression', 'TaxRate', '=0.07'],
      ['engine.resume'],
      ['loadData', [['=SUM(Sales)']]],
      ['batch:end'],
    ]);
    expect(result.dropped).toEqual(['definedNames:unsupported']);
  });

  it('should report a name the engine refuses inside the batch, after an earlier name went in', () => {
    const order = [];
    const result = {
      data: [['=SUM(Sales)']],
      namedExpressions: [{ name: 'TaxRate', formula: '0.07' }, { name: 'Sales', formula: 'Sheet1!$F$1:$F$3' }],
      dropped: [],
    };

    applyImportResult(orderedHot(order, ['Sales']), result);

    expect(order).toEqual([
      ['batch:start'],
      ['engine.suspend'],
      ['addNamedExpression', 'TaxRate', '=0.07'],
      ['engine.resume'],
      ['loadData', [['=SUM(Sales)']]],
      ['batch:end'],
    ]);
    expect(result.dropped).toEqual(['definedNames:unsupported']);
  });

  it('should report nothing when the engine takes every name', () => {
    const result = {
      data: [['=SUM(Sales)']],
      namedExpressions: [{ name: 'Sales', formula: 'Sheet1!$F$1:$F$3' }, { name: 'TaxRate', formula: '0.07' }],
      dropped: [],
    };

    applyImportResult(orderedHot([]), result);

    expect(result.dropped).toEqual([]);
  });

  it('should add the names without a batch of its own to an engine the caller suspended', () => {
    // The end of a batch resumes evaluation, which would end the caller's suspension too.
    const order = [];
    const hot = orderedHot(order);

    hot.getPlugin('formulas').engine.isEvaluationSuspended = () => true;

    applyImportResult(hot, {
      data: [['=SUM(Sales)']],
      namedExpressions: [{ name: 'Sales', formula: 'Sheet1!$F$1:$F$3' }],
    });

    expect(order).toEqual([
      ['batch:start'],
      ['addNamedExpression', 'Sales', '=Sheet1!$F$1:$F$3'],
      ['loadData', [['=SUM(Sales)']]],
      ['batch:end'],
    ]);
  });

  it('should remove a name whose add threw, report it, and go on with the other names and the data', () => {
    // `addNamedExpression` evaluates the definition at once: over a huge range HyperFormula threw
    // `RangeError: Invalid array length` out of the import and left the engine broken.
    const order = [];
    const hot = orderedHot(order);
    const { engine } = hot.getPlugin('formulas');
    const listed = [];

    engine.addNamedExpression = (name, expression) => {
      listed.push(name);

      if (name === 'Huge') {
        throw new RangeError('Invalid array length');
      }

      order.push(['addNamedExpression', name, expression]);
    };
    engine.listNamedExpressions = () => listed.slice();
    engine.removeNamedExpression = (name) => {
      listed.splice(listed.indexOf(name), 1);
      order.push(['removeNamedExpression', name]);
    };

    const result = {
      data: [['=SUM(Huge)']],
      namedExpressions: [{ name: 'Huge', formula: 'SUM(Sheet1!$A$1:$ZZ$10000)' }, { name: 'TaxRate', formula: '0.07' }],
      dropped: ['cellStyles'],
    };

    expect(() => applyImportResult(hot, result)).not.toThrow();
    expect(order).toEqual([
      ['batch:start'],
      ['engine.suspend'],
      ['removeNamedExpression', 'Huge'],
      ['addNamedExpression', 'TaxRate', '=0.07'],
      ['engine.resume'],
      ['loadData', [['=SUM(Huge)']]],
      ['batch:end'],
    ]);
    expect(listed).toEqual(['TaxRate']);
    expect(result.dropped).toEqual(['cellStyles', 'definedNames:unsupported']);
  });

  it('should add no name to an engine that cannot say whether it takes one, instead of throwing', () => {
    // `isItPossibleToAddNamedExpression` is optional on the engine type: an engine without it gets
    // no name rather than a `TypeError` in the middle of the batch.
    const order = [];
    const hot = orderedHot(order);

    delete hot.getPlugin('formulas').engine.isItPossibleToAddNamedExpression;

    expect(() => applyImportResult(hot, {
      data: [['=SUM(Sales)']],
      namedExpressions: [{ name: 'Sales', formula: 'Sheet1!$F$1:$F$3' }],
    })).not.toThrow();
    expect(order).toEqual([
      ['batch:start'],
      ['loadData', [['=SUM(Sales)']]],
      ['batch:end'],
    ]);
  });

  it('should not suspend the engine, and report the names, when the engine refuses every name', () => {
    const order = [];
    const result = {
      data: [['=SUM(Sales)']],
      namedExpressions: [{ name: 'Sales', formula: 'Sheet1!$F$1:$F$3' }, { name: 'TaxRate', formula: '0.07' }],
      dropped: [],
    };

    applyImportResult(orderedHot(order, ['Sales', 'TaxRate']), result);

    expect(order).toEqual([
      ['batch:start'],
      ['loadData', [['=SUM(Sales)']]],
      ['batch:end'],
    ]);
    expect(result.dropped).toEqual(['definedNames:unsupported']);
  });

  it('should not suspend the engine when the result holds no named expression', () => {
    const order = [];

    applyImportResult(orderedHot(order), { data: [[1]], namedExpressions: [] });

    expect(order).toEqual([['batch:start'], ['loadData', [[1]]], ['batch:end']]);
  });

  it('should not touch the engine when the Formulas plugin is off', () => {
    const calls = [];
    const hot = fakeHot({ formulas: formulasPlugin(calls, false) });

    applyImportResult(hot, { data: [[1]], namedExpressions: [{ name: 'TaxRate', formula: '0.07' }] });

    expect(calls).toEqual([]);
  });

  describe('in a real grid', () => {
    let container;
    let hot;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      hot?.destroy();
      hot = null;
      container.remove();
    });

    it('should evaluate an imported formula over an imported name, as a step that is not undoable', () => {
      hot = new Handsontable(container, {
        licenseKey: TEST_LICENSE_KEY,
        data: [[null]],
        formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
        undo: true,
      });

      applyImportResult(hot, {
        data: [[10, '=SUM(Sales)'], [20, null], [30, null]],
        namedExpressions: [{ name: 'Sales', formula: 'Sheet1!$A$1:$A$3' }],
      });

      expect(hot.getDataAtCell(0, 1)).toBe(60);
      expect(hot.getPlugin('formulas').engine.getNamedExpressionFormula('Sales')).toBe('=Sheet1!$A$1:$A$3');
      // `loadData` resets the grid's history: the import, names included, is not an undoable step.
      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });

    it('should add the names with the engine suspended, so it recalculates once, not once per name', () => {
      // A volatile formula recalculates on every engine call: with 300 names over `RAND()` rows,
      // adding the names one by one took seconds.
      hot = new Handsontable(container, {
        licenseKey: TEST_LICENSE_KEY,
        data: [['=RAND()']],
        formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      });
      const { engine } = hot.getPlugin('formulas');
      const loadData = hot.loadData.bind(hot);
      let updatesBeforeData = null;
      let updates = 0;

      engine.on('valuesUpdated', () => {
        updates += 1;
      });
      jest.spyOn(hot, 'loadData').mockImplementation((...args) => {
        updatesBeforeData = updates;

        return loadData(...args);
      });

      applyImportResult(hot, {
        data: [[1, '=Alpha+Beta+Gamma']],
        namedExpressions: [
          { name: 'Alpha', formula: '1' }, { name: 'Beta', formula: '2' }, { name: 'Gamma', formula: '3' },
        ],
      });

      expect(updatesBeforeData).toBe(1);
      expect(hot.getDataAtCell(0, 1)).toBe(6);
    });

    it('should add 60,000 names in about the time each add takes, not quadratically', () => {
      // Inside `engine.batch()`, HyperFormula 3.3 walks the batch's undo entry on every add, so
      // 60,000 names took about 10 s there; with the engine suspended they take about half a second.
      hot = new Handsontable(container, {
        licenseKey: TEST_LICENSE_KEY,
        data: [[null]],
        formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      });

      const namedExpressions = Array.from({ length: 60000 }, (_, index) => ({ name: `N${index}x`, formula: '1' }));
      const started = Date.now();

      applyImportResult(hot, { data: [[1, '=N0x+N59999x']], namedExpressions });

      expect(Date.now() - started).toBeLessThan(4000);
      expect(hot.getPlugin('formulas').engine.listNamedExpressions()).toHaveLength(60000);
      expect(hot.getDataAtCell(0, 1)).toBe(2);
    }, 60000);

    it('should remove the names and report them when the engine throws evaluating them as it resumes', () => {
      // A suspended HyperFormula evaluates nothing until it resumes, so a `RangeError: Invalid array
      // length` over a huge range leaves `resumeEvaluation()` and failed the whole import with the
      // names added.
      hot = new Handsontable(container, {
        licenseKey: TEST_LICENSE_KEY,
        data: [[null]],
        formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      });
      const { engine } = hot.getPlugin('formulas');
      const recompute = engine.recomputeIfDependencyGraphNeedsIt.bind(engine);
      let throws = 1;

      engine.recomputeIfDependencyGraphNeedsIt = () => {
        if (!engine.isEvaluationSuspended() && throws > 0) {
          throws -= 1;

          throw new RangeError('Invalid array length');
        }

        return recompute();
      };

      const result = {
        data: [[1, '=SUM(1,2)']],
        namedExpressions: [{ name: 'Alpha', formula: '1' }, { name: 'Huge', formula: 'SUM(Sheet1!$A$1:$A$2)' }],
        dropped: ['cellStyles'],
      };

      expect(() => applyImportResult(hot, result)).not.toThrow();
      expect(throws).toBe(0);
      expect(engine.listNamedExpressions()).toEqual([]);
      expect(engine.isEvaluationSuspended()).toBe(false);
      expect(result.dropped).toEqual(['cellStyles', 'definedNames:unsupported']);
      expect(hot.getDataAtCell(0, 0)).toBe(1);
      expect(hot.getDataAtCell(0, 1)).toBe(3);

      // The grid still computes.
      hot.setDataAtCell(0, 0, '=2*3');

      expect(hot.getDataAtCell(0, 0)).toBe(6);
    });

    it('should add a string constant with an escaped quote as the text it spells', () => {
      // `="a""b"` does not parse in HyperFormula, so the name is added as the constant `a"b`.
      hot = new Handsontable(container, {
        licenseKey: TEST_LICENSE_KEY,
        data: [[null]],
        formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      });

      applyImportResult(hot, {
        data: [['=LEN(Quote)&Quote']],
        namedExpressions: [{ name: 'Quote', formula: '"a""b"' }, { name: 'Plain', formula: '"ab"' }],
      });

      const { engine } = hot.getPlugin('formulas');

      expect(hot.getDataAtCell(0, 0)).toBe('3a"b');
      expect(engine.getNamedExpressionValue('Quote')).toBe('a"b');
      expect(engine.getNamedExpressionFormula('Plain')).toBe('="ab"');
    });

    it('should load the data when the engine already defines a name of the result', () => {
      hot = new Handsontable(container, {
        licenseKey: TEST_LICENSE_KEY,
        data: [[null]],
        formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      });
      hot.getPlugin('formulas').engine.addNamedExpression('Sales', '=Sheet1!$A$1');

      expect(() => applyImportResult(hot, {
        data: [[10, '=SUM(Sales)'], [20, null]],
        namedExpressions: [{ name: 'Sales', formula: 'Sheet1!$A$1:$A$2' }],
      })).not.toThrow();
      expect(hot.getDataAtCell(0, 0)).toBe(10);
      expect(hot.getDataAtCell(0, 1)).toBe(10);
    });
  });
});
