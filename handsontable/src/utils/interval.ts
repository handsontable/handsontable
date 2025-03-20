import { requestAnimationFrame, cancelAnimationFrame } from './../helpers/feature';

/**
 * @class Interval
 */
class Interval {
  static create(func: () => void, delay: number | string): Interval {
    return new Interval(func, delay);
  }

  /**
   * Number of milliseconds that function should wait before next call.
   *
   * @type {number}
   */
  delay: number;
  /**
   * Animation frame request id.
   *
   * @type {number}
   */
  #timer: number | null = null;
  /**
   * Function to invoke repeatedly.
   *
   * @type {Function}
   */
  #func: () => void;
  /**
   * Flag which indicates if interval object was stopped.
   *
   * @type {boolean}
   * @default true
   */
  #stopped: boolean = true;
  /**
   * Interval time (in milliseconds) of the last callback call.
   *
   * @type {number}
   */
  #then: number | null = null;
  /**
   * Bounded function `func`.
   *
   * @type {Function}
   */
  #callback: () => void;

  constructor(func: () => void, delay: number | string) {
    this.#func = func;
    this.delay = parseDelay(delay);
    this.#callback = () => this.#__callback();
  }

  /**
   * Start loop.
   *
   * @returns {Interval}
   */
  start(): Interval {
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
  stop(): Interval {
    if (!this.#stopped) {
      this.#stopped = true;
      cancelAnimationFrame(this.#timer as number);
      this.#timer = null;
    }

    return this;
  }

  /**
   * Loop callback, fired on every animation frame.
   */
  #__callback(): void {
    this.#timer = requestAnimationFrame(this.#callback);

    if (this.delay) {
      const now = Date.now();
      const elapsed = now - (this.#then as number);

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
export function parseDelay(delay: number | string): number {
  let result = delay;

  if (typeof result === 'string' && /fps$/.test(result)) {
    result = 1000 / parseInt(result.replace('fps', '') || '0', 10);
  }

  return result as number;
}
