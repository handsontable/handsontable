import { extractTypedKeyData } from '../extractKeyData';
import { classifyTypedKeyState } from '../classify';
import { buildTestKey } from './buildTestKey';
import {
  FREEMIUM_KEY,
  PERPETUAL_KEY,
  HF_ONLY_KEY,
  FIXTURE_EXPIRY_TIMESTAMP,
} from './fixtures';

const DAY = 86400000;

/**
 * Builds a verified typed key for one Handsontable product entry, so a test can
 * fix the expiry and grace precisely.
 *
 * @param {string} tag The type tag.
 * @param {object} handsontable The Handsontable product payload entry.
 * @returns {object} The extracted key data.
 */
function keyData(tag, handsontable) {
  return extractTypedKeyData(buildTestKey(tag, {
    v: 1,
    holder: 'x',
    products: { handsontable },
  }));
}

/**
 * Classifies a key at a given wall-clock time (build time is irrelevant for
 * trial/subscription).
 *
 * @param {object} data The extracted key data.
 * @param {number} now The current time in epoch milliseconds.
 * @returns {object|null}
 */
function at(data, now) {
  return classifyTypedKeyState(data, { now, buildTimestamp: 0 });
}

describe('typedLicenseKey/classifyTypedKeyState', () => {
  describe('freemium', () => {
    it('should always be in the freemium state and never expire', () => {
      const result = classifyTypedKeyState(extractTypedKeyData(FREEMIUM_KEY), { now: 5e12, buildTimestamp: 5e12 });

      expect(result.state).toBe('freemium');
      expect(result.daysRemaining).toBe(null);
      expect(result.expiryTimestamp).toBe(null);
      expect(result.hardStopTimestamp).toBe(null);
    });
  });

  describe('trial (grace 15)', () => {
    const data = keyData('[TRIAL]', { tier: 'enterprise', mode: 'internal', exp: '2026-08-01', grace: 15 });
    const expiry = Date.UTC(2026, 7, 1);
    const hardStop = expiry + (15 * DAY);

    it('should be active before expiry', () => {
      const result = at(data, expiry - (3 * DAY));

      expect(result.state).toBe('trial_active');
      expect(result.daysRemaining).toBe(3);
      expect(result.expiryTimestamp).toBe(expiry);
      expect(result.hardStopTimestamp).toBe(hardStop);
    });

    it('should count a partial day as one day left', () => {
      expect(at(data, expiry - 1).daysRemaining).toBe(1);
    });

    it('should be soft-expired at expiry and within grace', () => {
      expect(at(data, expiry).state).toBe('trial_expired');
      expect(at(data, hardStop - 1).state).toBe('trial_expired');
    });

    it('should be hard-expired at and after the hard stop', () => {
      expect(at(data, hardStop).state).toBe('trial_expired_hard');
      expect(at(data, hardStop + DAY).state).toBe('trial_expired_hard');
    });
  });

  describe('subscription (grace 90)', () => {
    const data = keyData('[SUB]', { tier: 'enterprise', mode: 'internal', exp: '2026-08-01', grace: 90 });
    const expiry = Date.UTC(2026, 7, 1);
    const hardStop = expiry + (90 * DAY);

    it('should be silently active more than 60 days out', () => {
      expect(at(data, expiry - (61 * DAY)).state).toBe('sub_active');
    });

    it('should be ending-soon at exactly 60 days out', () => {
      expect(at(data, expiry - (60 * DAY)).state).toBe('sub_ending');
    });

    it('should be ending-soon within the last day', () => {
      const result = at(data, expiry - 1);

      expect(result.state).toBe('sub_ending');
      expect(result.daysRemaining).toBe(1);
    });

    it('should be expired at expiry and within grace', () => {
      expect(at(data, expiry).state).toBe('sub_expired');
      expect(at(data, hardStop - 1).state).toBe('sub_expired');
    });

    it('should be hard-expired at and after the hard stop', () => {
      expect(at(data, hardStop).state).toBe('sub_expired_hard');
      expect(at(data, hardStop + DAY).state).toBe('sub_expired_hard');
    });
  });

  describe('subscription grace fallback', () => {
    it('should default the grace to 90 days when the payload omits it', () => {
      const data = keyData('[SUB]', { tier: 'enterprise', mode: 'internal', exp: '2026-08-01' });
      const expiry = Date.UTC(2026, 7, 1);

      expect(at(data, expiry + (89 * DAY)).state).toBe('sub_expired');
      expect(at(data, expiry + (90 * DAY)).state).toBe('sub_expired_hard');
    });
  });

  describe('trial grace fallback', () => {
    it('should default the grace to 15 days when the payload omits it', () => {
      const data = keyData('[TRIAL]', { tier: 'enterprise', mode: 'internal', exp: '2026-08-01' });
      const expiry = Date.UTC(2026, 7, 1);

      expect(at(data, expiry + (14 * DAY)).state).toBe('trial_expired');
      expect(at(data, expiry + (15 * DAY)).state).toBe('trial_expired_hard');
    });
  });

  describe('perpetual (compared against the build release date)', () => {
    const data = extractTypedKeyData(PERPETUAL_KEY);
    const maintenanceEnd = FIXTURE_EXPIRY_TIMESTAMP;

    it('should be valid when the build predates maintenance end', () => {
      const result = classifyTypedKeyState(data, { now: 9e15, buildTimestamp: maintenanceEnd - DAY });

      expect(result.state).toBe('perp_valid');
      expect(result.expiryTimestamp).toBe(maintenanceEnd);
    });

    it('should be valid on the maintenance-end date itself', () => {
      expect(classifyTypedKeyState(data, { now: 0, buildTimestamp: maintenanceEnd }).state).toBe('perp_valid');
    });

    it('should be expired when the build postdates maintenance end', () => {
      expect(classifyTypedKeyState(data, { now: 0, buildTimestamp: maintenanceEnd + DAY }).state).toBe('perp_expired');
    });

    it('should ignore the wall clock entirely', () => {
      // Same build date, wildly different "now" -> same verdict (airgap-safe).
      const a = classifyTypedKeyState(data, { now: 0, buildTimestamp: maintenanceEnd - DAY });
      const b = classifyTypedKeyState(data, { now: 9e15, buildTimestamp: maintenanceEnd - DAY });

      expect(a.state).toBe(b.state);
    });

    it('should fail OPEN (valid) when the build date is unavailable (NaN)', () => {
      // A bundler consuming the source without the build-time define step resolves the release
      // date to '' -> NaN. The legacy path fails open in that environment, and a paying customer
      // must never see "expired" because of a build defect.
      expect(classifyTypedKeyState(data, { now: 0, buildTimestamp: NaN }).state).toBe('perp_valid');
    });
  });

  describe('keys that do not grant Handsontable', () => {
    it('should return null for a HyperFormula-only key', () => {
      expect(classifyTypedKeyState(extractTypedKeyData(HF_ONLY_KEY), { now: 0, buildTimestamp: 0 })).toBe(null);
    });
  });
});
