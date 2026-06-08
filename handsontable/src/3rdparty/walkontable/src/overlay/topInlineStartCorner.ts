import type { DataAccessObject, DomBindings, WalkontableInstance } from '../types';
import type Settings from '../settings';
import {
  outerHeight,
  outerWidth,
  setOverlayPosition,
  resetCssTransform,
} from '../../../../helpers/dom/element';
import TopInlineStartCornerOverlayTable from '../table/topInlineStartCorner';
import { Overlay } from './_base';
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
   * @param {Walkontable} wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {DomBindings} domBindings Dom elements bound to the current instance.
   * @param {TopOverlay} topOverlay The instance of the Top overlay.
   * @param {InlineStartOverlay} inlineStartOverlay The instance of the InlineStart overlay.
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
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {TopInlineStartCornerOverlayTable}
   */
  createTable(...args: [DataAccessObject, Function, DomBindings, Settings]) {
    return new TopInlineStartCornerOverlayTable(...args);
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
