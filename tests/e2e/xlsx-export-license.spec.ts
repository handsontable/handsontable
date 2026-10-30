import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { XlsxLicensePage } from '../fixtures/pages/XlsxLicensePage';
import { keyWith, LEGACY_KEY, STANDARD_TOKENS } from '../fixtures/xlsxLicenseKeys';

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
