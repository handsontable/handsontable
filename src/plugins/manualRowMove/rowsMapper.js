import arrayMapper from './../../mixins/arrayMapper';
import { arrayFilter } from './../../helpers/array';
import { mixin } from './../../helpers/object';
import { rangeEach } from './../../helpers/number';

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
    const originLength = length === void 0 ? this._arrayMap.length : length;

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
   *
   * Moving elements in rowsMapper.
   * @param {Number} from Row index to move.
   * @param {Number} to Target index.
   */
  moveRow(from, to) {
    const indexToMove = this._arrayMap[from];
    this._arrayMap[from] = null;
    this._arrayMap.splice(to, 0, indexToMove);
  }

  /**
   * Clearing arrayMap from `null` entries.
   */
  clearNull() {
    this._arrayMap = arrayFilter(this._arrayMap, i => i !== null);
  }
}

mixin(RowsMapper, arrayMapper);

export default RowsMapper;
