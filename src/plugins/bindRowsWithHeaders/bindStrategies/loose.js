import arrayMapper from 'handsontable/mixins/arrayMapper';
import { mixin } from 'handsontable/helpers/object';

/**
 * @private
 * @class LooseBindStrategy
 */
class LooseBindStrategy {
  /**
   * Loose bind mode.
   *
   * @returns {String}
   */
  static get STRATEGY_NAME() {
    return 'loose';
  }

  /**
   * Strategy for the create row action.
   *
   * @param {Number} index Row index.
   * @param {Number} amount
   */
  createRow(index, amount) {
    this.shiftItems(index, amount);
  }

  /**
   * Strategy for the remove row action.
   *
   * @param {Number|Array} index Row index or Array of row indexes.
   * @param {Number} amount
   */
  removeRow(index, amount) {
    this.unshiftItems(index, amount);
  }

  /**
   * Destroy strategy class.
   */
  destroy() {
    this._arrayMap = null;
  }
}

mixin(LooseBindStrategy, arrayMapper);

export default LooseBindStrategy;
