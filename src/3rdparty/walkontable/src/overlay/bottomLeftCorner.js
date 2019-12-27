import {
  getScrollbarWidth,
  outerHeight,
  outerWidth,
  resetCssTransform
} from './../../../../helpers/dom/element';
import BottomLeftCornerOverlayTable from './../table/bottomLeftCorner';
import Overlay from './_base';

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
    this.updateStateOfRendering();
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor
   * @returns {Table}
   */
  createTable(...args) {
    return new BottomLeftCornerOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    const { master } = this;
    /* eslint-disable no-unneeded-ternary */
    return master.getSetting('fixedRowsBottom') &&
      (master.getSetting('fixedColumnsLeft') || master.getSetting('rowHeaders').length) ? true : false;
  }

  /**
   * Reposition the overlay.
   */
  repositionOverlay() {
    const { master } = this;
    const overlayRootElement = this.clone.wtTable.wtRootElement;
    let scrollbarWidth = getScrollbarWidth(master.rootDocument);

    if (master.wtTable.holder.clientHeight === master.wtTable.holder.offsetHeight) {
      scrollbarWidth = 0;
    }

    overlayRootElement.style.top = '';
    overlayRootElement.style.bottom = `${scrollbarWidth}px`;
  }

  /**
   * Updates the position of the overlay root element relatively to the position of the master instance
   */
  adjustElementsPosition() {
    const { clone, master } = this;
    this.updateTrimmingContainer();

    if (!master.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }
    const overlayRootElement = clone.wtTable.wtRootElement;

    overlayRootElement.style.top = '';

    if (this.trimmingContainer === master.rootWindow) {
      const box = master.wtTable.hider.getBoundingClientRect();
      const bottom = Math.ceil(box.bottom);
      const left = Math.ceil(box.left);
      let finalLeft;
      let finalBottom;
      const bodyHeight = master.rootDocument.body.offsetHeight;

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

      overlayRootElement.style.top = '';
      overlayRootElement.style.left = finalLeft;
      overlayRootElement.style.bottom = finalBottom;

    } else {
      resetCssTransform(overlayRootElement);
      this.repositionOverlay();
    }

    let tableHeight = outerHeight(clone.wtTable.TABLE);
    const tableWidth = outerWidth(clone.wtTable.TABLE);

    if (!master.wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRootElement.style.height = `${tableHeight}px`;
    overlayRootElement.style.width = `${tableWidth}px`;
  }
}

Overlay.registerOverlay(Overlay.CLONE_BOTTOM_LEFT_CORNER, BottomLeftCornerOverlay);

export default BottomLeftCornerOverlay;
