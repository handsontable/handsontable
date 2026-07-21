/* eslint no-console: off */
import {
  TRIAL_KEY,
  TRIAL_SAAS_KEY,
  FREEMIUM_KEY,
  SUBSCRIPTION_KEY,
  SUBSCRIPTION_SAAS_KEY,
  PERPETUAL_KEY,
  HF_ADDONS_KEY,
  HF_ONLY_KEY,
} from '../../utils/typedLicenseKey/__tests__/fixtures';

const LICENSE_INFO_CLASS = 'hot-display-license-info';
// The fixtures all expire on 2026-08-27 (UTC midnight). These reference points
// place `now` inside each lifecycle window without ever touching the real clock.
const DAY = 86400000;
const EXPIRY = Date.UTC(2026, 7, 27);
const DURING_TRIAL = EXPIRY - (10 * DAY); // 10 days left
const TRIAL_SOFT = EXPIRY + (5 * DAY); // 5 days past expiry, grace 15
const TRIAL_HARD = EXPIRY + (20 * DAY); // past expiry + 15
const SUB_ENDING = EXPIRY - (30 * DAY); // 30 days left, <= 60
const SUB_ACTIVE = EXPIRY - (200 * DAY); // > 60 days left
const SUB_EXPIRED = EXPIRY + (10 * DAY); // past expiry, within grace 90
const SUB_HARD = EXPIRY + (200 * DAY); // past expiry + 90
// A build released before the fixture maintenance-end keeps a perpetual key valid;
// one released after it lapses maintenance.
const RELEASE_BEFORE_EXPIRY = '30/06/2026';
const RELEASE_AFTER_EXPIRY = '30/09/2026';

describe('typed license notification (via _injectProductInfo)', () => {
  let _injectProductInfo;

  beforeEach(() => {
    // Reset the module-level `_notified` once-per-page flag between tests.
    jest.resetModules();
    // eslint-disable-next-line global-require
    _injectProductInfo = require('../mixed')._injectProductInfo;

    spyOn(console, 'warn');
    spyOn(console, 'error');
    spyOn(console, 'info');
    spyOn(console, 'log');
  });

  const pinNow = (timestamp) => {
    spyOn(Date, 'now').and.returnValue(timestamp);
  };

  const inject = (key, { now, releaseDate } = {}) => {
    if (typeof now === 'number') {
      pinNow(now);
    }

    const element = document.createElement('div').appendChild(document.createElement('div'));
    const node = _injectProductInfo({
      className: LICENSE_INFO_CLASS,
      key,
      element,
      releaseDate: releaseDate ?? RELEASE_BEFORE_EXPIRY,
    });

    return { element, node };
  };

  describe('trial', () => {
    it('warns (once) with days-left and shows no bar while active', () => {
      const { node } = inject(TRIAL_KEY, { now: DURING_TRIAL });

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        'Your Handsontable trial license key expires in 10 days. To continue using Handsontable ' +
        'contact sales@handsontable.com to purchase a valid commercial license.'
      );
      expect(console.error).not.toHaveBeenCalled();
      expect(node).toBe(null);
    });

    it('errors and shows the soft-stop bar once expired within grace', () => {
      const { element, node } = inject(TRIAL_KEY, { now: TRIAL_SOFT });

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        'Your Handsontable trial license key expired on August 27, 2026. To continue using Handsontable ' +
        'contact sales@handsontable.com to purchase a valid commercial license.'
      );
      expect(console.warn).not.toHaveBeenCalled();
      expect(node).toBe(element.querySelector(`.${LICENSE_INFO_CLASS}`));
      expect(element.querySelector(`.${LICENSE_INFO_CLASS}_inner`).innerHTML).toBe(
        'Your Handsontable license has expired. To continue using Handsontable, you need to purchase a ' +
        'commercial license. <a href="mailto:sales@handsontable.com">Contact Sales</a>.'
      );
    });

    it('errors with the hard-stop message and shows no bar past grace', () => {
      const { node } = inject(TRIAL_KEY, { now: TRIAL_HARD });

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        'Your Handsontable trial license key expired on August 27, 2026. You may no longer use Handsontable ' +
        'under the trial license. To continue using the software contact sales@handsontable.com to purchase ' +
        'a valid license.'
      );
      expect(node).toBe(null);
    });
  });

  describe('freemium', () => {
    it('is fully silent and shows no bar', () => {
      const { node } = inject(FREEMIUM_KEY, { now: DURING_TRIAL });

      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(node).toBe(null);
    });
  });

  describe('subscription', () => {
    it('is silent while comfortably valid (> 60 days)', () => {
      const { node } = inject(SUBSCRIPTION_KEY, { now: SUB_ACTIVE });

      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(node).toBe(null);
    });

    it('warns when ending soon (<= 60 days), no bar', () => {
      const { node } = inject(SUBSCRIPTION_KEY, { now: SUB_ENDING });

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        'Your Handsontable subscription license expires on August 27, 2026. ' +
        'To renew your license contact sales@handsontable.com.'
      );
      expect(node).toBe(null);
    });

    it('errors with expiry + hard-stop date when expired within grace, no bar', () => {
      const { node } = inject(SUBSCRIPTION_KEY, { now: SUB_EXPIRED });

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        'Your Handsontable subscription license key expired on August 27, 2026. The software will become ' +
        'inactive on November 25, 2026. To renew your license contact sales@handsontable.com.'
      );
      expect(node).toBe(null);
    });

    it('errors with the hard-stop message past grace, no bar', () => {
      const { node } = inject(SUBSCRIPTION_KEY, { now: SUB_HARD });

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        'Your Handsontable subscription license key expired on August 27, 2026. To continue using the ' +
        'software contact sales@handsontable.com to purchase a valid license key.'
      );
      expect(node).toBe(null);
    });

    it('treats SaaS the same as internal in Phase 1 (console only, no bar)', () => {
      const { node } = inject(SUBSCRIPTION_SAAS_KEY, { now: SUB_HARD });

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(node).toBe(null);
    });
  });

  describe('perpetual', () => {
    it('is silent while the build predates maintenance end', () => {
      const { node } = inject(PERPETUAL_KEY, { releaseDate: RELEASE_BEFORE_EXPIRY });

      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(node).toBe(null);
    });

    it('reuses the legacy expired message and bar once maintenance lapses', () => {
      const { element, node } = inject(PERPETUAL_KEY, { releaseDate: RELEASE_AFTER_EXPIRY });

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        'The license key for Handsontable expired on August 27, 2026, and is not valid for the installed ' +
        `version ${process.env.HOT_VERSION}. Renew your license key at handsontable.com or downgrade ` +
        'to a version released prior to August 27, 2026. If you need any help, contact us at sales@handsontable.com.'
      );
      expect(node).toBe(element.querySelector(`.${LICENSE_INFO_CLASS}`));
      expect(element.querySelector(`.${LICENSE_INFO_CLASS}_inner`).innerHTML).toContain(
        'The license key for Handsontable expired on August 27, 2026'
      );
    });
  });

  describe('invalid / tampered typed key', () => {
    const INVALID_DOM_HTML = [
      'The license key for Handsontable is invalid. ',
      '<a href="https://handsontable.com/docs/tutorial-license-key.html" target="_blank">Read more</a> ',
      'on how to install it properly or contact us at <a href="mailto:support@handsontable.com">',
      'support@handsontable.com</a>.',
    ].join('');

    it('falls back to the legacy invalid message and bar', () => {
      // Flip the last checksum character to break the key.
      const tampered = TRIAL_KEY.slice(0, -1) + (TRIAL_KEY.slice(-1) === '0' ? '1' : '0');
      const { element, node } = inject(tampered, { now: DURING_TRIAL });

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        'The license key for Handsontable is invalid. ' +
        'If you need any help, contact us at support@handsontable.com.'
      );
      expect(node).toBe(element.querySelector(`.${LICENSE_INFO_CLASS}`));
      expect(element.querySelector(`.${LICENSE_INFO_CLASS}_inner`).innerHTML).toBe(INVALID_DOM_HTML);
    });

    it('warns once but renders the bar on every instance (console once, DOM always)', () => {
      const tampered = TRIAL_KEY.slice(0, -1) + (TRIAL_KEY.slice(-1) === '0' ? '1' : '0');
      const first = inject(tampered, { now: DURING_TRIAL });
      const second = inject(tampered);

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(first.element.querySelector(`.${LICENSE_INFO_CLASS}_inner`).innerHTML).toBe(INVALID_DOM_HTML);
      expect(second.element.querySelector(`.${LICENSE_INFO_CLASS}_inner`).innerHTML).toBe(INVALID_DOM_HTML);
    });
  });

  describe('once per page', () => {
    it('prints the console message only once across instances but always renders the bar', () => {
      pinNow(TRIAL_SOFT);

      const first = _injectProductInfo({
        className: LICENSE_INFO_CLASS,
        key: TRIAL_KEY,
        element: document.createElement('div').appendChild(document.createElement('div')),
        releaseDate: RELEASE_BEFORE_EXPIRY,
      });
      const secondContainer = document.createElement('div').appendChild(document.createElement('div'));
      const second = _injectProductInfo({
        className: LICENSE_INFO_CLASS,
        key: TRIAL_KEY,
        element: secondContainer,
        releaseDate: RELEASE_BEFORE_EXPIRY,
      });

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(first).not.toBe(null);
      expect(second).toBe(secondContainer.querySelector(`.${LICENSE_INFO_CLASS}`));
    });
  });

  describe('handsontable.com host bypass', () => {
    it('renders no console warning and no bar for a hard-stopped typed key', () => {
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { host: 'app.handsontable.com' },
      });

      try {
        const { node } = inject(TRIAL_KEY, { now: TRIAL_HARD });

        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
        expect(node).toBe(null);
      } finally {
        Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
      }
    });
  });
});

describe('_getLicenseState', () => {
  let _getLicenseState;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line global-require
    _getLicenseState = require('../mixed')._getLicenseState;
    spyOn(Date, 'now').and.returnValue(EXPIRY - (10 * DAY));
  });

  it('classifies every non-typed key with unrestricted grants, mirroring the legacy emitter', () => {
    // A real (expired 23/05/2011) legacy key, the same one the legacy `mixed` unit tests use.
    const LEGACY_KEY = 'd0134-95841-770f2-c4f21-3751d';
    const cases = [
      [undefined, 'missing'],
      ['', 'missing'],
      ['non-commercial-and-evaluation', 'non_commercial'],
      ['NON-COMMERCIAL-AND-EVALUATION', 'non_commercial'], // the legacy comparison is case-insensitive
      ['ht68e-1f2b7-47158-70b05-0842f', 'non_commercial'], // the old hardcoded trial key
      ['aaaaa-bbbbb-ccccc-ddddd-eeeee', 'invalid'], // 25 chars, broken checksum
      ['00000-0000', 'invalid'], // wrong length
      [LEGACY_KEY, 'legacy_valid', '01/01/2011'], // build released before the key validity end
      [LEGACY_KEY, 'legacy_expired', RELEASE_BEFORE_EXPIRY], // build released after it
    ];

    cases.forEach(([key, expectedState, releaseDate]) => {
      const { lifecycle, grants } = _getLicenseState(key, releaseDate ?? RELEASE_BEFORE_EXPIRY);

      expect(lifecycle.state).toBe(expectedState);
      expect(grants.unrestricted).toBe(true);
    });
  });

  it('exposes the expiration time of a legacy-expired key for the branding popover', () => {
    const { lifecycle } = _getLicenseState('d0134-95841-770f2-c4f21-3751d', RELEASE_BEFORE_EXPIRY);

    expect(lifecycle.state).toBe('legacy_expired');
    // The legacy message formats `(keyValidityDays + 1) * 8.64e7` - the day after 23/05/2011.
    expect(lifecycle.expiryTimestamp).toBe(Date.UTC(2011, 4, 24));
  });

  it('resolves a valid typed key to its lifecycle and payload-driven grants', () => {
    const { lifecycle, grants } = _getLicenseState(TRIAL_KEY, RELEASE_BEFORE_EXPIRY);

    expect(lifecycle.state).toBe('trial_active');
    expect(lifecycle.keyType).toBe('trial');
    expect(grants.unrestricted).toBe(false);
    expect(grants.products.handsontable.tier).toBe('enterprise');
    expect(grants.products.handsontable.mode).toBe('internal');
  });

  it('reads SaaS mode from the payload', () => {
    const { grants } = _getLicenseState(TRIAL_SAAS_KEY, RELEASE_BEFORE_EXPIRY);

    expect(grants.products.handsontable.mode).toBe('saas');
  });

  it('reads HyperFormula add-ons from the payload', () => {
    const { grants } = _getLicenseState(HF_ADDONS_KEY, RELEASE_BEFORE_EXPIRY);

    expect(grants.products.hyperformula.addons).toEqual(['spreadsheet', 'import_export']);
  });

  it('maps an HF-only key (no Handsontable grant) to invalid + UNRESTRICTED grants', () => {
    // The critical seam: classify returns null, but grants must NOT come from the
    // payload - an invalid key unlocks everything, it never strips features.
    const { lifecycle, grants } = _getLicenseState(HF_ONLY_KEY, RELEASE_BEFORE_EXPIRY);

    expect(lifecycle.state).toBe('invalid');
    expect(grants.unrestricted).toBe(true);
  });

  it('maps a tampered typed key to invalid + UNRESTRICTED grants', () => {
    const tampered = SUBSCRIPTION_KEY.slice(0, -1) + (SUBSCRIPTION_KEY.slice(-1) === '0' ? '1' : '0');
    const { lifecycle, grants } = _getLicenseState(tampered, RELEASE_BEFORE_EXPIRY);

    expect(lifecycle.state).toBe('invalid');
    expect(grants.unrestricted).toBe(true);
  });

  it('suppresses the typed state on a handsontable.com host (the *.handsontable.com bypass)', () => {
    const originalLocation = window.location;

    // A hard-stopped trial that would otherwise block the app must resolve to the legacy no-UI state
    // on Handsontable's own site, so neither the dialog nor the bar renders there.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { host: 'app.handsontable.com' },
    });
    Date.now.and.returnValue(EXPIRY + (20 * DAY));

    try {
      const { lifecycle, grants } = _getLicenseState(TRIAL_KEY, RELEASE_BEFORE_EXPIRY);

      expect(lifecycle.state).toBe('legacy_valid');
      expect(grants.unrestricted).toBe(true);
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    }
  });
});

describe('_createHardStopLicenseBar', () => {
  let _createHardStopLicenseBar;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line global-require
    _createHardStopLicenseBar = require('../mixed')._createHardStopLicenseBar;
  });

  it('builds the hard-stop bar node with the license classes, copy, and Contact Sales link', () => {
    const node = _createHardStopLicenseBar(LICENSE_INFO_CLASS);

    expect(node.className).toBe(`handsontable ${LICENSE_INFO_CLASS}`);

    const inner = node.querySelector(`.${LICENSE_INFO_CLASS}_inner`);

    expect(inner).not.toBe(null);
    expect(inner.innerHTML).toBe(
      'Your Handsontable trial license has expired and can no longer be used. To continue using ' +
      'Handsontable, you need to purchase a commercial license. ' +
      '<a href="mailto:sales@handsontable.com">Contact Sales</a>.'
    );

    const link = inner.querySelector('a');

    expect(link.getAttribute('href')).toBe('mailto:sales@handsontable.com');
    expect(link.textContent).toBe('Contact Sales');
  });
});
