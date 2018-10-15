var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { isNumeric } from './../../../helpers/number';

var STATE_INITIALIZED = 0;
var STATE_BUILT = 1;
var STATE_APPENDED = 2;
var UNIT = 'px';

/**
 * @class
 * @private
 */

var BaseUI = function () {
  function BaseUI(hotInstance) {
    _classCallCheck(this, BaseUI);

    /**
     * Instance of Handsontable.
     *
     * @type {Core}
     */
    this.hot = hotInstance;
    /**
     * DOM element representing the ui element.
     *
     * @type {HTMLElement}
     * @private
     */
    this._element = null;
    /**
     * Flag which determines build state of element.
     *
     * @type {Boolean}
     */
    this.state = STATE_INITIALIZED;
  }

  /**
   * Add created UI elements to table.
   *
   * @param {HTMLElement} wrapper Element which are parent for our UI element.
   */


  _createClass(BaseUI, [{
    key: 'appendTo',
    value: function appendTo(wrapper) {
      wrapper.appendChild(this._element);

      this.state = STATE_APPENDED;
    }

    /**
     * Method for create UI element. Only create, without append to table.
     */

  }, {
    key: 'build',
    value: function build() {
      this._element = document.createElement('div');
      this.state = STATE_BUILT;
    }

    /**
     * Method for remove UI element.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      if (this.isAppended()) {
        this._element.parentElement.removeChild(this._element);
      }

      this._element = null;
      this.state = STATE_INITIALIZED;
    }

    /**
     * Check if UI element are appended.
     *
     * @returns {Boolean}
     */

  }, {
    key: 'isAppended',
    value: function isAppended() {
      return this.state === STATE_APPENDED;
    }

    /**
     * Check if UI element are built.
     *
     * @returns {Boolean}
     */

  }, {
    key: 'isBuilt',
    value: function isBuilt() {
      return this.state >= STATE_BUILT;
    }

    /**
     * Setter for position.
     *
     * @param {Number} top New top position of the element.
     * @param {Number} left New left position of the element.
     */

  }, {
    key: 'setPosition',
    value: function setPosition(top, left) {
      if (isNumeric(top)) {
        this._element.style.top = top + UNIT;
      }
      if (isNumeric(left)) {
        this._element.style.left = left + UNIT;
      }
    }

    /**
     * Getter for the element position.
     *
     * @returns {Object} Object contains left and top position of the element.
     */

  }, {
    key: 'getPosition',
    value: function getPosition() {
      return {
        top: this._element.style.top ? parseInt(this._element.style.top, 10) : 0,
        left: this._element.style.left ? parseInt(this._element.style.left, 10) : 0
      };
    }

    /**
     * Setter for the element size.
     *
     * @param {Number} width New width of the element.
     * @param {Number} height New height of the element.
     */

  }, {
    key: 'setSize',
    value: function setSize(width, height) {
      if (isNumeric(width)) {
        this._element.style.width = width + UNIT;
      }
      if (isNumeric(height)) {
        this._element.style.height = height + UNIT;
      }
    }

    /**
     * Getter for the element position.
     *
     * @returns {Object} Object contains height and width of the element.
     */

  }, {
    key: 'getSize',
    value: function getSize() {
      return {
        width: this._element.style.width ? parseInt(this._element.style.width, 10) : 0,
        height: this._element.style.height ? parseInt(this._element.style.height, 10) : 0
      };
    }

    /**
     * Setter for the element offset. Offset means marginTop and marginLeft of the element.
     *
     * @param {Number} top New margin top of the element.
     * @param {Number} left New margin left of the element.
     */

  }, {
    key: 'setOffset',
    value: function setOffset(top, left) {
      if (isNumeric(top)) {
        this._element.style.marginTop = top + UNIT;
      }
      if (isNumeric(left)) {
        this._element.style.marginLeft = left + UNIT;
      }
    }

    /**
     * Getter for the element offset.
     *
     * @returns {Object} Object contains top and left offset of the element.
     */

  }, {
    key: 'getOffset',
    value: function getOffset() {
      return {
        top: this._element.style.marginTop ? parseInt(this._element.style.marginTop, 10) : 0,
        left: this._element.style.marginLeft ? parseInt(this._element.style.marginLeft, 10) : 0
      };
    }
  }]);

  return BaseUI;
}();

export default BaseUI;