import { TEST_LICENSE_KEY } from '../helpers/licenseKey';
import { _getLicenseState } from '../../src/helpers/mixed';
import {
  extractEntitlementKeyData,
  getProductEntitlement,
} from '../../src/utils/entitlementLicenseKey/extractKeyData';

/**
 * Pins what every test suite assumes about the internal test key: it reads as valid for this build, names
 * no tier, and carries no flag, so a grid built with it is unlocked, unrestricted and silent. A renewed key
 * that names a tier or a flag would restrict or decorate every grid of every suite, with nothing but a
 * console line to show for it; this test fails first.
 */
describe('The internal test license key', () => {
  // Set by `hot.config.js` (dd/mm/yyyy), the date the bundles inline.
  const releaseDate = process.env.HOT_RELEASE_DATE;

  /**
   * Reads the key's Handsontable entry.
   *
   * @returns {object}
   */
  function readEntry() {
    const data = extractEntitlementKeyData(TEST_LICENSE_KEY);

    expect(data).not.toBeNull();

    return getProductEntitlement(data, 'handsontable');
  }

  it('should read as an entitlement key with a Handsontable entry', () => {
    expect(readEntry()).not.toBeNull();
  });

  it('should name no tier and carry no flag', () => {
    const entry = readEntry();

    expect(entry.capabilities.filter(token => token.startsWith('tier:'))).toEqual([]);
    expect(entry.flags).toEqual([]);
  });

  it('should leave this build unlocked, unrestricted and silent', () => {
    expect(releaseDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);

    const state = _getLicenseState(TEST_LICENSE_KEY, releaseDate);

    expect(state.lifecycle.state).toBe('release_valid');
    expect(state.lifecycle.isTrial).toBe(false);
    expect(state.tiers).toBeNull();
    expect(state.attributionBar).toBe(false);
    expect(state.channels).toEqual({ console: true, ui: true });
  });

  it('should cover builds released at least a year after this one', () => {
    // The key works for builds released on or before its `release_until`. Renew it before that comes
    // within a year of the build, so every suite does not lock at once on the first build past it.
    const { release_until: releaseUntil } = readEntry();
    const [day, month, year] = releaseDate.split('/').map(Number);
    const oneYearAfterBuild = Date.UTC(year + 1, month - 1, day);

    expect(releaseUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Date.parse(`${releaseUntil}T00:00:00Z`)).toBeGreaterThanOrEqual(oneYearAfterBuild);
  });
});
