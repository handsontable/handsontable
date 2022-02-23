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
  topOverlay;
  /**
   * The instance of the InlineStart overlay.
   *
   * @type {InlineStartOverlay}
   */
  inlineStartOverlay;

  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {DomBindings} domBindings Dom elements bound to the current instance.
   * @param {TopOverlay} topOverlay The instance of the Top overlay.
   * @param {InlineStartOverlay} inlineStartOverlay The instance of the InlineStart overlay.
   */
  constructor(wotInstance, facadeGetter, wtSettings, domBindings, topOverlay, inlineStartOverlay) {
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
  createTable(...args) {
    return new TopInlineStartCornerOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered() {
    return this.wtSettings.getSetting('shouldRenderTopOverlay')
      && this.wtSettings.getSetting('shouldRenderInlineStartOverlay');
  }

  /**
   * Updates the corner overlay position.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    this.updateTrimmingContainer();

    if (!this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return false;
    }

    const overlayRoot = this.clone.wtTable.holder.parentNode;

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

    return false;
  }
}
