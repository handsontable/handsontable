import arrayMapper from './../../mixins/arrayMapper';
import {mixin} from './../../helpers/object';
import {rangeEach} from './../../helpers/number';

/**
 * @class RowsMapper
 * @plugin ManualRowMove
 */
class RowsMapper {
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
}

mixin(RowsMapper, arrayMapper);

export default RowsMapper;
