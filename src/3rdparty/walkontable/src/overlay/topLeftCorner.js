
import {
  outerHeight,
  outerWidth,
  setOverlayPosition
} from './../../../../helpers/dom/element';
import {WalkontableOverlay} from './_base';

/**
 * @class WalkontableTopLeftCornerOverlay
 */
class WalkontableTopLeftCornerOverlay extends WalkontableOverlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(WalkontableOverlay.CLONE_TOP_LEFT_CORNER);
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    return (this.wot.getSetting('fixedRowsTop') || this.wot.getSetting('columnHeaders').length) &&
        (this.wot.getSetting('fixedColumnsLeft') || this.wot.getSetting('rowHeaders').length) ? true : false;
  }

  /**
   * Updates the corner overlay position
   */
  resetFixedPosition() {
    if (!this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }
    let overlayRoot = this.clone.wtTable.holder.parentNode;
    let tableHeight = outerHeight(this.clone.wtTable.TABLE);
    let tableWidth = outerWidth(this.clone.wtTable.TABLE);
    let preventOverflow = this.wot.getSetting('preventOverflow');

    if (this.trimmingContainer === window) {
      let box = this.wot.wtTable.hider.getBoundingClientRect();
      let top = Math.ceil(box.top);
      let left = Math.ceil(box.left);
      let bottom = Math.ceil(box.bottom);
      let right = Math.ceil(box.right);
      let finalLeft = '0';
      let finalTop = '0';

      if (!preventOverflow || preventOverflow === 'vertical') {
        if (left < 0 && (right - overlayRoot.offsetWidth) > 0) {
          finalLeft = -left + 'px';
        }
      }

      if (!preventOverflow || preventOverflow === 'horizontal') {
        if (top < 0 && (bottom - overlayRoot.offsetHeight) > 0) {
          finalTop = -top + 'px';
        }
      }
      setOverlayPosition(overlayRoot, finalLeft, finalTop);
    }
    overlayRoot.style.height = (tableHeight === 0 ? tableHeight : tableHeight + 4) + 'px';
    overlayRoot.style.width = (tableWidth === 0 ? tableWidth : tableWidth + 4) + 'px';
  }
}

export {WalkontableTopLeftCornerOverlay};

window.WalkontableTopLeftCornerOverlay = WalkontableTopLeftCornerOverlay;

WalkontableOverlay.registerOverlay(WalkontableOverlay.CLONE_TOP_LEFT_CORNER, WalkontableTopLeftCornerOverlay);
