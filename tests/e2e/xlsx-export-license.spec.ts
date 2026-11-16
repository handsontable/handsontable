import ExcelJS from 'exceljs';
import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { XlsxLicensePage } from '../fixtures/pages/XlsxLicensePage';
import {
  ALL_XLSX_TOKENS, CORE_ONLY_KEY, keyWithTier, INVALID_KEY,
} from '../fixtures/xlsxLicenseKeys';
import {
  featuresMissingFrom, manifestTiers, requiredTierWithEvery, requiredTierWithout, tiersLeavingOut,
} from '../fixtures/licenseTiers';

/**
 * The feature a partial tier must leave out: the first tier without it is the one the partial tests
 * read. Styles are named because the tests below assert on them; which tier leaves them out, and what
 * else it leaves out, is the manifest's.
 *
 * The keys name the build's real tiers, read from `dist/manifest.json` when a test runs: the fixture cannot
 * add a made-up tier to the bundle's XLSX tier table, as `license-capabilities.html` does for plugins. A
 * test picks its tier by the feature it needs off (or on) and reads everything else it asserts from the
 * manifest. It still depends on the assignment in one way: it fails, with the reason, when no tier fits
 * (every tier lists the feature, or none lists a feature the test needs on beside it).
 *
 * A feature every real tier lists cannot be switched off by a real key, so those cases live in the unit
 * suite, which builds keys with made-up tiers: the export refused and the menu item hidden without
 * xlsx:export (`handsontable/src/plugins/exportFile/__tests__/exportFile.unit.js`), and the parts and
 * warnings without xlsx:formulas or xlsx:layout
 * (`handsontable/src/plugins/exportFile/__tests__/xlsxLicenseGates.unit.js`). That suite counts any column
 * width other than the default as layout ("counts explicit layout only toward xlsx:layout"), which is why an
 * auto-sized width counts too; `xlsxAutoSizedWidthLicense.unit.js` beside it exports a width the grid computed
 * through the real data provider.
 */
const PARTIAL_TIER_LACKS = 'xlsx:styles';

test.describe('Export entry gate (xlsx:export)', { tag: BUNDLES_TAG }, () => {
  test('shows To Excel for an unrestricted key and for a key naming any tier that lists xlsx:export', async({
    page, theme, bundle,
  }) => {
    const lic = new XlsxLicensePage(page, theme, bundle);
    const exportTiers = manifestTiers().filter(tier => featuresMissingFrom(tier, ['xlsx:export']).length === 0);

    expect(exportTiers.length).toBeGreaterThan(0);

    await lic.goto();

    // The menu is opened with a right click, so the key must not lock the grid: INVALID_KEY restricts
    // nothing either, but its lock screen covers the cell.
    for (const key of [CORE_ONLY_KEY, ...exportTiers.map(tier => keyWithTier([tier]))]) {
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
 * Of the export tokens a tier lacks, the ones whose part the fixture's grid carries, which the export's
 * warning names, in declaration order: the umd bundle has no HyperFormula, so its grid holds no formula.
 * `exclude` leaves out the tokens whose option an export does not ask for.
 */
function exportWarnedTokens(tier: string, bundle: string, exclude: string[] = []): string[] {
  return featuresMissingFrom(tier, EXPORT_FEATURE_TOKENS)
    .filter(id => (id !== 'xlsx:formulas' || bundle === 'full-min') && !exclude.includes(id));
}

/**
 * The warning the export logs for missing tokens.
 */
function exportWarning(tokens: string[]): string {
  return `The xlsx export skipped features your license does not unlock: ${tokens.join(', ')}.`;
}

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
    test('a tier that leaves export features out writes only the parts it lists', async({
      page, theme, bundle,
    }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);
      // The date assertion below is about a tier without number formats, so the tier is picked by that
      // feature and nothing is assumed about what else it leaves out.
      const tier = requiredTierWithout('xlsx:number_formats');
      const missing = featuresMissingFrom(tier, EXPORT_FEATURE_TOKENS);

      await lic.goto();
      await lic.create(keyWithTier([tier]));

      const features = await exportedFeatures(lic);

      expect(features).toEqual(Object.fromEntries(EXPORT_FEATURE_TOKENS.map(id => [
        id,
        // The umd bundle has no HyperFormula, so its grid holds no formula on any key.
        !missing.includes(id) && (id !== 'xlsx:formulas' || bundle === 'full-min'),
      ])));

      const workbook = await lic.exportWorkbook(EXPORT_OPTIONS);
      const sheet = workbook.worksheets[0];

      // Values still go out: a date as the text the grid shows (a serial means nothing without its
      // number format), the dropdown cell as its text.
      expect(sheet.getCell('A2').value).toBe('Ana García');
      expect(sheet.getCell('C2').type).toBe(ExcelJS.ValueType.String);
      expect(sheet.getCell('C2').value).toBe('01/15/2024');
      expect(sheet.getCell('D2').value).toBe('Open');

      if (bundle === 'full-min' && !missing.includes('xlsx:formulas')) {
        expect(sheet.getCell('B6').formula).toBe('B2+B3');
      }

      expect(await licenseWarnings(lic)).toEqual(Array(2).fill(exportWarning(exportWarnedTokens(tier, bundle))));
    });

    // Compared on the built-in engine only, whose output carries nothing but the content.
    if (engine === 'native') {
      test('a tier that lists every xlsx feature writes the same sheet as an invalid key', async({ page, theme, bundle }) => {
        const lic = new XlsxLicensePage(page, theme, bundle, engine);
        const tier = requiredTierWithEvery(ALL_XLSX_TOKENS);

        await lic.goto();
        await lic.create(keyWithTier([tier]));

        const full = lic.sheetXml(await lic.exportBytes(EXPORT_OPTIONS));

        expect(await licenseWarnings(lic)).toEqual([]);

        await lic.create(INVALID_KEY);

        expect(lic.sheetXml(await lic.exportBytes(EXPORT_OPTIONS))).toBe(full);
      });
    }

    // Every tier that leaves an export feature out, once: tiers that lack the same features are one
    // case, and each is expected to drop exactly the parts of every token it lacks.
    test('each tier that leaves export features out removes exactly the parts it leaves out', async({
      page, theme, bundle,
    }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);
      const tiers = tiersLeavingOut(EXPORT_FEATURE_TOKENS);

      expect(tiers.length).toBeGreaterThan(0);

      await lic.goto();
      // A key that names no tier writes every part.
      await lic.create(CORE_ONLY_KEY);

      const full = await exportedFeatures(lic);

      expect(Object.entries(full).filter(([, present]) => !present).map(([id]) => id))
        .toEqual(bundle === 'full-min' ? [] : ['xlsx:formulas']);

      for (const tier of tiers) {
        const missing = featuresMissingFrom(tier, EXPORT_FEATURE_TOKENS);
        // The umd bundle has no HyperFormula, so its grid holds no formula for the export to drop.
        const warned = exportWarnedTokens(tier, bundle);

        await lic.create(keyWithTier([tier]));

        expect(await exportedFeatures(lic), tier)
          .toEqual({ ...full, ...Object.fromEntries(missing.map(id => [id, false])) });
        expect(await licenseWarnings(lic), tier).toEqual(warned.length > 0 ? [exportWarning(warned)] : []);
      }
    });

    test('a password writes a SHA-512 sheet protection with a fresh salt', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(CORE_ONLY_KEY);

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
      await lic.create(CORE_ONLY_KEY);

      const workbook = await lic.exportWorkbook({ protection: null });

      expect(lic.sheetXml(await lic.exportBytes({ protection: null }))).not.toContain('<sheetProtection');
      expect(workbook.worksheets[0].getCell('A1').protection?.locked).not.toBe(true);
    });

    test('a non-string password rejects the export without naming the value', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();
      await lic.create(CORE_ONLY_KEY);

      const error = await lic.exportBytes({ protection: { password: 1234 } }).then(() => null, (e: Error) => e);

      expect(error?.message).toContain('ExportFile: the "protection.password" option has to be a string.');
      // The message also carries the throw site's stack frames, and a line number in the bundle can hold
      // those digits (`handsontable.js:111234:46`). Only the first line is the library's own text.
      expect(error?.message.split('\n')[0]).not.toContain('1234');
    });

    test('a tier without xlsx:protection writes no sheetProtection despite the option, and the warning has no password', async({
      page, theme, bundle,
    }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);
      const tier = requiredTierWithout('xlsx:protection');

      await lic.goto();
      await lic.create(keyWithTier([tier]));

      const xml = lic.sheetXml(await lic.exportBytes(PASSWORD_OPTIONS));
      const warnings = await lic.warnings();

      expect(xml).not.toContain('<sheetProtection');
      // No `conditionalFormatting` option here, so the warning leaves out its token.
      expect(await licenseWarnings(lic)).toEqual([
        exportWarning(exportWarnedTokens(tier, bundle, ['xlsx:conditional_formatting'])),
      ]);
      expect(warnings.some(message => message.includes(PASSWORD))).toBe(false);
    });

    test('a password-protected file imports its locked cells as read-only and reports sheetProtection:password',
      async({ page, theme, bundle }) => {
        const lic = new XlsxLicensePage(page, theme, bundle, engine);

        await lic.goto();
        await lic.create(CORE_ONLY_KEY);

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
      const tier = requiredTierWithout('xlsx:number_formats');
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

      // The tier must list xlsx:formulas, or the formula would be missing for the wrong reason.
      expect(featuresMissingFrom(tier, ['xlsx:formulas'])).toEqual([]);

      await lic.goto();

      // This tier unlocks xlsx:formulas but not xlsx:number_formats.
      await lic.create(keyWithTier([tier]), dateFormula);

      const gated = (await lic.exportWorkbook({ exportFormulas: true })).worksheets[0].getCell('C2');

      // The export writes what the grid shows in that cell.
      const shown = (await page.getByTestId('source-1-2').textContent())?.trim();

      expect(gated.formula).toBeUndefined();
      expect(gated.type).toBe(ExcelJS.ValueType.String);
      expect(gated.value).toBe(shown);

      if (bundle === 'full-min') {
        expect(shown).toBe('02/14/2024');
      }

      await lic.create(CORE_ONLY_KEY, dateFormula);

      const full = (await lic.exportWorkbook({ exportFormulas: true })).worksheets[0].getCell('C2');

      // With a key that names no tier the source formula goes out live, formatted as a date.
      expect(full.formula).toBe('C1+30');
      expect(full.numFmt).toMatch(/yy/);
    });

    test('no-console-warns silences the warning but not the gate', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);
      const tier = requiredTierWithout(PARTIAL_TIER_LACKS);
      const missing = featuresMissingFrom(tier, EXPORT_FEATURE_TOKENS);

      await lic.goto();
      await lic.create(keyWithTier([tier], ['no-console-warns']));

      const features = await exportedFeatures(lic);

      expect(features['xlsx:styles']).toBe(false);
      expect(features['xlsx:comments']).toBe(!missing.includes('xlsx:comments'));
      expect(features['xlsx:layout']).toBe(!missing.includes('xlsx:layout'));
      expect(await licenseWarnings(lic)).toEqual([]);
    });
  });
}
