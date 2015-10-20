
import {arrayEach, arrayReduce, arrayMap} from './../helpers/array';
import {defineGetter} from './../helpers/object';
import {rangeEach} from './../helpers/number';

const MIXIN_NAME = 'arrayMapper';

/**
 * @type {Object}
 */
const arrayMapper = {
  _arrayMap: [],

  /**
   * Get value by map index.
   *
   * @param {Number} index Array index.
   * @return {*} Returns value mapped to passed index.
   */
  getValueByIndex(index) {
    let value;

    return (value = this._arrayMap[index]) === void 0 ? null : value;
  },

  /**
   * Get index by its value.
   *
   * @param {*} value Value to search.
   * @returns {Number} Returns array index.
   */
  getIndexByValue(value) {
    let index;

    return (index = this._arrayMap.indexOf(value)) === -1 ? null : index;
  },

  /**
   * Remove items from array mapper.
   *
   * @param {Number|Array} index Array index or Array of indexes to remove.
   * @param {Number} [amount=1] Defines how many items will be removed from an array (when index is passed as number).
   */
  removeItems(index, amount = 1) {
    let removedRows = [];

    if (Array.isArray(index)) {
      let mapCopy = [].concat(this._arrayMap);

      // Sort descending
      index.sort((a, b) => b - a);

      removedRows = arrayReduce(index, (acc, item) => {
        this._arrayMap.splice(item, 1);

        return acc.concat(mapCopy.slice(item, item + 1));
      }, []);

    } else {
      removedRows = this._arrayMap.splice(index, amount);
    }

    function countRowShift(logicalRow) {
      // Todo: compare perf between reduce vs sort->each->brake
      return arrayReduce(removedRows, (count, removedLogicalRow) => {
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
   * Insert new items to array mapper starting at passed index.
   *
   * @param {Number} index Array index.
   * @param {Number} [amount=1] Defines how many items will be created to an array.
   */
  insertItems(index, amount = 1) {
    this._arrayMap = arrayMap(this._arrayMap, (row) => {
      if (row >= index) {
        row += amount;
      }

      return row;
    });
    rangeEach(amount - 1, (count) => {
      this._arrayMap.splice(index + count, 0, index + count);
    });
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

export {arrayMapper};

// For tests only!
Handsontable.utils = Handsontable.utils || {};
Handsontable.utils.arrayMapper = arrayMapper;
