import { registerAllModules } from 'handsontable/registry';
import { BasePlugin } from 'handsontable/plugins/base';
import { registerPlugin } from 'handsontable/plugins/registry';
import { _getLicenseState } from 'handsontable/helpers/mixed';
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
import { buildTestKey } from '../../entitlementLicenseKey/__tests__/buildTestKey';
import { keyWithTier } from '../../entitlementLicenseKey/__tests__/xlsxLicenseKeys';

registerAllModules();

/**
 * Builds a stub plugin class whose static `LICENSE` names one tier.
 *
 * @param {string} pluginKey The plugin key.
 * @param {string} capability The plugin's token.
 * @param {string[]} tiers The tiers that include it.
 * @returns {Function}
 */
function createTierStub(pluginKey, capability, tiers) {
  return class TierStub extends BasePlugin {
    static get PLUGIN_KEY() {
      return pluginKey;
    }

    static get LICENSE() {
      return { capability, name: 'Tier stub', gate: 'enable', implies: [], tiers };
    }
  };
}

registerPlugin(createTierStub('tierStub', 'feat:tier_stub', ['alpha']));

/**
 * Registers a second stub plugin, after keys were resolved: token `feat:late_stub`, tier `gamma`.
 */
function registerLateStub() {
  registerPlugin(createTierStub('lateStub', 'feat:late_stub', ['gamma']));
}

/**
 * A key whose Handsontable entry lists no tier and has no flag, while the HyperFormula entry lists
 * `tier:alpha`.
 *
 * @type {string}
 */
const FOREIGN_TIER_KEY = buildTestKey({
  products: {
    handsontable: {
      capabilities: ['core'],
      usage_until: '2027-08-12',
      notice: 60,
      grace: 90,
      flags: [],
    },
    hyperformula: {
      capabilities: ['tier:alpha'],
      usage_until: '2027-08-12',
      notice: 60,
      grace: 90,
      flags: [],
    },
  },
});

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

describe('a key that names a tier', () => {
  it('should restrict without the listed-capabilities flag', () => {
    const hot = gridWithKey(keyWithTier(['alpha']));

    expect(resolveLicenseCapabilities(hot)).toBeInstanceOf(Set);
    expect(hasLicenseCapability(hot, 'feat:a_feature_no_release_has_yet')).toBe(false);
  });

  it('should unlock the plugins whose tiers list it', () => {
    expect(hasLicenseCapability(gridWithKey(keyWithTier(['alpha'])), 'feat:tier_stub')).toBe(true);
  });

  it('should keep a plugin off when its tiers do not list the key\'s tier', () => {
    expect(hasLicenseCapability(gridWithKey(keyWithTier(['beta'])), 'feat:tier_stub')).toBe(false);
  });

  it('should unlock the features of every tier the key names', () => {
    expect(hasLicenseCapability(gridWithKey(keyWithTier(['beta', 'alpha'])), 'feat:tier_stub')).toBe(true);
  });

  it('should unlock no feature for a tier no feature lists', () => {
    const hot = gridWithKey(keyWithTier(['zz_unknown']));

    expect(hasLicenseCapability(hot, 'feat:tier_stub')).toBe(false);
    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(false);
  });

  it.each(['__proto__', 'constructor'])('should unlock no feature for the tier %s', (tier) => {
    const hot = gridWithKey(keyWithTier([tier]));

    expect(() => hasLicenseCapability(hot, 'feat:tier_stub')).not.toThrow();
    expect(hasLicenseCapability(hot, 'feat:tier_stub')).toBe(false);
  });

  it('should unlock everything for a tier token with no name: it names no tier', () => {
    expect(resolveLicenseCapabilities(gridWithKey(keyWithTier([''])))).toBe('all');
  });

  it('should ignore a tier token in another product\'s entry', () => {
    expect(resolveLicenseCapabilities(gridWithKey(FOREIGN_TIER_KEY))).toBe('all');
  });

  it('should expose the tiers of a key on its license state', () => {
    expect(_getLicenseState(keyWithTier(['alpha', 'beta'])).tiers).toEqual(['alpha', 'beta']);
    expect(_getLicenseState(SUBSCRIPTION_KEY).tiers).toBe(null);
    expect(_getLicenseState('11111-22222-33333-44444-55555').tiers).toBe(null);
  });

  it('should grant a plugin registered after the key was first resolved', () => {
    const key = keyWithTier(['gamma']);

    expect(hasLicenseCapability(gridWithKey(key), 'feat:late_stub')).toBe(false);
    registerLateStub();
    expect(hasLicenseCapability(gridWithKey(key), 'feat:late_stub')).toBe(true);
  });
});
