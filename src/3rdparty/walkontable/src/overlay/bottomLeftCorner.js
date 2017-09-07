import {
  getScrollbarWidth,
  outerHeight,
  outerWidth,
  setOverlayPosition,
  resetCssTransform
} from 'handsontable/helpers/dom/element';
import Overlay from 'handsontable/3rdparty/walkontable/src/overlay/_base';

/**
 * @class TopLeftCornerOverlay
 */
class BottomLeftCornerOverlay extends Overlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(Overlay.CLONE_BOTTOM_LEFT_CORNER);
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    /* eslint-disable no-unneeded-ternary */
    return this.wot.getSetting('fixedRowsBottom') &&
      (this.wot.getSetting('fixedColumnsLeft') || this.wot.getSetting('rowHeaders').length) ? true : false;
  }

  /**
   * Reposition the overlay.
   */
  repositionOverlay() {
    let scrollbarWidth = getScrollbarWidth();
    let cloneRoot = this.clone.wtTable.holder.parentNode;

    if (this.wot.wtTable.holder.clientHeight === this.wot.wtTable.holder.offsetHeight) {
      scrollbarWidth = 0;
    }

    cloneRoot.style.top = '';
    cloneRoot.style.bottom = scrollbarWidth + 'px';
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
    let overlayRoot = this.clone.wtTable.holder.parentNode;
    let tableHeight = outerHeight(this.clone.wtTable.TABLE);
    let tableWidth = outerWidth(this.clone.wtTable.TABLE);

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
      finalBottom += 'px';
      finalLeft += 'px';

      overlayRoot.style.top = '';
      overlayRoot.style.left = finalLeft;
      overlayRoot.style.bottom = finalBottom;

    } else {
      resetCssTransform(overlayRoot);
      this.repositionOverlay();
    }
    overlayRoot.style.height = (tableHeight === 0 ? tableHeight : tableHeight) + 'px';
    overlayRoot.style.width = (tableWidth === 0 ? tableWidth : tableWidth) + 'px';
  }
}

Overlay.registerOverlay(Overlay.CLONE_BOTTOM_LEFT_CORNER, BottomLeftCornerOverlay);

export default BottomLeftCornerOverlay;
