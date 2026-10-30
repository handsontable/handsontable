/**
 * @jest-environment node
 */
import { ImportFile } from '../importFile';
import { mapWorkbook, resolveImportOptions } from '../mapper';
import { DroppedFeatures } from '../../../utils/xlsxEngine/capabilities';
import { SheetBuilder } from '../../../utils/xlsxEngine/builder';
import { createWorkbookSnapshot } from '../../../utils/xlsxEngine/model';
import { UNRESTRICTED_XLSX_ENTITLEMENT } from '../../../utils/xlsxEngine/xlsxEntitlement';
import { loadFixture as fixture } from '../../../utils/xlsxEngine/__tests__/helpers/fixtures';
import * as consoleHelpers from '../../../helpers/console';
import { buildTestKey } from '../../../utils/entitlementLicenseKey/__tests__/buildTestKey';

const ALL_XLSX_TOKENS = [
  'xlsx:import',
  'xlsx:export',
  'xlsx:formulas',
  'xlsx:layout',
  'xlsx:number_formats',
  'xlsx:comments',
  'xlsx:import_report',
  'xlsx:styles',
  'xlsx:conditional_formatting',
  'xlsx:data_validation',
  'xlsx:protection',
];
const STANDARD_TOKENS = ['xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout'];
const PRO_TOKENS = ALL_XLSX_TOKENS.filter(id => !STANDARD_TOKENS.includes(id));

/**
 * Builds a current subscription key granting `core` plus `tokens`.
 *
 * @param {string[]} tokens The capability tokens besides `core`.
 * @param {string[]} [flags] The product flags.
 * @returns {string}
 */
function keyWith(tokens, flags = []) {
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
 * An entitlement with one flag switched off and its token listed as missing.
 *
 * @param {string} flag The entitlement flag to switch off.
 * @param {string} token The token that drives it.
 * @returns {object}
 */
function without(flag, token) {
  return { ...UNRESTRICTED_XLSX_ENTITLEMENT, [flag]: false, missing: [token] };
}

const STANDARD_ENTITLEMENT = {
  ...UNRESTRICTED_XLSX_ENTITLEMENT,
  numberFormats: false,
  comments: false,
  importReport: false,
  styles: false,
  conditionalFormatting: false,
  dataValidation: false,
  protection: false,
  missing: PRO_TOKENS,
};

/**
 * One sheet carrying every feature a token gates: a header row, a dated column, a styled and
 * bordered cell, a comment, a locked cell under sheet protection, a list validation, a merge, a
 * hidden column, a frozen row, and a conditional formatting block.
 *
 * @returns {object} The workbook snapshot.
 */
function richWorkbook() {
  const sheet = new SheetBuilder('Data');

  sheet.cell(1, 1).value = 'Name';
  sheet.cell(1, 2).value = 'Amount';
  sheet.cell(1, 3).value = 'Due';
  sheet.cell(1, 4).value = 'Status';

  for (let row = 2; row <= 4; row++) {
    sheet.cell(row, 1).value = `Name ${row}`;
    sheet.cell(row, 2).value = row * 100;
    sheet.cell(row, 2).numFmt = '#,##0.00';
    sheet.cell(row, 3).value = 45290 + row;
    sheet.cell(row, 3).numFmt = 'yyyy-mm-dd';
    sheet.cell(row, 4).value = 'Open';
    sheet.cell(row, 4).validation = { type: 'list', allowBlank: true, formulae: ['"Open,Closed"'] };
    // Every cell but A2 is unlocked, so protection makes exactly one cell read-only.
    [1, 2, 3, 4].forEach((col) => {
      sheet.cell(row, col).locked = row === 2 && col === 1;
    });
  }

  sheet.cell(3, 1).comment = 'Check';
  sheet.cell(4, 1).style = {
    alignment: { horizontal: 'right' },
    font: { bold: true, color: { argb: 'FFFF0000' } },
    fill: null,
    border: { top: { style: 'thin', color: { argb: 'FF0000FF' } } },
  };
  sheet.merge(5, 1, 5, 2);
  sheet.cell(5, 1).value = 'Total';
  sheet.cell(5, 1).locked = false;
  sheet.hideCol(4);
  sheet.freeze(0, 2);
  sheet.protect('');
  sheet.addConditionalFormatting('B2:B4', [{ type: 'cellIs', operator: 'greaterThan', formulae: ['150'] }]);

  const workbook = createWorkbookSnapshot();

  workbook.sheets.push(sheet.toSnapshot());

  return workbook;
}

/**
 * Maps the rich workbook under `entitlement`.
 *
 * @param {object} entitlement The entitlement in the mapper context.
 * @param {object} [options] The import options.
 * @returns {{result: object, dropped: DroppedFeatures}}
 */
function mapRich(entitlement, options = {}) {
  const dropped = new DroppedFeatures();
  const result = mapWorkbook(richWorkbook(), resolveImportOptions({ colHeaders: 'firstRow', ...options }), {
    formulasEnabled: false,
    commentsEnabled: true,
    customBordersEnabled: true,
    entitlement,
  }, dropped);

  return { result, dropped };
}

/**
 * Every meta object of the result: the column-wide ones and the per-cell ones.
 *
 * @param {object} result The mapped result.
 * @returns {object[]}
 */
function allMeta(result) {
  return [...(result.columns ?? []), ...(result.cellsMeta ?? []).map(entry => entry.meta)];
}

describe('ImportFile mapper license gates', () => {
  it('still infers a date from its number format without xlsx:number_formats', () => {
    const full = mapRich(UNRESTRICTED_XLSX_ENTITLEMENT).result;
    const gated = mapRich(without('numberFormats', 'xlsx:number_formats')).result;
    const standard = mapRich(STANDARD_ENTITLEMENT).result;

    expect(full.columns[2].type).toBe('date');
    expect(gated.columns[2].type).toBe('date');
    expect(gated.columns[1].type).toBe('numeric');
    expect(standard.columns[2].type).toBe('date');
  });

  it('withholds styles and customBorders without xlsx:styles even when importStyles is true', () => {
    const full = mapRich(UNRESTRICTED_XLSX_ENTITLEMENT, { importStyles: true });
    const gated = mapRich(without('styles', 'xlsx:styles'), { importStyles: true });

    expect(full.result.styles).toBeDefined();
    expect(full.result.customBorders).toHaveLength(1);
    expect(allMeta(full.result).some(meta => /htRight/.test(meta.className ?? ''))).toBe(true);

    expect(gated.result.styles).toBeUndefined();
    expect(gated.result.customBorders).toBeUndefined();
    expect(allMeta(gated.result).some(meta => meta.className !== undefined)).toBe(false);
    expect(gated.dropped.list()).toContain('license:xlsx:styles');
  });

  it('withholds conditionalFormatting without xlsx:conditional_formatting', () => {
    const full = mapRich(UNRESTRICTED_XLSX_ENTITLEMENT).result;
    const gated = mapRich(without('conditionalFormatting', 'xlsx:conditional_formatting')).result;

    expect(full.conditionalFormatting).toHaveLength(1);
    expect(gated.conditionalFormatting).toBeUndefined();
  });

  it('imports a validated cell as text without xlsx:data_validation', () => {
    const full = mapRich(UNRESTRICTED_XLSX_ENTITLEMENT).result;
    const gated = mapRich(without('dataValidation', 'xlsx:data_validation')).result;

    expect(full.columns[3]).toEqual(expect.objectContaining({ type: 'dropdown', source: ['Open', 'Closed'] }));
    expect(gated.columns[3].type).toBe('text');
    expect(allMeta(gated).some(meta => meta.type === 'dropdown')).toBe(false);
  });

  it('withholds comments without xlsx:comments', () => {
    const full = mapRich(UNRESTRICTED_XLSX_ENTITLEMENT);
    const gated = mapRich(without('comments', 'xlsx:comments'));

    expect(full.result.comments).toEqual([{ row: 1, col: 0, value: 'Check' }]);
    expect(gated.result.comments).toBeUndefined();
    // Not reported as the file-driven `comments` entry: the license entry names the loss.
    expect(gated.dropped.list()).not.toContain('comments');
    expect(gated.dropped.licenseEntries()).toEqual(['license:xlsx:comments']);
  });

  it('sets no readOnly without xlsx:protection', () => {
    const full = mapRich(UNRESTRICTED_XLSX_ENTITLEMENT).result;
    const gated = mapRich(without('protection', 'xlsx:protection')).result;

    expect(allMeta(full).some(meta => meta.readOnly === true)).toBe(true);
    expect(allMeta(gated).some(meta => meta.readOnly !== undefined)).toBe(false);
  });

  it('withholds mergeCells, hidden and frozen without xlsx:layout', () => {
    const full = mapRich(UNRESTRICTED_XLSX_ENTITLEMENT).result;
    const gated = mapRich(without('layout', 'xlsx:layout')).result;

    expect(full.mergeCells).toHaveLength(1);
    expect(full.hiddenColumns).toEqual([3]);
    expect(full.fixedRowsTop).toBe(1);
    expect(full.layoutDirection).toBe('ltr');

    expect(gated.mergeCells).toBeUndefined();
    expect(gated.hiddenColumns).toBeUndefined();
    expect(gated.fixedRowsTop).toBeUndefined();
    expect(gated.layoutDirection).toBeUndefined();
    expect(gated.data).toEqual(full.data);
  });

  it('keeps formulas as values without xlsx:formulas', () => {
    const workbook = createWorkbookSnapshot();
    const sheet = new SheetBuilder('Data');

    sheet.cell(1, 1).value = 2;
    sheet.cell(1, 2).formula = { text: 'A1*2', result: 4 };
    workbook.sheets.push(sheet.toSnapshot());

    const context = { formulasEnabled: true, commentsEnabled: false, customBordersEnabled: false };
    const full = mapWorkbook(workbook, resolveImportOptions({}), {
      ...context, entitlement: UNRESTRICTED_XLSX_ENTITLEMENT,
    }, new DroppedFeatures());
    const gated = mapWorkbook(workbook, resolveImportOptions({}), {
      ...context, entitlement: without('formulas', 'xlsx:formulas'),
    }, new DroppedFeatures());

    expect(full.data[0]).toEqual([2, '=A1*2']);
    expect(gated.data[0]).toEqual([2, 4]);
  });

  it('records license:<token> for every missing token in dictionary order', () => {
    const { result, dropped } = mapRich(STANDARD_ENTITLEMENT);

    expect(dropped.licenseEntries()).toEqual(PRO_TOKENS.map(id => `license:${id}`));
    expect(result.dropped.filter(name => name.startsWith('license:'))).toEqual(PRO_TOKENS.map(id => `license:${id}`));
    expect(mapRich(UNRESTRICTED_XLSX_ENTITLEMENT).dropped.licenseEntries()).toEqual([]);
  });
});

/**
 * A stand-in for a Handsontable instance with the plugins the import touches, enough for a real
 * `new ImportFile(hot)` to read, map and apply a workbook.
 *
 * @param {string} licenseKey The license key.
 * @returns {{plugin: ImportFile, calls: Array[]}}
 */
function pluginFor(licenseKey) {
  const calls = [];
  const hot = {
    rootWrapperElement: { appendChild() {}, prepend() {}, querySelector: () => null },
    guid: 'hot-license',
    rootDocument: { createElement: () => ({ setAttribute() {}, remove() {} }) },
    toVisualRow: row => row,
    toVisualColumn: col => col,
    addHook() {},
    removeHook() {},
    getSettings: () => ({ importFile: true, licenseKey }),
    getPlugin: name => ({
      formulas: { isEnabled: () => false },
      comments: { isEnabled: () => true },
      customBorders: { isEnabled: () => true },
    })[name],
    runHooks: (name, ...args) => {
      calls.push([name, ...args]);
    },
    batch: fn => fn(),
    isRtl: () => false,
    updateSettings: settings => calls.push(['updateSettings', settings]),
    loadData: data => calls.push(['loadData', data]),
    setCellMetaObject: (...args) => calls.push(['setCellMetaObject', ...args]),
  };
  const plugin = new ImportFile(hot);

  plugin.enablePlugin();

  return { plugin, calls };
}

describe('ImportFile license report', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('limits dropped to the license entries without xlsx:import_report', async() => {
    const full = await pluginFor(keyWith(ALL_XLSX_TOKENS)).plugin.importFromArrayBuffer('xlsx', fixture('lossy'));

    // The file carries lossy content: proven on a full key before it is asserted absent.
    expect(full.dropped).toContain('richText');

    const standard = await pluginFor(keyWith(STANDARD_TOKENS)).plugin.importFromArrayBuffer('xlsx', fixture('lossy'));

    expect(standard.dropped).toEqual(PRO_TOKENS.map(id => `license:${id}`));
    // The engine's dropped-features warning is silenced; only the license warning remains.
    expect(warnSpy.mock.calls.map(([message]) => message).filter(message => /xlsx engine dropped/.test(message)))
      .toHaveLength(1);
  });

  it('keeps the full report with xlsx:import_report', async() => {
    const tokens = [...STANDARD_TOKENS, 'xlsx:import_report'];
    const result = await pluginFor(keyWith(tokens)).plugin.importFromArrayBuffer('xlsx', fixture('lossy'));

    expect(result.dropped).toContain('richText');
    expect(result.dropped).toEqual(expect.arrayContaining(
      PRO_TOKENS.filter(id => id !== 'xlsx:import_report').map(id => `license:${id}`)
    ));
    expect(result.dropped).not.toContain('license:xlsx:import_report');
    expect(warnSpy.mock.calls.some(([message]) => /xlsx engine dropped features/.test(message))).toBe(true);
  });

  it('warns once with the missing tokens, and stays silent under no-console-warns', async() => {
    await pluginFor(keyWith(STANDARD_TOKENS)).plugin.importFromArrayBuffer('xlsx', fixture('values'));

    const licenseWarnings = () => warnSpy.mock.calls
      .map(([message]) => message)
      .filter(message => message.startsWith('The xlsx import skipped'));

    expect(licenseWarnings()).toEqual([
      `The xlsx import skipped features your license does not unlock: ${PRO_TOKENS.join(', ')}.`,
    ]);

    warnSpy.mockClear();

    const silenced = await pluginFor(keyWith(STANDARD_TOKENS, ['no-console-warns']))
      .plugin.importFromArrayBuffer('xlsx', fixture('values'));

    expect(licenseWarnings()).toEqual([]);
    expect(silenced.dropped).toEqual(PRO_TOKENS.map(id => `license:${id}`));

    warnSpy.mockClear();
    await pluginFor(keyWith(ALL_XLSX_TOKENS)).plugin.importFromArrayBuffer('xlsx', fixture('values'));

    expect(licenseWarnings()).toEqual([]);
  });
});
