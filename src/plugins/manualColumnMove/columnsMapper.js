import arrayMapper from './../../mixins/arrayMapper';
import {arrayFilter} from './../../helpers/array';
import {mixin} from './../../helpers/object';
import {rangeEach} from './../../helpers/number';

/**
 * @class ColumnsMapper
 * @plugin ManualColumnMove
 */
class ColumnsMapper {
  constructor(manualColumnMove) {
    /**
     * Instance of ManualColumnMove plugin.
     *
     * @type {ManualColumnMove}
     */
    this.manualColumnMove = manualColumnMove;
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

mixin(ColumnsMapper, arrayMapper);

export default ColumnsMapper;
