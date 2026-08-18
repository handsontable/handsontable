import type { EntitlementKeyData, LicenseGrants } from './types';
import { getProductEntitlement } from './extractKeyData';

/**
 * The grants shared by every non-entitlement license state: a valid legacy
 * commercial key, a legacy expired key, the non-commercial key, a missing key,
 * an invalid key, or an unreadable entitlement key. Every query short-circuits
 * on `unrestricted`, so these keys unlock everything - introducing capability
 * gating can never take a feature away from an existing customer. Frozen so it
 * cannot be mutated by a consumer.
 *
 * @type {LicenseGrants}
 */
export const UNRESTRICTED_GRANTS: LicenseGrants = Object.freeze({
  unrestricted: true,
  products: Object.freeze({}),
});

/**
 * Builds the grants facet from a verified entitlement key: exactly the
 * capability tokens the payload lists, per product. Entitlement keys are never
 * unrestricted - they unlock only what they name.
 *
 * @param {EntitlementKeyData} keyData The verified key data.
 * @returns {LicenseGrants}
 */
export function getLicenseGrants(keyData: EntitlementKeyData): LicenseGrants {
  const products: LicenseGrants['products'] = {};

  Object.keys(keyData.products).forEach((productName) => {
    const entitlement = getProductEntitlement(keyData, productName);

    if (entitlement !== null) {
      products[productName] = { capabilities: entitlement.capabilities.slice() };
    }
  });

  return {
    unrestricted: false,
    products,
  };
}

/**
 * Tells whether the license grants a product. An unrestricted license grants
 * every product; an entitlement license grants a product only when its payload
 * lists it.
 *
 * @param {LicenseGrants} grants The resolved grants.
 * @param {string} productName The product to check.
 * @returns {boolean}
 */
export function hasProductGrant(grants: LicenseGrants, productName: string): boolean {
  return grants.unrestricted || Object.prototype.hasOwnProperty.call(grants.products, productName);
}

/**
 * Returns the capability tokens a license grants for a product, or `null` when
 * the product is not granted. An unrestricted license reports no token list -
 * it answers "granted" to every capability query instead, so a caller that
 * needs a yes/no answer asks `hasCapability`.
 *
 * @param {LicenseGrants} grants The resolved grants.
 * @param {string} productName The product to read.
 * @returns {string[]|null}
 */
export function getProductCapabilities(grants: LicenseGrants, productName: string): string[] | null {
  if (grants.unrestricted || !hasProductGrant(grants, productName)) {
    return null;
  }

  return grants.products[productName].capabilities;
}

/**
 * Tells whether the license unlocks a capability for a product. An unrestricted
 * license unlocks every capability - even tokens that do not exist yet. An
 * entitlement license unlocks a capability only when its payload lists the
 * token for that product.
 *
 * @param {LicenseGrants} grants The resolved grants.
 * @param {string} productName The product the capability belongs to.
 * @param {string} capability The capability token to check.
 * @returns {boolean}
 */
export function hasCapability(grants: LicenseGrants, productName: string, capability: string): boolean {
  if (grants.unrestricted) {
    return true;
  }

  return hasProductGrant(grants, productName) &&
    grants.products[productName].capabilities.indexOf(capability) !== -1;
}
