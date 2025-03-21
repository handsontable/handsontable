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
import { 
  DomBindings, 
  EventManager, 
  Settings, 
  ViewportDao 
} from './types';

/**
 * @class Viewport
 */
class Viewport {
  dataAccessObject: ViewportDao;
  wot: any;
  instance: any;
  domBindings: DomBindings;
  wtSettings: Settings;
  wtTable: any;
  oversizedRows: number[];
  oversizedColumnHeaders: number[];
  hasVerticalScroll: boolean;
  hasHorizontalScroll: boolean;
  rowsRenderCalculator: ViewportRowsCalculator | null;
  columnHeadersCount: number;
  rowHeadersCount: number;
  rowHeaderWidth: number;
  columnsVisibleCalculator: ViewportColumnsCalculator | null;
  rowsVisibleCalculator: ViewportRowsCalculator | null;
  columnsFullyVisibleCalculator: ViewportColumnsCalculator | null;
  rowsFullyVisibleCalculator: ViewportRowsCalculator | null;
  columnsPartiallyVisibleCalculator: ViewportColumnsCalculator | null;
  rowsPartiallyVisibleCalculator: ViewportRowsCalculator | null;
  columnsRenderCalculator: ViewportColumnsCalculator | null;
  workspaceWidth: number;
  scrollableElement: any;
  isRtl: boolean;

  /**
   * @param {ViewportDao} dataAccessObject The Walkontable instance.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {EventManager} eventManager The instance event manager.
   * @param {Table} wtTable The table.
   */
  constructor(dataAccessObject: ViewportDao, domBindings: DomBindings, wtSettings: Settings, eventManager: EventManager, wtTable: any) {
    this.dataAccessObject = dataAccessObject;
    // legacy support
    this.wot = dataAccessObject.wot;
    this.instance = this.wot;
    this.domBindings = domBindings;
    this.wtSettings = wtSettings;
    this.wtTable = wtTable;
    this.oversizedRows = [];
    this.oversizedColumnHeaders = [];
    this.hasVerticalScroll = false;
    this.hasHorizontalScroll = false;
    this.rowsRenderCalculator = null;
    this.columnHeadersCount = 0;
    this.rowHeadersCount = 0;
    this.rowHeaderWidth = 0;
    this.columnsVisibleCalculator = null;
    this.rowsVisibleCalculator = null;
    this.columnsFullyVisibleCalculator = null;
    this.rowsFullyVisibleCalculator = null;
    this.columnsPartiallyVisibleCalculator = null;
    this.rowsPartiallyVisibleCalculator = null;
    this.columnsRenderCalculator = null;
    this.isRtl = this.wtSettings.getSetting('rtlMode');

    this.updateScroll();

    eventManager.addEventListener(window, 'resize', () => {
      this.updateScroll();
    });
  }

  /**
   * Updates the scroll values.
   */
  updateScroll(): void {
    const { wot, workspaceWidth } = this;
    // legacy support
    const rootElement: HTMLElement = this.domBindings.rootTable;
    let scrollbarWidth: number;
    let scrollbarHeight: number;
    let totalColumns: number;
    let totalRows: number;
    let headerHeight: number;

    if (wot.getSetting('preventOverflow') === true) {
      return;
    }

    if (!rootElement.parentNode) {
      return;
    }

    const { scrollHeight, scrollWidth } = rootElement;
    const rootElementParent = rootElement.parentNode;
    // Info: When running unit tests, parentNode may not be an HTMLElement element (i.e., JSDOM scenario), which
    // implements the `getComputedStyle` method, but some document iframe (unit tests catching the window.error event).
    const tempScrollbarWidth = getScrollbarWidth(this.domBindings.rootDocument);
    const elementStyle = (rootElementParent instanceof HTMLElement ||
      rootElementParent instanceof DocumentFragment) ?
      this.domBindings.rootWindow.getComputedStyle(rootElementParent as HTMLElement) : null;

    this.hasVerticalScroll = false;
    this.hasHorizontalScroll = false;

    let trimmingContainer = wot.getSetting('trimmingContainer');

    if (trimmingContainer === window) {
      scrollbarWidth = tempScrollbarWidth;
      scrollbarHeight = tempScrollbarWidth;
      const { innerHeight, innerWidth } = this.domBindings.rootWindow;

      totalColumns = wot.getSetting('totalColumns');
      totalRows = wot.getSetting('totalRows');

      // Width and height of the main scroll
      const containerWidth = innerWidth - (this.dataAccessObject.inlineStartOverlay ? this.dataAccessObject.inlineStartOverlay.clone.wtTable.getWidth() : 0);
      const containerHeight = innerHeight - (this.dataAccessObject.topOverlay ? this.dataAccessObject.topOverlay.clone.wtTable.getHeight() : 0);

      const maxRows = Math.min(totalRows, wot.getSetting('fixedRowsBottom') || Infinity);
      const maxCols = Math.min(totalColumns, wot.getSetting('fixedColumnsStart') || Infinity);

      if (totalColumns > 0) {
        this.hasHorizontalScroll = scrollWidth > containerWidth ||
          wot.getSetting('columnWidth') > 300 ||
          this.wtTable.getWidth() > containerWidth;
      }
      if (totalRows > 0) {
        this.hasVerticalScroll = scrollHeight > containerHeight ||
          wot.getSetting('rowHeight') > 300 ||
          this.wtTable.getHeight() > containerHeight;
      }

    } else if (trimmingContainer !== void 0) {
      scrollbarWidth = trimmingContainer.scrollWidth === trimmingContainer.clientWidth ? 0 : tempScrollbarWidth;
      scrollbarHeight = trimmingContainer.scrollHeight === trimmingContainer.clientHeight ? 0 : tempScrollbarWidth;
    } else {
      scrollbarWidth = wot.getSetting('trimmingContainer') !== void 0 || elementStyle ?
        (wot.getSetting('trimmingContainer') || rootElementParent).scrollWidth === (wot.getSetting('trimmingContainer') ||
          rootElementParent).clientWidth ? 0 : tempScrollbarWidth : tempScrollbarWidth;
      scrollbarHeight = wot.getSetting('trimmingContainer') !== void 0 || elementStyle ?
        (wot.getSetting('trimmingContainer') || rootElementParent).scrollHeight === (wot.getSetting('trimmingContainer') ||
          rootElementParent).clientHeight ? 0 : tempScrollbarWidth : tempScrollbarWidth;
    }

    headerHeight = this.wtTable.hider.offsetHeight - this.wtTable.holder.offsetHeight;

    if (scrollbarWidth === void 0) {
      scrollbarWidth = tempScrollbarWidth;
    }
    if (scrollbarHeight === void 0) {
      scrollbarHeight = tempScrollbarWidth;
    }

    this.rowHeaderWidth = this.wtSettings.getRowHeaderActualWidth();
    this.columnHeadersCount = this.wtSettings.getSetting('columnHeaders');
    this.rowHeadersCount = this.wtSettings.getSetting('rowHeaders');

    if (wot.getSetting('columnWidth') instanceof Array) {
      // Support for setting where "columnWidth" option is an array.
      const widths = wot.getSetting('columnWidth');
      let columnWidth = 0;

      if (widths.length) {
        const lastIndex = widths.length;
        const maxIndex = this.wtTable.getLastVisibleColumn();

        for (let index = 0; index <= maxIndex; index++) {
          const width = widths[index >= lastIndex ? lastIndex - 1 : index];

          if (index >= lastIndex) {
            for (let i = 0; i < index; i++) {
              if (widths[i]) {
                columnWidth += widths[i];
              }
            }
            columnWidth += width * (index - lastIndex + 1);
            break;
          }

          columnWidth += width;
        }
      }

      this.workspaceWidth = Math.min(
        columnWidth + this.rowHeaderWidth,
        wot.getSetting('width') - (scrollbarWidth - tempScrollbarWidth),
      );
    } else {
      this.workspaceWidth = Math.min(
        this.wtTable.getWidth() + (wot.getSetting('totalColumns') > 0 ? this.rowHeaderWidth : 0),
        wot.getSetting('width') - (scrollbarWidth - tempScrollbarWidth),
      );
    }

    this.scrollableElement = this.findScrollableElement(rootElement.parentElement);

    // ... existing code ...
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
    if (this.isVerticallyScrollableByWindow()) {
      const documentElement = this.domBindings.rootDocument.documentElement;

      return documentElement.scrollHeight > documentElement.clientHeight;
    }

    const { holder, hider } = this.wtTable;
    const holderHeight = holder.clientHeight;
    const hiderOffsetHeight = hider.offsetHeight;

    if (holderHeight < hiderOffsetHeight) {
      return true;
    }

    return hiderOffsetHeight > this.getWorkspaceHeight();
  }

  /**
   * Checks if viewport has horizontal scroll.
   *
   * @returns {boolean}
   */
  hasHorizontalScroll() {
    if (this.isVerticallyScrollableByWindow()) {
      const documentElement = this.domBindings.rootDocument.documentElement;

      return documentElement.scrollWidth > documentElement.clientWidth;
    }

    const { holder, hider } = this.wtTable;
    const holderWidth = holder.clientWidth;
    const hiderOffsetWidth = hider.offsetWidth;

    if (holderWidth < hiderOffsetWidth) {
      return true;
    }

    return hiderOffsetWidth > this.getWorkspaceWidth();
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
    return offset(this.wtTable.holder);
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
