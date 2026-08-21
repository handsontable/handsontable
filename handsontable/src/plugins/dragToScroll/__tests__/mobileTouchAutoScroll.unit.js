import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { DragToScroll } from '../dragToScroll';
import { MultipleSelectionHandles } from '../../multipleSelectionHandles';
import { setBrowserMeta } from '../../../helpers/browser';
import { patchConsoleErrors } from '../../../../test/__mocks__/cssPolyfill';

const MOBILE_USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36';

// The finger that grabs a handle, and an unrelated one resting elsewhere. Distinct identifiers are
// what let these tests tell "a finger lifted" apart from "the dragging finger lifted".
const HANDLE_FINGER = { id: 1, x: 120, y: 140 };
const OTHER_FINGER = { id: 2, x: 30, y: 40 };

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
   * Builds a touch event, mirroring what a browser reports.
   *
   * The lists are attached as plain properties because jsdom implements neither `Touch` nor
   * `TouchEvent`. Keeping them distinct is the point of these tests: `touches` is every finger still
   * on the screen and `changedTouches` is only the fingers this event is about.
   *
   * @param {string} type The event type.
   * @param {object} [lists] The touch lists.
   * @param {Array} [lists.touches] Fingers still on the screen, as `{id, x, y}`.
   * @param {Array} [lists.changed] Fingers this event is about, as `{id, x, y}`.
   * @returns {Event} The event.
   */
  function touchEvent(type, { touches = [], changed = [] } = {}) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    const toTouch = ({ id, x = 0, y = 0 }) => ({ identifier: id, clientX: x, clientY: y });

    Object.defineProperty(event, 'touches', { value: touches.map(toTouch) });
    Object.defineProperty(event, 'changedTouches', { value: changed.map(toTouch) });

    return event;
  }

  /**
   * Builds the `touchstart` of a single finger landing.
   *
   * @param {object} finger The finger, as `{id, x, y}`.
   * @returns {Event} The event.
   */
  function touchStart(finger) {
    return touchEvent('touchstart', { touches: [finger], changed: [finger] });
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

    bottomHandle().dispatchEvent(touchStart(HANDLE_FINGER));

    // The mobile handles run on touch events only, so no `mousedown` hook fires for them. The
    // ordering this depends on comes from DOM bubbling: MultipleSelectionHandles listens on
    // `rootElement`, DragToScroll on the document above it.
    expect(hot.getPlugin('multipleSelectionHandles').isDragged()).toBe(true);
    expect(hot.getPlugin('dragToScroll').isListening()).toBe(true);
  });

  it('should not arm auto-scroll for a touch that does not start on a selection handle', () => {
    build();

    // The grid body, not a handle hit area.
    hot.rootElement.dispatchEvent(touchStart(HANDLE_FINGER));

    expect(hot.getPlugin('multipleSelectionHandles').isDragged()).toBe(false);
    expect(hot.getPlugin('dragToScroll').isListening()).toBe(false);
  });

  it('should feed the moving finger position to the viewport boundary check', () => {
    build();

    const plugin = hot.getPlugin('dragToScroll');

    bottomHandle().dispatchEvent(touchStart(HANDLE_FINGER));

    const checkSpy = jest.spyOn(plugin, 'check');

    document.dispatchEvent(touchEvent('touchmove', {
      touches: [{ id: HANDLE_FINGER.id, x: 300, y: 900 }],
      changed: [{ id: HANDLE_FINGER.id, x: 300, y: 900 }],
    }));

    expect(checkSpy).toHaveBeenCalledWith(300, 900);
  });

  it('should ignore a touchmove while no drag is armed', () => {
    build();

    const plugin = hot.getPlugin('dragToScroll');
    const checkSpy = jest.spyOn(plugin, 'check');

    document.dispatchEvent(touchEvent('touchmove', {
      touches: [{ id: HANDLE_FINGER.id, x: 300, y: 900 }],
      changed: [{ id: HANDLE_FINGER.id, x: 300, y: 900 }],
    }));

    expect(checkSpy).not.toHaveBeenCalled();
  });

  it('should stop listening when the finger lifts', () => {
    build();

    const plugin = hot.getPlugin('dragToScroll');

    bottomHandle().dispatchEvent(touchStart(HANDLE_FINGER));

    expect(plugin.isListening()).toBe(true);

    document.dispatchEvent(touchEvent('touchend', { changed: [HANDLE_FINGER] }));

    expect(plugin.isListening()).toBe(false);
  });

  it('should stop listening when the touch gesture is cancelled', () => {
    build();

    const plugin = hot.getPlugin('dragToScroll');

    bottomHandle().dispatchEvent(touchStart(HANDLE_FINGER));

    expect(plugin.isListening()).toBe(true);

    document.dispatchEvent(touchEvent('touchcancel', { changed: [HANDLE_FINGER] }));

    expect(plugin.isListening()).toBe(false);
  });

  it('should clear the handle drag when the gesture is cancelled instead of ended', () => {
    build();

    const handles = hot.getPlugin('multipleSelectionHandles');

    bottomHandle().dispatchEvent(touchStart(HANDLE_FINGER));

    expect(handles.isDragged()).toBe(true);

    // A cancelled gesture never reaches `touchend`. Leaving `dragged` set would let the next
    // unrelated touch arm auto-scroll with no handle press at all.
    hot.rootElement.dispatchEvent(touchEvent('touchcancel', { changed: [HANDLE_FINGER] }));

    expect(handles.isDragged()).toBe(false);

    hot.rootElement.dispatchEvent(touchStart(OTHER_FINGER));

    expect(hot.getPlugin('dragToScroll').isListening()).toBe(false);
  });

  it('should end the drag when the dragging finger lifts, even with another finger still down', () => {
    build();

    const handles = hot.getPlugin('multipleSelectionHandles');
    const plugin = hot.getPlugin('dragToScroll');

    bottomHandle().dispatchEvent(touchStart(HANDLE_FINGER));
    hot.rootElement.dispatchEvent(touchEvent('touchstart', {
      touches: [HANDLE_FINGER, OTHER_FINGER],
      changed: [OTHER_FINGER],
    }));

    // The dragging finger lifts first. `touches` still lists the other finger, so a check for "no
    // fingers left" would miss this and strand the plugin mid-drag for good.
    const lift = touchEvent('touchend', { touches: [OTHER_FINGER], changed: [HANDLE_FINGER] });

    bottomHandle().dispatchEvent(lift);
    document.dispatchEvent(lift);

    expect(handles.isDragged()).toBe(false);
    expect(plugin.isListening()).toBe(false);
  });

  it('should keep the drag alive when a finger other than the dragging one lifts', () => {
    build();

    const handles = hot.getPlugin('multipleSelectionHandles');
    const plugin = hot.getPlugin('dragToScroll');

    bottomHandle().dispatchEvent(touchStart(HANDLE_FINGER));
    hot.rootElement.dispatchEvent(touchEvent('touchstart', {
      touches: [HANDLE_FINGER, OTHER_FINGER],
      changed: [OTHER_FINGER],
    }));

    // A palm or a second finger lifting must not tear down a drag the first finger is still
    // performing - nothing re-arms short of a new `touchstart`.
    const strayLift = touchEvent('touchend', { touches: [HANDLE_FINGER], changed: [OTHER_FINGER] });

    hot.rootElement.dispatchEvent(strayLift);
    document.dispatchEvent(strayLift);

    expect(handles.isDragged()).toBe(true);
    expect(plugin.isListening()).toBe(true);
  });

  it('should keep the drag alive when a finger other than the dragging one is cancelled', () => {
    build();

    const handles = hot.getPlugin('multipleSelectionHandles');

    bottomHandle().dispatchEvent(touchStart(HANDLE_FINGER));
    hot.rootElement.dispatchEvent(touchEvent('touchstart', {
      touches: [HANDLE_FINGER, OTHER_FINGER],
      changed: [OTHER_FINGER],
    }));

    hot.rootElement.dispatchEvent(touchEvent('touchcancel', {
      touches: [HANDLE_FINGER],
      changed: [OTHER_FINGER],
    }));

    expect(handles.isDragged()).toBe(true);
  });

  it('should follow the finger holding the handle, not the first one placed on the screen', () => {
    build();

    const plugin = hot.getPlugin('dragToScroll');

    // A thumb rests on the grid BEFORE the handle is grabbed, so it owns `touches[0]`.
    hot.rootElement.dispatchEvent(touchStart(OTHER_FINGER));
    bottomHandle().dispatchEvent(touchEvent('touchstart', {
      touches: [OTHER_FINGER, HANDLE_FINGER],
      changed: [HANDLE_FINGER],
    }));

    const checkSpy = jest.spyOn(plugin, 'check');

    document.dispatchEvent(touchEvent('touchmove', {
      touches: [{ id: OTHER_FINGER.id, x: 10, y: 20 }, { id: HANDLE_FINGER.id, x: 300, y: 900 }],
      changed: [{ id: HANDLE_FINGER.id, x: 300, y: 900 }],
    }));

    expect(checkSpy).toHaveBeenCalledWith(300, 900);
  });
});
