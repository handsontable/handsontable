import Handsontable from './../../browser';
import {arrayMapper} from './../../mixins/arrayMapper';
import {mixin} from './../../helpers/object';
import {rangeEach} from './../../helpers/number';

/**
 * @class RowsMapper
 * @plugin ManualRowMove
 * @pro
 */
class RowsMapper {
  constructor(manualRowMove) {
    /**
     * Instance of TrimRows plugin.
     *
     * @type {ManualRowMove}
     */
    this.manualRowMove = manualRowMove;
  }

  /**
   * Reset current map array and create new one.
   *
   * @param {Number} [length] Custom generated map length.
   */
  createMap(length) {
    let originLength = length === void 0 ? this._arrayMap.length : length;

    this._arrayMap.length = 0;

    rangeEach(originLength - 1, (itemIndex) => {
      this._arrayMap[itemIndex] = itemIndex;
    });
  }

  /**
   * Destroy class.
   */
  destroy() {
    this._arrayMap = null;
  }

  /**
   * Moving elements in rowsMapper.
   *
   * @param {Number} from
   * @param {Number} to
   */
  moveRow(from, to) {
    var indexToMove = this._arrayMap[from];
    this._arrayMap[from] = null;
    this._arrayMap.splice(to, 0, indexToMove);
  }

  /**
   * Clearing arrayMap from `null` entries.
   */
  clearNull() {
    this._arrayMap = this._arrayMap.filter(function(i) {
      return i !== null;
    });
  }
}

mixin(RowsMapper, arrayMapper);

export {RowsMapper};

// For tests only!
Handsontable.utils.ManualRowMoveRowsMapper = RowsMapper;
