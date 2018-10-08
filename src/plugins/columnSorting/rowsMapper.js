import arrayMapper from '../../mixins/arrayMapper';
import { mixin } from '../../helpers/object';
import { rangeEach } from '../../helpers/number';

/**
 * @class RowsMapper
 * @plugin ColumnSorting
 */
class RowsMapper {
  constructor(columnSorting) {
    /**
     * Instance of ColumnSorting plugin.
     *
     * @type {ColumnSorting}
     */
    this.columnSorting = columnSorting;
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
}

mixin(RowsMapper, arrayMapper);

export default RowsMapper;
