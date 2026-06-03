import type from '../types';
import type Settings from '../settings';
import {
  getScrollbarWidth,
  outerHeight,
  outerWidth,
  resetCssTransform
} from '../../../../helpers/dom/element';
import BottomInlineStartCornerOverlayTable from '../table/bottomInlineStartCorner';
import from './_base';
import {
  CLONE_BOTTOM_INLINE_START_CORNER,
} from './constants';

/**
 * @class BottomInlineStartCornerOverlay
 */
export class BottomInlineStartCornerOverlay extends Overlay {
  /**
   * The bottom overlay instance used to calculate the vertical offset for this corner overlay.
   */
  declare bottomOverlay: Overlay;
  /**
   * The inline-start overlay instance used to calculate the horizontal offset for this corner overlay.
   */
  declare inlineStartOverlay: Overlay;

  /**
   * @param wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param facadeGetter Function which return proper facade.
   * @param wtSettings The Walkontable settings.
   * @param domBindings Dom elements bound to the current instance.
   * @param bottomOverlay The instance of the Top overlay.
   * @param inlineStartOverlay The instance of the InlineStart overlay.
   */
  constructor(
    wotInstance: WalkontableInstance, facadeGetter: Function, wtSettings: Settings,
    domBindings: DomBindings, bottomOverlay: Overlay, inlineStartOverlay: Overlay) {
    super(wotInstance, facadeGetter, CLONE_BOTTOM_INLINE_START_CORNER, wtSettings, domBindings);
    this.bottomOverlay = bottomOverlay;
    this.inlineStartOverlay = inlineStartOverlay;
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param args Parameters that will be forwarded to the `Table` constructor.
   * @returns 
   */
  createTable(...args: [DataAccessObject, Function, DomBindings, Settings]) {
    return new BottomInlineStartCornerOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns 
   */
  shouldBeRendered(): boolean {
    return (this.wtSettings.getSetting('shouldRenderBottomOverlay') as boolean)
      && (this.wtSettings.getSetting('shouldRenderInlineStartOverlay') as boolean);
  }

  /**
   * Updates the corner overlay position.
   *
   * @returns 
   */
  resetFixedPosition() {
    const = this;

    this.updateTrimmingContainer();

    const = this;

    if (!(wot.wtTable.holder.parentNode as HTMLElement) || !clone) {
      // removed from DOM
      return false;
    }

    const overlayRoot = clone.wtTable.holder.parentNode as HTMLElement;

    overlayRoot.style.top = '';

    if (this.trimmingContainer === this.domBindings.rootWindow) {
      const inlineStartOffset = this.inlineStartOverlay.getOverlayOffset();
      const masterTableRect = this.wot.wtTable.TABLE.getBoundingClientRect();
      const masterHolderRect = this.wot.wtTable.holder.getBoundingClientRect();
      const masterTableOverflow = Math.max(0, masterTableRect.bottom - masterHolderRect.bottom);
      const bottom = this.bottomOverlay.getOverlayOffset() - masterTableOverflow;

      overlayRoot.style[this.isRtl() ? 'right' : 'left'] = `${inlineStartOffset}px`;
      overlayRoot.style.bottom = `${bottom}px`;

    } else {
      resetCssTransform(overlayRoot);
      this.repositionOverlay();
    }

    let tableHeight = outerHeight(clone.wtTable.TABLE);
    const tableWidth = outerWidth(clone.wtTable.TABLE);

    if (!this.wot.wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRoot.style.height = `${tableHeight}px`;
    overlayRoot.style.width = `${tableWidth}px`;

    return true;
  }

  /**
   * Not applicable for this corner overlay. Always returns `false`.
   */
  setScrollPosition(_pos: number) {
    return false;
  }

  /**
   * Not applicable for this corner overlay. Always returns `0`.
   */
  getScrollPosition() {
    return 0;
  }

  /**
   * Not applicable for this corner overlay. Always returns `0`.
   */
  getTableParentOffset() {
    return 0;
  }

  /**
   * Not applicable for this corner overlay. Always returns `0`.
   */
  getOverlayOffset() {
    return 0;
  }

  /**
   * Not applicable for this corner overlay. Intentionally a no-op.
   */
  onScroll() {}

  /**
   * Not applicable for this corner overlay. Always returns `0`.
   */
  sumCellSizes(_from: number, _to: number) {
    return 0;
  }

  /**
   * Not applicable for this corner overlay. Intentionally a no-op.
   */
  adjustElementsSize() { // intentionally empty
  }

  /**
   * Not applicable for this corner overlay. Intentionally a no-op.
   */
  applyToDOM() { // intentionally empty
  }

  /**
   * Not applicable for this corner overlay. Always returns `false`.
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

    const = this.wot;
    const = this.domBindings;
    const cloneRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    let bottomOffset = 0;

    if (!wtViewport.hasVerticalScroll()) {
      bottomOffset += (wtViewport.getWorkspaceHeight() - wtTable.getTotalHeight());
    }

    if (wtViewport.hasVerticalScroll() && wtViewport.hasHorizontalScroll()) {
      bottomOffset += getScrollbarWidth(rootDocument);
    }

    cloneRoot.style.bottom = `${bottomOffset}px`;
  }
}
