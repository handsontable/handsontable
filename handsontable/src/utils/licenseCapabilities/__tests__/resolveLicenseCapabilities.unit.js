import { registerAllModules } from 'handsontable/registry';
import { BasePlugin } from 'handsontable/plugins/base';
import { registerPlugin } from 'handsontable/plugins/registry';
import * as mixed from 'handsontable/helpers/mixed';
import { _getLicenseState } from 'handsontable/helpers/mixed';
import {
  resolveLicenseCapabilities,
  hasLicenseCapability,
} from 'handsontable/utils/licenseCapabilities';
import { registerAsRootInstance } from 'handsontable/utils/rootInstance';
import { resolveXlsxEntitlement } from 'handsontable/utils/xlsxEngine/xlsxEntitlement';
import {
  SUBSCRIPTION_KEY,
  TRIAL_KEY,
  V1_TRIAL_KEY,
  FLAGGED_BASE_KEY,
  FLAGGED_FEAT_ALL_KEY,
  UNFLAGGED_WITH_TOKENS_KEY,
} from '../../entitlementLicenseKey/__tests__/fixtures';
import { buildTestKey } from '../../entitlementLicenseKey/__tests__/buildTestKey';
import { keyWithTier } from '../../entitlementLicenseKey/__tests__/xlsxLicenseKeys';
import { resetTierKeys, tierKeyWith } from '../../entitlementLicenseKey/__tests__/tierKeys';

registerAllModules();

/**
 * The base package: the nine plugins that are on by default.
 *
 * @type {string[]}
 */
const BASE_FEATURES = [
  'feat:auto_column_size',
  'feat:autofill',
  'feat:checkbox_header',
  'feat:copy_paste',
  'feat:drag_to_scroll',
  'feat:export_file',
  'feat:import_file',
  'feat:undo_redo',
  'feat:view_state',
];

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
      return { capability, name: 'Tier stub', gate: 'enable', tiers };
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
 * A key that names a tier no feature lists, and beside it feature ids, the `<namespace>:all` tokens and
 * the retired `listed-capabilities` flag. Only the tier counts, so it unlocks nothing.
 *
 * @type {string}
 */
const TIER_AND_IDS_KEY = buildTestKey({
  products: {
    handsontable: {
      capabilities: ['core', 'tier:zz_unknown', 'feat:filters', 'feat:all', 'xlsx:all'],
      release_until: '2099-12-31',
      notice: 60,
      grace: 90,
      flags: ['listed-capabilities'],
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
  afterEach(() => {
    resetTierKeys();
  });

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
    ['a key with the retired listed-capabilities flag and no tier', FLAGGED_BASE_KEY],
    ['a flagged key that lists the feat:all and cell:all tokens and no tier', FLAGGED_FEAT_ALL_KEY],
    ['a key that lists feature ids and no tier', UNFLAGGED_WITH_TOKENS_KEY],
  ])('should unlock everything for %s', (_, licenseKey) => {
    const hot = gridWithKey(licenseKey);

    expect(resolveLicenseCapabilities(hot)).toBe('all');
    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:a_token_no_release_has_yet')).toBe(true);
  });

  it('should unlock the plugins of the tier a key names', () => {
    const hot = gridWithKey(tierKeyWith(BASE_FEATURES));
    const capabilities = resolveLicenseCapabilities(hot);

    expect(capabilities).toBeInstanceOf(Set);
    expect(hasLicenseCapability(hot, 'feat:copy_paste')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:undo_redo')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:export_file')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(false);
    expect(hasLicenseCapability(hot, 'feat:nested_rows')).toBe(false);
  });

  it('should unlock only the plugins its tier includes', () => {
    const hot = gridWithKey(tierKeyWith(['feat:dropdown_menu']));

    expect(hasLicenseCapability(hot, 'feat:dropdown_menu')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:copy_paste')).toBe(false);
    expect(hasLicenseCapability(hot, 'feat:undo_redo')).toBe(false);
  });

  it('should restrict a key issued for external use too: the silencing flags never grant', () => {
    const hot = gridWithKey(tierKeyWith(BASE_FEATURES, ['no-console-warns', 'no-ui-warns']));

    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(false);
  });

  it('should never restrict a nested grid', () => {
    const hot = gridWithKey(tierKeyWith(BASE_FEATURES), { root: false });

    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(true);
  });

  it('should return the same result for the same key', () => {
    const licenseKey = tierKeyWith(BASE_FEATURES);

    expect(resolveLicenseCapabilities(gridWithKey(licenseKey)))
      .toBe(resolveLicenseCapabilities(gridWithKey(licenseKey)));
  });

  it('should read the key from the settings on every call', () => {
    let licenseKey = tierKeyWith(BASE_FEATURES);
    const hot = { getSettings: () => ({ licenseKey }) };

    registerAsRootInstance(hot);

    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(false);

    licenseKey = tierKeyWith([...BASE_FEATURES, 'feat:filters']);

    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(true);
  });
});

describe('a key that names a tier', () => {
  it('should restrict on its tier alone, with no flag', () => {
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

  it('should not unlock a feature a key lists by id beside its tier', () => {
    // buildTestKey: capabilities ['core', 'tier:zz_unknown', 'feat:filters', 'feat:all', 'xlsx:all'],
    // flags ['listed-capabilities'].
    const hot = gridWithKey(TIER_AND_IDS_KEY);

    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(false);
    expect(resolveXlsxEntitlement(_getLicenseState(TIER_AND_IDS_KEY).tiers).export).toBe(false);
  });

  it('should expose no grants on the license state', () => {
    expect(_getLicenseState(SUBSCRIPTION_KEY)).not.toHaveProperty('grants');
  });

  it('should expose the tiers of a key on its license state', () => {
    expect(_getLicenseState(keyWithTier(['alpha', 'beta'])).tiers).toEqual(['alpha', 'beta']);
    expect(_getLicenseState(SUBSCRIPTION_KEY).tiers).toBe(null);
    expect(_getLicenseState('11111-22222-33333-44444-55555').tiers).toBe(null);
  });

  it('should not read the registry again for a key whose result is cached', () => {
    // eslint-disable-next-line global-require
    const registry = require('handsontable/plugins/registry');
    const hot = gridWithKey(keyWithTier(['alpha']));

    hasLicenseCapability(hot, 'feat:tier_stub');

    // Every plugin asks on every `updateSettings()`, and the header checkbox on every render.
    const getPluginsNames = jest.spyOn(registry, 'getPluginsNames');

    try {
      hasLicenseCapability(hot, 'feat:tier_stub');
      hasLicenseCapability(hot, 'feat:filters');

      expect(getPluginsNames).not.toHaveBeenCalled();
    } finally {
      getPluginsNames.mockRestore();
    }
  });

  it('should unlock everything for a license state with no tiers field', () => {
    const realState = _getLicenseState(SUBSCRIPTION_KEY);
    const { tiers, ...stateWithoutTiers } = realState;
    const getLicenseState = jest.spyOn(mixed, '_getLicenseState').mockReturnValue(stateWithoutTiers);

    try {
      // A key no other test resolves, so the cache cannot answer for it.
      const hot = gridWithKey('a-key-whose-state-has-no-tiers-field');

      expect(tiers).toBe(null);
      expect(resolveLicenseCapabilities(hot)).toBe('all');
      expect(getLicenseState).toHaveBeenCalledWith('a-key-whose-state-has-no-tiers-field');
    } finally {
      getLicenseState.mockRestore();
    }
  });

  it('should grant a plugin registered after the key was first resolved', () => {
    const key = keyWithTier(['gamma']);

    expect(hasLicenseCapability(gridWithKey(key), 'feat:late_stub')).toBe(false);
    registerLateStub();
    expect(hasLicenseCapability(gridWithKey(key), 'feat:late_stub')).toBe(true);
  });
});
