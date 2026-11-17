import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { XlsxLicensePage } from '../fixtures/pages/XlsxLicensePage';
import {
  ALL_XLSX_TOKENS, CORE_ONLY_KEY, keyWithTier, INVALID_KEY,
} from '../fixtures/xlsxLicenseKeys';
import {
  featuresMissingFrom, requiredTierWithEvery, requiredTierWithout, tiersLeavingOut,
} from '../fixtures/licenseTiers';

/**
 * The keys name the build's real tiers, read from `dist/manifest.json` when a test runs, so no test
 * assumes which features a tier holds. A test that needs a feature off takes the first tier that leaves
 * it out, and fails when every tier lists it.
 *
 * A feature every real tier lists cannot be switched off by a real key, so those cases live in the unit
 * suite, which builds keys with made-up tiers: the import refused without xlsx:import
 * (`handsontable/src/plugins/importFile/__tests__/importFile.unit.js`), and the parts and license entries
 * without xlsx:formulas or xlsx:layout (`handsontable/src/plugins/importFile/__tests__/importLicenseGates.unit.js`).
 */
test.describe('xlsx import license gate', { tag: BUNDLES_TAG }, () => {
  for (const [name, key] of [
    // Every tier that lists the import lists the export too, or the test exports nothing to import.
    ['a key naming a tier that lists xlsx:import', () => keyWithTier([requiredTierWithEvery(['xlsx:import', 'xlsx:export'])])],
    ['a key with no xlsx token', () => CORE_ONLY_KEY],
    ['an invalid key, which restricts nothing', () => INVALID_KEY],
  ] as const) {
    test(`imports with ${name}`, async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle);

      await lic.goto();
      await lic.create(key());

      const result = await lic.importBytes(await lic.exportBytes());

      expect(result.data).toBeTruthy();
    });
  }
});

/**
 * The feature a partial tier must leave out: the first tier without it is the one the partial tests
 * read. Styles are named because a test below is about them; which tier leaves them out, and what else
 * it leaves out, is the manifest's.
 */
const PARTIAL_TIER_LACKS = 'xlsx:styles';

/**
 * Of the tokens a tier lacks, the ones the import gates, which its warning names, in declaration order:
 * `xlsx:number_formats` restricts the export only.
 */
function importMissingTokens(tier: string): string[] {
  return featuresMissingFrom(tier, ALL_XLSX_TOKENS).filter(id => id !== 'xlsx:number_formats');
}

/**
 * Of the import tokens a tier lacks, the ones the fixture's workbook carries a part of, which the
 * import's `license:` entries name: the umd bundle's export holds no formula.
 */
function importDroppedTokens(tier: string, bundle: string): string[] {
  return importMissingTokens(tier).filter(id => id !== 'xlsx:formulas' || bundle === 'full-min');
}

/**
 * The tokens that gate a part of an import, every one but the two entry tokens.
 */
const IMPORT_FEATURE_TOKENS = ALL_XLSX_TOKENS.filter(id => id !== 'xlsx:import' && id !== 'xlsx:export');

/**
 * What the workbook is exported with: the header row, the hidden Region column written hidden,
 * live formulas, and a conditional formatting rule over the Amount column.
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
 * What the workbook is imported with: the header row promoted, and styles asked for, so the
 * license is the only thing that decides what lands.
 */
const IMPORT_OPTIONS = { colHeaders: 'firstRow', importStyles: true };


const LICENSE_WARNING_PREFIX = 'The xlsx import skipped features your license does not unlock: ';

type ImportResult = Record<string, any>;

/**
 * Every meta object of a result: the column-wide ones and the per-cell ones.
 */
function allMeta(result: ImportResult): Record<string, unknown>[] {
  return [
    ...(result.columns ?? []),
    ...(result.cellsMeta ?? []).map((entry: { meta: Record<string, unknown> }) => entry.meta),
  ];
}

/**
 * Reports, per token, whether the part it unlocks reached the import result. `xlsx:formulas` is
 * read on the full bundle only, the one whose target can hold a live formula. `xlsx:number_formats`
 * reports the dated column typed as a date, which no key may take away.
 */
function importedFeatures(result: ImportResult, bundle: string): Record<string, boolean> {
  const features: Record<string, boolean> = {
    'xlsx:layout': result.mergeCells !== undefined && result.hiddenColumns !== undefined
      && result.colWidths !== undefined,
    'xlsx:number_formats': result.columns?.[2]?.type === 'date',
    'xlsx:comments': result.comments !== undefined,
    'xlsx:styles': result.styles !== undefined,
    'xlsx:conditional_formatting': result.conditionalFormatting !== undefined,
    'xlsx:data_validation': allMeta(result).some(meta => meta.type === 'dropdown'),
    'xlsx:protection': allMeta(result).some(meta => meta.readOnly === true),
  };

  if (bundle === 'full-min') {
    features['xlsx:formulas'] = result.data.flat().some((value: unknown) => value === '=B1+B2');
  }

  return features;
}

/**
 * Imports `bytes` under the current key and reports the parts that reached the result, plus the
 * result itself.
 */
async function importAndMeasure(
  lic: XlsxLicensePage, bytes: Buffer, bundle: string,
): Promise<{ result: ImportResult; features: Record<string, boolean> }> {
  const result = await lic.importBytes(bytes, IMPORT_OPTIONS);

  return { result, features: importedFeatures(result, bundle) };
}

/**
 * Exports the fixture's source grid under an invalid key, which restricts nothing, so the file carries every part, and
 * returns its bytes.
 */
async function fullWorkbook(lic: XlsxLicensePage): Promise<Buffer> {
  await lic.create(INVALID_KEY);

  return lic.exportBytes(EXPORT_OPTIONS);
}

for (const engine of ['native', 'exceljs'] as const) {
  test.describe(`xlsx import license feature gates (${engine})`, { tag: BUNDLES_TAG }, () => {
    test('a tier that leaves import features out imports only the parts it lists', async({
      page, theme, bundle,
    }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);
      const tier = requiredTierWithout(PARTIAL_TIER_LACKS);
      const missing = importMissingTokens(tier);

      await lic.goto();

      const bytes = await fullWorkbook(lic);

      await lic.create(INVALID_KEY);

      const { result: full, features: fullFeatures } = await importAndMeasure(lic, bytes, bundle);

      // Every part is in the file: proven before the partial key is asserted to drop it.
      expect(Object.values(fullFeatures).every(Boolean)).toBe(true);

      await lic.create(keyWithTier([tier]));

      const { result: partial, features } = await importAndMeasure(lic, bytes, bundle);

      expect(partial.data.length).toBe(full.data.length);
      // A missing `xlsx:number_formats` never restricts the import, so the dated column keeps its type.
      expect(features['xlsx:number_formats']).toBe(true);

      for (const token of Object.keys(features).filter(id => id !== 'xlsx:number_formats')) {
        expect(features[token], token).toBe(!missing.includes(token));
      }

      // The report is always on. This workbook is the grid's own export, so the invalid key drops
      // nothing, and the partial tier reports exactly the `license:` entry of each import token it
      // lacks, in declaration order – never `xlsx:number_formats`, which restricts the export only.
      // (The unit suite pins a lossy file, whose file-driven entries come first.)
      expect(full.dropped).toEqual([]);
      expect(partial.dropped).toEqual(importDroppedTokens(tier, bundle).map(id => `license:${id}`));

      const warnings = await lic.warnings();

      expect(warnings.filter(message => message.startsWith(LICENSE_WARNING_PREFIX)))
        .toEqual([`${LICENSE_WARNING_PREFIX}${missing.join(', ')}.`]);
      // The engine's own warning never repeats the license entries.
      expect(warnings.filter(message => message.includes('xlsx engine dropped features') && message.includes('license:')))
        .toEqual([]);
    });

    // Every tier that leaves an import feature out, once: tiers that lack the same features are one
    // case, and each is expected to drop exactly the parts of every token it lacks.
    test('each tier that leaves import features out removes exactly the parts it leaves out', async({
      page, theme, bundle,
    }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);
      const tiers = tiersLeavingOut(IMPORT_FEATURE_TOKENS);

      expect(tiers.length).toBeGreaterThan(0);

      await lic.goto();

      const bytes = await fullWorkbook(lic);

      for (const tier of tiers) {
        const missing = featuresMissingFrom(tier, IMPORT_FEATURE_TOKENS);

        await lic.create(keyWithTier([tier]));

        const { result, features } = await importAndMeasure(lic, bytes, bundle);
        const expected = Object.fromEntries(Object.keys(features).map(id => [
          id,
          // A missing `xlsx:number_formats` never restricts the import.
          !missing.includes(id) || id === 'xlsx:number_formats',
        ]));

        expect(features, tier).toEqual(expected);
        // The import names only its own tokens, so a missing export-only token leaves no entry, and
        // only a feature the file carries: the umd bundle has no HyperFormula, so its export holds
        // no formula.
        expect(result.dropped.filter((name: string) => name.startsWith('license:')), tier)
          .toEqual(importDroppedTokens(tier, bundle).map(id => `license:${id}`));
      }
    });

    test('a tier that lists every xlsx feature imports the same result as an invalid key', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);
      const tier = requiredTierWithEvery(ALL_XLSX_TOKENS);

      await lic.goto();

      const bytes = await fullWorkbook(lic);

      await lic.create(INVALID_KEY);

      const invalidKeyResult = await lic.importBytes(bytes, IMPORT_OPTIONS);

      await lic.create(keyWithTier([tier]));

      const full = await lic.importBytes(bytes, IMPORT_OPTIONS);

      expect(full).toEqual(invalidKeyResult);
      expect((await lic.warnings()).filter(message => message.startsWith(LICENSE_WARNING_PREFIX))).toEqual([]);
    });

    test('importStyles: true on a tier without xlsx:styles yields no styles and a license entry', async({
      page, theme, bundle,
    }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);
      const tier = requiredTierWithout('xlsx:styles');

      await lic.goto();

      const bytes = await fullWorkbook(lic);

      await lic.create(INVALID_KEY);
      expect((await lic.importBytes(bytes, IMPORT_OPTIONS)).styles).toBeDefined();

      await lic.create(keyWithTier([tier]));

      const result = await lic.importBytes(bytes, IMPORT_OPTIONS);

      expect(result.styles).toBeUndefined();
      expect(result.customBorders).toBeUndefined();
      expect(allMeta(result).some(meta => meta.className !== undefined)).toBe(false);
      expect(result.dropped).toContain('license:xlsx:styles');
      expect(result.dropped).not.toContain('cellStyles');
    });
  });
}
