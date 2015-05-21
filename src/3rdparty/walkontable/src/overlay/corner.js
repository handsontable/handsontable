
import * as dom from './../../../../dom.js';
import {WalkontableOverlay} from './_base.js';


/**
 * @class WalkontableCornerOverlay
 */
class WalkontableCornerOverlay extends WalkontableOverlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(WalkontableOverlay.CLONE_CORNER);
  }

  /**
   * Updates the corner overlay position
   */
  resetFixedPosition() {
    if (!this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }
    let elem = this.clone.wtTable.holder.parentNode;
    let tableHeight;
    let tableWidth;

    if (this.trimmingContainer === window) {
      let box = this.wot.wtTable.hider.getBoundingClientRect();
      let top = Math.ceil(box.top);
      let left = Math.ceil(box.left);
      let bottom = Math.ceil(box.bottom);
      let right = Math.ceil(box.right);
      let finalLeft;
      let finalTop;

      if (left < 0 && (right - elem.offsetWidth) > 0) {
        finalLeft = -left + 'px';
      } else {
        finalLeft = '0';
      }

      if (top < 0 && (bottom - elem.offsetHeight) > 0) {
        finalTop = -top + 'px';
      } else {
        finalTop = '0';
      }
      dom.setOverlayPosition(elem, finalLeft, finalTop);
    }
    tableHeight = dom.outerHeight(this.clone.wtTable.TABLE);
    tableWidth = dom.outerWidth(this.clone.wtTable.TABLE);

    elem.style.height = (tableHeight === 0 ? tableHeight : tableHeight + 4) + 'px';
    elem.style.width = (tableWidth === 0 ? tableWidth : tableWidth + 4) + 'px';
  }
}

export {WalkontableCornerOverlay};

window.WalkontableCornerOverlay = WalkontableCornerOverlay;
