import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { XlsxLicensePage } from '../fixtures/pages/XlsxLicensePage';
import {
  ALL_XLSX_TOKENS, CORE_ONLY_KEY, keyWithTier, keyWithoutTier, INVALID_KEY,
} from '../fixtures/xlsxLicenseKeys';
import { requiredTierWithEvery } from '../fixtures/licenseTiers';

/**
 * An arbitrary subset of the xlsx tokens. It is not a product package: which tokens a product grants
 * is decided where keys are issued, never here.
 */
const PARTIAL_TOKENS = ['xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout'];

/**
 * The xlsx license fixture's own proof. The keys come from `fixtures/xlsxLicenseKeys.ts`, which
 * builds them at load time with the core package's test-only `buildTestKey()` (Playwright's loader
 * follows its TypeScript import chain, so no generated JSON key file is needed).
 *
 * Only a `tier:<name>` token restricts a key. A `handsontable` product entry that names no tier is
 * unrestricted for the whole family, whatever tokens it lists, so a current core-only key, and a key
 * listing only some xlsx tokens and no tier, must write the very same sheet as an invalid key, which
 * restricts nothing either, and say nothing on the console. So must a key naming a tier that lists
 * every xlsx feature, read from the build's manifest.
 */
test.describe('xlsx license fixture', { tag: BUNDLES_TAG }, () => {
  test('a core-only key exports the same sheet as an invalid key', async({ page, theme, bundle }) => {
    const lic = new XlsxLicensePage(page, theme, bundle);

    await lic.goto();
    await lic.create(INVALID_KEY);

    const invalidKeySheet = lic.sheetXml(await lic.exportBytes());

    await lic.create(CORE_ONLY_KEY);

    expect(lic.sheetXml(await lic.exportBytes())).toBe(invalidKeySheet);
    expect(await lic.warnings()).toEqual([]);
  });

  test('a key naming a tier that lists every xlsx feature exports the same sheet as an invalid key', async({
    page, theme, bundle,
  }) => {
    const lic = new XlsxLicensePage(page, theme, bundle);
    const tier = requiredTierWithEvery(ALL_XLSX_TOKENS);

    await lic.goto();
    await lic.create(INVALID_KEY);

    const invalidKeySheet = lic.sheetXml(await lic.exportBytes());

    await lic.create(keyWithTier([tier]));

    expect(lic.sheetXml(await lic.exportBytes())).toBe(invalidKeySheet);
    expect(await lic.warnings()).toEqual([]);
  });

  test('a key listing some xlsx tokens and no tier exports and imports everything', async({
    page, theme, bundle,
  }) => {
    const lic = new XlsxLicensePage(page, theme, bundle);
    // Every part a token gates, asked for, so a gate that fired would change the sheet.
    const exportOptions = {
      colHeaders: true,
      exportHiddenColumns: 'hide',
      exportFormulas: true,
      conditionalFormatting: [
        { cols: [1, 1], rules: [{ type: 'cellIs', operator: 'greaterThan', formulae: ['1000'], style: {} }] },
      ],
    };
    const importOptions = { colHeaders: 'firstRow', importStyles: true };

    await lic.goto();
    await lic.create(INVALID_KEY);

    const invalidKeyBytes = await lic.exportBytes(exportOptions);
    const invalidKeyImport = await lic.importBytes(invalidKeyBytes, importOptions);

    // The invalid key's result carries the parts the unlisted tokens gate: proven before the no-tier key is compared with it.
    expect(invalidKeyImport.styles).toBeDefined();
    expect(invalidKeyImport.comments).toBeDefined();

    await lic.create(keyWithoutTier(PARTIAL_TOKENS));

    const bytes = await lic.exportBytes(exportOptions);

    expect(lic.sheetXml(bytes)).toBe(lic.sheetXml(invalidKeyBytes));
    expect(await lic.importBytes(invalidKeyBytes, importOptions)).toEqual(invalidKeyImport);
    expect((await lic.warnings()).filter(message => message.includes('your license does not unlock'))).toEqual([]);
  });
});
