import {
  getScrollbarWidth,
  offset,
  outerHeight,
  outerWidth,
} from '../../../helpers/dom/element';
import { objectEach } from '../../../helpers/object';
import {
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
    this.rowsVisibleCalculator = null;
    this.columnsVisibleCalculator = null;
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
   * Gets the width of the table workspace (in pixels). The workspace size in the current
   * implementation returns the width of the table holder element including scrollbar width when
   * the table has defined size and the width of the window excluding scrollbar width when
   * the table has no defined size (the window is a scrollable container).
   *
   * This is a bug, as the method should always return stable values, always without scrollbar width.
   * Changing this behavior would break the column calculators, which would also need to be adjusted.
   *
   * @returns {number}
   */
  getWorkspaceWidth() {
    const { rootDocument, rootWindow } = this.domBindings;
    const trimmingContainer = this.dataAccessObject.inlineStartOverlayTrimmingContainer;
    let width;

    if (trimmingContainer === rootWindow) {
      const totalColumns = this.wtSettings.getSetting('totalColumns');

      width = this.wtTable.holder.offsetWidth;

      if (this.getRowHeaderWidth() + this.sumColumnWidths(0, totalColumns) > width) {
        width = rootDocument.documentElement.clientWidth;
      }

    } else {
      width = trimmingContainer.clientWidth;
    }

    return width;
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
   * Checks if viewport has vertical scroll.
   *
   * @returns {boolean}
   */
  hasVerticalScroll() {
    return this.wtTable.hider.offsetHeight > this.getWorkspaceHeight();
  }

  /**
   * Checks if viewport has horizontal scroll.
   *
   * @returns {boolean}
   */
  hasHorizontalScroll() {
    return this.wtTable.hider.offsetWidth > this.getWorkspaceWidth();
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
      this.columnHeaderHeight = outerHeight(this.wtTable.THEAD);
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

    if (wtTable.holder.clientHeight === wtTable.holder.offsetHeight) {
      scrollbarHeight = 0;
    } else {
      scrollbarHeight = getScrollbarWidth(this.domBindings.rootDocument);
    }

    return new ViewportRowsCalculator({
      calculationTypes: calculatorTypes.map(type => [type, this.rowsCalculatorTypes.get(type)()]),
      viewportHeight: height,
      scrollOffset: pos,
      totalRows: wtSettings.getSetting('totalRows'),
      defaultRowHeight: this.instance.stylesHandler.getDefaultRowHeight(),
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
    const rowsCalculator = this.createRowsCalculator();
    const columnsCalculator = this.createColumnsCalculator();

    if (fastDraw && !wtSettings.getSetting('renderAllRows')) {
      const proposedRowsVisibleCalculator = rowsCalculator.getResultsFor('fullyVisible');

      fastDraw = this.areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator);
    }

    if (fastDraw && !wtSettings.getSetting('renderAllColumns')) {
      const proposedColumnsVisibleCalculator = columnsCalculator.getResultsFor('fullyVisible');

      fastDraw = this.areAllProposedVisibleColumnsAlreadyRendered(proposedColumnsVisibleCalculator);
    }

    if (!fastDraw) {
      this.rowsRenderCalculator = rowsCalculator.getResultsFor('rendered');
      this.columnsRenderCalculator = columnsCalculator.getResultsFor('rendered');
    }

    this.rowsVisibleCalculator = rowsCalculator.getResultsFor('fullyVisible');
    this.columnsVisibleCalculator = columnsCalculator.getResultsFor('fullyVisible');
    this.rowsPartiallyVisibleCalculator = rowsCalculator.getResultsFor('partiallyVisible');
    this.columnsPartiallyVisibleCalculator = columnsCalculator.getResultsFor('partiallyVisible');

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
   * Resets values in keys of the hasOversizedColumnHeadersMarked object after updateSettings.
   */
  resetHasOversizedColumnHeadersMarked() {
    objectEach(this.hasOversizedColumnHeadersMarked, (value, key, object) => {
      object[key] = undefined;
    });
  }
}

export default Viewport;
