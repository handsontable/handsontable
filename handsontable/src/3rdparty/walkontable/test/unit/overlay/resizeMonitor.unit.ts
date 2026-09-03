import { ResizeMonitor } from '../../../src/overlay/resizeMonitor';
import {
  RESIZE_LOOP_GUARD_RECONNECT_DELAY,
  RESIZE_LOOP_GUARD_THRESHOLD,
} from '../../../src/overlay/constants';

const WARNING = 'The ResizeObserver callback was fired too many times in direct succession.' +
  '\nThis may be due to an infinite loop caused by setting a dynamic height/width (for example, ' +
  'with the `dvh` units) to a Handsontable container\'s parent. ' +
  '\nThe observer will be disconnected and reconnected after a short delay.';

describe('ResizeMonitor', () => {
  let warnSpy: jest.SpyInstance;
  let restoreResizeObserver: () => void;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    restoreResizeObserver?.();
  });

  /**
   * Builds a monitor over a fake window whose timers and animation frames are driven by hand, and a
   * fake `ResizeObserver` whose deliveries are driven by hand too.
   *
   * The harness models the browser's frame order, which the guard depends on: within one frame the
   * animation-frame callbacks run first, then the observer delivers. So a busy frame is
   * `frame(); deliver();` and a quiet one is `frame()` alone. A callback registered during a frame
   * lands in the NEXT frame's list, which `frame()` reproduces by running a snapshot of the queue.
   *
   * @returns {object} The monitor plus the handles a case needs to drive and observe it.
   */
  function build() {
    let now = 0;
    let nextTimeoutId = 1;
    let nextFrameId = 1;
    let settingsFired = 0;
    let observing = false;
    let observeCalls = 0;
    let disconnectCalls = 0;
    let deliverEntries = (unused: ResizeObserverEntry[], unusedForce?: boolean) => {};

    // A host framework can hold the grid's subtree outside the document, which is what makes the
    // wrapper's parent go away and come back under the monitor.
    const rootElement: { parentElement: object | null } = { parentElement: {} };

    const timeouts: Map<number, { fn: () => void; at: number }> = new Map();
    const frames: Map<number, () => void> = new Map();

    class FakeResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        deliverEntries = (entries, force = false) => {
          if (observing || force) {
            callback(entries, this as unknown as ResizeObserver);
          }
        };
      }

      observe() {
        observing = true;
        observeCalls += 1;
      }

      unobserve() {
        observing = false;
      }

      disconnect() {
        observing = false;
        disconnectCalls += 1;
      }
    }

    const original = window.ResizeObserver;

    window.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
    restoreResizeObserver = () => {
      window.ResizeObserver = original;
    };

    const rootWindow = {
      setTimeout: (fn: () => void, delay: number) => {
        const id = nextTimeoutId;

        nextTimeoutId += 1;
        timeouts.set(id, { fn, at: now + delay });

        return id;
      },
      clearTimeout: (id: number) => {
        timeouts.delete(id);
      },
      requestAnimationFrame: (fn: () => void) => {
        const id = nextFrameId;

        nextFrameId += 1;
        frames.set(id, fn);

        return id;
      },
      cancelAnimationFrame: (id: number) => {
        frames.delete(id);
      },
    } as unknown as Window;

    const monitor = new ResizeMonitor({
      rootWindow,
      wtSettings: {
        getSetting: (name: string) => {
          if (name === 'onContainerElementResize') {
            settingsFired += 1;
          }
        },
      } as never,
      wtTable: { wtRootElement: rootElement } as never,
    });

    // One frame: every animation-frame callback queued when the frame started, and only those.
    const frame = () => {
      const queued = [...frames.entries()];

      queued.forEach(([id, fn]) => {
        if (frames.delete(id)) {
          fn();
        }
      });
    };

    // Moves the fake clock, firing every timer that came due, earliest first.
    const advance = (ms: number) => {
      now += ms;

      [...timeouts.entries()]
        .filter(([, timer]) => timer.at <= now)
        .sort((a, b) => a[1].at - b[1].at)
        .forEach(([id, timer]) => {
          if (timeouts.delete(id)) {
            timer.fn();
          }
        });
    };

    // `count` frames that each carry one delivery. `gap` models a loaded machine: wall-clock time
    // passing between frames, which the guard must be indifferent to.
    const deliverForFrames = (count: number, gap = 0) => {
      for (let i = 0; i < count; i++) {
        frame();
        deliverEntries([{} as ResizeObserverEntry]);

        if (gap > 0) {
          advance(gap);
        }
      }
    };

    return {
      monitor,
      frame,
      advance,
      deliver: () => deliverEntries([{} as ResizeObserverEntry]),
      deliverEmpty: () => deliverEntries([]),
      deliverAfterDisconnect: () => deliverEntries([{} as ResizeObserverEntry], true),
      deliverForFrames,
      isObserving: () => observing,
      observeCalls: () => observeCalls,
      disconnectCalls: () => disconnectCalls,
      settingsFired: () => settingsFired,
      pendingTimeouts: () => [...timeouts.values()],
      pendingFrames: () => frames.size,
      detachWrapper: () => {
        rootElement.parentElement = null;
      },
      reattachWrapper: () => {
        rootElement.parentElement = {};
      },
    };
  }

  it('should fire the `onContainerElementResize` setting on a deferred frame for every delivery', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliver();

    expect(harness.settingsFired()).toBe(0);

    harness.frame();

    expect(harness.settingsFired()).toBe(1);
  });

  it('should ignore a delivery that carries no entries', () => {
    const harness = build();

    harness.monitor.observe();

    // The guard reads the entries synchronously now, so an empty delivery must be counted nowhere:
    // not toward the succession, and not toward the deferred setting fire.
    for (let i = 0; i < RESIZE_LOOP_GUARD_THRESHOLD * 2; i++) {
      harness.frame();
      harness.deliverEmpty();
    }

    expect(harness.disconnectCalls()).toBe(0);
    expect(harness.settingsFired()).toBe(0);
    expect(harness.isObserving()).toBe(true);
  });

  it('should trip after the threshold even when every frame is longer than the old 100 ms reset window', () => {
    const harness = build();

    harness.monitor.observe();
    // 150 ms per frame is what a contended CPU produces, and what the wall-clock reset this guard
    // replaced could never survive - it zeroed the count before the threshold, every time.
    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD, 150);

    expect(warnSpy).toHaveBeenCalledWith(WARNING);
    expect(harness.disconnectCalls()).toBe(1);
    expect(harness.isObserving()).toBe(false);
  });

  it('should not trip when a frame with no delivery breaks the succession', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD - 1);

    // Two frames with no delivery: the first is the quiet frame, the second is when the watchdog
    // gets to see that it was quiet.
    harness.frame();
    harness.frame();

    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD - 1);

    expect(warnSpy).not.toHaveBeenCalled();
    expect(harness.disconnectCalls()).toBe(0);
    expect(harness.isObserving()).toBe(true);
  });

  it('should observe again after the cooldown, and react to resizes once it does', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD);

    expect(harness.isObserving()).toBe(false);

    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY - 1);

    expect(harness.isObserving()).toBe(false);

    harness.advance(1);

    expect(harness.isObserving()).toBe(true);
    expect(harness.observeCalls()).toBe(2);

    // Drain the deferred setting fire the tripping delivery left queued, so what the next assertion
    // counts can only have come from the delivery below.
    harness.frame();

    const firedBefore = harness.settingsFired();

    harness.deliver();
    harness.frame();

    expect(harness.settingsFired()).toBe(firedBefore + 1);
  });

  it('should warn once and double the cooldown when the loop survives the reconnect', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD);
    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY);
    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD);

    expect(harness.disconnectCalls()).toBe(2);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY);

    expect(harness.isObserving()).toBe(false);

    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY);

    expect(harness.isObserving()).toBe(true);
  });

  it('should return the cooldown to its base length after a quiet frame', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD);
    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY);

    // The reconnected grid proves itself quiet, so the next trip must not inherit the backoff. The
    // observer always delivers once on `observe()`, and that delivery is what arms the watchdog that
    // the two quiet frames below then let expire.
    harness.deliver();
    harness.frame();
    harness.frame();

    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD);
    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY);

    expect(harness.isObserving()).toBe(true);
  });

  it('should return the cooldown to its base length when a window resize accounts for the succession', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD);
    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY);

    harness.monitor.resetResizeCount();

    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD);
    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY);

    expect(harness.isObserving()).toBe(true);
  });

  it('should drop the succession when a window resize accounts for it', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD - 1);

    harness.monitor.resetResizeCount();

    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD - 1);

    expect(harness.disconnectCalls()).toBe(0);
  });

  it('should still be able to break a later succession after a window resize cleared one', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliver();

    // The reset lands between a delivery and the frame that would have read it, so it cancels an armed
    // watchdog. The next delivery has to arm a fresh one, or nothing breaks the succession after it.
    harness.monitor.resetResizeCount();

    harness.frame();
    harness.frame();

    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD - 1);
    harness.frame();
    harness.frame();
    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD - 1);

    expect(harness.disconnectCalls()).toBe(0);
    expect(harness.isObserving()).toBe(true);
  });

  it('should cancel a pending reconnect when it is observed explicitly', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD);

    // `NativeScrollInput` re-registers its listeners whenever the scrollable element changes, so an
    // explicit re-observe can land in the middle of a cooldown.
    harness.monitor.observe();

    expect(harness.observeCalls()).toBe(2);
    expect(harness.pendingTimeouts()).toEqual([]);

    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY * 4);

    expect(harness.observeCalls()).toBe(2);
  });

  it('should keep retrying the reconnect while the wrapper is detached', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD);

    // A host framework parks the grid's subtree outside the document, and its detach lands exactly on
    // the reconnect. Giving up here would be the permanent disconnect all over again.
    harness.detachWrapper();
    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY);

    expect(harness.isObserving()).toBe(false);
    expect(harness.observeCalls()).toBe(1);
    expect(harness.pendingTimeouts()).not.toEqual([]);

    harness.reattachWrapper();
    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY * 2);

    expect(harness.isObserving()).toBe(true);
    expect(harness.observeCalls()).toBe(2);
  });

  it('should not retry the reconnect after it was destroyed while the wrapper was detached', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD);

    harness.detachWrapper();
    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY);
    harness.monitor.destroy();

    harness.reattachWrapper();
    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY * 100);

    expect(harness.observeCalls()).toBe(1);
    expect(harness.pendingTimeouts()).toEqual([]);
  });

  it('should not observe again after it was destroyed mid-cooldown', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliverForFrames(RESIZE_LOOP_GUARD_THRESHOLD);

    harness.monitor.destroy();
    harness.advance(RESIZE_LOOP_GUARD_RECONNECT_DELAY * 4);

    expect(harness.observeCalls()).toBe(1);
    expect(harness.isObserving()).toBe(false);
  });

  it('should leave no animation frame armed after it was destroyed', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliver();

    // A delivery arms two frames: the quiet-frame watchdog and the deferred setting fire.
    expect(harness.pendingFrames()).toBe(2);

    harness.monitor.destroy();

    expect(harness.pendingFrames()).toBe(0);
  });

  it('should not fire the `onContainerElementResize` setting from a frame that outlived destroy', () => {
    const harness = build();

    harness.monitor.observe();
    harness.deliver();

    const firedBefore = harness.settingsFired();

    harness.monitor.destroy();
    harness.frame();

    // `getSetting()` invokes a function-valued setting synchronously, so a fire surviving here would
    // refresh the dimensions of a torn-down grid.
    expect(harness.settingsFired()).toBe(firedBefore);
  });

  it('should ignore a delivery dispatched after destroy', () => {
    const harness = build();

    harness.monitor.observe();
    harness.monitor.destroy();

    // An observer entry carries the state from its own snapshot, so a delivery can land after the
    // disconnect. The harness dispatches one regardless of the observing flag to model that.
    harness.deliverAfterDisconnect();
    harness.frame();

    expect(harness.pendingFrames()).toBe(0);
    expect(harness.settingsFired()).toBe(0);
  });
});
