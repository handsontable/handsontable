import arrayMapper from 'handsontable/mixins/arrayMapper';
import { mixin } from 'handsontable/helpers/object';
import { rangeEach } from 'handsontable/helpers/number';

/**
 * @class RowsMapper
 * @plugin MultiColumnSorting
 */
class RowsMapper {
  constructor(multiColumnSorting) {
    /**
     * Instance of MultiColumnSorting plugin.
     *
     * @type {MultiColumnSorting}
     */
    this.multiColumnSorting = multiColumnSorting;
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
