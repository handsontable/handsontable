import ExcelJS from 'exceljs';
import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { XlsxLicensePage } from '../fixtures/pages/XlsxLicensePage';
import {
  ALL_XLSX_TOKENS, keyWith, keyWithout, LEGACY_KEY, STANDARD_TOKENS,
} from '../fixtures/xlsxLicenseKeys';

test.describe('Export entry gate (xlsx:export)', { tag: BUNDLES_TAG }, () => {
  test('hides To Excel and rejects the call without xlsx:export', async({ page, theme, bundle }) => {
    const lic = new XlsxLicensePage(page, theme, bundle);

    await lic.goto();
    await lic.create(keyWith(['xlsx:import']));

    expect(await lic.exportMenuItems()).toEqual(['To CSV']);
    await expect(lic.exportBytes()).rejects.toThrow('does not unlock "xlsx:export"');
  });

  test('shows To Excel for the legacy key and for a Standard key', async({ page, theme, bundle }) => {
    const lic = new XlsxLicensePage(page, theme, bundle);

    await lic.goto();

    for (const key of [LEGACY_KEY, keyWith(STANDARD_TOKENS)]) {
      await lic.create(key);
      expect(await lic.exportMenuItems()).toEqual(['To CSV', 'To Excel']);
      expect((await lic.exportBytes()).length).toBeGreaterThan(0);
    }
  });
});

/**
 * The Pro tokens of the export, in declaration order.
 */
const PRO_EXPORT_TOKENS = [
  'xlsx:number_formats',
  'xlsx:comments',
  'xlsx:styles',
  'xlsx:conditional_formatting',
  'xlsx:data_validation',
  'xlsx:protection',
] as const;

/**
 * The six Pro tokens a Standard key lacks, in declaration order. Every one of them is an export
 * token, so the export's warning names them all.
 */
const PRO_TOKENS = ALL_XLSX_TOKENS.filter(id => !(STANDARD_TOKENS as readonly string[]).includes(id));

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

type ExportFeature = 'xlsx:formulas' | 'xlsx:layout' | typeof PRO_EXPORT_TOKENS[number];

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
 * The export's missing-token warnings logged since the last `create()`.
 */
async function licenseWarnings(lic: XlsxLicensePage): Promise<string[]> {
  return (await lic.warnings()).filter(message => message.startsWith('The xlsx export skipped'));
}

for (const engine of ['native', 'exceljs'] as const) {
  test.describe(`xlsx export license gates (${engine})`, { tag: BUNDLES_TAG }, () => {
    test('a Standard key writes values, formulas and layout only', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(keyWith(STANDARD_TOKENS));

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

      // Values still go out: a date as its serial number, the dropdown cell as its text.
      expect(sheet.getCell('A2').value).toBe('Ana García');
      expect(sheet.getCell('C2').value).toBe(45306);
      expect(sheet.getCell('D2').value).toBe('Open');

      if (bundle === 'full-min') {
        expect(sheet.getCell('B6').formula).toBe('B2+B3');
      }

      expect(PRO_TOKENS).toEqual([...PRO_EXPORT_TOKENS]);
      expect(await licenseWarnings(lic)).toEqual(Array(2).fill(
        'The xlsx export skipped features your license does not unlock: xlsx:number_formats, xlsx:comments, '
        + 'xlsx:styles, xlsx:conditional_formatting, xlsx:data_validation, xlsx:protection.'
      ));
    });

    // Compared on the built-in engine only, whose output carries nothing but the content.
    if (engine === 'native') {
      test('a full key writes the same sheet as the legacy key', async({ page, theme, bundle }) => {
        const lic = new XlsxLicensePage(page, theme, bundle, engine);

        await lic.goto();
        await lic.create(keyWith(ALL_XLSX_TOKENS));

        const full = lic.sheetXml(await lic.exportBytes(EXPORT_OPTIONS));

        expect(await licenseWarnings(lic)).toEqual([]);

        await lic.create(LEGACY_KEY);

        expect(lic.sheetXml(await lic.exportBytes(EXPORT_OPTIONS))).toBe(full);
      });
    }

    test('each Pro token removes exactly its part', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(keyWith(ALL_XLSX_TOKENS));

      const full = await exportedFeatures(lic);

      expect(Object.entries(full).filter(([, present]) => !present).map(([id]) => id))
        .toEqual(bundle === 'full-min' ? [] : ['xlsx:formulas']);

      for (const token of PRO_EXPORT_TOKENS) {
        await lic.create(keyWithout(token));

        expect(await exportedFeatures(lic), token).toEqual({ ...full, [token]: false });
        expect(await licenseWarnings(lic), token).toEqual([
          `The xlsx export skipped features your license does not unlock: ${token}.`,
        ]);
      }
    });

    test('no-console-warns silences the warning but not the gate', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(keyWith(STANDARD_TOKENS, ['no-console-warns']));

      const features = await exportedFeatures(lic);

      expect(features['xlsx:styles']).toBe(false);
      expect(features['xlsx:comments']).toBe(false);
      expect(features['xlsx:layout']).toBe(true);
      expect(await licenseWarnings(lic)).toEqual([]);
    });
  });
}
