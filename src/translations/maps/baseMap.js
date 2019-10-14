import { rangeEach } from '../../helpers/number';
import { mixin } from '../../helpers/object';
import { isFunction } from '../../helpers/function';
import localHooks from '../../mixins/localHooks';

/**
 * Map from index to value.
 */
class BaseMap {
  constructor(initValueOrFn = null) {
    this.list = [];
    this.initValueOrFn = initValueOrFn;
  }

  /**
   * Initialize list with default values for particular indexes.
   *
   * @param {Number} length New length of list.
   */
  init(length) {
    this.setDefaultValues(length);

    this.runLocalHooks('init');

    return this;
  }

  /**
   * Get full list of values for particular indexes.
   *
   * @returns {Array}
   */
  getValues() {
    return this.list;
  }

  /**
   * Get value for particular index.
   *
   * @param {Number} index
   * @returns {*}
   */
  getValueAtIndex(index) {
    const values = this.getValues();

    if (index < values.length) {
      return values[index];
    }
  }

  /**
   * Set new values for particular indexes.
   *
   * @param {Array} values List of set values.
   */
  setValues(values) {
    this.list = values.slice();

    this.runLocalHooks('change');
  }

  /**
   * Set new value for particular index.
   *
   * @param {Number} index
   * @param {*} value
   * @returns {Boolean}
   */
  setValueAtIndex(index, value) {
    if (index < this.getLength()) {
      this.list[index] = value;

      this.runLocalHooks('change');

      return true;
    }

    return false;
  }

  /**
   * Clear all values.
   */
  clear() {
    this.setDefaultValues();
  }

  /**
   * Get length of index map.
   *
   * @returns {Number}
   */
  getLength() {
    return this.getValues().length;
  }

  /**
   * Set default values for elements from `0` to `n`, where `n` is equal to the handled variable.
   *
   * @private
   * @param {Number} [length] Length of list.
   */
  setDefaultValues(length = this.list.length) {
    this.list.length = 0;

    if (isFunction(this.initValueOrFn)) {
      rangeEach(length - 1, index => this.list.push(this.initValueOrFn(index)));

    } else {
      rangeEach(length - 1, () => this.list.push(this.initValueOrFn));
    }

    this.runLocalHooks('change');
  }

  /**
   * Add values to the list.
   *
   * @private
   */
  insert() {
    this.runLocalHooks('change');
  }

  /**
   * Remove values from the list.
   *
   * @private
   */
  remove() {
    this.runLocalHooks('change');
  }
}

mixin(BaseMap, localHooks);

export default BaseMap;
