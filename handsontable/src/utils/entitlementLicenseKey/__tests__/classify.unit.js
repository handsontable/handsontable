import { extractEntitlementKeyData, getProductEntitlement } from '../extractKeyData';
import { classifyEntitlement, resolveChannels } from '../classify';
import { buildTestKey } from './buildTestKey';
import {
  SUBSCRIPTION_KEY,
  SUBSCRIPTION_EXTERNAL_KEY,
  NO_CONSOLE_WARNS_KEY,
  NO_UI_WARNS_KEY,
  NO_NOTICE_KEY,
  CUSTOM_FLAG_KEY,
  TRIAL_KEY,
  PERPETUAL_KEY,
} from './fixtures';

const BUILD_DATE = '2026-08-12';

/**
 * Reads the verified Handsontable entitlement out of a license key.
 *
 * @param {string} licenseKey The license key.
 * @returns {object}
 */
function entitlementOf(licenseKey) {
  return getProductEntitlement(extractEntitlementKeyData(licenseKey), 'handsontable');
}

/**
 * Forges a verified Handsontable entitlement, for the boundaries no real key expresses.
 *
 * @param {object} overrides The product entry fields to set.
 * @returns {object}
 */
function forgedEntitlement(overrides) {
  return entitlementOf(buildTestKey({
    products: {
      handsontable: {
        capabilities: ['core'], notice: 60, grace: 90, flags: [], ...overrides,
      },
    },
  }));
}

/**
 * Classifies an entitlement at one instant.
 *
 * @param {object} entitlement The verified product entry.
 * @param {string} instant The current instant, as an ISO string in UTC.
 * @param {string} [buildDate] The build release date ("YYYY-MM-DD").
 * @returns {object}
 */
function at(entitlement, instant, buildDate = BUILD_DATE) {
  return classifyEntitlement(entitlement, { now: Date.parse(instant), buildDate });
}

describe('entitlementLicenseKey/classify', () => {
  describe('usage_until - the named day is licensed in full (J1)', () => {
    const subscription = () => entitlementOf(SUBSCRIPTION_KEY);

    it.each([
      ['2027-08-11T23:59:59Z', 'usage_notice', 1],
      ['2027-08-12T00:00:00Z', 'usage_notice', 0],
      ['2027-08-12T12:00:00Z', 'usage_notice', 0],
      ['2027-08-12T23:59:59Z', 'usage_notice', 0],
    ])('should keep the license valid at %s', (instant, state, daysRemaining) => {
      expect(at(subscription(), instant)).toEqual({
        state,
        isTrial: false,
        daysRemaining,
        licensedUntil: '2027-08-12',
      });
    });

    it('should stop the license at the UTC midnight that follows the last licensed day', () => {
      expect(at(subscription(), '2027-08-13T00:00:00Z').state).toBe('usage_soft_stop');
    });
  });

  describe('usage_until - the notice window (J2)', () => {
    const subscription = () => entitlementOf(SUBSCRIPTION_KEY);

    it('should stay silent one day before the window opens', () => {
      expect(at(subscription(), '2027-06-12T23:59:59Z')).toMatchObject({
        state: 'usage_valid',
        daysRemaining: 61,
      });
    });

    it('should open the window exactly "notice" days before the last licensed day', () => {
      expect(at(subscription(), '2027-06-13T00:00:00Z')).toMatchObject({
        state: 'usage_notice',
        daysRemaining: 60,
      });
    });

    it('should never warn when the key asks for no advance warning (E2)', () => {
      const noNotice = entitlementOf(NO_NOTICE_KEY);

      expect(at(noNotice, '2027-08-12T23:59:59Z').state).toBe('usage_valid');
      expect(at(noNotice, '2027-08-13T00:00:00Z').state).toBe('usage_soft_stop');
    });
  });

  describe('usage_until - the grace window (J3)', () => {
    const subscription = () => entitlementOf(SUBSCRIPTION_KEY);

    it('should hold the soft stop through the last moment of grace', () => {
      expect(at(subscription(), '2027-11-10T23:59:59Z').state).toBe('usage_soft_stop');
    });

    it('should hard stop once the grace period is over', () => {
      expect(at(subscription(), '2027-11-11T00:00:00Z').state).toBe('usage_hard_stop');
    });

    it('should hard stop immediately when the key grants no grace', () => {
      const noGrace = forgedEntitlement({ usage_until: '2027-08-12', grace: 0 });

      expect(at(noGrace, '2027-08-12T23:59:59Z').state).toBe('usage_notice');
      expect(at(noGrace, '2027-08-13T00:00:00Z').state).toBe('usage_hard_stop');
    });
  });

  describe('usage_until - one instant, one verdict (J4, J5)', () => {
    it('should read the same at an instant that falls on two different local dates', () => {
      // 2027-08-12T22:00:00Z is the 12th in Pago Pago and the 13th in Auckland. The last licensed
      // day is the 12th in UTC, and that is the only calendar the verdict may consult.
      expect(at(entitlementOf(SUBSCRIPTION_KEY), '2027-08-12T22:00:00Z').state).toBe('usage_notice');
    });
  });

  describe('usage_until - leap day (J7)', () => {
    it('should license 29 February in full', () => {
      const leap = forgedEntitlement({ usage_until: '2028-02-29', notice: 0 });

      expect(at(leap, '2028-02-29T23:59:59Z').state).toBe('usage_valid');
      expect(at(leap, '2028-03-01T00:00:00Z').state).toBe('usage_soft_stop');
    });

    it('should open a notice window that crosses February on a real date', () => {
      const crossing = forgedEntitlement({ usage_until: '2028-03-15', notice: 30 });

      expect(at(crossing, '2028-02-13T23:59:59Z').state).toBe('usage_valid');
      expect(at(crossing, '2028-02-14T00:00:00Z')).toMatchObject({
        state: 'usage_notice',
        daysRemaining: 30,
      });
    });
  });

  describe('the trial flag', () => {
    const trial = () => entitlementOf(TRIAL_KEY);

    it('should run the same windows, worded as a trial', () => {
      expect(at(trial(), '2026-09-26T23:59:59Z')).toEqual({
        state: 'trial_notice',
        isTrial: true,
        daysRemaining: 0,
        licensedUntil: '2026-09-26',
      });
      expect(at(trial(), '2026-09-27T00:00:00Z').state).toBe('trial_soft_stop');
      expect(at(trial(), '2026-10-11T23:59:59Z').state).toBe('trial_soft_stop');
      expect(at(trial(), '2026-10-12T00:00:00Z').state).toBe('trial_hard_stop');
    });

    it('should stay quiet while the trial is outside its notice window', () => {
      const longTrial = forgedEntitlement({ usage_until: '2027-08-12', notice: 5, flags: ['trial'] });

      expect(at(longTrial, '2027-01-01T00:00:00Z')).toMatchObject({
        state: 'trial_valid',
        isTrial: true,
      });
    });
  });

  describe('release_until - static against static (J8, J9)', () => {
    const perpetual = () => entitlementOf(PERPETUAL_KEY);

    it.each([
      ['2027-08-11', 'release_valid'],
      ['2027-08-12', 'release_valid'],
      ['2027-08-13', 'release_expired'],
    ])('should compare a build released on %s against the maintenance date', (buildDate, state) => {
      expect(at(perpetual(), '2026-08-12T00:00:00Z', buildDate)).toEqual({
        state,
        isTrial: false,
        daysRemaining: null,
        licensedUntil: '2027-08-12',
      });
    });

    it('should never read the clock', () => {
      ['1999-01-01T00:00:00Z', '2035-01-01T00:00:00Z', '2027-12-31T23:59:59Z'].forEach((instant) => {
        expect(at(perpetual(), instant, '2027-08-12').state).toBe('release_valid');
      });
    });

    it('should stay valid when the build release date is unavailable or unreadable', () => {
      const lapsed = forgedEntitlement({ usage_until: undefined, release_until: '2020-01-01', notice: 0, grace: 0 });

      expect(at(lapsed, '2026-08-12T00:00:00Z', '').state).toBe('release_valid');
      expect(at(lapsed, '2026-08-12T00:00:00Z', 'not-a-date').state).toBe('release_valid');
      expect(at(lapsed, '2026-08-12T00:00:00Z', '2026-08-12').state).toBe('release_expired');
    });
  });

  describe('resolveChannels', () => {
    it('should leave both channels open for a key with no silencing flag', () => {
      expect(resolveChannels(entitlementOf(SUBSCRIPTION_KEY))).toEqual({ console: true, ui: true });
    });

    it('should close both channels for a key issued for external use', () => {
      expect(resolveChannels(entitlementOf(SUBSCRIPTION_EXTERNAL_KEY))).toEqual({ console: false, ui: false });
    });

    it('should close one channel without the other', () => {
      expect(resolveChannels(entitlementOf(NO_CONSOLE_WARNS_KEY))).toEqual({ console: false, ui: true });
      expect(resolveChannels(entitlementOf(NO_UI_WARNS_KEY))).toEqual({ console: true, ui: false });
    });

    it('should ignore a flag that silences nothing', () => {
      expect(resolveChannels(entitlementOf(CUSTOM_FLAG_KEY))).toEqual({ console: true, ui: true });
    });
  });
});
