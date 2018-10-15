'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _arrayMapper = require('../../mixins/arrayMapper');

var _arrayMapper2 = _interopRequireDefault(_arrayMapper);

var _object = require('../../helpers/object');

var _number = require('../../helpers/number');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class RowsMapper
 * @plugin ColumnSorting
 */
var RowsMapper = function () {
  function RowsMapper(columnSorting) {
    _classCallCheck(this, RowsMapper);

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


  _createClass(RowsMapper, [{
    key: 'createMap',
    value: function createMap(length) {
      var _this = this;

      var originLength = length === void 0 ? this._arrayMap.length : length;

      this._arrayMap.length = 0;

      (0, _number.rangeEach)(originLength - 1, function (itemIndex) {
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
  }]);

  return RowsMapper;
}();

(0, _object.mixin)(RowsMapper, _arrayMapper2.default);

exports.default = RowsMapper;