import { ScrollbarVisibility } from '../../../src/overlay/scrollbarVisibility';
import { OVERLAY_SCROLLBAR_PROXIMITY } from '../../../src/overlay/constants';

describe('ScrollbarVisibility', () => {
  const SCROLLPORT = { top: 100, right: 500, bottom: 300, left: 100 };

  /**
   * Builds a tracker over a fixed scrollport, with a fake window whose timers are driven by hand and a
   * fake holder whose scroll offsets can be moved per axis.
   *
   * @returns {object} The tracker plus helpers to scroll, run a pending fade, and count changes.
   */
  function build() {
    // Timers carry their delay and are fired shortest first, so a run models real elapsed time rather
    // than insertion order.
    const pending: Map<number, { fn: () => void; delay: number }> = new Map();
    let nextId = 1;
    let changes = 0;
    const holder = { scrollLeft: 0, scrollTop: 0, parentNode: {} };

    const tracker = new ScrollbarVisibility({
      rootWindow: {
        setTimeout: (fn: () => void, delay: number) => {
          const id = nextId;

          nextId += 1;
          pending.set(id, { fn, delay });

          return id;
        },
        clearTimeout: (id: number) => {
          pending.delete(id);
        },
      } as unknown as Window,
      geometryReader: {
        getBoundingClientRect: () => SCROLLPORT,
      } as never,
      getWtTable: () => ({ holder }) as never,
    }, () => {
      changes += 1;
    });

    // Fires every pending timer whose delay is at or below the cap, shortest first, skipping any that
    // an earlier one cancelled.
    const run = (cap: number) => {
      [...pending.entries()]
        .filter(([, t]) => t.delay <= cap)
        .sort((a, b) => a[1].delay - b[1].delay)
        .forEach(([id, t]) => {
          if (pending.delete(id)) {
            t.fn();
          }
        });
    };

    return {
      tracker,
      scrollBy: (dx: number, dy: number) => {
        holder.scrollLeft += dx;
        holder.scrollTop += dy;
        tracker.notifyScrolled();
      },
      fadeAll: () => run(Number.MAX_SAFE_INTEGER),
      pendingCount: () => pending.size,
      changeCount: () => changes,
    };
  }

  it('should start with both axes hidden, so no band is reserved before anything happens', () => {
    const { tracker } = build();

    expect(tracker.visible).toEqual({ horizontal: false, vertical: false });
  });

  it('should open only the horizontal band for a horizontal scroll', () => {
    const { tracker, scrollBy } = build();

    scrollBy(60, 0);

    expect(tracker.visible).toEqual({ horizontal: true, vertical: false });
  });

  it('should open only the vertical band for a vertical scroll', () => {
    const { tracker, scrollBy } = build();

    scrollBy(0, 60);

    expect(tracker.visible).toEqual({ horizontal: false, vertical: true });
  });

  it('should open both for a gesture that moved on both axes', () => {
    const { tracker, scrollBy } = build();

    scrollBy(60, 60);

    expect(tracker.visible).toEqual({ horizontal: true, vertical: true });
  });

  it('should leave the other axis alone when one axis scrolls again', () => {
    const { tracker, scrollBy } = build();

    scrollBy(0, 60);
    scrollBy(60, 0);

    // Both are now up, each on its own fade.
    expect(tracker.visible).toEqual({ horizontal: true, vertical: true });
  });

  it('should open nothing for a scroll event where neither offset moved', () => {
    const { tracker, scrollBy } = build();

    scrollBy(0, 0);

    expect(tracker.visible).toEqual({ horizontal: false, vertical: false });
  });

  it('should NOT open on a hover alone, since no browser draws a scrollbar for that', () => {
    const { tracker } = build();

    // Opening here is what carved out a band with no scrollbar in it.
    tracker.notifyPointerMoved(300, SCROLLPORT.bottom - 2);

    expect(tracker.visible).toEqual({ horizontal: false, vertical: false });
  });

  it('should NOT open on a hover near the inline-end edge either', () => {
    const { tracker } = build();

    tracker.notifyPointerMoved(SCROLLPORT.right - 2, 200);

    expect(tracker.visible).toEqual({ horizontal: false, vertical: false });
  });

  it('should pin the horizontal band open while the pointer sits near the bottom edge', () => {
    const { tracker, scrollBy, fadeAll } = build();

    scrollBy(60, 0);
    tracker.notifyPointerMoved(300, SCROLLPORT.bottom - 2);

    // Pinned rather than re-timed: the browser keeps the thumb up as long as the pointer is there, so
    // running every pending timer must not close it.
    fadeAll();

    expect(tracker.visible.horizontal).toBe(true);
  });

  it('should hide an axis once its fade elapses, dropping the band outright', () => {
    const { tracker, scrollBy, fadeAll } = build();

    scrollBy(60, 0);
    fadeAll();

    // Nothing lingers past the flip. The clone's clip switches on this same flag, and a band that
    // outlived it would either seam down the strip or leave a column header looking cut short - the
    // two states measured on a real grid. There is no third flag to get out of step with.
    expect(tracker.visible.horizontal).toBe(false);
  });

  it('should pin from where the pointer already is when a band opens', () => {
    const { tracker, scrollBy, fadeAll } = build();

    // The pointer comes to rest in the strip BEFORE anything is showing - a wheel-stop with the cursor
    // already there. No further move arrives, but the browser keeps the hovered thumb up, so the band
    // must not close under it.
    tracker.notifyPointerMoved(300, SCROLLPORT.bottom - 2);
    scrollBy(60, 0);
    fadeAll();

    expect(tracker.visible.horizontal).toBe(true);
  });

  it('should release every pin when the pointer leaves the window', () => {
    const { tracker, scrollBy, fadeAll } = build();

    scrollBy(60, 60);
    tracker.notifyPointerMoved(300, SCROLLPORT.bottom - 2);
    // Releasing a pin needs a move saying "no longer near", and once the pointer is gone none arrive.
    tracker.notifyPointerLeft();
    fadeAll();

    expect(tracker.visible).toEqual({ horizontal: false, vertical: false });
  });

  it('should stop pinning from a position the pointer has left behind', () => {
    const { tracker, scrollBy, fadeAll } = build();

    tracker.notifyPointerMoved(300, SCROLLPORT.bottom - 2);
    tracker.notifyPointerLeft();
    scrollBy(60, 0);
    fadeAll();

    expect(tracker.visible.horizontal).toBe(false);
  });

  it('should hand a pinned band back to the fade once the pointer leaves', () => {
    const { tracker, scrollBy, fadeAll } = build();

    scrollBy(60, 0);
    tracker.notifyPointerMoved(300, SCROLLPORT.bottom - 2);
    // Away from the edge again.
    tracker.notifyPointerMoved(300, 200);
    fadeAll();

    expect(tracker.visible.horizontal).toBe(false);
  });

  it('should not let a hover near the bottom edge open the vertical band', () => {
    const { tracker, scrollBy } = build();

    scrollBy(60, 0);
    tracker.notifyPointerMoved(300, SCROLLPORT.bottom - 2);

    expect(tracker.visible.vertical).toBe(false);
  });

  it('should let an axis fade when the pointer sits in the middle, away from any scrollbar', () => {
    const { tracker, scrollBy, fadeAll } = build();

    scrollBy(60, 0);
    tracker.notifyPointerMoved(300, 200);
    fadeAll();

    expect(tracker.visible.horizontal).toBe(false);
  });

  it('should ignore a pointer outside the grid entirely', () => {
    const { tracker, scrollBy, fadeAll } = build();

    scrollBy(60, 0);
    tracker.notifyPointerMoved(5, 5);
    // The fade has to run, or this asserts the flag the scroll already set and proves nothing about
    // the pointer at all - it passed with the proximity check deleted.
    fadeAll();

    expect(tracker.visible.horizontal).toBe(false);
  });

  it('should count the proximity band as near the edge', () => {
    const { tracker, scrollBy, fadeAll } = build();

    scrollBy(60, 0);
    tracker.notifyPointerMoved(300, SCROLLPORT.bottom - OVERLAY_SCROLLBAR_PROXIMITY + 1);
    fadeAll();

    expect(tracker.visible.horizontal).toBe(true);
  });

  it('should pin the vertical band from the inline-end edge, not the opposite one', () => {
    const { tracker, scrollBy, fadeAll } = build();

    scrollBy(0, 60);
    // LTR: the left edge is the row-header side, nowhere near the vertical scrollbar.
    tracker.notifyPointerMoved(SCROLLPORT.left + 2, 200);
    fadeAll();

    expect(tracker.visible.vertical).toBe(false);
  });

  it('should pin the vertical band from the inline-start edge in RTL', () => {
    const { tracker, scrollBy, fadeAll } = build();

    scrollBy(0, 60);
    tracker.notifyPointerMoved(SCROLLPORT.left + 2, 200, true);
    fadeAll();

    expect(tracker.visible.vertical).toBe(true);
  });

  it('should notify only when an axis actually flips', () => {
    const { scrollBy, changeCount } = build();

    scrollBy(60, 0);
    scrollBy(60, 0);
    scrollBy(60, 0);

    // One flip for the horizontal axis, not one per event - the rest only restart its fade.
    expect(changeCount()).toBe(1);
  });

  it('should drop the pending fades on destroy, so nothing fires after teardown', () => {
    const { tracker, scrollBy, pendingCount } = build();

    scrollBy(60, 60);
    tracker.destroy();

    expect(pendingCount()).toBe(0);
  });
});
