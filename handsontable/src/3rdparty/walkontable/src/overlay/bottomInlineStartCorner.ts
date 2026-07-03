import type { TableDeps } from '../table';
import {
  resetCssTransform
} from '../../../../helpers/dom/element';
import BottomInlineStartCornerOverlayTable from '../table/bottomInlineStartCorner';
import { Overlay, type OverlayDeps } from './_base';
import {
  CLONE_BOTTOM_INLINE_START_CORNER,
} from './constants';

/**
 * @class BottomInlineStartCornerOverlay
 */
export class BottomInlineStartCornerOverlay extends Overlay {
  /**
   * @type {Overlay}
   */
  declare bottomOverlay: Overlay;
  /**
   * @type {Overlay}
   */
  declare inlineStartOverlay: Overlay;

  /**
   * @param {BottomOverlay} bottomOverlay The instance of the Top overlay.
   * @param {InlineStartOverlay} inlineStartOverlay The instance of the InlineStart overlay.
   */
  constructor(deps: OverlayDeps, bottomOverlay: Overlay, inlineStartOverlay: Overlay) {
    super(deps, CLONE_BOTTOM_INLINE_START_CORNER);
    this.bottomOverlay = bottomOverlay;
    this.inlineStartOverlay = inlineStartOverlay;
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {BottomInlineStartCornerOverlayTable}
   */
  createTable(deps: TableDeps) {
    return new BottomInlineStartCornerOverlayTable(deps);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return (this.wtSettings.getSetting('shouldRenderBottomOverlay') as boolean)
      && (this.wtSettings.getSetting('shouldRenderInlineStartOverlay') as boolean);
  }

  /**
   * Updates the corner overlay position.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    const { wot } = this;

    this.updateTrimmingContainer();

    const { clone } = this;

    if (!(wot.wtTable.holder.parentNode as HTMLElement) || !clone) {
      // removed from DOM
      return false;
    }

    const overlayRoot = clone.wtTable.holder.parentNode as HTMLElement;

    overlayRoot.style.top = '';

    if (this.trimmingContainer === this.deps.rootWindow) {
      const inlineStartOffset = this.inlineStartOverlay.getOverlayOffset();
      const { geometryReader } = this.deps;
      const masterTableRect = geometryReader.getBoundingClientRect(this.wot.wtTable.TABLE);
      const masterHolderRect = geometryReader.getBoundingClientRect(this.wot.wtTable.holder);
      const masterTableOverflow = Math.max(0, masterTableRect.bottom - masterHolderRect.bottom);
      const bottom = this.bottomOverlay.getOverlayOffset() - masterTableOverflow;

      overlayRoot.style[this.isRtl() ? 'right' : 'left'] = `${inlineStartOffset}px`;
      overlayRoot.style.bottom = `${bottom}px`;

    } else {
      resetCssTransform(overlayRoot);
      this.repositionOverlay();
    }

    let tableHeight = this.deps.geometryReader.outerHeight(clone.wtTable.TABLE);
    const tableWidth = this.deps.geometryReader.outerWidth(clone.wtTable.TABLE);

    if (!this.wot.wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRoot.style.height = `${tableHeight}px`;
    overlayRoot.style.width = `${tableWidth}px`;

    return true;
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
   * Reposition the overlay.
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
}
