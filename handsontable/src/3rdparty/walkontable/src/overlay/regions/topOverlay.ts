import type { TableDeps } from '../../table/baseTable';
import {
  addClass,
  getScrollTop,
  hasClass,
  removeClass,
  setOverlayPosition,
  resetCssTransform,
} from '../../../../../helpers/dom/element';
import { isMobileBrowser } from '../../../../../helpers/browser';
import TopOverlayTable from '../../table/regions/topTable';
import { Overlay, type OverlayDeps } from './_base';
import {
  axisScrollbarClearance,
  holderOwnsScrollbars,
  reservedScrollbarSpace,
  overlayExtentBesideScrollbar,
} from '../scrollbarClearance';
import { getCornerStyle } from '../../selection';
import type { Selection } from '../../selection';
import type { BorderInstanceSettings } from '../../selection/border/types';
import {
  CLONE_TOP,
} from '../constants';
import { throwWithCause } from '../../../../../helpers/errors';

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
   * How much narrower than its root the overlay's holder is kept, so an overlay ("floating")
   * vertical scrollbar underneath stays reachable. 0 whenever the scrollbar has real width.
   */
  #holderClearance = 0;

  /**
   */
  constructor(deps: OverlayDeps) {
    super(deps, CLONE_TOP);
    this.cachedFixedRowsTop = this.wtSettings.getSetting<number>('fixedRowsTop');
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {TopOverlayTable}
   */
  createTable(deps: TableDeps) {
    return new TopOverlayTable(deps);
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
   * Reports no position change. `innerBorderTop` is still stamped for backward compatibility, but it
   * shifts no layout since DEV-2786 — the column header carries its `border-bottom` at every scroll
   * position — so there is nothing for the draw cycle to reconcile. The #7256 loop guard went with
   * it: it suppressed the toggle when the table's bottom and the overlay's bottom coincided, because
   * the 1px shift moved the viewport, fired `scroll`, and re-entered the toggle on Chrome. A class
   * that moves nothing cannot start that loop.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    if (!this.needFullRender || !this.shouldBeRendered() || !this.deps.getWtTable().holder.parentNode || !this.clone) {
      // removed from DOM
      return false;
    }

    const overlayRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    const { rootWindow } = this.deps;
    let overlayPosition = 0;

    if (this.trimmingContainer === rootWindow) {
      overlayPosition = this.getOverlayOffset();

      setOverlayPosition(overlayRoot, '0px', `${overlayPosition}px`);

    } else {
      overlayPosition = this.getScrollPosition();
      resetCssTransform(overlayRoot);
    }

    this.adjustHeaderBordersPosition(overlayPosition);

    this.adjustElementsSize();

    return false;
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
   * Calculates total sum cells height. Delegates to the viewport's row-height prefix-sum cache
   * (`Viewport#sumRowHeights`), so a call costs O(1) instead of walking every row in the
   * `[from, to)` range — `scrollTo` passes ranges that start at row 0, which made keyboard
   * navigation near the bottom of a large grid re-sum the whole dataset on every keypress.
   *
   * @param {number} from Row index which calculates started from.
   * @param {number} to Row index where calculation is finished.
   * @returns {number} Height sum.
   */
  sumCellSizes(from: number, to: number) {
    return this.deps.getWtViewport().sumRowHeights(from, to);
  }

  /**
   * Adjust overlay root element, children and master table element sizes (width, height).
   */
  adjustElementsSize() {
    this.updateTrimmingContainer();

    if (this.needFullRender) {
      this.adjustRootElementSize();
      this.adjustRootChildrenSize();

    } else if (this.clone) {
      // Stopped rendering: drop the clearance, or its filler stays behind over live cells.
      this.clearScrollbarClearance();
    }
  }

  /**
   * Adjust overlay root element size (width and height).
   */
  adjustRootElementSize() {
    if (!this.clone) {
      return;
    }

    const wtTable = this.deps.getWtTable();
    const wtViewport = this.deps.getWtViewport();
    const { rootDocument, rootWindow } = this.deps;
    const overlayRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    const overlayRootStyle = overlayRoot.style;

    // Width is a horizontal question: this overlay is sized against the scrollport whenever an
    // element owns the horizontal axis, whichever owner its own (vertical) axis has.
    const rootSized = !wtViewport.isHorizontallyScrollableByWindow();
    // The master's vertical scrollbar sits along the inline-end edge this overlay spans. Only worth a
    // strip when the holder owns that scrollbar - see `inlineStartOverlay`.
    // A touch-only device has no pointer that could reach the scrollbar - see `canGrabScrollbar`.
    // Clip and band together, or not at all. Every rendered clone has to be clipped or it covers the
    // scrollbar - but clipping one uncovers the master underneath, scrolled elsewhere, so a clip with
    // no band behind it shows the wrong cells in the strip.
    //
    // Being rendered is the whole question. An overlay drawn on this edge covers the scrollbar there
    // whether it carries frozen rows or only a column header, so a header-only grid needs the strip
    // for exactly the reason a frozen one does. Asking instead whether this overlay held frozen rows
    // left the vertical scrollbar covered on any grid with frozen columns but no frozen rows - the
    // commonest arrangement there is. The strips below are published only while the clone is
    // rendered, so nothing further has to be asked here.
    const clearanceApplies = holderOwnsScrollbars(this.trimmingContainer, rootWindow);

    this.#holderClearance = axisScrollbarClearance(
      this.deps.geometryReader,
      wtTable.holder,
      this.deps.geometryReader.getScrollbarWidth(rootDocument),
      clearanceApplies && wtViewport.hasVerticalScroll(),
      'vertical'
    );

    if (rootSized) {
      let width = wtViewport.getWorkspaceWidth();

      // Only the holder's own vertical scrollbar takes width off this overlay. When the window owns
      // the vertical axis, `hasVerticalScroll()` reports the page's scrollbar, which sits outside the
      // grid's box.
      if (wtViewport.hasVerticalScroll() && !wtViewport.isVerticallyScrollableByWindow()) {
        width = overlayExtentBesideScrollbar(
          width,
          this.deps.geometryReader.clientWidth(wtTable.holder),
          this.deps.geometryReader.getScrollbarWidth(rootDocument),
          reservedScrollbarSpace(this.deps.geometryReader, wtTable.holder, 'vertical')
        );
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

    this.publishScrollbarClearance({
      inlineEnd: this.#holderClearance,
      rtl: this.isRtl(),
    }, this.wot.wtOverlays.isScrollbarVisible());
  }

  /**
   * Tells whether the holder must reserve the selection corner's protruding half-height (#6937),
   * needed only when the selection's bottom-end corner falls within the frozen top rows this overlay
   * renders — otherwise the reserved strip leaves a leftover top border at the seam. On mobile the
   * handles always protrude so the range check suffices; on desktop the fill handle must also be
   * enabled (`cornerVisible` truthy), mirroring `Border#appear`.
   *
   * @private
   * @param {Selection|null} focusSelection The focus Selection instance (or `null` when none).
   * @returns {boolean}
   */
  shouldReserveSelectionCornerOffset(focusSelection: Selection | null): boolean {
    if (!focusSelection || !focusSelection.cellRange) {
      return false;
    }

    const fixedRowsTop = this.wtSettings.getSetting('fixedRowsTop') as number;
    const bottomEndRow = focusSelection.cellRange.getBottomEndCorner().row;

    // The corner is at the selection's bottom-end; reserve only when it lands inside the frozen rows
    // this overlay renders.
    if (bottomEndRow === null || bottomEndRow >= fixedRowsTop) {
      return false;
    }

    if (isMobileBrowser()) {
      return true;
    }

    const border = focusSelection.settings.border as BorderInstanceSettings['border'];
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
    const focusSelection = this.deps.getSelectionManager().getFocusSelection();
    // Reserve the corner's protruding half-height only when it lands in this overlay's frozen rows;
    // otherwise the holder grows taller than its table and leaves a leftover top border at the seam.
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

    const rowsRenderCalculator = this.deps.getWtViewport().rowsRenderCalculator;

    if (typeof rowsRenderCalculator?.startPosition === 'number') {
      this.spreader.style.top = `${rowsRenderCalculator.startPosition}px`;

    } else if (total === 0 || rowsRenderCalculator === null) {
      // 0 rows, or nothing rendered yet — a `null` calculator is the drawn-but-never-rendered state
      // a skipped first draw leaves behind (see `restoreRenderedStateIfSafe` in `table/drawCycle.ts`).
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

    const columnsRenderCalculator = this.deps.getWtViewport().columnsRenderCalculator;

    if (typeof columnsRenderCalculator?.startPosition === 'number') {
      spreader.style[styleProperty] = `${columnsRenderCalculator.startPosition}px`;

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
    const { geometryReader } = this.deps;
    const sourceInstance = wot.cloneSource ? wot.cloneSource : wot;
    const mainHolder = sourceInstance.wtTable.holder;
    let newY = this.getTableParentOffset();
    let scrollbarCompensation = 0;

    if (bottomEdge) {
      const rowHeight = this.deps.getWtTable().getRowHeight(sourceRow) ?? 0;
      const viewportHeight = this.deps.getWtViewport().getViewportHeight();

      if (rowHeight > viewportHeight) {
        bottomEdge = false;
      }
    }

    if (bottomEdge && geometryReader.offsetHeight(mainHolder) !== geometryReader.clientHeight(mainHolder)) {
      scrollbarCompensation = geometryReader.getScrollbarWidth(this.deps.rootDocument);
    }

    if (bottomEdge) {
      const fixedRowsBottom = wtSettings.getSetting<number>('fixedRowsBottom');
      const totalRows = wtSettings.getSetting<number>('totalRows');

      newY += this.sumCellSizes(0, sourceRow + 1);
      newY -= wot.wtViewport.getViewportHeight() - this.sumCellSizes(totalRows - fixedRowsBottom, totalRows);
      // Fix 1 pixel offset when cell is selected
      newY += 1;

    } else {
      newY += this.sumCellSizes(wtSettings.getSetting<number>('fixedRowsTop'), sourceRow);
    }

    newY += scrollbarCompensation;

    // No header-border compensation. Scrolling from the very top to the very bottom used to gain the
    // column header's `border-bottom` on the way, so the target had to be nudged by 1px and the hider
    // expanded to match. The header carries that border at every scroll position now (DEV-2786), so
    // the scroll range reads the same at both ends.
    return this.setScrollPosition(newY);
  }

  /**
   * Gets table parent top position.
   *
   * @returns {number}
   */
  getTableParentOffset() {
    if (this.mainTableScrollableElement === this.deps.rootWindow) {
      return (this.deps.getWtTable().holderOffset as { top: number; left: number }).top;
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
    let overlayOffset = 0;

    if (this.trimmingContainer === rootWindow) {
      const rootHeight = this.deps.getWtTable().getTotalHeight();
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
   * Stamps the `emptyColumns` and `innerBorderTop` classes on the master's root element.
   *
   * `emptyColumns` is live — `_base.scss` reads it to give the row header the grid's own inline-end
   * frame when no column stands beside it. `innerBorderTop` is kept for backward compatibility only:
   * no stylesheet has read it since DEV-2786 handed the seam under the column header to the header's
   * own `border-bottom` at every scroll position. It is not a usable "has scrolled" signal either —
   * it only toggles on a grid that has column headers and no frozen top rows.
   *
   * @param {number} position Header Y position if trimming container is window or scroll top if not.
   */
  adjustHeaderBordersPosition(position: number) {
    const { wtSettings } = this;
    const masterParent = this.deps.getWtTable().holder.parentNode as HTMLElement;
    const totalColumns: number = wtSettings.getSetting('totalColumns') ?? 0;

    if (totalColumns) {
      removeClass(masterParent, 'emptyColumns');
    } else {
      addClass(masterParent, 'emptyColumns');
    }

    if (wtSettings.getSetting('preventOverflow') === 'horizontal') {
      return;
    }

    const fixedRowsTop = wtSettings.getSetting<number>('fixedRowsTop');
    const areFixedRowsTopChanged = this.cachedFixedRowsTop !== fixedRowsTop;
    const columnHeaders = wtSettings.getSetting('columnHeaders') as ((...args: unknown[]) => unknown)[];

    if ((areFixedRowsTopChanged || fixedRowsTop === 0) && columnHeaders.length > 0) {
      if (position || wtSettings.getSetting('totalRows') === 0) {
        addClass(masterParent, 'innerBorderTop');
      } else {
        removeClass(masterParent, 'innerBorderTop');
      }

      this.cachedFixedRowsTop = fixedRowsTop;
    }
  }
}
