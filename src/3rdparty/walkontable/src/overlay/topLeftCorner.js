
import {
  outerHeight,
  outerWidth,
  setOverlayPosition,
  resetCssTransform
} from './../../../../helpers/dom/element';
import Overlay from './_base';

/**
 * @class TopLeftCornerOverlay
 */
class TopLeftCornerOverlay extends Overlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(Overlay.CLONE_TOP_LEFT_CORNER);
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    return !!((this.wot.getSetting('fixedRowsTop') || this.wot.getSetting('columnHeaders').length) &&
        (this.wot.getSetting('fixedColumnsLeft') || this.wot.getSetting('rowHeaders').length));
  }

  /**
   * Updates the corner overlay position
   */
  resetFixedPosition() {
    this.updateTrimmingContainer();

    if (!this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    const tableHeight = outerHeight(this.clone.wtTable.TABLE);
    const tableWidth = outerWidth(this.clone.wtTable.TABLE);
    const preventOverflow = this.wot.getSetting('preventOverflow');

    if (this.trimmingContainer === window) {
      const box = this.wot.wtTable.hider.getBoundingClientRect();
      const top = Math.ceil(box.top);
      const left = Math.ceil(box.left);
      const bottom = Math.ceil(box.bottom);
      const right = Math.ceil(box.right);
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
    overlayRoot.style.height = `${tableHeight === 0 ? tableHeight : tableHeight + 4}px`;
    overlayRoot.style.width = `${tableWidth === 0 ? tableWidth : tableWidth + 4}px`;
  }
}

Overlay.registerOverlay(Overlay.CLONE_TOP_LEFT_CORNER, TopLeftCornerOverlay);

export default TopLeftCornerOverlay;
