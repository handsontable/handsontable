import type from './types';
import type Settings from './settings';
import type Table from './table';
import type EventManager from '../../../eventManager';
import type from './calculator/viewportBase';
import {
  getScrollbarWidth,
  offset,
  outerHeight,
  outerWidth,
} from '../../../helpers/dom/element';
import from '../../../helpers/object';
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
import from './utils/positionCache';
import from './constants';

/**
 * @class Viewport
 */
class Viewport {
  /**
   * Data access object used to reach overlay-specific scroll positions and trimming containers.
   */
  declare dataAccessObject: DataAccessObject;
  /**
   * The master Walkontable instance. Kept for legacy support.
   */
  declare wot: WalkontableInstance;
  /**
   * Alias for `wot`. Kept for backward-compatibility.
   */
  declare instance: WalkontableInstance;
  /**
   * DOM element bindings for the root document and window.
   */
  declare domBindings: DomBindings;
  /**
   * The Walkontable settings object.
   */
  declare wtSettings: Settings;
  /**
   * The master table instance.
   */
  declare wtTable: Table;
  /**
   * Cache of overridden row heights, keyed by visual row index.
   */
  declare oversizedRows: Record<number, number | undefined>;
  /**
   * Cache of overridden column header heights, keyed by header level.
   */
  declare oversizedColumnHeaders: Record<number, number | undefined>;
  /**
   * Tracks which overlay names have already had their oversized column headers marked in the current render cycle.
   */
  declare hasOversizedColumnHeadersMarked: Record<string, unknown>;
  /**
   * Last measured client height of the viewport container.
   */
  declare clientHeight: number;
  /**
   * Cached pixel height of all column header rows combined.
   */
  declare columnHeaderHeight: number;
  /**
   * Cached pixel width of all row header columns combined.
   */
  declare rowHeaderWidth: number;
  /**
   * Calculator that holds the range of fully visible rows after the last draw.
   */
  declare rowsVisibleCalculator: RowsCalculationType | null;
  /**
   * Calculator that holds the range of fully visible columns after the last draw.
   */
  declare columnsVisibleCalculator: ColumnsCalculationType | null;
  /**
   * Factory map for row calculator types, keyed by calculation type name.
   */
  declare rowsCalculatorTypes: Map<string, () => CalculationTypeLike>;
  /**
   * Factory map for column calculator types, keyed by calculation type name.
   */
  declare columnsCalculatorTypes: Map<string, () => CalculationTypeLike>;
  /**
   * The event manager used to bind and unbind DOM listeners.
   */
  declare eventManager: EventManager;
  /**
   * Calculator that holds the range of rows that were rendered in the last full draw.
   */
  declare rowsRenderCalculator: RowsCalculationType | null;
  /**
   * Calculator that holds the range of columns that were rendered in the last full draw.
   */
  declare columnsRenderCalculator: ColumnsCalculationType | null;
  /**
   * Calculator that holds the range of partially visible rows after the last draw.
   */
  declare rowsPartiallyVisibleCalculator: RowsCalculationType | null;
  /**
   * Calculator that holds the range of partially visible columns after the last draw.
   */
  declare columnsPartiallyVisibleCalculator: ColumnsCalculationType | null;
  /**
   * Cumulative row height prefix sum cache. Enables O(log n) scroll-to-row lookups.
   */
  declare rowHeightCache: PositionCache;
  /**
   * Cumulative column width prefix sum cache. Enables O(log n) scroll-to-column lookups.
   */
  declare columnWidthCache: PositionCache;

  /**
   * @param dataAccessObject The Walkontable instance.
   * @param domBindings Bindings into DOM.
   * @param wtSettings The Walkontable settings.
   * @param eventManager The instance event manager.
   * @param wtTable The table.
   */
  constructor(
    dataAccessObject: DataAccessObject, domBindings: DomBindings, wtSettings: Settings,
    eventManager: EventManager, wtTable: Table) {
    this.dataAccessObject = dataAccessObject;
    // legacy support
    this.wot = dataAccessObject.wot;
    this.instance = this.wot;
    this.domBindings = domBindings;
    this.wtSettings = wtSettings;
    this.wtTable = wtTable;
    this.oversizedRows = {};
    this.oversizedColumnHeaders = {};
    this.hasOversizedColumnHeadersMarked = {};
    this.clientHeight = 0;
    this.rowHeaderWidth = NaN;
    this.rowsVisibleCalculator = null;
    this.columnsVisibleCalculator = null;
    type CalcTypeFactory = () => CalculationTypeLike;

    this.rowsCalculatorTypes = new Map<string, CalcTypeFactory>([
      ['rendered', () => (this.wtSettings.getSetting('renderAllRows') ?
        new RenderedAllRowsCalculationType() : new RenderedRowsCalculationType())],
      ['fullyVisible', () => new FullyVisibleRowsCalculationType()],
      ['partiallyVisible', () => new PartiallyVisibleRowsCalculationType()],
    ]);
    this.columnsCalculatorTypes = new Map<string, CalcTypeFactory>([
      ['rendered', () => (this.wtSettings.getSetting('renderAllColumns') ?
        new RenderedAllColumnsCalculationType() : new RenderedColumnsCalculationType())],
      ['fullyVisible', () => new FullyVisibleColumnsCalculationType()],
      ['partiallyVisible', () => new PartiallyVisibleColumnsCalculationType()],
    ]);

    /**
     * Cumulative row height prefix sum cache. Enables O(log n) scroll-to-row lookups
     * when custom row heights are configured.
     *
     */
    this.rowHeightCache = new PositionCache({
      totalItemsFn: () => wtSettings.getSetting<number>('totalRows'),
      sizeFn: sourceRow => wtTable.getRowHeight(sourceRow) ?? NaN,
      defaultSizeFn: () => wtSettings.getSetting('stylesHandler').getDefaultRowHeight(),
    });
    /**
     * Cumulative column width prefix sum cache. Enables O(log n) scroll-to-column lookups
     * when custom column widths are configured.
     *
     */
    this.columnWidthCache = new PositionCache({
      totalItemsFn: () => wtSettings.getSetting<number>('totalColumns'),
      sizeFn: sourceCol => wtTable.getColumnWidth(sourceCol),
      defaultSizeFn: () => DEFAULT_COLUMN_WIDTH,
    });

    this.eventManager = eventManager;
    this.eventManager.addEventListener(this.domBindings.rootWindow, 'resize', () => {
      this.clientHeight = this.getWorkspaceHeight();
    });
  }

  /**
   * @returns 
   */
  getWorkspaceHeight() {
    const currentDocument = this.domBindings.rootDocument;
    const trimmingContainer = this.dataAccessObject.topOverlayTrimmingContainer;
    let height = 0;

    if (trimmingContainer === this.domBindings.rootWindow) {
      height = currentDocument.documentElement.clientHeight;

    } else {
      const elemHeight = outerHeight(trimmingContainer as HTMLElement);

      // returns height without DIV scrollbar
      if (elemHeight > 0 && (trimmingContainer as HTMLElement).clientHeight > 0) {
        height = (trimmingContainer as HTMLElement).clientHeight;
      } else {
        // Fall back to window height when the trimming container has zero client height
        // (e.g. a parent with overflow set but no explicit height). Returning Infinity
        // previously caused an unbounded viewport, expanding the parent to the browser's
        // ~2^25 px CSS height limit. See issue #3119.
        height = Math.max(currentDocument.documentElement.clientHeight, 1);
      }
    }

    return height;
  }

  /**
   * @returns 
   */
  getViewportHeight() {
    let containerHeight = this.getWorkspaceHeight();

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
   * @returns 
   */
  getWorkspaceWidth() {
    const = this.domBindings;
    const trimmingContainer = this.dataAccessObject.inlineStartOverlayTrimmingContainer;
    let width;

    if (trimmingContainer === rootWindow) {
      const totalColumns = this.wtSettings.getSetting<number>('totalColumns');

      width = this.wtTable.holder.offsetWidth;

      if (this.getRowHeaderWidth() + this.sumColumnWidths(0, totalColumns) > width) {
        width = rootDocument.documentElement.clientWidth;
      }

    } else {
      width = (trimmingContainer as HTMLElement).clientWidth;
    }

    return width;
  }

  /**
   * @returns 
   */
  getViewportWidth() {
    const containerWidth = this.getWorkspaceWidth();

    const rowHeaderWidth = this.getRowHeaderWidth();

    if (rowHeaderWidth > 0) {
      return containerWidth - rowHeaderWidth;
    }

    return containerWidth;
  }

  /**
   * Checks if viewport has vertical scroll.
   *
   * @returns 
   */
  hasVerticalScroll() {
    if (this.isVerticallyScrollableByWindow()) {
      const documentElement = this.domBindings.rootDocument.documentElement;

      return documentElement.scrollHeight > documentElement.clientHeight;
    }

    const = this.wtTable;
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
   * @returns 
   */
  hasHorizontalScroll() {
    if (this.isVerticallyScrollableByWindow()) {
      const documentElement = this.domBindings.rootDocument.documentElement;

      return documentElement.scrollWidth > documentElement.clientWidth;
    }

    const = this.wtTable;
    const hiderOffsetWidth = hider.offsetWidth;
    const scrollbarWidth = this.hasVerticalScroll() ? getScrollbarWidth() : 0;

    return hiderOffsetWidth > this.getWorkspaceWidth() - scrollbarWidth;
  }

  /**
   * Checks if the table uses the window as a viewport and if there is a vertical scrollbar.
   *
   * @returns 
   */
  isVerticallyScrollableByWindow() {
    return this.dataAccessObject.topOverlayTrimmingContainer === this.domBindings.rootWindow;
  }

  /**
   * Checks if the table uses the window as a viewport and if there is a horizontal scrollbar.
   *
   * @returns 
   */
  isHorizontallyScrollableByWindow() {
    return this.dataAccessObject.inlineStartOverlayTrimmingContainer === this.domBindings.rootWindow;
  }

  /**
   * @param from The visual column index from the width sum is start calculated.
   * @param length The length of the column to traverse.
   * @returns 
   */
  sumColumnWidths(from: number, length: number) {
    let sum = 0;
    let column = from;

    while (column < length) {
      sum += this.wtTable.getColumnWidth(column);
      column += 1;
    }

    return sum;
  }

  /**
   * @returns 
   */
  getWorkspaceOffset() {
    return offset(this.wtTable.holder);
  }

  /**
   * @returns 
   */
  getColumnHeaderHeight() {
    const columnHeaders = this.wtSettings.getSetting<Function[]>('columnHeaders');

    if (!columnHeaders.length) {
      this.columnHeaderHeight = 0;
    } else if (isNaN(this.columnHeaderHeight)) {
      this.columnHeaderHeight = this.wtTable.THEAD ? outerHeight(this.wtTable.THEAD) : 0;
    }

    return this.columnHeaderHeight;
  }

  /**
   * @returns 
   */
  getRowHeaderWidth() {
    const rowHeadersWidthSetting = this.wtSettings.getSetting('rowHeaderWidth');
    const rowHeaders = this.wtSettings.getSetting<Function[]>('rowHeaders');

    if (rowHeadersWidthSetting) {
      this.rowHeaderWidth = 0;

      for (let i = 0, len = rowHeaders.length; i < len; i++) {
        this.rowHeaderWidth += (rowHeadersWidthSetting as unknown as number[])[i] || (rowHeadersWidthSetting as number);
      }
    }

    if (isNaN(this.rowHeaderWidth)) {

      if (rowHeaders.length) {
        let TH = this.wtTable.TABLE.querySelector('TH');

        this.rowHeaderWidth = 0;

        for (let i = 0, len = rowHeaders.length; i < len; i++) {
          if (TH) {
            this.rowHeaderWidth += outerWidth(TH as HTMLElement);
            TH = TH.nextSibling as HTMLTableCellElement;

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
      .getSetting<number>('onModifyRowHeaderWidth', this.rowHeaderWidth) || this.rowHeaderWidth;

    return this.rowHeaderWidth;
  }

  /**
   * Creates rows calculators. The type of the calculations can be chosen from the list:
   *  - 'rendered' Calculates rows that should be rendered within the current table's viewport;
   *  - 'fullyVisible' Calculates rows that are fully visible (used mostly for scrolling purposes);
   *  - 'partiallyVisible' Calculates rows that are partially visible (used mostly for scrolling purposes).
   *
   * @param calculatorTypes The list of the calculation types.
   * @returns 
   */
  createRowsCalculator(calculatorTypes = ['rendered', 'fullyVisible', 'partiallyVisible']) {
    const = this;
    const totalRows = wtSettings.getSetting<number>('totalRows');

    let height = this.getViewportHeight();
    let scrollbarHeight;
    let fixedRowsHeight;

    this.rowHeaderWidth = NaN;

    let pos = this.dataAccessObject.topScrollPosition - this.dataAccessObject.topParentOffset;

    const fixedRowsTop = wtSettings.getSetting<number>('fixedRowsTop');
    const fixedRowsBottom = wtSettings.getSetting<number>('fixedRowsBottom');

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
      calculationTypes: calculatorTypes.flatMap((type): Array<[string, CalculationTypeLike]> => {
        const factory = this.rowsCalculatorTypes.get(type);

        return factory ? [[type, factory()]] : [];
      }),
      viewportHeight: height,
      scrollOffset: pos,
      totalRows,
      overrideFn: wtSettings.getSettingPure('viewportRowCalculatorOverride'),
      horizontalScrollbarHeight: scrollbarHeight,
      rowHeightCache: this.rowHeightCache,
    });
  }

  /**
   * Creates columns calculators. The type of the calculations can be chosen from the list:
   *  - 'rendered' Calculates columns that should be rendered within the current table's viewport;
   *  - 'fullyVisible' Calculates columns that are fully visible (used mostly for scrolling purposes);
   *  - 'partiallyVisible' Calculates columns that are partially visible (used mostly for scrolling purposes).
   *
   * @param calculatorTypes The list of the calculation types.
   * @returns 
   */
  createColumnsCalculator(calculatorTypes = ['rendered', 'fullyVisible', 'partiallyVisible']) {
    const = this;
    const totalColumns = wtSettings.getSetting<number>('totalColumns');

    let width = this.getViewportWidth();
    let pos = Math.abs(this.dataAccessObject.inlineStartScrollPosition) - this.dataAccessObject.inlineStartParentOffset;

    this.columnHeaderHeight = NaN;

    const fixedColumnsStart = wtSettings.getSetting<number>('fixedColumnsStart');

    if (fixedColumnsStart && pos >= 0) {
      const fixedColumnsWidth = this.dataAccessObject.inlineStartOverlay.sumCellSizes(0, fixedColumnsStart);

      pos += fixedColumnsWidth;
      width -= fixedColumnsWidth;
    }
    if (wtTable.holder.clientWidth !== wtTable.holder.offsetWidth) {
      width -= getScrollbarWidth(this.domBindings.rootDocument);
    }

    return new ViewportColumnsCalculator({
      calculationTypes: calculatorTypes.flatMap((type): Array<[string, CalculationTypeLike]> => {
        const factory = this.columnsCalculatorTypes.get(type);

        return factory ? [[type, factory()]] : [];
      }),
      viewportWidth: width,
      scrollOffset: pos,
      totalColumns,
      overrideFn: wtSettings.getSettingPure('viewportColumnCalculatorOverride'),
      inlineStartOffset: this.dataAccessObject.inlineStartParentOffset,
      columnWidthCache: this.columnWidthCache,
    });
  }

  /**
   * Creates rowsRenderCalculator and columnsRenderCalculator (before draw, to determine what rows and
   * cols should be rendered).
   *
   * @param fastDraw If `true`, will try to avoid full redraw and only update the border positions.
   *                           If `false` or `undefined`, will perform a full redraw.
   * @returns The fastDraw value, possibly modified.
   */
  createCalculators(fastDraw = false) {
    const = this;

    const rowsCalculator = this.createRowsCalculator();
    const columnsCalculator = this.createColumnsCalculator();

    if (fastDraw && !wtSettings.getSetting('renderAllRows')) {
      const proposedFullyVisibleRowsCalculator = rowsCalculator.getResultsFor('fullyVisible');
      const proposedPartiallyVisibleRowsCalculator = rowsCalculator.getResultsFor('partiallyVisible');

      fastDraw = this.areAllProposedVisibleRowsAlreadyRendered(
        proposedFullyVisibleRowsCalculator,
        proposedPartiallyVisibleRowsCalculator
      );
    }

    if (fastDraw && !wtSettings.getSetting('renderAllColumns')) {
      const proposedFullyVisibleColumnsCalculator = columnsCalculator.getResultsFor('fullyVisible');
      const proposedPartiallyVisibleColumnsCalculator = columnsCalculator.getResultsFor('partiallyVisible');

      fastDraw = this.areAllProposedVisibleColumnsAlreadyRendered(
        proposedFullyVisibleColumnsCalculator,
        proposedPartiallyVisibleColumnsCalculator
      );
    }

    if (!fastDraw) {
      this.rowsRenderCalculator = rowsCalculator.getResultsFor('rendered') ?? null;
      this.columnsRenderCalculator = columnsCalculator.getResultsFor('rendered') ?? null;
    }

    this.rowsVisibleCalculator = rowsCalculator.getResultsFor('fullyVisible') ?? null;
    this.columnsVisibleCalculator = columnsCalculator.getResultsFor('fullyVisible') ?? null;
    this.rowsPartiallyVisibleCalculator = rowsCalculator.getResultsFor('partiallyVisible') ?? null;
    this.columnsPartiallyVisibleCalculator = columnsCalculator.getResultsFor('partiallyVisible') ?? null;

    return fastDraw;
  }

  /**
   * Creates rows and columns calculators (after draw, to determine what are
   * the actually fully visible and partially visible rows and columns).
   */
  createVisibleCalculators() {
    const rowsCalculator = this.createRowsCalculator(['fullyVisible', 'partiallyVisible']);
    const columnsCalculator = this.createColumnsCalculator(['fullyVisible', 'partiallyVisible']);

    this.rowsVisibleCalculator = rowsCalculator.getResultsFor('fullyVisible') ?? null;
    this.columnsVisibleCalculator = columnsCalculator.getResultsFor('fullyVisible') ?? null;
    this.rowsPartiallyVisibleCalculator = rowsCalculator.getResultsFor('partiallyVisible') ?? null;
    this.columnsPartiallyVisibleCalculator = columnsCalculator.getResultsFor('partiallyVisible') ?? null;
  }

  /**
   * Returns information whether proposedFullyVisibleRowsCalculator viewport
   * is contained inside rows rendered in previous draw (cached in rowsRenderCalculator).
   *
   * @param proposedFullyVisibleRowsCalculator The instance of the fully visible rows viewport calculator to compare with.
   * @param proposedPartiallyVisibleRowsCalculator The instance of the partially visible rows viewport calculator to compare with.
   * @returns Returns `true` if all proposed visible rows are already rendered (meaning: redraw is not needed).
   *                    Returns `false` if at least one proposed visible row is not already rendered (meaning: redraw is needed).
   */
  areAllProposedVisibleRowsAlreadyRendered(
    proposedFullyVisibleRowsCalculator: RowsCalculationType | undefined,
    proposedPartiallyVisibleRowsCalculator: RowsCalculationType | undefined) {
    if (!this.rowsVisibleCalculator || !this.rowsRenderCalculator ||
        !proposedFullyVisibleRowsCalculator || !proposedPartiallyVisibleRowsCalculator) {
      return false;
    }

    let = proposedFullyVisibleRowsCalculator;
    const {
      startRow: partiallyVisibleStartRow,
      endRow: partiallyVisibleEndRow
    } = proposedPartiallyVisibleRowsCalculator;

    // if there are no fully visible rows at all...
    if (startRow === null && endRow === null) {
      if (
        !proposedFullyVisibleRowsCalculator.isVisibleInTrimmingContainer &&
        partiallyVisibleStartRow !== null &&
        !this.wtTable.isRowBeforeRenderedRows(partiallyVisibleStartRow) &&
        partiallyVisibleEndRow !== null &&
        !this.wtTable.isRowAfterRenderedRows(partiallyVisibleEndRow)
      ) {
        return true;
      }
      // ...use partially visible rows calculator to determine what render type is needed
      startRow = partiallyVisibleStartRow;
      endRow = partiallyVisibleEndRow;
    }

    if (startRow === null || endRow === null) {
      return false;
    }

    const {
      startRow: renderedStartRow,
      endRow: renderedEndRow,
      rowStartOffset,
      rowEndOffset,
    } = this.rowsRenderCalculator;

    if (renderedStartRow === null || renderedEndRow === null) {
      return false;
    }

    const totalRows = this.wtSettings.getSetting<number>('totalRows') - 1;
    const renderingThreshold = this.wtSettings.getSetting('viewportRowRenderingThreshold');

    if (typeof renderingThreshold === 'number' && Number.isInteger(renderingThreshold) && renderingThreshold > 0) {
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
   * Returns information whether proposedFullyVisibleColumnsCalculator viewport
   * is contained inside column rendered in previous draw (cached in columnsRenderCalculator).
   *
   * @param proposedFullyVisibleColumnsCalculator The instance of the fully visible columns viewport calculator to compare with.
   * @param proposedPartiallyVisibleColumnsCalculator The instance of the partially visible columns viewport calculator to compare with.
   * @returns Returns `true` if all proposed visible columns are already rendered (meaning: redraw is not needed).
   *                    Returns `false` if at least one proposed visible column is not already rendered (meaning: redraw is needed).
   */
  areAllProposedVisibleColumnsAlreadyRendered(
    proposedFullyVisibleColumnsCalculator: ColumnsCalculationType | undefined,
    proposedPartiallyVisibleColumnsCalculator: ColumnsCalculationType | undefined
  ) {
    if (!this.columnsVisibleCalculator || !this.columnsRenderCalculator ||
        !proposedFullyVisibleColumnsCalculator || !proposedPartiallyVisibleColumnsCalculator) {
      return false;
    }

    let = proposedFullyVisibleColumnsCalculator;
    const {
      startColumn: partiallyVisibleStartColumn,
      endColumn: partiallyVisibleEndColumn
    } = proposedPartiallyVisibleColumnsCalculator;

    // if there are no fully visible columns at all...
    if (startColumn === null && endColumn === null) {
      if (
        !proposedFullyVisibleColumnsCalculator.isVisibleInTrimmingContainer &&
        partiallyVisibleStartColumn !== null &&
        !this.wtTable.isColumnBeforeRenderedColumns(partiallyVisibleStartColumn) &&
        partiallyVisibleEndColumn !== null &&
        !this.wtTable.isColumnAfterRenderedColumns(partiallyVisibleEndColumn)
      ) {
        return true;
      }
      // ...use partially visible columns calculator to determine what render type is needed
      startColumn = partiallyVisibleStartColumn;
      endColumn = partiallyVisibleEndColumn;
    }

    if (startColumn === null || endColumn === null) {
      return false;
    }

    const {
      startColumn: renderedStartColumn,
      endColumn: renderedEndColumn,
      columnStartOffset,
      columnEndOffset,
    } = this.columnsRenderCalculator;

    if (renderedStartColumn === null || renderedEndColumn === null) {
      return false;
    }

    const totalColumns = this.wtSettings.getSetting<number>('totalColumns') - 1;
    const renderingThreshold = this.wtSettings.getSetting('viewportColumnRenderingThreshold');

    if (typeof renderingThreshold === 'number' && Number.isInteger(renderingThreshold) && renderingThreshold > 0) {
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
   * Marks the row height position cache as stale. The cache will be rebuilt
   * on the next viewport calculation.
   */
  invalidateRowHeightCache() {
    this.rowHeightCache.invalidate();
  }

  /**
   * Marks the column width position cache as stale. The cache will be rebuilt
   * on the next viewport calculation.
   */
  invalidateColumnWidthCache() {
    this.columnWidthCache.invalidate();
  }

  /**
   * Marks both the row height and column width position caches as stale.
   */
  invalidateAllCaches() {
    this.rowHeightCache.invalidate();
    this.columnWidthCache.invalidate();
  }

  /**
   * Resets values in keys of the hasOversizedColumnHeadersMarked object after updateSettings.
   */
  resetHasOversizedColumnHeadersMarked() {
    objectEach(this.hasOversizedColumnHeadersMarked, (value: unknown, key: string, object: Record<string, unknown>) => {
      object[key] = undefined;
    });
  }
}

export default Viewport;
