import {
  addClass,
  getScrollbarWidth,
  getScrollTop,
  getWindowScrollLeft,
  hasClass,
  outerHeight,
  removeClass,
  resetCssTransform,
  setOverlayPosition,
} from '../../../../helpers/dom/element';
import BottomOverlayTable from './../table/bottom';
import { Overlay } from './_base';
import {
  CLONE_BOTTOM,
} from './constants';
import { DomBindings, FacadeGetter, Settings } from '../types';
import Walkontable from '../core/core';
import { BottomOverlayInterface } from './interfaces';

/**
 * @class BottomOverlay
 */
export class BottomOverlay extends Overlay implements BottomOverlayInterface {
  /**
   * Cached value which holds the previous value of the `fixedRowsBottom` option.
   * It is used as a comparison value that can be used to detect changes in this value.
   *
   * @type {number}
   */
  cachedFixedRowsBottom: number = -1;

  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {DomBindings} domBindings Dom elements bound to the current instance.
   */
  constructor(wotInstance: Walkontable, facadeGetter: FacadeGetter, wtSettings: Settings, domBindings: DomBindings) {
    super(wotInstance, facadeGetter, CLONE_BOTTOM, wtSettings, domBindings);
    this.cachedFixedRowsBottom = this.wtSettings.getSetting('fixedRowsBottom');
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {BottomOverlayTable}
   */
  createTable(...args: any[]): BottomOverlayTable {
    return new BottomOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return this.wtSettings.getSetting('shouldRenderBottomOverlay');
  }

  /**
   * Updates the bottom overlay position.
   *
   * @returns {boolean}
   */
  resetFixedPosition(): boolean {
    if (!this.needFullRender || !this.shouldBeRendered() || !this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return false;
    }

    const { rootDocument, rootWindow } = this.domBindings;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    const overlayRoot = this.clone.holder.parentNode as HTMLElement;
    const overlayPosition = this.getOverlayOffset();

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      setOverlayPosition(overlayRoot, '0px', `${overlayPosition}px`);

    } else {
      resetCssTransform(overlayRoot);
    }

    this.adjustElementsSize();

    return false;
  }

  /**
   * Sets the main overlay's vertical scroll position.
   *
   * @param {number} pos The scroll position.
   * @returns {boolean}
   */
  setScrollPosition(pos: number): boolean {
    const { rootWindow } = this.domBindings;
    let result = false;

    if (this.mainTableScrollableElement === rootWindow && rootWindow.scrollY !== pos) {
      rootWindow.scrollTo(rootWindow.scrollX, pos);
      result = true;

    } else if (this.mainTableScrollableElement !== null && this.mainTableScrollableElement !== rootWindow && (this.mainTableScrollableElement as HTMLElement).scrollTop !== pos) {
      (this.mainTableScrollableElement as HTMLElement).scrollTop = pos;
      result = true;
    }

    return result;
  }

  /**
   * Triggers onScroll hook callback.
   */
  onScroll(): void {
    this.wtSettings.getSetting('onScrollHorizontally');
  }

  /**
   * Calculates total sum cells height.
   *
   * @param {number} from Row index which calculates started from.
   * @param {number} to Row index where calculation is finished.
   * @returns {number} Height sum.
   */
  sumCellSizes(from: number, to: number): number {
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
   * Adjust overlay root element, childs and master table element sizes (width, height).
   */
  adjustElementsSize(): boolean {
    this.updateTrimmingContainer();

    if (this.needFullRender) {
      this.adjustRootElementSize();
      this.adjustRootChildrenSize();
      
      return true;
    }
    
    return false;
  }

  /**
   * Adjust overlay root element size (width and height).
   */
  adjustRootElementSize(): void {
    const { wtTable, wtViewport } = this.wot;
    const { rootDocument, rootWindow } = this.domBindings;
    const scrollbarWidth = getScrollbarWidth(rootDocument);
    const overlayRoot = this.clone.holder.parentNode as HTMLElement;
    const overlayRootStyle = overlayRoot.style;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');

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

    this.clone.holder.style.width = overlayRootStyle.width;

    let tableHeight = outerHeight(this.clone.TABLE);

    if (!wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRootStyle.height = `${tableHeight}px`;
  }

  /**
   * Adjust overlay root childs size.
   */
  adjustRootChildrenSize(): void {
    const holder = this.clone.holder;
    
    if (!holder) {
      return;
    }
    
    this.clone.hider.style.width = this.hider.style.width;
    holder.style.width = (holder.parentNode as HTMLElement).style.width;
  }

  /**
   * Adjust the overlay dimensions and position.
   */
  applyToDOM(): void {
    const { wtViewport } = this.wot;
    const cloneHider = this.clone.hider;
    const cloneTH = this.clone.TABLE.firstElementChild as HTMLElement;

    // Fix the top position of the bottom overlay to allow horizontal scrolling
    // of the bottom overlay outside of the visible viewport.
    // This is controlled here and not in the reset function because it's only
    // a one-time operation.
    if (cloneTH && this.wot.wtTable.holder.parentNode) {
      cloneHider.style.position = 'relative';
      let totalRowsCount = this.wtSettings.getSetting('totalRows');
      let fixedRowsBottom = this.wtSettings.getSetting('fixedRowsBottom');
      const fixedRowsTop = this.wtSettings.getSetting('fixedRowsTop');
      const totalColumns = this.wtSettings.getSetting('totalColumns');
      const countVisibleFixedBottomRows = Math.min(fixedRowsBottom, totalRowsCount);
      const columnsToRender = Math.min(totalColumns, Math.max(this.wtSettings.getSetting('minSpareRows'), totalColumns));
      // Need to adjust the top position of the bottom overlay if there are fixed rows at the top.
      // Otherwise, it would fly into the table. This is a workaround for a webkit browser render issue.
      const fixedRowsHeight = totalRowsCount === 0 ? 0 : wtViewport.sumColumnWidths(0, columnsToRender);

      if (fixedRowsTop) {
        const fixedRowsTopHeight = this.wot.wtOverlays.topOverlay.sumCellSizes(0, fixedRowsTop);

        cloneHider.style.top = `${fixedRowsTopHeight}px`;
      }

      if (this.wot.wtTable.holder.clientHeight === this.wot.wtTable.holder.offsetHeight) {
        // Scrollbar is not displayed.
        cloneHider.style.height = `${fixedRowsHeight}px`;

      } else {
        let fixedRowsBottomHeight = totalRowsCount === 0 ? 0 : this.sumCellSizes(
          totalRowsCount - fixedRowsBottom, totalRowsCount);

        cloneHider.style.height = `${fixedRowsBottomHeight}px`;
      }

      // Fix the bottom overlay height to allow the mouse events to reach the top overlay
      this.clone.holder.style.height = cloneHider.style.height;
    }

    if (this.needFullRender) {
      this.syncOverlayOffset();
    }
  }

  /**
   * Synchronize calculated left position to an element.
   */
  syncOverlayOffset(): void {
    if (typeof this.wot.wtViewport.columnsRenderCalculator.startPosition === 'number') {
      this.clone.wtTable.spreader.style.left = `${this.wot.wtViewport.columnsRenderCalculator.startPosition}px`;

    } else {
      this.clone.wtTable.spreader.style.left = '';
    }
  }

  /**
   * Scrolls vertically to a row. The row is either rendered in the bottom overlay
   * or it's rendered in the master table, with the viewport scrolled.
   *
   * @param {number} sourceRow Row index which you want to scroll to.
   * @param {boolean} [bottomEdge] If `true`, scrolls according to the bottom edge (top edge is by default).
   */
  scrollTo(sourceRow: number, bottomEdge: boolean = false): void {
    const { wot } = this;
    const { rootWindow } = this.domBindings;
    const sourceInstance = wot.cloneSource || wot;
    let fixedRowsBottom = this.wtSettings.getSetting('fixedRowsBottom');
    const totalRows = this.wtSettings.getSetting('totalRows');

    if (sourceRow >= totalRows - fixedRowsBottom) {
      // We have a row that's supposed to be rendered in the bottom overlay
      let offsetRow = totalRows - sourceRow - 1;
      const height = sourceInstance.wtTable.getRowHeight(sourceRow);
      const scrollPosition = rootWindow.innerHeight;

      if (bottomEdge && height > rootWindow.innerHeight) {
        offsetRow = 0;
      }

      this.setScrollPosition(scrollPosition);

    } else {
      // The row is rendered in the master table, need to scroll the viewport
      let fixedRowsTop = this.wtSettings.getSetting('fixedRowsTop');
      const totalRows = this.wtSettings.getSetting('totalRows');
      let newY = sourceInstance.wtTable.getRowHeight(sourceRow);

      if (bottomEdge) {
        newY += sourceInstance.wtViewport.getViewportHeight() - sourceInstance.wtTable.getRowHeight(sourceRow);
      }

      if (sourceRow < fixedRowsTop) {
        this.setScrollPosition(0);

      } else if (sourceRow >= totalRows - fixedRowsBottom) {
        let maxY = this.getScrollPosition();

        if (this.mainTableScrollableElement !== null) {
          maxY = getScrollTop(this.mainTableScrollableElement, rootWindow);
        }

        this.setScrollPosition(maxY);

      } else {
        this.setScrollPosition(newY);
      }
    }
  }

  /**
   * Gets the main overlay's vertical scroll position.
   *
   * @returns {number}
   */
  getScrollPosition(): number {
    return getScrollTop(this.mainTableScrollableElement, this.domBindings.rootWindow);
  }

  /**
   * Gets the main overlay's vertical overlay offset.
   *
   * @returns {number}
   */
  getOverlayOffset(): number {
    const { rootDocument, rootWindow } = this.domBindings;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    let offset = 0;

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      offset = this.getRelativeOffset();

      if (rootWindow.innerHeight > rootDocument.documentElement.offsetHeight) {
        offset += getScrollbarWidth(rootDocument);
      }
    }

    return offset;
  }

  /**
   * Gets the relative offset of the overlay.
   *
   * @private
   * @returns {number}
   */
  getRelativeOffset(): number {
    const { rootWindow } = this.domBindings;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    let offset = 0;

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      if (this.wtSettings.getSetting('totalRows') > 0) {
        offset = -this.clone.wtTable.holder.offsetTop + this.wot.wtTable.holder.offsetTop;
      }
    }

    return offset;
  }

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue).
   *
   * @param {number} position Header Y position if trimming container is window or scroll top if not.
   * @returns {boolean}
   */
  adjustHeaderBordersPosition(position: number): boolean {
    const fixedRowsBottom = this.wtSettings.getSetting('fixedRowsBottom');
    const areFixedRowsBottomChanged = this.cachedFixedRowsBottom !== fixedRowsBottom;
    const columnHeaders = this.wtSettings.getSetting('columnHeaders');
    let positionChanged = false;

    if ((areFixedRowsBottomChanged || fixedRowsBottom === 0) && columnHeaders.length > 0) {
      const masterParent = this.wot.wtTable.holder.parentNode;
      const previousState = hasClass(masterParent, 'innerBorderBottom');

      this.cachedFixedRowsBottom = this.wtSettings.getSetting('fixedRowsBottom');

      if (position || this.wtSettings.getSetting('totalRows') === 0) {
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
