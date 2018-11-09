import { observe, unobserve, generate } from 'fast-json-patch';
import localHooks from '../../mixins/localHooks';
import { mixin } from '../../helpers/object';
import { cleanPatches } from './utils';

const intervals = [100, 1000, 10000, 60000];

let currentInterval = 0;

const slowCheck = function(observer) {
  generate(observer);

  if (currentInterval === intervals.length) {
    currentInterval = intervals.length - 1;
  }

  observer.next = setTimeout(() => slowCheck(observer), intervals[currentInterval += 1]);
};

/**
 * @class DataObserver
 * @plugin ObserveChanges
 */
class DataObserver {
  constructor(observedData) {
    /**
     * Observed source data.
     *
     * @type {Array}
     */
    this.observedData = null;
    /**
     * JsonPatch observer.
     *
     * @type {Object}
     */
    this.observer = null;
    /**
     * Flag which determines if observer is paused or not. Paused observer doesn't emit `change` hooks.
     *
     * @type {Boolean}
     * @default false
     */
    this.paused = false;

    this.setObservedData(observedData);
  }

  /**
   * Set data to observe.
   *
   * @param {*} observedData
   */
  setObservedData(observedData) {
    if (this.observer) {
      unobserve(this.observedData, this.observer);
    }
    this.observedData = observedData;
    this.observer = observe(this.observedData, patches => this.onChange(patches));

    this.observer.next = setTimeout(() => slowCheck(this.observer), intervals[currentInterval += 1]);
  }

  /**
   * Check if observer was paused.
   *
   * @returns {Boolean}
   */
  isPaused() {
    return this.paused;
  }

  /**
   * Pause observer (stop emitting all detected changes).
   */
  pause() {
    this.paused = true;
  }

  /**
   * Resume observer (emit all detected changes).
   */
  resume() {
    this.paused = false;
  }

  /**
   * JsonPatch on change listener.
   *
   * @private
   * @param {Array} patches An array of object passed from jsonpatch.
   */
  onChange(patches) {
    this.runLocalHooks('change', cleanPatches(patches));
  }

  /**
   * Destroy observer instance.
   */
  destroy() {
    unobserve(this.observedData, this.observer);
    this.observedData = null;
    this.observer = null;
  }
}

mixin(DataObserver, localHooks);

export default DataObserver;
