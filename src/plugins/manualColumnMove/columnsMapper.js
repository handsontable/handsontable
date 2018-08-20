import arrayMapper from './../../mixins/arrayMapper';
import { arrayFilter } from './../../helpers/array';
import { mixin } from './../../helpers/object';
import { rangeEach } from './../../helpers/number';

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
   * Moving elements in columnsMapper.
   *
   * @param {Number} from Column index to move.
   * @param {Number} to Target index.
   */
  moveColumn(from, to) {
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

mixin(ColumnsMapper, arrayMapper);

export default ColumnsMapper;
