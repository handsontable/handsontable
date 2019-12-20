import {
  addClass,
  getScrollbarWidth,
  getScrollTop,
  getWindowScrollLeft,
  hasClass,
  outerHeight,
  removeClass,
  resetCssTransform
} from './../../../../helpers/dom/element';
import BottomOverlayTable from './../table/bottom';
import Overlay from './_base';

/**
 * @class BottomOverlay
 */
class BottomOverlay extends Overlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(Overlay.CLONE_BOTTOM);
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor
   * @returns {Table}
   */
  createTable(...args) {
    return new BottomOverlayTable(...args);
  }

  /**
   *
   */
  repositionOverlay() {
    const { wtTable, rootDocument } = this.master;
    const overlayRoot = this.clone.wtTable.wtRootElement;
    let scrollbarWidth = getScrollbarWidth(rootDocument);

    if (wtTable.holder.clientHeight === wtTable.holder.offsetHeight) {
      scrollbarWidth = 0;
    }

    overlayRoot.style.top = '';
    overlayRoot.style.bottom = `${scrollbarWidth}px`;
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    /* eslint-disable no-unneeded-ternary */
    return this.master.getSetting('fixedRowsBottom') ? true : false;
  }

  /**
   * Updates the top overlay position
   */
  resetFixedPosition() {
    if (!this.needFullRender || !this.master.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }

    const overlayRoot = this.clone.wtTable.wtRootElement;
    let headerPosition = 0;
    overlayRoot.style.top = '';
    const preventOverflow = this.master.getSetting('preventOverflow');

    if (this.trimmingContainer === this.master.rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      const { rootDocument, wtTable } = this.master;
      const box = wtTable.hider.getBoundingClientRect();
      const bottom = Math.ceil(box.bottom);
      let finalLeft;
      let finalBottom;
      const bodyHeight = rootDocument.body.offsetHeight;

      finalLeft = wtTable.hider.style.left;
      finalLeft = finalLeft === '' ? 0 : finalLeft;

      if (bottom > bodyHeight) {
        finalBottom = (bottom - bodyHeight);
      } else {
        finalBottom = 0;
      }
      headerPosition = finalBottom;
      finalBottom += 'px';

      overlayRoot.style.top = '';
      overlayRoot.style.left = finalLeft;
      overlayRoot.style.bottom = finalBottom;

    } else {
      headerPosition = this.getScrollPosition();
      resetCssTransform(overlayRoot);
      this.repositionOverlay();
    }
    this.adjustHeaderBordersPosition(headerPosition);
    this.adjustElementsSize();
  }

  /**
   * Sets the main overlay's vertical scroll position
   *
   * @param {Number} pos
   */
  setScrollPosition(pos) {
    const { rootWindow } = this.master;
    let result = false;

    if (this.mainTableScrollableElement === rootWindow) {
      rootWindow.scrollTo(getWindowScrollLeft(rootWindow), pos);
      result = true;

    } else if (this.mainTableScrollableElement.scrollTop !== pos) {
      this.mainTableScrollableElement.scrollTop = pos;
      result = true;
    }

    return result;
  }

  /**
   * Triggers onScroll hook callback
   */
  onScroll() {
    this.master.getSetting('onScrollHorizontally');
  }

  /**
   * Calculates total sum cells height
   *
   * @param {Number} from Row index which calculates started from
   * @param {Number} to Row index where calculation is finished
   * @returns {Number} Height sum
   */
  sumCellSizes(from, to) {
    const { wtSettings } = this.master;
    const defaultRowHeight = wtSettings.settings.defaultRowHeight;
    let row = from;
    let sum = 0;

    while (row < to) {
      const height = this.master.rowUtils.getHeight(row);

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
  adjustElementsSize(force = false) {
    this.updateTrimmingContainer();

    if (this.needFullRender || force) {
      this.adjustRootElementSize();

      if (!force) {
        this.areElementSizesAdjusted = true;
      }
    }
  }

  /**
   * Adjust the width and height of the overlay root element and its children (hider, holder) to the dimensions of the trimming container.
   */
  adjustRootElementSize() {
    const { wtTable, wtViewport, rootWindow } = this.master;
    const scrollbarWidth = getScrollbarWidth(this.master.rootDocument);
    const overlayRoot = this.clone.wtTable.wtRootElement;
    const overlayRootStyle = overlayRoot.style;
    const preventOverflow = this.master.getSetting('preventOverflow');

    if (this.trimmingContainer !== rootWindow || preventOverflow === 'horizontal') {
      let width = wtViewport.getWorkspaceWidth();

      if (this.master.wtOverlays.hasScrollbarRight) {
        width -= scrollbarWidth;
      }

      width = Math.min(width, wtTable.wtRootElement.scrollWidth);
      overlayRootStyle.width = `${width}px`;

    } else {
      overlayRootStyle.width = '';
    }

    let tableHeight = outerHeight(this.clone.wtTable.TABLE);

    if (!this.master.wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRootStyle.height = `${tableHeight}px`;

    const { holder, hider, wtRootElement } = this.clone.wtTable;

    hider.style.width = this.hider.style.width;
    holder.style.width = wtRootElement.style.width;
    holder.style.height = wtRootElement.style.height;
  }

  /**
   * Adjust the overlay dimensions and position
   */
  applyToDOM() {
    const total = this.master.getSetting('totalRows');

    if (!this.areElementSizesAdjusted) {
      this.adjustElementsSize();
    }
    if (typeof this.master.wtViewport.rowsRenderCalculator.startPosition === 'number') {
      this.spreader.style.top = `${this.master.wtViewport.rowsRenderCalculator.startPosition}px`;

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
    if (typeof this.master.wtViewport.columnsRenderCalculator.startPosition === 'number') {
      this.clone.wtTable.spreader.style.left = `${this.master.wtViewport.columnsRenderCalculator.startPosition}px`;

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
    const mainHolder = this.master.wtTable.holder;
    let scrollbarCompensation = 0;

    if (bottomEdge && mainHolder.offsetHeight !== mainHolder.clientHeight) {
      scrollbarCompensation = getScrollbarWidth(this.master.rootDocument);
    }

    if (bottomEdge) {
      newY += this.sumCellSizes(0, sourceRow + 1);
      newY -= this.master.wtViewport.getViewportHeight();
      // Fix 1 pixel offset when cell is selected
      newY += 1;

    } else {
      newY += this.sumCellSizes(this.master.getSetting('fixedRowsBottom'), sourceRow);
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
    if (this.mainTableScrollableElement === this.master.rootWindow) {
      return this.master.wtTable.holderOffset.top;
    }

    return 0;
  }

  /**
   * Gets the main overlay's vertical scroll position
   *
   * @returns {Number} Main table's vertical scroll position
   */
  getScrollPosition() {
    return getScrollTop(this.mainTableScrollableElement, this.master.rootWindow);
  }

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue)
   *
   * @param {Number} position Header Y position if trimming container is window or scroll top if not
   */
  adjustHeaderBordersPosition(position) {
    if (this.master.getSetting('fixedRowsBottom') === 0 && this.master.getSetting('columnHeaders').length > 0) {
      const masterParent = this.master.wtTable.wtRootElement;
      const previousState = hasClass(masterParent, 'innerBorderTop');

      if (position) {
        addClass(masterParent, 'innerBorderTop');
      } else {
        removeClass(masterParent, 'innerBorderTop');
      }
      if (!previousState && position || previousState && !position) {
        this.master.wtOverlays.adjustElementsSize();
      }
    }
    // nasty workaround for double border in the header, TODO: find a pure-css solution
    if (this.master.getSetting('rowHeaders').length === 0) {
      const secondHeaderCell = this.clone.wtTable.THEAD.querySelector('th:nth-of-type(2)');

      if (secondHeaderCell) {
        secondHeaderCell.style['border-left-width'] = 0;
      }
    }
  }
}

Overlay.registerOverlay(Overlay.CLONE_BOTTOM, BottomOverlay);

export default BottomOverlay;
