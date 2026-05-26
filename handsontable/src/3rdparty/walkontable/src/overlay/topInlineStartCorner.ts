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

  setScrollPosition(_pos: number) { return false; }
  getScrollPosition() { return 0; }
  getTableParentOffset() { return 0; }
  getOverlayOffset() { return 0; }
  onScroll() {}
  sumCellSizes(_from: number, _to: number) { return 0; }
  adjustElementsSize() { // intentionally empty
  }
  applyToDOM() { // intentionally empty
  }
  scrollTo(_sourceIndex: number, _snapToEdge: boolean) { return false; }

  /**
   * Updates the corner overlay position.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    this.updateTrimmingContainer();

    if (!(this.wot.wtTable.holder.parentNode as HTMLElement)) {
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
