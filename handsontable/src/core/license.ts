import { _getLicenseState } from '../helpers/mixed';
import type { LicenseStateDescriptor } from '../helpers/mixed';
import { resolveXlsxEntitlement } from '../utils/xlsxEngine/xlsxEntitlement';
import type { XlsxEntitlement } from '../utils/xlsxEngine/xlsxEntitlement';
import type { HotInstance } from './types';

const licenseStates = new WeakMap<HotInstance, LicenseStateDescriptor>();
const xlsxEntitlements = new WeakMap<HotInstance, XlsxEntitlement>();

/**
 * Returns the license state of an instance. The key is read once, on the first call, and the
 * descriptor is kept for the life of the instance - like the console message and the branding UI,
 * `updateSettings({ licenseKey })` does not change it.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {LicenseStateDescriptor}
 */
export function getLicenseState(hot: HotInstance): LicenseStateDescriptor {
  let state = licenseStates.get(hot);

  if (!state) {
    // DO NOT add a `typeof process` guard here - see the matching comment in `initLicenseNotification`.
    // The bundler inlines `process.env.HOT_RELEASE_DATE` to a string literal (the bare read cannot
    // crash); a guard is left un-inlined and compiles to `false` in browser bundles, blanking the date
    // and silently killing expired-key detection.
    const releaseDate = process.env.HOT_RELEASE_DATE || '';

    state = _getLicenseState(hot.getSettings().licenseKey, releaseDate);
    licenseStates.set(hot, state);
  }

  return state;
}

/**
 * Returns what the license of an instance unlocks of the XLSX engine. Resolved once per instance.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {XlsxEntitlement}
 */
export function getXlsxEntitlement(hot: HotInstance): XlsxEntitlement {
  let entitlement = xlsxEntitlements.get(hot);

  if (!entitlement) {
    entitlement = resolveXlsxEntitlement(getLicenseState(hot).grants);
    xlsxEntitlements.set(hot, entitlement);
  }

  return entitlement;
}
