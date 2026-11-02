import { _getLicenseState } from '../../helpers/mixed';
import { getProductCapabilities, HANDSONTABLE_PRODUCT } from '../entitlementLicenseKey';
import { getPlugin, getPluginsNames } from '../../plugins/registry';
import { isRootInstance } from '../rootInstance';
import type { HotInstance } from '../../core/types';
import type { PluginLicense } from './types';

export type { PluginLicense, PluginLicenseGate } from './types';

/**
 * What a license key unlocks: `'all'`, or the set of tokens it grants.
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
 * The features each root grid's key left out, in the order they were reported, and the key they were
 * reported for. A new key starts a new list.
 */
interface MissingCapabilitiesRecord {
  key: string;
  features: Map<string, string>;
  flushedCount: number;
}

const ALL: LicenseCapabilities = 'all';

/**
 * The resolved capabilities per key string, with the number of registered plugins they were resolved
 * against: the implications come from the registered plugin classes, so a plugin registered later
 * makes the entry stale.
 */
const resolvedByKey = new Map<string, { pluginCount: number; capabilities: LicenseCapabilities }>();

const missingByInstance = new WeakMap<HotInstance, MissingCapabilitiesRecord>();

/**
 * Tells whether a set of listed tokens covers a token: the token itself, or the `<namespace>:all`
 * token of its namespace.
 *
 * @param {ReadonlySet<string>} listed The listed tokens.
 * @param {string} token The token to check.
 * @returns {boolean}
 */
function covers(listed: ReadonlySet<string>, token: string): boolean {
  if (listed.has(token)) {
    return true;
  }

  const separator = token.indexOf(':');

  return separator !== -1 && listed.has(`${token.slice(0, separator)}:all`);
}

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
    (license.gate === 'enable' || license.gate === 'call') && Array.isArray(license.implies);
}

/**
 * Resolves what a license key unlocks. A key that does not restrict (see `_getLicenseState`) unlocks
 * everything. A key that does unlocks `core`, the tokens it lists, every token a `<namespace>:all` it
 * lists covers, and the tokens every granted, registered plugin requires (its `LICENSE.implies`).
 *
 * @param {string} key The license key.
 * @returns {LicenseCapabilities}
 */
function resolveKey(key: string): LicenseCapabilities {
  const { grants } = _getLicenseState(key);

  if (grants.unrestricted) {
    return ALL;
  }

  const listed = new Set(getProductCapabilities(grants, HANDSONTABLE_PRODUCT) ?? []);
  const granted = new Set(listed);

  granted.add('core');

  // One pass is enough: `implies` is already the full closure of a plugin's requirements.
  getPluginsNames().forEach((pluginName) => {
    const license: unknown = getPlugin(pluginName)?.LICENSE;

    if (isPluginLicense(license) && covers(listed, license.capability)) {
      license.implies.forEach(token => granted.add(token));
    }
  });

  return granted;
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

  const pluginCount = getPluginsNames().length;
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
  if (!isRootInstance(hot) || token === 'core') {
    return true;
  }

  const capabilities = resolveLicenseCapabilities(hot);

  return capabilities === 'all' || covers(capabilities, token);
}

/**
 * Records that the license key of a grid left a feature out. The console message and the bar are
 * written later, once for every feature a pass turned off (`flushMissingCapabilities` in
 * `utils/licenseNotification.ts`).
 *
 * @param {HotInstance} hot The root Handsontable instance.
 * @param {PluginLicense} license The license of the feature.
 * @returns {boolean} `true` when the feature was not reported for this key before.
 */
export function reportMissingCapability(hot: HotInstance, license: PluginLicense): boolean {
  const key = hot.getSettings().licenseKey;
  const keyString = typeof key === 'string' ? key : '';
  let record = missingByInstance.get(hot);

  if (!record || record.key !== keyString) {
    record = { key: keyString, features: new Map(), flushedCount: 0 };
    missingByInstance.set(hot, record);
  }

  if (record.features.has(license.capability)) {
    return false;
  }

  record.features.set(license.capability, license.name);

  return true;
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
 * Returns the features the license key of a grid left out, sorted by token, when the list grew since
 * the last call. Returns `null` when nothing new was reported.
 *
 * @param {HotInstance} hot The root Handsontable instance.
 * @returns {{key: string, features: MissingCapability[]} | null}
 */
export function takeNewMissingCapabilities(
  hot: HotInstance,
): { key: string; features: MissingCapability[] } | null {
  const record = missingByInstance.get(hot);

  if (!record || record.features.size === record.flushedCount) {
    return null;
  }

  record.flushedCount = record.features.size;

  const features = [...record.features.entries()]
    .map(([capability, name]) => ({ capability, name }))
    .sort((a, b) => (a.capability < b.capability ? -1 : 1));

  return { key: record.key, features };
}
