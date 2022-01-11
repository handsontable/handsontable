import {
  addClass,
  getScrollbarWidth,
  getScrollTop,
  getWindowScrollLeft,
  hasClass,
  outerHeight,
  removeClass,
  setOverlayPosition,
  resetCssTransform,
} from '../../../../helpers/dom/element';
import TopOverlayTable from './../table/top';
import { Overlay } from './_base';
import {
  CLONE_TOP,
} from './constants';

/**
 * @class TopOverlay
 */
export class TopOverlay extends Overlay {
  /**
   * Cached value which holds the previous value of the `fixedRowsTop` option.
   * It is used as a comparison value that can be used to detect changes in this value.
   *
   * @type {number}
   */
  cachedFixedRowsTop = -1;

  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {DomBindings} domBindings Dom elements bound to the current instance.
   */
  constructor(wotInstance, facadeGetter, wtSettings, domBindings) {
    super(wotInstance, facadeGetter, CLONE_TOP, wtSettings, domBindings);
    this.cachedFixedRowsTop = this.wtSettings.getSetting('fixedRowsTop');
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {TopOverlayTable}
   */
  createTable(...args) {
    return new TopOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered() {
    return this.wtSettings.getSetting('shouldRenderTopOverlay');
  }

  /**
   * Updates the top overlay position.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    if (!this.needFullRender || !this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return false;
    }

    const { rootWindow } = this.domBindings;
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    let headerPosition = 0;
    let skipInnerBorderAdjusting = false;

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      const { wtTable } = this.wot;
      const hiderRect = wtTable.hider.getBoundingClientRect();
      const top = Math.ceil(hiderRect.top);
      const bottom = Math.ceil(hiderRect.bottom);
      const rootHeight = overlayRoot.offsetHeight;

      // This checks if the overlay is going to an infinite loop caused by added (or removed)
      // `innerBorderTop` class name. Toggling the class name shifts the viewport by 1px and
      // triggers the `scroll` event. It causes the table to render. The new render cycle takes into,
      // account the shift and toggles the class name again. This causes the next loops. This
      // happens only on Chrome (#7256).
      //
      // When we detect that the table bottom position is the same as the overlay bottom,
      // do not toggle the class name.
      //
      // This workaround will be able to be cleared after merging the SVG borders, which introduces
      // frozen lines (no more `innerBorderTop` workaround).
      skipInnerBorderAdjusting = bottom === rootHeight;

      let finalTop = 0;

      if (top < 0 && (bottom - rootHeight) > 0) {
        finalTop = -top;
      }

      headerPosition = finalTop;
      setOverlayPosition(overlayRoot, '0px', `${finalTop}px`);

    } else {
      headerPosition = this.getScrollPosition();
      resetCssTransform(overlayRoot);
    }

    const positionChanged = this.adjustHeaderBordersPosition(headerPosition, skipInnerBorderAdjusting);

    this.adjustElementsSize();

    return positionChanged;
  }

  /**
   * Sets the main overlay's vertical scroll position.
   *
   * @param {number} pos The scroll position.
   * @returns {boolean}
   */
  setScrollPosition(pos) {
    const rootWindow = this.domBindings.rootWindow;
    let result = false;

    if (this.mainTableScrollableElement === rootWindow && rootWindow.scrollY !== pos) {
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
    this.wtSettings.getSetting('onScrollHorizontally');
  }

  /**
   * Calculates total sum cells height.
   *
   * @param {number} from Row index which calculates started from.
   * @param {number} to Row index where calculation is finished.
   * @returns {number} Height sum.
   */
  sumCellSizes(from, to) {
    const defaultRowHeight = this.wtSettings.getSetting('defaultRowHeight');
    let row = from;
    let sum = 0;

    while (row < to) {
      const height = this.wot.wtTable.getRowHeight(row);

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
    const { wtTable } = this.wot;
    const { rootDocument, rootWindow } = this.domBindings;
    const scrollbarWidth = getScrollbarWidth(rootDocument);
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    const overlayRootStyle = overlayRoot.style;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');

    if (this.trimmingContainer !== rootWindow || preventOverflow === 'horizontal') {
      let width = this.wot.wtViewport.getWorkspaceWidth();

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
    const { selections } = this.wot;
    const facade = this.facadeGetter();
    const selectionCornerOffset = Math.abs(selections?.getCell().getBorder(facade).cornerCenterPointOffset ?? 0);

    this.clone.wtTable.hider.style.width = this.hider.style.width;
    holder.style.width = holder.parentNode.style.width;
    // Add selection corner protruding part to the holder total height to make sure that
    // borders' corner won't be cut after vertical scroll (#6937).
    holder.style.height = `${parseInt(holder.parentNode.style.height, 10) + selectionCornerOffset}px`;
  }

  /**
   * Adjust the overlay dimensions and position.
   */
  applyToDOM() {
    const total = this.wtSettings.getSetting('totalRows');

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
    const styleProperty = this.isRtl() ? 'right' : 'left';
    const { spreader } = this.clone.wtTable;

    if (typeof this.wot.wtViewport.columnsRenderCalculator.startPosition === 'number') {
      spreader.style[styleProperty] = `${this.wot.wtViewport.columnsRenderCalculator.startPosition}px`;

    } else {
      spreader.style[styleProperty] = '';
    }
  }

  /**
   * Scrolls vertically to a row.
   *
   * @param {number} sourceRow Row index which you want to scroll to.
   * @param {boolean} [bottomEdge] If `true`, scrolls according to the bottom edge (top edge is by default).
   * @returns {boolean}
   */
  scrollTo(sourceRow, bottomEdge) {
    const { wot, wtSettings } = this;
    const sourceInstance = wot.cloneSource ? wot.cloneSource : wot;
    const mainHolder = sourceInstance.wtTable.holder;
    let newY = this.getTableParentOffset();
    let scrollbarCompensation = 0;

    if (bottomEdge && mainHolder.offsetHeight !== mainHolder.clientHeight) {
      scrollbarCompensation = getScrollbarWidth(this.domBindings.rootDocument);
    }

    if (bottomEdge) {
      const fixedRowsBottom = wtSettings.getSetting('fixedRowsBottom');
      const totalRows = wtSettings.getSetting('totalRows');

      newY += this.sumCellSizes(0, sourceRow + 1);
      newY -= wot.wtViewport.getViewportHeight() - this.sumCellSizes(totalRows - fixedRowsBottom, totalRows);
      // Fix 1 pixel offset when cell is selected
      newY += 1;

    } else {
      newY += this.sumCellSizes(wtSettings.getSetting('fixedRowsTop'), sourceRow);
    }
    newY += scrollbarCompensation;

    return this.setScrollPosition(newY);
  }

  /**
   * Gets table parent top position.
   *
   * @returns {number}
   */
  getTableParentOffset() {
    if (this.mainTableScrollableElement === this.domBindings.rootWindow) {
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
    return getScrollTop(this.mainTableScrollableElement, this.domBindings.rootWindow);
  }

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue).
   *
   * @param {number} position Header Y position if trimming container is window or scroll top if not.
   * @param {boolean} [skipInnerBorderAdjusting=false] If `true` the inner border adjusting will be skipped.
   * @returns {boolean}
   */
  adjustHeaderBordersPosition(position, skipInnerBorderAdjusting = false) {
    const masterParent = this.wot.wtTable.holder.parentNode;
    const totalColumns = this.wtSettings.getSetting('totalColumns');

    if (totalColumns) {
      removeClass(masterParent, 'emptyColumns');
    } else {
      addClass(masterParent, 'emptyColumns');
    }

    let positionChanged = false;

    if (!skipInnerBorderAdjusting) {
      const fixedRowsTop = this.wtSettings.getSetting('fixedRowsTop');
      const areFixedRowsTopChanged = this.cachedFixedRowsTop !== fixedRowsTop;
      const columnHeaders = this.wtSettings.getSetting('columnHeaders');

      if ((areFixedRowsTopChanged || fixedRowsTop === 0) && columnHeaders.length > 0) {
        const previousState = hasClass(masterParent, 'innerBorderTop');

        this.cachedFixedRowsTop = this.wtSettings.getSetting('fixedRowsTop');

        if (position || this.wtSettings.getSetting('totalRows') === 0) {
          addClass(masterParent, 'innerBorderTop');
          positionChanged = !previousState;
        } else {
          removeClass(masterParent, 'innerBorderTop');
          positionChanged = previousState;
        }
      }
    }

    return positionChanged;
  }
}
