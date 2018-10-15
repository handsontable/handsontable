var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import { addClass, getScrollbarWidth, getScrollTop, getWindowScrollLeft, hasClass, outerHeight, innerWidth, removeClass, setOverlayPosition, resetCssTransform } from './../../../../helpers/dom/element';
import { arrayEach } from './../../../../helpers/array';
import Overlay from './_base';

/**
 * @class TopOverlay
 */

var TopOverlay = function (_Overlay) {
  _inherits(TopOverlay, _Overlay);

  /**
   * @param {Walkontable} wotInstance
   */
  function TopOverlay(wotInstance) {
    _classCallCheck(this, TopOverlay);

    var _this = _possibleConstructorReturn(this, (TopOverlay.__proto__ || Object.getPrototypeOf(TopOverlay)).call(this, wotInstance));

    _this.clone = _this.makeClone(Overlay.CLONE_TOP);
    return _this;
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {Boolean}
   */


  _createClass(TopOverlay, [{
    key: 'shouldBeRendered',
    value: function shouldBeRendered() {
      return !!(this.wot.getSetting('fixedRowsTop') || this.wot.getSetting('columnHeaders').length);
    }

    /**
     * Updates the top overlay position.
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

      if (this.trimmingContainer === window && (!preventOverflow || preventOverflow !== 'vertical')) {
        var box = this.wot.wtTable.hider.getBoundingClientRect();
        var top = Math.ceil(box.top);
        var bottom = Math.ceil(box.bottom);
        var finalLeft = void 0;
        var finalTop = void 0;

        finalLeft = this.wot.wtTable.hider.style.left;
        finalLeft = finalLeft === '' ? 0 : finalLeft;

        if (top < 0 && bottom - overlayRoot.offsetHeight > 0) {
          finalTop = -top;
        } else {
          finalTop = 0;
        }
        headerPosition = finalTop;
        finalTop += 'px';

        setOverlayPosition(overlayRoot, finalLeft, finalTop);
      } else {
        headerPosition = this.getScrollPosition();
        resetCssTransform(overlayRoot);
      }

      this.adjustHeaderBordersPosition(headerPosition);
      this.adjustElementsSize();
    }

    /**
     * Sets the main overlay's vertical scroll position.
     *
     * @param {Number} pos
     * @returns {Boolean}
     */

  }, {
    key: 'setScrollPosition',
    value: function setScrollPosition(pos) {
      var result = false;

      if (this.mainTableScrollableElement === window && window.scrollY !== pos) {
        window.scrollTo(getWindowScrollLeft(), pos);
        result = true;
      } else if (this.mainTableScrollableElement.scrollTop !== pos) {
        this.mainTableScrollableElement.scrollTop = pos;
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
      this.wot.getSetting('onScrollHorizontally');
    }

    /**
     * Calculates total sum cells height.
     *
     * @param {Number} from Row index which calculates started from.
     * @param {Number} to Row index where calculation is finished.
     * @returns {Number} Height sum.
     */

  }, {
    key: 'sumCellSizes',
    value: function sumCellSizes(from, to) {
      var defaultRowHeight = this.wot.wtSettings.settings.defaultRowHeight;
      var row = from;
      var sum = 0;

      while (row < to) {
        var height = this.wot.wtTable.getRowHeight(row);

        sum += height === void 0 ? defaultRowHeight : height;
        row += 1;
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
      var scrollbarWidth = masterHolder.clientWidth === masterHolder.offsetWidth ? 0 : getScrollbarWidth();
      var overlayRoot = this.clone.wtTable.holder.parentNode;
      var overlayRootStyle = overlayRoot.style;
      var preventOverflow = this.wot.getSetting('preventOverflow');

      if (this.trimmingContainer !== window || preventOverflow === 'horizontal') {
        var width = this.wot.wtViewport.getWorkspaceWidth() - scrollbarWidth;

        width = Math.min(width, innerWidth(this.wot.wtTable.wtRootElement));

        overlayRootStyle.width = width + 'px';
      } else {
        overlayRootStyle.width = '';
      }

      this.clone.wtTable.holder.style.width = overlayRootStyle.width;

      var tableHeight = outerHeight(this.clone.wtTable.TABLE);
      overlayRootStyle.height = (tableHeight === 0 ? tableHeight : tableHeight + 4) + 'px';
    }

    /**
     * Adjust overlay root childs size.
     */

  }, {
    key: 'adjustRootChildrenSize',
    value: function adjustRootChildrenSize() {
      var scrollbarWidth = getScrollbarWidth();

      this.clone.wtTable.hider.style.width = this.hider.style.width;
      this.clone.wtTable.holder.style.width = this.clone.wtTable.holder.parentNode.style.width;

      if (scrollbarWidth === 0) {
        scrollbarWidth = 30;
      }
      this.clone.wtTable.holder.style.height = parseInt(this.clone.wtTable.holder.parentNode.style.height, 10) + scrollbarWidth + 'px';
    }

    /**
     * Adjust the overlay dimensions and position.
     */

  }, {
    key: 'applyToDOM',
    value: function applyToDOM() {
      var total = this.wot.getSetting('totalRows');

      if (!this.areElementSizesAdjusted) {
        this.adjustElementsSize();
      }
      if (typeof this.wot.wtViewport.rowsRenderCalculator.startPosition === 'number') {
        this.spreader.style.top = this.wot.wtViewport.rowsRenderCalculator.startPosition + 'px';
      } else if (total === 0) {
        // can happen if there are 0 rows
        this.spreader.style.top = '0';
      } else {
        throw new Error('Incorrect value of the rowsRenderCalculator');
      }
      this.spreader.style.bottom = '';

      if (this.needFullRender) {
        this.syncOverlayOffset();
      }
    }

    /**
     * Synchronize calculated left position to an element.
     */

  }, {
    key: 'syncOverlayOffset',
    value: function syncOverlayOffset() {
      if (typeof this.wot.wtViewport.columnsRenderCalculator.startPosition === 'number') {
        this.clone.wtTable.spreader.style.left = this.wot.wtViewport.columnsRenderCalculator.startPosition + 'px';
      } else {
        this.clone.wtTable.spreader.style.left = '';
      }
    }

    /**
     * Scrolls vertically to a row.
     *
     * @param {Number} sourceRow Row index which you want to scroll to.
     * @param {Boolean} [bottomEdge] if `true`, scrolls according to the bottom edge (top edge is by default).
     * @returns {Boolean}
     */

  }, {
    key: 'scrollTo',
    value: function scrollTo(sourceRow, bottomEdge) {
      var newY = this.getTableParentOffset();
      var sourceInstance = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
      var mainHolder = sourceInstance.wtTable.holder;
      var scrollbarCompensation = 0;

      if (bottomEdge && mainHolder.offsetHeight !== mainHolder.clientHeight) {
        scrollbarCompensation = getScrollbarWidth();
      }

      if (bottomEdge) {
        var fixedRowsBottom = this.wot.getSetting('fixedRowsBottom');
        var totalRows = this.wot.getSetting('totalRows');

        newY += this.sumCellSizes(0, sourceRow + 1);
        newY -= this.wot.wtViewport.getViewportHeight() - this.sumCellSizes(totalRows - fixedRowsBottom, totalRows);
        // Fix 1 pixel offset when cell is selected
        newY += 1;
      } else {
        newY += this.sumCellSizes(this.wot.getSetting('fixedRowsTop'), sourceRow);
      }
      newY += scrollbarCompensation;

      return this.setScrollPosition(newY);
    }

    /**
     * Gets table parent top position.
     *
     * @returns {Number}
     */

  }, {
    key: 'getTableParentOffset',
    value: function getTableParentOffset() {
      if (this.mainTableScrollableElement === window) {
        return this.wot.wtTable.holderOffset.top;
      }
      return 0;
    }

    /**
     * Gets the main overlay's vertical scroll position.
     *
     * @returns {Number} Main table's vertical scroll position.
     */

  }, {
    key: 'getScrollPosition',
    value: function getScrollPosition() {
      return getScrollTop(this.mainTableScrollableElement);
    }

    /**
     * Redraw borders of selection.
     *
     * @param {WalkontableSelection} selection Selection for redraw.
     */

  }, {
    key: 'redrawSelectionBorders',
    value: function redrawSelectionBorders(selection) {
      if (selection && selection.cellRange) {
        var border = selection.getBorder(this.wot);
        var corners = selection.getCorners();

        border.disappear();
        border.appear(corners);
      }
    }

    /**
     * Redrawing borders of all selections.
     */

  }, {
    key: 'redrawAllSelectionsBorders',
    value: function redrawAllSelectionsBorders() {
      var _this2 = this;

      var selections = this.wot.selections;

      this.redrawSelectionBorders(selections.getCell());

      arrayEach(selections.getAreas(), function (area) {
        _this2.redrawSelectionBorders(area);
      });
      this.redrawSelectionBorders(selections.getFill());

      this.wot.wtTable.wot.wtOverlays.leftOverlay.refresh();
    }

    /**
     * Adds css classes to hide the header border's header (cell-selection border hiding issue).
     *
     * @param {Number} position Header Y position if trimming container is window or scroll top if not.
     */

  }, {
    key: 'adjustHeaderBordersPosition',
    value: function adjustHeaderBordersPosition(position) {
      var masterParent = this.wot.wtTable.holder.parentNode;
      var totalColumns = this.wot.getSetting('totalColumns');

      if (totalColumns) {
        removeClass(masterParent, 'emptyColumns');
      } else {
        addClass(masterParent, 'emptyColumns');
      }

      if (this.wot.getSetting('fixedRowsTop') === 0 && this.wot.getSetting('columnHeaders').length > 0) {
        var previousState = hasClass(masterParent, 'innerBorderTop');

        if (position || this.wot.getSetting('totalRows') === 0) {
          addClass(masterParent, 'innerBorderTop');
        } else {
          removeClass(masterParent, 'innerBorderTop');
        }

        if (!previousState && position || previousState && !position) {
          this.wot.wtOverlays.adjustElementsSize();

          // cell borders should be positioned once again,
          // because we added / removed 1px border from table header
          this.redrawAllSelectionsBorders();
        }
      }

      // nasty workaround for double border in the header, TODO: find a pure-css solution
      if (this.wot.getSetting('rowHeaders').length === 0) {
        var secondHeaderCell = this.clone.wtTable.THEAD.querySelectorAll('th:nth-of-type(2)');

        if (secondHeaderCell) {
          for (var i = 0; i < secondHeaderCell.length; i++) {
            secondHeaderCell[i].style['border-left-width'] = 0;
          }
        }
      }
    }
  }]);

  return TopOverlay;
}(Overlay);

Overlay.registerOverlay(Overlay.CLONE_TOP, TopOverlay);

export default TopOverlay;