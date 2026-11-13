import { registerAllModules } from 'handsontable/registry';
import {
  resolveLicenseCapabilities,
  hasLicenseCapability,
} from 'handsontable/utils/licenseCapabilities';
import { registerAsRootInstance } from 'handsontable/utils/rootInstance';
import {
  SUBSCRIPTION_KEY,
  TRIAL_KEY,
  V1_TRIAL_KEY,
  FLAGGED_BASE_KEY,
  FLAGGED_FILTERS_KEY,
  FLAGGED_MINIMAL_KEY,
  FLAGGED_FEAT_ALL_KEY,
  FLAGGED_EXTERNAL_KEY,
  UNFLAGGED_WITH_TOKENS_KEY,
} from '../../entitlementLicenseKey/__tests__/fixtures';

registerAllModules();

/**
 * A stand-in for a grid: the helper reads only the settings and whether the object is a root grid.
 *
 * @param {*} licenseKey The `licenseKey` setting.
 * @param {object} [options] Options.
 * @param {boolean} [options.root=true] Whether to register it as a root grid.
 * @returns {object}
 */
function gridWithKey(licenseKey, { root = true } = {}) {
  const hot = { getSettings: () => ({ licenseKey }) };

  if (root) {
    registerAsRootInstance(hot);
  }

  return hot;
}

describe('resolveLicenseCapabilities()', () => {
  it.each([
    ['a missing key', undefined],
    ['an empty key', ''],
    ['a key that is not a string', 42],
    ['the non-commercial key (invalid since 19.0)', 'non-commercial-and-evaluation'],
    ['an invalid key', 'not-a-license-key'],
    ['a key in the legacy 25-character shape', '11111-22222-33333-44444-55555'],
    ['a tampered entitlement key', `${SUBSCRIPTION_KEY.slice(0, -3)}00]`],
    ['an unflagged subscription key (lists only core)', SUBSCRIPTION_KEY],
    ['an unflagged trial key', TRIAL_KEY],
    ['an unflagged trial key in the first format', V1_TRIAL_KEY],
    ['an unflagged key that lists tokens', UNFLAGGED_WITH_TOKENS_KEY],
  ])('should unlock everything for %s', (_, licenseKey) => {
    const hot = gridWithKey(licenseKey);

    expect(resolveLicenseCapabilities(hot)).toBe('all');
    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:a_token_no_release_has_yet')).toBe(true);
  });

  it('should unlock core and the listed tokens for a flagged key', () => {
    const hot = gridWithKey(FLAGGED_BASE_KEY);
    const capabilities = resolveLicenseCapabilities(hot);

    expect(capabilities).toBeInstanceOf(Set);
    expect(hasLicenseCapability(hot, 'core')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:copy_paste')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:undo_redo')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:export_file')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(false);
    expect(hasLicenseCapability(hot, 'feat:nested_rows')).toBe(false);
  });

  it('should unlock a whole namespace through its "all" token', () => {
    const hot = gridWithKey(FLAGGED_FEAT_ALL_KEY);

    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:nested_rows')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:a_token_no_release_has_yet')).toBe(true);
    expect(hasLicenseCapability(hot, 'cell:dropdown')).toBe(true);
    expect(hasLicenseCapability(hot, 'xlsx:import')).toBe(false);
  });

  it('should grant what a listed plugin requires, through the registered plugin classes', () => {
    const hot = gridWithKey(FLAGGED_FILTERS_KEY);

    // FLAGGED_FILTERS_KEY lists `feat:filters` and none of the plugins Filters requires.
    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:dropdown_menu')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:hidden_rows')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:nested_rows')).toBe(false);
  });

  it('should grant nothing a key does not list or imply', () => {
    const hot = gridWithKey(FLAGGED_MINIMAL_KEY);

    expect(hasLicenseCapability(hot, 'feat:dropdown_menu')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:copy_paste')).toBe(false);
    expect(hasLicenseCapability(hot, 'feat:undo_redo')).toBe(false);
  });

  it('should restrict a key issued for external use too: the silencing flags never grant', () => {
    const hot = gridWithKey(FLAGGED_EXTERNAL_KEY);

    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(false);
  });

  it('should never restrict a nested grid', () => {
    const hot = gridWithKey(FLAGGED_BASE_KEY, { root: false });

    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(true);
  });

  it('should return the same result for the same key', () => {
    expect(resolveLicenseCapabilities(gridWithKey(FLAGGED_BASE_KEY)))
      .toBe(resolveLicenseCapabilities(gridWithKey(FLAGGED_BASE_KEY)));
  });

  it('should read the key from the settings on every call', () => {
    let licenseKey = FLAGGED_BASE_KEY;
    const hot = { getSettings: () => ({ licenseKey }) };

    registerAsRootInstance(hot);

    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(false);

    licenseKey = FLAGGED_FILTERS_KEY;

    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(true);
  });
});
