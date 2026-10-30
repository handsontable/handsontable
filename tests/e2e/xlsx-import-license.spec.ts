import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { XlsxLicensePage } from '../fixtures/pages/XlsxLicensePage';
import { keyWith, CORE_ONLY_KEY, LEGACY_KEY } from '../fixtures/xlsxLicenseKeys';

test.describe('xlsx import license gate', { tag: BUNDLES_TAG }, () => {
  test('rejects the import without xlsx:import', async({ page, theme, bundle }) => {
    const lic = new XlsxLicensePage(page, theme, bundle);

    await lic.goto();
    await lic.create(keyWith(['xlsx:export']));

    const bytes = await lic.exportBytes();

    await expect(lic.importBytes(bytes)).rejects.toThrow('does not unlock "xlsx:import"');
  });

  for (const [name, key] of [
    ['a key with xlsx:import', keyWith(['xlsx:import', 'xlsx:export'])],
    ['a key with no xlsx token', CORE_ONLY_KEY],
    ['the legacy key', LEGACY_KEY],
  ] as const) {
    test(`imports with ${name}`, async({ page, theme, bundle }) => {
      const lic = new XlsxLicensePage(page, theme, bundle);

      await lic.goto();
      await lic.create(key);

      const result = await lic.importBytes(await lic.exportBytes());

      expect(result.data).toBeTruthy();
    });
  }
});
