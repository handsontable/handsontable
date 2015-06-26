import * as dom from './../../../../dom.js';
import {WalkontableOverlay} from './_base.js';


/**
 * @class WalkontableTopLeftCornerOverlay
 */
class WalkontableBottomLeftCornerOverlay extends WalkontableOverlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(WalkontableOverlay.CLONE_BOTTOM_LEFT_CORNER);
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    return this.wot.getSetting('fixedRowsBottom') &&
    (this.wot.getSetting('fixedColumnsLeft') || this.wot.getSetting('rowHeaders').length) ? true : false;
  }

  /**
   *
   */
  repositionOverlay() {
    let scrollbarWidth = dom.getScrollbarWidth();
    let cloneRoot = this.clone.wtTable.holder.parentNode;

    cloneRoot.style.top = '';
    cloneRoot.style.bottom = scrollbarWidth + 'px';
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
    let tableHeight = dom.outerHeight(this.clone.wtTable.TABLE);
    let tableWidth = dom.outerWidth(this.clone.wtTable.TABLE);

    overlayRoot.style.top = '';

    if (this.trimmingContainer === window) {
      let box = this.wot.wtTable.hider.getBoundingClientRect();
      let bottom = Math.ceil(box.bottom);
      let left = Math.ceil(box.left);
      let finalLeft;
      let finalBottom;
      let bodyHeight = document.body.offsetHeight;

      if (left < 0) {
        finalLeft = -left;
      } else {
        finalLeft = 0;
      }

      if (bottom > bodyHeight) {
        finalBottom = (bottom - bodyHeight);
      } else {
        finalBottom = 0;
      }
      finalBottom = finalBottom + 'px';
      finalLeft = finalLeft + 'px';

      dom.setOverlayPosition(overlayRoot, finalLeft, null, finalBottom);

    } else {
      this.repositionOverlay();
    }
    overlayRoot.style.height = (tableHeight === 0 ? tableHeight : tableHeight) + 'px';
    overlayRoot.style.width = (tableWidth === 0 ? tableWidth : tableWidth) + 'px';
  }
}

export {WalkontableBottomLeftCornerOverlay};

window.WalkontableBottomLeftCornerOverlay = WalkontableBottomLeftCornerOverlay;
