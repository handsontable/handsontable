
import * as dom from './../../../../dom.js';
import {WalkontableOverlay} from './_base.js';


/**
 * @class WalkontableTopOverlay
 */
class WalkontableTopOverlay extends WalkontableOverlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(WalkontableOverlay.CLONE_TOP);
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  isShouldBeFullyRendered() {
    return this.wot.getSetting('fixedRowsTop') || this.wot.getSetting('columnHeaders').length ? true : false;
  }

  /**
   * Updates the top overlay position
   */
  resetFixedPosition() {
    if (!this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }
    this._hideBorderOnInitialPosition();

    if (!this.needFullRender) {
      return;
    }
    let overlayRoot = this.clone.wtTable.holder.parentNode;

    if (this.wot.wtOverlays.leftOverlay.trimmingContainer === window) {
      let box = this.wot.wtTable.hider.getBoundingClientRect();
      let top = Math.ceil(box.top);
      let bottom = Math.ceil(box.bottom);
      let finalLeft;
      let finalTop;

      finalLeft = this.wot.wtTable.hider.style.left;
      finalLeft = finalLeft === '' ? 0 : finalLeft;

      if (top < 0 && (bottom - overlayRoot.offsetHeight) > 0) {
        finalTop = -top + 'px';
      } else {
        finalTop = '0';
      }

      dom.setOverlayPosition(overlayRoot, finalLeft, finalTop);
    }
  }

  /**
   * Sets the main overlay's vertical scroll position
   *
   * @param {Number} pos
   */
  setScrollPosition(pos) {
    if (this.mainTableScrollableElement === window) {
      window.scrollTo(dom.getWindowScrollLeft(), pos);

    } else {
      this.mainTableScrollableElement.scrollTop = pos;
    }
  }

  /**
   * Triggers onScroll hook callback
   */
  onScroll() {
    this.wot.getSetting('onScrollVertically');
  }

  /**
   * Calculates total sum cells height
   *
   * @param {Number} from Row index which calculates started from
   * @param {Number} to Row index where calculation is finished
   * @returns {Number} Height sum
   */
  sumCellSizes(from, to) {
    let sum = 0;
    let defaultRowHeight = this.wot.wtSettings.settings.defaultRowHeight;

    while (from < to) {
      sum += this.wot.wtTable.getRowHeight(from) || defaultRowHeight;
      from ++;
    }

    return sum;
  }

  /**
   * Adjust overlay root element size (width and height).
   */
  adjustRootElementSize() {
    let overlayRoot = this.clone.wtTable.holder.parentNode;
    let overlayRootStyle = overlayRoot.style;

    let scrollbarWidth = this.wot.wtTable.holder.clientWidth !== this.wot.wtTable.holder.offsetWidth ? dom.getScrollbarWidth() : 0;
    let tableHeight;

    if (this.trimmingContainer !== window) {
      overlayRootStyle.width = this.wot.wtViewport.getWorkspaceWidth() - scrollbarWidth + 'px';
    }
    this.clone.wtTable.holder.style.width = overlayRootStyle.width;

    tableHeight = dom.outerHeight(this.clone.wtTable.TABLE);
    overlayRootStyle.height = (tableHeight === 0 ? tableHeight : tableHeight + 4) + 'px';
  }

  /**
   * Adjust the overlay dimensions and position
   */
  applyToDOM() {
    if (this.needFullRender) {
      this.adjustRootElementSize();
    }

    let total = this.wot.getSetting('totalRows');
    let headerSize = this.wot.wtViewport.getColumnHeaderHeight();

    this.hider.style.height = (headerSize + this.sumCellSizes(0, total) + 1) + 'px';

    if (this.needFullRender) {
      let scrollbarWidth = dom.getScrollbarWidth();

      this.clone.wtTable.hider.style.width = this.hider.style.width;
      this.clone.wtTable.holder.style.width = this.clone.wtTable.holder.parentNode.style.width;

      if (scrollbarWidth === 0) {
        scrollbarWidth = 30;
      }

      this.clone.wtTable.holder.style.height = parseInt(this.clone.wtTable.holder.parentNode.style.height, 10) + scrollbarWidth + 'px';
    }

    if (typeof this.wot.wtViewport.rowsRenderCalculator.startPosition === 'number') {
      this.spreader.style.top = this.wot.wtViewport.rowsRenderCalculator.startPosition + 'px';

    } else if (total === 0) {
      // can happen if there are 0 rows
      this.spreader.style.top = '0';

    } else {
      throw new Error("Incorrect value of the rowsRenderCalculator");
    }
    this.spreader.style.bottom = '';

    if (this.needFullRender) {
      this.syncOverlayOffset();
    }
  }

  /**
   *
   */
  syncOverlayOffset() {
    if (typeof this.wot.wtViewport.columnsRenderCalculator.startPosition === 'number') {
      this.clone.wtTable.spreader.style.left = this.wot.wtViewport.columnsRenderCalculator.startPosition + 'px';

    } else {
      this.clone.wtTable.spreader.style.left = '';
    }
  }

  /**
   * Scrolls vertically to a row
   *
   * @param sourceRow {Number} Row index which you want to scroll to
   * @param [bottomEdge=false] {Boolean} if `true`, scrolls according to the bottom edge (top edge is by default)
   */
  scrollTo(sourceRow, bottomEdge) {
    let newY = this.getTableParentOffset();
    let sourceInstance = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
    let mainHolder = sourceInstance.wtTable.holder;
    let scrollbarCompensation = 0;

    if (bottomEdge && mainHolder.offsetHeight !== mainHolder.clientHeight) {
      scrollbarCompensation = dom.getScrollbarWidth();
    }

    if (bottomEdge) {
      newY += this.sumCellSizes(0, sourceRow + 1);
      newY -= this.wot.wtViewport.getViewportHeight();
      // Fix 1 pixel offset when cell is selected
      newY += 1;

    } else {
      newY += this.sumCellSizes(this.wot.getSetting('fixedRowsTop'), sourceRow);
    }
    newY += scrollbarCompensation;

    this.setScrollPosition(newY);
  }

  /**
   * Gets table parent top position
   *
   * @returns {Number}
   */
  getTableParentOffset() {
    if (this.mainTableScrollableElement === window) {
      return this.wot.wtTable.holderOffset.top;

    } else {
      return 0;
    }
  }

  /**
   * Gets the main overlay's vertical scroll position
   *
   * @returns {Number} Main table's vertical scroll position
   */
  getScrollPosition() {
    return dom.getScrollTop(this.mainTableScrollableElement);
  }

  /**
   * Adds css classes to hide the header border's header on initial position (cell-selection border hiding issue)
   *
   * @private
   */
  _hideBorderOnInitialPosition() {
    if (this.wot.getSetting('fixedRowsTop') === 0 && this.wot.getSetting('columnHeaders').length > 0) {
      let masterParent = this.wot.wtTable.holder.parentNode;

      if (this.getScrollPosition() === 0) {
        dom.removeClass(masterParent, 'innerBorderTop');
      } else {
        dom.addClass(masterParent, 'innerBorderTop');
      }
    }

    // nasty workaround for double border in the header, TODO: find a pure-css solution
    if (this.wot.getSetting('rowHeaders').length === 0) {
      let secondHeaderCell = this.clone.wtTable.THEAD.querySelector('th:nth-of-type(2)');

      if (secondHeaderCell) {
        secondHeaderCell.style['border-left-width'] = 0;
      }
    }
  }
}

export {WalkontableTopOverlay};

window.WalkontableTopOverlay = WalkontableTopOverlay;
