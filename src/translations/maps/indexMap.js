import { arrayMap } from '../../helpers/array';
import { isFunction } from '../../helpers/function';

/**
 * Map from index to value.
 */
class IndexMap {
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
  }

  /**
   * Get length of index map.
   *
   * @returns {Number}
   */
  getLength() {
    return this.getValues().length;
  }
}

export default IndexMap;
