import Handsontable from './../../../browser';
import {
  getScrollbarWidth,
  getScrollTop,
  getStyle,
  offset,
  outerHeight,
  outerWidth,
} from './../../../helpers/dom/element';
import {EventManager} from './../../../eventManager';
import {WalkontableViewportColumnsCalculator} from './calculator/viewportColumns';
import {WalkontableViewportRowsCalculator} from './calculator/viewportRows';

/**
 * @class WalkontableViewport
 */
class WalkontableViewport {
  /**
   * @param wotInstance
   */
  constructor(wotInstance) {
    this.wot = wotInstance;
    // legacy support
    this.instance = this.wot;

    this.oversizedRows = [];
    this.oversizedColumnHeaders = [];
    this.hasOversizedColumnHeadersMarked = {};
    this.clientHeight = 0;
    this.containerWidth = NaN;
    this.rowHeaderWidth = NaN;
    this.rowsVisibleCalculator = null;
    this.columnsVisibleCalculator = null;

    this.eventManager = new EventManager(this.wot);
    this.eventManager.addEventListener(window, 'resize', () => {
      this.clientHeight = this.getWorkspaceHeight();
    });
  }

  /**
   * @returns {number}
   */
  getWorkspaceHeight() {
    let trimmingContainer = this.instance.wtOverlays.topOverlay.trimmingContainer;
    let elemHeight;
    let height = 0;

    if (trimmingContainer === window) {
      height = document.documentElement.clientHeight;

    } else {
      elemHeight = outerHeight(trimmingContainer);
      // returns height without DIV scrollbar
      height = (elemHeight > 0 && trimmingContainer.clientHeight > 0) ? trimmingContainer.clientHeight : Infinity;
    }

    return height;
  }

  getWorkspaceWidth() {
    let width;
    let totalColumns = this.wot.getSetting('totalColumns');
    let trimmingContainer = this.instance.wtOverlays.leftOverlay.trimmingContainer;
    let overflow;
    let stretchSetting = this.wot.getSetting('stretchH');
    let docOffsetWidth = document.documentElement.offsetWidth;
    let preventOverflow = this.wot.getSetting('preventOverflow');

    if (preventOverflow) {
      return outerWidth(this.instance.wtTable.wtRootElement);
    }

    if (Handsontable.freezeOverlays) {
      width = Math.min(docOffsetWidth - this.getWorkspaceOffset().left, docOffsetWidth);
    } else {
      width = Math.min(this.getContainerFillWidth(), docOffsetWidth - this.getWorkspaceOffset().left, docOffsetWidth);
    }

    if (trimmingContainer === window && totalColumns > 0 && this.sumColumnWidths(0, totalColumns - 1) > width) {
      // in case sum of column widths is higher than available stylesheet width, let's assume using the whole window
      // otherwise continue below, which will allow stretching
      // this is used in `scroll_window.html`
      // TODO test me
      return document.documentElement.clientWidth;
    }

    if (trimmingContainer !== window) {
      overflow = getStyle(this.instance.wtOverlays.leftOverlay.trimmingContainer, 'overflow');

      if (overflow == 'scroll' || overflow == 'hidden' || overflow == 'auto') {
        // this is used in `scroll.html`
        // TODO test me
        return Math.max(width, trimmingContainer.clientWidth);
      }
    }

    if (stretchSetting === 'none' || !stretchSetting) {
      // if no stretching is used, return the maximum used workspace width
      return Math.max(width, outerWidth(this.instance.wtTable.TABLE));
    } else {
      // if stretching is used, return the actual container width, so the columns can fit inside it
      return width;
    }
  }

  /**
   * Checks if viewport has vertical scroll
   *
   * @returns {Boolean}
   */
  hasVerticalScroll() {
    return this.getWorkspaceActualHeight() > this.getWorkspaceHeight();
  }

  /**
   * Checks if viewport has horizontal scroll
   *
   * @returns {Boolean}
   */
  hasHorizontalScroll() {
    return this.getWorkspaceActualWidth() > this.getWorkspaceWidth();
  }

  /**
   * @param from
   * @param length
   * @returns {Number}
   */
  sumColumnWidths(from, length) {
    let sum = 0;

    while (from < length) {
      sum += this.wot.wtTable.getColumnWidth(from);
      from++;
    }

    return sum;
  }

  /**
   * @returns {Number}
   */
  getContainerFillWidth() {
    if (this.containerWidth) {
      return this.containerWidth;
    }
    let mainContainer = this.instance.wtTable.holder;
    let fillWidth;
    let dummyElement;

    dummyElement = document.createElement('div');
    dummyElement.style.width = '100%';
    dummyElement.style.height = '1px';
    mainContainer.appendChild(dummyElement);
    fillWidth = dummyElement.offsetWidth;

    this.containerWidth = fillWidth;
    mainContainer.removeChild(dummyElement);

    return fillWidth;
  }

  /**
   * @returns {Number}
   */
  getWorkspaceOffset() {
    return offset(this.wot.wtTable.TABLE);
  }

  /**
   * @returns {Number}
   */
  getWorkspaceActualHeight() {
    return outerHeight(this.wot.wtTable.TABLE);
  }

  /**
   * @returns {Number}
   */
  getWorkspaceActualWidth() {
    return outerWidth(this.wot.wtTable.TABLE) ||
      outerWidth(this.wot.wtTable.TBODY) ||
      outerWidth(this.wot.wtTable.THEAD); //IE8 reports 0 as <table> offsetWidth;
  }

  /**
   * @returns {Number}
   */
  getColumnHeaderHeight() {
    if (isNaN(this.columnHeaderHeight)) {
      this.columnHeaderHeight = outerHeight(this.wot.wtTable.THEAD);
    }

    return this.columnHeaderHeight;
  }

  /**
   * @returns {Number}
   */
  getViewportHeight() {
    let containerHeight = this.getWorkspaceHeight();
    let columnHeaderHeight;

    if (containerHeight === Infinity) {
      return containerHeight;
    }
    columnHeaderHeight = this.getColumnHeaderHeight();

    if (columnHeaderHeight > 0) {
      containerHeight -= columnHeaderHeight;
    }

    return containerHeight;
  }

  /**
   * @returns {Number}
   */
  getRowHeaderWidth() {
    let rowHeadersHeightSetting = this.instance.getSetting('rowHeaderWidth');
    let rowHeaders = this.instance.getSetting('rowHeaders');

    if (rowHeadersHeightSetting) {
      this.rowHeaderWidth = 0;

      for (let i = 0, len = rowHeaders.length; i < len; i++) {
        this.rowHeaderWidth += rowHeadersHeightSetting[i] || rowHeadersHeightSetting;
      }
    }

    if (this.wot.cloneSource) {
      return this.wot.cloneSource.wtViewport.getRowHeaderWidth();
    }

    if (isNaN(this.rowHeaderWidth)) {

      if (rowHeaders.length) {
        let TH = this.instance.wtTable.TABLE.querySelector('TH');
        this.rowHeaderWidth = 0;

        for (let i = 0, len = rowHeaders.length; i < len; i++) {
          if (TH) {
            this.rowHeaderWidth += outerWidth(TH);
            TH = TH.nextSibling;

          } else {
            // yes this is a cheat but it worked like that before, just taking assumption from CSS instead of measuring.
            // TODO: proper fix
            this.rowHeaderWidth += 50;
          }
        }
      } else {
        this.rowHeaderWidth = 0;
      }
    }

    return this.rowHeaderWidth;
  }

  /**
   * @returns {Number}
   */
  getViewportWidth() {
    let containerWidth = this.getWorkspaceWidth();
    let rowHeaderWidth;

    if (containerWidth === Infinity) {
      return containerWidth;
    }
    rowHeaderWidth = this.getRowHeaderWidth();

    if (rowHeaderWidth > 0) {
      return containerWidth - rowHeaderWidth;
    }

    return containerWidth;
  }

  /**
   * Creates:
   *  - rowsRenderCalculator (before draw, to qualify rows for rendering)
   *  - rowsVisibleCalculator (after draw, to measure which rows are actually visible)
   *
   * @returns {WalkontableViewportRowsCalculator}
   */
  createRowsCalculator(visible = false) {
    let height;
    let pos;
    let fixedRowsTop;
    let scrollbarHeight;
    let fixedRowsBottom;
    let fixedRowsHeight;
    let totalRows;

    this.rowHeaderWidth = NaN;

    if (this.wot.wtSettings.settings.renderAllRows) {
      height = Infinity;
    } else {
      height = this.getViewportHeight();
    }
    pos = this.wot.wtOverlays.topOverlay.getScrollPosition() - this.wot.wtOverlays.topOverlay.getTableParentOffset();

    if (pos < 0) {
      pos = 0;
    }
    fixedRowsTop = this.wot.getSetting('fixedRowsTop');
    fixedRowsBottom = this.wot.getSetting('fixedRowsBottom');
    totalRows = this.wot.getSetting('totalRows');

    if (fixedRowsTop) {
      fixedRowsHeight = this.wot.wtOverlays.topOverlay.sumCellSizes(0, fixedRowsTop);
      pos += fixedRowsHeight;
      height -= fixedRowsHeight;
    }

    if (fixedRowsBottom && this.wot.wtOverlays.bottomOverlay.clone) {
      fixedRowsHeight = this.wot.wtOverlays.bottomOverlay.sumCellSizes(totalRows - fixedRowsBottom, totalRows);

      height -= fixedRowsHeight;
    }

    if (this.wot.wtTable.holder.clientHeight === this.wot.wtTable.holder.offsetHeight) {
      scrollbarHeight = 0;
    } else {
      scrollbarHeight = getScrollbarWidth();
    }

    return new WalkontableViewportRowsCalculator(
      height,
      pos,
      this.wot.getSetting('totalRows'),
      (sourceRow) => {
        return this.wot.wtTable.getRowHeight(sourceRow);
      },
      visible ? null : this.wot.wtSettings.settings.viewportRowCalculatorOverride,
      visible,
      scrollbarHeight
    );
  }

  /**
   * Creates:
   *  - columnsRenderCalculator (before draw, to qualify columns for rendering)
   *  - columnsVisibleCalculator (after draw, to measure which columns are actually visible)
   *
   * @returns {WalkontableViewportRowsCalculator}
   */
  createColumnsCalculator(visible = false) {
    let width = this.getViewportWidth();
    let pos;
    let fixedColumnsLeft;

    this.columnHeaderHeight = NaN;

    pos = this.wot.wtOverlays.leftOverlay.getScrollPosition() - this.wot.wtOverlays.leftOverlay.getTableParentOffset();

    if (pos < 0) {
      pos = 0;
    }
    fixedColumnsLeft = this.wot.getSetting('fixedColumnsLeft');

    if (fixedColumnsLeft) {
      let fixedColumnsWidth = this.wot.wtOverlays.leftOverlay.sumCellSizes(0, fixedColumnsLeft);
      pos += fixedColumnsWidth;
      width -= fixedColumnsWidth;
    }
    if (this.wot.wtTable.holder.clientWidth !== this.wot.wtTable.holder.offsetWidth) {
      width -= getScrollbarWidth();
    }

    return new WalkontableViewportColumnsCalculator(
      width,
      pos,
      this.wot.getSetting('totalColumns'),
      (sourceCol) => {
        return this.wot.wtTable.getColumnWidth(sourceCol);
      },
      visible ? null : this.wot.wtSettings.settings.viewportColumnCalculatorOverride,
      visible,
      this.wot.getSetting('stretchH'),
      (stretchedWidth, column) => this.wot.getSetting('onBeforeStretchingColumnWidth', stretchedWidth, column)
    );
  }

  /**
   * Creates rowsRenderCalculator and columnsRenderCalculator (before draw, to determine what rows and
   * cols should be rendered)
   *
   * @param fastDraw {Boolean} If `true`, will try to avoid full redraw and only update the border positions.
   *                           If `false` or `undefined`, will perform a full redraw
   * @returns fastDraw {Boolean} The fastDraw value, possibly modified
   */
  createRenderCalculators(fastDraw = false) {
    if (fastDraw) {
      let proposedRowsVisibleCalculator = this.createRowsCalculator(true);
      let proposedColumnsVisibleCalculator = this.createColumnsCalculator(true);

      if (!(this.areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator) &&
          this.areAllProposedVisibleColumnsAlreadyRendered(proposedColumnsVisibleCalculator))) {
        fastDraw = false;
      }
    }

    if (!fastDraw) {
      this.rowsRenderCalculator = this.createRowsCalculator();
      this.columnsRenderCalculator = this.createColumnsCalculator();
    }
    // delete temporarily to make sure that renderers always use rowsRenderCalculator, not rowsVisibleCalculator
    this.rowsVisibleCalculator = null;
    this.columnsVisibleCalculator = null;

    return fastDraw;
  }

  /**
   * Creates rowsVisibleCalculator and columnsVisibleCalculator (after draw, to determine what are
   * the actually visible rows and columns)
   */
  createVisibleCalculators() {
    this.rowsVisibleCalculator = this.createRowsCalculator(true);
    this.columnsVisibleCalculator = this.createColumnsCalculator(true);
  }

  /**
   * Returns information whether proposedRowsVisibleCalculator viewport
   * is contained inside rows rendered in previous draw (cached in rowsRenderCalculator)
   *
   * @param {Object} proposedRowsVisibleCalculator
   * @returns {Boolean} Returns `true` if all proposed visible rows are already rendered (meaning: redraw is not needed).
   *                    Returns `false` if at least one proposed visible row is not already rendered (meaning: redraw is needed)
   */
  areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator) {
    if (this.rowsVisibleCalculator) {
      if (proposedRowsVisibleCalculator.startRow < this.rowsRenderCalculator.startRow ||
          (proposedRowsVisibleCalculator.startRow === this.rowsRenderCalculator.startRow &&
          proposedRowsVisibleCalculator.startRow > 0)) {
        return false;

      } else if (proposedRowsVisibleCalculator.endRow > this.rowsRenderCalculator.endRow ||
          (proposedRowsVisibleCalculator.endRow === this.rowsRenderCalculator.endRow &&
          proposedRowsVisibleCalculator.endRow < this.wot.getSetting('totalRows') - 1)) {
        return false;

      } else {
        return true;
      }
    }

    return false;
  }

  /**
   * Returns information whether proposedColumnsVisibleCalculator viewport
   * is contained inside column rendered in previous draw (cached in columnsRenderCalculator)
   *
   * @param {Object} proposedColumnsVisibleCalculator
   * @returns {Boolean} Returns `true` if all proposed visible columns are already rendered (meaning: redraw is not needed).
   *                    Returns `false` if at least one proposed visible column is not already rendered (meaning: redraw is needed)
   */
  areAllProposedVisibleColumnsAlreadyRendered(proposedColumnsVisibleCalculator) {
    if (this.columnsVisibleCalculator) {
      if (proposedColumnsVisibleCalculator.startColumn < this.columnsRenderCalculator.startColumn ||
          (proposedColumnsVisibleCalculator.startColumn === this.columnsRenderCalculator.startColumn &&
          proposedColumnsVisibleCalculator.startColumn > 0)) {
        return false;

      } else if (proposedColumnsVisibleCalculator.endColumn > this.columnsRenderCalculator.endColumn ||
          (proposedColumnsVisibleCalculator.endColumn === this.columnsRenderCalculator.endColumn &&
          proposedColumnsVisibleCalculator.endColumn < this.wot.getSetting('totalColumns') - 1)) {
        return false;

      } else {
        return true;
      }
    }

    return false;
  }
}

export {WalkontableViewport};

window.WalkontableViewport = WalkontableViewport;
