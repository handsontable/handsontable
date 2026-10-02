import type { TableDeps } from '../../table/baseTable';
import { resetCssTransform } from '../../../../../helpers/dom/element';
import TopInlineEndCornerOverlayTable from '../../table/regions/topInlineEndCornerTable';
import { Overlay, type OverlayDeps } from './_base';
import type { InlineEndOverlay } from './inlineEndOverlay';
import {
  CLONE_TOP_INLINE_END_CORNER,
} from '../constants';

/**
 * The corner where the frozen top rows and the frozen end columns meet. The counterpart of
 * `TopInlineStartCornerOverlay`.
 *
 * @class TopInlineEndCornerOverlay
 */
export class TopInlineEndCornerOverlay extends Overlay {
  /**
   * The instance of the Top overlay.
   *
   * @type {TopOverlay}
   */
  declare topOverlay: Overlay;
  /**
   * The instance of the InlineEnd overlay.
   *
   * @type {InlineEndOverlay}
   */
  declare inlineEndOverlay: InlineEndOverlay;

  /**
   * @param {TopOverlay} topOverlay The instance of the Top overlay.
   * @param {InlineEndOverlay} inlineEndOverlay The instance of the InlineEnd overlay.
   */
  constructor(deps: OverlayDeps, topOverlay: Overlay, inlineEndOverlay: InlineEndOverlay) {
    super(deps, CLONE_TOP_INLINE_END_CORNER);
    this.topOverlay = topOverlay;
    this.inlineEndOverlay = inlineEndOverlay;
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {TopInlineEndCornerOverlayTable}
   */
  createTable(deps: TableDeps) {
    return new TopInlineEndCornerOverlayTable(deps);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return (this.wtSettings.getSetting('shouldRenderTopOverlay') as boolean)
      && (this.wtSettings.getSetting('shouldRenderInlineEndOverlay') as boolean);
  }

  /**
   * Prevents scroll position changes for this overlay.
   * @param {number} _pos The scroll position to set (ignored).
   * @returns {boolean} Always returns false.
   */
  setScrollPosition(_pos: number) {
    return false;
  }
  /**
   * Gets the scroll position for this overlay.
   * @returns {number} Always returns 0.
   */
  getScrollPosition() {
    return 0;
  }
  /**
   * Gets the parent table offset for this overlay.
   * @returns {number} Always returns 0.
   */
  getTableParentOffset() {
    return 0;
  }
  /**
   * Gets the overlay offset for this corner overlay.
   * @returns {number} Always returns 0.
   */
  getOverlayOffset() {
    return 0;
  }
  /**
   * Handles scroll events (intentionally empty for corner overlay).
   */
  onScroll() {}
  /**
   * Sums cell sizes within a range.
   * @param {number} _from The starting cell index (ignored).
   * @param {number} _to The ending cell index (ignored).
   * @returns {number} Always returns 0.
   */
  sumCellSizes(_from: number, _to: number) {
    return 0;
  }
  /**
   * Adjusts overlay element sizes (intentionally empty for corner overlay).
   */
  adjustElementsSize() { // intentionally empty
  }
  /**
   * Applies changes to the DOM (intentionally empty for corner overlay).
   */
  applyToDOM() { // intentionally empty
  }
  /**
   * Scrolls the overlay to a specified position.
   * @param {number} _sourceIndex The source index to scroll to (ignored).
   * @param {boolean} _snapToEdge Whether to snap to edge (ignored).
   * @returns {boolean} Always returns false.
   */
  scrollTo(_sourceIndex: number, _snapToEdge: boolean) {
    return false;
  }

  /**
   * Updates the corner overlay position. An idle corner does no geometry reads: nothing pins it, and
   * `Overlay#reset()` already took it out of its rail.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    if (!this.needFullRender || !(this.deps.getWtTable().holder.parentNode as HTMLElement) || !this.clone) {
      return false;
    }

    const overlayRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    const { rootWindow, geometryReader } = this.deps;
    const wtTable = this.deps.getWtTable();
    const rail = this.getRail();
    const inlineOnWindow = this.inlineEndOverlay.trimmingContainer === rootWindow;
    const blockOnWindow = this.topOverlay.trimmingContainer === rootWindow;
    const tableWidth = geometryReader.outerWidth(this.clone.wtTable.TABLE);
    let tableHeight = geometryReader.outerHeight(this.clone.wtTable.TABLE);

    if (!wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    if (inlineOnWindow || blockOnWindow) {
      // This corner sits where the top rows and the end columns meet, so it travels on each axis the
      // window owns. On an axis an element owns, the rail spans the box the holder shows and the
      // corner stands at its inline-end edge.
      const wtViewport = this.deps.getWtViewport();

      rail?.pin({
        isRtl: this.isRtl(),
        width: inlineOnWindow
          ? wtTable.getTotalWidth()
          : wtViewport.getWorkspaceWidth() - this.inlineEndOverlay.getInlineEndInset(),
        height: wtTable.getTotalHeight(),
        inline: inlineOnWindow,
        inlineEdge: 'end',
        block: blockOnWindow ? { pinned: true, edge: 'top' } : { pinned: false, edge: 'top' },
      });
      resetCssTransform(overlayRoot);

    } else {
      rail?.release();
      resetCssTransform(overlayRoot);
      this.#placeAtInlineEnd(overlayRoot);
    }

    overlayRoot.style.height = `${tableHeight}px`;
    overlayRoot.style.width = `${tableWidth}px`;

    // This corner is drawn over the inline-end edge, on top of the top and the end overlays, so it would
    // re-cover the strip they leave clear for an overlay scrollbar (#10370). The strip is the end
    // overlay's own, read rather than recomputed, so the two can never disagree.
    this.publishScrollbarClearance(
      { inlineEnd: this.inlineEndOverlay.getInlineEndClearance(), rtl: this.isRtl() },
      this.wot.wtOverlays.isScrollbarVisible()
    );

    return true;
  }

  /**
   * Places the corner at the holder's inline-end edge when an element scrolls the columns.
   *
   * @param {HTMLElement} overlayRoot The corner's root element.
   */
  #placeAtInlineEnd(overlayRoot: HTMLElement) {
    const [end, start] = this.isRtl() ? ['left', 'right'] as const : ['right', 'left'] as const;

    overlayRoot.style.top = '0';
    overlayRoot.style[start] = '';
    overlayRoot.style[end] = `${this.inlineEndOverlay.getInlineEndInset()}px`;
  }
}
