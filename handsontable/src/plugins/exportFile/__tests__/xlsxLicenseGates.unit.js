import Xlsx from '../types/xlsx';
import ExportDataProvider from '../dataProvider';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import * as consoleHelpers from '../../../helpers/console';
import { DateCellType } from '../../../cellTypes/dateType';
import { TimeCellType } from '../../../cellTypes/timeType';
import { IntlDateCellType } from '../../../cellTypes/intlDateType';
import { formatCellValue } from '../../../renderers/renderCell';
import {
  ALL_XLSX_TOKENS,
  STANDARD_TOKENS,
  keyWith,
  keyWithAll,
  keyWithout,
  keyWithoutFlag,
} from '../../../utils/entitlementLicenseKey/__tests__/xlsxLicenseKeys';

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
  cellsMeta: [
    [{ readOnly: true }, { type: 'numeric', numericFormat: { style: 'currency', currency: 'USD' } },
      { type: 'dropdown', source: ['a', 'b'] }],
    [{ comment: { value: 'Check' } }, {}, { type: 'dropdown', source: ['a', 'b'] }],
    [{ className: 'htRight' }, {}, { type: 'dropdown', source: ['a', 'b'] }],
  ],
};

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
      return ['Name', 'Amount', 'Status'];
    }

    getColumnHeadersClassNames() {
      return ['htCenter', '', ''];
    }

    getRowHeaders() {
      return mockState.rowHeaders;
    }

    getColumnsWidths() {
      return [80, 120, 90];
    }

    getRowsHeights() {
      return [30, 30, 30];
    }

    getMergeCells() {
      return [{ row: 2, col: 1, rowspan: 1, colspan: 2 }];
    }

    getFrozenRows() {
      return 1;
    }

    getFrozenColumns() {
      return 0;
    }

    getNestedColumnHeaders() {
      return mockState.nestedHeaders;
    }

    getLayoutDirection() {
      return 'rtl';
    }

    getColumnSummaries() {
      return [];
    }

    getSourceData() {
      return mockState.sourceData;
    }

    getFormulaErrorCodes() {
      return mockState.data.map(row => row.map(() => null));
    }

    getFormulasSeparator() {
      return ',';
    }

    getExcludedHiddenRows() {
      return null;
    }

    getExcludedHiddenColumns() {
      return null;
    }

    getHiddenRowDataIndices() {
      return [1];
    }

    getHiddenColumnDataIndices() {
      return [2];
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
    const full = (await exportSnapshot(keyWith(ALL_XLSX_TOKENS))).sheets[0];
    const gated = (await exportSnapshot(keyWithout('xlsx:styles'))).sheets[0];

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

  it('writes no numFmt without xlsx:number_formats', async() => {
    const full = (await exportSnapshot(keyWith(ALL_XLSX_TOKENS))).sheets[0];
    const gated = (await exportSnapshot(keyWithout('xlsx:number_formats'))).sheets[0];

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
      const full = (await exportSnapshot(keyWith(ALL_XLSX_TOKENS))).sheets[0];
      const gated = (await exportSnapshot(keyWithout('xlsx:number_formats'))).sheets[0];
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

  it('writes no widths, heights, merges, hidden, freeze, rtl without xlsx:layout', async() => {
    const full = (await exportSnapshot(keyWith(ALL_XLSX_TOKENS))).sheets[0];
    const gated = (await exportSnapshot(keyWithout('xlsx:layout'))).sheets[0];

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
      const full = (await exportSnapshot(keyWith(ALL_XLSX_TOKENS))).sheets[0];
      const gated = (await exportSnapshot(keyWithout('xlsx:layout'))).sheets[0];
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
    const full = (await exportSnapshot(keyWith(ALL_XLSX_TOKENS))).sheets[0];
    const gated = (await exportSnapshot(keyWithout('xlsx:formulas'))).sheets[0];

    expect(full.rows[2][1].formula).toEqual({ text: 'B2+1', result: 2 });
    expect(dataCells(gated).every(cell => cell.formula === null)).toBe(true);
    // A text-typed cell: the static value goes out as the text the grid shows.
    expect(gated.rows[2][1].value).toBe('2');
  });

  it('ignores conditionalFormatting without xlsx:conditional_formatting', async() => {
    const full = (await exportSnapshot(keyWith(ALL_XLSX_TOKENS))).sheets[0];
    const gated = (await exportSnapshot(keyWithout('xlsx:conditional_formatting'))).sheets[0];

    expect(full.conditionalFormatting.length).toBe(1);
    expect(gated.conditionalFormatting).toEqual([]);
  });

  it('writes no validation and no helper sheet without xlsx:data_validation', async() => {
    const full = await exportSnapshot(keyWith(ALL_XLSX_TOKENS));
    const gated = await exportSnapshot(keyWithout('xlsx:data_validation'));

    expect(full.sheets.map(sheet => [sheet.name, sheet.state]))
      .toEqual([['Sheet1', 'visible'], ['_HotValidation', 'hidden']]);
    expect(full.sheets[0].rows[1][2].validation).not.toBeNull();

    expect(gated.sheets.map(sheet => sheet.name)).toEqual(['Sheet1']);
    expect(dataCells(gated.sheets[0]).every(cell => cell.validation === null)).toBe(true);
    expect(gated.sheets[0].rows[1][2].value).toBe('a');
  });

  it('keeps the helper sheet hidden without xlsx:layout, because it belongs to xlsx:data_validation', async() => {
    const gated = await exportSnapshot(keyWithout('xlsx:layout'));

    expect(gated.sheets.map(sheet => [sheet.name, sheet.state]))
      .toEqual([['Sheet1', 'visible'], ['_HotValidation', 'hidden']]);
  });

  it('writes no comment without xlsx:comments', async() => {
    const full = (await exportSnapshot(keyWith(ALL_XLSX_TOKENS))).sheets[0];
    const gated = (await exportSnapshot(keyWithout('xlsx:comments'))).sheets[0];

    expect(full.rows[2][0].comment).toBe('Check');
    expect(dataCells(gated).every(cell => cell.comment === null)).toBe(true);
  });

  it('writes no locked cells and no protection without xlsx:protection', async() => {
    const full = (await exportSnapshot(keyWith(ALL_XLSX_TOKENS))).sheets[0];
    const gated = (await exportSnapshot(keyWithout('xlsx:protection'))).sheets[0];

    expect(full.rows[1][0].locked).toBe(true);
    expect(full.protection).not.toBeNull();

    expect(dataCells(gated).every(cell => cell.locked === null)).toBe(true);
    expect(gated.protection).toBeNull();
  });

  it('warns once with every missing export token, unless no-console-warns is set', async() => {
    const standard = STANDARD_TOKENS;

    await exportSnapshot(keyWith(standard));

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toBe(
      'The xlsx export skipped features your license does not unlock: xlsx:number_formats, ' +
      'xlsx:comments, xlsx:styles, xlsx:conditional_formatting, xlsx:data_validation, xlsx:protection.'
    );

    warnSpy.mockClear();
    const silenced = (await exportSnapshot(keyWith(standard, ['no-console-warns']))).sheets[0];

    expect(warnSpy).not.toHaveBeenCalled();
    expect(dataCells(silenced).every(cell => cell.style === null)).toBe(true);

    warnSpy.mockClear();
    await exportSnapshot(keyWith(ALL_XLSX_TOKENS));
    await exportSnapshot('non-commercial-and-evaluation');

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('takes the entitlement from its own instance when sheets name another instance', async() => {
    const own = createInstance(keyWithout('xlsx:comments'));
    const other = createInstance(keyWith(ALL_XLSX_TOKENS));
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

  it('leaves a full key\'s snapshot equal to the legacy key\'s', async() => {
    const full = await exportSnapshot(keyWith(ALL_XLSX_TOKENS));
    const legacy = await exportSnapshot('non-commercial-and-evaluation');

    expect(full).toEqual(legacy);
  });

  it('exports like a full key, and says nothing, for a flagged key that lists xlsx:all', async() => {
    const full = await exportSnapshot(keyWith(ALL_XLSX_TOKENS));
    const all = await exportSnapshot(keyWithAll());

    expect(all).toEqual(full);

    await exportSnapshot(keyWithAll(['no-console-warns']));

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('names only the tokens the export gates in its warning', async() => {
    await exportSnapshot(keyWithout('xlsx:import'));

    expect(warnSpy).not.toHaveBeenCalled();

    await exportSnapshot(keyWith(['xlsx:export']));

    expect(warnSpy.mock.calls.map(call => call[0])).toEqual([
      'The xlsx export skipped features your license does not unlock: xlsx:formulas, xlsx:layout, ' +
      'xlsx:number_formats, xlsx:comments, xlsx:styles, xlsx:conditional_formatting, ' +
      'xlsx:data_validation, xlsx:protection.',
    ]);
  });

  it('leaves a key without the listed-capabilities flag unrestricted, whatever it lists', async() => {
    const unflagged = await exportSnapshot(keyWithoutFlag(STANDARD_TOKENS));
    const legacy = await exportSnapshot('non-commercial-and-evaluation');

    expect(unflagged).toEqual(legacy);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
