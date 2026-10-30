import Xlsx from '../types/xlsx';
import ExportDataProvider from '../dataProvider';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import * as consoleHelpers from '../../../helpers/console';
import { buildTestKey } from '../../../utils/entitlementLicenseKey/__tests__/buildTestKey';

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
      return [];
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
      return null;
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

const ALL_XLSX_TOKENS = [
  'xlsx:import',
  'xlsx:export',
  'xlsx:formulas',
  'xlsx:layout',
  'xlsx:number_formats',
  'xlsx:comments',
  'xlsx:styles',
  'xlsx:conditional_formatting',
  'xlsx:data_validation',
  'xlsx:protection',
];

const CONDITIONAL_FORMATTING = [
  { cols: [1, 1], rules: [{ type: 'cellIs', operator: 'greaterThan', formulae: ['1'], style: {} }] },
];

const STANDARD_TOKENS = ['xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout'];

/**
 * Builds a current subscription key granting `core` plus `tokens`, without the `listed-capabilities`
 * flag: such a key unlocks every xlsx feature, whatever it lists.
 *
 * @param {string[]} tokens The capability tokens besides `core`.
 * @param {string[]} [flags] The product flags.
 * @returns {string}
 */
function keyWithoutFlag(tokens, flags = []) {
  return buildTestKey({
    products: {
      handsontable: {
        capabilities: ['core', ...tokens],
        usage_until: '2027-08-12',
        notice: 60,
        grace: 90,
        flags,
      },
    },
  });
}

/**
 * Builds a current subscription key that unlocks exactly `tokens`: it carries the
 * `listed-capabilities` flag besides `flags`.
 *
 * @param {string[]} tokens The capability tokens besides `core`.
 * @param {string[]} [flags] Further product flags.
 * @returns {string}
 */
function keyWith(tokens, flags = []) {
  return keyWithoutFlag(tokens, ['listed-capabilities', ...flags]);
}

/**
 * Builds a key granting every xlsx token but `token`.
 *
 * @param {string} token The token to leave out.
 * @returns {string}
 */
function keyWithout(token) {
  return keyWith(ALL_XLSX_TOKENS.filter(id => id !== token));
}

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
    expect(headerCells(full).every(cell => cell.style?.fill !== null)).toBe(true);
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
