import arrayMapper from 'handsontable/mixins/arrayMapper';
import {mixin} from 'handsontable/helpers/object';

/**
 * @private
 * @class StrictBindStrategy
 */
class StrictBindStrategy {
  /**
   * Loose bind mode.
   *
   * @returns {String}
   */
  static get STRATEGY_NAME() {
    return 'strict';
  }

  /**
   * Strategy for the create row action.
   *
   * @param {Number} index Row index.
   * @param {Number} amount
   */
  createRow(index, amount) {
    this.insertItems(index, amount);
  }

  /**
   * Strategy for the remove row action.
   *
   * @param {Number|Array} index Row index or Array of row indexes.
   * @param {Number} amount
   */
  removeRow(index, amount) {
    this.removeItems(index, amount);
  }

  /**
   * Destroy strategy class.
   */
  destroy() {
    this._arrayMap = null;
  }
}

mixin(StrictBindStrategy, arrayMapper);

export default StrictBindStrategy;
