import { _getLicenseState } from '../../helpers/mixed';
import { countRegisteredPlugins, getPlugin, getPluginsNames } from '../../plugins/registry';
import { isRootInstance } from '../rootInstance';
import type { HotInstance } from '../../core/types';
import type { PluginLicense } from './types';

export type { PluginLicense, PluginLicenseGate } from './types';

/**
 * What a license key unlocks: `'all'`, or the set of plugin tokens its tiers grant.
 */
export type LicenseCapabilities = 'all' | ReadonlySet<string>;

/**
 * A feature the license key turned off, as the message names it.
 */
export interface MissingCapability {
  capability: string;
  name: string;
}

/**
 * One feature a grid's key left out. `isStillMissing` is set for a plugin the key keeps off at enable
 * (`gate: 'enable'`), which is missing only while its option still asks for it; a feature refused on a
 * call (`gate: 'call'`) has none and stays missing.
 */
interface ReportedFeature {
  name: string;
  isStillMissing: (() => boolean) | null;
}

/**
 * The features each root grid's key left out, in the order they were reported, the key they were
 * reported for, and the tokens the last message named. A new key starts a new list.
 */
interface MissingCapabilitiesRecord {
  key: string;
  features: Map<string, ReportedFeature>;
  written: Set<string>;
}

const ALL: LicenseCapabilities = 'all';

/**
 * The resolved capabilities per key string, with the number of registered plugins they were resolved
 * against: the tiers of each plugin come from the registered plugin classes, so a plugin registered
 * later makes the entry stale.
 */
const resolvedByKey = new Map<string, { pluginCount: number; capabilities: LicenseCapabilities }>();

const missingByInstance = new WeakMap<HotInstance, MissingCapabilitiesRecord>();

/**
 * Tells whether a plugin class's static `LICENSE` has the shape the generator writes. A plugin from outside
 * Handsontable may declare a static of that name for its own purposes, and it is then never checked.
 *
 * @param {*} value The static `LICENSE` of a plugin class.
 * @returns {boolean}
 */
export function isPluginLicense(value: unknown): value is PluginLicense {
  const license = value as PluginLicense | null | undefined;

  return typeof license?.capability === 'string' && typeof license.name === 'string' &&
    (license.gate === 'enable' || license.gate === 'call') && Array.isArray(license.tiers);
}

/**
 * Returns the tokens of the registered plugins whose `LICENSE.tiers` list one of the tiers a key names.
 *
 * @param {string[]} tiers The tiers the key names.
 * @returns {Set<string>}
 */
function resolveTiers(tiers: readonly string[]): Set<string> {
  const granted = new Set<string>();

  getPluginsNames().forEach((pluginName) => {
    const license: unknown = getPlugin(pluginName)?.LICENSE;

    if (isPluginLicense(license) && license.tiers.some(tier => tiers.includes(tier))) {
      granted.add(license.capability);
    }
  });

  return granted;
}

/**
 * Resolves what a license key unlocks. A key that names a tier (`tier:<name>`) unlocks the plugins whose
 * `LICENSE.tiers` list one of its tiers, whatever else it lists and whatever its flags. Every other key
 * (see `_getLicenseState`) unlocks everything.
 *
 * @param {string} key The license key.
 * @returns {LicenseCapabilities}
 */
function resolveKey(key: string): LicenseCapabilities {
  const { tiers } = _getLicenseState(key);

  // A state without a `tiers` field names no tier, so it unlocks everything, as `null` does.
  return tiers === null || tiers === undefined ? ALL : resolveTiers(tiers);
}

/**
 * Returns what the license key of a grid unlocks. The key is read from the grid's settings each time,
 * because plugins are enabled before the license notification reads it at init, and a later
 * `updateSettings()` can pass another key.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {LicenseCapabilities}
 */
export function resolveLicenseCapabilities(hot: HotInstance): LicenseCapabilities {
  const key = hot.getSettings().licenseKey;

  // Only a string can be an entitlement key; everything else is a missing or a legacy key.
  if (typeof key !== 'string') {
    return ALL;
  }

  const pluginCount = countRegisteredPlugins();
  const cached = resolvedByKey.get(key);

  if (cached && cached.pluginCount === pluginCount) {
    return cached.capabilities;
  }

  const capabilities = resolveKey(key);

  resolvedByKey.set(key, { pluginCount, capabilities });

  return capabilities;
}

/**
 * Tells whether the license key of a grid unlocks a token. A nested grid (a menu, the Filters value
 * list, a grid inside a cell) is never checked: its parent was.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {string} token The token, for example `'feat:filters'`.
 * @returns {boolean}
 */
export function hasLicenseCapability(hot: HotInstance, token: string): boolean {
  if (!isRootInstance(hot)) {
    return true;
  }

  const capabilities = resolveLicenseCapabilities(hot);

  return capabilities === 'all' || capabilities.has(token);
}

/**
 * Records that the license key of a grid left a feature out. The console message and the bar are
 * written later, once for every feature a pass turned off (`flushMissingCapabilities` in
 * `utils/licenseNotification.ts`).
 *
 * @param {HotInstance} hot The root Handsontable instance.
 * @param {PluginLicense} license The license of the feature.
 * @param {Function} [isStillMissing] For a plugin the key keeps off at enable: answers whether its option
 * still asks for it, so the feature leaves the list once the option is off.
 * @returns {boolean} `true` when the feature was not reported for this key before.
 */
export function reportMissingCapability(
  hot: HotInstance,
  license: PluginLicense,
  isStillMissing: (() => boolean) | null = null,
): boolean {
  const key = hot.getSettings().licenseKey;
  const keyString = typeof key === 'string' ? key : '';
  let record = missingByInstance.get(hot);

  if (!record || record.key !== keyString) {
    record = { key: keyString, features: new Map(), written: new Set() };
    missingByInstance.set(hot, record);
  }

  if (record.features.has(license.capability)) {
    return false;
  }

  record.features.set(license.capability, { name: license.name, isStillMissing });

  return true;
}

/**
 * Drops the features whose plugin is no longer asked for: a plugin the key keeps off stays in the list
 * only while its option is on. A feature refused on a call stays.
 *
 * @param {HotInstance} hot The root Handsontable instance.
 */
export function pruneMissingCapabilities(hot: HotInstance): void {
  const record = missingByInstance.get(hot);

  record?.features.forEach(({ isStillMissing }, capability) => {
    if (isStillMissing !== null && !isStillMissing()) {
      record.features.delete(capability);
    }
  });
}

/**
 * Tells whether a feature was reported missing for the license key the grid holds now. A key passed
 * later through `updateSettings()` starts a new list, so the features an earlier key left out no longer
 * count once the key changed.
 *
 * @param {HotInstance} hot The root Handsontable instance.
 * @returns {boolean}
 */
export function hasMissingCapabilities(hot: HotInstance): boolean {
  const record = missingByInstance.get(hot);
  const key = hot.getSettings().licenseKey;

  return record !== undefined && record.key === (typeof key === 'string' ? key : '') && record.features.size > 0;
}

/**
 * Drops what a grid's earlier key left out, once a key that leaves nothing out took its message away, so a
 * later restricting key reports its features again.
 *
 * @param {HotInstance} hot The root Handsontable instance.
 */
export function forgetMissingCapabilities(hot: HotInstance): void {
  missingByInstance.delete(hot);
}

/**
 * Returns the features the license key of a grid left out, sorted by name, when the list changed since
 * the last call, and whether a feature was added to it (a list that only got shorter names nothing new).
 * Returns `null` when the list is the one the last call returned.
 *
 * @param {HotInstance} hot The root Handsontable instance.
 * @returns {{key: string, features: MissingCapability[], added: boolean} | null}
 */
export function takeChangedMissingCapabilities(
  hot: HotInstance,
): { key: string; features: MissingCapability[]; added: boolean } | null {
  const record = missingByInstance.get(hot);

  if (!record) {
    return null;
  }

  const capabilities = [...record.features.keys()];
  const added = capabilities.some(capability => !record.written.has(capability));

  if (!added && capabilities.length === record.written.size) {
    return null;
  }

  record.written = new Set(capabilities);

  const features = [...record.features.entries()]
    .map(([capability, { name }]) => ({ capability, name }))
    .sort((a, b) => (a.name < b.name ? -1 : 1));

  return { key: record.key, features, added };
}
