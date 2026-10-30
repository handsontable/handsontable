import { buildTestKey } from '../../entitlementLicenseKey/__tests__/buildTestKey';
import { SUBSCRIPTION_KEY, HF_ONLY_KEY } from '../../entitlementLicenseKey/__tests__/fixtures';
import {
  extractEntitlementKeyData,
  getLicenseGrants,
  UNRESTRICTED_GRANTS,
} from '../../entitlementLicenseKey';
import { XLSX_CAPABILITY_IDS } from '../licenseCapabilities';
import {
  UNRESTRICTED_XLSX_ENTITLEMENT,
  resolveXlsxEntitlement,
  formatMissingCapabilitiesWarning,
} from '../xlsxEntitlement';

const grantsOf = (capabilities) => {
  const key = buildTestKey({
    products: {
      handsontable: { capabilities, usage_until: '2027-08-12', notice: 60, grace: 90, flags: [] },
    },
  });

  return getLicenseGrants(extractEntitlementKeyData(key));
};

describe('xlsxEngine/xlsxEntitlement', () => {
  it('is unrestricted for unrestricted grants', () => {
    expect(resolveXlsxEntitlement(UNRESTRICTED_GRANTS)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
    expect(UNRESTRICTED_XLSX_ENTITLEMENT.missing).toEqual([]);
    expect(Object.values(UNRESTRICTED_XLSX_ENTITLEMENT).filter(v => v === false)).toEqual([]);
  });

  it('is unrestricted for a key with no xlsx token at all (every key issued so far)', () => {
    const grants = getLicenseGrants(extractEntitlementKeyData(SUBSCRIPTION_KEY));

    expect(resolveXlsxEntitlement(grants)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('is unrestricted for a key that does not grant handsontable', () => {
    const grants = getLicenseGrants(extractEntitlementKeyData(HF_ONLY_KEY));

    expect(resolveXlsxEntitlement(grants)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('gates on exactly the listed tokens once any xlsx token is present', () => {
    const e = resolveXlsxEntitlement(grantsOf(['core', 'xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout']));

    expect(e).toMatchObject({
      import: true,
      export: true,
      formulas: true,
      layout: true,
      numberFormats: false,
      comments: false,
      importReport: false,
      styles: false,
      conditionalFormatting: false,
      dataValidation: false,
      protection: false,
    });
    expect(e.missing).toEqual([
      'xlsx:number_formats', 'xlsx:comments', 'xlsx:import_report', 'xlsx:styles',
      'xlsx:conditional_formatting', 'xlsx:data_validation', 'xlsx:protection',
    ]);
  });

  it('treats an unknown xlsx token as opting in, granting nothing', () => {
    const e = resolveXlsxEntitlement(grantsOf(['core', 'xlsx:future']));

    expect(e.import).toBe(false);
    expect(e.missing).toHaveLength(11);
  });

  it('reports nothing missing for a full key and matches the unrestricted flags', () => {
    const e = resolveXlsxEntitlement(grantsOf(['core', ...XLSX_CAPABILITY_IDS]));

    expect(e.missing).toEqual([]);
    expect({ ...e, missing: [] }).toEqual(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('returns frozen objects and a fresh missing array', () => {
    const e = resolveXlsxEntitlement(grantsOf(['core', 'xlsx:import']));

    expect(Object.isFrozen(e)).toBe(true);
    expect(Object.isFrozen(e.missing)).toBe(true);
  });

  it('formats the warning with the operation and the ids', () => {
    expect(formatMissingCapabilitiesWarning('export', ['xlsx:styles', 'xlsx:protection']))
      .toBe('The xlsx export skipped features your license does not unlock: xlsx:styles, xlsx:protection.');
    expect(formatMissingCapabilitiesWarning('import', ['xlsx:styles']))
      .toBe('The xlsx import skipped features your license does not unlock: xlsx:styles.');
  });
});
