import { arrayReduce, arrayMap, arrayMax } from './../helpers/array';
import { defineGetter } from './../helpers/object';
import { rangeEach } from './../helpers/number';

const MIXIN_NAME = 'arrayMapper';

/**
 * @type {Object}
 */
const arrayMapper = {
  _arrayMap: [],

  /**
   * Get translated index by its physical index.
   *
   * @param {Number} physicalIndex Physical index.
   * @return {Number|null} Returns translated index mapped by passed physical index.
   */
  getValueByIndex(physicalIndex) {
    const length = this._arrayMap.length;
    let translatedIndex = null;

    if (physicalIndex < length) {
      translatedIndex = this._arrayMap[physicalIndex];
    }

    return translatedIndex;
  },

  /**
   * Get physical index by its translated index.
   *
   * @param {*} translatedIndex Value to search.
   * @returns {Number|null} Returns a physical index of the array mapper.
   */
  getIndexByValue(translatedIndex) {
    let physicalIndex;

    // eslint-disable-next-line no-cond-assign, no-return-assign
    return (physicalIndex = this._arrayMap.indexOf(translatedIndex)) === -1 ? null : physicalIndex;
  },

  /**
   * Insert new items to array mapper starting at passed index. New entries will be a continuation of last value in the array.
   *
   * @param {Number} physicalIndex Array index.
   * @param {Number} [amount=1] Defines how many items will be created to an array.
   * @returns {Array} Returns added items.
   */
  insertItems(physicalIndex, amount = 1) {
    const newIndex = arrayMax(this._arrayMap) + 1;
    const addedItems = [];

    rangeEach(amount - 1, (count) => {
      addedItems.push(this._arrayMap.splice(physicalIndex + count, 0, newIndex + count));
    });

    return addedItems;
  },

  /**
   * Remove items from array mapper.
   *
   * @param {Number} physicalIndex Array index.
   * @param {Number} [amount=1] Defines how many items will be created to an array.
   * @returns {Array} Returns removed items.
   */
  removeItems(physicalIndex, amount = 1) {
    let removedItems = [];

    if (Array.isArray(physicalIndex)) {
      const mapCopy = [].concat(this._arrayMap);

      // Sort descending
      physicalIndex.sort((a, b) => b - a);

      for (let i = 0, length = physicalIndex.length; i < length; i++) {
        const indexToRemove = physicalIndex[i];
        this._arrayMap.splice(indexToRemove, 1);
        removedItems.push(mapCopy[indexToRemove]);
      }

    } else {
      removedItems = this._arrayMap.splice(physicalIndex, amount);
    }

    return removedItems;
  },

  /**
   * Unshift items (remove and shift chunk of array to the left).
   *
   * @param {Number|Array} physicalIndex Array index or Array of indexes to unshift.
   * @param {Number} [amount=1] Defines how many items will be removed from an array (when index is passed as number).
   */
  unshiftItems(physicalIndex, amount = 1) {
    const removedItems = this.removeItems(physicalIndex, amount);

    function countRowShift(logicalRow) {
      // Todo: compare perf between reduce vs sort->each->brake
      return arrayReduce(removedItems, (count, removedLogicalRow) => {
        let result = count;

        if (logicalRow > removedLogicalRow) {
          result += 1;
        }

        return result;
      }, 0);
    }

    this._arrayMap = arrayMap(this._arrayMap, (logicalRow) => {
      let logicalRowIndex = logicalRow;
      const rowShift = countRowShift(logicalRowIndex);

      if (rowShift) {
        logicalRowIndex -= rowShift;
      }

      return logicalRowIndex;
    });
  },

  /**
   * Shift (right shifting) items starting at passed index.
   *
   * @param {Number} physicalIndex Array index.
   * @param {Number} [amount=1] Defines how many items will be created to an array.
   */
  shiftItems(physicalIndex, amount = 1) {
    this._arrayMap = arrayMap(this._arrayMap, (row) => {
      let physicalRowIndex = row;

      if (physicalRowIndex >= physicalIndex) {
        physicalRowIndex += amount;
      }

      return physicalRowIndex;
    });

    rangeEach(amount - 1, (count) => {
      this._arrayMap.splice(physicalIndex + count, 0, physicalIndex + count);
    });
  },

  /**
   * Swap indexes in arrayMapper.
   *
   * @param {Number} physicalIndexFrom index to move.
   * @param {Number} physicalIndexTo index to.
   */
  swapIndexes(physicalIndexFrom, physicalIndexTo) {
    this._arrayMap.splice(physicalIndexTo, 0, ...this._arrayMap.splice(physicalIndexFrom, 1));
  },

  /**
   * Clear all stored index<->value information from an array.
   */
  clearMap() {
    this._arrayMap.length = 0;
  }
};

defineGetter(arrayMapper, 'MIXIN_NAME', MIXIN_NAME, {
  writable: false,
  enumerable: false,
});

export default arrayMapper;
