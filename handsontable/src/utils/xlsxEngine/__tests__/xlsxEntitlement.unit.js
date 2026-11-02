import { buildTestKey } from '../../entitlementLicenseKey/__tests__/buildTestKey';
import { SUBSCRIPTION_KEY, HF_ONLY_KEY } from '../../entitlementLicenseKey/__tests__/fixtures';
import {
  extractEntitlementKeyData,
  getProductEntitlement,
  getLicenseGrants,
  UNRESTRICTED_GRANTS,
} from '../../entitlementLicenseKey';
import { XLSX_CAPABILITY_IDS } from '../licenseCapabilities';
import {
  UNRESTRICTED_XLSX_ENTITLEMENT,
  resolveXlsxEntitlement,
  scopeXlsxEntitlement,
  formatMissingCapabilitiesWarning,
} from '../xlsxEntitlement';

const STANDARD_TOKENS = ['xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout'];
const FLAG = 'listed-capabilities';

/**
 * Reads a test key granting `core` plus `capabilities` and returns the two things the resolver takes:
 * the handsontable product entry and the grants.
 *
 * @param {string[]} capabilities The capability tokens besides `core`.
 * @param {string[]} [flags] The product flags.
 * @returns {Array} `[entitlement, grants]`.
 */
const keyOf = (capabilities, flags = [FLAG]) => {
  const keyData = extractEntitlementKeyData(buildTestKey({
    products: {
      handsontable: {
        capabilities: ['core', ...capabilities], usage_until: '2027-08-12', notice: 60, grace: 90, flags,
      },
    },
  }));

  return [getProductEntitlement(keyData, 'handsontable'), getLicenseGrants(keyData)];
};

describe('xlsxEngine/xlsxEntitlement', () => {
  it('is unrestricted for unrestricted grants', () => {
    expect(resolveXlsxEntitlement(null, UNRESTRICTED_GRANTS)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
    expect(resolveXlsxEntitlement(keyOf(STANDARD_TOKENS)[0], UNRESTRICTED_GRANTS)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
    expect(UNRESTRICTED_XLSX_ENTITLEMENT.missing).toEqual([]);
    expect(Object.values(UNRESTRICTED_XLSX_ENTITLEMENT).filter(v => v === false)).toEqual([]);
  });

  it('is unrestricted for a key without the listed-capabilities flag, whatever it lists', () => {
    expect(resolveXlsxEntitlement(...keyOf(STANDARD_TOKENS, []))).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
    expect(resolveXlsxEntitlement(...keyOf([], []))).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
    expect(resolveXlsxEntitlement(...keyOf(STANDARD_TOKENS, ['no-console-warns']))).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('is unrestricted for a generator-issued key (no flag)', () => {
    const keyData = extractEntitlementKeyData(SUBSCRIPTION_KEY);

    expect(resolveXlsxEntitlement(getProductEntitlement(keyData, 'handsontable'), getLicenseGrants(keyData)))
      .toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('is unrestricted for a key that does not grant handsontable', () => {
    const keyData = extractEntitlementKeyData(HF_ONLY_KEY);

    expect(resolveXlsxEntitlement(getProductEntitlement(keyData, 'handsontable'), getLicenseGrants(keyData)))
      .toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('grants nothing but the report for a flagged key with no xlsx token', () => {
    const e = resolveXlsxEntitlement(...keyOf([]));

    expect(Object.entries(e).filter(([name, value]) => name !== 'missing' && value === true).map(([name]) => name))
      .toEqual(['importReport']);
    expect(e.missing).toEqual(XLSX_CAPABILITY_IDS);
  });

  it('gates on exactly the listed tokens of a flagged key', () => {
    const e = resolveXlsxEntitlement(...keyOf(STANDARD_TOKENS));

    expect(e).toMatchObject({
      import: true,
      export: true,
      formulas: true,
      layout: true,
      numberFormats: false,
      comments: false,
      importReport: true,
      styles: false,
      conditionalFormatting: false,
      dataValidation: false,
      protection: false,
    });
    expect(e.missing).toEqual([
      'xlsx:number_formats', 'xlsx:comments', 'xlsx:styles',
      'xlsx:conditional_formatting', 'xlsx:data_validation', 'xlsx:protection',
    ]);
  });

  it('grants nothing for a flagged key with only an unknown xlsx token', () => {
    const e = resolveXlsxEntitlement(...keyOf(['xlsx:future']));

    expect(e.import).toBe(false);
    expect(e.importReport).toBe(true);
    expect(e.missing).toEqual(XLSX_CAPABILITY_IDS);
  });

  it('never lists xlsx:import_report as missing, even when the key lists it', () => {
    expect(resolveXlsxEntitlement(...keyOf(['xlsx:import_report'])).missing).not.toContain('xlsx:import_report');
  });

  it('reports nothing missing for a full flagged key and matches the unrestricted flags', () => {
    const e = resolveXlsxEntitlement(...keyOf(XLSX_CAPABILITY_IDS));

    expect(e.missing).toEqual([]);
    expect({ ...e, missing: [] }).toEqual(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('grants every xlsx flag to a flagged key that lists xlsx:all', () => {
    const e = resolveXlsxEntitlement(...keyOf(['xlsx:all']));

    expect(Object.entries(e).filter(([name, value]) => name !== 'missing' && value !== true)).toEqual([]);
    expect(e.missing).toEqual([]);
    expect({ ...e, missing: [] }).toEqual(UNRESTRICTED_XLSX_ENTITLEMENT);
    expect(Object.isFrozen(e)).toBe(true);
    expect(resolveXlsxEntitlement(...keyOf(['xlsx:all'], [FLAG, 'no-console-warns'])).missing).toEqual([]);
  });

  it('returns frozen objects and a fresh missing array', () => {
    const e = resolveXlsxEntitlement(...keyOf(['xlsx:import']));

    expect(Object.isFrozen(e)).toBe(true);
    expect(Object.isFrozen(e.missing)).toBe(true);
  });

  it('scopes the missing list to the tokens a plugin gates', () => {
    const e = resolveXlsxEntitlement(...keyOf(['xlsx:export', 'xlsx:formulas']));
    const scoped = scopeXlsxEntitlement(e, ['xlsx:import', 'xlsx:styles', 'xlsx:comments']);

    expect(scoped.missing).toEqual(['xlsx:import', 'xlsx:comments', 'xlsx:styles']);
    expect(scoped.styles).toBe(false);
    expect(scoped.export).toBe(true);
    expect(Object.isFrozen(scoped)).toBe(true);
    expect(Object.isFrozen(scoped.missing)).toBe(true);
    expect(scopeXlsxEntitlement(UNRESTRICTED_XLSX_ENTITLEMENT, ['xlsx:import'])).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('formats the warning with the operation and the ids', () => {
    expect(formatMissingCapabilitiesWarning('export', ['xlsx:styles', 'xlsx:protection']))
      .toBe('The xlsx export skipped features your license does not unlock: xlsx:styles, xlsx:protection.');
    expect(formatMissingCapabilitiesWarning('import', ['xlsx:styles']))
      .toBe('The xlsx import skipped features your license does not unlock: xlsx:styles.');
  });
});
