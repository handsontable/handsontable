import type { TableDeps } from '../../table/baseTable';
import { resetCssTransform } from '../../../../../helpers/dom/element';
import BottomInlineEndCornerOverlayTable from '../../table/regions/bottomInlineEndCornerTable';
import { Overlay, type OverlayDeps } from './_base';
import type { BottomOverlay } from './bottomOverlay';
import type { InlineEndOverlay } from './inlineEndOverlay';
import {
  CLONE_BOTTOM_INLINE_END_CORNER,
} from '../constants';

/**
 * The corner where the frozen bottom rows and the frozen end columns meet. The counterpart of
 * `BottomInlineStartCornerOverlay`.
 *
 * @class BottomInlineEndCornerOverlay
 */
export class BottomInlineEndCornerOverlay extends Overlay {
  /**
   * @type {BottomOverlay}
   */
  declare bottomOverlay: BottomOverlay;
  /**
   * @type {InlineEndOverlay}
   */
  declare inlineEndOverlay: InlineEndOverlay;

  /**
   * @param {BottomOverlay} bottomOverlay The instance of the Bottom overlay.
   * @param {InlineEndOverlay} inlineEndOverlay The instance of the InlineEnd overlay.
   */
  constructor(deps: OverlayDeps, bottomOverlay: BottomOverlay, inlineEndOverlay: InlineEndOverlay) {
    super(deps, CLONE_BOTTOM_INLINE_END_CORNER);
    this.bottomOverlay = bottomOverlay;
    this.inlineEndOverlay = inlineEndOverlay;
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {BottomInlineEndCornerOverlayTable}
   */
  createTable(deps: TableDeps) {
    return new BottomInlineEndCornerOverlayTable(deps);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return (this.wtSettings.getSetting('shouldRenderBottomOverlay') as boolean)
      && (this.wtSettings.getSetting('shouldRenderInlineEndOverlay') as boolean);
  }

  /**
   * How far the rendered master table reaches past the bottom of its holder - see
   * `BottomInlineStartCornerOverlay#masterTableOverflow`.
   *
   * @returns {number}
   */
  #masterTableOverflow(): number {
    const { geometryReader } = this.deps;
    const masterTableRect = geometryReader.getBoundingClientRect(this.deps.getWtTable().TABLE);
    const masterHolderRect = geometryReader.getBoundingClientRect(this.deps.getWtTable().holder);

    return Math.max(0, masterTableRect.bottom - masterHolderRect.bottom);
  }

  /**
   * Updates the corner overlay position. An idle corner does no geometry reads: nothing pins it, and
   * `Overlay#reset()` already took it out of its rail.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    const { clone } = this;

    if (!this.needFullRender || !(this.wot.wtTable.holder.parentNode as HTMLElement) || !clone) {
      return false;
    }

    const overlayRoot = clone.wtTable.holder.parentNode as HTMLElement;
    const { rootWindow, geometryReader } = this.deps;
    const rail = this.getRail();
    const inlineOnWindow = this.inlineEndOverlay.trimmingContainer === rootWindow;
    const blockOnWindow = this.bottomOverlay.trimmingContainer === rootWindow;

    overlayRoot.style.top = '';

    // Measured before positioning: a rail hangs the clone from its top edge, so it needs the height.
    let tableHeight = geometryReader.outerHeight(clone.wtTable.TABLE);
    const tableWidth = geometryReader.outerWidth(clone.wtTable.TABLE);

    if (!this.deps.getWtTable().hasDefinedSize()) {
      tableHeight = 0;
    }

    if (inlineOnWindow || blockOnWindow) {
      this.#pinInRail(rail, { inlineOnWindow, blockOnWindow, tableHeight });
      resetCssTransform(overlayRoot);

    } else {
      rail?.release();
      resetCssTransform(overlayRoot);
      this.repositionOverlay();
    }

    overlayRoot.style.height = `${tableHeight}px`;
    overlayRoot.style.width = `${tableWidth}px`;
    clone.wtTable.holder.style.height = overlayRoot.style.height;

    // Drawn over both the bottom overlay and the end overlay, so it re-covers the strips they leave
    // clear for an overlay scrollbar (#10370). Both strips are read from their owners, never recomputed,
    // for the reason spelled out in `BottomInlineStartCornerOverlay#resetFixedPosition`.
    this.publishScrollbarClearance({
      bottom: this.bottomOverlay.getBottomClearance(),
      inlineEnd: this.inlineEndOverlay.getInlineEndClearance(),
      rtl: this.isRtl(),
    }, this.wot.wtOverlays.isScrollbarVisible());

    return true;
  }

  /**
   * Holds the corner with CSS on each axis the window owns (see `overlay/overlayRail.ts`).
   *
   * @param {OverlayRail | null} rail The corner's rail.
   * @param {object} where What the window owns and how tall the corner is.
   * @param {boolean} where.inlineOnWindow Whether the window owns the inline axis.
   * @param {boolean} where.blockOnWindow Whether the window owns the block axis.
   * @param {number} where.tableHeight The corner table's height.
   */
  #pinInRail(
    rail: ReturnType<Overlay['getRail']>,
    { inlineOnWindow, blockOnWindow, tableHeight }: {
      inlineOnWindow: boolean, blockOnWindow: boolean, tableHeight: number
    }
  ) {
    const wtTable = this.deps.getWtTable();
    // The fractional-zoom correction belongs to the VERTICAL axis, and only while the window owns it -
    // see `BottomInlineStartCornerOverlay#resetFixedPosition`.
    const overflow = blockOnWindow ? this.#masterTableOverflow() : 0;
    const bottom = this.bottomOverlay.getOverlayOffset() - overflow;

    // A rail that spans the block axis reaches the table's painted bottom, so the clone rests there;
    // one that does not hangs from its own bottom edge at the offset. On an axis an element owns, the
    // rail spans the box the holder shows and the corner stands at its inline-end edge.
    rail?.pin({
      isRtl: this.isRtl(),
      width: inlineOnWindow
        ? wtTable.getTotalWidth()
        : this.deps.getWtViewport().getWorkspaceWidth() - this.inlineEndOverlay.getInlineEndInset(),
      height: blockOnWindow ? wtTable.getTotalHeight() + overflow : tableHeight,
      inline: inlineOnWindow,
      inlineEdge: 'end',
      block: blockOnWindow
        ? { pinned: true, edge: 'bottom' }
        : { pinned: false, edge: 'bottom', offset: bottom, height: tableHeight },
    });
  }

  /**
   * Sets the scroll position (no-op for corner overlay).
   * @param {number} _pos The scroll position (unused).
   * @returns {boolean} Always returns false.
   */
  setScrollPosition(_pos: number) {
    return false;
  }
  /**
   * Gets the scroll position (no-op for corner overlay).
   * @returns {number} Always returns 0.
   */
  getScrollPosition() {
    return 0;
  }
  /**
   * Gets the table parent offset (no-op for corner overlay).
   * @returns {number} Always returns 0.
   */
  getTableParentOffset() {
    return 0;
  }
  /**
   * Gets the overlay offset (no-op for corner overlay).
   * @returns {number} Always returns 0.
   */
  getOverlayOffset() {
    return 0;
  }
  /**
   * Handles scroll events (no-op for corner overlay).
   */
  onScroll() {}
  /**
   * Sums the size of cells between two indexes (no-op for corner overlay).
   * @param {number} _from The starting cell index (unused).
   * @param {number} _to The ending cell index (unused).
   * @returns {number} Always returns 0.
   */
  sumCellSizes(_from: number, _to: number) {
    return 0;
  }
  /**
   * Adjusts the size of overlay elements (intentionally empty).
   */
  adjustElementsSize() { // intentionally empty
  }
  /**
   * Applies changes to the DOM (intentionally empty).
   */
  applyToDOM() { // intentionally empty
  }
  /**
   * Scrolls to a specified cell index (no-op for corner overlay).
   * @param {number} _sourceIndex The source row or column index (unused).
   * @param {boolean} _snapToEdge Whether to snap to the edge (unused).
   * @returns {boolean} Always returns false.
   */
  scrollTo(_sourceIndex: number, _snapToEdge: boolean) {
    return false;
  }

  /**
   * Places the corner at the holder's bottom and inline-end edges when an element scrolls both axes.
   */
  repositionOverlay() {
    if (!this.clone) {
      return;
    }

    const cloneRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    const [end, start] = this.isRtl() ? ['left', 'right'] as const : ['right', 'left'] as const;

    cloneRoot.style.bottom = `${this.bottomOverlay.getBottomInset()}px`;
    cloneRoot.style[start] = '';
    cloneRoot.style[end] = `${this.inlineEndOverlay.getInlineEndInset()}px`;
  }
}
