import {
  getScrollbarWidth,
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
    this.cachedViewportWidth = null;
    this.cachedViewportHeight = null;
    this.cachedHasVerticalScroll = null;
    this.cachedHasHorizontalScroll = null;
    this.columnHeaderHeight = null;
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

    const trimmingContainer = this.dataAccessObject.topOverlayTrimmingContainer;
    let height = 0;

    if (trimmingContainer === this.domBindings.rootWindow) {
      const { rootDocument, rootWindow } = this.domBindings;
      // const top = Math.max(this.wtTable.THEAD.getBoundingClientRect().top, 0);
      const hasHorizontalScroll = this.hasHorizontalScroll();

      // height = rootDocument.documentElement.clientHeight - top;
      height = rootDocument.documentElement.clientHeight;

      if (rootDocument.documentElement.scrollWidth > rootWindow.innerWidth !== hasHorizontalScroll) {
        const scrollbarHeight = getScrollbarWidth(rootDocument);

        height += hasHorizontalScroll ? -scrollbarHeight : scrollbarHeight;
      }

    } else {
      const offsetHeight = trimmingContainer.offsetHeight;
      const clientHeight = trimmingContainer.clientHeight;

      height = (offsetHeight > 0 && clientHeight > 0) ? clientHeight : Infinity;
    }

    this.cachedWorkspaceHeight = height;

    return height;
  }

  /**
   * Gets the width of the table workspace (in pixels). The workspace size contains
   * the viewport width plus row headers width including the scrollbar width but only if the
   * scrollable element is not the window otherwise the scrollbar width is not included.
   *
   * The method calculates the workspace size that will be after the entire table is rendered - prediction,
   * not after. Thanks to that, it's possible to set the correct viewport size before rendering.
   *
   * @returns {number}
   */
  getWorkspaceWidth() {
    if (this.cachedWorkspaceWidth !== null) {
      return this.cachedWorkspaceWidth;
    }

    const { rootDocument, rootWindow } = this.domBindings;
    const trimmingContainer = this.dataAccessObject.inlineStartOverlayTrimmingContainer;
    let width;

    if (trimmingContainer === rootWindow) {
      const { wtSettings } = this;
      const totalColumns = wtSettings.getSetting('totalColumns');
      // TODO: add RTL support
      // const left = Math.max(Math.round(this.wtTable.TBODY.getBoundingClientRect().left), 0);

      width = this.wtTable.holder.offsetWidth;

      if (this.getRowHeaderWidth() + this.sumColumnWidths(0, totalColumns) > width) {
        // width = Math.max(rootWindow.innerWidth - left, 0);
        width = rootWindow.innerWidth;

      } else {
        const hasVerticalScroll = this.hasVerticalScroll();

        if (rootDocument.documentElement.scrollHeight > rootWindow.innerHeight !== hasVerticalScroll) {
          const scrollbarWidth = getScrollbarWidth(rootDocument);

          width += hasVerticalScroll ? -scrollbarWidth : scrollbarWidth;
        }
      }

    } else {
      width = trimmingContainer.clientWidth;
    }

    this.cachedWorkspaceWidth = width;

    return width;
  }

  /**
   * Gets the width of the table viewport (in pixels). The viewport size is the same as the workspace size
   * minus the row headers width and the scrollbar width (if present).
   *
   * @returns {number}
   */
  getViewportWidth() {
    if (this.cachedViewportWidth !== null) {
      return this.cachedViewportWidth;
    }

    let viewportWidth = this.getWorkspaceWidth();

    if (this.hasVerticalScroll()) {
      // if (this.isHorizontallyScrollableByWindow()) {
      //   const { rootDocument } = this.domBindings;
      //   // TODO: add RTL support
      //   const left = Math.max(Math.round(this.wtTable.TBODY.getBoundingClientRect().left), 0);

      //   if (viewportWidth + left > rootDocument.documentElement.clientWidth) {
      //     viewportWidth -= getScrollbarWidth(this.domBindings.rootDocument);
      //   }

      // } else {
        viewportWidth -= getScrollbarWidth(this.domBindings.rootDocument);
      // }
    }

    viewportWidth -= this.getRowHeaderWidth();
    this.cachedViewportWidth = Math.max(viewportWidth, 0);

    return this.cachedViewportWidth;
  }

  /**
   * Gets the height of the table viewport (in pixels). The viewport size is the same as the workspace size
   * minus the column headers height and the scrollbar height (if present).
   *
   * @returns {number}
   */
  getViewportHeight() {
    if (this.cachedViewportHeight !== null) {
      return this.cachedViewportHeight;
    }

    let viewportHeight = this.getWorkspaceHeight();

    if (viewportHeight === Infinity) {
      return viewportHeight;
    }

    if (this.hasHorizontalScroll()) {
      // if (this.isVerticallyScrollableByWindow()) {
      //   const { rootDocument } = this.domBindings;
      //   const top = Math.max(Math.round(this.wtTable.TABLE.getBoundingClientRect().top), 0);

      //   if (viewportHeight + top > rootDocument.documentElement.clientHeight) {
      //     viewportHeight -= getScrollbarWidth(this.domBindings.rootDocument);
      //   }

      // } else {
        viewportHeight -= getScrollbarWidth(this.domBindings.rootDocument);
      // }
    }

    viewportHeight -= this.getColumnHeaderHeight();
    this.cachedViewportHeight = Math.max(viewportHeight, 0);

    return this.cachedViewportHeight;
  }

  /**
   * Checks if viewport has vertical scroll.
   *
   * @returns {boolean}
   */
  hasVerticalScroll() {
    return this.cachedHasVerticalScroll || false;
  }

  /**
   * Checks if viewport has horizontal scroll.
   *
   * @returns {boolean}
   */
  hasHorizontalScroll() {
    return this.cachedHasHorizontalScroll || false;
  }

  calcScroll() {
    const { wtSettings, wtTable } = this;
    const { rootWindow, rootDocument } = this.domBindings;

    const calcHScroll = () => {
      const totalColumns = wtSettings.getSetting('totalColumns');
      let viewportWidth = 0;

      if (this.isHorizontallyScrollableByWindow()) {
        if (
          rootDocument.documentElement.scrollWidth > rootWindow.innerWidth ||
          rootWindow.getComputedStyle(rootDocument.body).overflowX === 'scroll'
        ) {
          this.cachedHasHorizontalScroll = true;

          return;
        }

        // TODO: add RTL support
        const tableLeft = Math.max(Math.round(wtTable.TABLE.getBoundingClientRect().left), 0);

        viewportWidth = rootWindow.innerWidth - tableLeft;

        if (this.hasVerticalScroll()) {
          viewportWidth -= getScrollbarWidth(rootDocument);
        }

      } else {
        viewportWidth = this.getViewportWidth();
      }

      let hasHScroll = false;
      let totalWidth = 0;

      for (let column = 0; column < totalColumns; column++) {
        totalWidth += wtTable.getColumnWidth(column) ?? DEFAULT_COLUMN_WIDTH;

        if (totalWidth > viewportWidth) {
          hasHScroll = true;
          break;
        }
      }

      this.cachedHasHorizontalScroll = hasHScroll;
    };

    const calcVScroll = () => {
      const totalRows = wtSettings.getSetting('totalRows');
      let viewportHeight = 0;

      if (this.isVerticallyScrollableByWindow()) {
        if (
          rootDocument.documentElement.scrollHeight > rootWindow.innerHeight ||
          rootWindow.getComputedStyle(rootDocument.body).overflowY === 'scroll'
        ) {
          this.cachedHasVerticalScroll = true;

          return;
        }

        const tableTop = Math.max(Math.round(wtTable.TABLE.getBoundingClientRect().top), 0);
        const marginBottom = parseInt(rootWindow.getComputedStyle(rootDocument.body).marginBottom, 10);

        viewportHeight = rootWindow.innerHeight - tableTop - marginBottom;

        if (this.hasHorizontalScroll()) {
          viewportHeight -= getScrollbarWidth(rootDocument);
        }
      } else {
        viewportHeight = this.getViewportHeight();
      }

      let totalHeight = 0;
      let hasVScroll = false;

      for (let row = 0; row < totalRows; row++) {
        const height = (wtTable.getRowHeight(row) ?? DEFAULT_ROW_HEIGHT) + (row === 0 ? 1 : 0);

        totalHeight += height;

        if (totalHeight > viewportHeight) {
          hasVScroll = true;
          break;
        }
      }

      this.cachedHasVerticalScroll = hasVScroll;
    };

    calcVScroll();
    calcHScroll();

    // if (this.cachedHasHorizontalScroll !== this.cachedHasVerticalScroll) {
      this.cachedViewportWidth = null;
      this.cachedViewportHeight = null;
      this.cachedWorkspaceWidth = null;
      this.cachedWorkspaceHeight = null;

      calcVScroll();
      calcHScroll();
    // }
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
    if (this.columnHeaderHeight !== null) {
      return this.columnHeaderHeight;
    }

    const columnHeaders = this.wtSettings.getSetting('columnHeaders');
    let headersHeight = 0;

    if (columnHeaders.length !== 0) {
      headersHeight = this.wtTable.THEAD.offsetHeight;

      if (headersHeight === 0) {
        headersHeight = DEFAULT_ROW_HEIGHT * columnHeaders.length;
      }
    }

    this.columnHeaderHeight = headersHeight;

    return headersHeight;
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

    console.log('height', height);

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

    const fixedColumnsStart = wtSettings.getSetting('fixedColumnsStart');

    if (fixedColumnsStart && pos >= 0) {
      const fixedColumnsWidth = this.dataAccessObject.inlineStartOverlay.sumCellSizes(0, fixedColumnsStart);

      pos += fixedColumnsWidth;
      width -= fixedColumnsWidth;
    }
    // if (wtTable.holder.clientWidth !== wtTable.holder.offsetWidth) {
    //   width -= getScrollbarWidth(this.domBindings.rootDocument);
    // }

    console.log('width', width);

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
    this.cachedHasVerticalScroll = null;
    this.cachedHasHorizontalScroll = null;
    this.cachedViewportWidth = null;
    this.cachedViewportHeight = null;
    this.columnHeaderHeight = null;
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
