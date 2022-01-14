import {
  getScrollbarWidth,
  getStyle,
  offset,
  outerHeight,
  outerWidth,
} from '../../../helpers/dom/element';
import { objectEach } from '../../../helpers/object';
import {
  RENDER_TYPE,
  FULLY_VISIBLE_TYPE,
  ViewportColumnsCalculator,
  ViewportRowsCalculator,
} from './calculator';

/**
 * @class Viewport
 */
class Viewport {
  /**
   * @param {ViewportDao} dataAccessObject The Walkontable instance.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {EventManager} eventManager The instance event manager.
   * @param {Table} wtTable The table.
   */
  constructor(dataAccessObject, domBindings, wtSettings, eventManager, wtTable) {
    this.dataAccessObject = dataAccessObject;
    // legacy support
    this.wot = dataAccessObject.wot;
    this.instance = this.wot;
    this.domBindings = domBindings;
    this.wtSettings = wtSettings;
    this.wtTable = wtTable;
    this.oversizedRows = [];
    this.oversizedColumnHeaders = [];
    this.hasOversizedColumnHeadersMarked = {};
    this.clientHeight = 0;
    this.containerWidth = NaN;
    this.rowHeaderWidth = NaN;
    this.rowsVisibleCalculator = null;
    this.columnsVisibleCalculator = null;

    this.eventManager = eventManager;
    this.eventManager.addEventListener(this.domBindings.rootWindow, 'resize', () => {
      this.clientHeight = this.getWorkspaceHeight();
    });
  }

  /**
   * @returns {number}
   */
  getWorkspaceHeight() {
    const currentDocument = this.domBindings.rootDocument;
    const trimmingContainer = this.dataAccessObject.topOverlayTrimmingContainer;
    let height = 0;

    if (trimmingContainer === this.domBindings.rootWindow) {
      height = currentDocument.documentElement.clientHeight;

    } else {
      const elemHeight = outerHeight(trimmingContainer);

      // returns height without DIV scrollbar
      height = (elemHeight > 0 && trimmingContainer.clientHeight > 0) ? trimmingContainer.clientHeight : Infinity;
    }

    return height;
  }

  getWorkspaceWidth() {
    const { wtSettings } = this;
    const { rootDocument, rootWindow } = this.domBindings;
    const trimmingContainer = this.dataAccessObject.inlineStartOverlayTrimmingContainer;
    const docOffsetWidth = rootDocument.documentElement.offsetWidth;
    const totalColumns = wtSettings.getSetting('totalColumns');
    const preventOverflow = wtSettings.getSetting('preventOverflow');
    let width;
    let overflow;

    if (preventOverflow) {
      return outerWidth(this.wtTable.wtRootElement);
    }

    if (wtSettings.getSetting('freezeOverlays')) {
      width = Math.min(docOffsetWidth - this.getWorkspaceOffset().left, docOffsetWidth);
    } else {
      width = Math.min(this.getContainerFillWidth(), docOffsetWidth - this.getWorkspaceOffset().left, docOffsetWidth);
    }

    if (trimmingContainer === rootWindow && totalColumns > 0 && this.sumColumnWidths(0, totalColumns - 1) > width) {
      // in case sum of column widths is higher than available stylesheet width, let's assume using the whole window
      // otherwise continue below, which will allow stretching
      // this is used in `scroll_window.html`
      // TODO test me
      return rootDocument.documentElement.clientWidth;
    }

    if (trimmingContainer !== rootWindow) {
      overflow = getStyle(this.dataAccessObject.inlineStartOverlayTrimmingContainer, 'overflow', rootWindow);

      if (overflow === 'scroll' || overflow === 'hidden' || overflow === 'auto') {
        // this is used in `scroll.html`
        // TODO test me
        return Math.max(width, trimmingContainer.clientWidth);
      }
    }

    const stretchSetting = wtSettings.getSetting('stretchH');

    if (stretchSetting === 'none' || !stretchSetting) {
      // if no stretching is used, return the maximum used workspace width
      return Math.max(width, outerWidth(this.wtTable.TABLE));
    }

    // if stretching is used, return the actual container width, so the columns can fit inside it
    return width;
  }

  /**
   * Checks if viewport has vertical scroll.
   *
   * @returns {boolean}
   */
  hasVerticalScroll() {
    return this.getWorkspaceActualHeight() > this.getWorkspaceHeight();
  }

  /**
   * Checks if viewport has horizontal scroll.
   *
   * @returns {boolean}
   */
  hasHorizontalScroll() {
    return this.getWorkspaceActualWidth() > this.getWorkspaceWidth();
  }

  /**
   * @param {number} from The visual column index from the width sum is start calculated.
   * @param {number} length The length of the column to traverse.
   * @returns {number}
   */
  sumColumnWidths(from, length) {
    let sum = 0;
    let column = from;

    while (column < length) {
      sum += this.wtTable.getColumnWidth(column);
      column += 1;
    }

    return sum;
  }

  /**
   * @returns {number}
   */
  getContainerFillWidth() {
    if (this.containerWidth) {
      return this.containerWidth;
    }

    const mainContainer = this.wtTable.holder;
    const dummyElement = this.domBindings.rootDocument.createElement('div');

    dummyElement.style.width = '100%';
    dummyElement.style.height = '1px';
    mainContainer.appendChild(dummyElement);

    const fillWidth = dummyElement.offsetWidth;

    this.containerWidth = fillWidth;
    mainContainer.removeChild(dummyElement);

    return fillWidth;
  }

  /**
   * @returns {number}
   */
  getWorkspaceOffset() {
    return offset(this.wtTable.TABLE);
  }

  /**
   * @returns {number}
   */
  getWorkspaceActualHeight() {
    return outerHeight(this.wtTable.TABLE);
  }

  /**
   * @returns {number}
   */
  getWorkspaceActualWidth() {
    return outerWidth(this.wtTable.TABLE) ||
      outerWidth(this.wtTable.TBODY) ||
      outerWidth(this.wtTable.THEAD); // IE8 reports 0 as <table> offsetWidth;
  }

  /**
   * @returns {number}
   */
  getColumnHeaderHeight() {
    const columnHeaders = this.wtSettings.getSetting('columnHeaders');

    if (!columnHeaders.length) {
      this.columnHeaderHeight = 0;
    } else if (isNaN(this.columnHeaderHeight)) {
      this.columnHeaderHeight = outerHeight(this.wtTable.THEAD);
    }

    return this.columnHeaderHeight;
  }

  /**
   * @returns {number}
   */
  getViewportHeight() {
    let containerHeight = this.getWorkspaceHeight();

    if (containerHeight === Infinity) {
      return containerHeight;
    }

    const columnHeaderHeight = this.getColumnHeaderHeight();

    if (columnHeaderHeight > 0) {
      containerHeight -= columnHeaderHeight;
    }

    return containerHeight;
  }

  /**
   * @returns {number}
   */
  getRowHeaderWidth() {
    const rowHeadersWidthSetting = this.wtSettings.getSetting('rowHeaderWidth');
    const rowHeaders = this.wtSettings.getSetting('rowHeaders');

    if (rowHeadersWidthSetting) {
      this.rowHeaderWidth = 0;

      for (let i = 0, len = rowHeaders.length; i < len; i++) {
        this.rowHeaderWidth += rowHeadersWidthSetting[i] || rowHeadersWidthSetting;
      }
    }

    if (isNaN(this.rowHeaderWidth)) {

      if (rowHeaders.length) {
        let TH = this.wtTable.TABLE.querySelector('TH');

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

    this.rowHeaderWidth = this.wtSettings
      .getSetting('onModifyRowHeaderWidth', this.rowHeaderWidth) || this.rowHeaderWidth;

    return this.rowHeaderWidth;
  }

  /**
   * @returns {number}
   */
  getViewportWidth() {
    const containerWidth = this.getWorkspaceWidth();

    if (containerWidth === Infinity) {
      return containerWidth;
    }

    const rowHeaderWidth = this.getRowHeaderWidth();

    if (rowHeaderWidth > 0) {
      return containerWidth - rowHeaderWidth;
    }

    return containerWidth;
  }

  /**
   * Creates:
   * - rowsRenderCalculator (before draw, to qualify rows for rendering)
   * - rowsVisibleCalculator (after draw, to measure which rows are actually visible).
   *
   * @param {number} calculationType The render type ID, which determines for what type of
   *                                 calculation calculator is created.
   * @returns {ViewportRowsCalculator}
   */
  createRowsCalculator(calculationType = RENDER_TYPE) {
    const { wtSettings, wtTable } = this;
    let height;
    let scrollbarHeight;
    let fixedRowsHeight;

    this.rowHeaderWidth = NaN;

    if (wtSettings.getSetting('renderAllRows') && calculationType === RENDER_TYPE) {
      height = Infinity;
    } else {
      height = this.getViewportHeight();
    }

    let pos = this.dataAccessObject.topScrollPosition - this.dataAccessObject.topParentOffset;

    if (pos < 0) {
      pos = 0;
    }

    const fixedRowsTop = wtSettings.getSetting('fixedRowsTop');
    const fixedRowsBottom = wtSettings.getSetting('fixedRowsBottom');
    const totalRows = wtSettings.getSetting('totalRows');

    if (fixedRowsTop) {
      fixedRowsHeight = this.dataAccessObject.topOverlay.sumCellSizes(0, fixedRowsTop);
      pos += fixedRowsHeight;
      height -= fixedRowsHeight;
    }

    if (fixedRowsBottom && this.dataAccessObject.bottomOverlay.clone) {
      fixedRowsHeight = this.dataAccessObject.bottomOverlay.sumCellSizes(totalRows - fixedRowsBottom, totalRows);

      height -= fixedRowsHeight;
    }

    if (wtTable.holder.clientHeight === wtTable.holder.offsetHeight) {
      scrollbarHeight = 0;
    } else {
      scrollbarHeight = getScrollbarWidth(this.domBindings.rootDocument);
    }

    return new ViewportRowsCalculator({
      viewportSize: height,
      scrollOffset: pos,
      totalItems: wtSettings.getSetting('totalRows'),
      itemSizeFn: sourceRow => wtTable.getRowHeight(sourceRow),
      overrideFn: wtSettings.getSettingPure('viewportRowCalculatorOverride'),
      calculationType,
      scrollbarHeight,
    });
  }

  /**
   * Creates:
   * - columnsRenderCalculator (before draw, to qualify columns for rendering)
   * - columnsVisibleCalculator (after draw, to measure which columns are actually visible).
   *
   * @param {number} calculationType The render type ID, which determines for what type of
   *                                 calculation calculator is created.
   * @returns {ViewportColumnsCalculator}
   */
  createColumnsCalculator(calculationType = RENDER_TYPE) {
    const { wtSettings, wtTable } = this;
    let width = this.getViewportWidth();
    let pos = Math.abs(this.dataAccessObject.inlineStartScrollPosition) - this.dataAccessObject.inlineStartParentOffset;

    this.columnHeaderHeight = NaN;

    const fixedColumnsStart = wtSettings.getSetting('fixedColumnsStart');

    if (fixedColumnsStart) {
      const fixedColumnsWidth = this.dataAccessObject.inlineStartOverlay.sumCellSizes(0, fixedColumnsStart);

      width -= fixedColumnsWidth;
    }
    if (wtTable.holder.clientWidth !== wtTable.holder.offsetWidth) {
      width -= getScrollbarWidth(this.domBindings.rootDocument);
    }

    return new ViewportColumnsCalculator({
      viewportSize: width,
      scrollOffset: Math.abs(pos),
      totalItems: wtSettings.getSetting('totalColumns'),
      itemSizeFn: sourceCol => wtTable.getColumnWidth(sourceCol),
      overrideFn: wtSettings.getSettingPure('viewportColumnCalculatorOverride'),
      calculationType,
      stretchMode: wtSettings.getSetting('stretchH'),
      stretchingItemWidthFn: (stretchedWidth, column) => {
        return wtSettings.getSetting('onBeforeStretchingColumnWidth', stretchedWidth, column);
      },
    });
  }

  /**
   * Creates rowsRenderCalculator and columnsRenderCalculator (before draw, to determine what rows and
   * cols should be rendered).
   *
   * @param {boolean} fastDraw If `true`, will try to avoid full redraw and only update the border positions.
   *                           If `false` or `undefined`, will perform a full redraw.
   * @returns {boolean} The fastDraw value, possibly modified.
   */
  createRenderCalculators(fastDraw = false) {
    let runFastDraw = fastDraw;

    if (runFastDraw) {
      const proposedRowsVisibleCalculator = this.createRowsCalculator(FULLY_VISIBLE_TYPE);
      const proposedColumnsVisibleCalculator = this.createColumnsCalculator(FULLY_VISIBLE_TYPE);

      if (!(this.areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator) &&
          this.areAllProposedVisibleColumnsAlreadyRendered(proposedColumnsVisibleCalculator))) {
        runFastDraw = false;
      }
    }

    if (!runFastDraw) {
      this.rowsRenderCalculator = this.createRowsCalculator(RENDER_TYPE);
      this.columnsRenderCalculator = this.createColumnsCalculator(RENDER_TYPE);
    }
    // delete temporarily to make sure that renderers always use rowsRenderCalculator, not rowsVisibleCalculator
    this.rowsVisibleCalculator = null;
    this.columnsVisibleCalculator = null;

    return runFastDraw;
  }

  /**
   * Creates rowsVisibleCalculator and columnsVisibleCalculator (after draw, to determine what are
   * the actually fully visible rows and columns).
   */
  createVisibleCalculators() {
    this.rowsVisibleCalculator = this.createRowsCalculator(FULLY_VISIBLE_TYPE);
    this.columnsVisibleCalculator = this.createColumnsCalculator(FULLY_VISIBLE_TYPE);
  }

  /**
   * Returns information whether proposedRowsVisibleCalculator viewport
   * is contained inside rows rendered in previous draw (cached in rowsRenderCalculator).
   *
   * @param {ViewportRowsCalculator} proposedRowsVisibleCalculator The instance of the viewport calculator to compare with.
   * @returns {boolean} Returns `true` if all proposed visible rows are already rendered (meaning: redraw is not needed).
   *                    Returns `false` if at least one proposed visible row is not already rendered (meaning: redraw is needed).
   */
  areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator) {
    if (!this.rowsVisibleCalculator) {
      return false;
    }

    const { startRow, endRow } = proposedRowsVisibleCalculator;
    const { startRow: renderedStartRow, endRow: renderedEndRow } = this.rowsRenderCalculator;

    if (startRow < renderedStartRow || (startRow === renderedStartRow && startRow > 0)) {
      return false;

    } else if (endRow > renderedEndRow ||
              (endRow === renderedEndRow && endRow < this.wtSettings.getSetting('totalRows') - 1)) {
      return false;
    }

    return true;
  }

  /**
   * Returns information whether proposedColumnsVisibleCalculator viewport
   * is contained inside column rendered in previous draw (cached in columnsRenderCalculator).
   *
   * @param {ViewportRowsCalculator} proposedColumnsVisibleCalculator The instance of the viewport calculator to compare with.
   * @returns {boolean} Returns `true` if all proposed visible columns are already rendered (meaning: redraw is not needed).
   *                    Returns `false` if at least one proposed visible column is not already rendered (meaning: redraw is needed).
   */
  areAllProposedVisibleColumnsAlreadyRendered(proposedColumnsVisibleCalculator) {
    if (!this.columnsVisibleCalculator) {
      return false;
    }

    const { startColumn, endColumn } = proposedColumnsVisibleCalculator;
    const { startColumn: renderedStartColumn, endColumn: renderedEndColumn } = this.columnsRenderCalculator;

    if (startColumn < renderedStartColumn || (startColumn === renderedStartColumn && startColumn > 0)) {
      return false;

    } else if (endColumn > renderedEndColumn ||
              (endColumn === renderedEndColumn && endColumn < this.wtSettings.getSetting('totalColumns') - 1)) {
      return false;
    }

    return true;
  }

  /**
   * Resets values in keys of the hasOversizedColumnHeadersMarked object after updateSettings.
   */
  resetHasOversizedColumnHeadersMarked() {
    objectEach(this.hasOversizedColumnHeadersMarked, (value, key, object) => {
      object[key] = void 0;
    });
  }
}

export default Viewport;
