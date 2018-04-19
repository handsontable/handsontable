import {arrayReduce, arrayMap, arrayMax} from './../helpers/array';
import {defineGetter} from './../helpers/object';
import {rangeEach} from './../helpers/number';

const MIXIN_NAME = 'arrayMapper';

/**
 * @type {Object}
 */
const arrayMapper = {
  _arrayMap: [],

  /**
   * Get translated index by its visual index.
   *
   * @param {Number} visualIndex Visual index.
   * @return {Number|null} Returns translated index mapped by passed visual index.
   */
  getValueByIndex(visualIndex) {
    const length = this._arrayMap.length;
    let translatedIndex = null;

    if (visualIndex < length) {
      translatedIndex = this._arrayMap[visualIndex];
    }

    return translatedIndex;
  },

  /**
   * Get visual index by its translated index.
   *
   * @param {*} translatedIndex Value to search.
   * @returns {Number|null} Returns a visual index of the array mapper.
   */
  getIndexByValue(translatedIndex) {
    let visualIndex;

    // eslint-disable-next-line no-cond-assign, no-return-assign
    return (visualIndex = this._arrayMap.indexOf(translatedIndex)) === -1 ? null : visualIndex;
  },

  /**
   * Insert new items to array mapper starting at passed index. New entries will be a continuation of last value in the array.
   *
   * @param {Number} visualIndex Array index.
   * @param {Number} [amount=1] Defines how many items will be created to an array.
   * @returns {Array} Returns added items.
   */
  insertItems(visualIndex, amount = 1) {
    let newIndex = arrayMax(this._arrayMap) + 1;
    let addedItems = [];

    rangeEach(amount - 1, (count) => {
      addedItems.push(this._arrayMap.splice(visualIndex + count, 0, newIndex + count));
    });

    return addedItems;
  },

  /**
   * Remove items from array mapper.
   *
   * @param {Number} visualIndex Array index.
   * @param {Number} [amount=1] Defines how many items will be created to an array.
   * @returns {Array} Returns removed items.
   */
  removeItems(visualIndex, amount = 1) {
    let removedItems = [];

    if (Array.isArray(visualIndex)) {
      let mapCopy = [].concat(this._arrayMap);

      // Sort descending
      visualIndex.sort((a, b) => b - a);

      removedItems = arrayReduce(visualIndex, (acc, item) => {
        this._arrayMap.splice(item, 1);

        return acc.concat(mapCopy.slice(item, item + 1));
      }, []);

    } else {
      removedItems = this._arrayMap.splice(visualIndex, amount);
    }

    return removedItems;
  },

  /**
   * Unshift items (remove and shift chunk of array to the left).
   *
   * @param {Number|Array} visualIndex Array index or Array of indexes to unshift.
   * @param {Number} [amount=1] Defines how many items will be removed from an array (when index is passed as number).
   */
  unshiftItems(visualIndex, amount = 1) {
    let removedItems = this.removeItems(visualIndex, amount);

    function countRowShift(logicalRow) {
      // Todo: compare perf between reduce vs sort->each->brake
      return arrayReduce(removedItems, (count, removedLogicalRow) => {
        if (logicalRow > removedLogicalRow) {
          count++;
        }

        return count;
      }, 0);
    }

    this._arrayMap = arrayMap(this._arrayMap, (logicalRow, physicalRow) => {
      let rowShift = countRowShift(logicalRow);

      if (rowShift) {
        logicalRow -= rowShift;
      }

      return logicalRow;
    });
  },

  /**
   * Shift (right shifting) items starting at passed index.
   *
   * @param {Number} visualIndex Array index.
   * @param {Number} [amount=1] Defines how many items will be created to an array.
   */
  shiftItems(visualIndex, amount = 1) {
    this._arrayMap = arrayMap(this._arrayMap, (row) => {
      if (row >= visualIndex) {
        row += amount;
      }
      return row;
    });

    rangeEach(amount - 1, (count) => {
      this._arrayMap.splice(visualIndex + count, 0, visualIndex + count);
    });
  },

  /**
   * Swap indexes in arrayMapper.
   *
   * @param {Number} visualIndexFrom index to move.
   * @param {Number} visualIndexTo index to.
   */
  swapIndexes(visualIndexFrom, visualIndexTo) {
    this._arrayMap.splice(visualIndexTo, 0, ...this._arrayMap.splice(visualIndexFrom, 1));
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
