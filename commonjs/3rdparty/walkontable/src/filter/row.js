"use strict";

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class RowFilter
 */
var RowFilter = function () {
  /**
   * @param {Number} offset
   * @param {Number} total
   * @param {Number} countTH
   */
  function RowFilter(offset, total, countTH) {
    _classCallCheck(this, RowFilter);

    this.offset = offset;
    this.total = total;
    this.countTH = countTH;
  }

  /**
   * @param index
   * @returns {Number}
   */


  _createClass(RowFilter, [{
    key: "offsetted",
    value: function offsetted(index) {
      return index + this.offset;
    }

    /**
     * @param index
     * @returns {Number}
     */

  }, {
    key: "unOffsetted",
    value: function unOffsetted(index) {
      return index - this.offset;
    }

    /**
     * @param index
     * @returns {Number}
     */

  }, {
    key: "renderedToSource",
    value: function renderedToSource(index) {
      return this.offsetted(index);
    }

    /**
     * @param index
     * @returns {Number}
     */

  }, {
    key: "sourceToRendered",
    value: function sourceToRendered(index) {
      return this.unOffsetted(index);
    }

    /**
     * @param index
     * @returns {Number}
     */

  }, {
    key: "offsettedTH",
    value: function offsettedTH(index) {
      return index - this.countTH;
    }

    /**
     * @param index
     * @returns {Number}
     */

  }, {
    key: "unOffsettedTH",
    value: function unOffsettedTH(index) {
      return index + this.countTH;
    }

    /**
     * @param index
     * @returns {Number}
     */

  }, {
    key: "visibleColHeadedRowToSourceRow",
    value: function visibleColHeadedRowToSourceRow(index) {
      return this.renderedToSource(this.offsettedTH(index));
    }

    /**
     * @param index
     * @returns {Number}
     */

  }, {
    key: "sourceRowToVisibleColHeadedRow",
    value: function sourceRowToVisibleColHeadedRow(index) {
      return this.unOffsettedTH(this.sourceToRendered(index));
    }
  }]);

  return RowFilter;
}();

exports.default = RowFilter;