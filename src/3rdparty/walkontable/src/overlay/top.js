import {
  addClass,
  getScrollbarWidth,
  getScrollTop,
  getWindowScrollLeft,
  hasClass,
  outerHeight,
  innerWidth,
  removeClass,
  setOverlayPosition,
  resetCssTransform
} from './../../../../helpers/dom/element';
import Overlay from './_base';

/**
 * @class TopOverlay
 */
class TopOverlay extends Overlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(Overlay.CLONE_TOP);
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    return !!(this.wot.getSetting('fixedRowsTop') || this.wot.getSetting('columnHeaders').length);
  }

  /**
   * Updates the top overlay position
   */
  resetFixedPosition() {
    if (!this.needFullRender || !this.wot.wtTable.holder.parentNode) {
      this.clone.wtTable.wtRootElement.style.width = '0';
      // removed from DOM
      return;
    }

    this.clone.wtTable.wtRootElement.style.width = 'auto';

    this.adjustElementsSize();
  }

  /**
   * Sets the main overlay's vertical scroll position
   *
   * @param {Number} pos
   */
  setScrollPosition(pos) {
    if (this.mainTableScrollableElement === window) {
      window.scrollTo(getWindowScrollLeft(), pos);

    } else {
      this.mainTableScrollableElement.scrollTop = pos;
    }
  }

  /**
   * Triggers onScroll hook callback
   */
  onScroll() {
    this.wot.getSetting('onScrollHorizontally');
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
      let height = this.wot.wtTable.getRowHeight(from);

      sum += height === void 0 ? defaultRowHeight : height;
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
    let wtOverlays = this.wot.wtOverlays;
    let scrollbarWidth = this.wot.wtTable.wtRootElement.offsetHeight >= wtOverlays.scrollResizerY.offsetHeight ? 0 : getScrollbarWidth();
    let overlayRoot = this.clone.wtTable.holder.parentNode;
    let overlayRootStyle = overlayRoot.style;
    let preventOverflow = this.wot.getSetting('preventOverflow');
    let tableHeight;

    if (scrollbarWidth) {
      this.wot.wtTable.wtRootElement.parentNode.style.paddingRight += `${scrollbarWidth}px`;
    }

    if (this.trimmingContainer !== window || preventOverflow === 'horizontal') {
      let width = this.wot.wtViewport.getWorkspaceWidth() - scrollbarWidth;

      width = Math.min(width, innerWidth(this.wot.wtTable.wtRootElement));

      overlayRootStyle.width = `${width}px`;

    } else {
      overlayRootStyle.width = '';
    }

    this.clone.wtTable.holder.style.width = overlayRootStyle.width;

    tableHeight = outerHeight(this.clone.wtTable.TABLE);
    overlayRootStyle.height = `${tableHeight}px`;
  }

  /**
   * Adjust overlay root childs size
   */
  adjustRootChildrenSize() {
    this.clone.wtTable.hider.style.width = this.hider.style.width;
  }

  /**
   * Adjust the overlay dimensions and position
   */
  applyToDOM() {
    let total = this.wot.getSetting('totalRows');

    if (!this.areElementSizesAdjusted) {
      this.adjustElementsSize();
    }
    if (typeof this.wot.wtViewport.rowsRenderCalculator.startPosition === 'number') {
      this.spreader.style.top = `${this.wot.wtViewport.rowsRenderCalculator.startPosition}px`;

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
   * Synchronize calculated left position to an element
   */
  syncOverlayOffset() {
    if (typeof this.wot.wtViewport.columnsRenderCalculator.startPosition === 'number') {
      this.clone.wtTable.spreader.style.left = `${this.wot.wtViewport.columnsRenderCalculator.startPosition}px`;

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
    let wtOverlays = this.wot.wtOverlays;
    let scrollbarCompensation = 0;

    if (bottomEdge && wtOverlays.scrollableElement.offsetHeight !== wtOverlays.scrollResizerY.clientHeight) {
      scrollbarCompensation = getScrollbarWidth();
    }

    if (bottomEdge) {
      let fixedRowsBottom = this.wot.getSetting('fixedRowsBottom');
      let fixedRowsTop = this.wot.getSetting('fixedRowsTop');
      let totalRows = this.wot.getSetting('totalRows');

      newY += this.sumCellSizes(0, sourceRow + 1);
      newY -= this.wot.wtViewport.getViewportHeight() - this.sumCellSizes(totalRows - fixedRowsBottom, totalRows);
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

    }
    return 0;

  }

  /**
   * Gets the main overlay's vertical scroll position
   *
   * @returns {Number} Main table's vertical scroll position
   */
  getScrollPosition() {
    var element = document.querySelector('.scroll-overlay');

    if (!element) {
      element = this.mainTableScrollableElement;
    }

    return getScrollTop(element);
  }

  /**
   * Redraw borders of selection
   *
   * @param {WalkontableSelection} selection Selection for redraw
   */
  redrawSelectionBorders(selection) {
    if (selection && selection.cellRange) {
      const border = selection.getBorder(this.wot);

      if (border) {
        const corners = selection.getCorners();
        border.disappear();
        border.appear(corners);
      }
    }
  }

  /**
   * Redrawing borders of all selections
   */
  redrawAllSelectionsBorders() {
    const selections = this.wot.selections;

    this.redrawSelectionBorders(selections.current);
    this.redrawSelectionBorders(selections.area);
    this.redrawSelectionBorders(selections.fill);
    this.wot.wtTable.wot.wtOverlays.leftOverlay.refresh();
  }
}

Overlay.registerOverlay(Overlay.CLONE_TOP, TopOverlay);

export default TopOverlay;
