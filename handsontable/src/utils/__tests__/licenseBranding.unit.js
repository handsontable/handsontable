import { initLicenseBranding } from '../licenseBranding';

jest.mock('../../helpers/mixed', () => ({
  _getLicenseState: jest.fn(),
  _createHardStopLicenseBar: jest.fn(),
  // The real formatter (not a jest.fn) - the popover copy tests assert the formatted date.
  _formatUtcDate: timestamp => new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: '2-digit', timeZone: 'UTC',
  }).format(timestamp),
}));
jest.mock('../licenseNotification', () => ({
  LICENSE_INFO_CLASS: 'hot-display-license-info',
  mountBottomLicenseBar: jest.fn(),
}));
jest.mock('../../plugins/registry', () => ({
  hasPlugin: jest.fn(),
}));

const { _getLicenseState, _createHardStopLicenseBar } = require('../../helpers/mixed');
const { mountBottomLicenseBar } = require('../licenseNotification');
const { hasPlugin } = require('../../plugins/registry');

function createMockDialog(overrides = {}) {
  return {
    enabled: false,
    enablePlugin: jest.fn(function() {
      this.enabled = true;
    }),
    isVisible: jest.fn(() => false),
    show: jest.fn(),
    hide: jest.fn(),
    ...overrides,
  };
}

function createMockHotInstance(overrides = {}) {
  const hooks = { addHook: {}, addHookOnce: {} };
  const registerScope = jest.fn();
  const rootElement = document.createElement('div');
  const cornerClone = document.createElement('div');
  // The corner clone's header area: hover only triggers inside the clone's `thead` (the clone can
  // also hold frozen data cells), and the badge height is measured from the first header row.
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
    registerScope,
    cornerClone,
    cornerHeaderRow,
    cornerHeaderCell,
    getSettings: jest.fn(() => ({ licenseKey: overrides.licenseKey })),
    getPlugin: jest.fn(() => overrides.dialog),
    addHook: jest.fn((name, cb) => {
      hooks.addHook[name] = cb;
    }),
    addHookOnce: jest.fn((name, cb) => {
      hooks.addHookOnce[name] = cb;
    }),
    getFocusScopeManager: jest.fn(() => ({ registerScope })),
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

function setLifecycle(state, extra = {}, grants = { unrestricted: false, products: {} }) {
  _getLicenseState.mockReturnValue({
    lifecycle: { state, daysRemaining: null, expiryTimestamp: null, hardStopTimestamp: null, ...extra },
    grants,
  });
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

describe('licenseBranding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _createHardStopLicenseBar.mockReturnValue(document.createElement('div'));
  });

  describe('unbranded states', () => {
    it.each(['sub_ending', 'sub_expired', 'perp_expired', 'legacy_valid'])(
      'should render nothing for the "%s" state',
      (state) => {
        setLifecycle(state);
        const hotInstance = createMockHotInstance();

        initLicenseBranding(hotInstance);

        expect(hasPlugin).not.toHaveBeenCalled();
        expect(mountBottomLicenseBar).not.toHaveBeenCalled();
        expect(hotInstance.addHook).not.toHaveBeenCalled();
        expect(hotInstance.addHookOnce).not.toHaveBeenCalled();
        expect(hotInstance.registerScope).not.toHaveBeenCalled();
        expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-badge')).toBe(null);
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
        expect(overlays.querySelector('.ht-license-badge__glyph')).not.toBe(null);
        expect(overlays.querySelector('.ht-license-popover')).not.toBe(null);
        expect(overlays.querySelector('.ht-license-popover__link')).not.toBe(null);

        // No hard-stop machinery in the branded, non-blocking states.
        expect(hasPlugin).not.toHaveBeenCalled();
        expect(mountBottomLicenseBar).not.toHaveBeenCalled();
      }
    );

    it.each(['trial_expired', 'legacy_expired'])(
      'should register the focus scope for the dismissible "%s" popover (an actionable dialog)',
      (state) => {
        setLifecycle(state, { expiryTimestamp: Date.UTC(2026, 7, 27) });
        const hotInstance = createMockHotInstance();

        initLicenseBranding(hotInstance);

        expect(hotInstance.registerScope).toHaveBeenCalledWith(
          'licenseBranding', expect.any(HTMLElement), expect.objectContaining({
            shortcutsContextName: 'plugin:licenseBranding',
          })
        );
      }
    );

    it.each(['trial_active', 'freemium', 'missing', 'invalid'])(
      'should keep the hover-only "%s" badge out of the Tab order (no focus scope, tabindex -1)',
      (state) => {
        setLifecycle(state, { daysRemaining: 5 });
        const hotInstance = createMockHotInstance();

        initLicenseBranding(hotInstance);

        // The non-commercial/missing badges mount on virtually every developer grid - a focusable
        // badge would add a Tab stop to every keyboard path through the grid.
        expect(hotInstance.registerScope).not.toHaveBeenCalled();
        expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-badge').tabIndex).toBe(-1);
      }
    );

    it('should stamp `is-cornerless` when there is no corner cell, and re-sync it on settings updates', () => {
      setLifecycle('trial_expired');
      const hotInstance = createMockHotInstance({ rowHeaders: false });

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      // No corner -> no badge to sit on: the CSS hides the badge and re-anchors the popover to the
      // table's inline-start edge, without the tail.
      expect(wrapper.classList.contains('is-cornerless')).toBe(true);

      // Headers can be toggled at runtime - the class follows on the next render.
      hotInstance.hasRowHeaders.mockReturnValue(true);
      hotInstance.hooks.addHook.afterRender();

      expect(wrapper.classList.contains('is-cornerless')).toBe(false);
    });

    it('should size the badge area from the measured corner clone, so it centers in every theme', () => {
      setLifecycle('trial_active', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance();

      Object.defineProperty(hotInstance.cornerClone, 'offsetWidth', { configurable: true, value: 48 });
      Object.defineProperty(hotInstance.cornerHeaderRow, 'offsetHeight', { configurable: true, value: 26 });

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('48px');
      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-height')).toBe('26px');

      // The corner resizes at runtime (for example wider row numbers) - the next render re-syncs.
      Object.defineProperty(hotInstance.cornerClone, 'offsetWidth', { configurable: true, value: 64 });
      hotInstance.hooks.addHook.afterRender();

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('64px');
    });

    it('should size the badge to the FIRST header row when the corner stacks nested headers', () => {
      setLifecycle('trial_active', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance();
      const secondRow = document.createElement('tr');

      hotInstance.cornerHeaderRow.parentElement.appendChild(secondRow);
      Object.defineProperty(hotInstance.cornerClone, 'offsetWidth', { configurable: true, value: 50 });
      // The whole corner stacks several header rows; the badge belongs to the topmost one.
      Object.defineProperty(hotInstance.cornerClone, 'offsetHeight', { configurable: true, value: 116 });
      Object.defineProperty(hotInstance.cornerHeaderRow, 'offsetHeight', { configurable: true, value: 29 });

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-height')).toBe('29px');
    });

    it('should ignore the 1px corner flutter of the scrolled-state border compensation', () => {
      setLifecycle('trial_active', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance();

      Object.defineProperty(hotInstance.cornerClone, 'offsetWidth', { configurable: true, value: 50 });
      Object.defineProperty(hotInstance.cornerHeaderRow, 'offsetHeight', { configurable: true, value: 29 });

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('50px');

      // Horizontal scroll grows the corner clone by exactly 1px (doubled-border compensation) - the
      // badge must NOT follow, or the glyph nudges left/right on every scroll.
      Object.defineProperty(hotInstance.cornerClone, 'offsetWidth', { configurable: true, value: 51 });
      hotInstance.hooks.addHook.afterRender();

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('50px');

      // Scrolling back restores 50 - still no write.
      Object.defineProperty(hotInstance.cornerClone, 'offsetWidth', { configurable: true, value: 50 });
      hotInstance.hooks.addHook.afterRender();

      expect(wrapper.style.getPropertyValue('--ht-license-badge-area-width')).toBe('50px');
    });

    it('should not stamp `is-cornerless` when both header types are on', () => {
      setLifecycle('trial_expired');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const wrapper = hotInstance.rootOverlaysElement.querySelector('.ht-license-badge-wrapper');

      expect(wrapper.classList.contains('is-cornerless')).toBe(false);
    });

    it('should show the trial-active tooltip copy with the days remaining and a Contact Sales link', () => {
      setLifecycle('trial_active', { daysRemaining: 5 });
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const overlays = hotInstance.rootOverlaysElement;
      const popover = overlays.querySelector('.ht-license-popover');

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

    it('should auto-open the soft-stop popover as a dialog with a working close button', () => {
      setLifecycle('trial_expired');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const overlays = hotInstance.rootOverlaysElement;
      const wrapper = overlays.querySelector('.ht-license-badge-wrapper');
      const badge = overlays.querySelector('.ht-license-badge');
      const popover = overlays.querySelector('.ht-license-popover');
      const closeButton = popover.querySelector('.ht-license-popover__close');

      expect(popover.getAttribute('role')).toBe('dialog');
      expect(popover.querySelector('.ht-license-popover__title').textContent).toBe('Expired trial license key');
      expect(popover.classList.contains('is-open')).toBe(true);
      expect(badge.getAttribute('aria-expanded')).toBe('true');
      expect(closeButton).not.toBe(null);

      closeButton.click();

      expect(popover.classList.contains('is-open')).toBe(false);
      // Dismissal stamps `is-dismissed`: it gates the hover/focus CSS open rules, so the popover
      // closes even though the pointer still hovers it at click time.
      expect(wrapper.classList.contains('is-dismissed')).toBe(true);
      expect(badge.getAttribute('aria-expanded')).toBe('false');
    });

    it('should dismiss the soft-stop popover on Escape', () => {
      setLifecycle('trial_expired');
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      const overlays = hotInstance.rootOverlaysElement;
      const wrapper = overlays.querySelector('.ht-license-badge-wrapper');
      const popover = overlays.querySelector('.ht-license-popover');

      popover.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(popover.classList.contains('is-open')).toBe(false);
      expect(wrapper.classList.contains('is-dismissed')).toBe(true);
    });

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

    it('should re-arm the dismissed soft-stop popover once the pointer and focus leave', () => {
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
      expect(hotInstance.registerScope).not.toHaveBeenCalled();
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

      const overlays = hotInstance.rootOverlaysElement;
      const badge = overlays.querySelector('.ht-license-badge');
      const popover = overlays.querySelector('.ht-license-popover');
      const closeButton = popover.querySelector('.ht-license-popover__close');

      expect(popover.getAttribute('role')).toBe('dialog');
      expect(popover.querySelector('.ht-license-popover__title').textContent).toBe('Expired license key');
      expect(popover.querySelector('.ht-license-popover__body').textContent)
        .toContain('expired on May 24, 2011');
      expect(popover.classList.contains('is-open')).toBe(true);
      expect(badge.getAttribute('aria-expanded')).toBe('true');
      expect(closeButton).not.toBe(null);

      closeButton.click();

      expect(popover.classList.contains('is-open')).toBe(false);
    });
  });

  describe('trial_expired_hard with the Dialog plugin bundled', () => {
    beforeEach(() => {
      setLifecycle('trial_expired_hard');
      hasPlugin.mockReturnValue(true);
    });

    it('should not render the bottom bar (the dialog replaces it)', () => {
      const dialog = createMockDialog();
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);

      expect(mountBottomLicenseBar).not.toHaveBeenCalled();
    });

    it('should defer the first show to afterInit and re-assert on afterUpdateSettings', () => {
      const dialog = createMockDialog();
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);

      // Nothing shown synchronously - the grid has not rendered yet during init.
      expect(dialog.show).not.toHaveBeenCalled();
      expect(hotInstance.addHookOnce).toHaveBeenCalledWith('afterInit', expect.any(Function));
      expect(hotInstance.addHook).toHaveBeenCalledWith('afterUpdateSettings', expect.any(Function));
    });

    it('should enable the plugin on demand and show a blocking Contact Sales dialog on afterInit', () => {
      const dialog = createMockDialog();
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();

      expect(dialog.enablePlugin).toHaveBeenCalledTimes(1);
      expect(dialog.show).toHaveBeenCalledTimes(1);

      const options = dialog.show.mock.calls[0][0];

      expect(options.closable).toBe(false);
      expect(options.customClassName).toBe('ht-license-lock');
      expect(options.template.type).toBe('confirm');
      expect(options.template.title).toBe('Your Handsontable license has expired.');
      expect(options.template.buttons).toHaveLength(1);
      expect(options.template.buttons[0].text).toBe('Contact Sales');

      // The button opens the sales contact.
      options.template.buttons[0].callback();
      expect(hotInstance.rootWindow.open).toHaveBeenCalledWith('mailto:sales@handsontable.com', '_blank', 'noopener');
    });

    it('should not enable an already-enabled plugin again', () => {
      const dialog = createMockDialog({ enabled: true });
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();

      expect(dialog.enablePlugin).not.toHaveBeenCalled();
      expect(dialog.show).toHaveBeenCalledTimes(1);
    });

    it('should be idempotent: it does not re-show while the dialog is already visible', () => {
      const dialog = createMockDialog({ enabled: true, isVisible: jest.fn(() => true) });
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();
      // Simulate a settings update re-asserting the lock while the dialog is still up.
      hotInstance.hooks.addHook.afterUpdateSettings();

      expect(dialog.show).not.toHaveBeenCalled();
    });

    it('should re-show after a settings update that tore the dialog down', () => {
      const dialog = createMockDialog({ enabled: true });
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();
      expect(dialog.show).toHaveBeenCalledTimes(1);

      // An updateSettings disabled and hid the dialog; the re-assert hook brings it back.
      dialog.enabled = false;
      hotInstance.hooks.addHook.afterUpdateSettings();

      expect(dialog.enablePlugin).toHaveBeenCalled();
      expect(dialog.show).toHaveBeenCalledTimes(2);
    });

    it('should release the lock when a settings update fixes the license key', () => {
      const dialog = createMockDialog({ enabled: true });
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();
      expect(dialog.show).toHaveBeenCalledTimes(1);

      // The customer bought a license and swapped the key at runtime: the re-assert must re-read
      // the CURRENT key and stand down instead of locking a now-licensed grid.
      hotInstance.getSettings.mockReturnValue({ licenseKey: 'A-FIXED-KEY' });
      setLifecycle('trial_active', { daysRemaining: 30 });
      hotInstance.hooks.addHook.afterUpdateSettings();

      expect(dialog.show).toHaveBeenCalledTimes(1);
    });

    it('should re-assert the lock when something else hides the dialog (an app dialog closing)', async() => {
      const dialog = createMockDialog({ enabled: true });
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();
      expect(dialog.show).toHaveBeenCalledTimes(1);

      // The Dialog plugin is a single shared surface: an app hiding it (or an app dialog closing)
      // must not defeat the non-closable lock. The re-assert is microtask-deferred.
      hotInstance.hooks.addHook.afterDialogHide();
      await Promise.resolve();

      expect(dialog.show).toHaveBeenCalledTimes(2);
    });

    it('should NOT re-assert the lock for the hide that is part of destroy()', async() => {
      const dialog = createMockDialog({ enabled: true });
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();
      expect(dialog.show).toHaveBeenCalledTimes(1);

      // The teardown hide fires while destroying; by the time the deferred re-assert runs, the
      // instance is destroyed and must be left alone.
      hotInstance.hooks.addHook.afterDialogHide();
      hotInstance.isDestroyed = true;
      await Promise.resolve();

      expect(dialog.show).toHaveBeenCalledTimes(1);
    });

    it('should do nothing when the plugin instance is unavailable', () => {
      const hotInstance = createMockHotInstance({ dialog: undefined });

      initLicenseBranding(hotInstance);

      expect(() => hotInstance.hooks.addHookOnce.afterInit()).not.toThrow();
      expect(mountBottomLicenseBar).not.toHaveBeenCalled();
    });
  });

  describe('trial_expired_hard without the Dialog plugin bundled', () => {
    beforeEach(() => {
      setLifecycle('trial_expired_hard');
      hasPlugin.mockReturnValue(false);
    });

    it('should fall back to mounting the hard-stop bottom bar', () => {
      const barNode = document.createElement('div');

      _createHardStopLicenseBar.mockReturnValue(barNode);
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      expect(_createHardStopLicenseBar).toHaveBeenCalledWith('hot-display-license-info');
      expect(mountBottomLicenseBar).toHaveBeenCalledWith(hotInstance, barNode);
      // No dialog machinery in the fallback path.
      expect(hotInstance.addHook).not.toHaveBeenCalled();
      expect(hotInstance.addHookOnce).not.toHaveBeenCalled();
    });
  });

  describe('sub_expired_hard (Cases 3a/3b: the deployment mode selects the surface)', () => {
    beforeEach(() => {
      hasPlugin.mockReturnValue(true);
    });

    it('should show a closable dialog with Contact Sales and Close buttons for an Internal-mode key', () => {
      setLifecycle('sub_expired_hard', {}, grantsWithMode('internal'));
      const dialog = createMockDialog();
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);

      // Nothing shown synchronously - the grid has not rendered yet during init.
      expect(dialog.show).not.toHaveBeenCalled();

      hotInstance.hooks.addHookOnce.afterInit();

      expect(dialog.enablePlugin).toHaveBeenCalledTimes(1);
      expect(dialog.show).toHaveBeenCalledTimes(1);

      const options = dialog.show.mock.calls[0][0];

      expect(options.closable).toBe(true);
      expect(options.customClassName).toBe('ht-license-lock');
      expect(options.template.title).toBe('Your Handsontable subscription has expired.');
      expect(options.template.buttons).toHaveLength(2);
      expect(options.template.buttons[0].text).toBe('Contact Sales');
      expect(options.template.buttons[1].text).toBe('Close');

      // The Close button hides the dialog.
      options.template.buttons[1].callback();
      expect(dialog.hide).toHaveBeenCalledTimes(1);

      // No bar and no badge - the dialog is the only subscription surface.
      expect(mountBottomLicenseBar).not.toHaveBeenCalled();
      expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-badge')).toBe(null);
    });

    it.each(['saas', 'some-future-mode'])(
      'should stay console-only for the "%s" mode: no dialog, no bar, no badge',
      (mode) => {
        setLifecycle('sub_expired_hard', {}, grantsWithMode(mode));
        const dialog = createMockDialog();
        const hotInstance = createMockHotInstance({ dialog });

        initLicenseBranding(hotInstance);

        // The mode gate short-circuits before the plugin lookup.
        expect(hasPlugin).not.toHaveBeenCalled();
        expect(hotInstance.addHook).not.toHaveBeenCalled();
        expect(hotInstance.addHookOnce).not.toHaveBeenCalled();
        expect(mountBottomLicenseBar).not.toHaveBeenCalled();
        expect(hotInstance.rootOverlaysElement.querySelector('.ht-license-badge')).toBe(null);
      }
    );

    it('should not fall back to the bottom bar when the Dialog plugin is not bundled', () => {
      setLifecycle('sub_expired_hard', {}, grantsWithMode('internal'));
      hasPlugin.mockReturnValue(false);
      const hotInstance = createMockHotInstance();

      initLicenseBranding(hotInstance);

      // The bar is never a subscription surface - the console error is the only remaining signal.
      expect(mountBottomLicenseBar).not.toHaveBeenCalled();
      expect(hotInstance.addHookOnce).not.toHaveBeenCalled();
    });

    it('should re-assert the dialog after a settings-update teardown (not a user dismissal)', () => {
      setLifecycle('sub_expired_hard', {}, grantsWithMode('internal'));
      const dialog = createMockDialog();
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();

      expect(dialog.show).toHaveBeenCalledTimes(1);

      // A settings update tears the plugin down: the hide and `afterUpdateSettings` fire in the
      // same task, so the hide is not a dismissal and the lock comes back.
      hotInstance.hooks.addHook.afterDialogHide();
      hotInstance.hooks.addHook.afterUpdateSettings();

      expect(dialog.show).toHaveBeenCalledTimes(2);
    });

    it('should NOT re-assert the dialog after an Escape dismissal', async() => {
      setLifecycle('sub_expired_hard', {}, grantsWithMode('internal'));
      const dialog = createMockDialog();
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();

      // An Escape close is a bare hide with no settings update in the same task: once the task ends
      // (the awaited microtask), the hide is confirmed as a user dismissal.
      hotInstance.hooks.addHook.afterDialogHide();
      await Promise.resolve();

      hotInstance.hooks.addHook.afterUpdateSettings();

      expect(dialog.show).toHaveBeenCalledTimes(1);
    });

    it('should NOT re-assert the dialog after a Close-button dismissal', () => {
      setLifecycle('sub_expired_hard', {}, grantsWithMode('internal'));
      const dialog = createMockDialog();
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();

      // The Close button reports the dismissal directly - no timing inference, so even a settings
      // update in the SAME task does not bring the dialog back.
      dialog.show.mock.calls[0][0].template.buttons[1].callback();
      hotInstance.hooks.addHook.afterDialogHide();
      hotInstance.hooks.addHook.afterUpdateSettings();

      expect(dialog.show).toHaveBeenCalledTimes(1);
    });

    it('should release the lock when a settings update fixes the license key', () => {
      setLifecycle('sub_expired_hard', {}, grantsWithMode('internal'));
      const dialog = createMockDialog();
      const hotInstance = createMockHotInstance({ dialog });

      initLicenseBranding(hotInstance);
      hotInstance.hooks.addHookOnce.afterInit();
      expect(dialog.show).toHaveBeenCalledTimes(1);

      // A renewed subscription key swapped in at runtime must stand the lock down.
      hotInstance.getSettings.mockReturnValue({ licenseKey: 'A-RENEWED-KEY' });
      setLifecycle('sub_active', { daysRemaining: 300 }, grantsWithMode('internal'));
      hotInstance.hooks.addHook.afterDialogHide();
      hotInstance.hooks.addHook.afterUpdateSettings();

      expect(dialog.show).toHaveBeenCalledTimes(1);
    });
  });
});
