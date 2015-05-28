
import * as dom from './../../../../dom.js';
import {WalkontableOverlay} from './_base.js';


/**
 * @class WalkontableLeftOverlay
 */
class WalkontableLeftOverlay extends WalkontableOverlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(WalkontableOverlay.CLONE_LEFT);
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  isShouldBeFullyRendered() {
    return this.wot.getSetting('fixedColumnsLeft') || this.wot.getSetting('rowHeaders').length ? true : false;
  }

  /**
   * Updates the left overlay position
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

    if (this.trimmingContainer === window) {
      let box = this.wot.wtTable.hider.getBoundingClientRect();
      let left = Math.ceil(box.left);
      let right = Math.ceil(box.right);
      let finalLeft;
      let finalTop;

      if (left < 0 && (right - overlayRoot.offsetWidth) > 0) {
        finalLeft = -left + 'px';
      } else {
        finalLeft = '0';
      }
      finalTop = this.wot.wtTable.hider.style.top;
      finalTop = finalTop === '' ? 0 : finalTop;

      dom.setOverlayPosition(overlayRoot, finalLeft, finalTop);
    }
  }

  /**
   * Sets the main overlay's horizontal scroll position
   *
   * @param {Number} pos
   */
  setScrollPosition(pos) {
    if (this.mainTableScrollableElement === window) {
      window.scrollTo(pos, dom.getWindowScrollTop());

    } else {
      this.mainTableScrollableElement.scrollLeft = pos;
    }
  };

  /**
   * Triggers onScroll hook callback
   */
  onScroll() {
    this.wot.getSetting('onScrollHorizontally');
  }

  /**
   * Calculates total sum cells width
   *
   * @param {Number} from Column index which calculates started from
   * @param {Number} to Column index where calculation is finished
   * @returns {Number} Width sum
   */
  sumCellSizes(from, to) {
    let sum = 0;
    let defaultColumnWidth = this.wot.wtSettings.defaultColumnWidth;

    while (from < to) {
      sum += this.wot.wtTable.getStretchedColumnWidth(from) || defaultColumnWidth;
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

    let scrollbarHeight = this.wot.wtTable.holder.clientHeight !== this.wot.wtTable.holder.offsetHeight ? dom.getScrollbarWidth() : 0;
    let scrollbarWidth = this.wot.wtTable.holder.clientWidth !== this.wot.wtTable.holder.offsetWidth ? dom.getScrollbarWidth() : 0;
    let tableWidth;
    let elemWidth;

    if (this.trimmingContainer !== window) {
      overlayRootStyle.height = this.wot.wtViewport.getWorkspaceHeight() - scrollbarHeight + 'px';
    }
    tableWidth = dom.outerWidth(this.clone.wtTable.TABLE);
    elemWidth = (tableWidth === 0 ? tableWidth : tableWidth + 4);
    overlayRootStyle.width = elemWidth + 'px';

    if (scrollbarWidth === 0) {
      scrollbarWidth = 30;
    }
    overlayRootStyle.width = elemWidth + scrollbarWidth + 'px';
  }

  /**
   * Adjust the overlay dimensions and position
   */
  applyToDOM() {
    if (this.needFullRender) {
      this.adjustRootElementSize();
    }

    let total = this.wot.getSetting('totalColumns');
    let headerSize = this.wot.wtViewport.getRowHeaderWidth();
    let masterHider = this.hider;
    let masterHideWidth = masterHider.style.width;
    let newMasterHiderWidth = headerSize + this.sumCellSizes(0, total) + 'px';

    if (masterHideWidth !== newMasterHiderWidth) {
      masterHider.style.width = newMasterHiderWidth;
    }

    if (this.needFullRender) {
      let cloneHolder = this.clone.wtTable.holder;
      let cloneHider = this.clone.wtTable.hider;
      let cloneHolderParent = cloneHolder.parentNode;
      let scrollbarWidth = dom.getScrollbarWidth();
      let masterHiderHeight = masterHider.style.height;
      let cloneHolderParentWidth = cloneHolderParent.style.width;
      let cloneHolderParentHeight = cloneHolderParent.style.height;
      let cloneHolderWidth = cloneHolder.style.width;
      let cloneHolderHeight = cloneHolder.style.height;
      let cloneHiderHeight = cloneHider.style.height;
      let newCloneHolderWidth = parseInt(cloneHolderParentWidth, 10) + scrollbarWidth + 'px';

      if (cloneHolderWidth !== newCloneHolderWidth) {
        cloneHolder.style.width = newCloneHolderWidth;
      }

      if (cloneHolderHeight !== cloneHolderParentHeight) {
        cloneHolder.style.height = cloneHolderParentHeight;
      }

      if (cloneHiderHeight !== masterHiderHeight) {
        cloneHider.style.height = masterHiderHeight;
      }
    }

    if (typeof this.wot.wtViewport.columnsRenderCalculator.startPosition === 'number') {
      this.spreader.style.left = this.wot.wtViewport.columnsRenderCalculator.startPosition + 'px';

    } else if (total === 0) {
      this.spreader.style.left = '0';

    } else {
      throw  new Error('Incorrect value of the columnsRenderCalculator');
    }
    this.spreader.style.right = '';

    if (this.needFullRender) {
      this.syncOverlayOffset();
    }
  }

  /**
   *
   */
  syncOverlayOffset() {
    if (typeof this.wot.wtViewport.rowsRenderCalculator.startPosition === 'number') {
      this.clone.wtTable.spreader.style.top = this.wot.wtViewport.rowsRenderCalculator.startPosition + 'px';

    } else {
      this.clone.wtTable.spreader.style.top = '';
    }
  }

  /**
   * Scrolls horizontally to a column at the left edge of the viewport
   *
   * @param sourceCol {Number} Column index which you want to scroll to
   * @param [beyondRendered=false] {Boolean} if `true`, scrolls according to the bottom edge (top edge is by default)
   */
  scrollTo(sourceCol, beyondRendered) {
    let newX = this.getTableParentOffset();
    let sourceInstance = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
    let mainHolder = sourceInstance.wtTable.holder;
    let scrollbarCompensation = 0;

    if (beyondRendered && mainHolder.offsetWidth !== mainHolder.clientWidth) {
      scrollbarCompensation = dom.getScrollbarWidth();
    }
    if (beyondRendered) {
      newX += this.sumCellSizes(0, sourceCol + 1);
      newX -= this.wot.wtViewport.getViewportWidth();

    } else {
      newX += this.sumCellSizes(this.wot.getSetting('fixedColumnsLeft'), sourceCol);
    }
    newX += scrollbarCompensation;

    this.setScrollPosition(newX);
  }

  /**
   * Gets table parent left position
   *
   * @returns {Number}
   */
  getTableParentOffset() {
    if (this.trimmingContainer === window) {
      return this.wot.wtTable.holderOffset.left;

    } else {
      return 0;
    }
  }

  /**
   * Gets the main overlay's horizontal scroll position
   *
   * @returns {Number} Main table's vertical scroll position
   */
  getScrollPosition() {
    return dom.getScrollLeft(this.mainTableScrollableElement);
  }

  /**
   * Adds css classes to hide the header border's header on initial position (cell-selection border hiding issue)
   *
   * @private
   */
  _hideBorderOnInitialPosition() {
    if (this.wot.getSetting('fixedColumnsLeft') === 0 && this.wot.getSetting('rowHeaders').length > 0) {
      let masterParent = this.wot.wtTable.holder.parentNode;

      if (this.getScrollPosition() === 0) {
        dom.removeClass(masterParent, 'innerBorderLeft');
      } else {
        dom.addClass(masterParent, 'innerBorderLeft');
      }
    }
  }
}

export {WalkontableLeftOverlay};

window.WalkontableLeftOverlay = WalkontableLeftOverlay;
