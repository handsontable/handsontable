import {
  outerHeight,
  outerWidth,
  setOverlayPosition,
  resetCssTransform
} from './../../../../helpers/dom/element';
import TopLeftCornerOverlayTable from './../table/topLeftCorner';
import { Overlay } from './_base';
import {
  CLONE_TOP_LEFT_CORNER,
} from './constants';

/**
 * @class TopLeftCornerOverlay
 */
export class TopLeftCornerOverlay extends Overlay {
  static get OVERLAY_NAME() {
    return CLONE_TOP_LEFT_CORNER;
  }

  /**
   * @param {Walkontable} wotInstance The Walkontable instance.
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(CLONE_TOP_LEFT_CORNER);
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {Table}
   */
  createTable(...args) {
    return new TopLeftCornerOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered() {
    const { wot } = this;

    return wot.getSetting('shouldRenderTopOverlay') && wot.getSetting('shouldRenderLeftOverlay');
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
      return;
    }

    const overlayRoot = this.clone.wtTable.holder.parentNode;
    const preventOverflow = this.wot.getSetting('preventOverflow');

    if (this.trimmingContainer === this.wot.rootWindow) {
      const { wtTable } = this.wot;
      const hiderRect = wtTable.hider.getBoundingClientRect();
      const top = Math.ceil(hiderRect.top);
      const left = Math.ceil(hiderRect.left);
      const bottom = Math.ceil(hiderRect.bottom);
      const right = Math.ceil(hiderRect.right);
      let finalLeft = '0';
      let finalTop = '0';

      if (!preventOverflow || preventOverflow === 'vertical') {
        if (left < 0 && (right - overlayRoot.offsetWidth) > 0) {
          finalLeft = `${-left}px`;
        }
      }

      if (!preventOverflow || preventOverflow === 'horizontal') {
        if (top < 0 && (bottom - overlayRoot.offsetHeight) > 0) {
          finalTop = `${-top}px`;
        }
      }
      setOverlayPosition(overlayRoot, finalLeft, finalTop);
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
