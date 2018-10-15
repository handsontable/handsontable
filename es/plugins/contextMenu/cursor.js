var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { getWindowScrollLeft, getWindowScrollTop } from './../../helpers/dom/element';
import { pageX, pageY } from './../../helpers/dom/event';

/**
 * Helper class for checking if element will fit at the desired side of cursor.
 *
 * @class Cursor
 * @plugin ContextMenu
 */

var Cursor = function () {
  function Cursor(object) {
    _classCallCheck(this, Cursor);

    var windowScrollTop = getWindowScrollTop();
    var windowScrollLeft = getWindowScrollLeft();
    var top = void 0;
    var topRelative = void 0;
    var left = void 0;
    var leftRelative = void 0;
    var cellHeight = void 0;
    var cellWidth = void 0;

    this.type = this.getSourceType(object);

    if (this.type === 'literal') {
      top = parseInt(object.top, 10);
      left = parseInt(object.left, 10);
      cellHeight = object.height || 0;
      cellWidth = object.width || 0;
      topRelative = top;
      leftRelative = left;
      top += windowScrollTop;
      left += windowScrollLeft;
    } else if (this.type === 'event') {
      top = parseInt(pageY(object), 10);
      left = parseInt(pageX(object), 10);
      cellHeight = object.target.clientHeight;
      cellWidth = object.target.clientWidth;
      topRelative = top - windowScrollTop;
      leftRelative = left - windowScrollLeft;
    }

    this.top = top;
    this.topRelative = topRelative;
    this.left = left;
    this.leftRelative = leftRelative;
    this.scrollTop = windowScrollTop;
    this.scrollLeft = windowScrollLeft;
    this.cellHeight = cellHeight;
    this.cellWidth = cellWidth;
  }

  /**
   * Get source type name.
   *
   * @param {*} object Event or Object with coordinates.
   * @returns {String} Returns one of this values: `'literal'`, `'event'`.
   */


  _createClass(Cursor, [{
    key: 'getSourceType',
    value: function getSourceType(object) {
      var type = 'literal';

      if (object instanceof Event) {
        type = 'event';
      }

      return type;
    }

    /**
     * Checks if element can be placed above the cursor.
     *
     * @param {HTMLElement} element Element to check if it's size will fit above the cursor.
     * @returns {Boolean}
     */

  }, {
    key: 'fitsAbove',
    value: function fitsAbove(element) {
      return this.topRelative >= element.offsetHeight;
    }

    /**
     * Checks if element can be placed below the cursor.
     *
     * @param {HTMLElement} element Element to check if it's size will fit below the cursor.
     * @param {Number} [viewportHeight] The viewport height.
     * @returns {Boolean}
     */

  }, {
    key: 'fitsBelow',
    value: function fitsBelow(element) {
      var viewportHeight = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.innerHeight;

      return this.topRelative + element.offsetHeight <= viewportHeight;
    }

    /**
     * Checks if element can be placed on the right of the cursor.
     *
     * @param {HTMLElement} element Element to check if it's size will fit on the right of the cursor.
     * @param {Number} [viewportWidth] The viewport width.
     * @returns {Boolean}
     */

  }, {
    key: 'fitsOnRight',
    value: function fitsOnRight(element) {
      var viewportWidth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.innerWidth;

      return this.leftRelative + this.cellWidth + element.offsetWidth <= viewportWidth;
    }

    /**
     * Checks if element can be placed on the left on the cursor.
     *
     * @param {HTMLElement} element Element to check if it's size will fit on the left of the cursor.
     * @returns {Boolean}
     */

  }, {
    key: 'fitsOnLeft',
    value: function fitsOnLeft(element) {
      return this.leftRelative >= element.offsetWidth;
    }
  }]);

  return Cursor;
}();

export default Cursor;