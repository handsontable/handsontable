import arrayMapper from './../../mixins/arrayMapper';
import {arrayFilter} from './../../helpers/array';
import {mixin} from './../../helpers/object';
import {rangeEach} from './../../helpers/number';

/**
 * @class RowsMapper
 * @plugin ManualRowMove
 */
class RowsMapper {
  constructor(manualRowMove) {
    /**
     * Instance of ManualRowMove plugin.
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
}

mixin(RowsMapper, arrayMapper);

export default RowsMapper;
