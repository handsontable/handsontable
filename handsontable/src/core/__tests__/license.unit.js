import { getLicenseState, getXlsxEntitlement } from '../license';
import { UNRESTRICTED_XLSX_ENTITLEMENT } from '../../utils/xlsxEngine/xlsxEntitlement';
import { buildTestKey } from '../../utils/entitlementLicenseKey/__tests__/buildTestKey';
import { SUBSCRIPTION_KEY } from '../../utils/entitlementLicenseKey/__tests__/fixtures';

const standardPayload = {
  products: {
    handsontable: {
      capabilities: ['core', 'xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout'],
      usage_until: '2027-08-12',
      notice: 60,
      grace: 90,
      flags: [],
    },
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
    const legacy = { getSettings: () => ({ licenseKey: 'non-commercial-and-evaluation' }) };

    expect(getXlsxEntitlement(standard).styles).toBe(false);
    expect(getXlsxEntitlement(legacy)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('does not re-read a key changed after the first call', () => {
    const settings = { licenseKey: SUBSCRIPTION_KEY };
    const hot = { getSettings: () => settings };
    const first = getXlsxEntitlement(hot);

    settings.licenseKey = buildTestKey(standardPayload);

    expect(getXlsxEntitlement(hot)).toBe(first);
  });
});
