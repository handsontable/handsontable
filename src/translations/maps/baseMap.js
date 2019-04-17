import { arrayMap } from '../../helpers/array';
import { mixin } from '../../helpers/object';
import { isFunction } from '../../helpers/function';
import localHooks from './../../mixins/localHooks';

/**
 * Map from index to value.
 */
class BaseMap {
  constructor(initValueOrFn = index => index) {
    this.list = [];
    this.initValueOrFn = initValueOrFn;
  }

  /**
   * Initialize list with default values for particular indexes.
   *
   * @param {Number} length New length of list.
   */
  init(length) {
    this.list = arrayMap(new Array(length), (_, indexOfArray) => {
      if (isFunction(this.initValueOrFn)) {
        return this.initValueOrFn(indexOfArray);
      }

      return this.initValueOrFn;
    });

    return this;
  }

  /**
   * Get full list of values for particular indexes.
   *
   * @returns {Array}
   */
  getValues() {
    return this.list.slice();
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
   * Get value for particular index.
   *
   * @param {Number} index
   * @returns {*}
   */
  getValueAtIndex(index) {
    return this.getValues()[index];
  }

  /**
   * Clear all values.
   */
  clear() {
    this.init(this.list.length);
    this.runLocalHooks('mapChanged');
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
   * Add values to list and reorganize.
   *
   * @private
   * @param {Number} insertionIndex Position inside actual list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  // eslint-disable-next-line no-unused-vars
  addValueAndReorganize(insertionIndex, insertedIndexes) {
    throw Error('Map addValueAndReorganize() method unimplemented');
  }

  /**
   * Remove values from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  // eslint-disable-next-line no-unused-vars
  removeValuesAndReorganize(removedIndexes) {
    throw Error('Map removeValuesAndReorganize() method unimplemented');
  }
}

mixin(BaseMap, localHooks);

export default BaseMap;
