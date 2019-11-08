import { rangeEach } from '../../helpers/number';
import { mixin } from '../../helpers/object';
import { isFunction } from '../../helpers/function';
import localHooks from '../../mixins/localHooks';

/**
 * Map for storing mappings from an index to a value.
 */
class IndexMap {
  constructor(initValueOrFn = null) {
    /**
     * List of values for particular indexes.
     *
     * @private
     * @type {Array}
     */
    this.indexedValues = [];
    /**
     * Initial value or function for each existing index.
     *
     * @private
     * @type {*}
     */
    this.initValueOrFn = initValueOrFn;
  }

  /**
   * Get full list of values for particular indexes.
   *
   * @returns {Array}
   */
  getValues() {
    return this.indexedValues;
  }

  /**
   * Get value for the particular index.
   *
   * @param {Number} index Index for which value is got.
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
    this.indexedValues = values.slice();

    this.runLocalHooks('change');
  }

  /**
   * Set new value for the particular index.
   *
   * @param {Number} index
   * @param {*} value
   * @returns {Boolean}
   */
  setValueAtIndex(index, value) {
    if (index < this.getLength()) {
      this.indexedValues[index] = value;

      this.runLocalHooks('change');

      return true;
    }

    return false;
  }

  /**
   * Clear all values to the defaults.
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
  setDefaultValues(length = this.indexedValues.length) {
    this.indexedValues.length = 0;

    if (isFunction(this.initValueOrFn)) {
      rangeEach(length - 1, index => this.indexedValues.push(this.initValueOrFn(index)));

    } else {
      rangeEach(length - 1, () => this.indexedValues.push(this.initValueOrFn));
    }

    this.runLocalHooks('change');
  }

  /**
   * Initialize list with default values for particular indexes.
   *
   * @private
   * @param {Number} length New length of indexed list.
   * @returns {Array}
   */
  init(length) {
    this.setDefaultValues(length);

    this.runLocalHooks('init');

    return this;
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

mixin(IndexMap, localHooks);

export default IndexMap;
