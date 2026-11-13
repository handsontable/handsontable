import { test, expect, THEMES_TAG, BUNDLES_TAG } from '../fixtures/test';
import { LicenseCapabilitiesPage } from '../fixtures/pages/LicenseCapabilitiesPage';

const FILTERS_MESSAGE = 'The license key for Handsontable does not include these features: Filters ' +
  '(feat:filters). They are turned off. To add them, contact sales@handsontable.com.';
// The bar can reach the end user, so it names the features without their tokens.
const FILTERS_BAR_MESSAGE = 'The license key for Handsontable does not include these features: Filters. ' +
  'They are turned off. To add them, contact sales@handsontable.com.';

/**
 * A license key whose Handsontable entry names a tier (`tier:<name>`) unlocks the plugins whose
 * `LICENSE.tiers` list that tier, and nothing else: a plugin's requirements come only from the tier
 * listing them too. A plugin it leaves out stays off, and one console error and the license bar say
 * so. A key that names no tier unlocks every feature, as before. The tiers are made up and the fixture
 * gives them their features, so no real tier decides what a test unlocks.
 */
test.describe('license keys that name tiers', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  let license: LicenseCapabilitiesPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    license = new LicenseCapabilitiesPage(page, theme, bundle);
  });

  test('keeps Filters off when the key\'s tier does not list it, and says so once', async() => {
    await license.goto({ key: 'tier-base', plugins: 'filters' });

    expect(await license.isPluginEnabled('filters')).toBe(false);
    // Filters would have turned the column menu on; nothing turned it on.
    await expect(license.columnMenuButtons).toHaveCount(0);
    // The setting is the user's, and stays as written.
    expect(await license.filtersSetting()).toBe(true);
    expect(license.licenseErrors()).toEqual([FILTERS_MESSAGE]);
    await expect(license.missingFeatures).toHaveText(FILTERS_BAR_MESSAGE);
    await expect(license.bar).toHaveCount(1);
  });

  test('names every missing feature in one console error and one bar line, the header checkbox included',
    async() => {
      // CheckboxHeader checks its columns in its ready step, after the plugins the key keeps off are known.
      await license.goto({ key: 'tier-minimal', plugins: 'header-checkbox' });

      await expect(license.grid.locator('.htCheckboxHeaderInput')).toHaveCount(0);
      await expect(license.missingFeatures).toHaveCount(1);
      await expect(license.missingFeatures).toContainText('Checkbox header');
      await expect(license.missingFeatures).toContainText('Copy and paste');
      // Console messages reach the test in order, so once the one naming the header checkbox is here, an earlier
      // message without it would be here too.
      await expect.poll(() => license.licenseErrors().some(text => text.includes('feat:checkbox_header'))).toBe(true);
      expect(license.licenseErrors()).toHaveLength(1);
      expect(license.licenseErrors()[0]).toContain('Copy and paste (feat:copy_paste)');
    });

  test('keeps the declared height with the missing-features bar, as soon as the constructor returns',
    async() => {
      await license.goto({ key: 'tier-minimal', plugins: 'header-checkbox' });

      const size = await license.sizeAtConstruction();

      expect(size.barMounted).toBe(true);
      expect(size.outerHeight).toBe(200);
    });

  test('shows no Filters items in a column menu the key\'s tier does list', async() => {
    await license.goto({ key: 'tier-column-menu', plugins: 'column-menu' });

    expect(await license.isPluginEnabled('dropdownMenu')).toBe(true);
    expect(await license.isPluginEnabled('filters')).toBe(false);

    await license.openFirstColumnMenu();

    await expect(license.openColumnMenu).not.toContainText('Filter by');
    await expect(license.valueList).toHaveCount(0);
    expect(license.licenseErrors()).toEqual([FILTERS_MESSAGE]);
  });

  test('takes the keyboard to the bar\'s link when the focus leaves the grid', async() => {
    await license.goto({ key: 'tier-base', plugins: 'filters' });

    await license.tabOutOfLastCell();

    await expect(license.salesLink).toBeFocused();
    await expect(license.salesLink).toHaveAttribute('href', 'mailto:sales@handsontable.com');
  });

  test('takes the message away for a key passed later, and brings it back reachable for another', async() => {
    await license.goto({ key: 'tier-base', plugins: 'filters' });

    await license.updateLicenseKey('no-tier');

    await expect(license.bar).toHaveCount(0);
    expect(await license.isPluginEnabled('filters')).toBe(true);

    await license.updateLicenseKey('tier-base');

    expect(await license.isPluginEnabled('filters')).toBe(false);
    await expect(license.missingFeatures).toHaveText(FILTERS_BAR_MESSAGE);

    await license.tabOutOfLastCell();

    await expect(license.salesLink).toBeFocused();
  });

  test('keeps Filters off with no bar when the key silences UI warnings', async() => {
    await license.goto({ key: 'tier-no-ui', plugins: 'filters' });

    expect(await license.isPluginEnabled('filters')).toBe(false);
    await expect(license.bar).toHaveCount(0);
    expect(license.licenseErrors()).toEqual([FILTERS_MESSAGE]);
  });

  test('unlocks every feature for a key that names no tier', async() => {
    await license.goto({ key: 'no-tier', plugins: 'column-menu' });

    expect(await license.isPluginEnabled('filters')).toBe(true);
    await expect(license.columnMenuButtons.first()).toBeVisible();
    await expect(license.missingFeatures).toHaveCount(0);
    expect(license.licenseErrors()).toEqual([]);
  });

  test('leaves the Filters value list, a nested grid, alone', async() => {
    await license.goto({ key: 'tier-filters', plugins: 'column-menu' });

    // The key's tier lists Filters and the column menu.
    expect(await license.isPluginEnabled('filters')).toBe(true);

    await license.openFirstColumnMenu();

    await expect(license.valueList).toContainText('Alpha');
    await expect(license.valueList).toContainText('Gamma');
    expect(license.licenseErrors()).toEqual([]);
  });

  test('keeps every sold plugin off for a tier no feature lists, in one message', async() => {
    await license.goto({ key: 'tier-unknown', plugins: 'filters' });

    expect(await license.isPluginEnabled('filters')).toBe(false);
    // One console error of any kind, and it is the license one.
    expect(license.consoleErrors).toHaveLength(1);
    expect(license.licenseErrors()).toHaveLength(1);
    // The plugin the grid asked for, and plugins that are on by default.
    await expect(license.missingFeatures).toContainText('Filters');
    await expect(license.missingFeatures).toContainText('Copy and paste');
    await expect(license.missingFeatures).toContainText('Undo and redo');
    await expect(license.bar).toHaveCount(1);
  });
});
