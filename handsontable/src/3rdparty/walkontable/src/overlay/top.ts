import type { DataAccessObject, DomBindings, WalkontableInstance } from '../types';
import type Settings from '../settings';
import {
  addClass,
  getMaximumScrollTop,
  getScrollbarWidth,
  getScrollTop,
  hasClass,
  outerHeight,
  removeClass,
  setOverlayPosition,
  resetCssTransform,
} from '../../../../helpers/dom/element';
import { isMobileBrowser } from '../../../../helpers/browser';
import TopOverlayTable from './../table/top';
import { Overlay } from './_base';
import { getCornerStyle } from '../selection';
import {
  CLONE_TOP,
} from './constants';
import { throwWithCause } from '../../../../helpers/errors';

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
  constructor(
    wotInstance: WalkontableInstance, facadeGetter: Function, wtSettings: Settings, domBindings: DomBindings) {
    super(wotInstance, facadeGetter, CLONE_TOP, wtSettings, domBindings);
    this.cachedFixedRowsTop = this.wtSettings.getSetting<number>('fixedRowsTop');
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {TopOverlayTable}
   */
  createTable(...args: [DataAccessObject, Function, DomBindings, Settings]) {
    return new TopOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return this.wtSettings.getSetting('shouldRenderTopOverlay') as boolean;
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

    const overlayRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    const { rootWindow } = this.domBindings;
    const preventOverflow: boolean | string = this.wtSettings.getSetting('preventOverflow');
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
  setScrollPosition(pos: number) {
    const { rootWindow } = this.domBindings;
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
    const stylesHandler = this.wtSettings.getSetting('stylesHandler');
    const defaultRowHeight = stylesHandler.getDefaultRowHeight();
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
    if (!this.clone) {
      return;
    }

    const { wtTable, wtViewport } = this.wot;
    const { rootDocument, rootWindow } = this.domBindings;
    const overlayRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    const overlayRootStyle = overlayRoot.style;
    const preventOverflow: boolean | string = this.wtSettings.getSetting('preventOverflow');

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
   * Tells whether the holder must reserve the selection corner's protruding half-height (#6937) for
   * the given focus selection.
   *
   * The corner (the autofill fill handle on desktop, the selection handles on mobile) is drawn at the
   * selection's bottom-end. The top overlay renders ONLY the frozen top rows, so it must reserve that
   * protruding space only when the bottom-end corner actually falls within those frozen rows.
   * Otherwise the corner is drawn by another overlay and reserving here just makes the top clone's
   * holder taller than its own table — the extra strip stays painted at the frozen-row seam and shows
   * as a leftover top border after horizontal scroll (e.g. a single cell flush against the freeze
   * line, whose corner sits one row below the frozen block).
   *
   * Beyond that range check: on mobile the selection handles always protrude, so we only need the
   * range condition; on desktop we additionally require the fill handle to be actually enabled (its
   * `cornerVisible` border setting resolves truthy), mirroring the visibility gate in `Border#appear`.
   *
   * @private
   * @param {object|null} focusSelection The focus Selection instance (or `null` when none).
   * @returns {boolean}
   */
  shouldReserveSelectionCornerOffset(
    focusSelection: {
      settings: Record<string, unknown>;
      cellRange?: { getBottomEndCorner: () => { row: number | null } } | null;
    } | null
  ): boolean {
    if (!focusSelection || !focusSelection.cellRange) {
      return false;
    }

    const fixedRowsTop = (this.wtSettings.getSetting('fixedRowsTop') as number) ?? 0;
    const bottomEndRow = focusSelection.cellRange.getBottomEndCorner().row;

    // The corner is at the selection's bottom-end; reserve only when it lands inside the frozen rows
    // this overlay renders.
    if (bottomEndRow === null || bottomEndRow >= fixedRowsTop) {
      return false;
    }

    if (isMobileBrowser()) {
      return true;
    }

    const border = focusSelection.settings.border as
      { cornerVisible?: boolean | ((...args: unknown[]) => boolean) } | undefined;
    const cornerVisible = border?.cornerVisible;

    if (typeof cornerVisible === 'function') {
      return !!cornerVisible(focusSelection.settings.layerLevel);
    }

    return !!cornerVisible;
  }

  /**
   * Adjust overlay root childs size.
   */
  adjustRootChildrenSize() {
    if (!this.clone) {
      return;
    }

    const { holder } = this.clone.wtTable;
    const cornerStyle = getCornerStyle(this.wot);
    const focusSelection = this.wot.selectionManager.getFocusSelection();
    // Reserve the selection corner's protruding half-height only when the corner actually lands in
    // this overlay's frozen rows (and is actually drawn there). Otherwise the holder ends up taller
    // than its table and the extra strip leaves a leftover top border at the freeze seam. See the
    // helper for the full condition.
    const selectionCornerOffset = this.shouldReserveSelectionCornerOffset(focusSelection)
      ? parseInt(cornerStyle.height as string, 10) / 2 : 0;

    this.clone.wtTable.hider.style.width = this.hider.style.width;
    const holderParent = holder.parentNode as HTMLElement;

    holder.style.width = holderParent.style.width;
    // Add selection corner protruding part to the holder total height to make sure that
    // borders' corner won't be cut after vertical scroll (#6937).
    holder.style.height = `${parseInt(holderParent.style.height, 10) + selectionCornerOffset}px`;
  }

  /**
   * Adjust the overlay dimensions and position.
   */
  applyToDOM() {
    const total: number = this.wtSettings.getSetting('totalRows') ?? 0;

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
   * @param {boolean} [bottomEdge] If `true`, scrolls according to the bottom edge (top edge is by default).
   * @returns {boolean}
   */
  scrollTo(sourceRow: number, bottomEdge: boolean) {
    const { wot, wtSettings } = this;
    const sourceInstance = wot.cloneSource ? wot.cloneSource : wot;
    const mainHolder = sourceInstance.wtTable.holder;
    const columnHeaders = wtSettings.getSetting('columnHeaders') as ((...args: unknown[]) => unknown)[];
    const fixedRowsTop = wtSettings.getSetting<number>('fixedRowsTop');
    const columnHeaderBorderCompensation = (
      fixedRowsTop === 0 &&
      columnHeaders.length > 0 &&
      !hasClass(mainHolder.parentNode as HTMLElement, 'innerBorderTop')
    ) ? 1 : 0;
    let newY = this.getTableParentOffset();
    let scrollbarCompensation = 0;

    if (bottomEdge) {
      const rowHeight = this.wot.wtTable.getRowHeight(sourceRow) ?? 0;
      const viewportHeight = this.wot.wtViewport.getViewportHeight();

      if (rowHeight > viewportHeight) {
        bottomEdge = false;
      }
    }

    if (bottomEdge && mainHolder.offsetHeight !== mainHolder.clientHeight) {
      scrollbarCompensation = getScrollbarWidth(this.domBindings.rootDocument);
    }

    if (bottomEdge) {
      const fixedRowsBottom = wtSettings.getSetting<number>('fixedRowsBottom');
      const totalRows = wtSettings.getSetting<number>('totalRows');

      newY += this.sumCellSizes(0, sourceRow + 1);
      newY -= wot.wtViewport.getViewportHeight() - this.sumCellSizes(totalRows - fixedRowsBottom, totalRows);
      // Fix 1 pixel offset when cell is selected
      newY += 1;
      // Compensate for the bottom header border if scrolled from the absolute top.
      newY += columnHeaderBorderCompensation;

    } else {
      newY += this.sumCellSizes(wtSettings.getSetting<number>('fixedRowsTop'), sourceRow);
    }

    newY += scrollbarCompensation;

    // If the table is scrolled all the way up when starting the scroll and going to be scrolled to the bottom,
    // we need to compensate for the potential header bottom border height.
    if (
      getMaximumScrollTop(this.mainTableScrollableElement as HTMLElement) === newY - columnHeaderBorderCompensation &&
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
    return getScrollTop(this.mainTableScrollableElement, this.domBindings.rootWindow);
  }

  /**
   * Gets the main overlay's vertical overlay offset.
   *
   * @returns {number} Main table's vertical overlay offset.
   */
  getOverlayOffset() {
    const { rootWindow } = this.domBindings;
    const preventOverflow: boolean | string = this.wtSettings.getSetting('preventOverflow');
    let overlayOffset = 0;

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      const rootHeight = this.wot.wtTable.getTotalHeight();
      const overlayRootHeight = this.clone ? this.clone.wtTable.getTotalHeight() : 0;
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
  adjustHeaderBordersPosition(position: number, skipInnerBorderAdjusting = false) {
    const { wtSettings } = this;
    const masterParent = this.wot.wtTable.holder.parentNode as HTMLElement;
    const totalColumns: number = wtSettings.getSetting('totalColumns') ?? 0;
    const preventHorizontalOverflow = wtSettings.getSetting('preventOverflow') === 'horizontal';

    if (totalColumns) {
      removeClass(masterParent, 'emptyColumns');
    } else {
      addClass(masterParent, 'emptyColumns');
    }

    let positionChanged = false;

    if (!skipInnerBorderAdjusting && !preventHorizontalOverflow) {
      const fixedRowsTop = wtSettings.getSetting<number>('fixedRowsTop');
      const areFixedRowsTopChanged = this.cachedFixedRowsTop !== fixedRowsTop;
      const columnHeaders = wtSettings.getSetting('columnHeaders') as ((...args: unknown[]) => unknown)[];

      if ((areFixedRowsTopChanged || fixedRowsTop === 0) && columnHeaders.length > 0) {
        const previousState = hasClass(masterParent, 'innerBorderTop');

        this.cachedFixedRowsTop = wtSettings.getSetting<number>('fixedRowsTop');

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
