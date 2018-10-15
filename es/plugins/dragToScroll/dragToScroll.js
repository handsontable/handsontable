var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import BasePlugin from './../_base';
import EventManager from './../../eventManager';
import { registerPlugin } from './../../plugins';

/**
 * @description
 * Plugin used to scroll Handsontable by selecting a cell and dragging outside of the visible viewport.
 *
 *
 * @class DragToScroll
 * @plugin DragToScroll
 */

var DragToScroll = function (_BasePlugin) {
  _inherits(DragToScroll, _BasePlugin);

  function DragToScroll(hotInstance) {
    _classCallCheck(this, DragToScroll);

    /**
     * Instance of {@link EventManager}.
     *
     * @private
     * @type {EventManager}
     */
    var _this = _possibleConstructorReturn(this, (DragToScroll.__proto__ || Object.getPrototypeOf(DragToScroll)).call(this, hotInstance));

    _this.eventManager = new EventManager(_this);
    /**
     * Size of an element and its position relative to the viewport,
     * e.g. {bottom: 449, height: 441, left: 8, right: 814, top: 8, width: 806, x: 8, y:8}.
     *
     * @type {DOMRect}
     */
    _this.boundaries = null;
    /**
     * Callback function.
     *
     * @private
     * @type {Function}
     */
    _this.callback = null;
    /**
     * Flag indicates mouseDown/mouseUp.
     *
     * @private
     * @type {Boolean}
     */
    _this.listening = false;
    return _this;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link DragToScroll#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */


  _createClass(DragToScroll, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return !!this.hot.getSettings().dragToScroll;
    }

    /**
     * Enables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'enablePlugin',
    value: function enablePlugin() {
      var _this2 = this;

      if (this.enabled) {
        return;
      }

      this.addHook('afterOnCellMouseDown', function () {
        return _this2.setupListening();
      });
      this.addHook('afterOnCellCornerMouseDown', function () {
        return _this2.setupListening();
      });

      this.registerEvents();

      _get(DragToScroll.prototype.__proto__ || Object.getPrototypeOf(DragToScroll.prototype), 'enablePlugin', this).call(this);
    }

    /**
     * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
     */

  }, {
    key: 'updatePlugin',
    value: function updatePlugin() {
      this.disablePlugin();
      this.enablePlugin();

      _get(DragToScroll.prototype.__proto__ || Object.getPrototypeOf(DragToScroll.prototype), 'updatePlugin', this).call(this);
    }

    /**
     * Disables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      this.unregisterEvents();

      _get(DragToScroll.prototype.__proto__ || Object.getPrototypeOf(DragToScroll.prototype), 'disablePlugin', this).call(this);
    }

    /**
     * Sets the value of the visible element.
     *
     * @param boundaries {DOMRect} An object with coordinates compatible with DOMRect.
     */

  }, {
    key: 'setBoundaries',
    value: function setBoundaries(boundaries) {
      this.boundaries = boundaries;
    }

    /**
     * Changes callback function.
     *
     * @param callback {Function}
     */

  }, {
    key: 'setCallback',
    value: function setCallback(callback) {
      this.callback = callback;
    }

    /**
     * Checks if the mouse position (X, Y) is outside of the viewport and fires a callback with calculated X an Y diffs
     * between passed boundaries.
     *
     * @param {Number} x Mouse X coordinate to check.
     * @param {Number} y Mouse Y coordinate to check.
     */

  }, {
    key: 'check',
    value: function check(x, y) {
      var diffX = 0;
      var diffY = 0;

      if (y < this.boundaries.top) {
        // y is less than top
        diffY = y - this.boundaries.top;
      } else if (y > this.boundaries.bottom) {
        // y is more than bottom
        diffY = y - this.boundaries.bottom;
      }

      if (x < this.boundaries.left) {
        // x is less than left
        diffX = x - this.boundaries.left;
      } else if (x > this.boundaries.right) {
        // x is more than right
        diffX = x - this.boundaries.right;
      }

      this.callback(diffX, diffY);
    }

    /**
     * Registers dom listeners.
     *
     * @private
     */

  }, {
    key: 'registerEvents',
    value: function registerEvents() {
      var _this3 = this;

      this.eventManager.addEventListener(document, 'mouseup', function () {
        return _this3.onMouseUp();
      });
      this.eventManager.addEventListener(document, 'mousemove', function (event) {
        return _this3.onMouseMove(event);
      });
    }

    /**
     * Unbinds the events used by the plugin.
     *
     * @private
     */

  }, {
    key: 'unregisterEvents',
    value: function unregisterEvents() {
      this.eventManager.clear();
    }

    /**
     * On after on cell/cellCorner mouse down listener.
     *
     * @private
     */

  }, {
    key: 'setupListening',
    value: function setupListening() {
      var scrollHandler = this.hot.view.wt.wtTable.holder; // native scroll

      if (scrollHandler === window) {
        // not much we can do currently
        return;
      }

      this.setBoundaries(scrollHandler.getBoundingClientRect());
      this.setCallback(function (scrollX, scrollY) {
        if (scrollX < 0) {
          scrollHandler.scrollLeft -= 50;
        } else if (scrollX > 0) {
          scrollHandler.scrollLeft += 50;
        }

        if (scrollY < 0) {
          scrollHandler.scrollTop -= 20;
        } else if (scrollY > 0) {
          scrollHandler.scrollTop += 20;
        }
      });

      this.listening = true;
    }

    /**
     * 'mouseMove' event callback.
     *
     * @private
     * @param {MouseEvent} event `mousemove` event properties.
     */

  }, {
    key: 'onMouseMove',
    value: function onMouseMove(event) {
      if (this.listening) {
        this.check(event.clientX, event.clientY);
      }
    }

    /**
     * `onMouseUp` hook callback.
     *
     * @private
     */

  }, {
    key: 'onMouseUp',
    value: function onMouseUp() {
      this.listening = false;
    }

    /**
     * Destroys the plugin instance.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      _get(DragToScroll.prototype.__proto__ || Object.getPrototypeOf(DragToScroll.prototype), 'destroy', this).call(this);
    }
  }]);

  return DragToScroll;
}(BasePlugin);

registerPlugin('dragToScroll', DragToScroll);

export default DragToScroll;