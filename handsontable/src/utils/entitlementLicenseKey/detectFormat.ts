import type { LicenseKeyFormat } from './types';

/**
 * The literal keys that stand for a license rather than encode one.
 *
 * Only formats Handsontable itself honours belong here. `gpl-v3` is deliberately absent: the
 * specification lists it among the unchanged legacy keys, but that list covers HyperFormula too and
 * nothing in this library has ever recognized it - the frozen validator rejects it like any other
 * unknown string. Naming it here advertised support that does not exist, and since an unreadable key
 * now blocks the grid, a reader who trusted the table would ship a blocked grid.
 *
 * @type {Record<string, LicenseKeyFormat>}
 */
const LITERAL_KEYS: Record<string, LicenseKeyFormat> = {
  'non-commercial-and-evaluation': 'non-commercial-and-evaluation',
};

/**
 * The classic 25-character key, once its dashes are stripped.
 *
 * @type {RegExp}
 */
const LEGACY_KEY = /^[0-9a-fA-F]{25}$/;

/**
 * Tells which format a license key is in, without validating it. The
 * entitlement key carries no leading tag - it starts with prose and ends with
 * the bracketed machine-readable block - so the formats have to be told apart
 * in one place, and this is it.
 *
 * The answer is about SHAPE only. An "entitlement" result means "read this with
 * the entitlement reader", not "this key is valid".
 *
 * @param {string} licenseKey The license key to inspect.
 * @returns {LicenseKeyFormat}
 */
export function detectLicenseKeyFormat(licenseKey: unknown): LicenseKeyFormat {
  if (typeof licenseKey !== 'string') {
    return 'unknown';
  }

  const key = licenseKey.trim();
  const literalKey = key.toLowerCase();

  if (Object.prototype.hasOwnProperty.call(LITERAL_KEYS, literalKey)) {
    return LITERAL_KEYS[literalKey];
  }

  // The bracketed block closes an entitlement key. Its presence is what
  // separates the new format from everything else, so it is checked before the
  // shape-based ones.
  const blockStart = key.lastIndexOf('[');

  if (blockStart !== -1 && key.indexOf(']', blockStart) !== -1) {
    return 'entitlement';
  }
  if (LEGACY_KEY.test(key.replace(/-/g, ''))) {
    return 'legacy';
  }

  return 'unknown';
}

/**
 * Tells whether a license key has the shape of an entitlement key. This is the
 * cheap routing test taken before any parsing - a legacy key pays two string
 * scans for it.
 *
 * @param {string} licenseKey The license key to test.
 * @returns {boolean}
 */
export function isEntitlementKey(licenseKey: unknown): boolean {
  return detectLicenseKeyFormat(licenseKey) === 'entitlement';
}
