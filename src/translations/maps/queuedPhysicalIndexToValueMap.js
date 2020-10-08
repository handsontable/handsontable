import IndexMap from './indexMap';

/**
 * Map for storing mappings from an physical index to a value. Some values are stored in a certain order.
 *
 * Does not update stored values on remove/add row or column action. Otherwise, queue of indexes related to ordered
 * values is updated after such changes.
 */
class QueuedPhysicalIndexToValueMap extends IndexMap {
  /**
   * Some values are stored in a certain order. Queue of indexes represent indexes related to ordered values.
   *
   * @private
   * @type {Array<number>}
   */
  queueOfIndexes = []

  /**
   * Get full list of values for particular indexes.
   *
   * @returns {Array}
   */
  getValues() {
    return this.queueOfIndexes.map(physicalIndex => this.getValueAtIndex(physicalIndex));
  }

  /**
   * Set new values for particular indexes.
   *
   * Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.
   *
   * @param {Array} values List of set values.
   */
  setValues(values) {
    super.setValues(values);

    this.queueOfIndexes = [...Array(values.length).keys()];
  }

  /**
   * Set value at index and add it to the queue of values. Non-default values are stored in a certain order.
   *
   * Note: Queued value will be added at the end of the queue.
   *
   * @param {number} index The index.
   * @param {*} value The value to save.
   *
   * @returns {boolean}
   */
  setValueAtIndex(index, value) {
    const result = super.setValueAtIndex(index, value);

    if (result === true) {
      this.queueOfIndexes.push(index);
    }

    return result;
  }

  /**
   * Set default values for elements from `0` to `n`, where `n` is equal to the handled variable.
   *
   * Note: Please keep in mind that `change` hook triggered by the method may not update cache of a collection immediately.
   *
   * @private
   * @param {number} [length] Length of list.
   */
  setDefaultValues(length = this.indexedValues.length) {
    super.setDefaultValues(length);

    this.queueOfIndexes.length = 0;
  }

  /**
   * Remove every queued value.
   */
  clear() {
    super.clear();

    this.queueOfIndexes = [];
  }

  /**
   * Get every queued value.
   *
   * @returns {Array}
   */
  getEntries() {
    return this.queueOfIndexes.map(physicalIndex => [physicalIndex, this.getValueAtIndex(physicalIndex)]);
  }

  /**
   * Get length of the index map.
   *
   * @returns {number}
   */
  getLength() {
    return this.queueOfIndexes.length;
  }
}

export default QueuedPhysicalIndexToValueMap;
