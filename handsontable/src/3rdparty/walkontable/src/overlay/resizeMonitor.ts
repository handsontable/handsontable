import type { EngineContext } from '../wire';
import { warn } from '../../../../helpers/console';
import {
  RESIZE_LOOP_GUARD_RECONNECT_DELAY,
  RESIZE_LOOP_GUARD_RECONNECT_MAX_DELAY,
  RESIZE_LOOP_GUARD_THRESHOLD,
} from './constants';

/**
 * Assembles the ResizeMonitor's dependencies from the engine composition context. It needs the
 * settings accessor (to fire the `onContainerElementResize` setting), the master table (for the
 * wrapper element it observes) and the window the timers and animation frames live on - no callback
 * back into the owning Overlays coordinator.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @returns {object} The ResizeMonitor dependency set.
 */
export function createResizeMonitorDeps(ctx: EngineContext) {
  return {
    wtSettings: ctx.wtSettings,
    wtTable: ctx.getWtTable(),
    rootWindow: ctx.rootWindow,
  };
}

/**
 * The ResizeMonitor dependencies, inferred from `createResizeMonitorDeps`.
 */
export type ResizeMonitorDeps = ReturnType<typeof createResizeMonitorDeps>;

/**
 * Watches the Walkontable wrapper's parent element for size changes and fires the
 * `onContainerElementResize` setting when one is detected.
 *
 * The class owns the `ResizeObserver` plus the endless-loop guard: a dynamic parent size (for example
 * `dvh` units) can make the observer callback re-trigger itself indefinitely, so a count of deliveries
 * in direct succession disconnects the observer once the callback fires too many times in a row.
 * Extracted from the Overlays coordinator so the loop-guard lifecycle stays self-contained.
 *
 * Two properties of that guard are load-bearing, and both were defects before DEV-2740.
 *
 * **The succession is measured in delivery cycles, not in wall-clock time.** An observer delivers at
 * most once per rendering frame, so a self-sustaining loop occupies every frame regardless of how busy
 * the machine is; the count is therefore reset only when a whole frame passes with no delivery at all.
 * The wall-clock reset it replaced (100 ms of quiet) made the trip a function of CPU speed: under
 * contention Chrome stretches frames past 100 ms, so the count reset before the threshold and the loop
 * ran forever - the guard was disabled in exactly the state it exists for.
 *
 * **The disconnect is temporary.** The guard cannot tell a feedback loop from a gap-free legitimate
 * stream (dragging a splitter around the grid for a few seconds occupies every frame too), so a
 * permanent disconnect would silently end container-resize reactivity for the instance's lifetime. The
 * observer is observed again after a cooldown that doubles on every trip that no quiet frame separated
 * from the last one, up to `RESIZE_LOOP_GUARD_RECONNECT_MAX_DELAY`. A legitimate grid resumes reacting;
 * a page with a real loop is throttled to a bounded rate.
 *
 * The frame ordering is what dictates where the counting happens. Within one frame the browser runs the
 * animation-frame callbacks, then style and layout, then delivers the `ResizeObserver` callbacks. A
 * callback registered during a frame's animation-frame phase therefore runs BEFORE one registered by
 * that same frame's observer delivery. The delivery has to be recorded synchronously, in the observer
 * callback itself, or the quiet-frame watchdog would read its flag before the delivery that was about
 * to set it and call a busy frame quiet.
 *
 * @class ResizeMonitor
 */
export class ResizeMonitor {
  /**
   * The ResizeMonitor dependencies.
   *
   * @type {ResizeMonitorDeps}
   */
  readonly #deps: ResizeMonitorDeps;

  /**
   * The amount of times the ResizeObserver callback was fired in direct succession.
   *
   * @type {number}
   */
  #containerDomResizeCount = 0;

  /**
   * Whether the observer delivered since the quiet-frame watchdog last looked. Set synchronously in the
   * observer callback, so a delivery made at the end of a frame is already visible to the watchdog that
   * runs at the start of the next one.
   *
   * @type {boolean}
   */
  #deliveredSinceLastFrame = false;

  /**
   * The animation-frame ID of the quiet-frame watchdog, or `null` while no watchdog is armed.
   *
   * @type {number | null}
   */
  #quietFrameWatchdogId: number | null = null;

  /**
   * The timeout ID of the pending reconnect, or `null` while the observer is not in its cooldown.
   *
   * @type {number | null}
   */
  #reconnectTimeoutId: number | null = null;

  /**
   * How long the next cooldown lasts, in milliseconds. Doubles on every trip a quiet frame did not
   * separate from the last one, and returns to the base delay as soon as one does.
   *
   * @type {number}
   */
  #reconnectDelay = RESIZE_LOOP_GUARD_RECONNECT_DELAY;

  /**
   * Whether the loop-guard warning was already printed. The warning describes the page's configuration,
   * which does not change between trips, so it is printed once per instance.
   *
   * @type {boolean}
   */
  #hasWarned = false;

  /**
   * The instance of the ResizeObserver that observes the size of the Walkontable wrapper element.
   * In case of the size change detection the `onContainerElementResize` is fired.
   *
   * @type {ResizeObserver}
   */
  #resizeObserver = new ResizeObserver((entries) => {
    if (!Array.isArray(entries) || !entries.length) {
      return;
    }

    this.#registerDelivery();

    this.#deps.rootWindow.requestAnimationFrame(() => {
      this.#deps.wtSettings.getSetting('onContainerElementResize');
    });
  });

  /**
   * @param {ResizeMonitorDeps} deps The ResizeMonitor dependencies.
   */
  constructor(deps: ResizeMonitorDeps) {
    this.#deps = deps;
  }

  /**
   * Starts observing the Walkontable wrapper's parent element for size changes. No-op when the
   * wrapper has no parent element.
   *
   * Cancels a pending reconnect first: this method is public and `NativeScrollInput` re-registers its
   * listeners whenever the scrollable element changes, so an explicit re-observe can land in the middle
   * of a cooldown and must not leave a timer behind to observe a second time.
   */
  observe() {
    this.#cancelReconnect();

    const parentElement = this.#deps.wtTable.wtRootElement.parentElement;

    if (parentElement) {
      this.#resizeObserver.observe(parentElement);
    }
  }

  /**
   * Resets the direct-succession resize counter. Called when a window resize accounts for the size
   * change, so it is excluded from the endless-loop-blocking logic. A window resize is external,
   * legitimate activity, so it also returns the cooldown to its base length.
   */
  resetResizeCount() {
    this.#cancelQuietFrameWatchdog();
    this.#resetSuccession();
  }

  /**
   * Cleans up on destroy: cancels the pending reconnect and the quiet-frame watchdog, and disconnects
   * the observer. Both handles outlive a task boundary, and `observe()` reads the wrapper's parent
   * element, so neither may be left to fire against a torn-down grid.
   */
  destroy() {
    this.#cancelReconnect();
    this.#cancelQuietFrameWatchdog();
    this.#resizeObserver.disconnect();
  }

  /**
   * Records one observer delivery and trips the guard once they reach the threshold in direct
   * succession. Runs synchronously in the observer callback - see the class description for why the
   * deferred part of the callback cannot do this.
   */
  #registerDelivery() {
    this.#containerDomResizeCount += 1;
    this.#deliveredSinceLastFrame = true;

    this.#armQuietFrameWatchdog();

    if (this.#containerDomResizeCount >= RESIZE_LOOP_GUARD_THRESHOLD) {
      this.#tripLoopGuard();
    }
  }

  /**
   * Arms the watchdog that breaks the succession. It re-arms itself for as long as deliveries keep
   * arriving, so it costs one animation frame per frame that the observer is already busy in, and stops
   * as soon as it finds a frame the observer skipped.
   */
  #armQuietFrameWatchdog() {
    if (this.#quietFrameWatchdogId !== null) {
      return;
    }

    this.#quietFrameWatchdogId = this.#deps.rootWindow.requestAnimationFrame(() => {
      this.#quietFrameWatchdogId = null;

      if (this.#deliveredSinceLastFrame) {
        this.#deliveredSinceLastFrame = false;
        this.#armQuietFrameWatchdog();

        return;
      }

      // A whole frame passed with no delivery, so whatever came before it was not a self-sustaining
      // loop - it cannot skip a frame.
      this.#resetSuccession();
    });
  }

  /**
   * Disconnects the observer for a cooldown and warns once. The counter is cleared here rather than on
   * reconnect so that `resetResizeCount()` and a quiet frame during the cooldown stay meaningful.
   */
  #tripLoopGuard() {
    if (!this.#hasWarned) {
      this.#hasWarned = true;

      warn('The ResizeObserver callback was fired too many times in direct succession.' +
        '\nThis may be due to an infinite loop caused by setting a dynamic height/width (for example, ' +
        'with the `dvh` units) to a Handsontable container\'s parent. ' +
        '\nThe observer will be disconnected.');
    }

    this.#resizeObserver.disconnect();
    this.#cancelQuietFrameWatchdog();

    this.#containerDomResizeCount = 0;
    this.#deliveredSinceLastFrame = false;

    this.#reconnectTimeoutId = this.#deps.rootWindow.setTimeout(() => {
      this.#reconnectTimeoutId = null;
      this.#reconnectDelay = Math.min(this.#reconnectDelay * 2, RESIZE_LOOP_GUARD_RECONNECT_MAX_DELAY);

      this.observe();
    }, this.#reconnectDelay);
  }

  /**
   * Clears the succession: the counter, the delivery flag and the accumulated backoff.
   */
  #resetSuccession() {
    this.#containerDomResizeCount = 0;
    this.#deliveredSinceLastFrame = false;
    this.#reconnectDelay = RESIZE_LOOP_GUARD_RECONNECT_DELAY;
  }

  /**
   * Cancels the quiet-frame watchdog, if one is armed.
   */
  #cancelQuietFrameWatchdog() {
    if (this.#quietFrameWatchdogId !== null) {
      this.#deps.rootWindow.cancelAnimationFrame(this.#quietFrameWatchdogId);
      this.#quietFrameWatchdogId = null;
    }
  }

  /**
   * Cancels the pending reconnect, if the observer is in a cooldown.
   */
  #cancelReconnect() {
    if (this.#reconnectTimeoutId !== null) {
      this.#deps.rootWindow.clearTimeout(this.#reconnectTimeoutId);
      this.#reconnectTimeoutId = null;
    }
  }
}
