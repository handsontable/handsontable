import Xlsx from '../types/xlsx';
import ExportDataProvider from '../dataProvider';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import * as consoleHelpers from '../../../helpers/console';
import { DateCellType } from '../../../cellTypes/dateType';
import { TimeCellType } from '../../../cellTypes/timeType';
import { IntlDateCellType } from '../../../cellTypes/intlDateType';
import { formatCellValue } from '../../../renderers/renderCell';
import { registerRenderer } from '../../../renderers/registry';
import { dateRenderer } from '../../../renderers/dateRenderer';
import * as cellStyle from '../types/xlsx/cell-style';
import {
  ALL_XLSX_TOKENS,
  keyWithoutTier,
} from '../../../utils/entitlementLicenseKey/__tests__/xlsxLicenseKeys';
import { resetTierKeys, tierKeyWithout } from '../../../utils/entitlementLicenseKey/__tests__/tierKeys';

/**
 * An arbitrary subset of the xlsx tokens, chosen so a key both grants some export features and lacks
 * others. It is not a product package: which tokens a product grants is decided where keys are issued,
 * never here.
 */
const PARTIAL_TOKENS = ['xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout'];

/**
 * Builds a key that unlocks every plugin and, of the xlsx family, exactly `tokens`.
 *
 * @param {string[]} tokens The xlsx tokens the key unlocks.
 * @param {string[]} [flags] The product flags.
 * @returns {string}
 */
function xlsxKeyWith(tokens, flags = []) {
  return tierKeyWithout(ALL_XLSX_TOKENS.filter(id => !tokens.includes(id)), flags);
}

// One rich sheet: headers, a formula, a currency number, a read-only cell, a comment, a dropdown, a
// right-aligned cell, a merge, a hidden row and column, a frozen row, RTL, widths and heights. Read
// lazily by the mock below (jest hoists the factory, so the names must be `mock`-prefixed).
const mockState = {
  data: [
    ['locked', 1, 'a'],
    ['noted', 2, 'b'],
    ['right', 3, 'a'],
  ],
  sourceData: [
    ['locked', 1, 'a'],
    ['noted', '=B1+1', 'b'],
    ['right', 3, 'a'],
  ],
  nestedHeaders: null,
  rowHeaders: [],
  columnHeaders: ['Name', 'Amount', 'Status'],
  // Overrides of the layout getters below, by method name; `null` keeps the rich sheet's layout.
  layout: null,
  cellsMeta: [
    [{ readOnly: true }, { type: 'numeric', numericFormat: { style: 'currency', currency: 'USD' } },
      { type: 'dropdown', source: ['a', 'b'] }],
    [{ comment: { value: 'Check' } }, {}, { type: 'dropdown', source: ['a', 'b'] }],
    [{ className: 'htRight' }, {}, { type: 'dropdown', source: ['a', 'b'] }],
  ],
};

/**
 * Reads one layout getter's value from `mockState.layout`, or the rich sheet's own.
 *
 * @param {string} name The getter's name.
 * @param {*} fallback The rich sheet's value.
 * @returns {*}
 */
function mockLayout(name, fallback) {
  return mockState.layout && name in mockState.layout ? mockState.layout[name] : fallback;
}

jest.mock('../dataProvider', () => ({
  __esModule: true,
  default: class DataProviderMock {
    constructor(hot) {
      this.hot = hot;
    }

    setOptions() {}

    getData() {
      return mockState.data;
    }

    getCellsMeta() {
      return mockState.cellsMeta;
    }

    getCellElements() {
      return mockState.cellsMeta.map(row => row.map(() => null));
    }

    getColumnHeaders() {
      return mockState.columnHeaders;
    }

    getColumnHeadersClassNames() {
      return ['htCenter', '', ''];
    }

    getRowHeaders() {
      return mockState.rowHeaders;
    }

    getColumnsWidths() {
      return mockLayout('getColumnsWidths', [80, 120, 90]);
    }

    getRowsHeights() {
      return mockLayout('getRowsHeights', [30, 30, 30]);
    }

    getMergeCells() {
      return mockLayout('getMergeCells', [{ row: 2, col: 1, rowspan: 1, colspan: 2 }]);
    }

    getFrozenRows() {
      return mockLayout('getFrozenRows', 1);
    }

    getFrozenColumns() {
      return mockLayout('getFrozenColumns', 0);
    }

    getNestedColumnHeaders() {
      return mockState.nestedHeaders;
    }

    getLayoutDirection() {
      return mockLayout('getLayoutDirection', 'rtl');
    }

    getColumnSummaries() {
      return [];
    }

    getSourceData() {
      return mockState.sourceData;
    }

    getEngineCellFacts() {
      return mockState.data.map(row => row.map(() => null));
    }

    getFormulasSeparator() {
      return ',';
    }

    getFormulasDecimalSeparator() {
      return '.';
    }

    getNamedExpressions() {
      return [];
    }

    getFormulasBinding() {
      return null;
    }

    getExcludedHiddenRows() {
      return null;
    }

    getExcludedHiddenColumns() {
      return null;
    }

    getHiddenRowDataIndices() {
      return mockLayout('getHiddenRowDataIndices', [1]);
    }

    getHiddenColumnDataIndices() {
      return mockLayout('getHiddenColumnDataIndices', [2]);
    }
  },
}));

const CONDITIONAL_FORMATTING = [
  { cols: [1, 1], rules: [{ type: 'cellIs', operator: 'greaterThan', formulae: ['1'], style: {} }] },
];

/**
 * A stand-in for a Handsontable instance carrying a license key.
 *
 * @param {string} licenseKey The license key.
 * @returns {object}
 */
function createInstance(licenseKey) {
  return { rootDocument: document, rootWindow: window, getSettings: () => ({ licenseKey }) };
}

describe('Xlsx export license gates', () => {
  let warnSpy;
  let writeSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
    writeSpy = jest.spyOn(nativeAdapter, 'write');
  });

  afterEach(() => {
    warnSpy.mockRestore();
    writeSpy.mockRestore();
    resetTierKeys();
  });

  /**
   * Exports the mock sheet under `licenseKey` with the built-in engine and returns the workbook
   * snapshot the engine was handed.
   *
   * @param {string} licenseKey The license key of the exporting instance.
   * @param {object} [options] Extra export options.
   * @returns {Promise<object>}
   */
  async function exportSnapshot(licenseKey, options = {}) {
    const xlsx = new Xlsx(new ExportDataProvider(createInstance(licenseKey)), {
      exportFormulas: true,
      conditionalFormatting: CONDITIONAL_FORMATTING,
      ...options,
    });

    writeSpy.mockClear();
    await xlsx.export();

    return writeSpy.mock.calls[0][0];
  }

  const dataCells = sheet => sheet.rows.slice(1).flat().filter(Boolean);
  const headerCells = sheet => sheet.rows[0].filter(Boolean);

  it('drops cell styles and the header fill without xlsx:styles', async() => {
    const full = (await exportSnapshot(tierKeyWithout([]))).sheets[0];
    const gated = (await exportSnapshot(tierKeyWithout(['xlsx:styles']))).sheets[0];

    expect(dataCells(full).some(cell => cell.style !== null)).toBe(true);
    expect(headerCells(full).length).toBeGreaterThan(0);
    expect(headerCells(full).every(cell => Boolean(cell.style?.fill))).toBe(true);
    expect(full.rows[0][0].style.alignment).toBeTruthy();
    expect(full.rows[0][0].style.alignment.horizontal).toBe('center');

    expect(dataCells(gated).every(cell => cell.style === null)).toBe(true);
    // `htCenter` on the first header: no alignment either, so no style at all.
    expect(headerCells(gated).every(cell => cell.style === null)).toBe(true);
    expect(headerCells(gated).map(cell => cell.value)).toEqual(['Name', 'Amount', 'Status']);
  });

  it('follows a license key passed later on the same instance', async() => {
    const settings = { licenseKey: tierKeyWithout(['xlsx:styles']) };
    const hot = { rootDocument: document, rootWindow: window, getSettings: () => settings };
    const exportWith = async() => {
      writeSpy.mockClear();
      await new Xlsx(new ExportDataProvider(hot), { conditionalFormatting: [] }).export();

      return writeSpy.mock.calls[0][0].sheets[0];
    };
    const skipped = () => warnSpy.mock.calls
      .map(call => call[0])
      .filter(message => message.startsWith('The xlsx export skipped'));

    const before = await exportWith();

    expect(dataCells(before).every(cell => cell.style === null)).toBe(true);
    expect(skipped().join()).toContain('xlsx:styles');

    // What `updateSettings({ licenseKey })` does to the settings the plugin reads.
    settings.licenseKey = tierKeyWithout([]);
    warnSpy.mockClear();

    const after = await exportWith();

    expect(dataCells(after).some(cell => cell.style !== null)).toBe(true);
    expect(skipped()).toEqual([]);
  });

  it('reads no computed cell style without xlsx:styles', async() => {
    const probeSpy = jest.spyOn(cellStyle, 'getCssStyleFromElement');

    try {
      await exportSnapshot(tierKeyWithout([]));

      expect(probeSpy).toHaveBeenCalled();

      probeSpy.mockClear();
      await exportSnapshot(tierKeyWithout(['xlsx:styles']));

      expect(probeSpy).not.toHaveBeenCalled();
    } finally {
      probeSpy.mockRestore();
    }
  });

  it('writes no numFmt without xlsx:number_formats', async() => {
    const full = (await exportSnapshot(tierKeyWithout([]))).sheets[0];
    const gated = (await exportSnapshot(tierKeyWithout(['xlsx:number_formats']))).sheets[0];

    expect(full.rows[1][1].numFmt).not.toBeNull();
    expect(dataCells(gated).every(cell => cell.numFmt === null)).toBe(true);
    expect(gated.rows[1][1].value).toBe(1);
  });

  it('writes dates and times as the text the grid shows without xlsx:number_formats', async() => {
    const saved = { data: mockState.data, sourceData: mockState.sourceData, cellsMeta: mockState.cellsMeta };
    const dateMeta = { ...DateCellType, type: 'date', locale: 'en-US' };
    const timeMeta = {
      ...TimeCellType, type: 'time', locale: 'en-US', timeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    };
    const intlDateMeta = {
      ...IntlDateCellType,
      type: 'intl-date',
      locale: 'de-DE',
      dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' },
    };

    mockState.data = [['2024-01-15', '09:30:00', '2024-01-15']];
    mockState.sourceData = mockState.data;
    mockState.cellsMeta = [[dateMeta, timeMeta, intlDateMeta]];

    try {
      const full = (await exportSnapshot(tierKeyWithout([]))).sheets[0];
      const gated = (await exportSnapshot(tierKeyWithout(['xlsx:number_formats']))).sheets[0];
      const rendered = mockState.cellsMeta[0]
        .map((meta, col) => formatCellValue(mockState.data[0][col], meta, meta.renderer));

      expect(full.rows[1][0].value).toBe(45306);
      expect(full.rows[1][0].numFmt).not.toBeNull();
      expect(full.rows[1][1].value).toBeCloseTo(0.395833, 5);
      expect(full.rows[1][2].value).toBe(45306);

      expect(rendered).toEqual(['01/15/2024', '09:30', '15.01.2024']);
      expect(gated.rows[1].slice(0, 3).map(cell => cell.value)).toEqual(rendered);
      expect(gated.rows[1].slice(0, 3).map(cell => cell.numFmt)).toEqual([null, null, null]);
    } finally {
      Object.assign(mockState, saved);
    }
  });

  it('writes a date formula as the text the grid shows without xlsx:number_formats', async() => {
    const dateMeta = { ...DateCellType, type: 'date', locale: 'en-US' };

    await withMockSheet({
      data: [['2024-01-15', '2024-02-14']],
      sourceData: [['2024-01-15', '=A1+30']],
      cellsMeta: [[dateMeta, dateMeta]],
    }, async() => {
      const full = (await exportSnapshot(tierKeyWithout([]))).sheets[0];
      const gated = (await exportSnapshot(tierKeyWithout(['xlsx:number_formats']))).sheets[0];

      // With both tokens: a live formula, formatted as a date.
      expect(full.rows[1][1].formula).toEqual(expect.objectContaining({ text: 'A2+30' }));
      expect(full.rows[1][1].numFmt).not.toBeNull();

      // With xlsx:formulas but not xlsx:number_formats: the displayed date as static text, the same
      // rule as a literal date, because a formula with no number format opens as a serial.
      expect(gated.rows[1][1]).toEqual(expect.objectContaining({
        value: formatCellValue('2024-02-14', dateMeta, dateMeta.renderer),
        formula: null,
        numFmt: null,
      }));
      expect(gated.rows[1][1].value).toBe('02/14/2024');
      expect(warnSpy.mock.calls.map(call => call[0])).toEqual([
        'The xlsx export skipped features your license does not unlock: xlsx:number_formats.',
      ]);
    });
  });

  it('formats through a renderer named by a string without xlsx:number_formats', async() => {
    registerRenderer(dateRenderer);

    await withMockSheet({
      data: [['2024-01-15']],
      sourceData: [['2024-01-15']],
      cellsMeta: [[{
        type: 'date',
        renderer: 'date',
        locale: 'de-DE',
        dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' },
      }]],
    }, async() => {
      const gated = (await exportSnapshot(tierKeyWithout(['xlsx:number_formats']))).sheets[0];

      expect(gated.rows[1][0].value).toBe('15.01.2024');
      expect(gated.rows[1][0].numFmt).toBeNull();
    });
  });

  it('writes no widths, heights, merges, hidden, freeze, rtl without xlsx:layout', async() => {
    const full = (await exportSnapshot(tierKeyWithout([]))).sheets[0];
    const gated = (await exportSnapshot(tierKeyWithout(['xlsx:layout']))).sheets[0];

    expect(full.colWidths.some(width => width !== null)).toBe(true);
    expect(full.rowHeights.some(height => height !== null)).toBe(true);
    expect(full.merges.length).toBe(1);
    expect(full.hiddenCols).toEqual([2]);
    expect(full.hiddenRows).toEqual([2]);
    expect(full.freeze).not.toBeNull();
    expect(full.rtl).toBe(true);

    expect(gated.colWidths.every(width => width === null)).toBe(true);
    expect(gated.rowHeights.every(height => height === null)).toBe(true);
    expect(gated.merges).toEqual([]);
    expect(gated.hiddenCols).toEqual([]);
    expect(gated.hiddenRows).toEqual([]);
    expect(gated.freeze).toBeNull();
    expect(gated.rtl).toBe(false);
  });

  it('merges no nested header group without xlsx:layout, keeping each label in its first cell', async() => {
    mockState.nestedHeaders = [
      [{ label: 'Customer', colspan: 2 }, { label: 'State', colspan: 1 }],
      [{ label: 'Name', colspan: 1 }, { label: 'Amount', colspan: 1 }, { label: 'Status', colspan: 1 }],
    ];
    mockState.rowHeaders = [1, 2, 3];

    try {
      const full = (await exportSnapshot(tierKeyWithout([]))).sheets[0];
      const gated = (await exportSnapshot(tierKeyWithout(['xlsx:layout']))).sheets[0];
      // 0-based: the two header rows are rows 0 and 1.
      const headerMerges = sheet => sheet.merges.filter(merge => merge.row < 2);

      // The corner (A1:A2) and the `Customer` group (B1:C1).
      expect(headerMerges(full)).toEqual([
        { row: 0, col: 0, rowspan: 2, colspan: 1 },
        { row: 0, col: 1, rowspan: 1, colspan: 2 },
      ]);

      expect(headerMerges(gated)).toEqual([]);
      expect(gated.rows[0].slice(1).map(cell => cell?.value ?? null)).toEqual(['Customer', null, 'State']);
      expect(gated.rows[1].slice(1).map(cell => cell?.value ?? null)).toEqual(['Name', 'Amount', 'Status']);
    } finally {
      mockState.nestedHeaders = null;
      mockState.rowHeaders = [];
    }
  });

  it('exports values instead of formulas without xlsx:formulas', async() => {
    const full = (await exportSnapshot(tierKeyWithout([]))).sheets[0];
    const gated = (await exportSnapshot(tierKeyWithout(['xlsx:formulas']))).sheets[0];

    expect(full.rows[2][1].formula).toEqual({ text: 'B2+1', result: 2 });
    expect(dataCells(gated).every(cell => cell.formula === null)).toBe(true);
    // A text-typed cell: the static value goes out as the text the grid shows.
    expect(gated.rows[2][1].value).toBe('2');
  });

  it('ignores conditionalFormatting without xlsx:conditional_formatting', async() => {
    const full = (await exportSnapshot(tierKeyWithout([]))).sheets[0];
    const gated = (await exportSnapshot(tierKeyWithout(['xlsx:conditional_formatting']))).sheets[0];

    expect(full.conditionalFormatting.length).toBe(1);
    expect(gated.conditionalFormatting).toEqual([]);
  });

  it('writes no validation and no helper sheet without xlsx:data_validation', async() => {
    const full = await exportSnapshot(tierKeyWithout([]));
    const gated = await exportSnapshot(tierKeyWithout(['xlsx:data_validation']));

    expect(full.sheets.map(sheet => [sheet.name, sheet.state]))
      .toEqual([['Sheet1', 'visible'], ['_HotValidation', 'hidden']]);
    expect(full.sheets[0].rows[1][2].validation).not.toBeNull();

    expect(gated.sheets.map(sheet => sheet.name)).toEqual(['Sheet1']);
    expect(dataCells(gated.sheets[0]).every(cell => cell.validation === null)).toBe(true);
    expect(gated.sheets[0].rows[1][2].value).toBe('a');
  });

  it('keeps the helper sheet hidden without xlsx:layout, because it belongs to xlsx:data_validation', async() => {
    const gated = await exportSnapshot(tierKeyWithout(['xlsx:layout']));

    expect(gated.sheets.map(sheet => [sheet.name, sheet.state]))
      .toEqual([['Sheet1', 'visible'], ['_HotValidation', 'hidden']]);
  });

  it('writes no comment without xlsx:comments', async() => {
    const full = (await exportSnapshot(tierKeyWithout([]))).sheets[0];
    const gated = (await exportSnapshot(tierKeyWithout(['xlsx:comments']))).sheets[0];

    expect(full.rows[2][0].comment).toBe('Check');
    expect(dataCells(gated).every(cell => cell.comment === null)).toBe(true);
  });

  it('writes no locked cells and no protection without xlsx:protection', async() => {
    const full = (await exportSnapshot(tierKeyWithout([]))).sheets[0];
    const gated = (await exportSnapshot(tierKeyWithout(['xlsx:protection']))).sheets[0];

    expect(full.rows[1][0].locked).toBe(true);
    expect(full.protection).not.toBeNull();

    expect(dataCells(gated).every(cell => cell.locked === null)).toBe(true);
    expect(gated.protection).toBeNull();
  });

  it('warns once with every missing export token, unless no-console-warns is set', async() => {
    await exportSnapshot(xlsxKeyWith(PARTIAL_TOKENS));

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toBe(
      'The xlsx export skipped features your license does not unlock: xlsx:number_formats, ' +
      'xlsx:comments, xlsx:styles, xlsx:conditional_formatting, xlsx:data_validation, xlsx:protection.'
    );

    warnSpy.mockClear();
    const silenced = (await exportSnapshot(xlsxKeyWith(PARTIAL_TOKENS, ['no-console-warns']))).sheets[0];

    expect(warnSpy).not.toHaveBeenCalled();
    expect(dataCells(silenced).every(cell => cell.style === null)).toBe(true);

    warnSpy.mockClear();
    await exportSnapshot(tierKeyWithout([]));
    await exportSnapshot('non-commercial-and-evaluation');

    expect(warnSpy).not.toHaveBeenCalled();
  });

  /**
   * Runs `fn` with the mock sheet's state overridden by `overrides`, restoring it afterwards.
   *
   * @param {object} overrides The `mockState` keys to replace.
   * @param {Function} fn The async body.
   * @returns {Promise<void>}
   */
  async function withMockSheet(overrides, fn) {
    const saved = Object.fromEntries(Object.keys(overrides).map(key => [key, mockState[key]]));

    Object.assign(mockState, overrides);

    try {
      await fn();
    } finally {
      Object.assign(mockState, saved);
    }
  }

  const LAYOUT_FREE = {
    getColumnsWidths: [50, 50],
    getRowsHeights: [undefined, undefined],
    getMergeCells: [],
    getFrozenRows: 0,
    getFrozenColumns: 0,
    getLayoutDirection: 'ltr',
    getHiddenRowDataIndices: [],
    getHiddenColumnDataIndices: [],
  };
  const PLAIN_SHEET = {
    layout: LAYOUT_FREE,
    data: [['Ana García', 'Engineering'], ['Li Wei', 'Marketing']],
    sourceData: [['Ana García', 'Engineering'], ['Li Wei', 'Marketing']],
    cellsMeta: [[{}, {}], [{}, {}]],
    columnHeaders: [],
  };
  const exportWarnings = () => warnSpy.mock.calls
    .map(call => call[0])
    .filter(message => message.startsWith('The xlsx export skipped'));

  it('says nothing about the license for a plain text grid on a key that lacks some tokens', async() => {
    await withMockSheet(PLAIN_SHEET, async() => {
      const sheet = (await exportSnapshot(xlsxKeyWith(PARTIAL_TOKENS), { conditionalFormatting: [] })).sheets[0];

      expect(sheet.rows[0][0].value).toBe('Ana García');
      expect(exportWarnings()).toEqual([]);
    });
  });

  it('names xlsx:styles for a class-only cell styled by a stylesheet, with no headers', async() => {
    await withMockSheet({
      ...PLAIN_SHEET,
      cellsMeta: [[{ className: 'bold' }, {}], [{}, {}]],
    }, async() => {
      await exportSnapshot(xlsxKeyWith(PARTIAL_TOKENS), { conditionalFormatting: [] });

      expect(exportWarnings()).toEqual([
        'The xlsx export skipped features your license does not unlock: xlsx:styles.',
      ]);
    });
  });

  it('names only xlsx:comments for a grid whose only ungranted feature is a comment', async() => {
    await withMockSheet({
      ...PLAIN_SHEET,
      cellsMeta: [[{ comment: { value: 'Check' } }, {}], [{}, {}]],
    }, async() => {
      await exportSnapshot(xlsxKeyWith(PARTIAL_TOKENS), { conditionalFormatting: [] });

      expect(exportWarnings()).toEqual([
        'The xlsx export skipped features your license does not unlock: xlsx:comments.',
      ]);
    });
  });

  it('names each export token only for the feature the grid has', async() => {
    const cases = [
      ['xlsx:styles', { columnHeaders: ['Name', 'Department'] }, {}],
      ['xlsx:styles', { cellsMeta: [[{ className: 'htCenter' }, {}], [{}, {}]] }, {}],
      // A class only a stylesheet gives a meaning: the probe that would read it is skipped.
      ['xlsx:styles', { cellsMeta: [[{ className: 'bold' }, {}], [{}, {}]] }, {}],
      ['xlsx:styles', { cellsMeta: [[{ className: ['htMiddle', 'highlight'] }, {}], [{}, {}]] }, {}],
      // The row-header column gets a width, which is layout; `headerStyle: null` keeps styles out.
      ['xlsx:layout', { rowHeaders: [1, 2] }, { headerStyle: null }],
      ['xlsx:number_formats', {
        data: [['Ana García', 4200], ['Li Wei', 3900]],
        cellsMeta: [[{}, { type: 'numeric', numericFormat: { style: 'currency', currency: 'USD' } }], [{}, {}]],
      }, {}],
      ['xlsx:formulas', { sourceData: [['Ana García', '=1+1'], ['Li Wei', 'Marketing']] }, { exportFormulas: true }],
      ['xlsx:conditional_formatting', {}, {
        conditionalFormatting: [{ rules: [{ type: 'cellIs', operator: 'equal', formulae: ['1'], style: {} }] }],
      }],
      ['xlsx:data_validation', { cellsMeta: [[{}, { type: 'dropdown', source: ['Engineering'] }], [{}, {}]] }, {}],
      // A read-only cell is locked, and painted gray too.
      ['xlsx:styles, xlsx:protection', { cellsMeta: [[{ readOnly: true }, {}], [{}, {}]] }, {}],
      ['xlsx:protection', {}, { protection: { password: 'q4-budget' } }],
    ];

    for (const [token, sheetOverrides, options] of cases) {
      warnSpy.mockClear();

      // eslint-disable-next-line no-await-in-loop
      await withMockSheet({ ...PLAIN_SHEET, ...sheetOverrides }, async() => {
        await exportSnapshot(xlsxKeyWith(['xlsx:export']), {
          conditionalFormatting: [],
          exportFormulas: false,
          ...options,
        });
      });

      expect([token, exportWarnings()]).toEqual([
        token, [`The xlsx export skipped features your license does not unlock: ${token}.`],
      ]);
    }
  });

  it('names xlsx:data_validation only for a dropdown whose source is a list', async() => {
    const sourceFn = (query, callback) => callback(['Engineering']);

    for (const [type, source, expected] of [
      ['dropdown', sourceFn, []],
      ['autocomplete', sourceFn, []],
      // An empty list writes no validation either: `#buildValidationSheet` skips it.
      ['dropdown', [], []],
      ['dropdown', ['Engineering'], ['xlsx:data_validation']],
      ['autocomplete', ['Engineering'], ['xlsx:data_validation']],
    ]) {
      warnSpy.mockClear();

      // eslint-disable-next-line no-await-in-loop
      await withMockSheet({ ...PLAIN_SHEET, cellsMeta: [[{}, { type, source }], [{}, {}]] }, async() => {
        await exportSnapshot(xlsxKeyWith(['xlsx:export']), { conditionalFormatting: [], exportFormulas: false });

        // A full key writes a validation exactly when the warning would name the token.
        const full = await exportSnapshot(tierKeyWithout([]), { conditionalFormatting: [] });

        expect([type, source, full.sheets[0].rows[0][1].validation !== null])
          .toEqual([type, source, expected.length > 0]);
      });

      expect([type, typeof source, exportWarnings()]).toEqual([
        type,
        typeof source,
        expected.map(token => `The xlsx export skipped features your license does not unlock: ${token}.`),
      ]);
    }
  });

  it('counts explicit layout only toward xlsx:layout', async() => {
    await withMockSheet(PLAIN_SHEET, async() => {
      await exportSnapshot(xlsxKeyWith(['xlsx:export']), { conditionalFormatting: [], exportFormulas: false });
    });

    expect(exportWarnings()).toEqual([]);

    const layouts = {
      getColumnsWidths: [120, 50],
      getRowsHeights: [40, undefined],
      getMergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }],
      getFrozenRows: 1,
      getFrozenColumns: 1,
      getLayoutDirection: 'rtl',
      getHiddenRowDataIndices: [1],
      getHiddenColumnDataIndices: [1],
    };

    for (const [name, value] of Object.entries(layouts)) {
      warnSpy.mockClear();

      // eslint-disable-next-line no-await-in-loop
      await withMockSheet({ ...PLAIN_SHEET, layout: { ...LAYOUT_FREE, [name]: value } }, async() => {
        await exportSnapshot(xlsxKeyWith(['xlsx:export']), { conditionalFormatting: [], exportFormulas: false });
      });

      expect([name, exportWarnings()]).toEqual([
        name, ['The xlsx export skipped features your license does not unlock: xlsx:layout.'],
      ]);
    }
  });

  it('takes the entitlement from its own instance when sheets name another instance', async() => {
    const own = createInstance(tierKeyWithout(['xlsx:comments']));
    const other = createInstance(tierKeyWithout([]));
    const xlsx = new Xlsx(new ExportDataProvider(own), { sheets: [{ instance: other, name: 'Other' }] });

    writeSpy.mockClear();
    await xlsx.export();

    const sheet = writeSpy.mock.calls[0][0].sheets[0];

    expect(sheet.name).toBe('Other');
    expect(dataCells(sheet).every(cell => cell.comment === null)).toBe(true);
    expect(warnSpy.mock.calls.map(call => call[0])).toEqual([
      'The xlsx export skipped features your license does not unlock: xlsx:comments.',
    ]);
  });

  it('leaves a full key\'s snapshot equal to the snapshot of a key that restricts nothing', async() => {
    const full = await exportSnapshot(tierKeyWithout([]));
    // An invalid key (the non-commercial key is one since 19.0) restricts nothing.
    const unrestricted = await exportSnapshot('non-commercial-and-evaluation');

    expect(full).toEqual(unrestricted);
  });

  it('names only the tokens the export gates in its warning', async() => {
    await exportSnapshot(tierKeyWithout(['xlsx:import']));

    expect(warnSpy).not.toHaveBeenCalled();

    await exportSnapshot(xlsxKeyWith(['xlsx:export']));

    expect(warnSpy.mock.calls.map(call => call[0])).toEqual([
      'The xlsx export skipped features your license does not unlock: xlsx:formulas, xlsx:layout, ' +
      'xlsx:number_formats, xlsx:comments, xlsx:styles, xlsx:conditional_formatting, ' +
      'xlsx:data_validation, xlsx:protection.',
    ]);
  });

  it('leaves a key that names no tier unrestricted, whatever it lists', async() => {
    const noTier = await exportSnapshot(keyWithoutTier(PARTIAL_TOKENS));
    const legacy = await exportSnapshot('non-commercial-and-evaluation');

    expect(noTier).toEqual(legacy);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
