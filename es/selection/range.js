var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { CellRange } from './../3rdparty/walkontable/src';

/**
 * The SelectionRange class is a simple CellRanges collection designed for easy manipulation of the multiple
 * consecutive and non-consecutive selections.
 *
 * @class SelectionRange
 * @util
 */

var SelectionRange = function () {
  function SelectionRange() {
    _classCallCheck(this, SelectionRange);

    /**
     * List of all CellRanges added to the class instance.
     *
     * @type {CellRange[]}
     */
    this.ranges = [];
  }

  /**
   * Check if selected range is empty.
   *
   * @return {Boolean}
   */


  _createClass(SelectionRange, [{
    key: 'isEmpty',
    value: function isEmpty() {
      return this.size() === 0;
    }

    /**
     * Set coordinates to the class instance. It clears all previously added coordinates and push `coords`
     * to the collection.
     *
     * @param {CellCoords} coords The CellCoords instance with defined visual coordinates.
     * @returns {SelectionRange}
     */

  }, {
    key: 'set',
    value: function set(coords) {
      this.clear();
      this.ranges.push(new CellRange(coords));

      return this;
    }

    /**
     * Add coordinates to the class instance. The new coordinates are added to the end of the range collection.
     *
     * @param {CellCoords} coords The CellCoords instance with defined visual coordinates.
     * @returns {SelectionRange}
     */

  }, {
    key: 'add',
    value: function add(coords) {
      this.ranges.push(new CellRange(coords));

      return this;
    }

    /**
     * Get last added coordinates from ranges, it returns a CellRange instance.
     *
     * @return {CellRange|undefined}
     */

  }, {
    key: 'current',
    value: function current() {
      return this.peekByIndex(0);
    }

    /**
     * Get previously added coordinates from ranges, it returns a CellRange instance.
     *
     * @return {CellRange|undefined}
     */

  }, {
    key: 'previous',
    value: function previous() {
      return this.peekByIndex(-1);
    }

    /**
     * Returns `true` if coords is within selection coords. This method iterates through all selection layers to check if
     * the coords object is within selection range.
     *
     * @param {CellCoords} coords The CellCoords instance with defined visual coordinates.
     * @returns {Boolean}
     */

  }, {
    key: 'includes',
    value: function includes(coords) {
      return this.ranges.some(function (cellRange) {
        return cellRange.includes(coords);
      });
    }

    /**
     * Clear collection.
     *
     * @return {SelectionRange}
     */

  }, {
    key: 'clear',
    value: function clear() {
      this.ranges.length = 0;

      return this;
    }

    /**
     * Get count of added all coordinates added to the selection.
     *
     * @return {Number}
     */

  }, {
    key: 'size',
    value: function size() {
      return this.ranges.length;
    }

    /**
     * Peek the coordinates based on the offset where that coordinate resides in the collection.
     *
     * @param {Number} [offset=0] An offset where the coordinate will be retrieved from.
     * @return {CellRange|undefined}
     */

  }, {
    key: 'peekByIndex',
    value: function peekByIndex() {
      var offset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      var rangeIndex = this.size() + offset - 1;
      var cellRange = void 0;

      if (rangeIndex >= 0) {
        cellRange = this.ranges[rangeIndex];
      }

      return cellRange;
    }
  }, {
    key: Symbol.iterator,
    value: function value() {
      return this.ranges[Symbol.iterator]();
    }
  }]);

  return SelectionRange;
}();

export default SelectionRange;