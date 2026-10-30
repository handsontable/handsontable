import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { XlsxLicensePage } from '../fixtures/pages/XlsxLicensePage';
import { LEGACY_KEY, CORE_ONLY_KEY } from '../fixtures/xlsxLicenseKeys';

/**
 * The xlsx license fixture's own proof. The keys come from `fixtures/xlsxLicenseKeys.ts`, which
 * builds them at load time with the core package's test-only `buildTestKey()` (Playwright's loader
 * follows its TypeScript import chain, so no generated JSON key file is needed).
 *
 * A `handsontable` product entry with no `xlsx:` token is unrestricted for the whole family, so a
 * current core-only key must write the very same sheet as the legacy evaluation key, and say nothing
 * on the console.
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
});
