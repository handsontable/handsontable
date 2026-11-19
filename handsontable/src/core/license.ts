import { _getLicenseState } from '../helpers/mixed';
import type { LicenseStateDescriptor } from '../helpers/mixed';
import { resolveXlsxEntitlement, UNRESTRICTED_XLSX_ENTITLEMENT } from '../utils/xlsxEngine/xlsxEntitlement';
import type { XlsxEntitlement } from '../utils/xlsxEngine/xlsxEntitlement';
import type { HotInstance } from './types';

/**
 * The license state each instance read last, with the key it was read from. A new key re-resolves it;
 * the same key keeps the descriptor, so its lifecycle stays the one measured on the first read.
 */
const licenseStates = new WeakMap<HotInstance, { key: unknown; state: LicenseStateDescriptor }>();
/**
 * The XLSX entitlement of each key string. What a key unlocks never changes, so the cache is shared by
 * every instance, the way `resolveLicenseCapabilities()` (`utils/licenseCapabilities`) caches by key.
 */
const xlsxEntitlementsByKey = new Map<string, XlsxEntitlement>();

/**
 * Returns the license state of an instance, read from its CURRENT `licenseKey` setting, so a key passed
 * through `updateSettings({ licenseKey })` applies to the next call. The descriptor is kept while the
 * key stays the same. The branding UI and the console message read it once, at initialization.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {LicenseStateDescriptor}
 */
export function getLicenseState(hot: HotInstance): LicenseStateDescriptor {
  const { licenseKey } = hot.getSettings();
  const cached = licenseStates.get(hot);

  if (cached && cached.key === licenseKey) {
    return cached.state;
  }

  // DO NOT add a `typeof process` guard here - see the matching comment in `initLicenseNotification`.
  // The bundler inlines `process.env.HOT_RELEASE_DATE` to a string literal (the bare read cannot
  // crash); a guard is left un-inlined and compiles to `false` in browser bundles, blanking the date
  // and silently killing expired-key detection.
  const releaseDate = process.env.HOT_RELEASE_DATE || '';
  const state = _getLicenseState(licenseKey, releaseDate);

  licenseStates.set(hot, { key: licenseKey, state });

  return state;
}

/**
 * Returns what the license of an instance unlocks of the XLSX engine, read from its CURRENT
 * `licenseKey` setting and cached by key string. A key that is not a string (missing, or a legacy
 * value of another type) unlocks everything, as it does for the plugin tokens.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {XlsxEntitlement}
 */
export function getXlsxEntitlement(hot: HotInstance): XlsxEntitlement {
  const { licenseKey } = hot.getSettings();

  if (typeof licenseKey !== 'string') {
    return UNRESTRICTED_XLSX_ENTITLEMENT;
  }

  let entitlement = xlsxEntitlementsByKey.get(licenseKey);

  if (!entitlement) {
    entitlement = resolveXlsxEntitlement(_getLicenseState(licenseKey).tiers);
    xlsxEntitlementsByKey.set(licenseKey, entitlement);
  }

  return entitlement;
}
