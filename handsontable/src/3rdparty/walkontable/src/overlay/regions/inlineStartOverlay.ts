import type { TableDeps } from '../../table/baseTable';
import {
  addClass,
  getScrollLeft,
  hasClass,
  removeClass,
  setOverlayPosition,
  resetCssTransform,
} from '../../../../../helpers/dom/element';
import InlineStartOverlayTable from '../../table/regions/inlineStartTable';
import { Overlay, type OverlayDeps } from './_base';
import { getCornerStyle } from '../../selection';
import {
  CLONE_INLINE_START,
} from '../constants';
import {
  holderOwnsScrollbars,
  reservedScrollbarSpace,
  overlayExtentBesideScrollbar,
  axisScrollbarClearance,
} from '../scrollbarClearance';
import { throwWithCause } from '../../../../../helpers/errors';

/**
 * @class InlineStartOverlay
 */
export class InlineStartOverlay extends Overlay {
  /**
   * How much shorter than its root the overlay's holder is kept, so an overlay ("floating") horizontal
   * scrollbar underneath stays reachable. 0 whenever the scrollbar has real width.
   */
  #holderClearance = 0;

  /**
   */
  constructor(deps: OverlayDeps) {
    super(deps, CLONE_INLINE_START);
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {InlineStartOverlayTable}
   */
  createTable(deps: TableDeps) {
    return new InlineStartOverlayTable(deps);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return this.wtSettings.getSetting('shouldRenderInlineStartOverlay') as boolean;
  }

  /**
   * Updates the left overlay position.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    const wtTable = this.deps.getWtTable();

    if (!this.needFullRender || !this.shouldBeRendered() || !wtTable.holder.parentNode) {
      // removed from DOM
      return false;
    }

    if (!this.clone) {
      return false;
    }

    const { rootWindow } = this.deps;
    const overlayRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    let overlayPosition = 0;

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'horizontal')) {
      overlayPosition = this.getOverlayOffset() * (this.isRtl() ? -1 : 1);
      setOverlayPosition(overlayRoot, `${overlayPosition}px`, '0px');

    } else {
      overlayPosition = this.getScrollPosition();
      resetCssTransform(overlayRoot);
    }

    const positionChanged = this.adjustHeaderBordersPosition(overlayPosition);

    this.adjustElementsSize();

    return positionChanged;
  }

  /**
   * Sets the main overlay's horizontal scroll position.
   *
   * @param {number} pos The scroll position.
   * @returns {boolean}
   */
  setScrollPosition(pos: number) {
    const { rootWindow } = this.deps;
    const scrollableElement = this.mainTableScrollableElement;
    const scrollEl = scrollableElement as HTMLElement;
    const getScrollPosition = () => {
      return scrollableElement === rootWindow ? rootWindow.scrollX : scrollEl.scrollLeft;
    };
    const setScrollPosition = (newPosition: number) => {
      if (scrollableElement === rootWindow) {
        rootWindow.scrollTo(newPosition, rootWindow.scrollY);
      } else {
        scrollEl.scrollLeft = newPosition;
      }
    };

    if (this.isRtl()) {
      pos = -pos;
    }

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
    this.wtSettings.getSetting('onScrollVertically');
  }

  /**
   * Calculates total sum cells width. Walks the columns live instead of reading the column-width
   * prefix-sum cache: stretched widths (`stretchH`) are derived from the workspace width, which in
   * turn depends on this sum — the live read resolves that cycle fresh on every call, while a
   * cached read would freeze pre-stretch widths (nothing invalidates the cache when stretching
   * recomputes). Column counts stay far below row counts, so this walk is not a scroll hotspot.
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
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');

    // The master's horizontal scrollbar sits along the bottom edge this overlay covers. Only worth a
    // strip when this overlay is sized against the scrollport - otherwise the page scrolls, the
    // scrollbar is not under this overlay, and clipping would expose the master for nothing.
    const rootSized = this.trimmingContainer !== rootWindow || preventOverflow === 'vertical';
    // A touch-only device has no pointer that could reach the scrollbar - see `canGrabScrollbar`.
    // Clip and band together, or not at all - see `TopOverlay#adjustRootElementSize`.
    const clearanceApplies = holderOwnsScrollbars(this.trimmingContainer, rootWindow);

    this.#holderClearance = axisScrollbarClearance(
      this.deps.geometryReader,
      wtTable.holder,
      this.deps.geometryReader.getScrollbarWidth(rootDocument),
      clearanceApplies && wtViewport.hasHorizontalScroll(),
      'horizontal'
    );

    if (rootSized) {
      let height = wtViewport.getWorkspaceHeight();

      if (wtViewport.hasHorizontalScroll()) {
        // The same rule the top and bottom overlays apply to widths - `clientHeight` accounts for the
        // horizontal scrollbar at the browser's sub-pixel accuracy, where a rounded
        // `getScrollbarWidth()` diverges under fractional zoom and gave the frozen overlay a different
        // vertical scroll range than the master, clamping its scrollTop ~1px short (#12632).
        height = overlayExtentBesideScrollbar(
          height,
          this.deps.geometryReader.clientHeight(wtTable.holder),
          this.deps.geometryReader.getScrollbarWidth(rootDocument),
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
      bottom: this.#holderClearance,
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
    const cornerStyle = getCornerStyle(this.wot);
    const selectionCornerOffset = this.deps.getSelectionManager()
      .getFocusSelection() ? parseInt(cornerStyle.width as string, 10) / 2 : 0;

    this.clone.wtTable.hider.style.height = this.hider.style.height;
    const holderParent = holder.parentNode as HTMLElement;

    holder.style.height = holderParent.style.height;
    // Add selection corner protruding part to the holder total width to make sure that
    // borders' corner won't be cut after horizontal scroll (#6937).
    holder.style.width = `${parseInt(holderParent.style.width, 10) + selectionCornerOffset}px`;
  }

  /**
   * Adjust the overlay dimensions and position.
   */
  applyToDOM() {
    const total = this.wtSettings.getSetting('totalColumns');
    const styleProperty = this.isRtl() ? 'right' : 'left';

    const columnsRenderCalculator = this.deps.getWtViewport().columnsRenderCalculator;

    if (typeof columnsRenderCalculator?.startPosition === 'number') {
      this.spreader.style[styleProperty] = `${columnsRenderCalculator.startPosition}px`;

    } else if (total === 0 || columnsRenderCalculator === null) {
      // 0 columns, or nothing rendered yet — a `null` calculator is the drawn-but-never-rendered state
      // a skipped first draw leaves behind (see `restoreRenderedStateIfSafe` in `table/drawCycle.ts`).
      this.spreader.style[styleProperty] = '0';

    } else {
      throwWithCause('Incorrect value of the columnsRenderCalculator');
    }

    if (this.isRtl()) {
      this.spreader.style.left = '';
    } else {
      this.spreader.style.right = '';
    }

    if (this.needFullRender) {
      this.syncOverlayOffset();
    }
  }

  /**
   * Synchronize calculated top position to an element.
   */
  syncOverlayOffset() {
    if (!this.clone) {
      return;
    }

    const rowsRenderCalculator = this.deps.getWtViewport().rowsRenderCalculator;

    if (typeof rowsRenderCalculator?.startPosition === 'number') {
      this.clone.wtTable.spreader.style.top = `${rowsRenderCalculator.startPosition}px`;

    } else {
      this.clone.wtTable.spreader.style.top = '';
    }
  }

  /**
   * Scrolls horizontally to a column at the left edge of the viewport.
   *
   * @param {number} sourceCol  Column index which you want to scroll to.
   * @param {boolean} [beyondRendered]  If `true`, scrolls according to the right
   *                                    edge (left edge is by default).
   * @returns {boolean}
   */
  scrollTo(sourceCol: number, beyondRendered: boolean) {
    const { wtSettings } = this;
    const { geometryReader } = this.deps;
    const rowHeaders = wtSettings.getSetting('rowHeaders') as ((...args: unknown[]) => unknown)[];
    const fixedColumnsStart = wtSettings.getSetting<number>('fixedColumnsStart');
    const sourceInstance = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
    const mainHolder = sourceInstance.wtTable.holder;
    const rowHeaderBorderCompensation = (
      fixedColumnsStart === 0 &&
      rowHeaders.length > 0 &&
      !hasClass(mainHolder.parentNode as HTMLElement, 'innerBorderInlineStart')
    ) ? 1 : 0;
    let newX = this.getTableParentOffset();
    let scrollbarCompensation = 0;

    if (beyondRendered) {
      const columnWidth = this.deps.getWtTable().getColumnWidth(sourceCol);
      const viewportWidth = this.deps.getWtViewport().getViewportWidth();

      if (columnWidth > viewportWidth) {
        beyondRendered = false;
      }
    }

    if (beyondRendered && geometryReader.offsetWidth(mainHolder) !== geometryReader.clientWidth(mainHolder)) {
      scrollbarCompensation = geometryReader.getScrollbarWidth(this.deps.rootDocument);
    }
    if (beyondRendered) {
      newX += this.sumCellSizes(0, sourceCol + 1);
      newX -= this.deps.getWtViewport().getViewportWidth();
      // Compensate for the right header border if scrolled from the absolute left.
      newX += rowHeaderBorderCompensation;

    } else {
      newX += this.sumCellSizes(this.wtSettings.getSetting<number>('fixedColumnsStart'), sourceCol);
    }

    newX += scrollbarCompensation;

    // If the table is scrolled all the way left when starting the scroll and going to be scrolled to the far right,
    // we need to compensate for the potential header border width.
    if (
      geometryReader.getMaximumScrollLeft(this.mainTableScrollableElement as HTMLElement)
        === newX - rowHeaderBorderCompensation &&
      rowHeaderBorderCompensation > 0
    ) {
      this.deps.getWtOverlays().expandHiderHorizontallyBy(rowHeaderBorderCompensation);
    }

    return this.setScrollPosition(newX);
  }

  /**
   * Gets table parent left position.
   *
   * @returns {number}
   */
  getTableParentOffset() {
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    let offset = 0;

    if (!preventOverflow && this.trimmingContainer === this.deps.rootWindow) {
      offset = (this.deps.getWtTable().holderOffset as { top: number; left: number }).left;
    }

    return offset;
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
   * Gets the main overlay's horizontal overlay offset.
   *
   * @returns {number} Main table's horizontal overlay offset.
   */
  getOverlayOffset() {
    const { rootWindow } = this.deps;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    let overlayOffset = 0;

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'horizontal')) {
      if (this.isRtl()) {
        overlayOffset = Math.abs(Math.min(this.getTableParentOffset() - this.getScrollPosition(), 0));
      } else {
        overlayOffset = Math.max(this.getScrollPosition() - this.getTableParentOffset(), 0);
      }
      const rootWidth = this.deps.getWtTable().getTotalWidth();
      const overlayRootWidth = this.clone ? this.clone.wtTable.getTotalWidth() : 0;
      const maxOffset = rootWidth - overlayRootWidth;

      if (overlayOffset > maxOffset) {
        overlayOffset = 0;
      }
    }

    return overlayOffset;
  }

  /**
   * Pre-applies the `innerBorderInlineStart` class before the cell render (single-pass gated
   * path), so the post-render `resetFixedPosition` toggle is a no-op and the nested re-draw is
   * skipped. Element mode only — see `TopOverlay#prepareHeaderBorders`.
   */
  prepareHeaderBorders() {
    if (!this.needFullRender || !this.shouldBeRendered() ||
        !this.deps.getWtTable().holder.parentNode || !this.clone ||
        this.trimmingContainer === this.deps.rootWindow) {
      return;
    }

    this.adjustHeaderBordersPosition(this.getScrollPosition());
  }

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue).
   *
   * @param {number} position Header X position if trimming container is window or scroll top if not.
   * @returns {boolean}
   */
  adjustHeaderBordersPosition(position: number) {
    const masterParent = this.deps.getWtTable().holder.parentNode as HTMLElement;
    const state = this.#computeHeaderBordersState(position);

    if (state.hasEmptyRows) {
      addClass(masterParent, 'emptyRows');
    } else {
      removeClass(masterParent, 'emptyRows');
    }

    // "innerBorderLeft" is for backward compatibility.
    if (state.innerBorder === 'add') {
      addClass(masterParent, 'innerBorderLeft innerBorderInlineStart');
    } else if (state.innerBorder === 'remove') {
      removeClass(masterParent, 'innerBorderLeft innerBorderInlineStart');
    }

    return state.positionChanged;
  }

  /**
   * Computes the inline-start overlay's header-border state without mutating the DOM. Pure: reads
   * settings and the current class state only. Splitting the decision from the write lets the
   * single-pass draw resolve the `innerBorderInlineStart` toggle before rendering, instead of after.
   *
   * @param {number} position The overlay offset that decides whether the inline-start border is shown.
   * @returns {{ hasEmptyRows: boolean, innerBorder: string, positionChanged: boolean }}
   */
  #computeHeaderBordersState(position: number) {
    const { wtSettings } = this;
    const masterParent = this.deps.getWtTable().holder.parentNode as HTMLElement;
    const rowHeaders = wtSettings.getSetting('rowHeaders') as ((...args: unknown[]) => unknown)[];
    const fixedColumnsStart = wtSettings.getSetting<number>('fixedColumnsStart');
    const totalRows = wtSettings.getSetting<number>('totalRows');
    const preventVerticalOverflow = wtSettings.getSetting('preventOverflow') === 'vertical';
    const hasEmptyRows = !totalRows;
    let innerBorder = 'keep';
    let positionChanged = false;

    if (!preventVerticalOverflow) {
      if (fixedColumnsStart && !rowHeaders.length) {
        innerBorder = 'add';

      } else if (!fixedColumnsStart && rowHeaders.length) {
        const previousState = hasClass(masterParent, 'innerBorderInlineStart');

        if (position) {
          innerBorder = 'add';
          positionChanged = !previousState;
        } else {
          innerBorder = 'remove';
          positionChanged = previousState;
        }
      }
    }

    return { hasEmptyRows, innerBorder, positionChanged };
  }
}
