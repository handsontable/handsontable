import {
  addClass,
  getScrollbarWidth,
  getScrollTop,
  getWindowScrollLeft,
  hasClass,
  outerHeight,
  removeClass,
  setOverlayPosition,
  resetCssTransform,
} from './../../../../helpers/dom/element';
import { arrayEach } from './../../../../helpers/array';
import TopOverlayTable from './../table/top';
import Overlay from './_base';

/**
 * @class TopOverlay
 */
class TopOverlay extends Overlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(Overlay.CLONE_TOP);
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
    return new TopOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    return !!(this.master.getSetting('fixedRowsTop') || this.master.getSetting('columnHeaders').length);
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

    if (master.wtTable.trimmingContainer === master.rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      const box = master.wtTable.hider.getBoundingClientRect();
      const top = Math.ceil(box.top);
      const bottom = Math.ceil(box.bottom);
      let finalLeft;
      let finalTop;

      finalLeft = master.wtTable.hider.style.left;
      finalLeft = finalLeft === '' ? 0 : finalLeft;

      if (top < 0 && (bottom - overlayRootElement.offsetHeight) > 0) {
        finalTop = -top;
      } else {
        finalTop = 0;
      }
      headerPosition = finalTop;
      finalTop += 'px';

      setOverlayPosition(overlayRootElement, finalLeft, finalTop);

    } else {
      headerPosition = this.getScrollPosition();
      resetCssTransform(overlayRootElement);
    }

    this.adjustHeaderBordersPosition(headerPosition);
  }

  /**
   * Sets the main overlay's vertical scroll position.
   *
   * @param {Number} pos
   * @returns {Boolean}
   */
  setScrollPosition(pos) {
    const rootWindow = this.master.rootWindow;
    let result = false;

    if (this.mainTableScrollableElement === rootWindow && rootWindow.scrollY !== pos) {
      rootWindow.scrollTo(getWindowScrollLeft(rootWindow), pos);
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
   * @param {Number} from Row index which calculates started from.
   * @param {Number} to Row index where calculation is finished.
   * @returns {Number} Height sum.
   */
  sumCellSizes(from, to) {
    const defaultRowHeight = this.master.wtSettings.settings.defaultRowHeight;
    let row = from;
    let sum = 0;

    while (row < to) {
      const height = this.master.rowUtils.getHeight(row);

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

    let tableHeight = outerHeight(clone.wtTable.TABLE) - 1;

    if (!master.wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRootElementStyle.height = `${tableHeight}px`;

    clone.wtTable.hider.style.width = master.wtTable.hider.style.width;
    clone.wtTable.holder.style.width = overlayRootElementStyle.width;
    clone.wtTable.holder.style.height = overlayRootElementStyle.height;

    if (!force) {
      this.areElementSizesAdjusted = true;
    }
  }

  /**
   * Scrolls vertically to a row.
   *
   * @param {Number} sourceRow Row index which you want to scroll to.
   * @param {Boolean} [bottomEdge] if `true`, scrolls according to the bottom edge (top edge is by default).
   * @returns {Boolean}
   */
  scrollTo(sourceRow, bottomEdge) {
    const { master } = this;
    const mainHolder = master.wtTable.holder;
    let newY = this.getTableParentOffset();
    let scrollbarCompensation = 0;

    if (bottomEdge && mainHolder.offsetHeight !== mainHolder.clientHeight) {
      scrollbarCompensation = getScrollbarWidth(master.rootDocument);
    }

    if (bottomEdge) {
      const fixedRowsBottom = master.getSetting('fixedRowsBottom');
      const totalRows = master.getSetting('totalRows');

      newY += this.sumCellSizes(0, sourceRow + 1);
      newY -= master.wtViewport.getViewportHeight() - this.sumCellSizes(totalRows - fixedRowsBottom, totalRows);
      // Fix 1 pixel offset when cell is selected
      newY += 1;

    } else {
      newY += this.sumCellSizes(master.getSetting('fixedRowsTop'), sourceRow);
    }
    newY += scrollbarCompensation;

    return this.setScrollPosition(newY);
  }

  /**
   * Gets table parent top position.
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
   * Gets the main overlay's vertical scroll position.
   *
   * @returns {Number} Main table's vertical scroll position.
   */
  getScrollPosition() {
    return getScrollTop(this.mainTableScrollableElement, this.master.rootWindow);
  }

  /**
   * Redraw borders of selection.
   *
   * @param {WalkontableSelection} selection Selection for redraw.
   */
  redrawSelectionBorders(selection) {
    if (selection && selection.cellRange && selection.hasSelectionHandle()) {
      const selectionHandle = selection.getSelectionHandle(this.master);
      const corners = selection.getCorners();

      selectionHandle.disappear();
      selectionHandle.appear(corners);
    }
  }

  /**
   * Redrawing borders of all selections.
   */
  redrawAllSelectionsBorders() {
    const selections = this.master.selections;

    this.redrawSelectionBorders(selections.getCell());

    arrayEach(selections.getAreas(), (area) => {
      this.redrawSelectionBorders(area);
    });
    this.redrawSelectionBorders(selections.getFill());

    this.master.wtOverlays.leftOverlay.redrawClone();
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
        const secondHeaderCell = this.clone.wtTable.THEAD.querySelectorAll('th:nth-of-type(2)');

        if (secondHeaderCell) {
          for (let i = 0; i < secondHeaderCell.length; i++) {
            secondHeaderCell[i].style['border-left-width'] = 0;
          }
        }
      }
    }
  }

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue).
   *
   * @param {Number} position Header Y position if trimming container is window or scroll top if not.
   */
  adjustHeaderBordersPosition(position) {
    const { master } = this;
    const masterRootElement = master.wtTable.wtRootElement;
    const totalColumns = master.getSetting('totalColumns');

    if (totalColumns) {
      removeClass(masterRootElement, 'emptyColumns');
    } else {
      addClass(masterRootElement, 'emptyColumns');
    }

    if (master.getSetting('fixedRowsTop') === 0 && master.getSetting('columnHeaders').length > 0) {
      const previousState = hasClass(masterRootElement, 'innerBorderTop');

      if (position || master.getSetting('totalRows') === 0) {
        addClass(masterRootElement, 'innerBorderTop');
      } else {
        removeClass(masterRootElement, 'innerBorderTop');
      }

      if (!previousState && position || previousState && !position) {
        master.wtOverlays.adjustElementsSizes();

        // cell borders should be positioned once again,
        // because we added / removed 1px border from table header
        this.redrawAllSelectionsBorders();
      }
    }
  }
}

Overlay.registerOverlay(Overlay.CLONE_TOP, TopOverlay);

export default TopOverlay;
