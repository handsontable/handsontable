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
import {
  ALL_XLSX_TOKENS,
  keyWithoutTier,
} from '../../../utils/entitlementLicenseKey/__tests__/xlsxLicenseKeys';
import { resetTierKeys, tierKeyWithout } from '../../../utils/entitlementLicenseKey/__tests__/tierKeys';

/**
 * An arbitrary subset of the xlsx tokens, chosen so a key both grants some import features and lacks
 * others. It is not a product package: which tokens a product grants is decided where keys are issued,
 * never here.
 */
const PARTIAL_TOKENS = ['xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout'];
/**
 * The tokens a key listing `PARTIAL_TOKENS` lacks, in declaration order.
 */
const MISSING_TOKENS = ALL_XLSX_TOKENS.filter(id => !PARTIAL_TOKENS.includes(id));

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
/**
 * Of `MISSING_TOKENS`, the ones the import gates: `xlsx:number_formats` restricts the export only.
 */
const IMPORT_MISSING_TOKENS = MISSING_TOKENS.filter(id => id !== 'xlsx:number_formats');

/**
 * The `license:<token>` entries a dropped-features list holds, in recorded order.
 *
 * @param {string[]} names The dropped-feature names.
 * @returns {string[]}
 */
const licenseEntriesOf = names => names.filter(name => name.startsWith('license:'));

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

/**
 * The entitlement a key listing `PARTIAL_TOKENS` resolves to, scoped to the import.
 */
const PARTIAL_ENTITLEMENT = {
  ...UNRESTRICTED_XLSX_ENTITLEMENT,
  numberFormats: false,
  comments: false,
  styles: false,
  conditionalFormatting: false,
  dataValidation: false,
  protection: false,
  missing: IMPORT_MISSING_TOKENS,
};

/**
 * One sheet carrying every feature a token gates: a header row, a dated column, a styled and
 * bordered cell, a comment and a header-band comment, a locked cell under sheet protection, a list validation, a merge, a
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
  // A comment in the header band, so the `comment:header` entry is pinned to `xlsx:comments` too.
  sheet.cell(1, 2).comment = 'Header note';
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

/**
 * A sheet with a two-row header band whose top row merges A1:B1 into one group, and one data row.
 *
 * @returns {object} The workbook snapshot.
 */
function headerBandWorkbook() {
  const workbook = createWorkbookSnapshot();
  const sheet = new SheetBuilder('Data');

  sheet.cell(1, 1).value = 'Person';
  sheet.cell(1, 3).value = 'Pay';
  sheet.merge(1, 1, 1, 2);
  sheet.cell(2, 1).value = 'Name';
  sheet.cell(2, 2).value = 'Team';
  sheet.cell(2, 3).value = 'Amount';
  sheet.cell(3, 1).value = 'Ana García';
  sheet.cell(3, 2).value = 'Engineering';
  sheet.cell(3, 3).value = 4200;
  workbook.sheets.push(sheet.toSnapshot());

  return workbook;
}

/**
 * Maps a workbook with `colHeaders: 'firstRow'` and a two-row header band, unless `options` says
 * otherwise.
 *
 * @param {object} workbook The workbook snapshot.
 * @param {object} entitlement The entitlement in the mapper context.
 * @param {object} [options] Import options merged over the header-band ones.
 * @returns {{result: object, names: string[]}}
 */
function mapHeaderBand(workbook, entitlement, options = {}) {
  const dropped = new DroppedFeatures();
  const result = mapWorkbook(workbook, resolveImportOptions({ colHeaders: 'firstRow', headerRows: 2, ...options }), {
    formulasEnabled: false,
    commentsEnabled: false,
    customBordersEnabled: false,
    entitlement,
  }, dropped);

  return { result, names: dropped.list() };
}

describe('ImportFile mapper license gates', () => {
  it('still infers a date from its number format without xlsx:number_formats', () => {
    const full = mapRich(UNRESTRICTED_XLSX_ENTITLEMENT).result;
    const gated = mapRich(without('numberFormats', 'xlsx:number_formats')).result;
    const partial = mapRich(PARTIAL_ENTITLEMENT).result;

    expect(full.columns[2].type).toBe('date');
    expect(gated.columns[2].type).toBe('date');
    expect(gated.columns[1].type).toBe('numeric');
    expect(partial.columns[2].type).toBe('date');
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

  it('names a style loss by cellStyles without importStyles, and by its license entry with it', () => {
    // The file carries styles: without the option, a full key reports them as `cellStyles`.
    expect(mapRich(UNRESTRICTED_XLSX_ENTITLEMENT).dropped.list()).toContain('cellStyles');

    // The caller did not ask for styles, so the license took nothing: the option entry names the loss.
    const notAsked = mapRich(without('styles', 'xlsx:styles')).dropped.list();

    expect(notAsked).toContain('cellStyles');
    expect(notAsked).not.toContain('license:xlsx:styles');

    const asked = mapRich(without('styles', 'xlsx:styles'), { importStyles: true }).dropped.list();

    expect(asked).toContain('license:xlsx:styles');
    expect(asked).not.toContain('cellStyles');
    expect(asked).not.toContain('cellStyles:borders');
  });

  it('records no license entry for a feature the caller did not ask the import to bring over', () => {
    const cases = [
      ['layout', 'xlsx:layout', { importLayout: false }],
      ['dataValidation', 'xlsx:data_validation', { inferCellTypes: false }],
    ];

    cases.forEach(([flag, token, options]) => {
      const asked = mapRich(without(flag, token)).dropped.list();
      const notAsked = mapRich(without(flag, token), options).dropped.list();

      expect([token, licenseEntriesOf(asked)]).toEqual([token, [`license:${token}`]]);
      expect([token, licenseEntriesOf(notAsked)]).toEqual([token, []]);
    });

    const workbook = createWorkbookSnapshot();
    const sheet = new SheetBuilder('Data');

    sheet.cell(1, 1).value = 2;
    sheet.cell(1, 2).formula = { text: 'A1*2', result: 4 };
    workbook.sheets.push(sheet.toSnapshot());

    [[true, ['license:xlsx:formulas']], [false, []]].forEach(([importFormulas, expected]) => {
      const dropped = new DroppedFeatures();

      mapWorkbook(workbook, resolveImportOptions({ importFormulas }), {
        formulasEnabled: true,
        commentsEnabled: false,
        customBordersEnabled: false,
        entitlement: without('formulas', 'xlsx:formulas'),
      }, dropped);

      expect([importFormulas, licenseEntriesOf(dropped.list())]).toEqual([importFormulas, expected]);
    });
  });

  it('reports comments as comments, not by the license, when the Comments plugin is off', () => {
    const dropped = new DroppedFeatures();

    mapWorkbook(richWorkbook(), resolveImportOptions({ colHeaders: 'firstRow' }), {
      formulasEnabled: false,
      commentsEnabled: false,
      customBordersEnabled: true,
      entitlement: without('comments', 'xlsx:comments'),
    }, dropped);

    expect(dropped.list()).toContain('comments');
    expect(dropped.list()).toContain('comment:header');
    expect(licenseEntriesOf(dropped.list())).toEqual([]);
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
    expect(full.dropped.list()).toContain('comment:header');
    expect(gated.dropped.list()).not.toContain('comments');
    // A header note is lost on every key, so it keeps its own entry and is never blamed on the license.
    expect(gated.dropped.list()).toContain('comment:header');
    expect(licenseEntriesOf(gated.dropped.list())).toEqual(['license:xlsx:comments']);
  });

  it('reports a header-only note as comment:header, not as a license loss', () => {
    const workbook = createWorkbookSnapshot();
    const sheet = new SheetBuilder('Data');

    sheet.cell(1, 1).value = 'Name';
    sheet.cell(1, 1).comment = 'Header note';
    sheet.cell(2, 1).value = 'Ana García';
    workbook.sheets.push(sheet.toSnapshot());

    const dropped = new DroppedFeatures();

    mapWorkbook(workbook, resolveImportOptions({ colHeaders: 'firstRow' }), {
      formulasEnabled: false,
      commentsEnabled: true,
      customBordersEnabled: false,
      entitlement: without('comments', 'xlsx:comments'),
    }, dropped);

    expect(dropped.list()).toEqual(['comment:header']);
    // The import warning names `licenseTokens()`, so an empty list means no license warning.
    expect(dropped.licenseTokens()).toEqual([]);
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

  it('collects no formula and reports only the license entry without xlsx:formulas', () => {
    const workbook = createWorkbookSnapshot();
    const sheet = new SheetBuilder('Data');

    sheet.cell(1, 1).value = 2;
    sheet.cell(1, 2).formula = { text: 'A1*2', result: 4 };
    // No cached value: with the token, a formula imported as a value reports `formula:noCachedValue`.
    sheet.cell(1, 3).formula = { text: 'A1*3' };
    workbook.sheets.push(sheet.toSnapshot());

    const context = { formulasEnabled: false, commentsEnabled: false, customBordersEnabled: false };
    const fullDropped = new DroppedFeatures();
    const full = mapWorkbook(workbook, resolveImportOptions({}), {
      ...context, entitlement: UNRESTRICTED_XLSX_ENTITLEMENT,
    }, fullDropped);
    const gatedDropped = new DroppedFeatures();
    const gated = mapWorkbook(workbook, resolveImportOptions({}), {
      ...context, entitlement: without('formulas', 'xlsx:formulas'),
    }, gatedDropped);

    expect(full.formulas).toEqual([{ row: 0, col: 1, formula: 'A1*2' }, { row: 0, col: 2, formula: 'A1*3' }]);
    expect(fullDropped.list()).toContain('formula:noCachedValue');

    expect(gated.formulas).toBeUndefined();
    expect(gated.data[0]).toEqual([2, 4, null]);
    expect(gatedDropped.list()).toEqual(['license:xlsx:formulas']);
  });

  it('records no license entry for a workbook that carries values only', () => {
    const workbook = createWorkbookSnapshot();
    const sheet = new SheetBuilder('Data');

    sheet.cell(1, 1).value = 'Name';
    sheet.cell(2, 1).value = 'Ana García';
    sheet.cell(2, 2).value = 4200;
    workbook.sheets.push(sheet.toSnapshot());

    const dropped = new DroppedFeatures();
    const result = mapWorkbook(workbook, resolveImportOptions({ colHeaders: 'firstRow' }), {
      formulasEnabled: false,
      commentsEnabled: true,
      customBordersEnabled: true,
      entitlement: {
        ...PARTIAL_ENTITLEMENT,
        formulas: false,
        layout: false,
        missing: ['xlsx:formulas', 'xlsx:layout', ...IMPORT_MISSING_TOKENS],
      },
    }, dropped);

    expect(dropped.list()).toEqual([]);
    expect(result.dropped).toEqual([]);
  });

  it('records only the license entries of the features the file carries', () => {
    const workbook = createWorkbookSnapshot();
    const sheet = new SheetBuilder('Data');

    sheet.cell(1, 1).value = 'Ana García';
    sheet.cell(1, 1).comment = 'Check';
    workbook.sheets.push(sheet.toSnapshot());

    const dropped = new DroppedFeatures();

    mapWorkbook(workbook, resolveImportOptions({}), {
      formulasEnabled: false,
      commentsEnabled: true,
      customBordersEnabled: true,
      entitlement: PARTIAL_ENTITLEMENT,
    }, dropped);

    expect(dropped.list()).toEqual(['license:xlsx:comments']);
  });

  it('records each layout feature as license:xlsx:layout on its own', () => {
    const layouts = {
      merge: sheet => sheet.merge(1, 1, 1, 2),
      hiddenRow: sheet => sheet.hideRow(1),
      hiddenColumn: sheet => sheet.hideCol(1),
      freeze: sheet => sheet.freeze(1, 0),
      columnWidth: sheet => sheet.setColWidth(1, 20),
      rowHeight: sheet => sheet.setRowHeight(1, 30),
      rtl: sheet => sheet.setRtl(true),
      none: () => {},
    };

    Object.entries(layouts).forEach(([name, apply]) => {
      const workbook = createWorkbookSnapshot();
      const sheet = new SheetBuilder('Data');

      sheet.cell(1, 1).value = 'Ana García';
      sheet.cell(1, 2).value = 'Li Wei';
      apply(sheet);
      workbook.sheets.push(sheet.toSnapshot());

      const dropped = new DroppedFeatures();

      mapWorkbook(workbook, resolveImportOptions({}), {
        formulasEnabled: false,
        commentsEnabled: true,
        customBordersEnabled: true,
        entitlement: without('layout', 'xlsx:layout'),
      }, dropped);

      expect([name, dropped.list()]).toEqual([name, name === 'none' ? [] : ['license:xlsx:layout']]);
    });
  });

  it('builds the header band without groups without xlsx:layout, and records the license entry', () => {
    const workbook = headerBandWorkbook();

    const map = entitlement => mapHeaderBand(workbook, entitlement);
    const full = map(UNRESTRICTED_XLSX_ENTITLEMENT);
    const gated = map(without('layout', 'xlsx:layout'));

    expect(full.result.nestedHeaders).toEqual([
      [{ label: 'Person', colspan: 2 }, 'Pay'],
      ['Name', 'Team', 'Amount'],
    ]);
    expect(licenseEntriesOf(full.names)).toEqual([]);

    // Each header cell is its own label, the blank one stays blank: no group survives.
    expect(gated.result.nestedHeaders).toEqual([
      ['Person', '', 'Pay'],
      ['Name', 'Team', 'Amount'],
    ]);
    expect(gated.result.nestedHeaders.flat().some(header => typeof header === 'object')).toBe(false);
    expect(gated.names).toContain('license:xlsx:layout');
    expect(gated.result.data).toEqual(full.result.data);
  });

  it('records license:xlsx:layout for header groups the license dropped, even with importLayout off', () => {
    const workbook = headerBandWorkbook();
    const gated = mapHeaderBand(workbook, without('layout', 'xlsx:layout'), { importLayout: false });

    // `importLayout` does not govern the header groups, the license does, so the loss is named.
    expect(gated.result.nestedHeaders[0]).toEqual(['Person', '', 'Pay']);
    expect(licenseEntriesOf(gated.names)).toEqual(['license:xlsx:layout']);

    // A full key keeps the group with `importLayout: false`, so nothing is lost and nothing recorded.
    const full = mapHeaderBand(workbook, UNRESTRICTED_XLSX_ENTITLEMENT, { importLayout: false });

    expect(full.result.nestedHeaders[0]).toEqual([{ label: 'Person', colspan: 2 }, 'Pay']);
    expect(licenseEntriesOf(full.names)).toEqual([]);
  });

  it('records no license entry for a header merge no nested header would use', () => {
    // One header row: the band becomes `colHeaders`, which has no groups, and the caller turned
    // layout off, so the merge was never going to be imported.
    const single = mapHeaderBand(headerBandWorkbook(), without('layout', 'xlsx:layout'), {
      importLayout: false, headerRows: 1,
    });

    expect(single.result.nestedHeaders).toBeUndefined();
    expect(licenseEntriesOf(single.names)).toEqual([]);
  });

  it('records license:<token> for every missing token in dictionary order', () => {
    const { result, dropped } = mapRich(PARTIAL_ENTITLEMENT, { importStyles: true });

    expect(licenseEntriesOf(dropped.list())).toEqual(IMPORT_MISSING_TOKENS.map(id => `license:${id}`));
    expect(licenseEntriesOf(result.dropped)).toEqual(IMPORT_MISSING_TOKENS.map(id => `license:${id}`));
    expect(licenseEntriesOf(mapRich(UNRESTRICTED_XLSX_ENTITLEMENT).dropped.list())).toEqual([]);
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

/**
 * The import tokens a key listing `PARTIAL_TOKENS` lacks whose feature the `lossy` fixture carries: of
 * the missing ones, the file has a protected sheet only.
 */
const PARTIAL_LOSSY_LICENSE = ['xlsx:protection'];

/**
 * What the import of the `lossy` fixture reports on a key listing `PARTIAL_TOKENS`, in recorded order: the entries the
 * read drives, the `license:` entry of each import token the key lacks and the file needs (never
 * `xlsx:number_formats`, which restricts the export only), then the cell types `pluginFor()`'s
 * stand-in instance does not register.
 */
const PARTIAL_LOSSY_DROPPED = [
  'richText',
  'sheetProtection:password',
  'autoFilter',
  'hyperlink',
  'images',
  'tables',
  ...PARTIAL_LOSSY_LICENSE.map(id => `license:${id}`),
  'cellType:text',
  'cellType:numeric',
];

describe('ImportFile license report', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    resetTierKeys();
  });

  it('keeps the full report on a key that lacks some tokens, with the license entries of the import only', async() => {
    const full = await pluginFor(tierKeyWithout([])).plugin.importFromArrayBuffer('xlsx', fixture('lossy'));

    // The file carries lossy content: proven on a full key before the partial key reports it too.
    expect(full.dropped).toContain('richText');
    expect(licenseEntriesOf(full.dropped)).toEqual([]);

    warnSpy.mockClear();

    const partial = await pluginFor(xlsxKeyWith(PARTIAL_TOKENS)).plugin.importFromArrayBuffer('xlsx', fixture('lossy'));

    expect(partial.dropped).toEqual(PARTIAL_LOSSY_DROPPED);
    expect(partial.dropped).not.toContain('license:xlsx:number_formats');
    expect(warnSpy.mock.calls.map(([message]) => message)).toEqual([
      `The built-in xlsx engine dropped features it cannot write or read: ${
        PARTIAL_LOSSY_DROPPED.filter(name => !name.startsWith('license:')).join(', ')}.`,
      `The xlsx import skipped features your license does not unlock: ${PARTIAL_LOSSY_LICENSE.join(', ')}.`,
    ]);
  });

  it('never names an export-only token on import', async() => {
    const exportOnlyMissing = await pluginFor(tierKeyWithout(['xlsx:number_formats', 'xlsx:export']))
      .plugin.importFromArrayBuffer('xlsx', fixture('values'));

    expect(licenseEntriesOf(exportOnlyMissing.dropped)).toEqual([]);
    expect(warnSpy.mock.calls.filter(([message]) => message.startsWith('The xlsx import skipped'))).toEqual([]);
  });

  it('leaves a key that names no tier unrestricted, whatever it lists', async() => {
    const legacy = await pluginFor('non-commercial-and-evaluation')
      .plugin.importFromArrayBuffer('xlsx', fixture('lossy'));

    warnSpy.mockClear();

    const noTier = await pluginFor(keyWithoutTier(PARTIAL_TOKENS))
      .plugin.importFromArrayBuffer('xlsx', fixture('lossy'));

    expect(noTier).toEqual(legacy);
    expect(warnSpy.mock.calls.filter(([message]) => message.startsWith('The xlsx import skipped'))).toEqual([]);
  });

  it('neither records nor warns about xlsx:layout when the caller turned importLayout off', async() => {
    const licenseWarnings = () => warnSpy.mock.calls
      .map(([message]) => message)
      .filter(message => message.startsWith('The xlsx import skipped'));
    const asked = await pluginFor(tierKeyWithout(['xlsx:layout']))
      .plugin.importFromArrayBuffer('xlsx', fixture('layout'));

    expect(licenseEntriesOf(asked.dropped)).toEqual(['license:xlsx:layout']);
    expect(licenseWarnings()).toEqual(['The xlsx import skipped features your license does not unlock: xlsx:layout.']);

    warnSpy.mockClear();

    const notAsked = await pluginFor(tierKeyWithout(['xlsx:layout']))
      .plugin.importFromArrayBuffer('xlsx', fixture('layout'), { importLayout: false });

    expect(licenseEntriesOf(notAsked.dropped)).toEqual([]);
    expect(licenseWarnings()).toEqual([]);
  });

  it('says nothing about the license for a values-only file on a key that lacks some tokens', async() => {
    const result = await pluginFor(xlsxKeyWith(PARTIAL_TOKENS)).plugin.importFromArrayBuffer('xlsx', fixture('values'));

    expect(licenseEntriesOf(result.dropped)).toEqual([]);
    expect(warnSpy.mock.calls.filter(([message]) => message.startsWith('The xlsx import skipped'))).toEqual([]);
  });

  it('warns once with the missing tokens, and stays silent under no-console-warns', async() => {
    await pluginFor(xlsxKeyWith(PARTIAL_TOKENS)).plugin.importFromArrayBuffer('xlsx', fixture('lossy'));

    const licenseWarnings = () => warnSpy.mock.calls
      .map(([message]) => message)
      .filter(message => message.startsWith('The xlsx import skipped'));

    expect(licenseWarnings()).toEqual([
      'The xlsx import skipped features your license does not unlock: xlsx:protection.',
    ]);

    warnSpy.mockClear();

    const silenced = await pluginFor(xlsxKeyWith(PARTIAL_TOKENS, ['no-console-warns']))
      .plugin.importFromArrayBuffer('xlsx', fixture('lossy'));

    expect(licenseWarnings()).toEqual([]);
    expect(licenseEntriesOf(silenced.dropped)).toEqual(['license:xlsx:protection']);

    warnSpy.mockClear();
    await pluginFor(tierKeyWithout([])).plugin.importFromArrayBuffer('xlsx', fixture('values'));

    expect(licenseWarnings()).toEqual([]);
  });
});
