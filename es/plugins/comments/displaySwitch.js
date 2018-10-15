var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { debounce } from '../../helpers/function';
import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';

var DEFAULT_DISPLAY_DELAY = 250;
var DEFAULT_HIDE_DELAY = 250;

/**
 * Display switch for the Comments plugin. Manages the time of delayed displaying / hiding comments.
 *
 * @class DisplaySwitch
 * @plugin Comments
 */

var DisplaySwitch = function () {
  function DisplaySwitch(displayDelay) {
    _classCallCheck(this, DisplaySwitch);

    /**
     * Flag to determine if comment can be showed or hidden. State `true` mean that last performed action
     * was an attempt to show comment element. State `false` mean that it was attempt to hide comment element.
     *
     * @type {Boolean}
     */
    this.wasLastActionShow = true;
    /**
     * Show comment after predefined delay. It keeps reference to immutable `debounce` function.
     *
     * @type {Function}
     */
    this.showDebounced = null;
    /**
     * Reference to timer, run by `setTimeout`, which is hiding comment
     *
     * @type {Number}
     */
    this.hidingTimer = null;

    this.updateDelay(displayDelay);
  }

  /**
   * Responsible for hiding comment after proper delay.
   */


  _createClass(DisplaySwitch, [{
    key: 'hide',
    value: function hide() {
      var _this = this;

      this.wasLastActionShow = false;

      this.hidingTimer = setTimeout(function () {
        if (_this.wasLastActionShow === false) {
          _this.runLocalHooks('hide');
        }
      }, DEFAULT_HIDE_DELAY);
    }

    /**
     * Responsible for showing comment after proper delay.
     *
     * @param {Object} range Coordinates of selected cell.
     */

  }, {
    key: 'show',
    value: function show(range) {
      this.wasLastActionShow = true;
      this.showDebounced(range);
    }

    /**
     * Cancel hiding comment.
     */

  }, {
    key: 'cancelHiding',
    value: function cancelHiding() {
      this.wasLastActionShow = true;

      clearTimeout(this.hidingTimer);
      this.hidingTimer = null;
    }

    /**
     * Update the switch settings.
     *
     * @param {Number} displayDelay Delay of showing the comments (in milliseconds).
     */

  }, {
    key: 'updateDelay',
    value: function updateDelay() {
      var _this2 = this;

      var displayDelay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_DISPLAY_DELAY;

      this.showDebounced = debounce(function (range) {
        if (_this2.wasLastActionShow) {
          _this2.runLocalHooks('show', range.from.row, range.from.col);
        }
      }, displayDelay);
    }

    /**
     * Destroy the switcher.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.clearLocalHooks();
    }
  }]);

  return DisplaySwitch;
}();

mixin(DisplaySwitch, localHooks);

export default DisplaySwitch;