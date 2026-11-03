import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { XlsxLicensePage } from '../fixtures/pages/XlsxLicensePage';
import {
  CORE_ONLY_KEY, keyWithAll, keyWithoutFlag, LEGACY_KEY,
} from '../fixtures/xlsxLicenseKeys';

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
 * A `handsontable` product entry without the `listed-capabilities` flag is unrestricted for the
 * whole family, whatever tokens it lists, so a current core-only key, and a key listing only some
 * xlsx tokens without the flag, must write the very same sheet as the legacy evaluation key, and
 * say nothing on the console.
 */
test.describe('xlsx license fixture', { tag: BUNDLES_TAG }, () => {
  test('a core-only key exports the same sheet as the legacy key', async({ page, theme, bundle }) => {
    const lic = new XlsxLicensePage(page, theme, bundle);

    await lic.goto();
    await lic.create(LEGACY_KEY);

    const legacy = lic.sheetXml(await lic.exportBytes());

    await lic.create(CORE_ONLY_KEY);

    expect(lic.sheetXml(await lic.exportBytes())).toBe(legacy);
    expect(await lic.warnings()).toEqual([]);
  });

  test('a flagged key listing xlsx:all exports the same sheet as the legacy key', async({ page, theme, bundle }) => {
    const lic = new XlsxLicensePage(page, theme, bundle);

    await lic.goto();
    await lic.create(LEGACY_KEY);

    const legacy = lic.sheetXml(await lic.exportBytes());

    await lic.create(keyWithAll());

    expect(lic.sheetXml(await lic.exportBytes())).toBe(legacy);
    expect(await lic.warnings()).toEqual([]);
  });

  test('a key listing some xlsx tokens without the listed-capabilities flag exports and imports everything', async({
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
    await lic.create(LEGACY_KEY);

    const legacyBytes = await lic.exportBytes(exportOptions);
    const legacyImport = await lic.importBytes(legacyBytes, importOptions);

    // The legacy result carries the parts the unlisted tokens gate: proven before the unflagged key is compared with it.
    expect(legacyImport.styles).toBeDefined();
    expect(legacyImport.comments).toBeDefined();

    await lic.create(keyWithoutFlag(PARTIAL_TOKENS));

    const bytes = await lic.exportBytes(exportOptions);

    expect(lic.sheetXml(bytes)).toBe(lic.sheetXml(legacyBytes));
    expect(await lic.importBytes(legacyBytes, importOptions)).toEqual(legacyImport);
    expect((await lic.warnings()).filter(message => message.includes('your license does not unlock'))).toEqual([]);
  });
});
