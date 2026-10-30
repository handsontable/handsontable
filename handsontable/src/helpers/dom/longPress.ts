/**
 * How long, in milliseconds, a finger has to rest on a point before the press counts as a long
 * press.
 */
export const LONG_PRESS_DELAY = 500;

/**
 * How far, in CSS pixels on either axis, a finger may drift before a press stops counting as a
 * long press and becomes a scroll or a drag.
 */
export const LONG_PRESS_MOVE_THRESHOLD = 10;

/**
 * The timer functions the detector schedules with, usually the grid's own window.
 */
export interface LongPressTimers {
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (handle: number) => void;
}

/**
 * What a {@link LongPressDetector} is built with.
 */
export interface LongPressDetectorOptions {
  /**
   * The timer functions to schedule with.
   */
  timers: LongPressTimers;
  /**
   * Runs once when a press has been held long enough.
   */
  onLongPress: () => void;
  /**
   * The hold, in milliseconds. Defaults to {@link LONG_PRESS_DELAY}.
   */
  delay?: number;
  /**
   * The drift, in CSS pixels, that cancels the press. Defaults to {@link LONG_PRESS_MOVE_THRESHOLD}.
   */
  threshold?: number;
}

/**
 * Tells a long press apart from a tap and from a scroll or a drag: a press that stays within
 * {@link LONG_PRESS_MOVE_THRESHOLD} of where it started for {@link LONG_PRESS_DELAY} is a long press.
 * The grid's cells open the context menu with it, and the sheets bar's tabs lift for a drag or open
 * their menu, so both answer a touch the same way. What a long press does is the caller's; the
 * detector only measures the press. It takes plain coordinates, so it works with touch events and
 * with pointer events alike.
 */
export class LongPressDetector {
  /**
   * The timer functions to schedule with.
   */
  readonly #timers: LongPressTimers;
  /**
   * Runs when a press has been held long enough.
   */
  readonly #onLongPress: () => void;
  /**
   * The hold, in milliseconds.
   */
  readonly #delay: number;
  /**
   * The drift, in CSS pixels, that cancels the press.
   */
  readonly #threshold: number;
  /**
   * The pending timer, or `null` when no press is being timed.
   */
  #timer: number | null = null;
  /**
   * Where the timed press started, or `null` when no press is being timed.
   */
  #origin: { x: number, y: number } | null = null;
  /**
   * Whether the current press has become a long press.
   */
  #fired = false;

  /**
   * Builds a detector.
   *
   * @param {LongPressDetectorOptions} options The timers, the callback, and optionally the hold and
   *   the drift.
   */
  constructor({ timers, onLongPress, delay = LONG_PRESS_DELAY, threshold = LONG_PRESS_MOVE_THRESHOLD }:
    LongPressDetectorOptions) {
    this.#timers = timers;
    this.#onLongPress = onLongPress;
    this.#delay = delay;
    this.#threshold = threshold;
  }

  /**
   * Starts timing a press, dropping any press timed before.
   *
   * @param {number} x Where the press started, horizontally.
   * @param {number} y Where the press started, vertically.
   */
  start(x: number, y: number): void {
    this.cancel();
    this.#fired = false;
    this.#origin = { x, y };
    this.#timer = this.#timers.setTimeout(() => {
      this.#timer = null;
      this.#origin = null;
      this.#fired = true;
      this.#onLongPress();
    }, this.#delay);
  }

  /**
   * Reports where the finger is now. A drift past the threshold cancels the press.
   *
   * @param {number} x The finger's position, horizontally.
   * @param {number} y The finger's position, vertically.
   * @returns {boolean} `true` when this move canceled a press that was being timed.
   */
  move(x: number, y: number): boolean {
    if (this.#origin === null) {
      return false;
    }

    if (Math.abs(x - this.#origin.x) > this.#threshold || Math.abs(y - this.#origin.y) > this.#threshold) {
      this.cancel();

      return true;
    }

    return false;
  }

  /**
   * Stops timing the press, if one is being timed. A press that already became a long press stays one.
   */
  cancel(): void {
    if (this.#timer !== null) {
      this.#timers.clearTimeout(this.#timer);
      this.#timer = null;
    }

    this.#origin = null;
  }

  /**
   * Stops timing the press and forgets that it became a long press.
   */
  reset(): void {
    this.cancel();
    this.#fired = false;
  }

  /**
   * Whether a press is being timed: it started and has neither drifted, been canceled, nor fired.
   *
   * @returns {boolean} `true` while the press is timed.
   */
  isTracking(): boolean {
    return this.#origin !== null;
  }

  /**
   * Whether the current press became a long press.
   *
   * @returns {boolean} `true` once the hold has run out.
   */
  hasFired(): boolean {
    return this.#fired;
  }
}
