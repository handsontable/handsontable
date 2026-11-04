import ExcelJS from 'exceljs';
import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { XlsxLicensePage } from '../fixtures/pages/XlsxLicensePage';
import {
  ALL_XLSX_TOKENS, CORE_ONLY_KEY, keyWith, keyWithout, INVALID_KEY,
} from '../fixtures/xlsxLicenseKeys';

/**
 * An arbitrary subset of the xlsx tokens, chosen so a key both grants some export features and lacks
 * others. It is not a product package: which tokens a product grants is decided where keys are issued,
 * never here.
 */
const PARTIAL_TOKENS = ['xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout'];

test.describe('Export entry gate (xlsx:export)', { tag: BUNDLES_TAG }, () => {
  test('hides To Excel and rejects the call without xlsx:export', async({ page, theme, bundle }) => {
    const lic = new XlsxLicensePage(page, theme, bundle);

    await lic.goto();
    await lic.create(keyWith(['xlsx:import']));

    expect(await lic.exportMenuItems()).toEqual(['To CSV']);
    await expect(lic.exportBytes()).rejects.toThrow('does not unlock "xlsx:export"');
  });

  test('shows To Excel for an unrestricted key and for a key that lists xlsx:export', async({ page, theme, bundle }) => {
    const lic = new XlsxLicensePage(page, theme, bundle);

    await lic.goto();

    // The menu is opened with a right click, so the key must not lock the grid: INVALID_KEY restricts
    // nothing either, but its lock screen covers the cell.
    for (const key of [CORE_ONLY_KEY, keyWith(['xlsx:export']), keyWith(PARTIAL_TOKENS)]) {
      await lic.create(key);
      expect(await lic.exportMenuItems()).toEqual(['To CSV', 'To Excel']);
      expect((await lic.exportBytes()).length).toBeGreaterThan(0);
    }
  });
});

/**
 * The tokens that gate a part of the export (every export token but `xlsx:export`, which gates the
 * call), in declaration order.
 */
const EXPORT_FEATURE_TOKENS = [
  'xlsx:formulas',
  'xlsx:layout',
  'xlsx:number_formats',
  'xlsx:comments',
  'xlsx:styles',
  'xlsx:conditional_formatting',
  'xlsx:data_validation',
  'xlsx:protection',
] as const;

/**
 * Every part a token gates, asked for: the column headers (their fill), the hidden Region column
 * written hidden, live formulas, and a conditional formatting rule over the Amount column.
 */
const EXPORT_OPTIONS = {
  colHeaders: true,
  exportHiddenColumns: 'hide',
  exportFormulas: true,
  conditionalFormatting: [
    { cols: [1, 1], rules: [{ type: 'cellIs', operator: 'greaterThan', formulae: ['1000'], style: {} }] },
  ],
};

/**
 * A made-up sheet password. Tests compare it inside `toBe(true)`/`toBe(false)` assertions, so a
 * failure never prints it.
 */
const PASSWORD = 'q4-budget';
const PASSWORD_OPTIONS = { protection: { password: PASSWORD } };

type ExportFeature = typeof EXPORT_FEATURE_TOKENS[number];

/**
 * Exports the fixture's source grid and reports, per token, whether the part it unlocks reached the
 * file. Read back with ExcelJS, plus the raw sheet XML for the two parts ExcelJS does not expose.
 * Header row 1; data rows 2-7; A2 read-only, A3 commented, A4 bold, A5:B5 merged, B6 a formula on
 * the full bundle, C a date column, D a dropdown column, E hidden, one frozen data row.
 */
async function exportedFeatures(lic: XlsxLicensePage): Promise<Record<ExportFeature, boolean>> {
  const bytes = await lic.exportBytes(EXPORT_OPTIONS);
  const xml = lic.sheetXml(bytes);
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(bytes);

  const sheet = workbook.worksheets[0];
  const header = sheet.getCell('A1');

  return {
    // The umd bundle has no HyperFormula, so B6 is a literal there and this reads `false` on every key.
    'xlsx:formulas': Boolean(sheet.getCell('B6').formula),
    'xlsx:layout': sheet.model.merges.includes('A5:B5')
      && sheet.views[0]?.state === 'frozen'
      && sheet.getColumn(5).hidden === true
      && typeof sheet.getColumn(1).width === 'number',
    'xlsx:number_formats': /yy/.test(sheet.getCell('C2').numFmt ?? ''),
    'xlsx:comments': Boolean(sheet.getCell('A3').note),
    'xlsx:styles': sheet.getCell('A4').font?.bold === true
      && (header.fill as ExcelJS.FillPattern | undefined)?.pattern === 'solid',
    'xlsx:conditional_formatting': xml.includes('<conditionalFormatting'),
    'xlsx:data_validation': Boolean(sheet.getCell('D2').dataValidation?.type)
      && workbook.worksheets.length === 2,
    'xlsx:protection': xml.includes('<sheetProtection'),
  };
}

/**
 * Overrides that turn the fixture's source grid into a plain text grid on default settings: no
 * `colWidths`, no merge, hidden column, frozen row, comment, read-only cell or class, and text
 * columns only.
 */
const PLAIN_GRID = {
  data: [['Ana García', 'Engineering'], ['Li Wei', 'Marketing']],
  colHeaders: false,
  columns: [{ type: 'text' }, { type: 'text' }],
  cell: [],
  mergeCells: false,
  hiddenColumns: false,
  fixedRowsTop: 0,
  colWidths: undefined,
};

/**
 * The export's missing-token warnings logged since the last `create()`.
 */
async function licenseWarnings(lic: XlsxLicensePage): Promise<string[]> {
  return (await lic.warnings()).filter(message => message.startsWith('The xlsx export skipped'));
}

for (const engine of ['native', 'exceljs'] as const) {
  test.describe(`xlsx export license gates (${engine})`, { tag: BUNDLES_TAG }, () => {
    test('a key listing import, export, formulas and layout only writes values, formulas and layout', async({
      page, theme, bundle,
    }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(keyWith(PARTIAL_TOKENS));

      const features = await exportedFeatures(lic);

      expect(features).toEqual({
        'xlsx:formulas': bundle === 'full-min',
        'xlsx:layout': true,
        'xlsx:number_formats': false,
        'xlsx:comments': false,
        'xlsx:styles': false,
        'xlsx:conditional_formatting': false,
        'xlsx:data_validation': false,
        'xlsx:protection': false,
      });

      const workbook = await lic.exportWorkbook(EXPORT_OPTIONS);
      const sheet = workbook.worksheets[0];

      // Values still go out: a date as the text the grid shows (a serial means nothing without its
      // number format), the dropdown cell as its text.
      expect(sheet.getCell('A2').value).toBe('Ana García');
      expect(sheet.getCell('C2').type).toBe(ExcelJS.ValueType.String);
      expect(sheet.getCell('C2').value).toBe('01/15/2024');
      expect(sheet.getCell('D2').value).toBe('Open');

      if (bundle === 'full-min') {
        expect(sheet.getCell('B6').formula).toBe('B2+B3');
      }

      expect(await licenseWarnings(lic)).toEqual(Array(2).fill(
        'The xlsx export skipped features your license does not unlock: xlsx:number_formats, xlsx:comments, '
        + 'xlsx:styles, xlsx:conditional_formatting, xlsx:data_validation, xlsx:protection.'
      ));
    });

    // Compared on the built-in engine only, whose output carries nothing but the content.
    if (engine === 'native') {
      test('a full key writes the same sheet as an invalid key', async({ page, theme, bundle }) => {
        const lic = new XlsxLicensePage(page, theme, bundle, engine);

        await lic.goto();
        await lic.create(keyWith(ALL_XLSX_TOKENS));

        const full = lic.sheetXml(await lic.exportBytes(EXPORT_OPTIONS));

        expect(await licenseWarnings(lic)).toEqual([]);

        await lic.create(INVALID_KEY);

        expect(lic.sheetXml(await lic.exportBytes(EXPORT_OPTIONS))).toBe(full);
      });
    }

    test('each export feature token removes exactly its part', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(keyWith(ALL_XLSX_TOKENS));

      const full = await exportedFeatures(lic);

      expect(Object.entries(full).filter(([, present]) => !present).map(([id]) => id))
        .toEqual(bundle === 'full-min' ? [] : ['xlsx:formulas']);

      for (const token of EXPORT_FEATURE_TOKENS) {
        await lic.create(keyWithout(token));

        // The umd bundle has no HyperFormula, so its grid holds no formula for the export to drop.
        const hasPart = token !== 'xlsx:formulas' || bundle === 'full-min';

        expect(await exportedFeatures(lic), token).toEqual({ ...full, [token]: false });
        expect(await licenseWarnings(lic), token).toEqual(hasPart ? [
          `The xlsx export skipped features your license does not unlock: ${token}.`,
        ] : []);
      }
    });

    test('a password writes a SHA-512 sheet protection with a fresh salt', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(keyWith(ALL_XLSX_TOKENS));

      const first = lic.sheetXml(await lic.exportBytes(PASSWORD_OPTIONS));
      const second = lic.sheetXml(await lic.exportBytes(PASSWORD_OPTIONS));
      const salt = (xml: string) => xml.match(/<sheetProtection[^>]*saltValue="([^"]+)"/)?.[1];

      expect(first).toMatch(/<sheetProtection[^>]*algorithmName="SHA-512"/);
      expect(first).toMatch(/<sheetProtection[^>]*spinCount="100000"/);
      expect(first).toMatch(/<sheetProtection[^>]*hashValue="[^"]+"/);
      expect(salt(first)).toBeTruthy();
      expect(salt(first)).not.toBe(salt(second));
      // Only the hash reaches the file.
      expect(first.includes(PASSWORD)).toBe(false);

      // Without the option the sheet is protected with no password, as before.
      expect(lic.sheetXml(await lic.exportBytes())).not.toMatch(/<sheetProtection[^>]*hashValue=/);
    });

    test('protection: null writes no sheetProtection and no locked cell', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(keyWith(ALL_XLSX_TOKENS));

      const workbook = await lic.exportWorkbook({ protection: null });

      expect(lic.sheetXml(await lic.exportBytes({ protection: null }))).not.toContain('<sheetProtection');
      expect(workbook.worksheets[0].getCell('A1').protection?.locked).not.toBe(true);
    });

    test('a non-string password rejects the export without naming the value', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(keyWith(ALL_XLSX_TOKENS));

      const error = await lic.exportBytes({ protection: { password: 1234 } }).then(() => null, (e: Error) => e);

      expect(error?.message).toContain('ExportFile: the "protection.password" option has to be a string.');
      expect(error?.message.includes('1234')).toBe(false);
    });

    test('a key without xlsx:protection writes no sheetProtection despite the option, and the warning has no password', async({
      page, theme, bundle,
    }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(keyWith(PARTIAL_TOKENS));

      const xml = lic.sheetXml(await lic.exportBytes(PASSWORD_OPTIONS));
      const warnings = await lic.warnings();

      expect(xml).not.toContain('<sheetProtection');
      // No `conditionalFormatting` option here, so the warning leaves out its token.
      expect(await licenseWarnings(lic)).toEqual([
        'The xlsx export skipped features your license does not unlock: xlsx:number_formats, xlsx:comments, '
        + 'xlsx:styles, xlsx:data_validation, xlsx:protection.',
      ]);
      expect(warnings.some(message => message.includes(PASSWORD))).toBe(false);
    });

    test('a password-protected file imports its locked cells as read-only and reports sheetProtection:password',
      async({ page, theme, bundle }) => {
        const lic = new XlsxLicensePage(page, theme, bundle, engine);

        await lic.goto();
        await lic.create(keyWith(ALL_XLSX_TOKENS));

        const result = await lic.importBytes(await lic.exportBytes(PASSWORD_OPTIONS));
        const cellsMeta = (result.cellsMeta ?? []) as { row: number; col: number; meta: Record<string, unknown> }[];

        // The fixture's read-only cell is A1 (no header row is exported here).
        expect(cellsMeta.some(({ row, col, meta }) => row === 0 && col === 0 && meta.readOnly === true)).toBe(true);
        expect(cellsMeta.some(({ row, col, meta }) => row === 1 && col === 0 && meta.readOnly === true)).toBe(false);
        expect(result.dropped).toContain('sheetProtection:password');
        expect(JSON.stringify(result).includes(PASSWORD)).toBe(false);
        expect((await lic.warnings()).some(message => message.includes(PASSWORD))).toBe(false);
      });

    test('a date formula exports its displayed value as text without xlsx:number_formats', async({
      page, theme, bundle,
    }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);
      // Only the full bundle carries HyperFormula, so only there does C2 compute a date; on the base
      // bundle the grid shows the unparsed source as a bad value. Either way the export writes what
      // the grid shows.
      const dateFormula = {
        data: [
          ['Ana García', 4200.5, '2024-01-15', 'Open', 'north'],
          ['James Okafor', 18700, '=C1+30', 'Closed', 'south'],
        ],
        cell: [],
        mergeCells: false,
      };

      await lic.goto();

      // This key unlocks xlsx:formulas but not xlsx:number_formats.
      await lic.create(keyWith(PARTIAL_TOKENS), dateFormula);

      const gated = (await lic.exportWorkbook({ exportFormulas: true })).worksheets[0].getCell('C2');

      // The export writes what the grid shows in that cell.
      const shown = (await page.getByTestId('source-1-2').textContent())?.trim();

      expect(gated.formula).toBeUndefined();
      expect(gated.type).toBe(ExcelJS.ValueType.String);
      expect(gated.value).toBe(shown);

      if (bundle === 'full-min') {
        expect(shown).toBe('02/14/2024');
      }

      await lic.create(keyWith(ALL_XLSX_TOKENS), dateFormula);

      const full = (await lic.exportWorkbook({ exportFormulas: true })).worksheets[0].getCell('C2');

      // With both tokens the source formula goes out live, formatted as a date.
      expect(full.formula).toBe('C1+30');
      expect(full.numFmt).toMatch(/yy/);
    });

    test('a grid on default settings warns about xlsx:layout for its auto-sized columns only', async({
      page, theme, bundle,
    }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();

      // AutoColumnSize is on by default, and the widths it measures are layout the file would carry.
      await lic.create(keyWith(['xlsx:export']), PLAIN_GRID);
      await lic.exportBytes();

      expect(await licenseWarnings(lic)).toEqual([
        'The xlsx export skipped features your license does not unlock: xlsx:layout.',
      ]);

      // With every column at the default width, the grid has no layout to write.
      await lic.create(keyWith(['xlsx:export']), { ...PLAIN_GRID, autoColumnSize: false });
      await lic.exportBytes();

      expect(await licenseWarnings(lic)).toEqual([]);
    });

    test('no-console-warns silences the warning but not the gate', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(keyWith(PARTIAL_TOKENS, ['no-console-warns']));

      const features = await exportedFeatures(lic);

      expect(features['xlsx:styles']).toBe(false);
      expect(features['xlsx:comments']).toBe(false);
      expect(features['xlsx:layout']).toBe(true);
      expect(await licenseWarnings(lic)).toEqual([]);
    });
  });
}
