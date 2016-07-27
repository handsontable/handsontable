
import {
  addClass,
  getScrollbarWidth,
  getScrollLeft,
  getWindowScrollTop,
  hasClass,
  outerWidth,
  innerHeight,
  removeClass,
  setOverlayPosition,
  resetCssTransform
} from './../../../../helpers/dom/element';
import {WalkontableOverlay} from './_base';

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
  shouldBeRendered() {
    return this.wot.getSetting('fixedColumnsLeft') || this.wot.getSetting('rowHeaders').length ? true : false;
  }

  /**
   * Updates the left overlay position
   */
  resetFixedPosition() {
    if (!this.needFullRender || !this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }
    let overlayRoot = this.clone.wtTable.holder.parentNode;
    let headerPosition = 0;
    let preventOverflow = this.wot.getSetting('preventOverflow');

    if (this.trimmingContainer === window && (!preventOverflow || preventOverflow !== 'horizontal')) {
      let box = this.wot.wtTable.hider.getBoundingClientRect();
      let left = Math.ceil(box.left);
      let right = Math.ceil(box.right);
      let finalLeft;
      let finalTop;

      finalTop = this.wot.wtTable.hider.style.top;
      finalTop = finalTop === '' ? 0 : finalTop;

      if (left < 0 && (right - overlayRoot.offsetWidth) > 0) {
        finalLeft = -left;
      } else {
        finalLeft = 0;
      }
      headerPosition = finalLeft;
      finalLeft = finalLeft + 'px';

      setOverlayPosition(overlayRoot, finalLeft, finalTop);

    } else {
      headerPosition = this.getScrollPosition();
      resetCssTransform(overlayRoot);
    }
    this.adjustHeaderBordersPosition(headerPosition);

    this.adjustElementsSize();
  }

  /**
   * Sets the main overlay's horizontal scroll position
   *
   * @param {Number} pos
   */
  setScrollPosition(pos) {
    if (this.mainTableScrollableElement === window) {
      window.scrollTo(pos, getWindowScrollTop());

    } else {
      this.mainTableScrollableElement.scrollLeft = pos;
    }
  }

  /**
   * Triggers onScroll hook callback
   */
  onScroll() {
    this.wot.getSetting('onScrollVertically');
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
      from++;
    }

    return sum;
  }

  /**
   * Adjust overlay root element, childs and master table element sizes (width, height).
   *
   * @param {Boolean} [force=false]
   */
  adjustElementsSize(force = false) {
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
  adjustRootElementSize() {
    let masterHolder = this.wot.wtTable.holder;
    let scrollbarHeight = masterHolder.clientHeight === masterHolder.offsetHeight ? 0 : getScrollbarWidth();
    let overlayRoot = this.clone.wtTable.holder.parentNode;
    let overlayRootStyle = overlayRoot.style;
    let preventOverflow = this.wot.getSetting('preventOverflow');
    let tableWidth;

    if (this.trimmingContainer !== window || preventOverflow === 'vertical') {
      let height = this.wot.wtViewport.getWorkspaceHeight() - scrollbarHeight;

      height = Math.min(height, innerHeight(this.wot.wtTable.wtRootElement));

      overlayRootStyle.height = height + 'px';

    } else {
      overlayRootStyle.height = '';
    }

    this.clone.wtTable.holder.style.height = overlayRootStyle.height;

    tableWidth = outerWidth(this.clone.wtTable.TABLE);
    overlayRootStyle.width = (tableWidth === 0 ? tableWidth : tableWidth + 4) + 'px';
  }

  /**
   * Adjust overlay root childs size
   */
  adjustRootChildrenSize() {
    let scrollbarWidth = getScrollbarWidth();

    this.clone.wtTable.hider.style.height = this.hider.style.height;
    this.clone.wtTable.holder.style.height = this.clone.wtTable.holder.parentNode.style.height;

    if (scrollbarWidth === 0) {
      scrollbarWidth = 30;
    }
    this.clone.wtTable.holder.style.width = parseInt(this.clone.wtTable.holder.parentNode.style.width, 10) + scrollbarWidth + 'px';
  }

  /**
   * Adjust the overlay dimensions and position
   */
  applyToDOM() {
    let total = this.wot.getSetting('totalColumns');

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
   * Synchronize calculated top position to an element
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
      scrollbarCompensation = getScrollbarWidth();
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
    let preventOverflow = this.wot.getSetting('preventOverflow');
    let offset = 0;

    if (!preventOverflow && this.trimmingContainer === window) {
      offset = this.wot.wtTable.holderOffset.left;
    }

    return offset;
  }

  /**
   * Gets the main overlay's horizontal scroll position
   *
   * @returns {Number} Main table's vertical scroll position
   */
  getScrollPosition() {
    return getScrollLeft(this.mainTableScrollableElement);
  }

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue)
   *
   * @param {Number} position Header X position if trimming container is window or scroll top if not
   */
  adjustHeaderBordersPosition(position) {
    const masterParent = this.wot.wtTable.holder.parentNode;
    const rowHeaders = this.wot.getSetting('rowHeaders');
    const fixedColumnsLeft = this.wot.getSetting('fixedColumnsLeft');
    const totalRows = this.wot.getSetting('totalRows');

    if (totalRows) {
      removeClass(masterParent, 'emptyRows');
    } else {
      addClass(masterParent, 'emptyRows');
    }

    if (fixedColumnsLeft && !rowHeaders.length) {
      addClass(masterParent, 'innerBorderLeft');

    } else if (!fixedColumnsLeft && rowHeaders.length) {
      let previousState = hasClass(masterParent, 'innerBorderLeft');

      if (position) {
        addClass(masterParent, 'innerBorderLeft');
      } else {
        removeClass(masterParent, 'innerBorderLeft');
      }
      if (!previousState && position || previousState && !position) {
        this.wot.wtOverlays.adjustElementsSize();
      }
    }
  }
}

export {WalkontableLeftOverlay};

window.WalkontableLeftOverlay = WalkontableLeftOverlay;

WalkontableOverlay.registerOverlay(WalkontableOverlay.CLONE_LEFT, WalkontableLeftOverlay);
