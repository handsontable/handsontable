import { getLicenseState, getXlsxEntitlement } from '../license';
import { UNRESTRICTED_XLSX_ENTITLEMENT } from '../../utils/xlsxEngine/xlsxEntitlement';
import { buildTestKey } from '../../utils/entitlementLicenseKey/__tests__/buildTestKey';
import { SUBSCRIPTION_KEY } from '../../utils/entitlementLicenseKey/__tests__/fixtures';
import { resetTierKeys, tierKeyWith } from '../../utils/entitlementLicenseKey/__tests__/tierKeys';

/**
 * A key that lists feature ids and carries the retired `listed-capabilities` flag, but names no tier:
 * it unlocks everything.
 */
const flaggedPayload = {
  products: {
    handsontable: {
      capabilities: ['core', 'xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout'],
      usage_until: '2027-08-12',
      notice: 60,
      grace: 90,
      flags: ['listed-capabilities'],
    },
  },
};
const unflaggedPayload = {
  products: {
    handsontable: { ...flaggedPayload.products.handsontable, flags: [] },
  },
};

/**
 * The xlsx features the restricted test key unlocks.
 *
 * @type {string[]}
 */
const RESTRICTED_XLSX_FEATURES = ['xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout'];

describe('core/license', () => {
  afterEach(() => {
    resetTierKeys();
  });

  it('resolves the descriptor once per instance', () => {
    const hot = { getSettings: () => ({ licenseKey: SUBSCRIPTION_KEY }) };

    expect(getLicenseState(hot)).toBe(getLicenseState(hot));
    expect(getXlsxEntitlement(hot)).toBe(getXlsxEntitlement(hot));
  });

  it('keeps instances apart', () => {
    const restricted = { getSettings: () => ({ licenseKey: tierKeyWith(RESTRICTED_XLSX_FEATURES) }) };
    // An invalid key (the non-commercial key is one since 19.0) restricts nothing.
    const invalid = { getSettings: () => ({ licenseKey: 'non-commercial-and-evaluation' }) };

    expect(getXlsxEntitlement(restricted).styles).toBe(false);
    expect(getXlsxEntitlement(invalid)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('ignores the retired listed-capabilities flag and the ids a key lists without a tier', () => {
    const flagged = { getSettings: () => ({ licenseKey: buildTestKey(flaggedPayload) }) };

    expect(getXlsxEntitlement(flagged)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('trims the key before reading it, as the license state does', () => {
    const padded = { getSettings: () => ({ licenseKey: `  ${tierKeyWith(RESTRICTED_XLSX_FEATURES)}\n` }) };

    expect(getXlsxEntitlement(padded).styles).toBe(false);
    expect(getXlsxEntitlement(padded).import).toBe(true);
  });

  it('follows a key passed later, so the entitlement and the license state read the current key', () => {
    const restrictedKey = tierKeyWith(RESTRICTED_XLSX_FEATURES);
    const allKey = buildTestKey(flaggedPayload);
    const settings = { licenseKey: restrictedKey };
    const hot = { getSettings: () => settings };

    expect(getXlsxEntitlement(hot).styles).toBe(false);
    expect(getLicenseState(hot).tiers).not.toBe(null);

    settings.licenseKey = allKey;

    expect(getXlsxEntitlement(hot)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);

    settings.licenseKey = restrictedKey;

    expect(getXlsxEntitlement(hot).styles).toBe(false);
    expect(getXlsxEntitlement(hot).import).toBe(true);

    settings.licenseKey = buildTestKey(unflaggedPayload);

    expect(getXlsxEntitlement(hot)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
    expect(getLicenseState(hot).tiers).toBe(null);
  });

  it('reads a key that is not a string as unrestricted', () => {
    const settings = { licenseKey: tierKeyWith(RESTRICTED_XLSX_FEATURES) };
    const hot = { getSettings: () => settings };

    expect(getXlsxEntitlement(hot).styles).toBe(false);

    settings.licenseKey = undefined;

    expect(getXlsxEntitlement(hot)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('shares one entitlement between instances with the same key', () => {
    const key = tierKeyWith(RESTRICTED_XLSX_FEATURES);
    const first = { getSettings: () => ({ licenseKey: key }) };
    const second = { getSettings: () => ({ licenseKey: key }) };

    expect(getXlsxEntitlement(first)).toBe(getXlsxEntitlement(second));
  });
});
