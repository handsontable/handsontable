import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { XlsxLicensePage } from '../fixtures/pages/XlsxLicensePage';
import {
  ALL_XLSX_TOKENS, CORE_ONLY_KEY, keyWithTier, INVALID_KEY,
} from '../fixtures/xlsxLicenseKeys';
import { requiredTierWithEvery } from '../fixtures/licenseTiers';

/**
 * The keys name the build's real tier, read from `dist/manifest.json` when a test runs. DataGrid has a single
 * tier, `professional`, that unlocks every feature (DEV-4198), so no real key can leave one xlsx feature out. The
 * cases that need a partial tier live in the unit suite, which builds keys with made-up tiers: the import refused
 * without xlsx:import (`handsontable/src/plugins/importFile/__tests__/importFile.unit.js`), and the parts and
 * license entries without xlsx:formulas or xlsx:layout
 * (`handsontable/src/plugins/importFile/__tests__/importLicenseGates.unit.js`).
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

    // DEV-4198: DataGrid has a single tier, `professional`, so no real key can leave one xlsx feature out. A key that
    // names only a tier the build does not list (the removed `standard`) unlocks nothing: the plugin is off, so the import is
    // refused. The partial-tier cases live in the unit suite, which builds keys with made-up tiers.
    test('a key that names only the removed tier "standard" refuses the import', async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle, engine);

      await lic.goto();

      const bytes = await fullWorkbook(lic);

      await lic.create(keyWithTier(['standard']));

      await expect(lic.importBytes(bytes, IMPORT_OPTIONS)).rejects.toThrow('does not include these features: Import from file (feat:import_file)');
    });
  });
}
