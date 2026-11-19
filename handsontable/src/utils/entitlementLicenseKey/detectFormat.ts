import type { LicenseKeyFormat } from './types';

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
 * No literal key is recognized. Handsontable 19.0 dropped the last one,
 * `non-commercial-and-evaluation` (PRO-1356): it now reads as "unknown", so the
 * legacy path rejects it as an invalid key and the grid is locked.
 *
 * @param {string} licenseKey The license key to inspect.
 * @returns {LicenseKeyFormat}
 */
export function detectLicenseKeyFormat(licenseKey: unknown): LicenseKeyFormat {
  if (typeof licenseKey !== 'string') {
    return 'unknown';
  }

  const key = licenseKey.trim();

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
