import type { TableDeps } from '../../table/baseTable';
import {
  addClass,
  getScrollTop,
  hasClass,
  removeClass,
} from '../../../../../helpers/dom/element';
import BottomOverlayTable from '../../table/regions/bottomTable';
import { Overlay, type OverlayDeps } from './_base';
import {
  axisScrollbarClearance,
  holderOwnsScrollbars,
  overlayExtentBesideScrollbar,
  reservedScrollbarSpace,
} from '../scrollbarClearance';
import {
  CLONE_BOTTOM,
} from '../constants';
import { throwWithCause } from '../../../../../helpers/errors';

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
   * How much narrower than its root the overlay's holder is kept, so an overlay ("floating")
   * vertical scrollbar underneath stays reachable. 0 whenever the scrollbar has real width.
   */
  #holderClearance = 0;

  /**
   * How much shorter than its root the overlay's holder is kept, so an overlay ("floating") horizontal
   * scrollbar underneath stays reachable. This overlay spans the bottom edge, so unlike the top one it
   * covers both scrollbars. 0 whenever the scrollbar has real width.
   */
  #bottomClearance = 0;

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
   * Reports no position change, for the same reason `TopOverlay#resetFixedPosition` does not:
   * `innerBorderBottom` shifts no layout since DEV-2786, so the draw cycle has nothing to reconcile.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    if (!this.needFullRender || !this.shouldBeRendered() || !this.deps.getWtTable().holder.parentNode || !this.clone) {
      // removed from DOM
      return false;
    }
    const { rootWindow } = this.deps;
    const overlayRoot = this.clone.wtTable.holder.parentNode as HTMLElement;

    overlayRoot.style.top = '';

    let overlayPosition = 0;

    if (this.trimmingContainer === rootWindow) {
      overlayPosition = this.getOverlayOffset();

      // At non-integer zoom levels (e.g. 90%) the browser physically rounds each row's
      // border to the nearest physical pixel, causing the rendered TABLE to extend a
      // fractional CSS pixel past the holder's integer CSS height. Subtract this overflow
      // so the overlay sits flush against the actual table content instead of the
      // CSS-integer hider boundary.
      const { geometryReader } = this.deps;
      const masterTableRect = geometryReader.getBoundingClientRect(this.deps.getWtTable().TABLE);
      const masterHolderRect = geometryReader.getBoundingClientRect(this.deps.getWtTable().holder);
      const masterTableOverflow = Math.max(0, masterTableRect.bottom - masterHolderRect.bottom);

      overlayRoot.style.bottom = `${overlayPosition - masterTableOverflow}px`;

    } else {
      overlayPosition = this.getScrollPosition();
      this.repositionOverlay();
    }

    this.adjustHeaderBordersPosition(overlayPosition);

    this.adjustElementsSize();

    return false;
  }

  /**
   * Updates the bottom overlay position.
   */
  repositionOverlay() {
    if (!this.clone) {
      return;
    }

    const wtTable = this.deps.getWtTable();
    const wtViewport = this.deps.getWtViewport();
    const cloneRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    let bottomOffset = 0;

    if (!wtViewport.hasVerticalScroll()) {
      bottomOffset += (wtViewport.getWorkspaceHeight() - wtTable.getTotalHeight());
    }

    if (wtViewport.hasVerticalScroll() && wtViewport.hasHorizontalScroll()) {
      // The gutter this holder really gives up. `getScrollbarWidth()` describes the ENGINE, not this
      // element, and the two diverge on a styled scroller: Firefox 154 honors `::-webkit-scrollbar`,
      // which `.wtHolder` sets and the probe element does not, so the probe reads 0 against a real
      // scrollbar and the frozen rows come to rest on top of it (#10370). The magnitude is the answer
      // here, so there is no cheap probe test to skip the read on, as `axisScrollbarClearance` has.
      bottomOffset += reservedScrollbarSpace(this.deps.geometryReader, wtTable.holder, 'horizontal');
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
      // Stopped rendering - `fixedRowsBottom` set back to 0, say. Nothing below sizes this overlay any
      // more, so drop its clearance here or the filler stays behind as an opaque strip over live cells.
      this.#bottomClearance = 0;
      this.clearScrollbarClearance();
    }
  }

  /**
   * The bottom clearance strip this overlay last computed, in pixels (0 when none applies). The
   * bottom-inline-start corner is drawn over this overlay's bottom edge and must clip exactly the
   * same strip - a corner that decides on its own can disagree by one gate and leave a notch where
   * the frozen columns stop and the frozen rows carry on (#10370) - so it reads the value from here
   * instead of recomputing it. The draw cycle positions this overlay before the corner.
   *
   * @returns {number}
   */
  getBottomClearance(): number {
    return this.#bottomClearance;
  }

  /**
   * Whether this clone rests on the master holder's bottom edge, where the holder's horizontal
   * scrollbar is painted. Anywhere else the clone floats over live cells, and a clearance strip
   * there is a clipped clone plus a band filling in for nothing.
   *
   * Computed on every read, never cached. The sizing pass that consumes it runs from
   * `Overlays#refresh` BEFORE `resetFixedPosition` in the same draw, so a value written by the
   * positioning pass would be one draw behind exactly when the clone has just arrived on the edge
   * or just left it — and the band, which `Overlays#syncScrollbarTrackBands` derives from the
   * published strip during that same earlier pass, would then disagree with the clip. Clip and band
   * together, or not at all (#10370).
   *
   * The two paths mirror `resetFixedPosition`: with the window scrolling the rows the clone floats at
   * the viewport's bottom and reaches the holder's edge only once the page is at the grid's end,
   * which is what a zero overlay offset means; with an element scrolling them `repositionOverlay`
   * lifts the clone to where the rows end whenever the holder itself does not scroll.
   *
   * @returns {boolean}
   */
  #restsOnHolderBottomEdge(): boolean {
    if (this.trimmingContainer === this.deps.rootWindow) {
      return this.getOverlayOffset() === 0;
    }

    return this.deps.getWtViewport().hasVerticalScroll();
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

    // Width is a horizontal question: sized against the scrollport whenever an element owns the
    // horizontal axis (see `TopOverlay#adjustRootElementSize`).
    const rootSized = !wtViewport.isHorizontallyScrollableByWindow();
    // Each strip reads the owner of the axis it lies on. The inline-end strip clears the master's
    // VERTICAL scrollbar, so it asks this overlay's own (vertical) owner; the bottom strip clears the
    // HORIZONTAL one, so it asks the inline-start overlay's. In split mode the two differ - the window
    // owns the rows, the holder owns the columns - and one predicate taken from the vertical owner
    // said "the window's scrollbar" for both, leaving the holder's horizontal scrollbar under the
    // frozen bottom rows at the grid's end. Clip and band together, or not at all - see
    // `TopOverlay#adjustRootElementSize`.
    const inlineEndClearanceApplies = holderOwnsScrollbars(this.trimmingContainer, rootWindow);
    const bottomClearanceApplies = holderOwnsScrollbars(
      this.wot.wtOverlays.inlineStartOverlay.trimmingContainer, rootWindow
    ) && this.#restsOnHolderBottomEdge();

    // The master's vertical scrollbar sits along the inline-end edge this overlay spans.
    this.#holderClearance = axisScrollbarClearance(
      this.deps.geometryReader,
      wtTable.holder,
      this.deps.geometryReader.getScrollbarWidth(rootDocument),
      inlineEndClearanceApplies && wtViewport.hasVerticalScroll(),
      'vertical'
    );

    if (rootSized) {
      let width = wtViewport.getWorkspaceWidth();

      // Only the holder's own vertical scrollbar takes width off this overlay - see `TopOverlay`.
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

    // This overlay also spans the bottom edge, where the horizontal scrollbar is painted - but only
    // while it actually rests on that edge (`#restsOnHolderBottomEdge`, folded into the predicate
    // above). `hasVerticalScroll()` used to stand in for that, and it is the wrong question on the
    // window-owned vertical axis: the page scrolls, so it answers `true` while the clone floats
    // mid-page over live cells, and `repositionOverlay` - which lifts the clone clear of the
    // scrollbar in element mode - never runs on that path at all.
    this.#bottomClearance = axisScrollbarClearance(
      this.deps.geometryReader,
      wtTable.holder,
      this.deps.geometryReader.getScrollbarWidth(rootDocument),
      bottomClearanceApplies && wtViewport.hasHorizontalScroll(),
      'horizontal'
    );

    this.clone.wtTable.holder.style.width = overlayRootStyle.width;

    let tableHeight = this.deps.geometryReader.outerHeight(this.clone.wtTable.TABLE);

    if (!wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRootStyle.height = `${tableHeight}px`;

    this.publishScrollbarClearance({
      bottom: this.#bottomClearance,
      inlineEnd: this.#holderClearance,
      rtl: this.isRtl(),
    }, this.wot.wtOverlays.isScrollbarVisible());
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
      newY -= this.deps.getWtViewport().getViewportHeight();
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

    if (this.trimmingContainer === rootWindow && this.clone) {
      const rootHeight = this.deps.getWtTable().getTotalHeight();
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
   * Stamps the `innerBorderBottom` class on the master's root element.
   *
   * Kept for backward compatibility only: no stylesheet has read it since DEV-2786 handed the seam
   * under the column header to the header's own `border-bottom` at every scroll position. See
   * `TopOverlay#adjustHeaderBordersPosition`.
   *
   * @param {number} position Header Y position if trimming container is window or scroll top if not.
   */
  adjustHeaderBordersPosition(position: number) {
    const { wtSettings } = this;
    const masterParent = this.deps.getWtTable().holder.parentNode as HTMLElement;
    const fixedRowsBottom = wtSettings.getSetting<number>('fixedRowsBottom');
    const areFixedRowsBottomChanged = this.cachedFixedRowsBottom !== fixedRowsBottom;
    const columnHeaders = wtSettings.getSetting('columnHeaders') as ((...args: unknown[]) => unknown)[];

    if ((areFixedRowsBottomChanged || fixedRowsBottom === 0) && columnHeaders.length > 0) {
      if (position || wtSettings.getSetting('totalRows') === 0) {
        addClass(masterParent, 'innerBorderBottom');
      } else {
        removeClass(masterParent, 'innerBorderBottom');
      }

      this.cachedFixedRowsBottom = fixedRowsBottom;
    }
  }
}
