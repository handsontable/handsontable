var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { getScrollableElement, getScrollbarWidth } from './../../../helpers/dom/element';
import { arrayEach } from './../../../helpers/array';
import { isKey } from './../../../helpers/unicode';
import { isChrome } from './../../../helpers/browser';
import EventManager from './../../../eventManager';
import Overlay from './overlay/_base';

/**
 * @class Overlays
 */

var Overlays = function () {
  /**
   * @param {Walkontable} wotInstance
   */
  function Overlays(wotInstance) {
    _classCallCheck(this, Overlays);

    /**
     * Sometimes `line-height` might be set to 'normal'. In that case, a default `font-size` should be multiplied by roughly 1.2.
     * https://developer.mozilla.org/pl/docs/Web/CSS/line-height#Values
     */
    var BODY_LINE_HEIGHT = parseInt(getComputedStyle(document.body).lineHeight, 10);
    var FALLBACK_BODY_LINE_HEIGHT = parseInt(getComputedStyle(document.body).fontSize, 10) * 1.2;

    this.wot = wotInstance;

    // legacy support
    this.instance = this.wot;
    this.eventManager = new EventManager(this.wot);

    this.wot.update('scrollbarWidth', getScrollbarWidth());
    this.wot.update('scrollbarHeight', getScrollbarWidth());

    this.scrollableElement = getScrollableElement(this.wot.wtTable.TABLE);

    this.prepareOverlays();

    this.destroyed = false;
    this.keyPressed = false;
    this.spreaderLastSize = {
      width: null,
      height: null
    };
    this.overlayScrollPositions = {
      master: {
        top: 0,
        left: 0
      },
      top: {
        top: null,
        left: 0
      },
      bottom: {
        top: null,
        left: 0
      },
      left: {
        top: 0,
        left: null
      }
    };

    this.pendingScrollCallbacks = {
      master: {
        top: 0,
        left: 0
      },
      top: {
        left: 0
      },
      bottom: {
        left: 0
      },
      left: {
        top: 0
      }
    };

    this.verticalScrolling = false;
    this.horizontalScrolling = false;
    this.delegatedScrollCallback = false;

    this.registeredListeners = [];

    this.browserLineHeight = BODY_LINE_HEIGHT || FALLBACK_BODY_LINE_HEIGHT;

    this.registerListeners();
  }

  /**
   * Prepare overlays based on user settings.
   *
   * @returns {Boolean} Returns `true` if changes applied to overlay needs scroll synchronization.
   */


  _createClass(Overlays, [{
    key: 'prepareOverlays',
    value: function prepareOverlays() {
      var syncScroll = false;

      if (this.topOverlay) {
        syncScroll = this.topOverlay.updateStateOfRendering() || syncScroll;
      } else {
        this.topOverlay = Overlay.createOverlay(Overlay.CLONE_TOP, this.wot);
      }

      if (!Overlay.hasOverlay(Overlay.CLONE_BOTTOM)) {
        this.bottomOverlay = {
          needFullRender: false,
          updateStateOfRendering: function updateStateOfRendering() {
            return false;
          }
        };
      }
      if (!Overlay.hasOverlay(Overlay.CLONE_BOTTOM_LEFT_CORNER)) {
        this.bottomLeftCornerOverlay = {
          needFullRender: false,
          updateStateOfRendering: function updateStateOfRendering() {
            return false;
          }
        };
      }

      if (this.bottomOverlay) {
        syncScroll = this.bottomOverlay.updateStateOfRendering() || syncScroll;
      } else {
        this.bottomOverlay = Overlay.createOverlay(Overlay.CLONE_BOTTOM, this.wot);
      }

      if (this.leftOverlay) {
        syncScroll = this.leftOverlay.updateStateOfRendering() || syncScroll;
      } else {
        this.leftOverlay = Overlay.createOverlay(Overlay.CLONE_LEFT, this.wot);
      }

      if (this.topOverlay.needFullRender && this.leftOverlay.needFullRender) {
        if (this.topLeftCornerOverlay) {
          syncScroll = this.topLeftCornerOverlay.updateStateOfRendering() || syncScroll;
        } else {
          this.topLeftCornerOverlay = Overlay.createOverlay(Overlay.CLONE_TOP_LEFT_CORNER, this.wot);
        }
      }

      if (this.bottomOverlay.needFullRender && this.leftOverlay.needFullRender) {
        if (this.bottomLeftCornerOverlay) {
          syncScroll = this.bottomLeftCornerOverlay.updateStateOfRendering() || syncScroll;
        } else {
          this.bottomLeftCornerOverlay = Overlay.createOverlay(Overlay.CLONE_BOTTOM_LEFT_CORNER, this.wot);
        }
      }

      if (this.wot.getSetting('debug') && !this.debug) {
        this.debug = Overlay.createOverlay(Overlay.CLONE_DEBUG, this.wot);
      }

      return syncScroll;
    }

    /**
     * Refresh and redraw table
     */

  }, {
    key: 'refreshAll',
    value: function refreshAll() {
      if (!this.wot.drawn) {
        return;
      }
      if (!this.wot.wtTable.holder.parentNode) {
        // Walkontable was detached from DOM, but this handler was not removed
        this.destroy();

        return;
      }
      this.wot.draw(true);

      if (this.verticalScrolling) {
        this.leftOverlay.onScroll();
      }

      if (this.horizontalScrolling) {
        this.topOverlay.onScroll();
      }

      this.verticalScrolling = false;
      this.horizontalScrolling = false;
    }

    /**
     * Register all necessary event listeners.
     */

  }, {
    key: 'registerListeners',
    value: function registerListeners() {
      var _this = this;

      var topOverlayScrollable = this.topOverlay.mainTableScrollableElement;
      var leftOverlayScrollable = this.leftOverlay.mainTableScrollableElement;

      var listenersToRegister = [];
      listenersToRegister.push([document.documentElement, 'keydown', function (event) {
        return _this.onKeyDown(event);
      }]);
      listenersToRegister.push([document.documentElement, 'keyup', function () {
        return _this.onKeyUp();
      }]);
      listenersToRegister.push([document, 'visibilitychange', function () {
        return _this.onKeyUp();
      }]);
      listenersToRegister.push([topOverlayScrollable, 'scroll', function (event) {
        return _this.onTableScroll(event);
      }]);

      if (topOverlayScrollable !== leftOverlayScrollable) {
        listenersToRegister.push([leftOverlayScrollable, 'scroll', function (event) {
          return _this.onTableScroll(event);
        }]);
      }

      var isHighPixelRatio = window.devicePixelRatio && window.devicePixelRatio > 1;

      if (isHighPixelRatio || !isChrome()) {
        listenersToRegister.push([this.instance.wtTable.wtRootElement.parentNode, 'wheel', function (event) {
          return _this.onCloneWheel(event);
        }]);
      } else {
        if (this.topOverlay.needFullRender) {
          listenersToRegister.push([this.topOverlay.clone.wtTable.holder, 'wheel', function (event) {
            return _this.onCloneWheel(event);
          }]);
        }

        if (this.bottomOverlay.needFullRender) {
          listenersToRegister.push([this.bottomOverlay.clone.wtTable.holder, 'wheel', function (event) {
            return _this.onCloneWheel(event);
          }]);
        }

        if (this.leftOverlay.needFullRender) {
          listenersToRegister.push([this.leftOverlay.clone.wtTable.holder, 'wheel', function (event) {
            return _this.onCloneWheel(event);
          }]);
        }

        if (this.topLeftCornerOverlay && this.topLeftCornerOverlay.needFullRender) {
          listenersToRegister.push([this.topLeftCornerOverlay.clone.wtTable.holder, 'wheel', function (event) {
            return _this.onCloneWheel(event);
          }]);
        }

        if (this.bottomLeftCornerOverlay && this.bottomLeftCornerOverlay.needFullRender) {
          listenersToRegister.push([this.bottomLeftCornerOverlay.clone.wtTable.holder, 'wheel', function (event) {
            return _this.onCloneWheel(event);
          }]);
        }
      }

      if (this.topOverlay.trimmingContainer !== window && this.leftOverlay.trimmingContainer !== window) {
        // This is necessary?
        // eventManager.addEventListener(window, 'scroll', (event) => this.refreshAll(event));
        listenersToRegister.push([window, 'wheel', function (event) {
          var overlay = void 0;
          var deltaY = event.wheelDeltaY || event.deltaY;
          var deltaX = event.wheelDeltaX || event.deltaX;

          if (_this.topOverlay.clone.wtTable.holder.contains(event.realTarget)) {
            overlay = 'top';
          } else if (_this.bottomOverlay.clone && _this.bottomOverlay.clone.wtTable.holder.contains(event.realTarget)) {
            overlay = 'bottom';
          } else if (_this.leftOverlay.clone.wtTable.holder.contains(event.realTarget)) {
            overlay = 'left';
          } else if (_this.topLeftCornerOverlay && _this.topLeftCornerOverlay.clone && _this.topLeftCornerOverlay.clone.wtTable.holder.contains(event.realTarget)) {
            overlay = 'topLeft';
          } else if (_this.bottomLeftCornerOverlay && _this.bottomLeftCornerOverlay.clone && _this.bottomLeftCornerOverlay.clone.wtTable.holder.contains(event.realTarget)) {
            overlay = 'bottomLeft';
          }

          if (overlay === 'top' && deltaY !== 0 || overlay === 'left' && deltaX !== 0 || overlay === 'bottom' && deltaY !== 0 || (overlay === 'topLeft' || overlay === 'bottomLeft') && (deltaY !== 0 || deltaX !== 0)) {

            event.preventDefault();
          }
        }]);
      }

      while (listenersToRegister.length) {
        var listener = listenersToRegister.pop();
        this.eventManager.addEventListener(listener[0], listener[1], listener[2]);

        this.registeredListeners.push(listener);
      }
    }

    /**
     * Deregister all previously registered listeners.
     */

  }, {
    key: 'deregisterListeners',
    value: function deregisterListeners() {
      while (this.registeredListeners.length) {
        var listener = this.registeredListeners.pop();
        this.eventManager.removeEventListener(listener[0], listener[1], listener[2]);
      }
    }

    /**
     * Scroll listener
     *
     * @param {Event} event
     */

  }, {
    key: 'onTableScroll',
    value: function onTableScroll(event) {
      // There was if statement which controlled flow of this function. It avoided the execution of the next lines
      // on mobile devices. It was changed. Broader description of this case is included within issue #4856.

      var masterHorizontal = this.leftOverlay.mainTableScrollableElement;
      var masterVertical = this.topOverlay.mainTableScrollableElement;
      var target = event.target;

      // For key press, sync only master -> overlay position because while pressing Walkontable.render is triggered
      // by hot.refreshBorder
      if (this.keyPressed) {
        if (masterVertical !== window && target !== window && !event.target.contains(masterVertical) || masterHorizontal !== window && target !== window && !event.target.contains(masterHorizontal)) {
          return;
        }
      }

      this.syncScrollPositions(event);
    }

    /**
     * Wheel listener for cloned overlays.
     *
     * @param {Event} event
     */

  }, {
    key: 'onCloneWheel',
    value: function onCloneWheel(event) {
      if (this.scrollableElement !== window) {
        event.preventDefault();
      }
      // There was if statement which controlled flow of this function. It avoided the execution of the next lines
      // on mobile devices. It was changed. Broader description of this case is included within issue #4856.

      var masterHorizontal = this.leftOverlay.mainTableScrollableElement;
      var masterVertical = this.topOverlay.mainTableScrollableElement;
      var target = event.target;

      // For key press, sync only master -> overlay position because while pressing Walkontable.render is triggered
      // by hot.refreshBorder
      var shouldNotWheelVertically = masterVertical !== window && target !== window && !event.target.contains(masterVertical);
      var shouldNotWheelHorizontally = masterHorizontal !== window && target !== window && !event.target.contains(masterHorizontal);

      if (this.keyPressed && (shouldNotWheelVertically || shouldNotWheelHorizontally)) {
        return;
      }

      this.translateMouseWheelToScroll(event);
    }

    /**
     * Key down listener
     */

  }, {
    key: 'onKeyDown',
    value: function onKeyDown(event) {
      this.keyPressed = isKey(event.keyCode, 'ARROW_UP|ARROW_RIGHT|ARROW_DOWN|ARROW_LEFT');
    }

    /**
     * Key up listener
     */

  }, {
    key: 'onKeyUp',
    value: function onKeyUp() {
      this.keyPressed = false;
    }

    /**
     * Translate wheel event into scroll event and sync scroll overlays position
     *
     * @private
     * @param {Event} event
     * @returns {Boolean}
     */

  }, {
    key: 'translateMouseWheelToScroll',
    value: function translateMouseWheelToScroll(event) {
      var deltaY = isNaN(event.deltaY) ? -1 * event.wheelDeltaY : event.deltaY;
      var deltaX = isNaN(event.deltaX) ? -1 * event.wheelDeltaX : event.deltaX;

      if (event.deltaMode === 1) {
        deltaX += deltaX * this.browserLineHeight;
        deltaY += deltaY * this.browserLineHeight;
      }

      this.scrollVertically(deltaY);
      this.scrollHorizontally(deltaX);

      return false;
    }
  }, {
    key: 'scrollVertically',
    value: function scrollVertically(distance) {
      if (distance === 0) {
        return 0;
      }
      this.scrollableElement.scrollTop += distance;
    }
  }, {
    key: 'scrollHorizontally',
    value: function scrollHorizontally(distance) {
      if (distance === 0) {
        return 0;
      }
      this.scrollableElement.scrollLeft += distance;
    }

    /**
     * Synchronize scroll position between master table and overlay table.
     *
     * @private
     * @param {Event|Object} event
     */

  }, {
    key: 'syncScrollPositions',
    value: function syncScrollPositions() {
      if (this.destroyed) {
        return;
      }

      var topHolder = this.topOverlay.clone.wtTable.holder;
      var leftHolder = this.leftOverlay.clone.wtTable.holder;

      var _ref = [this.scrollableElement.scrollLeft, this.scrollableElement.scrollTop],
          scrollLeft = _ref[0],
          scrollTop = _ref[1];


      this.horizontalScrolling = topHolder.scrollLeft !== scrollLeft;
      this.verticalScrolling = leftHolder.scrollTop !== scrollTop;

      if (this.horizontalScrolling) {
        topHolder.scrollLeft = scrollLeft;

        var bottomHolder = this.bottomOverlay.needFullRender ? this.bottomOverlay.clone.wtTable.holder : null;

        if (bottomHolder) {
          bottomHolder.scrollLeft = scrollLeft;
        }
      }

      if (this.verticalScrolling) {
        leftHolder.scrollTop = scrollTop;
      }

      this.refreshAll();
    }

    /**
     * Synchronize overlay scrollbars with the master scrollbar
     */

  }, {
    key: 'syncScrollWithMaster',
    value: function syncScrollWithMaster() {
      var master = this.topOverlay.mainTableScrollableElement;
      var scrollLeft = master.scrollLeft,
          scrollTop = master.scrollTop;


      if (this.topOverlay.needFullRender) {
        this.topOverlay.clone.wtTable.holder.scrollLeft = scrollLeft;
      }
      if (this.bottomOverlay.needFullRender) {
        this.bottomOverlay.clone.wtTable.holder.scrollLeft = scrollLeft;
      }
      if (this.leftOverlay.needFullRender) {
        this.leftOverlay.clone.wtTable.holder.scrollTop = scrollTop;
      }
    }

    /**
     * Update the main scrollable elements for all the overlays.
     */

  }, {
    key: 'updateMainScrollableElements',
    value: function updateMainScrollableElements() {
      this.deregisterListeners();

      this.leftOverlay.updateMainScrollableElement();
      this.topOverlay.updateMainScrollableElement();

      if (this.bottomOverlay.needFullRender) {
        this.bottomOverlay.updateMainScrollableElement();
      }

      this.scrollableElement = getScrollableElement(this.wot.wtTable.TABLE);

      this.registerListeners();
    }

    /**
     *
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.eventManager.destroy();
      this.topOverlay.destroy();

      if (this.bottomOverlay.clone) {
        this.bottomOverlay.destroy();
      }
      this.leftOverlay.destroy();

      if (this.topLeftCornerOverlay) {
        this.topLeftCornerOverlay.destroy();
      }

      if (this.bottomLeftCornerOverlay && this.bottomLeftCornerOverlay.clone) {
        this.bottomLeftCornerOverlay.destroy();
      }

      if (this.debug) {
        this.debug.destroy();
      }
      this.destroyed = true;
    }

    /**
     * @param {Boolean} [fastDraw=false]
     */

  }, {
    key: 'refresh',
    value: function refresh() {
      var fastDraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      if (this.topOverlay.areElementSizesAdjusted && this.leftOverlay.areElementSizesAdjusted) {
        var container = this.wot.wtTable.wtRootElement.parentNode || this.wot.wtTable.wtRootElement;
        var width = container.clientWidth;
        var height = container.clientHeight;

        if (width !== this.spreaderLastSize.width || height !== this.spreaderLastSize.height) {
          this.spreaderLastSize.width = width;
          this.spreaderLastSize.height = height;
          this.adjustElementsSize();
        }
      }

      if (this.bottomOverlay.clone) {
        this.bottomOverlay.refresh(fastDraw);
      }

      this.leftOverlay.refresh(fastDraw);
      this.topOverlay.refresh(fastDraw);

      if (this.topLeftCornerOverlay) {
        this.topLeftCornerOverlay.refresh(fastDraw);
      }

      if (this.bottomLeftCornerOverlay && this.bottomLeftCornerOverlay.clone) {
        this.bottomLeftCornerOverlay.refresh(fastDraw);
      }

      if (this.debug) {
        this.debug.refresh(fastDraw);
      }
    }

    /**
     * Adjust overlays elements size and master table size
     *
     * @param {Boolean} [force=false]
     */

  }, {
    key: 'adjustElementsSize',
    value: function adjustElementsSize() {
      var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var totalColumns = this.wot.getSetting('totalColumns');
      var totalRows = this.wot.getSetting('totalRows');
      var headerRowSize = this.wot.wtViewport.getRowHeaderWidth();
      var headerColumnSize = this.wot.wtViewport.getColumnHeaderHeight();
      var hiderStyle = this.wot.wtTable.hider.style;

      hiderStyle.width = headerRowSize + this.leftOverlay.sumCellSizes(0, totalColumns) + 'px';
      hiderStyle.height = headerColumnSize + this.topOverlay.sumCellSizes(0, totalRows) + 1 + 'px';

      this.topOverlay.adjustElementsSize(force);
      this.leftOverlay.adjustElementsSize(force);

      if (this.bottomOverlay.clone) {
        this.bottomOverlay.adjustElementsSize(force);
      }
    }

    /**
     *
     */

  }, {
    key: 'applyToDOM',
    value: function applyToDOM() {
      if (!this.topOverlay.areElementSizesAdjusted || !this.leftOverlay.areElementSizesAdjusted) {
        this.adjustElementsSize();
      }
      this.topOverlay.applyToDOM();

      if (this.bottomOverlay.clone) {
        this.bottomOverlay.applyToDOM();
      }

      this.leftOverlay.applyToDOM();
    }

    /**
     * Get the parent overlay of the provided element.
     *
     * @param {HTMLElement} element
     * @returns {Object|null}
     */

  }, {
    key: 'getParentOverlay',
    value: function getParentOverlay(element) {
      if (!element) {
        return null;
      }

      var overlays = [this.topOverlay, this.leftOverlay, this.bottomOverlay, this.topLeftCornerOverlay, this.bottomLeftCornerOverlay];
      var result = null;

      arrayEach(overlays, function (elem) {
        if (!elem) {
          return;
        }

        if (elem.clone && elem.clone.wtTable.TABLE.contains(element)) {
          result = elem.clone;
        }
      });

      return result;
    }
  }]);

  return Overlays;
}();

export default Overlays;