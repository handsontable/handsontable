import {
  getScrollbarWidth,
  getStyle,
  offset,
} from '../../../helpers/dom/element';
import { objectEach } from '../../../helpers/object';
import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
  FullyVisibleColumnsCalculationType,
  FullyVisibleRowsCalculationType,
  PartiallyVisibleColumnsCalculationType,
  PartiallyVisibleRowsCalculationType,
  RenderedAllColumnsCalculationType,
  RenderedAllRowsCalculationType,
  RenderedColumnsCalculationType,
  RenderedRowsCalculationType,
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
    this.rowHeaderWidth = NaN;
    this.hadVerticalScroll = false;
    this.rowsCalculator = null;
    this.columnsCalculator = null;
    this.rowsRenderCalculator = null;
    this.columnsRenderCalculator = null;
    this.rowsPartiallyVisibleCalculator = null;
    this.columnsPartiallyVisibleCalculator = null;
    this.rowsVisibleCalculator = null;
    this.columnsVisibleCalculator = null;
    this.cachedWorkspaceWidth = null;
    this.cachedWorkspaceHeight = null;
    this.rowsCalculatorTypes = new Map([
      ['rendered', () => (this.wtSettings.getSetting('renderAllRows') ?
        new RenderedAllRowsCalculationType() : new RenderedRowsCalculationType())],
      ['fullyVisible', () => new FullyVisibleRowsCalculationType()],
      ['partiallyVisible', () => new PartiallyVisibleRowsCalculationType()],
    ]);
    this.columnsCalculatorTypes = new Map([
      ['rendered', () => (this.wtSettings.getSetting('renderAllColumns') ?
        new RenderedAllColumnsCalculationType() : new RenderedColumnsCalculationType())],
      ['fullyVisible', () => new FullyVisibleColumnsCalculationType()],
      ['partiallyVisible', () => new PartiallyVisibleColumnsCalculationType()],
    ]);

    this.eventManager = eventManager;
    this.eventManager.addEventListener(this.domBindings.rootWindow, 'resize', () => {
      this.clientHeight = this.getWorkspaceHeight();
    });
  }

  /**
   * Gets the height of the table workspace (in pixels). The workspace size contains
   * the viewport height plus column headers height.
   *
   * @returns {number}
   */
  getWorkspaceHeight() {
    if (this.cachedWorkspaceHeight !== null) {
      return this.cachedWorkspaceHeight;
    }

    const currentDocument = this.domBindings.rootDocument;
    const trimmingContainer = this.dataAccessObject.topOverlayTrimmingContainer;

    // const tableRect = this.wtTable.TABLE.getBoundingClientRect();
    // const inlineStart = isRtl ? tableRect.right - docOffsetWidth : tableRect.left;

    let height = 0;

    if (trimmingContainer === this.domBindings.rootWindow) {
      height = currentDocument.documentElement.clientHeight;

    } else {
      const elemHeight = trimmingContainer.offsetHeight;

      // returns height without DIV scrollbar
      height = (elemHeight > 0 && trimmingContainer.clientHeight > 0) ? trimmingContainer.clientHeight : Infinity;
    }

    this.cachedWorkspaceHeight = height;

    return height;
  }

  /**
   * Gets the width of the table workspace (in pixels). The workspace size contains
   * the viewport width plus row headers width.
   *
   * @returns {number}
   */
  getWorkspaceWidth() {
    if (this.cachedWorkspaceWidth !== null) {
      return this.cachedWorkspaceWidth;
    }

    const { wtSettings } = this;
    const { rootDocument, rootWindow } = this.domBindings;
    const trimmingContainer = this.dataAccessObject.inlineStartOverlayTrimmingContainer;
    const docOffsetWidth = rootDocument.documentElement.offsetWidth;
    const totalColumns = wtSettings.getSetting('totalColumns');
    const preventOverflow = wtSettings.getSetting('preventOverflow');
    const isRtl = wtSettings.getSetting('rtlMode');
    const tableRect = this.wtTable.TABLE.getBoundingClientRect();
    const inlineStart = isRtl ? tableRect.right - docOffsetWidth : tableRect.left;
    const tableOffset = docOffsetWidth - inlineStart;
    let width;
    let overflow;

    if (preventOverflow) {
      this.cachedWorkspaceWidth = this.wtTable.wtRootElement.offsetWidth;

      return this.cachedWorkspaceWidth;
    }

    if (wtSettings.getSetting('freezeOverlays')) {
      width = Math.min(tableOffset, docOffsetWidth);
    } else {
      width = Math.min(this.wtTable.holder.offsetWidth, tableOffset, docOffsetWidth);
    }

    if (trimmingContainer === rootWindow && totalColumns > 0 && this.sumColumnWidths(0, totalColumns - 1) > width) {
      // in case sum of column widths is higher than available stylesheet width, let's assume using the whole window
      // otherwise continue below, which will allow stretching
      // this is used in `scroll_window.html`
      // TODO test me
      this.cachedWorkspaceWidth = rootDocument.documentElement.clientWidth;

      return this.cachedWorkspaceWidth;
    }

    const hasVerticalScroll = this.hasVerticalScroll();

    if (trimmingContainer !== rootWindow) {
      overflow = getStyle(this.dataAccessObject.inlineStartOverlayTrimmingContainer, 'overflow', rootWindow);

      if (overflow === 'scroll' || overflow === 'hidden' || overflow === 'auto') {
        width = Math.max(width, trimmingContainer.clientWidth);
      }
    } else {
      if (hasVerticalScroll && this.hadVerticalScroll !== hasVerticalScroll) {
        width -= getScrollbarWidth(rootDocument);
      }
    }

    this.cachedWorkspaceWidth = width;
    this.hadVerticalScroll = hasVerticalScroll;

    return width;
  }

  /**
   * @returns {number}
   */
  getViewportWidth() {
    let viewportWidth = this.getWorkspaceWidth();

    if (viewportWidth === Infinity) {
      return viewportWidth;
    }

    viewportWidth -= this.getRowHeaderWidth();

    if (!this.isVerticallyScrollableByWindow() && this.hasVerticalScroll()) {
      viewportWidth -= getScrollbarWidth();
    }

    return viewportWidth;
  }

  /**
   * @returns {number}
   */
  getViewportHeight() {
    let viewportHeight = this.getWorkspaceHeight();

    if (viewportHeight === Infinity) {
      return viewportHeight;
    }

    viewportHeight -= this.getColumnHeaderHeight();

    // if (this.hasHorizontalScroll()) {
    //   viewportHeight -= getScrollbarWidth();
    // }

    return viewportHeight;
  }

  /**
   * Checks if viewport has vertical scroll.
   *
   * @returns {boolean}
   */
  hasVerticalScroll() {
    if (!this.rowsCalculator) {
      const { wtSettings, wtTable } = this;
      const totalRows = wtSettings.getSetting('totalRows');
      const viewportHeight = this.getViewportHeight();
      let totalHeight = 0;
      let hasScroll = false;

      for (let row = 0; row < totalRows; row++) {
        totalHeight += wtTable.getRowHeight(row) ?? DEFAULT_ROW_HEIGHT;

        if (totalHeight >= viewportHeight) {
          hasScroll = true;
          break;
        }
      }

      return hasScroll;
    }

    return this.rowsCalculator.needReverse === false;
  }

  /**
   * Checks if viewport has horizontal scroll.
   *
   * @returns {boolean}
   */
  hasHorizontalScroll() {
    // if (!this.columnsCalculator) {
    //   const { wtSettings, wtTable } = this;
    //   const totalColumns = wtSettings.getSetting('totalColumns');
    //   const viewportWidth = this.getViewportWidth();
    //   let totalWidth = 0;
    //   let hasScroll = false;

    //   for (let column = 0; column < totalColumns; column++) {
    //     totalWidth += wtTable.getColumnWidth(column) ?? DEFAULT_COLUMN_WIDTH;

    //     if (totalWidth >= viewportWidth) {
    //       hasScroll = true;
    //       break;
    //     }
    //   }

    //   return hasScroll;
    // }

    return this.columnsCalculator?.needReverse === false;
  }

  /**
   * Checks if the table uses the window as a viewport and if there is a vertical scrollbar.
   *
   * @returns {boolean}
   */
  isVerticallyScrollableByWindow() {
    return this.dataAccessObject.topOverlayTrimmingContainer === this.domBindings.rootWindow;
  }

  /**
   * Checks if the table uses the window as a viewport and if there is a horizontal scrollbar.
   *
   * @returns {boolean}
   */
  isHorizontallyScrollableByWindow() {
    return this.dataAccessObject.inlineStartOverlayTrimmingContainer === this.domBindings.rootWindow;
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
  getWorkspaceOffset() {
    return offset(this.wtTable.TABLE);
  }

  /**
   * @returns {number}
   */
  getColumnHeaderHeight() {
    const columnHeaders = this.wtSettings.getSetting('columnHeaders');

    if (!columnHeaders.length) {
      this.columnHeaderHeight = 0;
    } else if (isNaN(this.columnHeaderHeight)) {
      this.columnHeaderHeight = this.wtTable.THEAD.offsetHeight;
    }

    return this.columnHeaderHeight;
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
            this.rowHeaderWidth += TH.offsetWidth;
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
   * Creates rows calculators. The type of the calculations can be chosen from the list:
   *  - 'rendered' Calculates rows that should be rendered within the current table's viewport;
   *  - 'fullyVisible' Calculates rows that are fully visible (used mostly for scrolling purposes);
   *  - 'partiallyVisible' Calculates rows that are partially visible (used mostly for scrolling purposes).
   *
   * @param {'rendered' | 'fullyVisible' | 'partiallyVisible'} calculatorTypes The list of the calculation types.
   * @returns {ViewportRowsCalculator}
   */
  createRowsCalculator(calculatorTypes = ['rendered', 'fullyVisible', 'partiallyVisible']) {
    const { wtSettings, wtTable } = this;

    let height = this.getViewportHeight();

    let scrollbarHeight;
    let fixedRowsHeight;

    this.rowHeaderWidth = NaN;

    let pos = this.dataAccessObject.topScrollPosition - this.dataAccessObject.topParentOffset;

    const fixedRowsTop = wtSettings.getSetting('fixedRowsTop');
    const fixedRowsBottom = wtSettings.getSetting('fixedRowsBottom');
    const totalRows = wtSettings.getSetting('totalRows');

    if (fixedRowsTop && pos >= 0) {
      fixedRowsHeight = this.dataAccessObject.topOverlay.sumCellSizes(0, fixedRowsTop);
      pos += fixedRowsHeight;
      height -= fixedRowsHeight;
    }

    if (fixedRowsBottom && this.dataAccessObject.bottomOverlay.clone) {
      fixedRowsHeight = this.dataAccessObject.bottomOverlay.sumCellSizes(totalRows - fixedRowsBottom, totalRows);

      height -= fixedRowsHeight;
    }

    // if (wtTable.holder.clientHeight === wtTable.holder.offsetHeight) {
    //   scrollbarHeight = 0;
    // } else {
    //   scrollbarHeight = getScrollbarWidth(this.domBindings.rootDocument);
    // }

    return new ViewportRowsCalculator({
      calculationTypes: calculatorTypes.map(type => [type, this.rowsCalculatorTypes.get(type)()]),
      viewportHeight: height,
      scrollOffset: pos,
      totalRows: wtSettings.getSetting('totalRows'),
      rowHeightFn: sourceRow => wtTable.getRowHeight(sourceRow),
      overrideFn: wtSettings.getSettingPure('viewportRowCalculatorOverride'),
      horizontalScrollbarHeight: scrollbarHeight,
    });
  }

  /**
   * Creates columns calculators. The type of the calculations can be chosen from the list:
   *  - 'rendered' Calculates columns that should be rendered within the current table's viewport;
   *  - 'fullyVisible' Calculates columns that are fully visible (used mostly for scrolling purposes);
   *  - 'partiallyVisible' Calculates columns that are partially visible (used mostly for scrolling purposes).
   *
   * @param {'rendered' | 'fullyVisible' | 'partiallyVisible'} calculatorTypes The list of the calculation types.
   * @returns {ViewportColumnsCalculator}
   */
  createColumnsCalculator(calculatorTypes = ['rendered', 'fullyVisible', 'partiallyVisible']) {
    const { wtSettings, wtTable } = this;

    let width = this.getViewportWidth();
    let pos = Math.abs(this.dataAccessObject.inlineStartScrollPosition) - this.dataAccessObject.inlineStartParentOffset;

    this.columnHeaderHeight = NaN;

    const fixedColumnsStart = wtSettings.getSetting('fixedColumnsStart');

    if (fixedColumnsStart && pos >= 0) {
      const fixedColumnsWidth = this.dataAccessObject.inlineStartOverlay.sumCellSizes(0, fixedColumnsStart);

      pos += fixedColumnsWidth;
      width -= fixedColumnsWidth;
    }
    if (wtTable.holder.clientWidth !== wtTable.holder.offsetWidth) {
      width -= getScrollbarWidth(this.domBindings.rootDocument);
    }

    return new ViewportColumnsCalculator({
      calculationTypes: calculatorTypes.map(type => [type, this.columnsCalculatorTypes.get(type)()]),
      viewportWidth: width,
      scrollOffset: pos,
      totalColumns: wtSettings.getSetting('totalColumns'),
      columnWidthFn: sourceCol => wtTable.getColumnWidth(sourceCol),
      overrideFn: wtSettings.getSettingPure('viewportColumnCalculatorOverride'),
      inlineStartOffset: this.dataAccessObject.inlineStartParentOffset
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
  createCalculators(fastDraw = false) {
    const { wtSettings } = this;

    this.rowsCalculator = this.createRowsCalculator();
    this.columnsCalculator = this.createColumnsCalculator();

    if (fastDraw && !wtSettings.getSetting('renderAllRows')) {
      const proposedRowsVisibleCalculator = this.rowsCalculator.getResultsFor('fullyVisible');

      fastDraw = this.areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator);
    }

    if (fastDraw && !wtSettings.getSetting('renderAllColumns')) {
      const proposedColumnsVisibleCalculator = this.columnsCalculator.getResultsFor('fullyVisible');

      fastDraw = this.areAllProposedVisibleColumnsAlreadyRendered(proposedColumnsVisibleCalculator);
    }

    if (!fastDraw) {
      this.rowsRenderCalculator = this.rowsCalculator.getResultsFor('rendered');
      this.columnsRenderCalculator = this.columnsCalculator.getResultsFor('rendered');
    }

    this.rowsVisibleCalculator = this.rowsCalculator.getResultsFor('fullyVisible');
    this.columnsVisibleCalculator = this.columnsCalculator.getResultsFor('fullyVisible');
    this.rowsPartiallyVisibleCalculator = this.rowsCalculator.getResultsFor('partiallyVisible');
    this.columnsPartiallyVisibleCalculator = this.columnsCalculator.getResultsFor('partiallyVisible');

    return fastDraw;
  }

  /**
   * Creates rows and columns calculators (after draw, to determine what are
   * the actually fully visible and partially visible rows and columns).
   */
  createVisibleCalculators() {
    const rowsCalculator = this.createRowsCalculator(['fullyVisible', 'partiallyVisible']);
    const columnsCalculator = this.createColumnsCalculator(['fullyVisible', 'partiallyVisible']);

    this.rowsVisibleCalculator = rowsCalculator.getResultsFor('fullyVisible');
    this.columnsVisibleCalculator = columnsCalculator.getResultsFor('fullyVisible');
    this.rowsPartiallyVisibleCalculator = rowsCalculator.getResultsFor('partiallyVisible');
    this.columnsPartiallyVisibleCalculator = columnsCalculator.getResultsFor('partiallyVisible');
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

    let { startRow, endRow } = proposedRowsVisibleCalculator;

    // if there are no fully visible rows at all...
    if (startRow === null && endRow === null) {
      if (!proposedRowsVisibleCalculator.isVisibleInTrimmingContainer) {
        return true;
      }
      // ...use partially visible rows calculator to determine what render type is needed
      startRow = this.rowsPartiallyVisibleCalculator.startRow;
      endRow = this.rowsPartiallyVisibleCalculator.endRow;
    }

    const {
      startRow: renderedStartRow,
      endRow: renderedEndRow,
      rowStartOffset,
      rowEndOffset,
    } = this.rowsRenderCalculator;

    const totalRows = this.wtSettings.getSetting('totalRows') - 1;
    const renderingThreshold = this.wtSettings.getSetting('viewportRowRenderingThreshold');

    if (Number.isInteger(renderingThreshold) && renderingThreshold > 0) {
      startRow = Math.max(0, startRow - Math.min(rowStartOffset, renderingThreshold));
      endRow = Math.min(totalRows, endRow + Math.min(rowEndOffset, renderingThreshold));

    } else if (renderingThreshold === 'auto') {
      startRow = Math.max(0, startRow - Math.ceil(rowStartOffset / 2));
      endRow = Math.min(totalRows, endRow + Math.ceil(rowEndOffset / 2));
    }

    if (startRow < renderedStartRow || (startRow === renderedStartRow && startRow > 0)) {
      return false;

    } else if (endRow > renderedEndRow || (endRow === renderedEndRow && endRow < totalRows)) {
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

    let { startColumn, endColumn } = proposedColumnsVisibleCalculator;

    // if there are no fully visible columns at all...
    if (startColumn === null && endColumn === null) {
      if (!proposedColumnsVisibleCalculator.isVisibleInTrimmingContainer) {
        return true;
      }
      // ...use partially visible columns calculator to determine what render type is needed
      startColumn = this.columnsPartiallyVisibleCalculator.startColumn;
      endColumn = this.columnsPartiallyVisibleCalculator.endColumn;
    }

    const {
      startColumn: renderedStartColumn,
      endColumn: renderedEndColumn,
      columnStartOffset,
      columnEndOffset,
    } = this.columnsRenderCalculator;

    const totalColumns = this.wtSettings.getSetting('totalColumns') - 1;
    const renderingThreshold = this.wtSettings.getSetting('viewportColumnRenderingThreshold');

    if (Number.isInteger(renderingThreshold) && renderingThreshold > 0) {
      startColumn = Math.max(0, startColumn - Math.min(columnStartOffset, renderingThreshold));
      endColumn = Math.min(totalColumns, endColumn + Math.min(columnEndOffset, renderingThreshold));

    } else if (renderingThreshold === 'auto') {
      startColumn = Math.max(0, startColumn - Math.ceil(columnStartOffset / 2));
      endColumn = Math.min(totalColumns, endColumn + Math.ceil(columnEndOffset / 2));
    }

    if (startColumn < renderedStartColumn || (startColumn === renderedStartColumn && startColumn > 0)) {
      return false;

    } else if (endColumn > renderedEndColumn || (endColumn === renderedEndColumn && endColumn < totalColumns)) {
      return false;
    }

    return true;
  }

  /**
   * Clears the internal cached viewport calculations.
   */
  clearCache() {
    this.cachedWorkspaceWidth = null;
    this.cachedWorkspaceHeight = null;
  }

  /**
   * Resets values in keys of the hasOversizedColumnHeadersMarked object after updateSettings.
   */
  resetHasOversizedColumnHeadersMarked() {
    objectEach(this.hasOversizedColumnHeadersMarked, (value, key, object) => {
      object[key] = undefined;
    });
  }
}

export default Viewport;
