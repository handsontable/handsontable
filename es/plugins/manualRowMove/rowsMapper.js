var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import arrayMapper from './../../mixins/arrayMapper';
import { arrayFilter } from './../../helpers/array';
import { mixin } from './../../helpers/object';
import { rangeEach } from './../../helpers/number';

/**
 * @class RowsMapper
 * @plugin ManualRowMove
 */

var RowsMapper = function () {
  function RowsMapper(manualRowMove) {
    _classCallCheck(this, RowsMapper);

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


  _createClass(RowsMapper, [{
    key: 'createMap',
    value: function createMap(length) {
      var _this = this;

      var originLength = length === void 0 ? this._arrayMap.length : length;

      this._arrayMap.length = 0;

      rangeEach(originLength - 1, function (itemIndex) {
        _this._arrayMap[itemIndex] = itemIndex;
      });
    }

    /**
     * Destroy class.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this._arrayMap = null;
    }

    /**
     *
     * Moving elements in rowsMapper.
     * @param {Number} from Row index to move.
     * @param {Number} to Target index.
     */

  }, {
    key: 'moveRow',
    value: function moveRow(from, to) {
      var indexToMove = this._arrayMap[from];
      this._arrayMap[from] = null;
      this._arrayMap.splice(to, 0, indexToMove);
    }

    /**
     * Clearing arrayMap from `null` entries.
     */

  }, {
    key: 'clearNull',
    value: function clearNull() {
      this._arrayMap = arrayFilter(this._arrayMap, function (i) {
        return i !== null;
      });
    }
  }]);

  return RowsMapper;
}();

mixin(RowsMapper, arrayMapper);

export default RowsMapper;