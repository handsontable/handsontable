/* eslint no-console: off */
import {
  SUBSCRIPTION_KEY,
  SUBSCRIPTION_KEY_WITH_PROSE,
  SUBSCRIPTION_EXTERNAL_KEY,
  NO_CONSOLE_WARNS_KEY,
  NO_UI_WARNS_KEY,
  TRIAL_KEY,
  TRIAL_NO_CONSOLE_WARNS_KEY,
  TRIAL_NO_UI_WARNS_KEY,
  PERPETUAL_KEY,
  PERPETUAL_NO_UI_WARNS_KEY,
  HF_ONLY_KEY,
} from '../../utils/entitlementLicenseKey/__tests__/fixtures';

const LICENSE_INFO_CLASS = 'hot-display-license-info';
// Reference instants inside each window of the fixtures, so no test ever touches the real clock.
// The trial fixture runs to 2026-09-26 (notice 45, grace 15); the subscription one to 2027-08-12
// (notice 60, grace 90).
const TRIAL_RUNNING = Date.parse('2026-09-16T00:00:00Z'); // 10 days left, inside the notice window
const TRIAL_SOFT_STOP = Date.parse('2026-10-01T00:00:00Z'); // past the last licensed day, in grace
const TRIAL_HARD_STOP = Date.parse('2026-10-12T00:00:00Z'); // past the grace period
const SUBSCRIPTION_RUNNING = Date.parse('2027-01-01T00:00:00Z'); // 223 days left, outside the notice window
const SUBSCRIPTION_NOTICE = Date.parse('2027-07-13T00:00:00Z'); // 30 days left
const SUBSCRIPTION_SOFT_STOP = Date.parse('2027-08-20T00:00:00Z'); // past the last licensed day, in grace
const SUBSCRIPTION_HARD_STOP = Date.parse('2027-12-01T00:00:00Z'); // past the grace period
// The perpetual fixture covers builds released on or before 2027-08-12.
const BUILD_COVERED = '30/06/2027';
const BUILD_PAST_MAINTENANCE = '30/09/2027';

describe('entitlement license notification (via _injectProductInfo)', () => {
  let _injectProductInfo;

  beforeEach(() => {
    // Reset the module-level once-per-page notification flags between tests.
    jest.resetModules();
    // eslint-disable-next-line global-require
    _injectProductInfo = require('../mixed')._injectProductInfo;

    spyOn(console, 'warn');
    spyOn(console, 'error');
    spyOn(console, 'info');
    spyOn(console, 'log');
  });

  const inject = (key, { now, releaseDate } = {}) => {
    if (typeof now === 'number') {
      spyOn(Date, 'now').and.returnValue(now);
    }

    const element = document.createElement('div').appendChild(document.createElement('div'));
    const node = _injectProductInfo({
      className: LICENSE_INFO_CLASS,
      key,
      element,
      releaseDate: releaseDate ?? BUILD_COVERED,
    });

    return { element, node, bar: () => element.querySelector(`.${LICENSE_INFO_CLASS}_inner`)?.innerHTML ?? null };
  };

  describe('a trial license', () => {
    it('should warn with the days left, and show no bar, while the trial runs', () => {
      const { node } = inject(TRIAL_KEY, { now: TRIAL_RUNNING });

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        'Your Handsontable license key expires in 10 days. ' +
        'To continue using Handsontable, you need to purchase a license.'
      );
      expect(console.error).not.toHaveBeenCalled();
      expect(node).toBe(null);
    });

    it('should error and show the bar once the trial has expired', () => {
      const { node, bar } = inject(TRIAL_KEY, { now: TRIAL_SOFT_STOP });

      expect(console.error).toHaveBeenCalledWith(
        'Your Handsontable trial license key expired on 2026-09-26 (UTC). ' +
        'To continue using Handsontable, you need to purchase a license.'
      );
      expect(node).not.toBe(null);
      expect(bar()).toBe(
        'Your Handsontable license key has expired. To continue using Handsontable, you need to ' +
        'purchase a license. <a href="mailto:sales@handsontable.com">Contact Sales</a>.'
      );
    });

    it('should error, and leave the bar to the lock screen, once the grace period is over', () => {
      const { node } = inject(TRIAL_KEY, { now: TRIAL_HARD_STOP });

      expect(console.error).toHaveBeenCalledWith(
        'Your Handsontable trial license key expired on 2026-09-26 (UTC). You may no longer use ' +
        'Handsontable under the trial license. To continue using the software, contact ' +
        'sales@handsontable.com to purchase a valid license.'
      );
      expect(node).toBe(null);
    });

    it('should say nothing more than once per page', () => {
      inject(TRIAL_KEY, { now: TRIAL_RUNNING });
      inject(TRIAL_KEY);
      inject(TRIAL_KEY);

      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('a subscription license', () => {
    it('should stay silent while the license is comfortably inside its term', () => {
      const { node } = inject(SUBSCRIPTION_KEY, { now: SUBSCRIPTION_RUNNING });

      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(node).toBe(null);
    });

    it('should warn inside the notice window, naming the date in UTC', () => {
      inject(SUBSCRIPTION_KEY, { now: SUBSCRIPTION_NOTICE });

      expect(console.warn).toHaveBeenCalledWith(
        'Your Handsontable subscription license expires on 2027-08-12 (UTC). ' +
        'To renew your license, contact sales@handsontable.com.'
      );
    });

    it('should error, with no bar, once the license has expired', () => {
      const { node } = inject(SUBSCRIPTION_KEY, { now: SUBSCRIPTION_SOFT_STOP });

      expect(console.error).toHaveBeenCalledWith(
        'Your Handsontable subscription license expired on 2027-08-12 (UTC). To continue using the ' +
        'software, contact sales@handsontable.com to purchase a valid license key.'
      );
      expect(node).toBe(null);
    });

    it('should keep the same message after the grace period, and never block', () => {
      const { node } = inject(SUBSCRIPTION_KEY, { now: SUBSCRIPTION_HARD_STOP });

      expect(console.error).toHaveBeenCalledWith(
        'Your Handsontable subscription license expired on 2027-08-12 (UTC). To continue using the ' +
        'software, contact sales@handsontable.com to purchase a valid license key.'
      );
      expect(node).toBe(null);
    });

    it('should read the complete artifact exactly as the block on its own', () => {
      inject(SUBSCRIPTION_KEY_WITH_PROSE, { now: SUBSCRIPTION_NOTICE });

      expect(console.warn).toHaveBeenCalledWith(
        'Your Handsontable subscription license expires on 2027-08-12 (UTC). ' +
        'To renew your license, contact sales@handsontable.com.'
      );
    });
  });

  describe('a perpetual license', () => {
    it('should stay silent on a build released on or before the maintenance date', () => {
      const { node } = inject(PERPETUAL_KEY, { now: SUBSCRIPTION_HARD_STOP, releaseDate: BUILD_COVERED });

      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(node).toBe(null);
    });

    it('should error and show the bar on a build released after the maintenance date', () => {
      const { node, bar } = inject(PERPETUAL_KEY, {
        now: SUBSCRIPTION_RUNNING,
        releaseDate: BUILD_PAST_MAINTENANCE,
      });

      expect(console.error).toHaveBeenCalledWith(
        'The license key for Handsontable expired on 2027-08-12, and is not valid for the installed ' +
        `version ${process.env.HOT_VERSION}. Renew your license key or downgrade to a version ` +
        'released on or before 2027-08-12. If you need any help, contact us at sales@handsontable.com.'
      );
      expect(node).not.toBe(null);
      expect(bar()).toContain('expired on 2027-08-12, and is not valid for the installed version');
    });

    it('should not read the clock at all', () => {
      inject(PERPETUAL_KEY, { now: Date.parse('2035-01-01T00:00:00Z'), releaseDate: BUILD_COVERED });

      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('the silencing flags', () => {
    it('should say nothing on either channel for a key issued for external use', () => {
      const { node } = inject(SUBSCRIPTION_EXTERNAL_KEY, { now: SUBSCRIPTION_SOFT_STOP });

      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(node).toBe(null);
    });

    it('should keep the console quiet and the bar loud with no-console-warns', () => {
      // A soft-stopped trial is the state that speaks on BOTH channels, so it is the one that can
      // show a flag closing exactly one of them.
      const { node, bar } = inject(TRIAL_NO_CONSOLE_WARNS_KEY, { now: TRIAL_SOFT_STOP });

      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(node).not.toBe(null);
      expect(bar()).toContain('Your Handsontable license key has expired.');
    });

    it('should keep the bar quiet and the console loud with no-ui-warns', () => {
      const { node } = inject(TRIAL_NO_UI_WARNS_KEY, { now: TRIAL_SOFT_STOP });

      expect(console.error).toHaveBeenCalledWith(
        'Your Handsontable trial license key expired on 2026-09-26 (UTC). ' +
        'To continue using Handsontable, you need to purchase a license.'
      );
      expect(node).toBe(null);
    });

    it('should hide the maintenance bar of a perpetual license with no-ui-warns', () => {
      const { node } = inject(PERPETUAL_NO_UI_WARNS_KEY, {
        now: SUBSCRIPTION_RUNNING,
        releaseDate: BUILD_PAST_MAINTENANCE,
      });

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining(
        'The license key for Handsontable expired on 2027-08-12'
      ));
      expect(node).toBe(null);
    });

    it('should silence a subscription notice carrying no-console-warns', () => {
      inject(NO_CONSOLE_WARNS_KEY, { now: SUBSCRIPTION_NOTICE });

      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should leave a subscription notice audible when only the UI channel is closed', () => {
      // A subscription has no UI of its own, so `no-ui-warns` must not touch its console warning.
      inject(NO_UI_WARNS_KEY, { now: SUBSCRIPTION_NOTICE });

      expect(console.warn).toHaveBeenCalledWith(
        'Your Handsontable subscription license expires on 2027-08-12 (UTC). ' +
        'To renew your license, contact sales@handsontable.com.'
      );
    });
  });

  describe('a key that is not a Handsontable license', () => {
    it('should treat a key granting only another product as invalid', () => {
      const { node, bar } = inject(HF_ONLY_KEY, { now: SUBSCRIPTION_RUNNING });

      expect(console.warn).toHaveBeenCalledWith(
        'The license key for Handsontable is invalid. If you need any help, contact us at ' +
        'support@handsontable.com.'
      );
      expect(node).not.toBe(null);
      expect(bar()).toContain('The license key for Handsontable is invalid.');
    });

    it('should treat a tampered key as invalid', () => {
      const { node } = inject(`${SUBSCRIPTION_KEY.slice(0, -3)}00]`, { now: SUBSCRIPTION_RUNNING });

      expect(console.warn).toHaveBeenCalledWith(
        'The license key for Handsontable is invalid. If you need any help, contact us at ' +
        'support@handsontable.com.'
      );
      expect(node).not.toBe(null);
    });
  });

  describe('the legacy path (regression)', () => {
    it('should keep reporting a missing key the way it always has', () => {
      inject(undefined, { now: SUBSCRIPTION_RUNNING });

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(
        'The license key for Handsontable is missing.'
      ));
    });

    it('should keep the non-commercial key silent', () => {
      const { node } = inject('non-commercial-and-evaluation', { now: SUBSCRIPTION_RUNNING });

      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(node).toBe(null);
    });

    it('should keep reporting a malformed legacy key as invalid', () => {
      inject('00000-00000-00000-00000-00000', { now: SUBSCRIPTION_RUNNING });

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(
        'The license key for Handsontable is invalid.'
      ));
    });
  });
});
