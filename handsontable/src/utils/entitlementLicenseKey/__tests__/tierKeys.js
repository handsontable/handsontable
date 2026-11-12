import { getPlugin, getPluginsNames } from '../../../plugins/registry';
import { isPluginLicense } from '../../licenseCapabilities';
import { XLSX_TIERS_BY_ID } from '../../xlsxEngine/licenseCapabilities';
import { buildTestKey } from './buildTestKey';
import { keyWithTier } from './xlsxLicenseKeys';

/**
 * TEST-ONLY license keys that name a made-up tier, for the Jest suites. Each call makes a tier no
 * earlier call used (`test_tier_<n>`) and adds it to the features the key should unlock: the tiers of
 * a registered plugin through a spy on its static `LICENSE` getter, and the tiers of an xlsx feature by
 * pushing onto its list in `XLSX_TIERS_BY_ID`. A unique tier makes every key string unique, so the
 * per-key caches of the license gates need no reset.
 *
 * It uses `jest` and the plugin registry, so it is kept apart from `xlsxLicenseKeys.js`, which the
 * Playwright fixture `tests/fixtures/xlsxLicenseKeys.ts` imports too. Every suite that calls
 * `tierKeyWith()` or `tierKeyWithout()` calls `resetTierKeys()` in `afterEach`.
 */

/**
 * The prefix of every tier these helpers make.
 *
 * @type {string}
 */
const TEST_TIER_PREFIX = 'test_tier_';

/**
 * The plugin classes whose `LICENSE` getter is spied on: the spy, the original license, and the tiers
 * added to it so far.
 *
 * @type {Map<Function, {spy: jest.SpyInstance, original: object, added: string[], license: object}>}
 */
const spiedPlugins = new Map();

let tierCount = 0;

/**
 * Returns the registered plugin classes that carry a license, keyed by their capability token.
 *
 * @returns {Map<string, Function>}
 */
function getLicensedPlugins() {
  const plugins = new Map();

  getPluginsNames().forEach((pluginName) => {
    const PluginClass = getPlugin(pluginName);

    if (PluginClass && isPluginLicense(PluginClass.LICENSE)) {
      plugins.set(PluginClass.LICENSE.capability, PluginClass);
    }
  });

  return plugins;
}

/**
 * Adds a tier to the static `LICENSE` of a plugin class. The first call spies on the getter; a later
 * one, before `resetTierKeys()`, adds to what the spy already returns.
 *
 * @param {Function} PluginClass The plugin class.
 * @param {string} tier The tier to add.
 */
function addPluginTier(PluginClass, tier) {
  let entry = spiedPlugins.get(PluginClass);

  // A suite may have restored every mock (`jest.restoreAllMocks()`) since the spy was made.
  if (entry && Object.getOwnPropertyDescriptor(PluginClass, 'LICENSE')?.get !== entry.spy) {
    spiedPlugins.delete(PluginClass);
    entry = undefined;
  }

  if (!entry) {
    const original = PluginClass.LICENSE;

    entry = { spy: null, original, added: [], license: original };
    entry.spy = jest.spyOn(PluginClass, 'LICENSE', 'get').mockImplementation(() => entry.license);
    spiedPlugins.set(PluginClass, entry);
  }

  entry.added.push(tier);
  entry.license = Object.freeze({
    ...entry.original,
    tiers: Object.freeze([...entry.original.tiers, ...entry.added]),
  });
}

/**
 * Makes a new tier, adds it to the features `includes` accepts, and returns a key naming it.
 *
 * @param {Function} includes Answers whether a feature id gets the tier.
 * @param {string[]} flags The product flags.
 * @param {object} [dates] The license window (`usage_until` or `release_until`) in place of the one
 * `keyWithTier()` gives.
 * @returns {string}
 */
function buildTierKey(includes, flags, dates) {
  tierCount += 1;

  const tier = `${TEST_TIER_PREFIX}${tierCount}`;

  getLicensedPlugins().forEach((PluginClass, capability) => {
    if (includes(capability)) {
      addPluginTier(PluginClass, tier);
    }
  });

  Object.keys(XLSX_TIERS_BY_ID).forEach((id) => {
    if (includes(id)) {
      XLSX_TIERS_BY_ID[id].push(tier);
    }
  });

  if (dates === undefined) {
    return keyWithTier([tier], flags);
  }

  return buildTestKey({
    products: {
      handsontable: {
        capabilities: [`tier:${tier}`],
        ...dates,
        notice: 60,
        grace: 90,
        flags,
      },
    },
  });
}

/**
 * Builds a current subscription key that names one new tier, which every registered plugin and every
 * xlsx feature include, except `featureIds`.
 *
 * @param {string[]} [featureIds] The features the key leaves out: plugin tokens (`feat:filters`) and
 * xlsx ids (`xlsx:styles`).
 * @param {string[]} [flags] The product flags.
 * @param {object} [dates] The license window, for example `{ release_until: '2020-01-01' }` for a
 * perpetual license past its maintenance date. A current subscription by default.
 * @returns {string}
 */
export function tierKeyWithout(featureIds = [], flags = [], dates = undefined) {
  return buildTierKey(id => !featureIds.includes(id), flags, dates);
}

/**
 * Builds a current subscription key that names one new tier, which only `featureIds` include.
 *
 * @param {string[]} featureIds The features the key unlocks: plugin tokens (`feat:filters`) and xlsx
 * ids (`xlsx:styles`).
 * @param {string[]} [flags] The product flags.
 * @param {object} [dates] The license window, as for `tierKeyWithout()`.
 * @returns {string}
 */
export function tierKeyWith(featureIds, flags = [], dates = undefined) {
  return buildTierKey(id => featureIds.includes(id), flags, dates);
}

/**
 * Restores every spied `LICENSE` getter and removes every test tier from `XLSX_TIERS_BY_ID`.
 */
export function resetTierKeys() {
  spiedPlugins.forEach(({ spy }) => spy.mockRestore());
  spiedPlugins.clear();

  Object.values(XLSX_TIERS_BY_ID).forEach((tiers) => {
    for (let index = tiers.length - 1; index >= 0; index -= 1) {
      if (tiers[index].startsWith(TEST_TIER_PREFIX)) {
        tiers.splice(index, 1);
      }
    }
  });
}
