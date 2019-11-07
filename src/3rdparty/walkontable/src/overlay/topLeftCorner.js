
import {
  outerHeight,
  outerWidth,
  setOverlayPosition,
  resetCssTransform
} from './../../../../helpers/dom/element';
import TopLeftCornerOverlayTable from './../table/topLeftCorner';
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
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor
   * @returns {Table}
   */
  createTable(...args) {
    return new TopLeftCornerOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    const { wot } = this;
    return !!((wot.getSetting('fixedRowsTop') || wot.getSetting('columnHeaders').length) &&
        (wot.getSetting('fixedColumnsLeft') || wot.getSetting('rowHeaders').length));
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
    const preventOverflow = this.wot.getSetting('preventOverflow');

    if (this.trimmingContainer === this.wot.rootWindow) {
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

    let tableHeight = outerHeight(this.clone.wtTable.TABLE);
    const tableWidth = outerWidth(this.clone.wtTable.TABLE);

    if (!this.wot.wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRoot.style.height = `${tableHeight === 0 ? tableHeight : tableHeight + 4}px`;
    overlayRoot.style.width = `${tableWidth === 0 ? tableWidth : tableWidth + 4}px`;
  }
}

Overlay.registerOverlay(Overlay.CLONE_TOP_LEFT_CORNER, TopLeftCornerOverlay);

export default TopLeftCornerOverlay;
