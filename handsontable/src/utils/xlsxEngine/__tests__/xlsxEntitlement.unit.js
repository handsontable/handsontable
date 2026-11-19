import { buildTestKey } from '../../entitlementLicenseKey/__tests__/buildTestKey';
import { SUBSCRIPTION_KEY, HF_ONLY_KEY } from '../../entitlementLicenseKey/__tests__/fixtures';
import { _getLicenseState } from '../../../helpers/mixed';
import { XLSX_CAPABILITY_IDS, XLSX_FLAG_BY_ID, XLSX_TIERS_BY_ID } from '../licenseCapabilities';
import { keyWithTier } from '../../entitlementLicenseKey/__tests__/xlsxLicenseKeys';
import {
  UNRESTRICTED_XLSX_ENTITLEMENT,
  resolveXlsxEntitlement,
  scopeXlsxEntitlement,
  formatMissingCapabilitiesWarning,
} from '../xlsxEntitlement';

/**
 * An arbitrary subset of the xlsx tokens, chosen so a key both grants some tokens and lacks others. It
 * is not a product package: which tokens a product grants is decided where keys are issued, never here.
 */
const PARTIAL_TOKENS = ['xlsx:import', 'xlsx:export', 'xlsx:formulas', 'xlsx:layout'];

/**
 * Reads a test key granting `core` plus `capabilities` and returns the tiers the resolver takes, read
 * the way the grid reads them (`_getLicenseState`).
 *
 * @param {string[]} capabilities The capability tokens besides `core`.
 * @param {string[]} flags The product flags.
 * @returns {string[]|null} The tiers.
 */
const keyOf = (capabilities, flags) => _getLicenseState(buildTestKey({
  products: {
    handsontable: {
      capabilities: ['core', ...capabilities], release_until: '2099-12-31', notice: 60, grace: 90, flags,
    },
  },
})).tiers;

/**
 * The tier these tests unlock features with, and the map that lets it unlock exactly `ids`.
 *
 * @param {string[]} ids The feature ids the tier unlocks.
 * @returns {object}
 */
const tierUnlocking = ids => Object.fromEntries(XLSX_CAPABILITY_IDS.map(id => [id, ids.includes(id) ? ['t'] : []]));

describe('xlsxEngine/xlsxEntitlement', () => {
  it('drives exactly the XlsxEntitlement flags with the generated flag names', () => {
    // `XLSX_FLAG_BY_ID` is generated from features.json; the interface is written by hand.
    const tokenFlags = Object.keys(UNRESTRICTED_XLSX_ENTITLEMENT)
      .filter(key => key !== 'missing' && key !== 'importReport');

    XLSX_CAPABILITY_IDS.forEach(id => expect(tokenFlags).toContain(XLSX_FLAG_BY_ID[id]));
    expect(Object.values(XLSX_FLAG_BY_ID).sort()).toEqual(tokenFlags.sort());
  });

  it('is unrestricted for a key that names no tier', () => {
    expect(resolveXlsxEntitlement(null)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
    expect(UNRESTRICTED_XLSX_ENTITLEMENT.missing).toEqual([]);
    expect(Object.values(UNRESTRICTED_XLSX_ENTITLEMENT).filter(v => v === false)).toEqual([]);
  });

  it('is unrestricted for a license state with no tiers field', () => {
    expect(resolveXlsxEntitlement(undefined)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
    expect(resolveXlsxEntitlement({}.tiers)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('is unrestricted for a key that names no tier, whatever it lists or flags', () => {
    expect(resolveXlsxEntitlement(keyOf(PARTIAL_TOKENS, []))).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
    expect(resolveXlsxEntitlement(keyOf([], []))).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
    expect(resolveXlsxEntitlement(keyOf(PARTIAL_TOKENS, ['no-console-warns']))).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
    expect(resolveXlsxEntitlement(keyOf(['xlsx:import'], ['listed-capabilities']))).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('is unrestricted for a generator-issued key (no flag)', () => {
    expect(resolveXlsxEntitlement(_getLicenseState(SUBSCRIPTION_KEY).tiers)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('is unrestricted for a key that does not grant handsontable', () => {
    expect(resolveXlsxEntitlement(_getLicenseState(HF_ONLY_KEY).tiers)).toBe(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('gates on exactly the features the key\'s tier unlocks', () => {
    const e = resolveXlsxEntitlement(['t'], tierUnlocking(PARTIAL_TOKENS));

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

  XLSX_CAPABILITY_IDS.forEach((token) => {
    it(`turns off only the ${token} flag for a tier that unlocks every other feature`, () => {
      const e = resolveXlsxEntitlement(['t'], tierUnlocking(XLSX_CAPABILITY_IDS.filter(id => id !== token)));

      expect(Object.entries(e).filter(([name, value]) => name !== 'missing' && value !== true).map(([name]) => name))
        .toEqual([XLSX_FLAG_BY_ID[token]]);
      expect(e.missing).toEqual([token]);
    });

    it(`turns on only the ${token} flag (and the report) for a tier that unlocks it alone`, () => {
      const e = resolveXlsxEntitlement(['t'], tierUnlocking([token]));

      expect(Object.entries(e).filter(([name, value]) => name !== 'missing' && value === true).map(([name]) => name)
        .sort()).toEqual(['importReport', XLSX_FLAG_BY_ID[token]].sort());
      expect(e.missing).toEqual(XLSX_CAPABILITY_IDS.filter(id => id !== token));
    });
  });

  it('reports nothing missing for a tier that unlocks every feature and matches the unrestricted flags', () => {
    const e = resolveXlsxEntitlement(['t'], tierUnlocking(XLSX_CAPABILITY_IDS));

    expect(e.missing).toEqual([]);
    expect({ ...e, missing: [] }).toEqual(UNRESTRICTED_XLSX_ENTITLEMENT);
  });

  it('never lists xlsx:import_report as missing, even when the key lists it', () => {
    expect(resolveXlsxEntitlement(keyOf(['tier:zz_unknown', 'xlsx:import_report'], [])).missing)
      .not.toContain('xlsx:import_report');
  });

  it('returns frozen objects and a fresh missing array', () => {
    const e = resolveXlsxEntitlement(['t'], tierUnlocking(['xlsx:import']));

    expect(Object.isFrozen(e)).toBe(true);
    expect(Object.isFrozen(e.missing)).toBe(true);
  });

  it('scopes the missing list to the tokens a plugin gates', () => {
    const e = resolveXlsxEntitlement(['t'], tierUnlocking(['xlsx:export', 'xlsx:formulas']));
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

  describe('a key that names a tier', () => {
    const tiersById = Object.fromEntries(XLSX_CAPABILITY_IDS.map(id => [id, ['beta']]));

    tiersById['xlsx:import'] = ['alpha', 'beta'];
    tiersById['xlsx:export'] = ['alpha', 'beta'];

    const entitlementOf = key => resolveXlsxEntitlement(_getLicenseState(key).tiers, tiersById);

    it('turns on exactly the features whose tiers list it', () => {
      const entitlement = entitlementOf(keyWithTier(['alpha']));

      expect(entitlement.import).toBe(true);
      expect(entitlement.export).toBe(true);
      expect(entitlement.styles).toBe(false);
      expect(entitlement.missing)
        .toEqual(XLSX_CAPABILITY_IDS.filter(id => id !== 'xlsx:import' && id !== 'xlsx:export'));
    });

    it('turns on every feature for a tier every feature lists', () => {
      expect(entitlementOf(keyWithTier(['beta'])).missing).toEqual([]);
    });

    it('turns everything off but the report for a tier no feature lists', () => {
      const entitlement = entitlementOf(keyWithTier(['zz_unknown']));

      expect(entitlement.importReport).toBe(true);
      expect(entitlement.missing).toEqual([...XLSX_CAPABILITY_IDS]);
    });

    it('does not throw for a tier named after an Object.prototype member', () => {
      expect(() => entitlementOf(keyWithTier(['constructor']))).not.toThrow();
      expect(entitlementOf(keyWithTier(['constructor'])).styles).toBe(false);
    });

    it('reads the generated map by default', () => {
      const [tier] = XLSX_TIERS_BY_ID['xlsx:export'];
      const { tiers } = _getLicenseState(keyWithTier([tier]));

      expect(resolveXlsxEntitlement(tiers).export).toBe(true);
      // A tier the generated map does not list turns every gated feature off.
      expect(resolveXlsxEntitlement(['zz_unknown']).missing).toEqual([...XLSX_CAPABILITY_IDS]);
      expect(resolveXlsxEntitlement(['zz_unknown']).export).toBe(false);
    });
  });
});
