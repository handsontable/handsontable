import {
  addClass,
  getScrollbarWidth,
  getScrollLeft,
  getWindowScrollTop,
  hasClass,
  outerWidth,
  removeClass,
  setOverlayPosition,
  resetCssTransform,
} from './../../../../helpers/dom/element';
import LeftOverlayTable from './../table/left';
import Overlay from './_base';

/**
 * @class LeftOverlay
 */
class LeftOverlay extends Overlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(Overlay.CLONE_LEFT);
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor
   * @returns {Table}
   */
  createTable(...args) {
    return new LeftOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    return !!(this.wot.getSetting('fixedColumnsLeft') || this.wot.getSetting('rowHeaders').length);
  }

  /**
   * Updates the left overlay position.
   */
  resetFixedPosition() {
    const { wtTable } = this.wot;
    if (!this.needFullRender || !wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    let headerPosition = 0;
    const preventOverflow = this.wot.getSetting('preventOverflow');

    if (this.trimmingContainer === this.wot.rootWindow && (!preventOverflow || preventOverflow !== 'horizontal')) {
      const box = wtTable.hider.getBoundingClientRect();
      const left = Math.ceil(box.left);
      const right = Math.ceil(box.right);
      let finalLeft;
      let finalTop;

      finalTop = wtTable.hider.style.top;
      finalTop = finalTop === '' ? 0 : finalTop;

      if (left < 0 && (right - overlayRoot.offsetWidth) > 0) {
        finalLeft = -left;
      } else {
        finalLeft = 0;
      }
      headerPosition = finalLeft;
      finalLeft += 'px';

      setOverlayPosition(overlayRoot, finalLeft, finalTop);

    } else {
      headerPosition = this.getScrollPosition();
      resetCssTransform(overlayRoot);
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
  setScrollPosition(pos) {
    const { rootWindow } = this.wot;
    let result = false;

    if (this.mainTableScrollableElement === rootWindow && rootWindow.scrollX !== pos) {
      rootWindow.scrollTo(pos, getWindowScrollTop(rootWindow));
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
  onScroll() {
    this.wot.getSetting('onScrollVertically');
  }

  /**
   * Calculates total sum cells width.
   *
   * @param {Number} from Column index which calculates started from.
   * @param {Number} to Column index where calculation is finished.
   * @returns {Number} Width sum.
   */
  sumCellSizes(from, to) {
    const defaultColumnWidth = this.wot.wtSettings.defaultColumnWidth;
    let column = from;
    let sum = 0;

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
    const { wtTable, rootDocument, rootWindow } = this.wot;
    const scrollbarHeight = getScrollbarWidth(rootDocument);
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    const overlayRootStyle = overlayRoot.style;
    const preventOverflow = this.wot.getSetting('preventOverflow');

    if (this.trimmingContainer !== rootWindow || preventOverflow === 'vertical') {
      let height = this.wot.wtViewport.getWorkspaceHeight();

      if (this.wot.wtOverlays.hasScrollbarBottom) {
        height -= scrollbarHeight;
      }

      height = Math.min(height, wtTable.wtRootElement.scrollHeight);
      overlayRootStyle.height = `${height}px`;

    } else {
      overlayRootStyle.height = '';
    }

    this.clone.wtTable.holder.style.height = overlayRootStyle.height;

    const tableWidth = outerWidth(this.clone.wtTable.TABLE);

    overlayRootStyle.width = `${tableWidth === 0 ? tableWidth : tableWidth + 4}px`;
  }

  /**
   * Adjust overlay root childs size.
   */
  adjustRootChildrenSize() {
    let scrollbarWidth = getScrollbarWidth(this.wot.rootDocument);

    this.clone.wtTable.hider.style.height = this.hider.style.height;
    this.clone.wtTable.holder.style.height = this.clone.wtTable.holder.parentNode.style.height;

    if (scrollbarWidth === 0) {
      scrollbarWidth = 30;
    }
    this.clone.wtTable.holder.style.width = `${parseInt(this.clone.wtTable.holder.parentNode.style.width, 10) + scrollbarWidth}px`;
  }

  /**
   * Adjust the overlay dimensions and position.
   */
  applyToDOM() {
    const total = this.wot.getSetting('totalColumns');

    if (!this.areElementSizesAdjusted) {
      this.adjustElementsSize();
    }
    if (typeof this.wot.wtViewport.columnsRenderCalculator.startPosition === 'number') {
      this.spreader.style.left = `${this.wot.wtViewport.columnsRenderCalculator.startPosition}px`;

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
  syncOverlayOffset() {
    if (typeof this.wot.wtViewport.rowsRenderCalculator.startPosition === 'number') {
      this.clone.wtTable.spreader.style.top = `${this.wot.wtViewport.rowsRenderCalculator.startPosition}px`;

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
  scrollTo(sourceCol, beyondRendered) {
    let newX = this.getTableParentOffset();
    const sourceInstance = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
    const mainHolder = sourceInstance.wtTable.holder;
    let scrollbarCompensation = 0;

    if (beyondRendered && mainHolder.offsetWidth !== mainHolder.clientWidth) {
      scrollbarCompensation = getScrollbarWidth(this.wot.rootDocument);
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
  getTableParentOffset() {
    const preventOverflow = this.wot.getSetting('preventOverflow');
    let offset = 0;

    if (!preventOverflow && this.trimmingContainer === this.wot.rootWindow) {
      offset = this.wot.wtTable.holderOffset.left;
    }

    return offset;
  }

  /**
   * Gets the main overlay's horizontal scroll position.
   *
   * @returns {Number} Main table's vertical scroll position.
   */
  getScrollPosition() {
    return getScrollLeft(this.mainTableScrollableElement, this.wot.rootWindow);
  }

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue).
   *
   * @param {Number} position Header X position if trimming container is window or scroll top if not.
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
      const previousState = hasClass(masterParent, 'innerBorderLeft');

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

Overlay.registerOverlay(Overlay.CLONE_LEFT, LeftOverlay);

export default LeftOverlay;
