import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { MultipleSelectionHandles } from '../multipleSelectionHandles';
import { setBrowserMeta, setPlatformMeta } from '../../../helpers/browser';
import { patchConsoleErrors } from '../../../../test/__mocks__/cssPolyfill';

const IPAD_DESKTOP_SAFARI_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';

/**
 * Covers DEV-1081: iPadOS 13+ Safari reports a Macintosh desktop UA, so
 * `isMobileBrowser()` is false while `isIpadOS()` is true. Selection-handle UI
 * must follow `isMobileOrIpadOS()`, or iPad gets the desktop fill square and no
 * range handles.
 */
describe('MultipleSelectionHandles iPadOS detection', () => {
  let container;
  let hot;

  beforeAll(() => {
    patchConsoleErrors();
    registerPlugin(MultipleSelectionHandles);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    setBrowserMeta();
    setPlatformMeta();
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      get: () => 0,
    });
  });

  /**
   * Applies the navigator shape Handsontable reads at construction time.
   *
   * @param {object} env The environment to emulate.
   * @param {string} env.userAgent The user agent string.
   * @param {string} env.platform `navigator.platform`.
   * @param {number} env.maxTouchPoints `navigator.maxTouchPoints`.
   */
  function emulate({ userAgent, platform, maxTouchPoints }) {
    setBrowserMeta({ userAgent, vendor: '' });
    setPlatformMeta({ platform });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      get: () => maxTouchPoints,
    });
  }

  /**
   * Builds a grid and selects a cell so the current selection border is drawn.
   *
   * @returns {object} The Handsontable instance.
   */
  function build() {
    hot = new Handsontable(container, {
      data: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 'x')),
      fillHandle: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectCell(0, 0);

    return hot;
  }

  /**
   * @returns {HTMLElement|null} The bottom mobile range handle, if created.
   */
  function bottomHandle() {
    return container.querySelector('.ht_master .bottomSelectionHandle');
  }

  /**
   * @returns {HTMLElement|null} The fill-handle square, if present in the DOM.
   */
  function fillCorner() {
    return container.querySelector('.ht_master .wtBorder.corner');
  }

  it('should enable the plugin and create range handles on iPadOS with a desktop UA', () => {
    emulate({
      userAgent: IPAD_DESKTOP_SAFARI_UA,
      platform: 'MacIntel',
      maxTouchPoints: 5,
    });
    build();

    const plugin = hot.getPlugin('multipleSelectionHandles');

    expect(plugin.isEnabled()).toBe(true);
    expect(plugin.enabled).toBe(true);
    expect(hot.rootElement.classList.contains('mobile')).toBe(true);
    expect(bottomHandle()).not.toBe(null);
    expect(fillCorner()).not.toBe(null);
    expect(fillCorner().style.display).toBe('none');
  });

  it('should stay disabled on desktop Mac Safari (no multitouch)', () => {
    emulate({
      userAgent: IPAD_DESKTOP_SAFARI_UA,
      platform: 'MacIntel',
      maxTouchPoints: 0,
    });
    build();

    const plugin = hot.getPlugin('multipleSelectionHandles');

    expect(plugin.isEnabled()).toBe(false);
    expect(plugin.enabled).toBe(false);
    expect(hot.rootElement.classList.contains('mobile')).toBe(false);
    expect(bottomHandle()).toBe(null);
    expect(fillCorner()).not.toBe(null);
    expect(fillCorner().style.display).not.toBe('none');
  });

  it('should not throw from disappear() when isIpadOS flips on after construction', () => {
    emulate({
      userAgent: IPAD_DESKTOP_SAFARI_UA,
      platform: 'MacIntel',
      maxTouchPoints: 0,
    });
    build();

    expect(bottomHandle()).toBe(null);

    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      get: () => 5,
    });

    expect(() => {
      hot.deselectCell();
      hot.selectCell(1, 1);
      hot.render();
    }).not.toThrow();
  });

  it('should still enable the plugin on an Android mobile user-agent', () => {
    emulate({
      userAgent: ANDROID_UA,
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
    });
    build();

    const plugin = hot.getPlugin('multipleSelectionHandles');

    expect(plugin.isEnabled()).toBe(true);
    expect(plugin.enabled).toBe(true);
    expect(bottomHandle()).not.toBe(null);
    expect(fillCorner()).not.toBe(null);
    expect(fillCorner().style.display).toBe('none');
  });
});
