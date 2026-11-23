import Handsontable from 'handsontable/base';
import { isLongPressReplay, LONG_PRESS_DELAY } from 'handsontable/helpers/dom/longPress';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

/**
 * Walkontable replays a touch press to `beforeOnCellMouseDown`: at `touchend` for a tap, and while the
 * finger is still down for a long press. Only the long press is marked (`markLongPressReplay()`), which is
 * how a control that acts on the release of a press tells the two apart.
 */
describe('the press Walkontable replays for a touch', () => {
  let container: HTMLDivElement;
  let hot: Handsontable;
  let presses: Event[];

  beforeAll(() => {
    // The grid listens for touch only where the window supports it.
    (window as unknown as { ontouchstart: null }).ontouchstart = null;
  });

  afterAll(() => {
    delete (window as unknown as { ontouchstart?: null }).ontouchstart;
  });

  beforeEach(() => {
    jest.useFakeTimers();

    container = document.createElement('div');
    document.body.appendChild(container);

    hot = new Handsontable(container, {
      data: [['A1', 'B1'], ['A2', 'B2']],
      licenseKey: TEST_LICENSE_KEY,
    });
    presses = [];
    hot.addHook('beforeOnCellMouseDown', (event: Event) => {
      presses.push(event);
    });
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
    jest.useRealTimers();
  });

  /**
   * Builds a `touchstart` or `touchend` on the first cell, with one finger on it.
   */
  function touch(type: 'touchstart' | 'touchend') {
    const event = new TouchEvent(type, { bubbles: true, cancelable: true });

    Object.defineProperty(event, 'touches', {
      value: type === 'touchstart' ? [{ identifier: 1, clientX: 5, clientY: 5, screenX: 5, screenY: 5 }] : [],
    });
    Object.defineProperty(event, 'changedTouches', {
      value: [{ identifier: 1, clientX: 5, clientY: 5, screenX: 5, screenY: 5 }],
    });
    hot.getCell(0, 0)!.dispatchEvent(event);
  }

  it('should mark the press replayed for a long press, while the finger is still down', () => {
    touch('touchstart');

    expect(presses).toHaveLength(0);

    jest.advanceTimersByTime(LONG_PRESS_DELAY);

    expect(presses).toHaveLength(1);
    expect(isLongPressReplay(presses[0])).toBe(true);
  });

  it('should not mark the press replayed for a tap, at `touchend`', () => {
    touch('touchstart');
    touch('touchend');

    expect(presses).toHaveLength(1);
    expect(isLongPressReplay(presses[0])).toBe(false);

    // The timer of the lifted finger does not fire a second, marked press.
    jest.advanceTimersByTime(LONG_PRESS_DELAY * 2);

    expect(presses).toHaveLength(1);
  });
});
