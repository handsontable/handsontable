import { rangeEach } from '../../helpers/number';
import { mixin } from '../../helpers/object';
import { isFunction } from '../../helpers/function';
import localHooks from '../../mixins/localHooks';

/**
 * Map from index to value.
 */
class BaseMap {
  constructor(initValuesOrFn = (index => index)) {
    this.list = [];
    this.initValuesOrFn = initValuesOrFn;
  }

  /**
   * Initialize list with default values for particular indexes.
   *
   * @param {Number} length New length of list.
   */
  init(length) {
    this.list.length = 0;

    if (isFunction(this.initValuesOrFn)) {
      rangeEach(length - 1, index => this.list.push(this.initValuesOrFn(index)));

    } else if (Array.isArray(this.initValuesOrFn)) {
      this.list = this.initValuesOrFn.slice();

    } else {
      this.list = Array.from({ length }, () => (this.initValuesOrFn));
    }

    this.runLocalHooks('mapChanged');
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

    this.runLocalHooks('mapChanged');
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

      this.runLocalHooks('mapChanged');

      return true;
    }

    return false;
  }

  /**
   * Clear all values.
   */
  clear() {
    this.init(this.list.length);
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
   * Add values to the list.
   *
   * @private
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  // eslint-disable-next-line no-unused-vars
  insert(insertionIndex, insertedIndexes) {
    throw Error('Map insert() method unimplemented');
  }

  /**
   * Remove values from the list.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  // eslint-disable-next-line no-unused-vars
  remove(removedIndexes) {
    throw Error('Map remove() method unimplemented');
  }
}

mixin(BaseMap, localHooks);

export default BaseMap;
