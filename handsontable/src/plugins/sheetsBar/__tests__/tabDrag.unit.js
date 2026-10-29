import EventManager from '../../../eventManager';
import { TabDrag } from '../ui/tabDrag';

/**
 * Builds a strip of tabs whose geometry jsdom will not compute, so each tab reports a fixed
 * rect: 100px wide, laid out from x=0.
 * @param count
 */
function buildStrip(count) {
  const host = document.createElement('div');

  for (let index = 0; index < count; index += 1) {
    const tab = document.createElement('div');

    tab.className = 'ht-sheets-bar__tab';
    tab.dataset.sheetId = String(index + 1);
    tab.getBoundingClientRect = () => {
      const position = Array.from(host.children).indexOf(tab);

      return { left: position * 100, right: (position + 1) * 100, width: 100 };
    };
    host.appendChild(tab);
  }

  document.body.appendChild(host);

  return host;
}

function pointer(type, x, target, pointerId = 1) {
  const event = new MouseEvent(type, { bubbles: true, clientX: x });

  Object.defineProperty(event, 'pointerId', { value: pointerId });
  Object.defineProperty(event, 'target', { value: target });

  return event;
}

describe('TabDrag', () => {
  let host = null;

  afterEach(() => {
    host?.remove();
    host = null;
  });

  it('does not start a drag before the pointer passes the threshold', () => {
    const onCommit = jest.fn();

    host = buildStrip(3);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const tab = host.children[0];

    tab.setPointerCapture = jest.fn();
    drag.start(pointer('pointerdown', 50, tab), tab, 1);
    host.ownerDocument.dispatchEvent(pointer('pointermove', 52, tab));

    expect(tab.classList.contains('ht-sheets-bar__tab--dragging')).toBe(false);

    drag.destroy();
  });

  it('reorders the tabs live once the pointer crosses a neighbour', () => {
    const onCommit = jest.fn();

    host = buildStrip(3);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const tab = host.children[0];

    tab.setPointerCapture = jest.fn();
    tab.releasePointerCapture = jest.fn();
    drag.start(pointer('pointerdown', 50, tab), tab, 1);
    host.ownerDocument.dispatchEvent(pointer('pointermove', 160, tab));

    expect(tab.classList.contains('ht-sheets-bar__tab--dragging')).toBe(true);
    expect(Array.from(host.children).indexOf(tab)).toBe(1);

    host.ownerDocument.dispatchEvent(pointer('pointerup', 160, tab));

    expect(onCommit).toHaveBeenCalledWith(1, 1);

    drag.destroy();
  });

  it('reports nothing when the tab is released in its original slot', () => {
    const onCommit = jest.fn();

    host = buildStrip(3);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const tab = host.children[0];

    tab.setPointerCapture = jest.fn();
    tab.releasePointerCapture = jest.fn();
    drag.start(pointer('pointerdown', 50, tab), tab, 1);
    host.ownerDocument.dispatchEvent(pointer('pointermove', 80, tab));
    host.ownerDocument.dispatchEvent(pointer('pointerup', 80, tab));

    expect(onCommit).not.toHaveBeenCalled();

    drag.destroy();
  });

  it('restores the original order and reports nothing when Escape cancels', () => {
    const onCommit = jest.fn();

    host = buildStrip(3);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const tab = host.children[0];

    tab.setPointerCapture = jest.fn();
    tab.releasePointerCapture = jest.fn();
    drag.start(pointer('pointerdown', 50, tab), tab, 1);
    host.ownerDocument.dispatchEvent(pointer('pointermove', 160, tab));

    expect(Array.from(host.children).indexOf(tab)).toBe(1);

    host.ownerDocument.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(Array.from(host.children).indexOf(tab)).toBe(0);
    expect(onCommit).not.toHaveBeenCalled();
    expect(tab.classList.contains('ht-sheets-bar__tab--dragging')).toBe(false);

    drag.destroy();
  });

  it('restores the original order and reports nothing when the pointer is cancelled', () => {
    const onCommit = jest.fn();

    host = buildStrip(3);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const tab = host.children[0];

    tab.setPointerCapture = jest.fn();
    tab.releasePointerCapture = jest.fn();
    drag.start(pointer('pointerdown', 50, tab), tab, 1);
    host.ownerDocument.dispatchEvent(pointer('pointermove', 160, tab));

    expect(Array.from(host.children).indexOf(tab)).toBe(1);

    host.ownerDocument.dispatchEvent(pointer('pointercancel', 160, tab));

    expect(Array.from(host.children).indexOf(tab)).toBe(0);
    expect(onCommit).not.toHaveBeenCalled();
    expect(tab.classList.contains('ht-sheets-bar__tab--dragging')).toBe(false);

    drag.destroy();
  });

  it('restores the original order and reports nothing when destroyed mid-drag', () => {
    const onCommit = jest.fn();

    host = buildStrip(3);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const tab = host.children[0];

    tab.setPointerCapture = jest.fn();
    tab.releasePointerCapture = jest.fn();
    drag.start(pointer('pointerdown', 50, tab), tab, 1);
    host.ownerDocument.dispatchEvent(pointer('pointermove', 160, tab));

    expect(Array.from(host.children).indexOf(tab)).toBe(1);

    drag.destroy();

    expect(Array.from(host.children).indexOf(tab)).toBe(0);
    expect(onCommit).not.toHaveBeenCalled();
    expect(tab.classList.contains('ht-sheets-bar__tab--dragging')).toBe(false);
  });

  it('does not touch the DOM or take pointer capture once the dragged tab is detached', () => {
    const onCommit = jest.fn();

    host = buildStrip(3);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const tab = host.children[0];

    tab.setPointerCapture = jest.fn();
    drag.start(pointer('pointerdown', 50, tab), tab, 1);

    // Simulates what a mid-gesture repaint leaves behind: the dragged node removed from the
    // host without going through `abort()`.
    tab.remove();

    expect(() => {
      host.ownerDocument.dispatchEvent(pointer('pointermove', 160, tab));
    }).not.toThrow();

    expect(tab.setPointerCapture).not.toHaveBeenCalled();
    expect(Array.from(host.children)).not.toContain(tab);

    drag.destroy();
  });

  it('does not reinsert a detached tab when Escape cancels the gesture', () => {
    const onCommit = jest.fn();

    host = buildStrip(3);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const tab = host.children[0];

    tab.setPointerCapture = jest.fn();
    drag.start(pointer('pointerdown', 50, tab), tab, 1);
    host.ownerDocument.dispatchEvent(pointer('pointermove', 160, tab));

    expect(tab.classList.contains('ht-sheets-bar__tab--dragging')).toBe(true);

    tab.remove();

    expect(() => {
      host.ownerDocument.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }).not.toThrow();

    expect(Array.from(host.children)).not.toContain(tab);
    expect(host.children.length).toBe(2);
    expect(onCommit).not.toHaveBeenCalled();

    drag.destroy();
  });

  it('ignores a second pointer while a gesture is live, and never abandons the first tab', () => {
    const onCommit = jest.fn();

    host = buildStrip(3);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const firstTab = host.children[0];
    const secondTab = host.children[1];

    firstTab.setPointerCapture = jest.fn();
    firstTab.releasePointerCapture = jest.fn();

    drag.start(pointer('pointerdown', 50, firstTab, 1), firstTab, 1);
    host.ownerDocument.dispatchEvent(pointer('pointermove', 160, firstTab, 1));

    expect(firstTab.classList.contains('ht-sheets-bar__tab--dragging')).toBe(true);
    expect(Array.from(host.children).indexOf(firstTab)).toBe(1);

    // A second pointer presses another tab mid-gesture; the live gesture must not restart.
    drag.start(pointer('pointerdown', 10, secondTab, 2), secondTab, 2);

    expect(secondTab.classList.contains('ht-sheets-bar__tab--dragging')).toBe(false);

    // Events carrying the second pointer's id must not drive or end the first tab's gesture.
    host.ownerDocument.dispatchEvent(pointer('pointerup', 10, secondTab, 2));

    expect(onCommit).not.toHaveBeenCalled();
    expect(firstTab.classList.contains('ht-sheets-bar__tab--dragging')).toBe(true);

    // The first pointer's own release still ends and commits its gesture normally.
    host.ownerDocument.dispatchEvent(pointer('pointerup', 160, firstTab, 1));

    expect(onCommit).toHaveBeenCalledWith(1, 1);
    expect(firstTab.classList.contains('ht-sheets-bar__tab--dragging')).toBe(false);

    drag.destroy();
  });

  it('reorders forward without detaching the dragged tab', () => {
    const onCommit = jest.fn();

    host = buildStrip(4);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const [first, second, third, fourth] = Array.from(host.children);
    const observer = new MutationObserver(() => {});

    first.setPointerCapture = jest.fn();
    observer.observe(host, { childList: true });
    drag.start(pointer('pointerdown', 50, first), first, 1);
    host.ownerDocument.dispatchEvent(pointer('pointermove', 60, first));
    host.ownerDocument.dispatchEvent(pointer('pointermove', 260, first));

    const removed = observer.takeRecords().flatMap(record => Array.from(record.removedNodes));

    observer.disconnect();

    expect(Array.from(host.children)).toEqual([second, third, first, fourth]);
    expect(removed).not.toContain(first);

    host.ownerDocument.dispatchEvent(pointer('pointerup', 260, first));

    expect(onCommit).toHaveBeenCalledWith(1, 2);

    drag.destroy();
  });

  it('reorders backward without detaching the dragged tab', () => {
    const onCommit = jest.fn();

    host = buildStrip(4);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const [first, second, third, fourth] = Array.from(host.children);
    const observer = new MutationObserver(() => {});

    fourth.setPointerCapture = jest.fn();
    observer.observe(host, { childList: true });
    drag.start(pointer('pointerdown', 350, fourth), fourth, 4);
    host.ownerDocument.dispatchEvent(pointer('pointermove', 340, fourth));
    host.ownerDocument.dispatchEvent(pointer('pointermove', 140, fourth));

    const removed = observer.takeRecords().flatMap(record => Array.from(record.removedNodes));

    observer.disconnect();

    expect(Array.from(host.children)).toEqual([first, fourth, second, third]);
    expect(removed).not.toContain(fourth);

    host.ownerDocument.dispatchEvent(pointer('pointerup', 140, fourth));

    expect(onCommit).toHaveBeenCalledWith(4, 1);

    drag.destroy();
  });

  it('keeps dragging when the capture moves from a child of the tab onto the tab', () => {
    const onCommit = jest.fn();

    host = buildStrip(3);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const [first, second, third] = Array.from(host.children);
    const label = document.createElement('span');

    first.appendChild(label);
    first.setPointerCapture = jest.fn();
    drag.start(pointer('pointerdown', 50, label), first, 1);
    host.ownerDocument.dispatchEvent(pointer('pointermove', 60, label));
    label.dispatchEvent(pointer('lostpointercapture', 60, label));
    host.ownerDocument.dispatchEvent(pointer('pointermove', 160, first));

    expect(Array.from(host.children)).toEqual([second, first, third]);
    expect(host.classList.contains('ht-sheets-bar-dragging')).toBe(true);

    host.ownerDocument.dispatchEvent(pointer('pointerup', 160, first));

    expect(onCommit).toHaveBeenCalledWith(1, 1);

    drag.destroy();
  });

  it('cancels the drag without taking the pointer back when the capture is lost', () => {
    const onCommit = jest.fn();

    host = buildStrip(3);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const [first, second, third] = Array.from(host.children);

    first.setPointerCapture = jest.fn();
    drag.start(pointer('pointerdown', 50, first), first, 1);
    host.ownerDocument.dispatchEvent(pointer('pointermove', 60, first));
    host.ownerDocument.dispatchEvent(pointer('pointermove', 160, first));

    expect(Array.from(host.children)).toEqual([second, first, third]);
    expect(first.setPointerCapture).toHaveBeenCalledTimes(1);

    first.dispatchEvent(pointer('lostpointercapture', 160, first));

    expect(first.setPointerCapture).toHaveBeenCalledTimes(1);
    expect(Array.from(host.children)).toEqual([first, second, third]);
    expect(host.classList.contains('ht-sheets-bar-dragging')).toBe(false);

    host.ownerDocument.dispatchEvent(pointer('pointerup', 160, first));

    expect(onCommit).not.toHaveBeenCalled();

    drag.destroy();
  });

  it('does not swap back while the displaced neighbour is still sliding into place', () => {
    const onCommit = jest.fn();

    host = buildStrip(2);

    const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}) }, onCommit);
    const [first, second] = Array.from(host.children);

    first.setPointerCapture = jest.fn();
    drag.start(pointer('pointerdown', 50, first), first, 1);
    host.ownerDocument.dispatchEvent(pointer('pointermove', 60, first));
    host.ownerDocument.dispatchEvent(pointer('pointermove', 155, first));

    expect(Array.from(host.children)).toEqual([second, first]);

    // The swap started the neighbour's slide: it now sits in the first slot by layout, but the
    // animation still paints it 80px to the right, under the pointer. A pointer that wobbles
    // two pixels back must not read that in-flight position as the tab standing in its way.
    second.style.transform = 'matrix(1, 0, 0, 1, 80, 0)';

    const settled = second.getBoundingClientRect;

    second.getBoundingClientRect = () => {
      const rect = settled.call(second);

      return { ...rect, left: rect.left + 80, right: rect.right + 80 };
    };

    host.ownerDocument.dispatchEvent(pointer('pointermove', 100, first));

    expect(Array.from(host.children)).toEqual([second, first]);
    expect(host.classList.contains('ht-sheets-bar-dragging')).toBe(true);

    drag.destroy();
  });

  describe('a touch press', () => {
    const timers = {
      setTimeout: (callback, delay) => setTimeout(callback, delay),
      clearTimeout: handle => clearTimeout(handle),
    };

    /**
     * Builds a pointer event of a finger.
     *
     * @param {string} type The event type.
     * @param {number} x The horizontal position.
     * @param {HTMLElement} target The element under the finger.
     * @returns {Event} The event.
     */
    function finger(type, x, target) {
      const event = pointer(type, x, target);

      Object.defineProperty(event, 'pointerType', { value: 'touch' });

      return event;
    }

    /**
     * Builds a touch event with the fingers still on the screen.
     *
     * @param {string} type The event type.
     * @param {number} fingersLeft How many fingers are still down.
     * @returns {Event} The event.
     */
    function touch(type, fingersLeft) {
      const event = new Event(type, { bubbles: true, cancelable: true });

      Object.defineProperty(event, 'touches', { value: Array.from({ length: fingersLeft }, () => ({})) });

      return event;
    }

    /**
     * Holds the first tab of a fresh strip until it lifts.
     *
     * @returns {{ drag: TabDrag, tab: HTMLElement }} The controller and the lifted tab.
     */
    function holdUntilLifted() {
      host = buildStrip(3);

      const drag = new TabDrag({ host, dragRoot: host, eventManager: new EventManager({}), timers }, jest.fn());
      const tab = host.children[0];

      tab.setPointerCapture = jest.fn();
      tab.releasePointerCapture = jest.fn();
      drag.start(finger('pointerdown', 50, tab), tab, 1);
      jest.advanceTimersByTime(500);

      return { drag, tab };
    }

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('stops blocking the pan once the browser cancels the touches', () => {
      const { drag, tab } = holdUntilLifted();

      expect(tab.classList.contains('ht-sheets-bar__tab--lifted')).toBe(true);

      host.ownerDocument.dispatchEvent(finger('pointercancel', 50, tab));
      host.dispatchEvent(touch('touchcancel', 0));

      const move = touch('touchmove', 1);

      host.dispatchEvent(move);

      expect(move.defaultPrevented).toBe(false);

      drag.destroy();
    });

    it('keeps blocking the pan while the held finger stays after a second one lifts', () => {
      const { drag, tab } = holdUntilLifted();

      tab.dispatchEvent(touch('touchend', 1));

      const move = touch('touchmove', 1);

      tab.dispatchEvent(move);

      expect(move.defaultPrevented).toBe(true);

      drag.destroy();
    });
  });
});
