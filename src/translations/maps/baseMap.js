import {arrayMap, arrayReduce} from '../../helpers/array';
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

    this.runLocalHooks('mapChanged');

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
   */
  setValueAtIndex(index, value) {
    this.list[index] = value;

    this.runLocalHooks('mapChanged');
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

  /**
   * Get indexes list by given condition checked on list of values.
   *
   * @param {Array} valueList List of values.
   * @param {Function} condition Condition for values to meet.
   * @returns {Array}
   */

  getIndexesByValueCondition(condition) {
    return arrayReduce(this.getValues(), (indexList, value, physicalIndex) => {
      if (condition(value, physicalIndex)) {
        return indexList.concat(physicalIndex);
      }

      return indexList;
    }, []);
  }
}

mixin(BaseMap, localHooks);

export default BaseMap;
