import {
  getScrollbarWidth,
  getScrollTop,
  getWindowScrollLeft,
  outerHeight,
  resetCssTransform,
  getBoundingClientRect,
  clientHeight,
  offsetHeight,
  scrollWidth,
} from './../../../../helpers/dom/element';
import BottomOverlayTable from './../table/bottom';
import Overlay from './_base';

/**
 * @class BottomOverlay
 */
class BottomOverlay extends Overlay {
  /**
   * @param {Walkontable} wotInstance The Walkontable instance.
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(Overlay.CLONE_BOTTOM);
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
    return new BottomOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered() {
    /* eslint-disable no-unneeded-ternary */
    return this.master.getSetting('fixedRowsBottom') ? true : false;
  }

  /**
   * Updates the position of the overlay root element relatively to the position of the master instance.
   */
  adjustElementsPosition() {
    const { master } = this;
    const total = master.getSetting('totalRows');

    if (typeof master.wtViewport.rowsRenderCalculator.startPosition === 'number') {
      master.wtTable.spreader.style.top = `${master.wtViewport.rowsRenderCalculator.startPosition}px`;

    } else if (total === 0) {
      // can happen if there are 0 rows
      master.wtTable.spreader.style.top = '0';

    } else {
      throw new Error('Incorrect value of the rowsRenderCalculator');
    }
    master.wtTable.spreader.style.bottom = '';

    if (this.needFullRender) {
      if (typeof master.wtViewport.columnsRenderCalculator.startPosition === 'number') {
        this.clone.wtTable.spreader.style.left = `${master.wtViewport.columnsRenderCalculator.startPosition}px`;

      } else {
        this.clone.wtTable.spreader.style.left = '';
      }
    }

    if (!this.needFullRender || !master.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }

    const overlayRootElement = this.clone.wtTable.wtRootElement;
    const preventOverflow = master.getSetting('preventOverflow');

    overlayRootElement.style.top = '';

    if (master.wtTable.trimmingContainer === master.rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      const box = getBoundingClientRect(master.wtTable.hider);
      const bottom = Math.ceil(box.bottom);
      let finalLeft;
      let finalBottom;
      const bodyHeight = offsetHeight(master.rootDocument.body);

      finalLeft = master.wtTable.hider.style.left;
      finalLeft = finalLeft === '' ? 0 : finalLeft;

      if (bottom > bodyHeight) {
        finalBottom = (bottom - bodyHeight);
      } else {
        finalBottom = 0;
      }
      finalBottom += 'px';

      overlayRootElement.style.top = '';
      overlayRootElement.style.left = finalLeft;
      overlayRootElement.style.bottom = finalBottom;

    } else {
      resetCssTransform(overlayRootElement);

      let scrollbarWidth = getScrollbarWidth(master.rootDocument);

      if (clientHeight(master.wtTable.holder) === offsetHeight(master.wtTable.holder)) {
        scrollbarWidth = 0;
      }

      overlayRootElement.style.top = '';
      overlayRootElement.style.bottom = `${scrollbarWidth}px`;
    }
  }

  /**
   * Sets the main overlay's vertical scroll position.
   *
   * @param {number} pos The scroll position.
   * @returns {boolean}
   */
  setScrollPosition(pos) {
    const { master } = this;
    let result = false;

    if (this.mainTableScrollableElement === master.rootWindow) {
      master.rootWindow.scrollTo(getWindowScrollLeft(master.rootWindow), pos);
      result = true;

    } else if (this.mainTableScrollableElement.scrollTop !== pos) {
      this.mainTableScrollableElement.scrollTop = pos;
      result = true;
    }

    return result;
  }

  /**
   * Triggers onScroll hook callback.
   */
  onScroll() {
    this.master.getSetting('onScrollHorizontally');
  }

  /**
   * Calculates total sum cells height.
   *
   * @param {number} from Row index which calculates started from.
   * @param {number} to Row index where calculation is finished.
   * @returns {number} Height sum.
   */
  sumCellSizes(from, to) {
    const { master } = this;
    const defaultRowHeight = master.wtSettings.settings.defaultRowHeight;
    let row = from;
    let sum = 0;

    while (row < to) {
      const height = master.rowUtils.getHeight(row);

      sum += height === void 0 ? defaultRowHeight : height;
      row += 1;
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

    if (master.wtTable.trimmingContainer !== master.rootWindow || preventOverflow === 'horizontal') {
      let width = master.wtViewport.getWorkspaceWidth();

      if (master.wtOverlays.hasScrollbarRight) {
        width -= getScrollbarWidth(master.rootDocument);
      }

      width = Math.min(width, scrollWidth(master.wtTable.wtRootElement));
      overlayRootElementStyle.width = `${width}px`;

    } else {
      overlayRootElementStyle.width = '';
    }

    let tableHeight = outerHeight(clone.wtTable.TABLE);

    if (!master.wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRootElementStyle.height = `${tableHeight}px`;

    clone.wtTable.hider.style.width = this.master.wtTable.hider.style.width;
    clone.wtTable.holder.style.width = overlayRootElementStyle.width;
    clone.wtTable.holder.style.height = overlayRootElementStyle.height;

    if (!force) {
      this.areElementSizesAdjusted = true;
    }
  }

  /**
   * Scrolls vertically to a row.
   *
   * @param {number} sourceRow Row index which you want to scroll to.
   * @param {boolean} [bottomEdge=false] If `true`, scrolls according to the bottom edge (top edge is by default).
   */
  scrollTo(sourceRow, bottomEdge) {
    const { master } = this;
    let newY = this.getTableParentOffset();
    const mainHolder = master.wtTable.holder;
    let scrollbarCompensation = 0;

    if (bottomEdge && offsetHeight(mainHolder) !== clientHeight(mainHolder)) {
      scrollbarCompensation = getScrollbarWidth(master.rootDocument);
    }

    if (bottomEdge) {
      newY += this.sumCellSizes(0, sourceRow + 1);
      newY -= master.wtViewport.getViewportHeight();
      // Fix 1 pixel offset when cell is selected
      newY += 1;

    } else {
      newY += this.sumCellSizes(master.getSetting('fixedRowsBottom'), sourceRow);
    }
    newY += scrollbarCompensation;

    this.setScrollPosition(newY);
  }

  /**
   * Gets table parent top position.
   *
   * @returns {number}
   */
  getTableParentOffset() {
    if (this.mainTableScrollableElement === this.master.rootWindow) {
      return this.master.wtTable.holderOffset.top;
    }

    return 0;
  }

  /**
   * Gets the main overlay's vertical scroll position.
   *
   * @returns {number} Main table's vertical scroll position.
   */
  getScrollPosition() {
    return getScrollTop(this.mainTableScrollableElement, this.master.rootWindow);
  }

  /**
   * Redraws the content of the overlay's clone instance of Walkontable, including the cells, selections and borders.
   * Does not change the size nor the position of the overlay root element.
   *
   * @param {boolean} [fastDraw=false] When `true`, try to refresh only the positions of borders without rerendering
   *                                   the data. It will only work if Table.draw() does not force
   *                                   rendering anyway.
   */
  redrawClone(fastDraw = false) {
    super.redrawClone(fastDraw);

    if (!fastDraw) {
      // nasty workaround for double border in the header, TODO: find a pure-css solution
      if (this.master.getSetting('rowHeaders').length === 0) {
        const secondHeaderCell = this.clone.wtTable.THEAD.querySelector('th:nth-of-type(2)');

        if (secondHeaderCell) {
          secondHeaderCell.style['border-left-width'] = 0;
        }
      }
    }
  }
}

Overlay.registerOverlay(Overlay.CLONE_BOTTOM, BottomOverlay);

export default BottomOverlay;
