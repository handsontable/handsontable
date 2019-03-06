import arrayMapper from '../../mixins/arrayMapper';
import { mixin } from '../../helpers/object';
import { rangeEach } from '../../helpers/number';

/**
 * @class RowsMapper
 * @plugin TrimRows
 */
class RowsMapper {
  constructor(trimRows) {
    /**
     * Instance of TrimRows plugin.
     *
     * @type {TrimRows}
     */
    this.trimRows = trimRows;
  }

  /**
   * Reset current map array and create new one.
   *
   * @param {Number} [length] Custom generated map length.
   */
  createMap(length) {
    let rowOffset = 0;
    const originLength = length === void 0 ? this._arrayMap.length : length;

    this._arrayMap.length = 0;

    rangeEach(originLength - 1, (itemIndex) => {
      if (this.trimRows.isTrimmed(itemIndex)) {
        rowOffset += 1;
      } else {
        this._arrayMap[itemIndex - rowOffset] = itemIndex;
      }
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
