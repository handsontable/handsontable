import { extractEntitlementKeyData } from '../extractKeyData';
import {
  UNRESTRICTED_GRANTS,
  getLicenseGrants,
  hasProductGrant,
  getProductCapabilities,
  hasCapability,
} from '../grants';
import { buildTestKey } from './buildTestKey';
import { SUBSCRIPTION_KEY, HF_ONLY_KEY, MIXED_KEY } from './fixtures';

describe('entitlementLicenseKey/grants', () => {
  describe('an entitlement key', () => {
    it('should grant exactly the products its payload lists', () => {
      const grants = getLicenseGrants(extractEntitlementKeyData(SUBSCRIPTION_KEY));

      expect(grants.unrestricted).toBe(false);
      expect(hasProductGrant(grants, 'handsontable')).toBe(true);
      expect(hasProductGrant(grants, 'hyperformula')).toBe(false);
    });

    it('should grant exactly the capability tokens its payload lists', () => {
      const grants = getLicenseGrants(extractEntitlementKeyData(SUBSCRIPTION_KEY));

      expect(getProductCapabilities(grants, 'handsontable')).toEqual(['core']);
      expect(hasCapability(grants, 'handsontable', 'core')).toBe(true);
      expect(hasCapability(grants, 'handsontable', 'core_free')).toBe(false);
    });

    it('should keep the products of one key independent of each other', () => {
      const grants = getLicenseGrants(extractEntitlementKeyData(MIXED_KEY));

      expect(getProductCapabilities(grants, 'handsontable')).toEqual(['core']);
      expect(getProductCapabilities(grants, 'hyperformula')).toEqual(['functions_1', 'functions_2']);
      expect(hasCapability(grants, 'hyperformula', 'core')).toBe(false);
    });

    it('should grant nothing for a product it does not license', () => {
      const grants = getLicenseGrants(extractEntitlementKeyData(HF_ONLY_KEY));

      expect(hasProductGrant(grants, 'handsontable')).toBe(false);
      expect(getProductCapabilities(grants, 'handsontable')).toBeNull();
      expect(hasCapability(grants, 'handsontable', 'core')).toBe(false);
    });

    it('should carry a capability token it does not know (E6)', () => {
      const grants = getLicenseGrants(extractEntitlementKeyData(buildTestKey({
        products: {
          handsontable: {
            capabilities: ['core', 'solver'], usage_until: '2027-08-12', notice: 60, grace: 90, flags: [],
          },
        },
      })));

      expect(hasCapability(grants, 'handsontable', 'solver')).toBe(true);
    });

    it('should not answer for a product reached through the prototype chain', () => {
      const grants = getLicenseGrants(extractEntitlementKeyData(SUBSCRIPTION_KEY));

      expect(hasProductGrant(grants, 'toString')).toBe(false);
      expect(hasCapability(grants, 'constructor', 'core')).toBe(false);
    });
  });

  describe('an unrestricted license', () => {
    it('should unlock every product and every capability, including ones that do not exist yet', () => {
      expect(hasProductGrant(UNRESTRICTED_GRANTS, 'handsontable')).toBe(true);
      expect(hasProductGrant(UNRESTRICTED_GRANTS, 'a_product_shipped_in_2030')).toBe(true);
      expect(hasCapability(UNRESTRICTED_GRANTS, 'handsontable', 'core')).toBe(true);
      expect(hasCapability(UNRESTRICTED_GRANTS, 'handsontable', 'a_token_minted_in_2030')).toBe(true);
    });

    it('should report no capability list, because it is not bounded by one', () => {
      expect(getProductCapabilities(UNRESTRICTED_GRANTS, 'handsontable')).toBeNull();
    });

    it('should be frozen so a consumer cannot widen or narrow it', () => {
      expect(Object.isFrozen(UNRESTRICTED_GRANTS)).toBe(true);
      expect(Object.isFrozen(UNRESTRICTED_GRANTS.products)).toBe(true);
    });
  });
});
