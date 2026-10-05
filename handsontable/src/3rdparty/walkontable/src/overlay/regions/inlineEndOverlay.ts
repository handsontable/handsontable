import type { TableDeps } from '../../table/baseTable';
import { getScrollLeft } from '../../../../../helpers/dom/element';
import InlineEndOverlayTable from '../../table/regions/inlineEndTable';
import { Overlay, type OverlayDeps } from './_base';
import {
  CLONE_INLINE_END,
} from '../constants';
import {
  axisScrollbarClearance,
  holderOwnsAxisScrollbar,
  overlayExtentBesideScrollbar,
  reservedScrollbarSpace,
} from '../scrollbarClearance';
import { setSpreaderOffset } from '../spreaderOffset';

/**
 * The overlay that keeps the LAST columns of the grid (`fixedColumnsEnd`) at the inline-end edge
 * (the right edge in LTR, the left edge in RTL). The counterpart of `InlineStartOverlay`.
 *
 * Its clone is positioned the way the bottom overlay's clone is on the block axis, not the way the
 * inline-start one is:
 * - with an element scrolling the columns, the clone is an absolutely positioned box with an
 *   inline-end inset (`repositionOverlay`), lifted off the holder's vertical scrollbar and, when the
 *   columns do not fill the holder, moved in to rest against the last column;
 * - with the window scrolling the columns, the clone is held by `position: sticky` inside a rail
 *   (`overlay/overlayRail.ts`), anchored to the rail's inline END, so the browser pins it to the
 *   viewport's inline-end edge on the scroll's own frame.
 *
 * It owns no horizontal scroll state: the inline-start overlay is the owner of the horizontal axis and the
 * scroll methods here read the same element. Row headers are rendered by the inline-start clone only.
 *
 * @class InlineEndOverlay
 */
export class InlineEndOverlay extends Overlay {
  /**
   * How much shorter than its root the overlay's holder is kept, so an overlay ("floating") horizontal
   * scrollbar underneath stays reachable. 0 whenever the scrollbar has real width.
   */
  #bottomClearance = 0;

  /**
   * How much narrower than its root the overlay's holder is kept, so an overlay ("floating") vertical
   * scrollbar at the inline-end edge stays reachable. 0 whenever the scrollbar has real width.
   */
  #inlineEndClearance = 0;

  /**
   */
  constructor(deps: OverlayDeps) {
    super(deps, CLONE_INLINE_END);
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {InlineEndOverlayTable}
   */
  createTable(deps: TableDeps) {
    return new InlineEndOverlayTable(deps);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return this.wtSettings.getSetting('shouldRenderInlineEndOverlay') as boolean;
  }

  /**
   * Updates the rendering state. When the overlay wakes up (`fixedColumnsEnd` went from 0 to positive),
   * it re-reads the element that scrolls the columns first: while idle, `ScrollSync` skips it, so the
   * element it holds may be one the horizontal axis owner (the inline-start overlay) has since left.
   *
   * @param {'before' | 'after'} drawPhase The phase of the rendering process.
   */
  updateStateOfRendering(drawPhase: 'before' | 'after') {
    if (drawPhase === 'before' && !this.needFullRender && this.shouldBeRendered()) {
      this.updateMainScrollableElement();
    }

    super.updateStateOfRendering(drawPhase);
  }

  /**
   * @returns {'inline'} This overlay follows the page sideways.
   */
  get railAxis(): 'inline' {
    return 'inline';
  }

  /**
   * Updates the overlay position.
   *
   * @returns {boolean} Always `false` - the overlay shifts no layout, so there is nothing to reconcile.
   */
  resetFixedPosition() {
    if (!this.needFullRender || !this.shouldBeRendered() || !this.deps.getWtTable().holder.parentNode || !this.clone) {
      // removed from DOM, or idle
      return false;
    }

    const wtTable = this.deps.getWtTable();
    const rail = this.getRail();

    if (this.isScrolledByWindow()) {
      // Held at the viewport's inline-end edge by the browser, never by this listener. The block axis is
      // the page's: this clone mirrors the master's rows and scrolls with them.
      rail?.pin({
        isRtl: this.isRtl(),
        width: wtTable.getTotalWidth(),
        height: wtTable.getTotalHeight(),
        inline: true,
        inlineEdge: 'end',
        block: { pinned: false, edge: 'top' },
      });

    } else {
      // Before the insets below: releasing restores the clone's own insets.
      rail?.release();
      this.repositionOverlay();
    }

    this.adjustElementsSize();

    return false;
  }

  /**
   * Whether the window scrolls the columns, so the clone has to be held at the viewport's inline-end
   * edge. It reads the element that really scrolls them (`mainTableScrollableElement`), never the
   * horizontal axis owner (`trimmingContainer`): with `preventOverflow: 'vertical'` (or an ancestor that
   * clips the vertical axis only) the window owns the horizontal axis while the holder scrolls the
   * columns, and a clone pinned to the viewport there would stand outside a grid narrower than the page.
   * The end corners ask this same question.
   *
   * @returns {boolean}
   */
  isScrolledByWindow(): boolean {
    return this.mainTableScrollableElement === this.deps.rootWindow;
  }

  /**
   * How far the clone's inline-end edge sits inside the holder's inline-end edge, for a grid whose
   * columns an element scrolls (the inline-end counterpart of the bottom inset in
   * `BottomOverlay#repositionOverlay`). The end corners are placed with the same number.
   *
   * @returns {number}
   */
  getInlineEndInset(): number {
    const wtTable = this.deps.getWtTable();
    const wtViewport = this.deps.getWtViewport();
    let inlineEndInset = 0;

    if (!wtViewport.hasHorizontalScroll()) {
      // The columns do not fill the holder: the end columns rest against the last column.
      inlineEndInset += (wtViewport.getWorkspaceWidth() - wtTable.getTotalWidth());
    }

    if (wtViewport.hasVerticalScroll() && wtViewport.hasHorizontalScroll()) {
      // The gutter this holder really gives up - see `BottomOverlay#repositionOverlay`.
      inlineEndInset += reservedScrollbarSpace(this.deps.geometryReader, wtTable.holder, 'vertical');
    }

    return inlineEndInset;
  }

  /**
   * Places the clone at the inline-end edge of an element-scrolled grid.
   */
  repositionOverlay() {
    if (!this.clone) {
      return;
    }

    const cloneRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    const [end, start] = this.isRtl() ? ['left', 'right'] as const : ['right', 'left'] as const;

    cloneRoot.style[start] = '';
    cloneRoot.style[end] = `${this.getInlineEndInset()}px`;
  }

  /**
   * Sets the main overlay's horizontal scroll position. The inline-start overlay owns the axis; this
   * overlay reads the same scrollable element.
   *
   * @param {number} pos The scroll position.
   * @returns {boolean}
   */
  setScrollPosition(pos: number) {
    return this.deps.getWtOverlays().inlineStartOverlay.setScrollPosition(pos);
  }

  /**
   * Handles scroll events (intentionally empty: the inline-start overlay fires the scroll hooks).
   */
  onScroll() {}

  /**
   * Calculates total sum cells width. Walks the columns live, for the reason spelled out in
   * `InlineStartOverlay#sumCellSizes`.
   *
   * @param {number} from Column index which calculates started from.
   * @param {number} to Column index where calculation is finished.
   * @returns {number} Width sum.
   */
  sumCellSizes(from: number, to: number) {
    const defaultColumnWidth = this.wtSettings.getSetting<number>('defaultColumnWidth');
    let column = from;
    let sum = 0;

    while (column < to) {
      sum += this.deps.getWtTable().getColumnWidth(column) || defaultColumnWidth;
      column += 1;
    }

    return sum;
  }

  /**
   * The width of the end band, in pixels. Zero when the band is empty.
   *
   * @returns {number}
   */
  getBandWidth(): number {
    const fixedColumnsEnd = this.wtSettings.getSetting<number>('fixedColumnsEnd');

    if (!fixedColumnsEnd) {
      return 0;
    }

    const totalColumns = this.wtSettings.getSetting<number>('totalColumns');

    return this.sumCellSizes(totalColumns - fixedColumnsEnd, totalColumns);
  }

  /**
   * Adjust overlay root element, children and master table element sizes (width, height).
   */
  adjustElementsSize() {
    if (this.needFullRender) {
      this.updateTrimmingContainer();
      this.adjustRootElementSize();
      this.adjustRootChildrenSize();

    } else if (this.clone) {
      // Stopped rendering: drop the clearance, or its filler stays behind over live cells.
      this.#bottomClearance = 0;
      this.#inlineEndClearance = 0;
      this.clearScrollbarClearance();
    }
  }

  /**
   * The inline-end clearance strip this overlay last computed, in pixels (0 when none applies). The
   * end corners are drawn over this overlay's edge and read the value from here instead of recomputing it.
   *
   * @returns {number}
   */
  getInlineEndClearance(): number {
    return this.#inlineEndClearance;
  }

  /**
   * The bottom clearance strip this overlay last computed, in pixels (0 when none applies).
   *
   * @returns {number}
   */
  getBottomClearance(): number {
    return this.#bottomClearance;
  }

  /**
   * Whether this clone rests on the master holder's inline-end edge, where the holder's vertical
   * scrollbar is painted. Anywhere else the clone floats over live cells, and a clearance strip there
   * is a clipped clone plus a band filling in for nothing. Computed on every read, never cached - see
   * `BottomOverlay#restsOnHolderBottomEdge`.
   *
   * @returns {boolean}
   */
  #restsOnHolderInlineEndEdge(): boolean {
    if (this.isScrolledByWindow()) {
      return this.getOverlayOffset() === 0;
    }

    return this.deps.getWtViewport().hasHorizontalScroll();
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

    // Height is a vertical question: this overlay is sized against the scrollport whenever an
    // element owns the vertical axis, whichever owner its own (horizontal) axis has - see
    // `InlineStartOverlay#adjustRootElementSize`.
    const rootSized = !wtViewport.isVerticallyScrollableByWindow();
    // Each strip reads the axis it lies on - see `BottomOverlay#adjustRootElementSize`.
    const horizontalClearanceApplies = holderOwnsAxisScrollbar(
      this.mainTableScrollableElement === rootWindow, rootWindow
    );
    const verticalClearanceApplies = holderOwnsAxisScrollbar(
      wtViewport.isVerticallyScrollableByWindow(), rootWindow
    ) && this.#restsOnHolderInlineEndEdge();
    const scrollbarWidth = this.deps.geometryReader.getScrollbarWidth(rootDocument);

    this.#bottomClearance = axisScrollbarClearance(
      this.deps.geometryReader,
      wtTable.holder,
      scrollbarWidth,
      horizontalClearanceApplies && wtViewport.hasHorizontalScroll(),
      'horizontal'
    );
    // The master's vertical scrollbar sits along the inline-end edge this overlay rests on.
    this.#inlineEndClearance = axisScrollbarClearance(
      this.deps.geometryReader,
      wtTable.holder,
      scrollbarWidth,
      verticalClearanceApplies && wtViewport.hasVerticalScroll(),
      'vertical'
    );

    if (rootSized) {
      let height = wtViewport.getWorkspaceHeight();

      // Only the holder's own horizontal scrollbar takes height off this overlay; the page's
      // scrollbar sits outside the grid's box.
      if (wtViewport.hasHorizontalScroll() && !wtViewport.isHorizontallyScrollableByWindow()) {
        height = overlayExtentBesideScrollbar(
          height,
          this.deps.geometryReader.clientHeight(wtTable.holder),
          scrollbarWidth,
          reservedScrollbarSpace(this.deps.geometryReader, wtTable.holder, 'horizontal')
        );
      }

      height = Math.min(height, this.deps.geometryReader.scrollHeight(wtTable.wtRootElement));
      overlayRootStyle.height = `${height}px`;

    } else {
      overlayRootStyle.height = '';
    }

    this.clone.wtTable.holder.style.height = overlayRootStyle.height;

    const tableWidth = this.deps.geometryReader.outerWidth(this.clone.wtTable.TABLE);

    overlayRootStyle.width = `${tableWidth}px`;

    this.publishScrollbarClearance({
      bottom: this.#bottomClearance,
      inlineEnd: this.#inlineEndClearance,
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

    this.clone.wtTable.hider.style.height = this.hider.style.height;
    const holderParent = holder.parentNode as HTMLElement;

    holder.style.height = holderParent.style.height;
    holder.style.width = holderParent.style.width;
  }

  /**
   * Adjust the overlay dimensions and position. The master spreader belongs to the other overlays; this
   * one only places its own clone's rows.
   */
  applyToDOM() {
    if (this.needFullRender) {
      this.syncOverlayOffset();
    }
  }

  /**
   * Synchronize the calculated top position to the clone's spreader.
   */
  syncOverlayOffset() {
    if (!this.clone) {
      return;
    }

    const rowsRenderCalculator = this.deps.getWtViewport().rowsRenderCalculator;
    const start = typeof rowsRenderCalculator?.startPosition === 'number'
      ? rowsRenderCalculator.startPosition : 0;

    // The clone is suspended only while the strategy positions the clones itself (element mode).
    setSpreaderOffset(this.clone.wtTable.spreader, 'y', start, this.deps.getWtOverlays().isStickyScrollOwningClones());
  }

  /**
   * The end columns never scroll horizontally, so there is nothing to scroll to. The inline-start overlay
   * scrolls the master.
   *
   * @param {number} _sourceCol Column index.
   * @param {boolean} _beyondRendered Unused.
   * @returns {boolean} Always `false`.
   */
  scrollTo(_sourceCol: number, _beyondRendered: boolean) {
    return false;
  }

  /**
   * Gets table parent left position - the same answer as the inline-start overlay's, which owns the axis.
   *
   * @returns {number}
   */
  getTableParentOffset() {
    return this.deps.getWtOverlays().inlineStartOverlay.getTableParentOffset();
  }

  /**
   * Gets the main overlay's horizontal scroll position.
   *
   * @returns {number} Main table's horizontal scroll position.
   */
  getScrollPosition() {
    return Math.abs(getScrollLeft(this.mainTableScrollableElement, this.deps.rootWindow));
  }

  /**
   * How far the window-pinned clone sits inward of its natural resting place at the end of the table,
   * in pixels (0 while the window is scrolled to the end of the table, or when an element scrolls the
   * columns). The inline-end counterpart of `BottomOverlay#getOverlayOffset`.
   *
   * @returns {number}
   */
  getOverlayOffset() {
    let overlayOffset = 0;

    if (this.isScrolledByWindow() && this.clone) {
      const wtTable = this.deps.getWtTable();
      const rootWidth = wtTable.getTotalWidth();
      const overlayRootWidth = this.clone.wtTable.getTotalWidth();
      const maxOffset = rootWidth - overlayRootWidth;

      if (this.isRtl()) {
        // The table's inline-end edge is its LEFT one. Reading it from the scroll position alone is off by
        // the page margin on the inline-start (right) side, so read where the left edge really is: the clone
        // is held at the viewport's left edge until that edge comes into view.
        const hiderRect = this.deps.geometryReader.getBoundingClientRect(wtTable.hider);

        overlayOffset = Math.max(this.deps.rootDocument.documentElement.clientLeft - hiderRect.left, 0);

      } else {
        const docClientWidth =
          this.deps.geometryReader.clientWidth(this.deps.rootDocument.documentElement);

        overlayOffset = Math.max(
          this.getTableParentOffset() + rootWidth - this.getScrollPosition() - docClientWidth, 0);
      }

      if (overlayOffset > maxOffset) {
        overlayOffset = 0;
      }
    }

    return overlayOffset;
  }
}
