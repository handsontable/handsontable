import { initLicenseBranding } from '../licenseBranding';

// Only the license-state reader is stubbed. The shared copy constants and the expiry-clause
// builder the branding content imports stay REAL, so the wording asserted below is the wording
// that ships - a change to it fails here instead of passing and shipping.
jest.mock('../../helpers/mixed', () => ({
  ...jest.requireActual('../../helpers/mixed'),
  _getLicenseState: jest.fn(),
}));

const { _getLicenseState } = require('../../helpers/mixed');

function createMockHotInstance(overrides = {}) {
  // Hook callbacks are stored per name as arrays; `hooks.addHook[name](...)` runs them all in
  // registration order (like the real hooks). `removeHook` drops one (the badge disconnects its
  // ResizeObserver on `afterDestroy`).
  const registered = { addHook: {}, addHookOnce: {} };
  const hooks = { addHook: {}, addHookOnce: {} };
  const wireRunner = (bucket, name) => {
    if (!hooks[bucket][name]) {
      hooks[bucket][name] = (...args) => {
        const callbacks = [...registered[bucket][name]];

        if (bucket === 'addHookOnce') {
          registered[bucket][name] = [];
        }
        callbacks.forEach(callback => callback(...args));
      };
    }
  };
  const focusScope = {
    registerScope: jest.fn(),
    unregisterScope: jest.fn(),
    activateScope: jest.fn(),
    deactivateScope: jest.fn(),
  };
  const shortcutContext = { addShortcut: jest.fn(), removeShortcutsByGroup: jest.fn() };
  const rootElement = document.createElement('div');
  // The corner clone's table + header, as Walkontable exposes them through the TableView overlay
  // accessor (`view.getOverlayByName('top_inline_start_corner').clone.wtTable`): the badge measures
  // TABLE and detects hover inside THEAD. The clone can also hold frozen data cells, so hover is gated
  // on the THEAD, not the whole table.
  const cornerTable = document.createElement('table');
  const cornerThead = document.createElement('thead');
  const cornerHeaderRow = document.createElement('tr');
  const cornerHeaderCell = document.createElement('th');

  cornerHeaderRow.appendChild(cornerHeaderCell);
  cornerThead.appendChild(cornerHeaderRow);
  cornerTable.appendChild(cornerThead);
  rootElement.appendChild(cornerTable);

  const cornerCloneWtTable = { TABLE: cornerTable, THEAD: cornerThead };

  return {
    hooks,
    focusScope,
    cornerTable,
    cornerThead,
    cornerHeaderRow,
    cornerHeaderCell,
    getSettings: jest.fn(() => ({ licenseKey: overrides.licenseKey })),
    addHook: jest.fn((name, callback) => {
      (registered.addHook[name] = registered.addHook[name] || []).push(callback);
      wireRunner('addHook', name);
    }),
    addHookOnce: jest.fn((name, callback) => {
      (registered.addHookOnce[name] = registered.addHookOnce[name] || []).push(callback);
      wireRunner('addHookOnce', name);
    }),
    removeHook: jest.fn((name, callback) => {
      const callbacks = registered.addHook[name];
      const index = callbacks ? callbacks.indexOf(callback) : -1;

      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }),
    getFocusScopeManager: jest.fn(() => focusScope),
    getShortcutManager: jest.fn(() => ({
      getContext: jest.fn(() => shortcutContext),
      addContext: jest.fn(() => shortcutContext),
    })),
    shortcutContext,
    // The lock reuses the dialog's confirm markup and its width sizing; the badge reads the corner
    // clone straight from the Walkontable overlay (never a nested grid's).
    isRtl: jest.fn(() => false),
    view: {
      isHorizontallyScrollableByWindow: jest.fn(() => false),
      getWorkspaceWidth: jest.fn(() => 400),
      getTotalTableWidth: jest.fn(() => 600),
      getOverlayByName: jest.fn(() => ({ clone: { wtTable: cornerCloneWtTable } })),
    },
    deselectCell: jest.fn(),
    listen: jest.fn(),
    hasRowHeaders: jest.fn(() => overrides.rowHeaders ?? true),
    hasColHeaders: jest.fn(() => overrides.colHeaders ?? true),
    rootDocument: document,
    rootElement,
    rootOverlaysElement: document.createElement('div'),
    guid: 'ht-test-guid',
    // The realm constructors mirror the real `rootWindow` - the event-target checks consult the
    // grid's own realm (iframe-hosted grids), never the library's globals.
    rootWindow: { open: jest.fn(), location: { href: '' }, queueMicrotask: fn => queueMicrotask(fn), Element, Node },
    ...overrides,
  };
}

/**
 * Dispatches a bubbling `mouseover` whose target is the passed element (delegation reads
 * `event.target`, so the event must be dispatched from the roamed element itself).
 *
 * @param {HTMLElement} element The element the pointer roams over.
 */
function roamPointerOver(element) {
  element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
}

/**
 * Finds a registered shortcut config by its key name (e.g. 'Escape', 'Tab').
 *
 * @param {object} hotInstance The mock instance.
 * @param {string} key The key the shortcut listens to.
 * @returns {object|undefined} The shortcut config, or `undefined` when not registered.
 */
function findShortcut(hotInstance, key) {
  const call = hotInstance.shortcutContext.addShortcut.mock.calls
    .find(([config]) => config.keys.some(combo => combo.join('+') === key));

  return call?.[0];
}

function setLifecycle(state, extra = {}, channels = { console: true, ui: true }) {
  _getLicenseState.mockReturnValue({
    lifecycle: {
      state, isTrial: state.indexOf('trial') === 0, daysRemaining: null, licensedUntil: null, ...extra,
    },
    channels,
    grants: { unrestricted: false, products: {} },
  });
}

/**
 * Mounts the trial hard-stop lock and completes its deferred activation.
 *
 * @param {object} overrides Mock instance overrides.
 * @returns {object} The mock instance.
 */
function mountTrialLock(overrides = {}) {
  return mountLock('trial_hard_stop', { licensedUntil: '2026-09-26' }, overrides);
}

/**
 * Mounts the lock of one state and completes its deferred activation.
 *
 * @param {string} state The license state.
 * @param {object} extra Extra lifecycle fields.
 * @param {object} overrides Mock instance overrides.
 * @returns {object} The mock instance.
 */
function mountLock(state, extra = {}, overrides = {}) {
  setLifecycle(state, extra);
  const hotInstance = createMockHotInstance(overrides);

  initLicenseBranding(hotInstance);
  hotInstance.hooks.addHookOnce.afterInit();

  return hotInstance;
}

describe('licenseBranding', () => {
  // The two tables that decide what a blocking state shows must not drift: `LOCK_CONTENT` routes the
  // modal, `_BLOCKING_MODAL_STATES` withholds the bottom bar. A state in the first but not the second
  // would render a non-dismissable lock with a bar underneath it.
  it('should withhold the bottom bar for exactly the states that render the lock', () => {
    // eslint-disable-next-line global-require
    const { LOCK_CONTENT } = require('../licenseBranding/content');
    // eslint-disable-next-line global-require
    const { _BLOCKING_MODAL_STATES: blockingStates } = require('../../helpers/mixed');

    expect(Object.keys(LOCK_CONTENT).sort()).toEqual([...blockingStates].sort());
  });

  // Every test above and below stubs `_getLicenseState`, which is exactly what this one must not do.
  // `_classifyLegacyKey` behind it is a hand-written mirror of the frozen legacy emitter and it alone
  // decides whether a 25-character key locks the grid, so if that mirror ever drifts toward `invalid`
  // every paying customer is locked out - and, with the reader stubbed everywhere else, the whole
  // suite still passes. This drives the REAL reader with a real key and asserts the grid stays free.
  describe('a valid legacy key, through the real license-state reader', () => {
    const VALID_LEGACY_KEY = 'd0134-95841-770f2-c4f21-3751d'; // expires 23/05/2011
    let realGetLicenseState;
    let previousReleaseDate;

    beforeEach(() => {
      realGetLicenseState = jest.requireActual('../../helpers/mixed')._getLicenseState;
      _getLicenseState.mockImplementation(realGetLicenseState);
      // `initLicenseBranding` reads the build date bare off the environment, so a date inside the
      // key's window is what makes it a live paid license here rather than an expired one.
      previousReleaseDate = process.env.HOT_RELEASE_DATE;
      process.env.HOT_RELEASE_DATE = '22/05/2011';
    });

    afterEach(() => {
      process.env.HOT_RELEASE_DATE = previousReleaseDate;
    });

    it('should classify it as valid rather than invalid', () => {
      expect(realGetLicenseState(VALID_LEGACY_KEY, '22/05/2011').lifecycle.state).toBe('legacy_valid');
    });

    it.each([
      ['a bare key', VALID_LEGACY_KEY],
      ['a trailing space', `${VALID_LEGACY_KEY} `],
      ['a trailing newline', `${VALID_LEGACY_KEY}\n`],
      ['surrounding whitespace', `\n  ${VALID_LEGACY_KEY}  \n`],
    ])('should render no lock and no badge for %s', (_label, key) => {
      const hotInstance = createMockHotInstance({ licenseKey: key });

      initLicenseBranding(hotInstance);

      expect(hotInstance.rootOverlaysElement.children).toHaveLength(0);
      expect(hotInstance.focusScope.registerScope).not.toHaveBeenCalled();
      expect(hotInstance.rootElement.classList.contains('ht-license-badge-on')).toBe(false);
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('unbranded states', () => {
    // The corner badge is reserved for a trial, and the lock for the three blocking states. Every
    // other state renders nothing here (a legacy-expired or non-commercial key keeps only its
    // notification-path console message and bottom bar).
    it.each([
      'usage_valid', 'usage_notice', 'usage_soft_stop', 'usage_hard_stop', 'release_valid',
      'release_expired', 'legacy_valid', 'legacy_expired', 'non_commercial',
    ])(
      'should render nothing for the "%s" state',
      (state) => {
        setLifecycle(state, { licensedUntil: '2011-05-24' });
        const hotInstance = createMockHotInstance();

        initLicenseBranding(hotInstance);

        // Nothing is rendered and nothing is wired - no badge, no lock, no hook, no focus scope.
        expect(hotInstance.addHook).not.toHaveBeenCalled();
        expect(hotInstance.focusScope.registerScope).not.toHaveBeenCalled();
        expect(hotInstance.rootOverlaysElement.children).toHaveLength(0);
        expect(hotInstance.rootElement.classList.contains('ht-license-badge-on')).toBe(false);
      }
    );
  });

  describe('badge states (a running or soft-stopped trial)', () => {
    it.each(['trial_valid', 'trial_notice', 'trial_soft_stop'])(
      'should mount the corner badge + popover for the "%s" state',
      (state) => {
        setLifecycle(state, { daysRemaining: 5 });
        const hotInstance = createMockHotInstance();

        initLicenseBranding(hotInstance);

        const overlays = hotInstance.rootOverlaysElement;

        expect(overlays.querySelector('.ht-license-badge')).not.toBe(null);
        // The visual glyph is CSS-rendered inside the corner header cell, gated by this class.
        expect(hotInstance.rootElement.classList.contains('ht-license-badge-on')).toBe(true);
        expect(overlays.querySelector('.ht-license-popover')).not.toBe(null);
        expect(overlays.querySelector('.ht-license-popover__link')).not.toBe(null);
        // No lock screen in the branded, non-blocking states.
        expect(overlays.querySelector('.ht-license-lock')).toBe(null);
      }
    );

    it.each(['trial_valid', 'trial_notice', 'trial_soft_stop'])(
      'should keep the "%s" badge and popover entirely out of the Tab order (a floating visual only)',
      (state) => {
        setLifecycle(state, { daysRemaining: 5, licensedUntil: '2026-09-26' });
        const hotInstance = createMockHotInstance();

        initLicenseBranding(hotInstance);

        const overlays = hotInstance.rootOverlaysElement;

        // The popover is a purely visual floating element: no focus scope, no shortcuts, and none of
        // its controls are keyboard-focusable (the info is duplicated in the console and bottom bar).
        expect(hotInstance.focusScope.registerScope).not.toHaveBeenCalled();
        expect(hotInstance.shortcutContext.addShortcut).not.toHaveBeenCalled();
        expect(overlays.querySelector('.ht-license-badge').tabIndex).toBe(-1);
        expect(overlays.querySelector('.ht-license-popover__link').tabIndex).toBe(-1);

        const closeButton = overlays.querySelector('.ht-license-popover__close');

        if (closeButton) {
          expect(closeButton.tabIndex).toBe(-1);
        }
      }
    );
  });

  describe('corner presence and popover anchor', () => {
    it('should stamp `is-cornerless` when there is no corner cell, and re-sync it on settings updates', () => {
      setLifecycle('trial_soft_stop');
      const hotInstance = createMockHotInstance({ rowHeaders: false });

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      // No corner -> no badge to sit on: the glyph class comes OFF the root element (the CSS stops
      // rendering it inside the corner cell), and the popover re-anchors to the table's
      // inline-start edge, without the tail.
      expect(wrapper.classList.contains('is-cornerless')).toBe(true);
      expect(hotInstance.rootElement.classList.contains('ht-license-badge-on')).toBe(false);

      // Headers can be toggled at runtime - the classes follow on the next render.
      hotInstance.hasRowHeaders.mockReturnValue(true);
      hotInstance.hooks.addHook.afterRender();

      expect(wrapper.classList.contains('is-cornerless')).toBe(false);
      expect(hotInstance.rootElement.classList.contains('ht-license-badge-on')).toBe(true);
    });

    it('should not stamp `is-cornerless` when both header types are on', () => {
      setLifecycle('trial_soft_stop');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      expect(wrapper.classList.contains('is-cornerless')).toBe(false);
    });

    it('should mark this grid\'s own corner clone so the CSS glyph never leaks into a nested grid', () => {
      setLifecycle('trial_notice', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      // The glyph selector keys off `ht-license-badge-corner`, stamped on the corner clone resolved
      // through the Walkontable overlay - this grid's own corner, never a nested grid's (the
      // `handsontable` cell type renders its own corner clone inside this root).
      expect(hotInstance.cornerTable.classList.contains('ht-license-badge-corner')).toBe(true);

      // When the corner disappears (a header turned off at runtime) the marker comes off with it.
      hotInstance.hasColHeaders.mockReturnValue(false);
      hotInstance.hooks.addHook.afterRender();

      expect(hotInstance.cornerTable.classList.contains('ht-license-badge-corner')).toBe(false);
    });

    it('should measure the corner width for the popover anchor and re-sync it on renders', () => {
      setLifecycle('trial_notice', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance();

      Object.defineProperty(hotInstance.cornerTable, 'offsetWidth', { configurable: true, value: 48 });

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('48px');

      // The corner resizes at runtime (for example wider row numbers) - the next render re-syncs.
      Object.defineProperty(hotInstance.cornerTable, 'offsetWidth', { configurable: true, value: 64 });
      hotInstance.hooks.addHook.afterRender();

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('64px');
    });

    it('should ignore the 1px corner flutter of the scrolled-state border compensation', () => {
      setLifecycle('trial_notice', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance();

      Object.defineProperty(hotInstance.cornerTable, 'offsetWidth', { configurable: true, value: 50 });

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('50px');

      // Horizontal scroll grows the corner clone by exactly 1px (doubled-border compensation) - the
      // popover anchor must NOT follow, or the open popover nudges left/right on every scroll.
      Object.defineProperty(hotInstance.cornerTable, 'offsetWidth', { configurable: true, value: 51 });
      hotInstance.hooks.addHook.afterRender();

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('50px');

      // Scrolling back restores 50 - still no write.
      Object.defineProperty(hotInstance.cornerTable, 'offsetWidth', { configurable: true, value: 50 });
      hotInstance.hooks.addHook.afterRender();

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('50px');
    });
  });

  describe('popover copy', () => {
    it('should show the running-trial tooltip copy with the days remaining and a Contact Sales link', () => {
      setLifecycle('trial_notice', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const popover = hotInstance.rootOverlaysElement.querySelector('.ht-license-popover');

      expect(popover.getAttribute('role')).toBe('tooltip');
      expect(popover.querySelector('.ht-license-popover__title').textContent).toBe('Handsontable Trial');
      expect(popover.querySelector('.ht-license-popover__body').textContent).toContain('expires in 5 days');
      expect(popover.querySelector('.ht-license-popover__link').textContent).toBe('Contact Sales');
      expect(popover.querySelector('.ht-license-popover__link').getAttribute('href'))
        .toBe('mailto:sales@handsontable.com');
      // A hover/focus tooltip is not auto-open and has no close button.
      expect(popover.classList.contains('is-open')).toBe(false);
      expect(popover.querySelector('.ht-license-popover__close')).toBe(null);
    });

    it('should pluralize the day before the last licensed day', () => {
      setLifecycle('trial_notice', { daysRemaining: 1 });
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-popover__body').textContent)
        .toContain('expires in 1 day.');
    });

    it('should say "today" on the last licensed day of the trial', () => {
      // `daysRemaining` is 0 on the last licensed day, and that day is licensed in full - "expires
      // in 0 days" would describe a license that has already lapsed.
      setLifecycle('trial_notice', { daysRemaining: 0 });
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const body = hotInstance.rootOverlaysElement.querySelector('.ht-license-popover__body').textContent;

      expect(body).toContain('Your Handsontable license key expires today.');
      expect(body).not.toContain('0 days');
    });
  });

  describe('soft-stop popover dismissal', () => {
    it('should auto-open the soft-stop popover with a working (mouse-only) close button', () => {
      setLifecycle('trial_soft_stop');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const overlays = hotInstance.rootOverlaysElement;
      const wrapper = overlays.querySelector('.ht-license-badge-wrapper');
      const popover = overlays.querySelector('.ht-license-popover');
      const closeButton = popover.querySelector('.ht-license-popover__close');

      expect(popover.querySelector('.ht-license-popover__title').textContent).toBe('Handsontable Trial Expired');
      expect(popover.classList.contains('is-open')).toBe(true);
      expect(closeButton).not.toBe(null);

      closeButton.click();

      expect(popover.classList.contains('is-open')).toBe(false);
      // Dismissal stamps `is-dismissed`: it gates the hover CSS open rule, so the popover closes even
      // though the pointer still hovers it at click time. No shortcut is registered (mouse-only).
      expect(wrapper.classList.contains('is-dismissed')).toBe(true);
      expect(hotInstance.shortcutContext.addShortcut).not.toHaveBeenCalled();
    });

    it('should re-arm the dismissed soft-stop popover once the pointer leaves', () => {
      setLifecycle('trial_soft_stop');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const overlays = hotInstance.rootOverlaysElement;
      const wrapper = overlays.querySelector('.ht-license-badge-wrapper');
      const popover = overlays.querySelector('.ht-license-popover');

      popover.querySelector('.ht-license-popover__close').click();
      expect(wrapper.classList.contains('is-dismissed')).toBe(true);

      // Still dismissed while the pointer roams the corner...
      roamPointerOver(hotInstance.cornerHeaderCell);
      expect(wrapper.classList.contains('is-dismissed')).toBe(true);

      // ...and re-armed once it leaves, so the next corner hover shows the tooltip again.
      roamPointerOver(hotInstance.rootElement);
      expect(wrapper.classList.contains('is-dismissed')).toBe(false);
    });
  });

  describe('corner hover detection', () => {
    it('should stamp `is-corner-hover` while the pointer roams the corner header (click-through hover)', () => {
      setLifecycle('trial_notice', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      roamPointerOver(hotInstance.cornerHeaderCell);
      expect(wrapper.classList.contains('is-corner-hover')).toBe(true);

      roamPointerOver(hotInstance.rootElement);
      expect(wrapper.classList.contains('is-corner-hover')).toBe(false);

      roamPointerOver(hotInstance.cornerHeaderCell);
      hotInstance.rootElement.dispatchEvent(new MouseEvent('mouseleave'));
      expect(wrapper.classList.contains('is-corner-hover')).toBe(false);
    });

    it('should NOT stamp `is-corner-hover` over frozen data cells inside the corner clone', () => {
      setLifecycle('trial_notice', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance();
      // With `fixedRowsTop` + `fixedColumnsStart`, the corner clone also holds the user's frozen
      // DATA cells - hovering them must never pop the license tooltip.
      const tbody = document.createElement('tbody');
      const dataCell = document.createElement('td');

      tbody.appendChild(document.createElement('tr')).appendChild(dataCell);
      hotInstance.cornerTable.appendChild(tbody);

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      roamPointerOver(dataCell);
      expect(wrapper.classList.contains('is-corner-hover')).toBe(false);
    });

    it('should resolve event targets against the grid\'s own realm, not the library\'s globals', () => {
      setLifecycle('trial_notice', { daysRemaining: 5 });
      // An iframe-hosted grid delivers events whose targets are NOT instances of the loading
      // window's `Element`. Simulated by inverting the realms: with a foreign `rootWindow.Element`,
      // a roam over a test-realm node must be ignored - proof the detector consults `rootWindow`
      // (a bare `instanceof Element` would stamp the class here and die in a real iframe).
      const hotInstance = createMockHotInstance({
        rootWindow: {
          open: jest.fn(), location: { href: '' }, queueMicrotask: fn => queueMicrotask(fn), Element: class {}, Node,
        },
      });

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      roamPointerOver(hotInstance.cornerHeaderCell);
      expect(wrapper.classList.contains('is-corner-hover')).toBe(false);
    });

    it('should NOT stamp `is-corner-hover` when there is no corner cell (is-cornerless)', () => {
      setLifecycle('trial_notice', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance({ rowHeaders: false });

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      expect(wrapper.classList.contains('is-cornerless')).toBe(true);

      // The corner clone can still hold frozen cells, but there is no badge to point at.
      roamPointerOver(hotInstance.cornerHeaderCell);
      expect(wrapper.classList.contains('is-corner-hover')).toBe(false);
    });
  });

  describe('trial hard stop (the Core-owned lock screen)', () => {
    it('should mount a non-closable, modal lock over the grid', () => {
      const hotInstance = mountTrialLock();

      const lock = hotInstance.rootOverlaysElement.querySelector('.ht-license-lock');

      expect(lock).not.toBe(null);
      expect(lock.getAttribute('role')).toBe('alertdialog');
      expect(lock.getAttribute('aria-modal')).toBe('true');
      expect(lock.querySelector('.ht-dialog__title').textContent)
        .toBe('Your Handsontable trial license key expired on 2026-09-26.');
      expect(lock.querySelector('.ht-dialog__description').textContent)
        .toBe('You may no longer use Handsontable under the trial license. To continue using the ' +
          'software, contact sales@handsontable.com to purchase a valid license.');

      const actions = lock.querySelectorAll('.ht-button');

      // Contact Sales only - the trial lock offers no dismiss affordance, and no button at all: the
      // action is an ANCHOR, because neither `window.open` nor a `location` assignment is safe for a
      // `mailto:` (a stray empty tab, or unloading the app when no mail handler is registered).
      expect(actions).toHaveLength(1);
      expect(actions[0].tagName).toBe('A');
      expect(actions[0].textContent).toBe('Contact Sales');
      expect(actions[0].getAttribute('href')).toBe('mailto:sales@handsontable.com');
      expect(lock.querySelectorAll('button')).toHaveLength(0);

      actions[0].click();

      // Nothing scripted happens on click - the browser follows the anchor.
      expect(hotInstance.rootWindow.open).not.toHaveBeenCalled();
      expect(hotInstance.rootWindow.location.href).toBe('');
    });

    // The lock must never take the keyboard on its own. A grid can initialize while the user is typing
    // in a field elsewhere on the page, and grabbing focus at construction would empty that field's
    // caret, scroll the page down to the lock, and - because `listen()` un-listens every other
    // instance - pull the keyboard off a licensed grid as well. The focus scope manager activates the
    // scope on the first focusin or click inside it, so the Tab trap still engages the moment the user
    // reaches the lock.
    it('should mount the lock without ever claiming focus or the keyboard', () => {
      setLifecycle('trial_hard_stop', { licensedUntil: '2026-09-26' });
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);

      hotInstance.hooks.addHookOnce.afterInit();

      // The grid underneath must not look selected - that is the one thing `afterInit` still does.
      expect(hotInstance.deselectCell).toHaveBeenCalledTimes(1);
      expect(hotInstance.focusScope.activateScope).not.toHaveBeenCalled();
      expect(hotInstance.listen).not.toHaveBeenCalled();
    });

    it('should register a modal focus scope for the lock', () => {
      const hotInstance = mountTrialLock();

      expect(hotInstance.focusScope.registerScope).toHaveBeenCalledWith(
        'licenseLock', expect.any(HTMLElement), expect.objectContaining({
          shortcutsContextName: 'plugin:licenseLock',
          type: 'modal',
        })
      );
    });

    it('should register the Tab focus trap but NO Escape shortcut - the trial lock is not closable', () => {
      const hotInstance = mountTrialLock();

      const tab = findShortcut(hotInstance, 'Tab');

      expect(tab).not.toBe(undefined);
      expect(tab.group).toBe('licenseLock');
      expect(findShortcut(hotInstance, 'Escape')).toBe(undefined);
    });

    it('should read the license key only at init - no settings-update hook', () => {
      const hotInstance = mountTrialLock();

      // The key is init-only (like the console message and the bottom bar), so the branding never
      // registers an `afterUpdateSettings` listener and never re-resolves the state.
      expect(_getLicenseState).toHaveBeenCalledTimes(1);
      expect(hotInstance.addHook).not.toHaveBeenCalledWith('afterUpdateSettings', expect.any(Function));
    });
  });

  describe('a key that cannot be read, and no key at all', () => {
    // DEV-2562: both are install faults, and both now BLOCK - the specification's S4.5 shape. Their
    // sentences moved here from the bottom bar, which no longer renders for either state.
    it.each([
      ['invalid', 'The license key for Handsontable is invalid.'],
      ['missing', 'The license key for Handsontable is missing.'],
    ])('should mount the same non-closable modal for the "%s" state', (state, title) => {
      const hotInstance = mountLock(state);
      const lock = hotInstance.rootOverlaysElement.querySelector('.ht-license-lock');

      expect(lock).not.toBe(null);
      expect(lock.getAttribute('role')).toBe('alertdialog');
      expect(lock.getAttribute('aria-modal')).toBe('true');
      expect(lock.querySelector('.ht-dialog__title').textContent).toBe(title);
      // No corner badge: the badge is the trial's surface, and there is no trial here.
      expect(hotInstance.rootElement.classList.contains('ht-license-badge-on')).toBe(false);
      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-badge')).toBe(null);
    });

    it.each(['invalid', 'missing'])(
      'should offer support - not sales - as the only action of the "%s" modal, and no way out',
      (state) => {
        const hotInstance = mountLock(state);
        const lock = hotInstance.rootOverlaysElement.querySelector('.ht-license-lock');
        const actions = lock.querySelectorAll('.ht-button');

        // One action, and it is not a dismissal: an unreadable or absent key is an installation
        // fault, so it points at support, unlike the trial lock which points at sales.
        expect(actions).toHaveLength(1);
        expect(actions[0].textContent).toBe('Contact Support');
        expect(actions[0].getAttribute('href')).toBe('mailto:support@handsontable.com');
        expect(lock.textContent).not.toContain('Close');
        // ...and no Escape shortcut is registered, exactly as for the trial lock.
        expect(findShortcut(hotInstance, 'Escape')).toBeUndefined();
        expect(findShortcut(hotInstance, 'Tab')).not.toBeUndefined();
      }
    );

    it.each(['invalid', 'missing'])(
      'should keep the documentation link of the old bottom bar inside the "%s" modal',
      (state) => {
        const hotInstance = mountLock(state);
        const link = hotInstance.rootOverlaysElement.querySelector('.ht-dialog__description a');

        // Built as a node, so the copy can never become markup - and being a real link, the Tab
        // trap picks it up along with the button.
        expect(link).not.toBe(null);
        expect(link.textContent).toBe('Read more');
        expect(link.getAttribute('href')).toBe('https://handsontable.com/docs/tutorial-license-key.html');
        expect(hotInstance.rootOverlaysElement.querySelector('.ht-dialog__description').textContent)
          .toContain('support@handsontable.com');
      }
    );

    it('should tell a developer with no key how to activate the product', () => {
      const hotInstance = mountLock('missing');
      const description = hotInstance.rootOverlaysElement
        .querySelector('.ht-dialog__description').textContent;

      expect(description).toContain('Use your purchased key to activate the product.');
      expect(description).toContain('passing the key: \'non-commercial-and-evaluation\'');
    });

    it.each(['invalid', 'missing'])(
      'should trap focus in the "%s" modal as a modal scope',
      (state) => {
        const hotInstance = mountLock(state);

        expect(hotInstance.focusScope.registerScope).toHaveBeenCalledWith(
          'licenseLock', expect.any(HTMLElement), expect.objectContaining({ type: 'modal' })
        );
        // Registered, not activated: the scope manager activates it when the user first reaches the
        // lock. See "should mount the lock without ever claiming focus or the keyboard" above.
        expect(hotInstance.focusScope.activateScope).not.toHaveBeenCalled();
      }
    );
  });

  describe('a hard-stopped subscription', () => {
    // It renders no front-end surface at all - it is developer-facing (a console error, in the
    // notification path) only. 18.1 never blocks a paying customer.
    it('should render nothing: no lock, no badge, no focus scope', () => {
      setLifecycle('usage_hard_stop', { licensedUntil: '2027-08-12' });
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-lock')).toBe(null);
      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-badge')).toBe(null);
      expect(hotInstance.rootOverlaysElement.children).toHaveLength(0);
      expect(hotInstance.focusScope.registerScope).not.toHaveBeenCalled();
      expect(hotInstance.addHook).not.toHaveBeenCalled();
    });
  });

  describe('the no-ui-warns flag', () => {
    // A key issued for external use must show its end users no license WARNING - that is what the
    // flag is for.
    it.each(['trial_valid', 'trial_notice', 'trial_soft_stop'])(
      'should render nothing for the "%s" state when the UI channel is closed',
      (state) => {
        setLifecycle(state, { licensedUntil: '2026-09-26' }, { console: true, ui: false });
        const hotInstance = createMockHotInstance();

        initLicenseBranding(hotInstance);

        expect(hotInstance.rootOverlaysElement.children).toHaveLength(0);
        expect(hotInstance.rootElement.classList.contains('ht-license-badge-on')).toBe(false);
        expect(hotInstance.focusScope.registerScope).not.toHaveBeenCalled();
      }
    );

    // ...but it must NOT switch the block off. The specification scopes the flag to UI warnings
    // (S2.3), while the hard stop is the enforcement of a licence that has stopped (S4.1). Since an
    // external/SaaS key carries this flag by default, honoring it here would have made every such
    // key unblockable. This assertion fails if the `channels.ui` gate is ever moved back in front of
    // the `LOCK_CONTENT` routing - which is the whole point of it.
    //
    // Only `trial_hard_stop` is reachable this way in production: `invalid` and `missing` describe
    // keys whose flags could not be read, so `_getLicenseState` returns OPEN_CHANNELS for both and
    // the combination below exists only because that function is mocked here. They are kept as a
    // guard on the routing order, not as a claim about shipped states.
    it.each(['trial_hard_stop', 'invalid', 'missing'])(
      'should still render the lock screen for the "%s" state when the UI channel is closed',
      (state) => {
        setLifecycle(state, { licensedUntil: '2026-09-26' }, { console: true, ui: false });
        const hotInstance = createMockHotInstance();

        initLicenseBranding(hotInstance);

        expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);
      }
    );
  });

  describe('init-only license key', () => {
    it('should resolve the license state exactly once (no re-classification)', () => {
      setLifecycle('trial_notice', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance({ licenseKey: '[a-trial-key]' });

      initLicenseBranding(hotInstance);

      // The key is read once, at init. There is no `afterUpdateSettings` listener, so the state
      // (which runs the SHA-512 checksum) is never re-resolved.
      expect(_getLicenseState).toHaveBeenCalledTimes(1);
      expect(hotInstance.addHook).not.toHaveBeenCalledWith('afterUpdateSettings', expect.any(Function));
      expect(hotInstance.rootOverlaysElement.querySelectorAll('.ht-license-badge-wrapper')).toHaveLength(1);
    });
  });
});
