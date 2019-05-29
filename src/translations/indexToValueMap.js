import { rangeEach } from '../helpers/number';
import { mixin } from '../helpers/object';
import { isFunction } from '../helpers/function';
import { isDefined } from '../helpers/mixed';
import localHooks from '../mixins/localHooks';
import UpdateStrategy from './updateStrategy';

/**
 * Map from index to value.
 */
class IndexToValueMap {
  constructor(config = {}) {
    this.list = [];
    this.initValueOrFn = isDefined(config.initValueOrFn) ? config.initValueOrFn : (index => index);
    this.updateStrategy = new UpdateStrategy(config.strategy);
  }

  /**
   * Initialize list with default values for particular indexes.
   *
   * @param {Number} length New length of list.
   */
  init(length) {
    this.list.length = 0;

    if (isFunction(this.initValueOrFn)) {
      rangeEach(length - 1, index => this.list.push(this.initValueOrFn(index)));

    } else {
      rangeEach(length - 1, () => this.list.push(this.initValueOrFn));
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

    return void 0;
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
  insert(insertionIndex, insertedIndexes) {
    this.list = this.updateStrategy.getItemsAfterInsertion(this.list, insertionIndex, insertedIndexes, this.initValueOrFn);

    this.runLocalHooks('mapChanged');
  }

  /**
   * Remove values from the list.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes) {
    this.list = this.updateStrategy.getItemsAfterRemoval(this.list, removedIndexes);

    this.runLocalHooks('mapChanged');
  }
}

mixin(IndexToValueMap, localHooks);

export default IndexToValueMap;
