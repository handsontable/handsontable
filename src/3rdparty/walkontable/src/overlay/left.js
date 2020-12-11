import {
  addClass,
  getScrollbarWidth,
  getScrollLeft,
  getWindowScrollTop,
  outerWidth,
  removeClass,
  setOverlayPosition,
  resetCssTransform,
  getBoundingClientRect,
  clientWidth,
  offsetWidth,
  scrollHeight,
} from './../../../../helpers/dom/element';
import LeftOverlayTable from './../table/left';
import Overlay from './_base';

/**
 * @class LeftOverlay
 */
class LeftOverlay extends Overlay {
  /**
   * @param {Walkontable} wotInstance The Walkontable instance.
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(Overlay.CLONE_LEFT);
    this.updateStateOfRendering();
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {Table}
   */
  createTable(...args) {
    return new LeftOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered() {
    return !!(this.master.getSetting('fixedColumnsLeft') || this.master.getSetting('rowHeaders').length);
  }

  /**
   * Updates the position of the overlay root element relatively to the position of the master instance.
   */
  adjustElementsPosition() {
    const { master } = this;
    const total = master.getSetting('totalColumns');

    if (typeof master.wtViewport.columnsRenderCalculator.startPosition === 'number') {
      master.wtTable.spreader.style.left = `${master.wtViewport.columnsRenderCalculator.startPosition}px`;

    } else if (total === 0) {
      master.wtTable.spreader.style.left = '0';

    } else {
      throw new Error('Incorrect value of the columnsRenderCalculator');
    }
    master.wtTable.spreader.style.right = '';

    if (this.needFullRender) {
      if (typeof master.wtViewport.rowsRenderCalculator.startPosition === 'number') {
        this.clone.wtTable.spreader.style.top = `${master.wtViewport.rowsRenderCalculator.startPosition}px`;

      } else {
        this.clone.wtTable.spreader.style.top = '';
      }
    }

    if (!this.needFullRender || !master.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }

    const overlayRootElement = this.clone.wtTable.wtRootElement;
    const preventOverflow = master.getSetting('preventOverflow');

    if (master.wtTable.trimmingContainer === master.rootWindow && (!preventOverflow || preventOverflow !== 'horizontal')) {
      const box = getBoundingClientRect(master.wtTable.hider);
      const left = Math.ceil(box.left);
      const right = Math.ceil(box.right);
      let finalLeft;
      let finalTop;

      finalTop = master.wtTable.hider.style.top;
      finalTop = finalTop === '' ? 0 : finalTop;

      if (left < 0 && (right - offsetWidth(overlayRootElement)) > 0) {
        finalLeft = -left;
      } else {
        finalLeft = 0;
      }
      finalLeft += 'px';

      setOverlayPosition(overlayRootElement, finalLeft, finalTop);

    } else {
      resetCssTransform(overlayRootElement);
    }

    const masterRootElement = master.wtTable.wtRootElement;
    const totalRows = master.getSetting('totalRows');

    if (totalRows) {
      removeClass(masterRootElement, 'emptyRows');
    } else {
      addClass(masterRootElement, 'emptyRows');
    }
  }

  /**
   * Sets the main overlay's horizontal scroll position.
   *
   * @param {number} pos The scroll position.
   * @returns {boolean}
   */
  setScrollPosition(pos) {
    const { rootWindow } = this.master;
    let result = false;

    if (this.mainTableScrollableElement === rootWindow && rootWindow.scrollX !== pos) {
      rootWindow.scrollTo(pos, getWindowScrollTop(rootWindow));
      result = true;

    } else if (this.mainTableScrollableElement.scrollLeft !== pos) {
      this.mainTableScrollableElement.scrollLeft = pos;
      result = true;
    }

    return result;
  }

  /**
   * Triggers onScroll hook callback.
   */
  onScroll() {
    this.master.getSetting('onScrollVertically');
  }

  /**
   * Calculates total sum cells width.
   *
   * @param {number} from Column index which calculates started from.
   * @param {number} to Column index where calculation is finished.
   * @returns {number} Width sum.
   */
  sumCellSizes(from, to) {
    const defaultColumnWidth = this.master.wtSettings.defaultColumnWidth;
    let column = from;
    let sum = 0;

    while (column < to) {
      sum += this.master.columnUtils.getStretchedColumnWidth(column) || defaultColumnWidth;
      column += 1;
    }

    return sum;
  }

  /**
   * If needed, adjust the sizes of the clone and the master elements to the dimensions of the trimming container.
   *
   * @param {boolean} [force=false] When `true`, it adjusts the DOM nodes sizes for that overlay.
   */
  adjustElementsSize(force = false) {
    if (!this.needFullRender && !force) {
      return;
    }

    const { clone, master } = this;
    const overlayRootElement = clone.wtTable.wtRootElement;
    const overlayRootElementStyle = overlayRootElement.style;
    const preventOverflow = master.getSetting('preventOverflow');

    if (master.wtTable.trimmingContainer !== master.rootWindow || preventOverflow === 'vertical') {
      let height = master.wtViewport.getWorkspaceHeight();

      if (master.wtOverlays.hasScrollbarBottom) {
        height -= getScrollbarWidth(master.rootDocument);
      }

      height = Math.min(height, scrollHeight(master.wtTable.wtRootElement));
      overlayRootElementStyle.height = `${height}px`;

    } else {
      overlayRootElementStyle.height = '';
    }

    const tableWidth = outerWidth(clone.wtTable.TABLE);

    overlayRootElementStyle.width = `${tableWidth}px`;

    clone.wtTable.hider.style.height = master.wtTable.hider.style.height;
    clone.wtTable.holder.style.height = overlayRootElementStyle.height;
    clone.wtTable.holder.style.width = overlayRootElementStyle.width;

    if (!force) {
      this.areElementSizesAdjusted = true;
    }
  }

  /**
   * Scrolls horizontally to a column at the left edge of the viewport.
   *
   * @param {number} sourceCol  Column index which you want to scroll to.
   * @param {boolean} [beyondRendered]  If `true`, scrolls according to the bottom edge (top edge is by default).
   * @returns {boolean}
   */
  scrollTo(sourceCol, beyondRendered) {
    const { master } = this;
    let newX = this.getTableParentOffset();
    const mainHolder = master.wtTable.holder;
    let scrollbarCompensation = 0;

    if (beyondRendered && offsetWidth(mainHolder) !== clientWidth(mainHolder)) {
      scrollbarCompensation = getScrollbarWidth(master.rootDocument);
    }
    if (beyondRendered) {
      newX += this.sumCellSizes(0, sourceCol + 1);
      newX -= master.wtViewport.getViewportWidth();

    } else {
      newX += this.sumCellSizes(master.getSetting('fixedColumnsLeft'), sourceCol);
    }

    newX += scrollbarCompensation;

    return this.setScrollPosition(newX);
  }

  /**
   * Gets table parent left position.
   *
   * @returns {number}
   */
  getTableParentOffset() {
    const preventOverflow = this.master.getSetting('preventOverflow');
    let offset = 0;

    if (!preventOverflow && this.master.wtTable.trimmingContainer === this.master.rootWindow) {
      offset = this.master.wtTable.holderOffset.left;
    }

    return offset;
  }

  /**
   * Gets the main overlay's horizontal scroll position.
   *
   * @returns {number} Main table's vertical scroll position.
   */
  getScrollPosition() {
    return getScrollLeft(this.mainTableScrollableElement, this.master.rootWindow);
  }
}

Overlay.registerOverlay(Overlay.CLONE_LEFT, LeftOverlay);

export default LeftOverlay;
