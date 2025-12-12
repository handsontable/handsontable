import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';
import { ScrollTimer } from './scrollTimer';

/**
 * Manages independent horizontal and vertical scroll timers for drag-to-scroll
 * behavior. Handles interval calculation internally based on mouse distance from
 * table viewport boundaries. Each axis runs independently - horizontal can scroll
 * fast while vertical scrolls slow.
 */
export class AutoScroller {
  /**
   * Horizontal scroll timer.
   *
   * @type {ScrollTimer}
   */
  #horizontal;
  /**
   * Vertical scroll timer.
   *
   * @type {ScrollTimer}
   */
  #vertical;

  /**
   * @param {Function} registerTimeout Timeout registration function (typically `hot._registerTimeout`).
   */
  constructor(registerTimeout) {
    this.#horizontal = new ScrollTimer(registerTimeout);
    this.#vertical = new ScrollTimer(registerTimeout);

    this.#horizontal.addLocalHook('tick', distance => this.runLocalHooks('scrollHorizontal', distance));
    this.#vertical.addLocalHook('tick', distance => this.runLocalHooks('scrollVertical', distance));
  }

  /**
   * Whether any axis is currently scrolling.
   *
   * @type {boolean}
   */
  get isActive() {
    return this.#horizontal.isActive || this.#vertical.isActive;
  }

  /**
   * Configures scroll timing settings for both axes.
   *
   * @param {object} settings Scroll settings.
   * @param {object} settings.intervalRange Interval range in milliseconds.
   * @param {object} settings.intervalRange.min Minimum interval in milliseconds.
   * @param {object} settings.intervalRange.max Maximum interval in milliseconds.
   * @param {number} settings.rampDistance Distance at which interval reaches minimum.
   */
  configure(settings) {
    this.#horizontal.configure(settings);
    this.#vertical.configure(settings);
  }

  /**
   * Updates scroll state based on cursor overflow from viewport boundaries.
   *
   * @param {{ x: number, y: number }} overflow Distance past viewport edges (0 = inside, N >0 || N < 0 = pixels outside).
   */
  update({ x, y }) {
    this.#horizontal.update(x);
    this.#vertical.update(y);
  }

  /**
   * Stops all scrolling.
   */
  stop() {
    this.#horizontal.stop();
    this.#vertical.stop();
  }

  /**
   * Destroys the scroll looper.
   */
  destroy() {
    this.stop();
    this.#horizontal = null;
    this.#vertical = null;
  }
}

mixin(AutoScroller, localHooks);
