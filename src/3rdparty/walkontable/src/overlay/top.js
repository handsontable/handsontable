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
  shouldBeRendered() {
    return this.wot.getSetting('fixedRowsTop') || this.wot.getSetting('columnHeaders').length ? true : false;
  }

  /**
   * Updates the top overlay position
   */
  resetFixedPosition() {
    if (!this.needFullRender || !this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }
    let overlayRoot = this.clone.wtTable.holder.parentNode;
    let headerPosition = 0;

    if (this.wot.wtOverlays.leftOverlay.trimmingContainer === window) {
      let box = this.wot.wtTable.hider.getBoundingClientRect();
      let top = Math.ceil(box.top);
      let bottom = Math.ceil(box.bottom);
      let finalLeft;
      let finalTop;

      finalLeft = this.wot.wtTable.hider.style.left;
      finalLeft = finalLeft === '' ? 0 : finalLeft;

      if (top < 0 && (bottom - overlayRoot.offsetHeight) > 0) {
        finalTop = -top;
      } else {
        finalTop = 0;
      }
      headerPosition = finalTop;
      finalTop = finalTop + 'px';

      dom.setOverlayPosition(overlayRoot, finalLeft, finalTop);

    } else {
      headerPosition = this.getScrollPosition();
    }
    this.adjustHeaderBordersPosition(headerPosition);
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
      from++;
    }

    return sum;
  }

  /**
   * Adjust overlay root element, childs and master table element sizes (width, height).
   */
  adjustElementsSize() {
    if (this.needFullRender) {
      this.adjustRootElementSize();
      this.adjustRootChildsSize();
      this.isElementSizesAdjusted = true;
    }
  }

  /**
   * Adjust overlay root element size (width and height).
   */
  adjustRootElementSize() {
    let masterHolder = this.wot.wtTable.holder;
    let scrollbarWidth = masterHolder.clientWidth !== masterHolder.offsetWidth ? dom.getScrollbarWidth() : 0;
    let overlayRoot = this.clone.wtTable.holder.parentNode;
    let overlayRootStyle = overlayRoot.style;
    let tableHeight;

    if (this.trimmingContainer !== window) {
      overlayRootStyle.width = this.wot.wtViewport.getWorkspaceWidth() - scrollbarWidth + 'px';
    }
    this.clone.wtTable.holder.style.width = overlayRootStyle.width;

    tableHeight = dom.outerHeight(this.clone.wtTable.TABLE);
    overlayRootStyle.height = (tableHeight === 0 ? tableHeight : tableHeight + 4) + 'px';
  }

  /**
   * Adjust overlay root childs size
   */
  adjustRootChildsSize() {
    let scrollbarWidth = dom.getScrollbarWidth();

    this.clone.wtTable.hider.style.width = this.hider.style.width;
    this.clone.wtTable.holder.style.width = this.clone.wtTable.holder.parentNode.style.width;

    if (scrollbarWidth === 0) {
      scrollbarWidth = 30;
    }
    this.clone.wtTable.holder.style.height = parseInt(this.clone.wtTable.holder.parentNode.style.height, 10) + scrollbarWidth + 'px';
  }

  /**
   * Adjust the overlay dimensions and position
   */
  applyToDOM() {
    let total = this.wot.getSetting('totalRows');

    if (!this.isElementSizesAdjusted) {
      this.adjustElementsSize();
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
   * Synchronize calculated left position to an element
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
   * Adds css classes to hide the header border's header (cell-selection border hiding issue)
   *
   * @param {Number} position Header Y position if trimming container is window or scroll top if not
   */
  adjustHeaderBordersPosition(position) {
    if (this.wot.getSetting('fixedRowsTop') === 0 && this.wot.getSetting('columnHeaders').length > 0) {
      let masterParent = this.wot.wtTable.holder.parentNode;
      let previousState = dom.hasClass(masterParent, 'innerBorderTop');

      if (position) {
        dom.addClass(masterParent, 'innerBorderTop');
      } else {
        dom.removeClass(masterParent, 'innerBorderTop');
      }
      if (!previousState && position || previousState && !position) {
        this.wot.wtOverlays.adjustElementsSize();
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
