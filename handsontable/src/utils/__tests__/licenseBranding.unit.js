import { initLicenseBranding } from '../licenseBranding';

jest.mock('../../helpers/mixed', () => ({
  _getLicenseState: jest.fn(),
  // The real formatter (not a jest.fn) - the popover copy tests assert the formatted date.
  _formatUtcDate: timestamp => new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: '2-digit', timeZone: 'UTC',
  }).format(timestamp),
}));

const { _getLicenseState } = require('../../helpers/mixed');

function createMockHotInstance(overrides = {}) {
  // Hook callbacks are stored per name as arrays; `hooks.addHook[name](...)` runs them all in
  // registration order (like the real hooks), and `removeHook` drops one - the branding module
  // unregisters its hooks when a runtime key change unmounts a surface.
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
  const cornerClone = document.createElement('div');
  // The corner clone's header area: hover only triggers inside the clone's `thead` (the clone can
  // also hold frozen data cells), and the glyph renders inside the first header cell.
  const cornerThead = document.createElement('thead');
  const cornerHeaderRow = document.createElement('tr');
  const cornerHeaderCell = document.createElement('th');

  cornerClone.className = 'ht_clone_top_inline_start_corner';
  cornerHeaderRow.appendChild(cornerHeaderCell);
  cornerThead.appendChild(cornerHeaderRow);
  cornerClone.appendChild(cornerThead);
  rootElement.appendChild(cornerClone);

  return {
    hooks,
    focusScope,
    cornerClone,
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
    // The lock reuses the dialog's confirm markup and its width sizing.
    isRtl: jest.fn(() => false),
    view: {
      isHorizontallyScrollableByWindow: jest.fn(() => false),
      getWorkspaceWidth: jest.fn(() => 400),
      getTotalTableWidth: jest.fn(() => 600),
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
    rootWindow: { open: jest.fn(), queueMicrotask: fn => queueMicrotask(fn), Element, Node },
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
 * Grants of a verified typed key licensing Handsontable in the given deployment mode.
 *
 * @param {string} mode The deployment mode stamped in the key payload.
 * @returns {object} The grants object.
 */
function grantsWithMode(mode) {
  return {
    unrestricted: false,
    products: { handsontable: { tier: 'enterprise', mode, addons: [] } },
  };
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

function setLifecycle(state, extra = {}, grants = { unrestricted: false, products: {} }) {
  _getLicenseState.mockReturnValue({
    lifecycle: { state, daysRemaining: null, expiryTimestamp: null, hardStopTimestamp: null, ...extra },
    grants,
  });
}

/**
 * Mounts the trial hard-stop lock and completes its deferred activation.
 *
 * @param {object} overrides Mock instance overrides.
 * @returns {object} The mock instance.
 */
function mountTrialLock(overrides = {}) {
  setLifecycle('trial_expired_hard');
  const hotInstance = createMockHotInstance(overrides);

  initLicenseBranding(hotInstance);
  hotInstance.hooks.addHookOnce.afterInit();

  return hotInstance;
}

describe('licenseBranding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('unbranded states', () => {
    it.each(['sub_ending', 'sub_expired', 'perp_expired', 'legacy_valid'])(
      'should render nothing for the "%s" state',
      (state) => {
        setLifecycle(state);
        const hotInstance = createMockHotInstance();

        initLicenseBranding(hotInstance);

        // Only the runtime key watcher registers - no badge, no lock, no focus scope.
        expect(hotInstance.addHook).toHaveBeenCalledTimes(1);
        expect(hotInstance.addHook).toHaveBeenCalledWith('afterUpdateSettings', expect.any(Function));
        expect(hotInstance.focusScope.registerScope).not.toHaveBeenCalled();
        expect(hotInstance.rootOverlaysElement.children).toHaveLength(0);
      }
    );
  });

  describe('badge states (trial active, trial soft-stop, freemium, missing, invalid, legacy expired)', () => {
    it.each(['trial_active', 'trial_expired', 'freemium', 'missing', 'invalid', 'legacy_expired'])(
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

    it.each(['trial_active', 'trial_expired', 'freemium', 'missing', 'invalid', 'legacy_expired'])(
      'should keep the "%s" badge and popover entirely out of the Tab order (a floating visual only)',
      (state) => {
        setLifecycle(state, { daysRemaining: 5, expiryTimestamp: Date.UTC(2026, 7, 27) });
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

    it('should show the badge alone for the non-commercial state - no popover, label only', () => {
      setLifecycle('non_commercial');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const overlays = hotInstance.rootOverlaysElement;
      const badge = overlays.querySelector('.ht-license-badge');

      // The Non-Commercial and Evaluation License permits the usage - the badge is the only marker,
      // with no tooltip and no purchase messaging.
      expect(badge).not.toBe(null);
      expect(badge.getAttribute('aria-label'))
        .toBe('You\'re using the Non-Commercial and Evaluation License of Handsontable');
      expect(badge.tabIndex).toBe(-1);
      expect(overlays.querySelector('.ht-license-popover')).toBe(null);
      expect(hotInstance.focusScope.registerScope).not.toHaveBeenCalled();
    });
  });

  describe('corner presence and popover anchor', () => {
    it('should stamp `is-cornerless` when there is no corner cell, and re-sync it on settings updates', () => {
      setLifecycle('trial_expired');
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
      setLifecycle('trial_expired');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      expect(wrapper.classList.contains('is-cornerless')).toBe(false);
    });

    it('should measure the corner width for the popover anchor and re-sync it on renders', () => {
      setLifecycle('trial_active', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance();

      Object.defineProperty(hotInstance.cornerClone, 'offsetWidth', { configurable: true, value: 48 });

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('48px');

      // The corner resizes at runtime (for example wider row numbers) - the next render re-syncs.
      Object.defineProperty(hotInstance.cornerClone, 'offsetWidth', { configurable: true, value: 64 });
      hotInstance.hooks.addHook.afterRender();

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('64px');
    });

    it('should ignore the 1px corner flutter of the scrolled-state border compensation', () => {
      setLifecycle('trial_active', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance();

      Object.defineProperty(hotInstance.cornerClone, 'offsetWidth', { configurable: true, value: 50 });

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('50px');

      // Horizontal scroll grows the corner clone by exactly 1px (doubled-border compensation) - the
      // popover anchor must NOT follow, or the open popover nudges left/right on every scroll.
      Object.defineProperty(hotInstance.cornerClone, 'offsetWidth', { configurable: true, value: 51 });
      hotInstance.hooks.addHook.afterRender();

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('50px');

      // Scrolling back restores 50 - still no write.
      Object.defineProperty(hotInstance.cornerClone, 'offsetWidth', { configurable: true, value: 50 });
      hotInstance.hooks.addHook.afterRender();

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('50px');
    });
  });

  describe('popover copy', () => {
    it('should show the trial-active tooltip copy with the days remaining and a Contact Sales link', () => {
      setLifecycle('trial_active', { daysRemaining: 5 });
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

    it('should show the freemium upgrade copy with a Learn more link', () => {
      setLifecycle('freemium');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const popover = hotInstance.rootOverlaysElement.querySelector('.ht-license-popover');

      expect(popover.querySelector('.ht-license-popover__title').textContent)
        .toBe('You\'re using the Handsontable Freemium plan.');
      expect(popover.querySelector('.ht-license-popover__link').textContent).toBe('Learn more');
      expect(popover.querySelector('.ht-license-popover__link').getAttribute('href'))
        .toBe('https://handsontable.com/pricing');
    });

    it('should show the missing-key copy as a hover tooltip without a close button', () => {
      setLifecycle('missing');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const popover = hotInstance.rootOverlaysElement.querySelector('.ht-license-popover');

      expect(popover.getAttribute('role')).toBe('tooltip');
      expect(popover.querySelector('.ht-license-popover__title').textContent).toBe('Missing license key');
      expect(popover.querySelector('.ht-license-popover__body').textContent)
        .toContain('The license key for Handsontable is missing');
      expect(popover.querySelector('.ht-license-popover__body').textContent)
        .toContain('non-commercial-and-evaluation');
      expect(popover.querySelector('.ht-license-popover__link').textContent).toBe('Learn more');
      expect(popover.querySelector('.ht-license-popover__link').getAttribute('href'))
        .toBe('https://handsontable.com/docs/license-key/');
      expect(popover.classList.contains('is-open')).toBe(false);
      expect(popover.querySelector('.ht-license-popover__close')).toBe(null);
    });

    it('should show the invalid-key copy as a hover tooltip without a close button', () => {
      setLifecycle('invalid');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const popover = hotInstance.rootOverlaysElement.querySelector('.ht-license-popover');

      expect(popover.getAttribute('role')).toBe('tooltip');
      expect(popover.querySelector('.ht-license-popover__title').textContent).toBe('Invalid license key');
      expect(popover.querySelector('.ht-license-popover__body').textContent)
        .toContain('The license key for Handsontable is invalid');
      expect(popover.querySelector('.ht-license-popover__link').textContent).toBe('Learn more');
      expect(popover.classList.contains('is-open')).toBe(false);
      expect(popover.querySelector('.ht-license-popover__close')).toBe(null);
    });

    it('should auto-open the legacy-expired popover with the expiration date and a close button', () => {
      setLifecycle('legacy_expired', { expiryTimestamp: Date.UTC(2011, 4, 24) });
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const popover = hotInstance.rootOverlaysElement.querySelector('.ht-license-popover');

      expect(popover.getAttribute('role')).toBe('dialog');
      expect(popover.querySelector('.ht-license-popover__title').textContent).toBe('Expired license key');
      expect(popover.querySelector('.ht-license-popover__body').textContent).toContain('expired on May 24, 2011');
      expect(popover.classList.contains('is-open')).toBe(true);
      expect(popover.querySelector('.ht-license-popover__close')).not.toBe(null);
    });
  });

  describe('soft-stop popover dismissal', () => {
    it('should auto-open the soft-stop popover with a working (mouse-only) close button', () => {
      setLifecycle('trial_expired');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const overlays = hotInstance.rootOverlaysElement;
      const wrapper = overlays.querySelector('.ht-license-badge-wrapper');
      const popover = overlays.querySelector('.ht-license-popover');
      const closeButton = popover.querySelector('.ht-license-popover__close');

      expect(popover.querySelector('.ht-license-popover__title').textContent).toBe('Expired trial license key');
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
      setLifecycle('trial_expired');
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
      setLifecycle('trial_active', { daysRemaining: 5 });
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
      setLifecycle('trial_active', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance();
      // With `fixedRowsTop` + `fixedColumnsStart`, the corner clone also holds the user's frozen
      // DATA cells - hovering them must never pop the license tooltip.
      const tbody = document.createElement('tbody');
      const dataCell = document.createElement('td');

      tbody.appendChild(document.createElement('tr')).appendChild(dataCell);
      hotInstance.cornerClone.appendChild(tbody);

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      roamPointerOver(dataCell);
      expect(wrapper.classList.contains('is-corner-hover')).toBe(false);
    });

    it('should resolve event targets against the grid\'s own realm, not the library\'s globals', () => {
      setLifecycle('trial_active', { daysRemaining: 5 });
      // An iframe-hosted grid delivers events whose targets are NOT instances of the loading
      // window's `Element`. Simulated by inverting the realms: with a foreign `rootWindow.Element`,
      // a roam over a test-realm node must be ignored - proof the detector consults `rootWindow`
      // (a bare `instanceof Element` would stamp the class here and die in a real iframe).
      const hotInstance = createMockHotInstance({
        rootWindow: { open: jest.fn(), queueMicrotask: fn => queueMicrotask(fn), Element: class {}, Node },
      });

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      roamPointerOver(hotInstance.cornerHeaderCell);
      expect(wrapper.classList.contains('is-corner-hover')).toBe(false);
    });

    it('should NOT stamp `is-corner-hover` when there is no corner cell (is-cornerless)', () => {
      setLifecycle('trial_active', { daysRemaining: 5 });
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
        .toBe('Your Handsontable license has expired.');
      expect(lock.querySelector('.ht-dialog__description').textContent)
        .toContain('purchase a commercial license');

      const buttons = lock.querySelectorAll('button');

      // Contact Sales only - the trial lock offers no dismiss affordance.
      expect(buttons).toHaveLength(1);
      expect(buttons[0].textContent).toBe('Contact Sales');

      buttons[0].click();
      expect(hotInstance.rootWindow.open).toHaveBeenCalledWith('mailto:sales@handsontable.com', '_blank', 'noopener');
    });

    it('should defer moving focus into the lock to afterInit (the grid is unrendered during init)', () => {
      setLifecycle('trial_expired_hard');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      // The lock DOM mounts immediately, but activation (deselect + focus move) waits for the grid.
      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);
      expect(hotInstance.focusScope.activateScope).not.toHaveBeenCalled();

      hotInstance.hooks.addHookOnce.afterInit();

      expect(hotInstance.deselectCell).toHaveBeenCalledTimes(1);
      expect(hotInstance.focusScope.activateScope).toHaveBeenCalledWith('licenseLock');
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

    it('should survive settings updates that do not change the key', () => {
      const hotInstance = mountTrialLock();

      expect(_getLicenseState).toHaveBeenCalledTimes(1);

      hotInstance.hooks.addHook.afterUpdateSettings();

      // Nothing tears the Core-owned lock down, and the unchanged key is not re-resolved
      // (resolution checksums the whole key - SHA-512).
      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);
      expect(_getLicenseState).toHaveBeenCalledTimes(1);
    });

    it('should unmount the lock when a settings update fixes the license key', () => {
      const hotInstance = mountTrialLock();

      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-lock')).not.toBe(null);

      // The customer bought a license and swapped the key at runtime: the surface re-resolves and
      // the lock releases the grid - no page reload needed. This must work regardless of the
      // Dialog plugin or any `dialog: true` setting (the lock does not depend on the plugin).
      hotInstance.getSettings.mockReturnValue({ licenseKey: 'A-FIXED-KEY' });
      setLifecycle('legacy_valid');
      hotInstance.hooks.addHook.afterUpdateSettings();

      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-lock')).toBe(null);
      expect(hotInstance.focusScope.deactivateScope).toHaveBeenCalledWith('licenseLock');
      expect(hotInstance.focusScope.unregisterScope).toHaveBeenCalledWith('licenseLock');
      // The lock's shortcuts die with it.
      expect(hotInstance.shortcutContext.removeShortcutsByGroup).toHaveBeenCalledWith('licenseLock');
    });
  });

  describe('subscription hard stop (Cases 3a/3b: the deployment mode selects the surface)', () => {
    it('should mount a closable lock with Contact Sales and Close buttons for an Internal-mode key', () => {
      setLifecycle('sub_expired_hard', {}, grantsWithMode('internal'));
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();

      const lock = hotInstance.rootOverlaysElement.querySelector('.ht-license-lock');

      expect(lock).not.toBe(null);
      expect(lock.getAttribute('role')).toBe('dialog');
      expect(lock.querySelector('.ht-dialog__title').textContent)
        .toBe('Your Handsontable subscription has expired.');

      const buttons = lock.querySelectorAll('button');

      expect(buttons).toHaveLength(2);
      expect(buttons[0].textContent).toBe('Contact Sales');
      expect(buttons[1].textContent).toBe('Close');
    });

    it('should dismiss the lock with the Close button, and keep it dismissed across settings updates', () => {
      setLifecycle('sub_expired_hard', {}, grantsWithMode('internal'));
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();

      const lock = hotInstance.rootOverlaysElement.querySelector('.ht-license-lock');

      lock.querySelectorAll('button')[1].click();

      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-lock')).toBe(null);
      expect(hotInstance.focusScope.deactivateScope).toHaveBeenCalledWith('licenseLock');

      // A settings update with the unchanged key remounts nothing - the dismissal sticks.
      hotInstance.hooks.addHook.afterUpdateSettings();

      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-lock')).toBe(null);
    });

    it('should dismiss the lock through the Escape shortcut (shortcut manager)', () => {
      setLifecycle('sub_expired_hard', {}, grantsWithMode('internal'));
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();

      const escape = findShortcut(hotInstance, 'Escape');

      expect(escape).not.toBe(undefined);
      expect(escape.group).toBe('licenseLock');

      escape.callback();

      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-lock')).toBe(null);
    });

    it.each(['saas', 'some-future-mode'])(
      'should stay console-only for the "%s" mode: no lock, no badge',
      (mode) => {
        setLifecycle('sub_expired_hard', {}, grantsWithMode(mode));
        const hotInstance = createMockHotInstance();

        initLicenseBranding(hotInstance);

        expect(hotInstance.rootOverlaysElement.children).toHaveLength(0);
        expect(hotInstance.focusScope.registerScope).not.toHaveBeenCalled();
      }
    );

    it('should unmount the lock when a settings update supplies a renewed key', () => {
      setLifecycle('sub_expired_hard', {}, grantsWithMode('internal'));
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();

      hotInstance.getSettings.mockReturnValue({ licenseKey: 'A-RENEWED-KEY' });
      setLifecycle('sub_active', { daysRemaining: 300 }, grantsWithMode('internal'));
      hotInstance.hooks.addHook.afterUpdateSettings();

      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-lock')).toBe(null);
    });
  });

  describe('re-branding on a runtime key change', () => {
    it('should remove the freemium badge when a commercial key is swapped in', () => {
      setLifecycle('freemium');
      const hotInstance = createMockHotInstance({ licenseKey: 'A-FREE-KEY' });

      initLicenseBranding(hotInstance);

      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-badge')).not.toBe(null);
      expect(hotInstance.rootElement.classList.contains('ht-license-badge-on')).toBe(true);

      // "Upgrading to a commercial key removes it" - the docs' promise must hold at runtime.
      hotInstance.getSettings.mockReturnValue({ licenseKey: 'A-COMMERCIAL-KEY' });
      setLifecycle('legacy_valid');
      hotInstance.hooks.addHook.afterUpdateSettings();

      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-badge')).toBe(null);
      expect(hotInstance.rootElement.classList.contains('ht-license-badge-on')).toBe(false);

      // The badge's render hooks are gone too - a later render must not re-stamp the glyph class.
      hotInstance.hooks.addHook.afterRender();
      expect(hotInstance.rootElement.classList.contains('ht-license-badge-on')).toBe(false);
    });

    it('should swap the badge surface when the key changes to another branded state', () => {
      setLifecycle('missing');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-popover__title').textContent)
        .toBe('Missing license key');

      hotInstance.getSettings.mockReturnValue({ licenseKey: 'A-TRIAL-KEY' });
      setLifecycle('trial_active', { daysRemaining: 30 });
      hotInstance.hooks.addHook.afterUpdateSettings();

      const popovers = hotInstance.rootOverlaysElement.querySelectorAll('.ht-license-popover');

      expect(popovers).toHaveLength(1);
      expect(popovers[0].querySelector('.ht-license-popover__title').textContent).toBe('Handsontable Trial');
    });

    it('should not re-resolve the state when a settings update keeps the same key', () => {
      setLifecycle('freemium');
      const hotInstance = createMockHotInstance({ licenseKey: 'A-FREE-KEY' });

      initLicenseBranding(hotInstance);

      expect(_getLicenseState).toHaveBeenCalledTimes(1);

      hotInstance.hooks.addHook.afterUpdateSettings();
      hotInstance.hooks.addHook.afterUpdateSettings();

      // Resolution checksums the whole key (SHA-512) - it must not re-run per settings update.
      expect(_getLicenseState).toHaveBeenCalledTimes(1);
      expect(hotInstance.rootOverlaysElement.querySelectorAll('.ht-license-badge-wrapper')).toHaveLength(1);
    });
  });
});
