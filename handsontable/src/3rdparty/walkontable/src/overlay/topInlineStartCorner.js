import {
  outerHeight,
  outerWidth,
  setOverlayPosition,
  resetCssTransform
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
   * @param {Walkontable} wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {DomBindings} domBindings Dom elements bound to the current instance.
   */
  constructor(wotInstance, facadeGetter, wtSettings, domBindings) {
    super(wotInstance, facadeGetter, CLONE_TOP_INLINE_START_CORNER, wtSettings, domBindings);
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

  getOverlayPosition() {
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    let x = 0;
    let y = 0;

    if (this.trimmingContainer === this.domBindings.rootWindow) {
      const { wtTable } = this.wot;
      const { rootDocument } = this.domBindings;
      const hiderRect = wtTable.hider.getBoundingClientRect();
      const top = Math.ceil(hiderRect.top);
      const left = Math.ceil(hiderRect.left);
      const bottom = Math.ceil(hiderRect.bottom);
      const right = Math.ceil(hiderRect.right);

      if (!preventOverflow || preventOverflow === 'vertical') {
        if (this.isRtl()) {
          const documentWidth = rootDocument.documentElement.clientWidth;

          if (right >= documentWidth) {
            x = documentWidth - right;
          }

        } else if (left < 0 && (right - overlayRoot.offsetWidth) > 0) {
          x = -left;
        }
      }

      if (!preventOverflow || preventOverflow === 'horizontal') {
        if (top < 0 && (bottom - overlayRoot.offsetHeight) > 0) {
          y = -top;
        }
      }
    }

    return {
      x,
      y,
    };
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
      const { x, y } = this.getOverlayPosition();

      setOverlayPosition(overlayRoot, `${x}px`, `${y}px`);
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
