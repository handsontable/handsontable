import type { TableDeps } from '../../table/baseTable';
import {
  setOverlayPosition,
  resetCssTransform,
} from '../../../../../helpers/dom/element';
import TopInlineStartCornerOverlayTable from '../../table/regions/topInlineStartCornerTable';
import { Overlay, type OverlayDeps } from './_base';
import {
  CLONE_TOP_INLINE_START_CORNER,
} from '../constants';

/**
 * @class TopInlineStartCornerOverlay
 */
export class TopInlineStartCornerOverlay extends Overlay {
  /**
   * The instance of the Top overlay.
   *
   * @type {TopOverlay}
   */
  declare topOverlay: Overlay;
  /**
   * The instance of the InlineStart overlay.
   *
   * @type {InlineStartOverlay}
   */
  declare inlineStartOverlay: Overlay;

  /**
   * @param {TopOverlay} topOverlay The instance of the Top overlay.
   * @param {InlineStartOverlay} inlineStartOverlay The instance of the InlineStart overlay.
   */
  constructor(deps: OverlayDeps, topOverlay: Overlay, inlineStartOverlay: Overlay) {
    super(deps, CLONE_TOP_INLINE_START_CORNER);
    this.topOverlay = topOverlay;
    this.inlineStartOverlay = inlineStartOverlay;
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {TopInlineStartCornerOverlayTable}
   */
  createTable(deps: TableDeps) {
    return new TopInlineStartCornerOverlayTable(deps);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return (this.wtSettings.getSetting('shouldRenderTopOverlay') as boolean)
      && (this.wtSettings.getSetting('shouldRenderInlineStartOverlay') as boolean);
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
   * Updates the corner overlay position.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    if (!(this.deps.getWtTable().holder.parentNode as HTMLElement) || !this.clone) {
      // removed from DOM
      return false;
    }

    const overlayRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    const { rootWindow } = this.deps;
    const wtTable = this.deps.getWtTable();
    const rail = this.getRail();
    const inlineOnWindow = this.inlineStartOverlay.trimmingContainer === rootWindow;
    const blockOnWindow = this.topOverlay.trimmingContainer === rootWindow;
    // This corner sits where the row headers and the column headers meet, so it travels on both axes
    // the window owns (DEV-127 sideways, DEV-126 up and down). A corner that does not render stays
    // out of the rail, as `reset()` left it.
    const railed = this.needFullRender && (inlineOnWindow || blockOnWindow);

    if (railed) {
      rail?.pin({
        isRtl: this.isRtl(),
        width: wtTable.getTotalWidth(),
        height: wtTable.getTotalHeight(),
        inline: inlineOnWindow,
        block: blockOnWindow ? { pinned: true, edge: 'top' } : { pinned: false, edge: 'top' },
      });
    } else {
      rail?.release();
    }

    // Whatever the rail does not hold is still placed from the listener: a neighbor whose axis is
    // owned by an element reports a 0 offset on that axis, so the positioned form is right whenever
    // at least one axis scrolls with the window.
    if (blockOnWindow || inlineOnWindow) {
      const left = rail?.pinsInline() ? 0 : this.inlineStartOverlay.getOverlayOffset() * (this.isRtl() ? -1 : 1);
      const top = rail?.pinsBlock() ? 0 : this.topOverlay.getOverlayOffset();

      setOverlayPosition(overlayRoot, `${left}px`, `${top}px`);
    } else {
      resetCssTransform(overlayRoot);
    }

    const { geometryReader } = this.deps;
    let tableHeight = geometryReader.outerHeight(this.clone.wtTable.TABLE);
    const tableWidth = geometryReader.outerWidth(this.clone.wtTable.TABLE);

    if (!this.deps.getWtTable().hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRoot.style.height = `${tableHeight}px`;
    overlayRoot.style.width = `${tableWidth}px`;

    return true;
  }
}
