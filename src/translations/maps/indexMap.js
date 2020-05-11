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
   * @param {number} index Index for which value is got.
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
    if (values.length !== this.getLength()) {
      throw new Error('The values must be the same length as the index map.');
    }

    const oldValues = this.indexedValues.slice();

    this.indexedValues = values.slice();

    this.runLocalHooks('change', {
      changeType: 'multiple',
      oldValue: oldValues,
      newValue: this.indexedValues,
    });
  }

  /**
   * Set new value for the particular index.
   *
   * @param {number} index The index.
   * @param {*} value The value to save.
   *
   * Note: Please keep in mind that it is not possible to set value beyond the map (not respecting already set
   * map's size). Please use the `setValues` method when you would like to extend the map.
   *
   * @returns {boolean}
   */
  setValueAtIndex(index, value) {
    if (index < this.getLength()) {
      const oldValue = this.indexedValues[index];

      this.indexedValues[index] = value;

      this.runLocalHooks('change', {
        changeType: 'single',
        oldValue: { index, value: oldValue },
        newValue: { index, value },
      });

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
   * @returns {number}
   */
  getLength() {
    return this.getValues().length;
  }

  /**
   * Set default values for elements from `0` to `n`, where `n` is equal to the handled variable.
   *
   * @private
   * @param {number} [length] Length of list.
   */
  setDefaultValues(length = this.indexedValues.length) {
    this.indexedValues.length = 0;

    if (isFunction(this.initValueOrFn)) {
      rangeEach(length - 1, index => this.indexedValues.push(this.initValueOrFn(index)));

    } else {
      rangeEach(length - 1, () => this.indexedValues.push(this.initValueOrFn));
    }

    this.runLocalHooks('change', {
      changeType: 'default',
      oldValue: [],
      newValue: this.indexedValues,
    });
  }

  /**
   * Initialize list with default values for particular indexes.
   *
   * @private
   * @param {number} length New length of indexed list.
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
  insert(insertionIndex, insertedIndexes) {
    this.runLocalHooks('change', {
      changeType: 'insert',
      oldValue: void 0,
      newValue: { index: insertionIndex, value: insertedIndexes },
    });
  }

  /**
   * Remove values from the list.
   *
   * @private
   */
  remove(removedIndexes) {
    this.runLocalHooks('change', {
      changeType: 'remove',
      oldValue: void 0,
      newValue: { value: removedIndexes },
    });
  }

  destroy() {
    this.runLocalHooks('change', {
      changeType: 'destroy',
      oldValue: this.indexedValues,
      newValue: [],
    });
    this.clearLocalHooks();

    this.indexedValues = null;
    this.initValueOrFn = null;
  }
}

mixin(IndexMap, localHooks);

export default IndexMap;
