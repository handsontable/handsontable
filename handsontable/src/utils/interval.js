import { requestAnimationFrame, cancelAnimationFrame } from './../helpers/feature';

/**
 * @class Interval
 */
class Interval {
  static create(func, delay) {
    return new Interval(func, delay);
  }

  /**
   * Number of milliseconds that function should wait before next call.
   *
   * @type {number}
   */
  delay;
  /**
   * Animation frame request id.
   *
   * @type {number}
   */
  #timer = null;
  /**
   * Function to invoke repeatedly.
   *
   * @type {Function}
   */
  #func;
  /**
   * Flag which indicates if interval object was stopped.
   *
   * @type {boolean}
   * @default true
   */
  #stopped = true;
  /**
   * Interval time (in milliseconds) of the last callback call.
   *
   * @type {number}
   */
  #then = null;
  /**
   * Bounded function `func`.
   *
   * @type {Function}
   */
  #callback;

  constructor(func, delay) {
    this.#func = func;
    this.delay = parseDelay(delay);
    this.#callback = () => this.#__callback();
  }

  /**
   * Start loop.
   *
   * @returns {Interval}
   */
  start() {
    if (this.#stopped) {
      this.#then = Date.now();
      this.#stopped = false;
      this.#timer = requestAnimationFrame(this.#callback);
    }

    return this;
  }

  /**
   * Stop looping.
   *
   * @returns {Interval}
   */
  stop() {
    if (!this.#stopped) {
      this.#stopped = true;
      cancelAnimationFrame(this.#timer);
      this.#timer = null;
    }

    return this;
  }

  /**
   * Loop callback, fired on every animation frame.
   */
  #__callback() {
    this.#timer = requestAnimationFrame(this.#callback);

    if (this.delay) {
      const now = Date.now();
      const elapsed = now - this.#then;

      if (elapsed > this.delay) {
        this.#then = now - (elapsed % this.delay);
        this.#func();
      }
    } else {
      this.#func();
    }
  }
}

export default Interval;

/**
 * Convert delay from string format to milliseconds.
 *
 * @param {number|string} delay The delay in FPS (frame per second) or number format.
 * @returns {number}
 */
export function parseDelay(delay) {
  let result = delay;

  if (typeof result === 'string' && /fps$/.test(result)) {
    result = 1000 / parseInt(result.replace('fps', '') || 0, 10);
  }

  return result;
}
