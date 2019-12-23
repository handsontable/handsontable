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
    if (!this.needFullRender || !this.master.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }
    const overlayRoot = this.clone.wtTable.wtRootElement;
    let headerPosition = 0;
    const preventOverflow = this.master.getSetting('preventOverflow');

    if (this.trimmingContainer === this.master.rootWindow && (!preventOverflow || preventOverflow !== 'vertical')) {
      const { wtTable } = this.master;
      const box = wtTable.hider.getBoundingClientRect();
      const top = Math.ceil(box.top);
      const bottom = Math.ceil(box.bottom);
      let finalLeft;
      let finalTop;

      finalLeft = wtTable.hider.style.left;
      finalLeft = finalLeft === '' ? 0 : finalLeft;

      if (top < 0 && (bottom - overlayRoot.offsetHeight) > 0) {
        finalTop = -top;
      } else {
        finalTop = 0;
      }
      headerPosition = finalTop;
      finalTop += 'px';

      setOverlayPosition(overlayRoot, finalLeft, finalTop);

    } else {
      headerPosition = this.getScrollPosition();
      resetCssTransform(overlayRoot);
    }

    this.adjustHeaderBordersPosition(headerPosition);
    this.adjustElementsSize();
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
    this.updateTrimmingContainer();

    if (this.needFullRender || force) {
      this._adjustElementsSize();

      if (!force) {
        this.areElementSizesAdjusted = true;
      }
    }
  }

  /**
   * Adjust the sizes of the clone and the master elements to the dimensions of the trimming container.
   */
  _adjustElementsSize() {
    const { wtTable, rootDocument, rootWindow } = this.master;
    const scrollbarWidth = getScrollbarWidth(rootDocument);
    const overlayRoot = this.clone.wtTable.wtRootElement;
    const overlayRootStyle = overlayRoot.style;
    const preventOverflow = this.master.getSetting('preventOverflow');

    if (this.trimmingContainer !== rootWindow || preventOverflow === 'horizontal') {
      let width = this.master.wtViewport.getWorkspaceWidth();

      if (this.master.wtOverlays.hasScrollbarRight) {
        width -= scrollbarWidth;
      }

      width = Math.min(width, wtTable.wtRootElement.scrollWidth);
      overlayRootStyle.width = `${width}px`;

    } else {
      overlayRootStyle.width = '';
    }

    let tableHeight = outerHeight(this.clone.wtTable.TABLE);

    if (!this.master.wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRootStyle.height = `${tableHeight}px`;

    const { holder, hider, wtRootElement } = this.clone.wtTable;

    hider.style.width = this.hider.style.width;
    holder.style.width = wtRootElement.style.width;
    holder.style.height = wtRootElement.style.height;
  }

  /**
   * Adjust the overlay dimensions and position.
   */
  workaroundsForPositionAndSize() {
    const total = this.master.getSetting('totalRows');

    if (!this.areElementSizesAdjusted) {
      this.adjustElementsSize();
    }
    if (typeof this.master.wtViewport.rowsRenderCalculator.startPosition === 'number') {
      this.spreader.style.top = `${this.master.wtViewport.rowsRenderCalculator.startPosition}px`;

    } else if (total === 0) {
      // can happen if there are 0 rows
      this.spreader.style.top = '0';

    } else {
      throw new Error('Incorrect value of the rowsRenderCalculator');
    }
    this.spreader.style.bottom = '';

    if (this.needFullRender) {
      if (typeof this.master.wtViewport.columnsRenderCalculator.startPosition === 'number') {
        this.clone.wtTable.spreader.style.left = `${this.master.wtViewport.columnsRenderCalculator.startPosition}px`;

      } else {
        this.clone.wtTable.spreader.style.left = '';
      }
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
    const mainHolder = this.master.wtTable.holder;
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
   * Adds css classes to hide the header border's header (cell-selection border hiding issue).
   *
   * @param {Number} position Header Y position if trimming container is window or scroll top if not.
   */
  adjustHeaderBordersPosition(position) {
    const masterParent = this.master.wtTable.wtRootElement;
    const totalColumns = this.master.getSetting('totalColumns');

    if (totalColumns) {
      removeClass(masterParent, 'emptyColumns');
    } else {
      addClass(masterParent, 'emptyColumns');
    }

    if (this.master.getSetting('fixedRowsTop') === 0 && this.master.getSetting('columnHeaders').length > 0) {
      const previousState = hasClass(masterParent, 'innerBorderTop');

      if (position || this.master.getSetting('totalRows') === 0) {
        addClass(masterParent, 'innerBorderTop');
      } else {
        removeClass(masterParent, 'innerBorderTop');
      }

      if (!previousState && position || previousState && !position) {
        this.master.wtOverlays.adjustElementsSizes();

        // cell borders should be positioned once again,
        // because we added / removed 1px border from table header
        this.redrawAllSelectionsBorders();
      }
    }

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

Overlay.registerOverlay(Overlay.CLONE_TOP, TopOverlay);

export default TopOverlay;
