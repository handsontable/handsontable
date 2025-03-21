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
import { TopOverlayInterface } from './interfaces';
import { DomBindings, FacadeGetter, Settings } from '../types';
import Walkontable from '../core/core';

/**
 * @class TopOverlay
 */
export class TopOverlay extends Overlay implements TopOverlayInterface {
  /**
   * Cached value which holds the previous value of the `fixedRowsTop` option.
   * It is used as a comparison value that can be used to detect changes in this value.
   *
   * @type {number}
   */
  cachedFixedRowsTop: number = -1;

  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {DomBindings} domBindings Dom elements bound to the current instance.
   */
  constructor(wotInstance: Walkontable, facadeGetter: FacadeGetter, wtSettings: Settings, domBindings: DomBindings) {
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
  createTable(...args: any[]): TopOverlayTable {
    return new TopOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return this.wtSettings.getSetting('shouldRenderTopOverlay');
  }

  /**
   * Updates the top overlay position.
   *
   * @returns {boolean}
   */
  resetFixedPosition(): boolean {
    if (!this.needFullRender || !this.shouldBeRendered() || !this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return false;
    }

    const overlayRoot = this.clone.holder.parentNode as HTMLElement;
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
  setScrollPosition(pos: number): boolean {
    const rootWindow = this.domBindings.rootWindow;
    let result = false;

    if (this.mainTableScrollableElement === rootWindow && rootWindow.scrollY !== pos) {
      rootWindow.scrollTo(getWindowScrollLeft(rootWindow), pos);
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
   * Adjust overlay root element, children and master table element sizes (width, height).
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
    const overlayRoot = this.clone.holder.parentNode as HTMLElement;
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
    
    const cornerStyle = getCornerStyle(this.wot);
    const selectionCornerOffset = this.wot.selectionManager
      .getFocusSelection() ? parseInt(cornerStyle.height, 10) / 2 : 0;

    this.clone.hider.style.width = this.hider.style.width;
    holder.style.width = (holder.parentNode as HTMLElement).style.width;
    // Add selection corner protruding part to the holder total height to make sure that
    // borders' corner won't be cut after vertical scroll (#6937).
    holder.style.height = `${parseInt((holder.parentNode as HTMLElement).style.height, 10) + selectionCornerOffset}px`;
  }

  /**
   * Adjust the overlay dimensions and position.
   */
  applyToDOM(): void {
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
  syncOverlayOffset(): void {
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
   * @param {boolean} [bottomEdge] If `true`, scrolls according to the bottom edge (top edge is by default).
   */
  scrollTo(sourceRow: number, bottomEdge: boolean = false): void {
    const { wot } = this;
    const sourceInstance = wot.cloneSource ?? wot;
    const mainHolder = sourceInstance.wtTable.holder;
    const { rootWindow } = this.domBindings;
    const fixedRowsBottom = wot.getSetting('fixedRowsBottom');
    const preAdjusted = typeof this.getTableParentOffset() !== 'number';
    let scrollbarCompensation = 0;

    if (preAdjusted && this.mainTableScrollableElement === rootWindow) {
      scrollbarCompensation = rootWindow.innerWidth - rootWindow.document.documentElement.clientWidth;
    }

    // If parent element is not a Window use that element as a scrollable element
    let newScrollPosition;

    if (bottomEdge) {
      newScrollPosition = this.getTableParentOffset() + this.sumCellSizes(0, sourceRow + 1);
      newScrollPosition -= wot.wtViewport.getViewportHeight() - mainHolder.offsetTop;
      newScrollPosition += 1;

    } else {
      const fixedRowsTop = wot.getSetting('fixedRowsTop');
      const totalRowsHeight = sourceInstance.wtTable.getTotalHeight();
      const ratio = totalRowsHeight === 0 ? 0 : sourceRow / sourceInstance.getSetting('totalRows');
      const maxScrollTop = this.getMaxScrollY();
      const containerOffset = preAdjusted ? this.wot.wtTable.holder.parentNode.offsetTop : this.getTableParentOffset();

      newScrollPosition = ratio * totalRowsHeight;
      newScrollPosition -= containerOffset;

      // Fix for scrolling the table to the last row
      if (sourceRow >= sourceInstance.getSetting('totalRows') - fixedRowsBottom - 1) {
        newScrollPosition = maxScrollTop;
      }
      // Fix for scrolling the table to the first row (not the fixed)
      if (sourceRow < fixedRowsTop) {
        newScrollPosition = 0;
      }
    }

    newScrollPosition = Math.min(newScrollPosition, this.getMaxScrollY());

    this.setScrollPosition(newScrollPosition > 0 ? newScrollPosition : 0);
  }

  /**
   * Gets table parent top position.
   *
   * @returns {number}
   */
  getTableParentOffset(): number {
    if (this.mainTableScrollableElement === this.domBindings.rootWindow) {
      return this.wot.wtTable.wtRootElement.offsetTop;
    }

    return 0;
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
    let overlayOffset = 0;

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      const rootHeight = this.wot.wtTable.getTotalHeight();
      const overlayRootHeight = this.clone.wtTable.getTotalHeight();
      const maxHeight = this.wot.wtViewport.getWorkspaceActualHeight();
      const fixedContainerTop = this.wot.wtTable.holderOffset.top;
      const absoluteRootElementTop = this.wot.wtTable.wtRootElement.getBoundingClientRect().top;

      overlayOffset = absoluteRootElementTop - fixedContainerTop;

      if (rootHeight > maxHeight) {
        overlayOffset += this.getScrollPosition();
      }

      if (overlayRootHeight > maxHeight) {
        overlayOffset += rootDocument.body.scrollTop;
      }
    }

    return overlayOffset;
  }

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue).
   *
   * @param {number} position Header Y position if trimming container is window or scroll top if not.
   * @param {boolean} [skipInnerBorderAdjusting=false] If `true`, the inner border adjusting will be skipped.
   * @returns {boolean}
   */
  adjustHeaderBordersPosition(position: number, skipInnerBorderAdjusting: boolean = false): boolean {
    const masterParent = this.wot.wtTable.holder.parentNode;
    const totalColumns = this.wtSettings.getSetting('totalColumns');

    if (totalColumns) {
      const fixedRowsTop = this.wtSettings.getSetting('fixedRowsTop');
      const areFixedRowsTop = fixedRowsTop > 0;
      const columnHeaders = this.wtSettings.getSetting('columnHeaders');
      const positionChanged = false;

      if (!skipInnerBorderAdjusting) {
        const hasInner = (areFixedRowsTop || columnHeaders.length > 0);

        if (hasInner) {
          if (position || this.wtSettings.getSetting('totalRows') === 0) {
            removeClass(masterParent, 'innerBorderTop');
          } else {
            addClass(masterParent, 'innerBorderTop');
          }
        }
      }

      return positionChanged;
    }

    return false;
  }

  /**
   * Gets the maximum scroll position in the overlay.
   *
   * @private
   * @returns {number}
   */
  getMaxScrollY(): number {
    return Math.max(
      getMaximumScrollTop(this.mainTableScrollableElement, this.domBindings.rootWindow),
      this.getTableParentOffset() + this.wot.wtTable.getTotalHeight() -
      this.wot.wtTable.wtRootElement.offsetTop - this.getWorkspaceActualHeight()
    );
  }

  /**
   * Gets the max height of the overlay's workspace.
   *
   * @private
   * @returns {number}
   */
  getWorkspaceActualHeight(): number {
    const { rootWindow } = this.domBindings;
    let elemHeight;

    if (this.trimmingContainer === rootWindow) {
      elemHeight = rootWindow.innerHeight;

    } else {
      elemHeight = outerHeight(this.trimmingContainer);
    }

    return elemHeight;
  }
}
