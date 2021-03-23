import {
  addClass,
  getScrollbarWidth,
  getScrollTop,
  getWindowScrollLeft,
  hasClass,
  outerHeight,
  removeClass,
} from './../../../../helpers/dom/element';
import BottomOverlayTable from './../table/bottom';
import { Overlay } from './_base';
import {
  CLONE_BOTTOM,
} from './constants';

/**
 * @class BottomOverlay
 */
export class BottomOverlay extends Overlay {
  static get OVERLAY_NAME() {
    return CLONE_BOTTOM;
  }

  /**
   * Cached value which holds the previous value of the `fixedRowsBottom` option.
   * It is used as a comparison value that can be used to detect changes in that value.
   *
   * @type {number}
   */
  cachedFixedRowsBottom = -1;

  /**
   * @param {Walkontable} wotInstance The Walkontable instance.
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(CLONE_BOTTOM);
    this.cachedFixedRowsBottom = this.wot.getSetting('fixedRowsBottom');
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {Table}
   */
  createTable(...args) {
    return new BottomOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered() {
    return this.wot.getSetting('shouldRenderBottomOverlay');
  }

  /**
   * Updates the top overlay position.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    if (!this.needFullRender || !this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }

    const overlayRoot = this.clone.wtTable.holder.parentNode;

    overlayRoot.style.top = '';

    let headerPosition = 0;
    const preventOverflow = this.wot.getSetting('preventOverflow');

    if (this.trimmingContainer === this.wot.rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      const { rootDocument, wtTable } = this.wot;
      const hiderRect = wtTable.hider.getBoundingClientRect();
      const bottom = Math.ceil(hiderRect.bottom);
      const bodyHeight = rootDocument.documentElement.clientHeight;
      let finalLeft;
      let finalBottom;

      finalLeft = wtTable.hider.style.left;
      finalLeft = finalLeft === '' ? 0 : finalLeft;

      if (bottom > bodyHeight) {
        finalBottom = (bottom - bodyHeight);
      } else {
        finalBottom = 0;
      }

      headerPosition = finalBottom;
      finalBottom += 'px';

      overlayRoot.style.left = finalLeft;
      overlayRoot.style.bottom = finalBottom;

    } else {
      headerPosition = this.getScrollPosition();
      this.repositionOverlay();
    }

    const positionChanged = this.adjustHeaderBordersPosition(headerPosition);

    this.adjustElementsSize();

    return positionChanged;
  }

  /**
   * Updates the bottom overlay position.
   */
  repositionOverlay() {
    const { wtTable, rootDocument } = this.wot;
    const cloneRoot = this.clone.wtTable.holder.parentNode;
    let scrollbarWidth = getScrollbarWidth(rootDocument);

    if (wtTable.holder.clientHeight === wtTable.holder.offsetHeight) {
      scrollbarWidth = 0;
    }

    cloneRoot.style.bottom = `${scrollbarWidth}px`;
  }

  /**
   * Sets the main overlay's vertical scroll position.
   *
   * @param {number} pos The scroll position.
   * @returns {boolean}
   */
  setScrollPosition(pos) {
    const { rootWindow } = this.wot;
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
   * Triggers onScroll hook callback.
   */
  onScroll() {
    this.wot.getSetting('onScrollHorizontally');
  }

  /**
   * Calculates total sum cells height.
   *
   * @param {number} from Row index which calculates started from.
   * @param {number} to Row index where calculation is finished.
   * @returns {number} Height sum.
   */
  sumCellSizes(from, to) {
    const { wtTable, wtSettings } = this.wot;
    const defaultRowHeight = wtSettings.settings.defaultRowHeight;
    let row = from;
    let sum = 0;

    while (row < to) {
      const height = wtTable.getRowHeight(row);

      sum += height === void 0 ? defaultRowHeight : height;
      row += 1;
    }

    return sum;
  }

  /**
   * Adjust overlay root element, childs and master table element sizes (width, height).
   *
   * @param {boolean} [force=false] When `true`, it adjusts the DOM nodes sizes for that overlay.
   */
  adjustElementsSize(force = false) {
    this.updateTrimmingContainer();

    if (this.needFullRender || force) {
      this.adjustRootElementSize();
      this.adjustRootChildrenSize();
    }
  }

  /**
   * Adjust overlay root element size (width and height).
   */
  adjustRootElementSize() {
    const { wtTable, wtViewport, rootWindow } = this.wot;
    const scrollbarWidth = getScrollbarWidth(this.wot.rootDocument);
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    const overlayRootStyle = overlayRoot.style;
    const preventOverflow = this.wot.getSetting('preventOverflow');

    if (this.trimmingContainer !== rootWindow || preventOverflow === 'horizontal') {
      let width = wtViewport.getWorkspaceWidth();

      if (this.wot.wtOverlays.hasScrollbarRight) {
        width -= scrollbarWidth;
      }

      width = Math.min(width, wtTable.wtRootElement.scrollWidth);
      overlayRootStyle.width = `${width}px`;

    } else {
      overlayRootStyle.width = '';
    }

    this.clone.wtTable.holder.style.width = overlayRootStyle.width;

    let tableHeight = outerHeight(this.clone.wtTable.TABLE);

    if (!this.wot.wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRootStyle.height = `${tableHeight}px`;
  }

  /**
   * Adjust overlay root childs size.
   */
  adjustRootChildrenSize() {
    const { holder } = this.clone.wtTable;

    this.clone.wtTable.hider.style.width = this.hider.style.width;
    holder.style.width = holder.parentNode.style.width;
    holder.style.height = holder.parentNode.style.height;
  }

  /**
   * Adjust the overlay dimensions and position.
   */
  applyToDOM() {
    const total = this.wot.getSetting('totalRows');

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
   * Synchronize calculated left position to an element.
   */
  syncOverlayOffset() {
    if (typeof this.wot.wtViewport.columnsRenderCalculator.startPosition === 'number') {
      this.clone.wtTable.spreader.style.left = `${this.wot.wtViewport.columnsRenderCalculator.startPosition}px`;

    } else {
      this.clone.wtTable.spreader.style.left = '';
    }
  }

  /**
   * Scrolls vertically to a row.
   *
   * @param {number} sourceRow Row index which you want to scroll to.
   * @param {boolean} [bottomEdge=false] If `true`, scrolls according to the bottom edge (top edge is by default).
   */
  scrollTo(sourceRow, bottomEdge) {
    let newY = this.getTableParentOffset();
    const sourceInstance = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
    const mainHolder = sourceInstance.wtTable.holder;
    let scrollbarCompensation = 0;

    if (bottomEdge && mainHolder.offsetHeight !== mainHolder.clientHeight) {
      scrollbarCompensation = getScrollbarWidth(this.wot.rootDocument);
    }

    if (bottomEdge) {
      newY += this.sumCellSizes(0, sourceRow + 1);
      newY -= this.wot.wtViewport.getViewportHeight();
      // Fix 1 pixel offset when cell is selected
      newY += 1;

    } else {
      newY += this.sumCellSizes(this.wot.getSetting('fixedRowsBottom'), sourceRow);
    }
    newY += scrollbarCompensation;

    this.setScrollPosition(newY);
  }

  /**
   * Gets table parent top position.
   *
   * @returns {number}
   */
  getTableParentOffset() {
    if (this.mainTableScrollableElement === this.wot.rootWindow) {
      return this.wot.wtTable.holderOffset.top;
    }

    return 0;
  }

  /**
   * Gets the main overlay's vertical scroll position.
   *
   * @returns {number} Main table's vertical scroll position.
   */
  getScrollPosition() {
    return getScrollTop(this.mainTableScrollableElement, this.wot.rootWindow);
  }

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue).
   *
   * @param {number} position Header Y position if trimming container is window or scroll top if not.
   * @returns {boolean}
   */
  adjustHeaderBordersPosition(position) {
    const fixedRowsBottom = this.wot.getSetting('fixedRowsBottom');
    const areFixedRowsBottomChanged = this.cachedFixedRowsBottom !== fixedRowsBottom;
    const columnHeaders = this.wot.getSetting('columnHeaders');
    let positionChanged = false;

    if ((areFixedRowsBottomChanged || fixedRowsBottom === 0) && columnHeaders.length > 0) {
      const masterParent = this.wot.wtTable.holder.parentNode;
      const previousState = hasClass(masterParent, 'innerBorderBottom');

      this.cachedFixedRowsBottom = this.wot.getSetting('fixedRowsBottom');

      if (position || this.wot.getSetting('totalRows') === 0) {
        addClass(masterParent, 'innerBorderBottom');
        positionChanged = !previousState;
      } else {
        removeClass(masterParent, 'innerBorderBottom');
        positionChanged = previousState;
      }
    }

    return positionChanged;
  }
}
