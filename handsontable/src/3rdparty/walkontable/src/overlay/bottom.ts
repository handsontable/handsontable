import type { TableDeps } from '../table';
import {
  addClass,
  getScrollTop,
  hasClass,
  removeClass,
} from '../../../../helpers/dom/element';
import BottomOverlayTable from './../table/bottom';
import { Overlay, type OverlayDeps } from './_base';
import {
  CLONE_BOTTOM,
} from './constants';
import { throwWithCause } from '../../../../helpers/errors';

/**
 * @class BottomOverlay
 */
export class BottomOverlay extends Overlay {
  /**
   * Cached value which holds the previous value of the `fixedRowsBottom` option.
   * It is used as a comparison value that can be used to detect changes in that value.
   *
   * @type {number}
   */
  cachedFixedRowsBottom = -1;

  /**
   */
  constructor(deps: OverlayDeps) {
    super(deps, CLONE_BOTTOM);
    this.cachedFixedRowsBottom = this.wtSettings.getSetting<number>('fixedRowsBottom');
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {BottomOverlayTable}
   */
  createTable(deps: TableDeps) {
    return new BottomOverlayTable(deps);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return this.wtSettings.getSetting('shouldRenderBottomOverlay') as boolean;
  }

  /**
   * Updates the top overlay position.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    if (!this.needFullRender || !this.shouldBeRendered() || !this.wot.wtTable.holder.parentNode || !this.clone) {
      // removed from DOM
      return false;
    }
    const { rootWindow } = this.deps;
    const overlayRoot = this.clone.wtTable.holder.parentNode as HTMLElement;

    overlayRoot.style.top = '';

    let overlayPosition = 0;
    const preventOverflow = this.wtSettings.getSetting<boolean | string>('preventOverflow');

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      overlayPosition = this.getOverlayOffset();

      // At non-integer zoom levels (e.g. 90%) the browser physically rounds each row's
      // border to the nearest physical pixel, causing the rendered TABLE to extend a
      // fractional CSS pixel past the holder's integer CSS height. Subtract this overflow
      // so the overlay sits flush against the actual table content instead of the
      // CSS-integer hider boundary.
      const { geometryReader } = this.deps;
      const masterTableRect = geometryReader.getBoundingClientRect(this.wot.wtTable.TABLE);
      const masterHolderRect = geometryReader.getBoundingClientRect(this.wot.wtTable.holder);
      const masterTableOverflow = Math.max(0, masterTableRect.bottom - masterHolderRect.bottom);

      overlayRoot.style.bottom = `${overlayPosition - masterTableOverflow}px`;

    } else {
      overlayPosition = this.getScrollPosition();
      this.repositionOverlay();
    }

    const positionChanged = this.adjustHeaderBordersPosition(overlayPosition);

    this.adjustElementsSize();

    return positionChanged;
  }

  /**
   * Updates the bottom overlay position.
   */
  repositionOverlay() {
    if (!this.clone) {
      return;
    }

    const { wtTable, wtViewport } = this.wot;
    const { rootDocument } = this.deps;
    const cloneRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    let bottomOffset = 0;

    if (!wtViewport.hasVerticalScroll()) {
      bottomOffset += (wtViewport.getWorkspaceHeight() - wtTable.getTotalHeight());
    }

    if (wtViewport.hasVerticalScroll() && wtViewport.hasHorizontalScroll()) {
      bottomOffset += this.deps.geometryReader.getScrollbarWidth(rootDocument);
    }

    cloneRoot.style.bottom = `${bottomOffset}px`;
  }

  /**
   * Sets the main overlay's vertical scroll position.
   *
   * @param {number} pos The scroll position.
   * @returns {boolean}
   */
  setScrollPosition(pos: number) {
    const { rootWindow } = this.deps;
    const scrollableElement = this.mainTableScrollableElement;
    const scrollEl = scrollableElement as HTMLElement;
    const getScrollPosition = () => {
      return scrollableElement === rootWindow ? rootWindow.scrollY : scrollEl.scrollTop;
    };
    const setScrollPosition = (newPosition: number) => {
      if (scrollableElement === rootWindow) {
        rootWindow.scrollTo(rootWindow.scrollX, newPosition);
      } else {
        scrollEl.scrollTop = newPosition;
      }
    };
    const oldScrollPosition = getScrollPosition();
    let result = false;

    if (pos !== oldScrollPosition) {
      setScrollPosition(pos);
      result = oldScrollPosition !== getScrollPosition();
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
  sumCellSizes(from: number, to: number) {
    const { wtTable, wtSettings } = this.wot;
    const defaultRowHeight = wtSettings.getSetting('stylesHandler').getDefaultRowHeight();

    let row = from;
    let sum = 0;

    while (row < to) {
      const height = wtTable.getRowHeight(row);

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
    if (!this.clone) {
      return;
    }

    const { wtTable, wtViewport } = this.wot;
    const { rootDocument, rootWindow } = this.deps;
    const overlayRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    const overlayRootStyle = overlayRoot.style;
    const preventOverflow = this.wtSettings.getSetting<boolean | string>('preventOverflow');

    if (this.trimmingContainer !== rootWindow || preventOverflow === 'horizontal') {
      let width = wtViewport.getWorkspaceWidth();

      if (wtViewport.hasVerticalScroll()) {
        width -= this.deps.geometryReader.getScrollbarWidth(rootDocument);
      }

      width = Math.min(width, this.deps.geometryReader.scrollWidth(wtTable.wtRootElement));
      overlayRootStyle.width = `${width}px`;

    } else {
      overlayRootStyle.width = '';
    }
    this.clone.wtTable.holder.style.width = overlayRootStyle.width;

    let tableHeight = this.deps.geometryReader.outerHeight(this.clone.wtTable.TABLE);

    if (!wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRootStyle.height = `${tableHeight}px`;
  }

  /**
   * Adjust overlay root childs size.
   */
  adjustRootChildrenSize() {
    if (!this.clone) {
      return;
    }

    const { holder } = this.clone.wtTable;

    this.clone.wtTable.hider.style.width = this.hider.style.width;
    const holderParent = holder.parentNode as HTMLElement;

    holder.style.width = holderParent.style.width;
    holder.style.height = holderParent.style.height;
  }

  /**
   * Adjust the overlay dimensions and position.
   */
  applyToDOM() {
    const total = this.wtSettings.getSetting<number>('totalRows');

    if (typeof this.wot.wtViewport.rowsRenderCalculator?.startPosition === 'number') {
      this.spreader.style.top = `${this.wot.wtViewport.rowsRenderCalculator.startPosition}px`;

    } else if (total === 0) {
      // can happen if there are 0 rows
      this.spreader.style.top = '0';

    } else {
      throwWithCause('Incorrect value of the rowsRenderCalculator');
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
    if (!this.clone) {
      return;
    }

    const styleProperty = this.isRtl() ? 'right' : 'left';
    const { spreader } = this.clone.wtTable;

    if (typeof this.wot.wtViewport.columnsRenderCalculator?.startPosition === 'number') {
      spreader.style[styleProperty] = `${this.wot.wtViewport.columnsRenderCalculator.startPosition}px`;

    } else {
      spreader.style[styleProperty] = '';
    }
  }

  /**
   * Scrolls vertically to a row.
   *
   * @param {number} sourceRow Row index which you want to scroll to.
   * @param {boolean} [bottomEdge=false] If `true`, scrolls according to the bottom edge (top edge is by default).
   */
  scrollTo(sourceRow: number, bottomEdge: boolean) {
    let newY = this.getTableParentOffset();
    const { geometryReader } = this.deps;
    const sourceInstance = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
    const mainHolder = sourceInstance.wtTable.holder;
    let scrollbarCompensation = 0;

    if (bottomEdge && geometryReader.offsetHeight(mainHolder) !== geometryReader.clientHeight(mainHolder)) {
      scrollbarCompensation = geometryReader.getScrollbarWidth(this.deps.rootDocument);
    }

    if (bottomEdge) {
      newY += this.sumCellSizes(0, sourceRow + 1);
      newY -= this.wot.wtViewport.getViewportHeight();
      // Fix 1 pixel offset when cell is selected
      newY += 1;

    } else {
      newY += this.sumCellSizes(this.wtSettings.getSetting<number>('fixedRowsBottom'), sourceRow);
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
    if (this.mainTableScrollableElement === this.deps.rootWindow) {
      return (this.wot.wtTable.holderOffset as { top: number; left: number }).top;
    }

    return 0;
  }

  /**
   * Gets the main overlay's vertical scroll position.
   *
   * @returns {number} Main table's vertical scroll position.
   */
  getScrollPosition() {
    return getScrollTop(this.mainTableScrollableElement, this.deps.rootWindow);
  }

  /**
   * Gets the main overlay's vertical overlay offset.
   *
   * @returns {number} Main table's vertical overlay offset.
   */
  getOverlayOffset() {
    const { rootWindow } = this.deps;
    const preventOverflow = this.wtSettings.getSetting<boolean | string>('preventOverflow');
    let overlayOffset = 0;

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'vertical') && this.clone) {
      const rootHeight = this.wot.wtTable.getTotalHeight();
      const overlayRootHeight = this.clone.wtTable.getTotalHeight();
      const maxOffset = rootHeight - overlayRootHeight;
      const docClientHeight =
        this.deps.geometryReader.clientHeight(this.deps.rootDocument.documentElement);

      overlayOffset = Math.max(
        this.getTableParentOffset() - this.getScrollPosition() - docClientHeight + rootHeight, 0);

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
   * @returns {boolean}
   */
  adjustHeaderBordersPosition(position: number) {
    const fixedRowsBottom = this.wtSettings.getSetting<number>('fixedRowsBottom');
    const areFixedRowsBottomChanged = this.cachedFixedRowsBottom !== fixedRowsBottom;
    const columnHeaders = this.wtSettings.getSetting('columnHeaders') as ((...args: unknown[]) => unknown)[];
    let positionChanged = false;

    if ((areFixedRowsBottomChanged || fixedRowsBottom === 0) && columnHeaders.length > 0) {
      const masterParent = this.wot.wtTable.holder.parentNode as HTMLElement;
      const previousState = hasClass(masterParent, 'innerBorderBottom');

      this.cachedFixedRowsBottom = this.wtSettings.getSetting<number>('fixedRowsBottom');

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
