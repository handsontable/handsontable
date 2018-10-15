'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _element = require('./../../../../helpers/dom/element');

var _base = require('./_base');

var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @class LeftOverlay
 */
var LeftOverlay = function (_Overlay) {
  _inherits(LeftOverlay, _Overlay);

  /**
   * @param {Walkontable} wotInstance
   */
  function LeftOverlay(wotInstance) {
    _classCallCheck(this, LeftOverlay);

    var _this = _possibleConstructorReturn(this, (LeftOverlay.__proto__ || Object.getPrototypeOf(LeftOverlay)).call(this, wotInstance));

    _this.clone = _this.makeClone(_base2.default.CLONE_LEFT);
    return _this;
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {Boolean}
   */


  _createClass(LeftOverlay, [{
    key: 'shouldBeRendered',
    value: function shouldBeRendered() {
      return !!(this.wot.getSetting('fixedColumnsLeft') || this.wot.getSetting('rowHeaders').length);
    }

    /**
     * Updates the left overlay position.
     */

  }, {
    key: 'resetFixedPosition',
    value: function resetFixedPosition() {
      if (!this.needFullRender || !this.wot.wtTable.holder.parentNode) {
        // removed from DOM
        return;
      }
      var overlayRoot = this.clone.wtTable.holder.parentNode;
      var headerPosition = 0;
      var preventOverflow = this.wot.getSetting('preventOverflow');

      if (this.trimmingContainer === window && (!preventOverflow || preventOverflow !== 'horizontal')) {
        var box = this.wot.wtTable.hider.getBoundingClientRect();
        var left = Math.ceil(box.left);
        var right = Math.ceil(box.right);
        var finalLeft = void 0;
        var finalTop = void 0;

        finalTop = this.wot.wtTable.hider.style.top;
        finalTop = finalTop === '' ? 0 : finalTop;

        if (left < 0 && right - overlayRoot.offsetWidth > 0) {
          finalLeft = -left;
        } else {
          finalLeft = 0;
        }
        headerPosition = finalLeft;
        finalLeft += 'px';

        (0, _element.setOverlayPosition)(overlayRoot, finalLeft, finalTop);
      } else {
        headerPosition = this.getScrollPosition();
        (0, _element.resetCssTransform)(overlayRoot);
      }
      this.adjustHeaderBordersPosition(headerPosition);
      this.adjustElementsSize();
    }

    /**
     * Sets the main overlay's horizontal scroll position.
     *
     * @param {Number} pos
     * @returns {Boolean}
     */

  }, {
    key: 'setScrollPosition',
    value: function setScrollPosition(pos) {
      var result = false;

      if (this.mainTableScrollableElement === window && window.scrollX !== pos) {
        window.scrollTo(pos, (0, _element.getWindowScrollTop)());
        result = true;
      } else if (this.mainTableScrollableElement.scrollLeft !== pos) {
        this.mainTableScrollableElement.scrollLeft = pos;
        result = true;
      }

      return result;
    }

    /**
     * Triggers onScroll hook callback.
     */

  }, {
    key: 'onScroll',
    value: function onScroll() {
      this.wot.getSetting('onScrollVertically');
    }

    /**
     * Calculates total sum cells width.
     *
     * @param {Number} from Column index which calculates started from.
     * @param {Number} to Column index where calculation is finished.
     * @returns {Number} Width sum.
     */

  }, {
    key: 'sumCellSizes',
    value: function sumCellSizes(from, to) {
      var defaultColumnWidth = this.wot.wtSettings.defaultColumnWidth;
      var column = from;
      var sum = 0;

      while (column < to) {
        sum += this.wot.wtTable.getStretchedColumnWidth(column) || defaultColumnWidth;
        column += 1;
      }

      return sum;
    }

    /**
     * Adjust overlay root element, childs and master table element sizes (width, height).
     *
     * @param {Boolean} [force=false]
     */

  }, {
    key: 'adjustElementsSize',
    value: function adjustElementsSize() {
      var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      this.updateTrimmingContainer();

      if (this.needFullRender || force) {
        this.adjustRootElementSize();
        this.adjustRootChildrenSize();

        if (!force) {
          this.areElementSizesAdjusted = true;
        }
      }
    }

    /**
     * Adjust overlay root element size (width and height).
     */

  }, {
    key: 'adjustRootElementSize',
    value: function adjustRootElementSize() {
      var masterHolder = this.wot.wtTable.holder;
      var scrollbarHeight = masterHolder.clientHeight === masterHolder.offsetHeight ? 0 : (0, _element.getScrollbarWidth)();
      var overlayRoot = this.clone.wtTable.holder.parentNode;
      var overlayRootStyle = overlayRoot.style;
      var preventOverflow = this.wot.getSetting('preventOverflow');

      if (this.trimmingContainer !== window || preventOverflow === 'vertical') {
        var height = this.wot.wtViewport.getWorkspaceHeight() - scrollbarHeight;

        height = Math.min(height, (0, _element.innerHeight)(this.wot.wtTable.wtRootElement));

        overlayRootStyle.height = height + 'px';
      } else {
        overlayRootStyle.height = '';
      }

      this.clone.wtTable.holder.style.height = overlayRootStyle.height;

      var tableWidth = (0, _element.outerWidth)(this.clone.wtTable.TABLE);
      overlayRootStyle.width = (tableWidth === 0 ? tableWidth : tableWidth + 4) + 'px';
    }

    /**
     * Adjust overlay root childs size.
     */

  }, {
    key: 'adjustRootChildrenSize',
    value: function adjustRootChildrenSize() {
      var scrollbarWidth = (0, _element.getScrollbarWidth)();

      this.clone.wtTable.hider.style.height = this.hider.style.height;
      this.clone.wtTable.holder.style.height = this.clone.wtTable.holder.parentNode.style.height;

      if (scrollbarWidth === 0) {
        scrollbarWidth = 30;
      }
      this.clone.wtTable.holder.style.width = parseInt(this.clone.wtTable.holder.parentNode.style.width, 10) + scrollbarWidth + 'px';
    }

    /**
     * Adjust the overlay dimensions and position.
     */

  }, {
    key: 'applyToDOM',
    value: function applyToDOM() {
      var total = this.wot.getSetting('totalColumns');

      if (!this.areElementSizesAdjusted) {
        this.adjustElementsSize();
      }
      if (typeof this.wot.wtViewport.columnsRenderCalculator.startPosition === 'number') {
        this.spreader.style.left = this.wot.wtViewport.columnsRenderCalculator.startPosition + 'px';
      } else if (total === 0) {
        this.spreader.style.left = '0';
      } else {
        throw new Error('Incorrect value of the columnsRenderCalculator');
      }
      this.spreader.style.right = '';

      if (this.needFullRender) {
        this.syncOverlayOffset();
      }
    }

    /**
     * Synchronize calculated top position to an element.
     */

  }, {
    key: 'syncOverlayOffset',
    value: function syncOverlayOffset() {
      if (typeof this.wot.wtViewport.rowsRenderCalculator.startPosition === 'number') {
        this.clone.wtTable.spreader.style.top = this.wot.wtViewport.rowsRenderCalculator.startPosition + 'px';
      } else {
        this.clone.wtTable.spreader.style.top = '';
      }
    }

    /**
     * Scrolls horizontally to a column at the left edge of the viewport.
     *
     * @param {Number} sourceCol  Column index which you want to scroll to.
     * @param {Boolean} [beyondRendered]  if `true`, scrolls according to the bottom edge (top edge is by default).
     * @returns {Boolean}
     */

  }, {
    key: 'scrollTo',
    value: function scrollTo(sourceCol, beyondRendered) {
      var newX = this.getTableParentOffset();
      var sourceInstance = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
      var mainHolder = sourceInstance.wtTable.holder;
      var scrollbarCompensation = 0;

      if (beyondRendered && mainHolder.offsetWidth !== mainHolder.clientWidth) {
        scrollbarCompensation = (0, _element.getScrollbarWidth)();
      }
      if (beyondRendered) {
        newX += this.sumCellSizes(0, sourceCol + 1);
        newX -= this.wot.wtViewport.getViewportWidth();
      } else {
        newX += this.sumCellSizes(this.wot.getSetting('fixedColumnsLeft'), sourceCol);
      }

      newX += scrollbarCompensation;

      return this.setScrollPosition(newX);
    }

    /**
     * Gets table parent left position.
     *
     * @returns {Number}
     */

  }, {
    key: 'getTableParentOffset',
    value: function getTableParentOffset() {
      var preventOverflow = this.wot.getSetting('preventOverflow');
      var offset = 0;

      if (!preventOverflow && this.trimmingContainer === window) {
        offset = this.wot.wtTable.holderOffset.left;
      }

      return offset;
    }

    /**
     * Gets the main overlay's horizontal scroll position.
     *
     * @returns {Number} Main table's vertical scroll position.
     */

  }, {
    key: 'getScrollPosition',
    value: function getScrollPosition() {
      return (0, _element.getScrollLeft)(this.mainTableScrollableElement);
    }

    /**
     * Adds css classes to hide the header border's header (cell-selection border hiding issue).
     *
     * @param {Number} position Header X position if trimming container is window or scroll top if not.
     */

  }, {
    key: 'adjustHeaderBordersPosition',
    value: function adjustHeaderBordersPosition(position) {
      var masterParent = this.wot.wtTable.holder.parentNode;
      var rowHeaders = this.wot.getSetting('rowHeaders');
      var fixedColumnsLeft = this.wot.getSetting('fixedColumnsLeft');
      var totalRows = this.wot.getSetting('totalRows');

      if (totalRows) {
        (0, _element.removeClass)(masterParent, 'emptyRows');
      } else {
        (0, _element.addClass)(masterParent, 'emptyRows');
      }

      if (fixedColumnsLeft && !rowHeaders.length) {
        (0, _element.addClass)(masterParent, 'innerBorderLeft');
      } else if (!fixedColumnsLeft && rowHeaders.length) {
        var previousState = (0, _element.hasClass)(masterParent, 'innerBorderLeft');

        if (position) {
          (0, _element.addClass)(masterParent, 'innerBorderLeft');
        } else {
          (0, _element.removeClass)(masterParent, 'innerBorderLeft');
        }
        if (!previousState && position || previousState && !position) {
          this.wot.wtOverlays.adjustElementsSize();
        }
      }
    }
  }]);

  return LeftOverlay;
}(_base2.default);

_base2.default.registerOverlay(_base2.default.CLONE_LEFT, LeftOverlay);

exports.default = LeftOverlay;