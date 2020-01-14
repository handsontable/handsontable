import {
  addClass,
  getScrollbarWidth,
  getScrollTop,
  getWindowScrollLeft,
  hasClass,
  outerHeight,
  removeClass,
  resetCssTransform
} from './../../../../helpers/dom/element';
import BottomOverlayTable from './../table/bottom';
import Overlay from './_base';

/**
 * @class BottomOverlay
 */
class BottomOverlay extends Overlay {
  /**
   * @param {Walkontable} wotInstance
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
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor
   * @returns {Table}
   */
  createTable(...args) {
    return new BottomOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    /* eslint-disable no-unneeded-ternary */
    return this.master.getSetting('fixedRowsBottom') ? true : false;
  }

  /**
   * Updates the position of the overlay root element relatively to the position of the master instance
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
    let headerPosition = 0;
    const preventOverflow = master.getSetting('preventOverflow');

    overlayRootElement.style.top = '';

    if (master.wtTable.trimmingContainer === master.rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      const box = master.wtTable.hider.getBoundingClientRect();
      const bottom = Math.ceil(box.bottom);
      let finalLeft;
      let finalBottom;
      const bodyHeight = master.rootDocument.body.offsetHeight;

      finalLeft = master.wtTable.hider.style.left;
      finalLeft = finalLeft === '' ? 0 : finalLeft;

      if (bottom > bodyHeight) {
        finalBottom = (bottom - bodyHeight);
      } else {
        finalBottom = 0;
      }
      headerPosition = finalBottom;
      finalBottom += 'px';

      overlayRootElement.style.top = '';
      overlayRootElement.style.left = finalLeft;
      overlayRootElement.style.bottom = finalBottom;

    } else {
      headerPosition = this.getScrollPosition();
      resetCssTransform(overlayRootElement);

      let scrollbarWidth = getScrollbarWidth(master.rootDocument);

      if (master.wtTable.holder.clientHeight === master.wtTable.holder.offsetHeight) {
        scrollbarWidth = 0;
      }

      overlayRootElement.style.top = '';
      overlayRootElement.style.bottom = `${scrollbarWidth}px`;
    }
    this.adjustHeaderBordersPosition(headerPosition);
  }

  /**
   * Sets the main overlay's vertical scroll position
   *
   * @param {Number} pos
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
   * Triggers onScroll hook callback
   */
  onScroll() {
    this.master.getSetting('onScrollHorizontally');
  }

  /**
   * Calculates total sum cells height
   *
   * @param {Number} from Row index which calculates started from
   * @param {Number} to Row index where calculation is finished
   * @returns {Number} Height sum
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
   * @param {Boolean} [force=false]
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

      width = Math.min(width, master.wtTable.wtRootElement.scrollWidth);
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
   * Scrolls vertically to a row
   *
   * @param sourceRow {Number} Row index which you want to scroll to
   * @param [bottomEdge=false] {Boolean} if `true`, scrolls according to the bottom edge (top edge is by default)
   */
  scrollTo(sourceRow, bottomEdge) {
    const { master } = this;
    let newY = this.getTableParentOffset();
    const mainHolder = master.wtTable.holder;
    let scrollbarCompensation = 0;

    if (bottomEdge && mainHolder.offsetHeight !== mainHolder.clientHeight) {
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
   * Gets table parent top position
   *
   * @returns {Number}
   */
  getTableParentOffset() {
    if (this.mainTableScrollableElement === this.master.rootWindow) {
      return this.master.wtTable.holderOffset.top;
    }

    return 0;
  }

  /**
   * Gets the main overlay's vertical scroll position
   *
   * @returns {Number} Main table's vertical scroll position
   */
  getScrollPosition() {
    return getScrollTop(this.mainTableScrollableElement, this.master.rootWindow);
  }

  /**
   * Redraws the content of the overlay's clone instance of Walkontable, including the cells, selections and borders.
   * Does not change the size nor the position of the overlay root element.
   *
   * @param {Boolean} [fastDraw=false]
   */
  redrawClone(fastDraw = false) {
    Overlay.prototype.redrawClone.call(this, fastDraw); // equals: super(fastDraw)

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

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue)
   *
   * @param {Number} position Header Y position if trimming container is window or scroll top if not
   */
  adjustHeaderBordersPosition(position) {
    const { master } = this;

    const fixedRowsBottom = master.getSetting('fixedRowsBottom');
    if (fixedRowsBottom > 0) {
      addClass(this.clone.wtTable.wtRootElement, 'wtFrozenLineHorizontal');
    } else {
      removeClass(this.clone.wtTable.wtRootElement, 'wtFrozenLineHorizontal');
    }

    if (master.getSetting('fixedRowsBottom') === 0 && master.getSetting('columnHeaders').length > 0) {
      const masterRootElement = master.wtTable.wtRootElement;
      const previousState = hasClass(masterRootElement, 'innerBorderTop');

      if (position) {
        addClass(masterRootElement, 'innerBorderTop');
      } else {
        removeClass(masterRootElement, 'innerBorderTop');
      }
      if (!previousState && position || previousState && !position) {
        master.wtOverlays.adjustElementsSizes();
      }
    }
  }
}

Overlay.registerOverlay(Overlay.CLONE_BOTTOM, BottomOverlay);

export default BottomOverlay;
