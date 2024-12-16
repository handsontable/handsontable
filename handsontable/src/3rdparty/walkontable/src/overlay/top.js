import {
  addClass,
  getMaximumScrollTop,
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
import { getCornerStyle } from '../selection';
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
    if (!this.needFullRender || !this.shouldBeRendered() || !this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return false;
    }

    const overlayRoot = this.clone.wtTable.holder.parentNode;
    const { rootWindow } = this.domBindings;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    let overlayPosition = 0;
    let skipInnerBorderAdjusting = false;

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      const { wtTable } = this.wot;
      const hiderRect = wtTable.hider.getBoundingClientRect();
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
      overlayPosition = this.getOverlayOffset();

      setOverlayPosition(overlayRoot, '0px', `${overlayPosition}px`);

    } else {
      overlayPosition = this.getScrollPosition();
      resetCssTransform(overlayRoot);
    }

    const positionChanged = this.adjustHeaderBordersPosition(overlayPosition, skipInnerBorderAdjusting);

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
    const defaultRowHeight = this.wot.stylesHandler.getDefaultRowHeight();
    let row = from;
    let sum = 0;

    while (row < to) {
      const height = this.wot.wtTable.getRowHeight(row);

      sum += height === undefined ? defaultRowHeight : height;
      row += 1;
    }

    return sum;
  }

  /**
   * Adjust overlay root element, children and master table element sizes (width, height).
   */
  adjustElementsSize() {
    this.updateTrimmingContainer();

    if (this.needFullRender) {
      this.adjustRootElementSize();
      this.adjustRootChildrenSize();
    }
  }

  /**
   * Adjust overlay root element size (width and height).
   */
  adjustRootElementSize() {
    const { wtTable, wtViewport } = this.wot;
    const { rootDocument, rootWindow } = this.domBindings;
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    const overlayRootStyle = overlayRoot.style;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');

    if (this.trimmingContainer !== rootWindow || preventOverflow === 'horizontal') {
      let width = wtViewport.getWorkspaceWidth();

      if (wtViewport.hasVerticalScroll()) {
        width -= getScrollbarWidth(rootDocument);
      }

      width = Math.min(width, wtTable.wtRootElement.scrollWidth);
      overlayRootStyle.width = `${width}px`;

    } else {
      overlayRootStyle.width = '';
    }

    this.clone.wtTable.holder.style.width = overlayRootStyle.width;

    let tableHeight = outerHeight(this.clone.wtTable.TABLE);

    if (!wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRootStyle.height = `${tableHeight}px`;
  }

  /**
   * Adjust overlay root childs size.
   */
  adjustRootChildrenSize() {
    const { holder } = this.clone.wtTable;
    const cornerStyle = getCornerStyle(this.wot);
    const selectionCornerOffset = this.wot.selectionManager
      .getFocusSelection() ? parseInt(cornerStyle.height, 10) / 2 : 0;

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
    const columnHeaders = wtSettings.getSetting('columnHeaders');
    const fixedRowsTop = wtSettings.getSetting('fixedRowsTop');
    const columnHeaderBorderCompensation = (
      fixedRowsTop === 0 &&
      columnHeaders.length > 0 &&
      !hasClass(mainHolder.parentNode, 'innerBorderTop')
    ) ? 1 : 0;
    let newY = this.getTableParentOffset();
    let scrollbarCompensation = 0;

    if (bottomEdge) {
      const rowHeight = this.wot.wtTable.getRowHeight(sourceRow);
      const viewportHeight = this.wot.wtViewport.getViewportHeight();

      if (rowHeight > viewportHeight) {
        bottomEdge = false;
      }
    }

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
      // Compensate for the bottom header border if scrolled from the absolute top.
      newY += columnHeaderBorderCompensation;

    } else {
      newY += this.sumCellSizes(wtSettings.getSetting('fixedRowsTop'), sourceRow);
    }

    newY += scrollbarCompensation;

    // If the table is scrolled all the way up when starting the scroll and going to be scrolled to the bottom,
    // we need to compensate for the potential header bottom border height.
    if (
      getMaximumScrollTop(this.mainTableScrollableElement) === newY - columnHeaderBorderCompensation &&
      columnHeaderBorderCompensation > 0
    ) {
      this.wot.wtOverlays.expandHiderVerticallyBy(columnHeaderBorderCompensation);
    }

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
   * Gets the main overlay's vertical overlay offset.
   *
   * @returns {number} Main table's vertical overlay offset.
   */
  getOverlayOffset() {
    const { rootWindow } = this.domBindings;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    let overlayOffset = 0;

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      const rootHeight = this.wot.wtTable.getTotalHeight();
      const overlayRootHeight = this.clone.wtTable.getTotalHeight();
      const maxOffset = rootHeight - overlayRootHeight;

      overlayOffset = Math.max(this.getScrollPosition() - this.getTableParentOffset(), 0);

      if (overlayOffset > maxOffset) {
        overlayOffset = 0;
      }
    }

    return overlayOffset;
  }

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue).
   *
   * @param {number} position Header Y position if trimming container is window or scroll top if not.
   * @param {boolean} [skipInnerBorderAdjusting=false] If `true` the inner border adjusting will be skipped.
   * @returns {boolean}
   */
  adjustHeaderBordersPosition(position, skipInnerBorderAdjusting = false) {
    const { wtSettings } = this;
    const masterParent = this.wot.wtTable.holder.parentNode;
    const totalColumns = wtSettings.getSetting('totalColumns');
    const preventHorizontalOverflow = wtSettings.getSetting('preventOverflow') === 'horizontal';

    if (totalColumns) {
      removeClass(masterParent, 'emptyColumns');
    } else {
      addClass(masterParent, 'emptyColumns');
    }

    let positionChanged = false;

    if (!skipInnerBorderAdjusting && !preventHorizontalOverflow) {
      const fixedRowsTop = wtSettings.getSetting('fixedRowsTop');
      const areFixedRowsTopChanged = this.cachedFixedRowsTop !== fixedRowsTop;
      const columnHeaders = wtSettings.getSetting('columnHeaders');

      if ((areFixedRowsTopChanged || fixedRowsTop === 0) && columnHeaders.length > 0) {
        const previousState = hasClass(masterParent, 'innerBorderTop');

        this.cachedFixedRowsTop = wtSettings.getSetting('fixedRowsTop');

        if (position || wtSettings.getSetting('totalRows') === 0) {
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
