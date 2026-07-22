import type { TypedKeyData, LicenseGrants, ProductGrant } from './types';
import { getProductPayload } from './extractKeyData';
import { KNOWN_PRODUCTS } from './constants';

/**
 * The tier reported for an unrestricted (legacy or fallback) license when a
 * caller asks for a product's tier. Legacy keys predate plan codes, so they
 * behave as the top tier.
 *
 * @type {string}
 */
const UNRESTRICTED_TIER = 'enterprise';

/**
 * The mode reported for an unrestricted license when a caller asks for a
 * product's mode.
 *
 * @type {string}
 */
const UNRESTRICTED_MODE = 'internal';

/**
 * The shared grants object for every non-typed license state: a valid legacy
 * commercial key, a legacy expired key, the non-commercial key, a missing key,
 * an invalid key, or an unreadable typed key. Every query short-circuits on
 * `unrestricted`, so these keys unlock everything - introducing add-on gating
 * can never take a feature away from an existing customer. Frozen so it cannot
 * be mutated by a consumer.
 *
 * @type {LicenseGrants}
 */
export const UNRESTRICTED_GRANTS: LicenseGrants = Object.freeze({
  unrestricted: true,
  products: Object.freeze({}),
});

/**
 * Normalizes one product entry from a verified payload into a grant: a tier
 * (defaulting to the top tier), a mode (defaulting to empty - "unspecified"),
 * and an add-on list (defaulting to empty). Unknown tier/mode/add-on strings
 * pass through untouched - the gate that does not know a name simply unlocks
 * nothing for it.
 *
 * @param {TypedKeyData} keyData The verified typed key data.
 * @param {string} productName The product to normalize.
 * @returns {ProductGrant|null}
 */
function normalizeProductGrant(keyData: TypedKeyData, productName: string): ProductGrant | null {
  const product = getProductPayload(keyData.payload, productName);

  if (product === null) {
    return null;
  }

  // The generator refuses to stamp a product without a non-empty tier, so a missing tier can only
  // come from a NEWER generator - and an old build must then fail open (the top tier), exactly
  // like the grace fallback. `''` would be a falsy-string trap: a GRANTED product whose tier reads
  // falsy, so the first gate written as `if (getProductTier(...))` would lock out a paying customer.
  const tier = typeof product.tier === 'string' && product.tier.length > 0 ? product.tier : UNRESTRICTED_TIER;

  // A missing mode defaults to '' ("unspecified"), NOT 'internal': the blocking hard-stop lock is
  // gated on `mode === 'internal'`, and defaulting there would block the end users of a SaaS app
  // (who cannot fix the license) on a malformed key that omits the mode. The blocking UI must be
  // opt-in - only an explicit 'internal' enables it. Real Handsontable keys always carry an explicit
  // mode (the generator requires it), so this only hardens the malformed case.
  return {
    tier,
    mode: typeof product.mode === 'string' ? product.mode : '',
    addons: Array.isArray(product.addons) ? product.addons.filter(addon => typeof addon === 'string') : [],
  };
}

/**
 * Builds the entitlements facet from a verified typed key: exactly what the
 * payload grants, per product. Typed keys are never unrestricted - they unlock
 * only what they list.
 *
 * @param {TypedKeyData} keyData The verified typed key data.
 * @returns {LicenseGrants}
 */
export function getLicenseGrants(keyData: TypedKeyData): LicenseGrants {
  const products: { [productName: string]: ProductGrant } = {};

  KNOWN_PRODUCTS.forEach((productName) => {
    const grant = normalizeProductGrant(keyData, productName);

    if (grant !== null) {
      products[productName] = grant;
    }
  });

  return {
    unrestricted: false,
    products,
  };
}

/**
 * Tells whether the license grants a product. An unrestricted license grants
 * every product; a typed license grants a product only when its payload lists
 * it.
 *
 * @param {LicenseGrants} grants The resolved grants.
 * @param {string} productName The product to check.
 * @returns {boolean}
 */
export function hasProductGrant(grants: LicenseGrants, productName: string): boolean {
  return grants.unrestricted || Object.prototype.hasOwnProperty.call(grants.products, productName);
}

/**
 * Returns the tier a license grants for a product, or `null` when the product
 * is not granted. An unrestricted license reports the top tier for any product.
 *
 * @param {LicenseGrants} grants The resolved grants.
 * @param {string} productName The product to read.
 * @returns {string|null}
 */
export function getProductTier(grants: LicenseGrants, productName: string): string | null {
  if (grants.unrestricted) {
    return UNRESTRICTED_TIER;
  }

  return hasProductGrant(grants, productName) ? grants.products[productName].tier : null;
}

/**
 * Returns the deployment mode a license grants for a product, or `null` when
 * the product is not granted. An unrestricted license reports "internal".
 *
 * @param {LicenseGrants} grants The resolved grants.
 * @param {string} productName The product to read.
 * @returns {string|null}
 */
export function getProductMode(grants: LicenseGrants, productName: string): string | null {
  if (grants.unrestricted) {
    return UNRESTRICTED_MODE;
  }

  return hasProductGrant(grants, productName) ? grants.products[productName].mode : null;
}

/**
 * Tells whether the license unlocks an add-on for a product. An unrestricted
 * license unlocks every add-on - even names that do not exist yet. A typed
 * license unlocks an add-on only when its payload lists it for that product.
 *
 * @param {LicenseGrants} grants The resolved grants.
 * @param {string} productName The product the add-on belongs to.
 * @param {string} addonName The add-on to check.
 * @returns {boolean}
 */
export function hasAddonGrant(grants: LicenseGrants, productName: string, addonName: string): boolean {
  if (grants.unrestricted) {
    return true;
  }

  return hasProductGrant(grants, productName) && grants.products[productName].addons.indexOf(addonName) !== -1;
}
