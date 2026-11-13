import { registerAllModules } from 'handsontable/registry';
import { Filters } from 'handsontable/plugins/filters';
import { hasLicenseCapability } from 'handsontable/utils/licenseCapabilities';
import { registerAsRootInstance } from 'handsontable/utils/rootInstance';
import { getXlsxEntitlement } from 'handsontable/core/license';
import { XLSX_TIERS_BY_ID } from 'handsontable/utils/xlsxEngine/licenseCapabilities';
import { payloadOf } from './buildTestKey';
import { resetTierKeys, tierKeyWith, tierKeyWithout } from './tierKeys';

registerAllModules();

/**
 * A stand-in for a root grid: the license gates read only the settings and whether it is a root grid.
 *
 * @param {string} licenseKey The `licenseKey` setting.
 * @returns {object}
 */
function gridWithKey(licenseKey) {
  const hot = { getSettings: () => ({ licenseKey }) };

  registerAsRootInstance(hot);

  return hot;
}

/**
 * Returns the test tiers left in `XLSX_TIERS_BY_ID` and on the license of Filters.
 *
 * @returns {string[]}
 */
function leftoverTestTiers() {
  return [...Object.values(XLSX_TIERS_BY_ID).flat(), ...Filters.LICENSE.tiers]
    .filter(tier => tier.startsWith('test_tier_'));
}

describe('tier test keys', () => {
  afterEach(() => {
    resetTierKeys();
  });

  it('should build a key that unlocks everything but the named features', () => {
    const hot = gridWithKey(tierKeyWithout(['feat:filters', 'xlsx:styles']));

    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(false);
    expect(hasLicenseCapability(hot, 'feat:copy_paste')).toBe(true);
    expect(getXlsxEntitlement(hot).missing).toEqual(['xlsx:styles']);
  });

  it('should build a key that unlocks only the named features', () => {
    const hot = gridWithKey(tierKeyWith(['feat:filters']));

    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:copy_paste')).toBe(false);
  });

  it('should build a key that unlocks only the named xlsx features', () => {
    const hot = gridWithKey(tierKeyWith(['xlsx:import', 'xlsx:styles']));

    expect(getXlsxEntitlement(hot).import).toBe(true);
    expect(getXlsxEntitlement(hot).styles).toBe(true);
    expect(getXlsxEntitlement(hot).export).toBe(false);
  });

  it('should make a new key on each call, and keep the earlier keys working', () => {
    const first = tierKeyWith(['feat:filters']);
    const second = tierKeyWithout(['feat:filters']);

    expect(first).not.toBe(second);
    expect(hasLicenseCapability(gridWithKey(first), 'feat:filters')).toBe(true);
    expect(hasLicenseCapability(gridWithKey(first), 'feat:copy_paste')).toBe(false);
    expect(hasLicenseCapability(gridWithKey(second), 'feat:filters')).toBe(false);
    expect(hasLicenseCapability(gridWithKey(second), 'feat:copy_paste')).toBe(true);
  });

  it('should pass the flags on to the key', () => {
    const hot = gridWithKey(tierKeyWith(['feat:filters'], ['no-console-warns']));

    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:copy_paste')).toBe(false);
  });

  it('should build a key with the license window it is given', () => {
    const licenseKey = tierKeyWith(['feat:filters'], [], { release_until: '2020-01-01' });
    const hot = gridWithKey(licenseKey);

    expect(payloadOf(licenseKey).products.handsontable).toMatchObject({ release_until: '2020-01-01' });
    expect(payloadOf(licenseKey).products.handsontable.usage_until).toBeUndefined();
    expect(hasLicenseCapability(hot, 'feat:filters')).toBe(true);
    expect(hasLicenseCapability(hot, 'feat:copy_paste')).toBe(false);
  });

  it('should leave no test tier behind after resetTierKeys()', () => {
    tierKeyWithout([]);
    resetTierKeys();

    expect(Object.values(XLSX_TIERS_BY_ID).flat().filter(tier => tier.startsWith('test_tier_'))).toEqual([]);
    expect(Filters.LICENSE.tiers.filter(tier => tier.startsWith('test_tier_'))).toEqual([]);
  });

  it('should never change the shipped table, which is frozen, and put it back after resetTierKeys()', () => {
    const shipped = XLSX_TIERS_BY_ID;

    expect(Object.isFrozen(shipped)).toBe(true);
    expect(Object.values(shipped).every(tiers => Object.isFrozen(tiers))).toBe(true);

    tierKeyWithout([]);

    expect(XLSX_TIERS_BY_ID).not.toBe(shipped);
    expect(Object.values(shipped).flat().filter(tier => tier.startsWith('test_tier_'))).toEqual([]);

    resetTierKeys();

    expect(XLSX_TIERS_BY_ID).toBe(shipped);
  });

  it('should leave no test tier behind after two calls and resetTierKeys()', () => {
    tierKeyWithout([]);
    tierKeyWith(['feat:filters', 'xlsx:import']);
    resetTierKeys();

    expect(leftoverTestTiers()).toEqual([]);
    expect(Object.getOwnPropertyDescriptor(Filters, 'LICENSE').get.mock).toBeUndefined();
  });
});
