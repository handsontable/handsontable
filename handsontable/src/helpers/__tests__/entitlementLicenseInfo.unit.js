/* eslint no-console: off */
import {
  SUBSCRIPTION_KEY,
  SUBSCRIPTION_KEY_WITH_PROSE,
  SUBSCRIPTION_EXTERNAL_KEY,
  NO_CONSOLE_WARNS_KEY,
  NO_UI_WARNS_KEY,
  TRIAL_KEY,
  TRIAL_NO_UI_WARNS_KEY,
  PERPETUAL_KEY,
  PERPETUAL_NO_CONSOLE_WARNS_KEY,
  PERPETUAL_NO_UI_WARNS_KEY,
  HF_ONLY_KEY,
} from '../../utils/entitlementLicenseKey/__tests__/fixtures';

const LICENSE_INFO_CLASS = 'hot-display-license-info';
// Reference instants inside each window of the fixtures, so no test ever touches the real clock.
// The trial fixture runs to 2026-09-26 (notice 45, grace 15); the subscription one to 2027-08-12
// (notice 60, grace 90).
const TRIAL_RUNNING = Date.parse('2026-09-16T00:00:00Z'); // 10 days left, inside the notice window
const TRIAL_LAST_DAY = Date.parse('2026-09-26T23:59:59Z'); // the last licensed day, licensed in full
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

    it('should say the trial expires today on its last licensed day', () => {
      // The named day is licensed in full, so `daysRemaining` is 0 - and "expires in 0 days" would
      // tell a customer with a working license that it has already lapsed.
      const { node } = inject(TRIAL_KEY, { now: TRIAL_LAST_DAY });

      expect(console.warn).toHaveBeenCalledWith(
        'Your Handsontable license key expires today. ' +
        'To continue using Handsontable, you need to purchase a license.'
      );
      expect(console.error).not.toHaveBeenCalled();
      expect(node).toBe(null);
    });

    it('should error, and leave the message to the badge popover, once the trial has expired', () => {
      const { node, bar } = inject(TRIAL_KEY, { now: TRIAL_SOFT_STOP });

      expect(console.error).toHaveBeenCalledWith(
        'Your Handsontable trial license key expired on 2026-09-26 (UTC). ' +
        'To continue using Handsontable, you need to purchase a license.'
      );
      // No bar. The soft-stopped trial's auto-opening popover already carries these two sentences,
      // so a bar would put the same message on screen twice - and the popover, floating over the
      // corner, covers the grid's first rows while it does.
      expect(node).toBe(null);
      expect(bar()).toBe(null);
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
      // A build past its maintenance date is the ONE state that speaks on both channels (console
      // error + bottom bar), so it is the only one that can show a flag closing exactly one of them.
      // The soft-stopped trial used to serve here; it no longer renders a bar at all.
      const { node, bar } = inject(PERPETUAL_NO_CONSOLE_WARNS_KEY, {
        now: SUBSCRIPTION_RUNNING,
        releaseDate: BUILD_PAST_MAINTENANCE,
      });

      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(node).not.toBe(null);
      expect(bar()).toContain('The license key for Handsontable expired on 2027-08-12');
    });

    it('should keep the console loud with no-ui-warns', () => {
      // The flags are independent: closing the UI channel must not touch the console.
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
    // DEV-2562: an unreadable key still warns in the console, but its BAR is gone - the blocking
    // modal (`utils/licenseBranding/lockScreen.ts`) carries those sentences now, and two license
    // surfaces repeating one message would be noise.
    it('should treat a key granting only another product as invalid, with no bar', () => {
      const { node } = inject(HF_ONLY_KEY, { now: SUBSCRIPTION_RUNNING });

      expect(console.warn).toHaveBeenCalledWith(
        'The license key for Handsontable is invalid. If you need any help, contact us at ' +
        'support@handsontable.com.'
      );
      expect(node).toBe(null);
    });

    it('should treat a tampered key as invalid, with no bar', () => {
      const { node } = inject(`${SUBSCRIPTION_KEY.slice(0, -3)}00]`, { now: SUBSCRIPTION_RUNNING });

      expect(console.warn).toHaveBeenCalledWith(
        'The license key for Handsontable is invalid. If you need any help, contact us at ' +
        'support@handsontable.com.'
      );
      expect(node).toBe(null);
    });
  });

  describe('the legacy path (regression)', () => {
    it('should keep reporting a missing key in the console, and no longer in a bar', () => {
      const { node } = inject(undefined, { now: SUBSCRIPTION_RUNNING });

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(
        'The license key for Handsontable is missing.'
      ));
      // The console message is untouched; only the bar gave way to the blocking modal.
      expect(node).toBe(null);
    });

    it('should keep the non-commercial key silent', () => {
      const { node } = inject('non-commercial-and-evaluation', { now: SUBSCRIPTION_RUNNING });

      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(node).toBe(null);
    });

    it('should keep reporting a malformed legacy key as invalid, and no longer in a bar', () => {
      const { node } = inject('00000-00000-00000-00000-00000', { now: SUBSCRIPTION_RUNNING });

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(
        'The license key for Handsontable is invalid.'
      ));
      expect(node).toBe(null);
    });

    it('should still show the bar for a legacy key that expired - it was valid, it just lapsed', () => {
      // A real legacy key that expired on 23/05/2011, so it is expired against any modern build.
      const { node, bar } = inject('d0134-95841-770f2-c4f21-3751d', { now: SUBSCRIPTION_RUNNING });

      // Only the two INSTALL faults block. A lapsed key keeps the bar it always had, so an
      // application that is merely out of maintenance is never taken off the air.
      expect(node).not.toBe(null);
      expect(bar()).toContain('expired on');
    });
  });
});
