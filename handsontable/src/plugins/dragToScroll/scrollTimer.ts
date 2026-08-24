import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';
import { calculateInterval } from './utils';

/**
 * Scroll timer that fires local hooks at dynamically calculated intervals.
 */
export class ScrollTimer {
  /**
   * ID of the timeout.
   *
   * @type {number | null}
   */
  #timerId: number | null = null;
  /**
   * Distance from viewport edge.
   *
   * @type {number}
   */
  #distance: number = 0;
  /**
   * Timer settings.
   *
   * @type {object | null}
   */
  #settings: { intervalRange: { min: number; max: number }; rampDistance: number } | null = null;
  /**
   * Timeout registration function for cleanup tracking.
   *
   * @type {Function}
   */
  #registerTimeout: (fn: () => void, delay: number) => number;

  /**
   * @param {Function} registerTimeout Timeout registration function for cleanup tracking.
   */
  constructor(registerTimeout: (fn: () => void, delay: number) => number) {
    this.#registerTimeout = registerTimeout;
  }

  /**
   * Whether the timer is currently active.
   *
   * @type {boolean}
   */
  get isActive() {
    return this.#timerId !== null;
  }

  /**
   * Configures the scroll timing settings.
   *
   * @param {object} settings Timer settings.
   * @param {object} settings.intervalRange Interval range in ms.
   * @param {number} settings.intervalRange.min Minimum interval in ms.
   * @param {number} settings.intervalRange.max Maximum interval in ms.
   * @param {number} settings.rampDistance Distance at which interval reaches minimum.
   */
  configure(settings: { intervalRange: { min: number; max: number }; rampDistance: number }): void {
    this.#settings = settings;
  }

  /**
   * Updates the timer state. Starts or stops based on distance value.
   *
   * @param {number} distance Distance from viewport edge (0 = inside viewport, N > 0 = outside viewport).
   */
  update(distance: number): void {
    this.#distance = distance;

    if (distance === 0) {
      this.stop();

    } else if (!this.isActive) {
      this.#tick();
    }
  }

  /**
   * Stops the timer.
   */
  stop() {
    if (this.#timerId !== null) {
      clearTimeout(this.#timerId);
      this.#timerId = null;
    }

    this.#distance = 0;
  }

  /**
   * Internal tick - fires hook and schedules next tick.
   *
   * If the hook calls `stop()` synchronously (for example, when the scroll
   * axis hits the end of data), `stop()` sets `#distance` to `0`. We check
   * that signal here and skip the reschedule; otherwise the stop would be
   * silently undone by the reschedule below.
   */
  #tick = () => {
    this.runLocalHooks('tick', this.#distance);

    if (this.#distance === 0) {
      return;
    }

    const interval = calculateInterval(
      this.#distance,
      this.#settings!.intervalRange,
      this.#settings!.rampDistance
    );

    this.#timerId = this.#registerTimeout(this.#tick, interval);
  };
}

export interface ScrollTimer {
  addLocalHook(key: string, callback: Function): this;
  removeLocalHook(key: string, callback: Function): this;
  runLocalHooks(key: string, ...args: unknown[]): void;
  clearLocalHooks(): this;
}

mixin(ScrollTimer, localHooks);
