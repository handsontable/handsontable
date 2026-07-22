import { extractTypedKeyData } from '../extractKeyData';
import {
  UNRESTRICTED_GRANTS,
  getLicenseGrants,
  hasProductGrant,
  getProductTier,
  getProductMode,
  hasAddonGrant,
} from '../grants';
import { buildTestKey } from './buildTestKey';
import {
  TRIAL_KEY,
  FREEMIUM_KEY,
  SUBSCRIPTION_SAAS_KEY,
  HF_ADDONS_KEY,
} from './fixtures';

describe('typedLicenseKey/grants', () => {
  describe('UNRESTRICTED_GRANTS (single API for legacy and fallback states)', () => {
    it('should grant every product', () => {
      expect(hasProductGrant(UNRESTRICTED_GRANTS, 'handsontable')).toBe(true);
      expect(hasProductGrant(UNRESTRICTED_GRANTS, 'hyperformula')).toBe(true);
      expect(hasProductGrant(UNRESTRICTED_GRANTS, 'anything')).toBe(true);
    });

    it('should report the top tier and internal mode for any product', () => {
      expect(getProductTier(UNRESTRICTED_GRANTS, 'handsontable')).toBe('enterprise');
      expect(getProductMode(UNRESTRICTED_GRANTS, 'handsontable')).toBe('internal');
    });

    it('should unlock every add-on, including names that do not exist yet', () => {
      expect(hasAddonGrant(UNRESTRICTED_GRANTS, 'handsontable', 'spreadsheet')).toBe(true);
      expect(hasAddonGrant(UNRESTRICTED_GRANTS, 'handsontable', 'future_addon')).toBe(true);
    });

    it('should be frozen so a consumer cannot mutate it', () => {
      expect(Object.isFrozen(UNRESTRICTED_GRANTS)).toBe(true);
    });
  });

  describe('getLicenseGrants (typed keys grant exactly what they list)', () => {
    it('should grant Handsontable enterprise/internal for a trial key', () => {
      const grants = getLicenseGrants(extractTypedKeyData(TRIAL_KEY));

      expect(grants.unrestricted).toBe(false);
      expect(hasProductGrant(grants, 'handsontable')).toBe(true);
      expect(getProductTier(grants, 'handsontable')).toBe('enterprise');
      expect(getProductMode(grants, 'handsontable')).toBe('internal');
    });

    it('should report the freemium tier for a freemium key', () => {
      const grants = getLicenseGrants(extractTypedKeyData(FREEMIUM_KEY));

      expect(getProductTier(grants, 'handsontable')).toBe('freemium');
      expect(getProductTier(grants, 'hyperformula')).toBe('freemium');
    });

    it('should NOT default a missing mode to internal (the blocking lock is opt-in)', () => {
      // The perpetual/freemium products carry no mode. A missing mode must normalize to '', not
      // 'internal': the hard-stop lock gates on `mode === 'internal'`, so defaulting there would
      // wrongly enable the blocking screen for a mode-less (malformed) key.
      const grants = getLicenseGrants(extractTypedKeyData(FREEMIUM_KEY));

      expect(getProductMode(grants, 'handsontable')).toBe('');
    });

    it('should surface the saas mode from the payload', () => {
      const grants = getLicenseGrants(extractTypedKeyData(SUBSCRIPTION_SAAS_KEY));

      expect(getProductMode(grants, 'handsontable')).toBe('saas');
    });

    it('should list a product add-ons and gate on them exactly', () => {
      const grants = getLicenseGrants(extractTypedKeyData(HF_ADDONS_KEY));

      expect(hasAddonGrant(grants, 'hyperformula', 'spreadsheet')).toBe(true);
      expect(hasAddonGrant(grants, 'hyperformula', 'import_export')).toBe(true);
      expect(hasAddonGrant(grants, 'hyperformula', 'not_granted')).toBe(false);
    });

    it('should not grant a product the payload omits', () => {
      // The trial fixture grants only Handsontable.
      const grants = getLicenseGrants(extractTypedKeyData(TRIAL_KEY));

      expect(hasProductGrant(grants, 'hyperformula')).toBe(false);
      expect(getProductTier(grants, 'hyperformula')).toBe(null);
      expect(getProductMode(grants, 'hyperformula')).toBe(null);
      expect(hasAddonGrant(grants, 'hyperformula', 'spreadsheet')).toBe(false);
    });

    it('should default a missing add-on list to empty', () => {
      const grants = getLicenseGrants(extractTypedKeyData(TRIAL_KEY));

      expect(hasAddonGrant(grants, 'handsontable', 'spreadsheet')).toBe(false);
    });
  });

  describe('forward compatibility (append-only vocabulary)', () => {
    it('should read a key with an unknown tier and gate its unknown add-on as not granted', () => {
      const key = buildTestKey('[SUB]', {
        v: 1,
        holder: 'x',
        products: {
          handsontable: {
            tier: 'ultra', // a tier this build has never heard of
            mode: 'internal',
            exp: '2027-01-01',
            grace: 90,
            addons: ['future_addon'], // an add-on this build has never heard of
          },
        },
      });
      const grants = getLicenseGrants(extractTypedKeyData(key));

      // Unknown tier passes through untouched.
      expect(getProductTier(grants, 'handsontable')).toBe('ultra');
      // Unknown add-on is listed, so an exact query for it is honored...
      expect(hasAddonGrant(grants, 'handsontable', 'future_addon')).toBe(true);
      // ...but a feature this build does gate on stays locked.
      expect(hasAddonGrant(grants, 'handsontable', 'spreadsheet')).toBe(false);
    });

    it('should fail OPEN to the top tier for a granted product without a tier string', () => {
      // The generator refuses to stamp a tierless product, so this can only come from a NEWER
      // generator. `''` would be a falsy-string trap: a gate written as
      // `if (getProductTier(...))` must never lock out a paying customer whose key verifies.
      const key = buildTestKey('[SUB]', {
        v: 1,
        holder: 'x',
        products: {
          handsontable: { mode: 'internal', exp: '2027-01-01', grace: 90 },
        },
      });
      const grants = getLicenseGrants(extractTypedKeyData(key));

      expect(getProductTier(grants, 'handsontable')).toBe('enterprise');
    });
  });
});
