import type from '../types';
import type Settings from '../settings';
import {
  outerHeight,
  outerWidth,
  setOverlayPosition,
  resetCssTransform,
} from '../../../../helpers/dom/element';
import TopInlineStartCornerOverlayTable from '../table/topInlineStartCorner';
import from './_base';
import {
  CLONE_TOP_INLINE_START_CORNER,
} from './constants';

/**
 * @class TopInlineStartCornerOverlay
 */
export class TopInlineStartCornerOverlay extends Overlay {
  /**
   * The instance of the Top overlay.
   *
   */
  declare topOverlay: Overlay;
  /**
   * The instance of the InlineStart overlay.
   *
   */
  declare inlineStartOverlay: Overlay;

  /**
   * @param wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param facadeGetter Function which return proper facade.
   * @param wtSettings The Walkontable settings.
   * @param domBindings Dom elements bound to the current instance.
   * @param topOverlay The instance of the Top overlay.
   * @param inlineStartOverlay The instance of the InlineStart overlay.
   */
  constructor(
    wotInstance: WalkontableInstance, facadeGetter: Function, wtSettings: Settings,
    domBindings: DomBindings, topOverlay: Overlay, inlineStartOverlay: Overlay) {
    super(wotInstance, facadeGetter, CLONE_TOP_INLINE_START_CORNER, wtSettings, domBindings);
    this.topOverlay = topOverlay;
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
    return new TopInlineStartCornerOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns 
   */
  shouldBeRendered(): boolean {
    return (this.wtSettings.getSetting('shouldRenderTopOverlay') as boolean)
      && (this.wtSettings.getSetting('shouldRenderInlineStartOverlay') as boolean);
  }

  /**
   * No-op implementation. The corner overlay does not scroll independently.
   */
  setScrollPosition(_pos: number) {
    return false;
  }

  /**
   * Returns 0 because the corner overlay has no independent scroll position.
   */
  getScrollPosition() {
    return 0;
  }

  /**
   * Returns 0 because the corner overlay has no parent offset relevant to scrolling.
   */
  getTableParentOffset() {
    return 0;
  }

  /**
   * Returns 0 because the corner overlay position is controlled entirely by the top and inline-start overlays.
   */
  getOverlayOffset() {
    return 0;
  }

  /**
   * No-op implementation. The corner overlay does not handle scroll events.
   */
  onScroll() {}

  /**
   * Returns 0 because the corner overlay does not measure cell sizes independently.
   */
  sumCellSizes(_from: number, _to: number) {
    return 0;
  }

  /**
   * No-op implementation. Element sizes for the corner are controlled by `resetFixedPosition`.
   */
  adjustElementsSize() { // intentionally empty
  }

  /**
   * No-op implementation. DOM application is handled by `resetFixedPosition`.
   */
  applyToDOM() { // intentionally empty
  }

  /**
   * No-op implementation. The corner overlay does not support programmatic scrolling.
   */
  scrollTo(_sourceIndex: number, _snapToEdge: boolean) {
    return false;
  }

  /**
   * Updates the corner overlay position.
   *
   * @returns 
   */
  resetFixedPosition() {
    this.updateTrimmingContainer();

    if (!(this.wot.wtTable.holder.parentNode as HTMLElement) || !this.clone) {
      // removed from DOM
      return false;
    }

    const overlayRoot = this.clone.wtTable.holder.parentNode as HTMLElement;

    if (this.trimmingContainer === this.domBindings.rootWindow) {
      const left = this.inlineStartOverlay.getOverlayOffset() * (this.isRtl() ? -1 : 1);
      const top = this.topOverlay.getOverlayOffset();

      setOverlayPosition(overlayRoot, `${left}px`, `${top}px`);
    } else {
      resetCssTransform(overlayRoot);
    }

    let tableHeight = outerHeight(this.clone.wtTable.TABLE);
    const tableWidth = outerWidth(this.clone.wtTable.TABLE);

    if (!this.wot.wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRoot.style.height = `${tableHeight}px`;
    overlayRoot.style.width = `${tableWidth}px`;

    return true;
  }
}
