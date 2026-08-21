import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { DragToScroll } from '../dragToScroll';
import { MultipleSelectionHandles } from '../../multipleSelectionHandles';
import { setBrowserMeta } from '../../../helpers/browser';
import { patchConsoleErrors } from '../../../../test/__mocks__/cssPolyfill';

const MOBILE_USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';

/**
 * Covers the touch input path of DragToScroll (#11658).
 *
 * The plugin used to bind `mousemove` only. A browser fires no `mousemove` while a finger is down,
 * so dragging a mobile selection handle to the viewport edge never engaged the auto-scroller and the
 * selection froze at the last cell on screen.
 */
describe('DragToScroll mobile touch auto-scroll', () => {
  let container;
  let hot;

  beforeAll(() => {
    // jsdom 16 cannot parse the theme's modern CSS (`light-dark()`), so every grid built here logs a
    // "Could not parse CSS stylesheet" dump. None of it is about this suite, and ten grids' worth
    // overflows the output buffer the pre-push hook reads the run through.
    patchConsoleErrors();

    registerPlugin(DragToScroll);
    registerPlugin(MultipleSelectionHandles);
  });

  beforeEach(() => {
    // MultipleSelectionHandles is gated on isMobileBrowser(), which reads the user agent at plugin
    // init time - so the agent has to be swapped before the instance is built.
    setBrowserMeta({ userAgent: MOBILE_USER_AGENT, vendor: '' });

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    setBrowserMeta();
  });

  /**
   * Builds a grid with a selection, so the mobile selection handles are rendered.
   *
   * @returns {object} The Handsontable instance.
   */
  function build() {
    hot = new Handsontable(container, {
      data: Array.from({ length: 50 }, () => Array.from({ length: 10 }, () => 'x')),
      dragToScroll: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectCell(2, 2);

    return hot;
  }

  /**
   * Builds a touch event carrying a single touch point.
   *
   * The touch list is attached as a plain property because jsdom does not implement `Touch`.
   *
   * @param {string} type The event type.
   * @param {number} [clientX] The touch point's viewport X coordinate.
   * @param {number} [clientY] The touch point's viewport Y coordinate.
   * @returns {Event} The event.
   */
  function touchEvent(type, clientX, clientY) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    const touches = clientX === undefined ? [] : [{ clientX, clientY }];

    Object.defineProperty(event, 'touches', { value: touches });

    return event;
  }

  /**
   * Returns the hit area of the bottom mobile selection handle.
   *
   * @returns {HTMLElement} The hit area element.
   */
  function bottomHandle() {
    return container.querySelector('.bottomSelectionHandle-HitArea');
  }

  it('should render the mobile selection handles, so the rest of this suite drives a real drag', () => {
    build();

    expect(hot.getPlugin('multipleSelectionHandles').isEnabled()).toBe(true);
    expect(bottomHandle()).not.toBe(null);
  });

  it('should arm auto-scroll when a touch drag starts on a selection handle', () => {
    build();

    bottomHandle().dispatchEvent(touchEvent('touchstart'));

    // The mobile handles run on touch events only, so no `mousedown` hook fires for them. The
    // ordering this depends on comes from DOM bubbling: MultipleSelectionHandles listens on
    // `rootElement`, DragToScroll on the document above it.
    expect(hot.getPlugin('multipleSelectionHandles').isDragged()).toBe(true);
    expect(hot.getPlugin('dragToScroll').isListening()).toBe(true);
  });

  it('should not arm auto-scroll for a touch that does not start on a selection handle', () => {
    build();

    // The grid body, not a handle hit area.
    hot.rootElement.dispatchEvent(touchEvent('touchstart'));

    expect(hot.getPlugin('multipleSelectionHandles').isDragged()).toBe(false);
    expect(hot.getPlugin('dragToScroll').isListening()).toBe(false);
  });

  it('should feed the moving finger position to the viewport boundary check', () => {
    build();

    const plugin = hot.getPlugin('dragToScroll');

    bottomHandle().dispatchEvent(touchEvent('touchstart'));

    const checkSpy = jest.spyOn(plugin, 'check');

    document.dispatchEvent(touchEvent('touchmove', 300, 900));

    expect(checkSpy).toHaveBeenCalledWith(300, 900);
  });

  it('should ignore a touchmove while no drag is armed', () => {
    build();

    const plugin = hot.getPlugin('dragToScroll');
    const checkSpy = jest.spyOn(plugin, 'check');

    document.dispatchEvent(touchEvent('touchmove', 300, 900));

    expect(checkSpy).not.toHaveBeenCalled();
  });

  it('should stop listening when the finger lifts', () => {
    build();

    const plugin = hot.getPlugin('dragToScroll');

    bottomHandle().dispatchEvent(touchEvent('touchstart'));

    expect(plugin.isListening()).toBe(true);

    document.dispatchEvent(touchEvent('touchend'));

    expect(plugin.isListening()).toBe(false);
  });

  it('should stop listening when the touch gesture is cancelled', () => {
    build();

    const plugin = hot.getPlugin('dragToScroll');

    bottomHandle().dispatchEvent(touchEvent('touchstart'));

    expect(plugin.isListening()).toBe(true);

    document.dispatchEvent(touchEvent('touchcancel'));

    expect(plugin.isListening()).toBe(false);
  });

  it('should clear the handle drag when the gesture is cancelled instead of ended', () => {
    build();

    const handles = hot.getPlugin('multipleSelectionHandles');

    bottomHandle().dispatchEvent(touchEvent('touchstart'));

    expect(handles.isDragged()).toBe(true);

    // A cancelled gesture never reaches `touchend`. Leaving `dragged` set would let the next
    // unrelated touch arm auto-scroll with no handle press at all.
    hot.rootElement.dispatchEvent(touchEvent('touchcancel'));

    expect(handles.isDragged()).toBe(false);

    hot.rootElement.dispatchEvent(touchEvent('touchstart'));

    expect(hot.getPlugin('dragToScroll').isListening()).toBe(false);
  });

  it('should keep auto-scrolling while a finger is still down', () => {
    build();

    const plugin = hot.getPlugin('dragToScroll');

    bottomHandle().dispatchEvent(touchEvent('touchstart'));

    expect(plugin.isListening()).toBe(true);

    // `touchend` fires per touch point. A second finger or a palm lifting leaves one touch behind,
    // and must not stop a drag the first finger is still performing.
    document.dispatchEvent(touchEvent('touchend', 100, 200));

    expect(plugin.isListening()).toBe(true);

    document.dispatchEvent(touchEvent('touchend'));

    expect(plugin.isListening()).toBe(false);
  });

  it('should keep the handle drag alive while a finger is still down', () => {
    build();

    const handles = hot.getPlugin('multipleSelectionHandles');

    bottomHandle().dispatchEvent(touchEvent('touchstart'));

    expect(handles.isDragged()).toBe(true);

    bottomHandle().dispatchEvent(touchEvent('touchend', 100, 200));

    expect(handles.isDragged()).toBe(true);

    bottomHandle().dispatchEvent(touchEvent('touchend'));

    expect(handles.isDragged()).toBe(false);
  });
});
