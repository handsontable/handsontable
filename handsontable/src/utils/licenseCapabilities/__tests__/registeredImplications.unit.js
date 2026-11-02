import { registerPlugin, Filters, HiddenRows } from 'handsontable/plugins';
import { hasLicenseCapability } from 'handsontable/utils/licenseCapabilities';
import { registerAsRootInstance } from 'handsontable/utils/rootInstance';
import { FLAGGED_FILTERS_KEY } from '../../entitlementLicenseKey/__tests__/fixtures';

/**
 * The requirements a key grants come from the plugin classes registered on the page, not from a table
 * of every plugin. This file registers the plugins itself, so it controls which are registered when.
 */
describe('license capabilities implied through registered plugins', () => {
  it('should grant a requirement only once the plugin that requires it is registered', () => {
    const hot = { getSettings: () => ({ licenseKey: FLAGGED_FILTERS_KEY }) };

    registerAsRootInstance(hot);
    registerPlugin(HiddenRows);

    // The key lists `feat:filters` only. Filters is not registered, so nothing brings `feat:hidden_rows`.
    expect(hasLicenseCapability(hot, 'feat:hidden_rows')).toBe(false);

    registerPlugin(Filters);

    // The result for this key was cached before Filters was registered; the cache follows the registry.
    expect(hasLicenseCapability(hot, 'feat:hidden_rows')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:dropdown_menu')).toBe(true);
  });
});
