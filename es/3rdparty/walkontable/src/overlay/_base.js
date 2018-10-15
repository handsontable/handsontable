var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { getScrollableElement, getTrimmingContainer } from './../../../../helpers/dom/element';
import { defineGetter } from './../../../../helpers/object';
import { arrayEach } from './../../../../helpers/array';
import EventManager from './../../../../eventManager';
import Walkontable from './../core';

var registeredOverlays = {};

/**
 * Creates an overlay over the original Walkontable instance. The overlay renders the clone of the original Walkontable
 * and (optionally) implements behavior needed for native horizontal and vertical scrolling.
 *
 * @class Overlay
 */

var Overlay = function () {
  _createClass(Overlay, null, [{
    key: 'registerOverlay',


    /**
     * Register overlay class.
     *
     * @param {String} type Overlay type, one of the CLONE_TYPES value
     * @param {Overlay} overlayClass Overlay class extended from base overlay class {@link Overlay}
     */
    value: function registerOverlay(type, overlayClass) {
      if (Overlay.CLONE_TYPES.indexOf(type) === -1) {
        throw new Error('Unsupported overlay (' + type + ').');
      }
      registeredOverlays[type] = overlayClass;
    }

    /**
     * Create new instance of overlay type.
     *
     * @param {String} type Overlay type, one of the CLONE_TYPES value
     * @param {Walkontable} wot Walkontable instance
     */

  }, {
    key: 'createOverlay',
    value: function createOverlay(type, wot) {
      return new registeredOverlays[type](wot);
    }

    /**
     * Check if specified overlay was registered.
     *
     * @param {String} type Overlay type, one of the CLONE_TYPES value
     * @returns {Boolean}
     */

  }, {
    key: 'hasOverlay',
    value: function hasOverlay(type) {
      return registeredOverlays[type] !== void 0;
    }

    /**
     * Checks if overlay object (`overlay`) is instance of overlay type (`type`).
     *
     * @param {Overlay} overlay Overlay object
     * @param {String} type Overlay type, one of the CLONE_TYPES value
     * @returns {Boolean}
     */

  }, {
    key: 'isOverlayTypeOf',
    value: function isOverlayTypeOf(overlay, type) {
      if (!overlay || !registeredOverlays[type]) {
        return false;
      }

      return overlay instanceof registeredOverlays[type];
    }

    /**
     * @param {Walkontable} wotInstance
     */

  }, {
    key: 'CLONE_TOP',

    /**
     * @type {String}
     */
    get: function get() {
      return 'top';
    }

    /**
     * @type {String}
     */

  }, {
    key: 'CLONE_BOTTOM',
    get: function get() {
      return 'bottom';
    }

    /**
     * @type {String}
     */

  }, {
    key: 'CLONE_LEFT',
    get: function get() {
      return 'left';
    }

    /**
     * @type {String}
     */

  }, {
    key: 'CLONE_TOP_LEFT_CORNER',
    get: function get() {
      return 'top_left_corner';
    }

    /**
     * @type {String}
     */

  }, {
    key: 'CLONE_BOTTOM_LEFT_CORNER',
    get: function get() {
      return 'bottom_left_corner';
    }

    /**
     * @type {String}
     */

  }, {
    key: 'CLONE_DEBUG',
    get: function get() {
      return 'debug';
    }

    /**
     * List of all availables clone types
     *
     * @type {Array}
     */

  }, {
    key: 'CLONE_TYPES',
    get: function get() {
      return [Overlay.CLONE_TOP, Overlay.CLONE_BOTTOM, Overlay.CLONE_LEFT, Overlay.CLONE_TOP_LEFT_CORNER, Overlay.CLONE_BOTTOM_LEFT_CORNER, Overlay.CLONE_DEBUG];
    }
  }]);

  function Overlay(wotInstance) {
    _classCallCheck(this, Overlay);

    defineGetter(this, 'wot', wotInstance, {
      writable: false
    });

    // legacy support, deprecated in the future
    this.instance = this.wot;

    this.type = '';
    this.mainTableScrollableElement = null;
    this.TABLE = this.wot.wtTable.TABLE;
    this.hider = this.wot.wtTable.hider;
    this.spreader = this.wot.wtTable.spreader;
    this.holder = this.wot.wtTable.holder;
    this.wtRootElement = this.wot.wtTable.wtRootElement;
    this.trimmingContainer = getTrimmingContainer(this.hider.parentNode.parentNode);
    this.areElementSizesAdjusted = false;
    this.updateStateOfRendering();
  }

  /**
   * Update internal state of object with an information about the need of full rendering of the overlay.
   *
   * @returns {Boolean} Returns `true` if the state has changed since the last check.
   */


  _createClass(Overlay, [{
    key: 'updateStateOfRendering',
    value: function updateStateOfRendering() {
      var previousState = this.needFullRender;

      this.needFullRender = this.shouldBeRendered();

      var changed = previousState !== this.needFullRender;

      if (changed && !this.needFullRender) {
        this.reset();
      }

      return changed;
    }

    /**
     * Checks if overlay should be fully rendered
     *
     * @returns {Boolean}
     */

  }, {
    key: 'shouldBeRendered',
    value: function shouldBeRendered() {
      return true;
    }

    /**
     * Update the trimming container.
     */

  }, {
    key: 'updateTrimmingContainer',
    value: function updateTrimmingContainer() {
      this.trimmingContainer = getTrimmingContainer(this.hider.parentNode.parentNode);
    }

    /**
     * Update the main scrollable element.
     */

  }, {
    key: 'updateMainScrollableElement',
    value: function updateMainScrollableElement() {
      this.mainTableScrollableElement = getScrollableElement(this.wot.wtTable.TABLE);
    }

    /**
     * Make a clone of table for overlay
     *
     * @param {String} direction Can be `Overlay.CLONE_TOP`, `Overlay.CLONE_LEFT`,
     *                           `Overlay.CLONE_TOP_LEFT_CORNER`, `Overlay.CLONE_DEBUG`
     * @returns {Walkontable}
     */

  }, {
    key: 'makeClone',
    value: function makeClone(direction) {
      if (Overlay.CLONE_TYPES.indexOf(direction) === -1) {
        throw new Error('Clone type "' + direction + '" is not supported.');
      }
      var clone = document.createElement('DIV');
      var clonedTable = document.createElement('TABLE');

      clone.className = 'ht_clone_' + direction + ' handsontable';
      clone.style.position = 'absolute';
      clone.style.top = 0;
      clone.style.left = 0;
      clone.style.overflow = 'hidden';

      clonedTable.className = this.wot.wtTable.TABLE.className;
      clone.appendChild(clonedTable);

      this.type = direction;
      this.wot.wtTable.wtRootElement.parentNode.appendChild(clone);

      var preventOverflow = this.wot.getSetting('preventOverflow');

      if (preventOverflow === true || preventOverflow === 'horizontal' && this.type === Overlay.CLONE_TOP || preventOverflow === 'vertical' && this.type === Overlay.CLONE_LEFT) {
        this.mainTableScrollableElement = window;
      } else {
        this.mainTableScrollableElement = getScrollableElement(this.wot.wtTable.TABLE);
      }

      return new Walkontable({
        cloneSource: this.wot,
        cloneOverlay: this,
        table: clonedTable
      });
    }

    /**
     * Refresh/Redraw overlay
     *
     * @param {Boolean} [fastDraw=false]
     */

  }, {
    key: 'refresh',
    value: function refresh() {
      var fastDraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      // When hot settings are changed we allow to refresh overlay once before blocking
      var nextCycleRenderFlag = this.shouldBeRendered();

      if (this.clone && (this.needFullRender || nextCycleRenderFlag)) {
        this.clone.draw(fastDraw);
      }
      this.needFullRender = nextCycleRenderFlag;
    }

    /**
     * Reset overlay styles to initial values.
     */

  }, {
    key: 'reset',
    value: function reset() {
      if (!this.clone) {
        return;
      }
      var holder = this.clone.wtTable.holder;
      var hider = this.clone.wtTable.hider;
      var holderStyle = holder.style;
      var hidderStyle = hider.style;
      var rootStyle = holder.parentNode.style;

      arrayEach([holderStyle, hidderStyle, rootStyle], function (style) {
        style.width = '';
        style.height = '';
      });
    }

    /**
     * Destroy overlay instance
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      new EventManager(this.clone).destroy();
    }
  }]);

  return Overlay;
}();

export default Overlay;