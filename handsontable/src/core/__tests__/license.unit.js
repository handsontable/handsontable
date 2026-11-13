import { getLicenseState, getXlsxEntitlement } from '../license';
import { UNRESTRICTED_XLSX_ENTITLEMENT } from '../../utils/xlsxEngine/xlsxEntitlement';
import { buildTestKey } from '../../utils/entitlementLicenseKey/__tests__/buildTestKey';
import { SUBSCRIPTION_KEY } from '../../utils/entitlementLicenseKey/__tests__/fixtures';
import { keyWithAll } from '../../utils/entitlementLicenseKey/__tests__/xlsxLicenseKeys';

const standardPayload = {
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
    handsontable: { ...standardPayload.products.handsontable, flags: [] },
  },
};

describe('core/license', () => {
  it('resolves the descriptor once per instance', () => {
    const hot = { getSettings: () => ({ licenseKey: SUBSCRIPTION_KEY }) };

    expect(getLicenseState(hot)).toBe(getLicenseState(hot));
    expect(getXlsxEntitlement(hot)).toBe(getXlsxEntitlement(hot));
  });

  it('keeps instances apart', () => {
    const standard = { getSettings: () => ({ licenseKey: buildTestKey(standardPayload) }) };
    // An invalid key (the non-commercial key is one since 19.0) restricts nothing.
    const invalid = { getSettings: () => ({ licenseKey: 'non-commercial-and-evaluation' }) };

    expect(getXlsxEntitlement(standard).styles).toBe(false);
    expect(getXlsxEntitlement(invalid)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('reads the listed-capabilities flag from the key', () => {
    const unflagged = { getSettings: () => ({ licenseKey: buildTestKey(unflaggedPayload) }) };

    expect(getXlsxEntitlement(unflagged)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('trims the key before reading the flag, as the license state does', () => {
    const padded = { getSettings: () => ({ licenseKey: `  ${buildTestKey(standardPayload)}\n` }) };

    expect(getXlsxEntitlement(padded).styles).toBe(false);
    expect(getXlsxEntitlement(padded).import).toBe(true);
  });

  it('follows a key passed later, so the entitlement and the license state read the current key', () => {
    const standardKey = buildTestKey(standardPayload);
    const allKey = keyWithAll();
    const settings = { licenseKey: standardKey };
    const hot = { getSettings: () => settings };

    expect(getXlsxEntitlement(hot).styles).toBe(false);
    expect(getLicenseState(hot).grants.unrestricted).toBe(false);

    settings.licenseKey = allKey;

    expect(getXlsxEntitlement(hot)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);

    settings.licenseKey = standardKey;

    expect(getXlsxEntitlement(hot).styles).toBe(false);
    expect(getXlsxEntitlement(hot).import).toBe(true);

    settings.licenseKey = buildTestKey(unflaggedPayload);

    expect(getXlsxEntitlement(hot)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
    expect(getLicenseState(hot).grants.unrestricted).toBe(true);
  });

  it('reads a key that is not a string as unrestricted', () => {
    const settings = { licenseKey: buildTestKey(standardPayload) };
    const hot = { getSettings: () => settings };

    expect(getXlsxEntitlement(hot).styles).toBe(false);

    settings.licenseKey = undefined;

    expect(getXlsxEntitlement(hot)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('shares one entitlement between instances with the same key', () => {
    const key = buildTestKey(standardPayload);
    const first = { getSettings: () => ({ licenseKey: key }) };
    const second = { getSettings: () => ({ licenseKey: key }) };

    expect(getXlsxEntitlement(first)).toBe(getXlsxEntitlement(second));
  });
});
