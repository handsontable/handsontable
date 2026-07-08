/**
 * The viewport calculator-creation queries for `Viewport`, plus the mixin object that implements them.
 *
 * These methods build the row/column render, fully-visible, and partially-visible calculators and
 * decide (on a fast draw) whether the proposed visible range is already inside the rendered band.
 * They were extracted verbatim from `Viewport` and applied with the same `mixin()` helper the
 * range-query and sticky mixins use, so the public surface and behavior are unchanged; only the
 * private `#deps` access became the public `this.deps` getter.
 *
 * The calculator RESULT fields (`rowsRenderCalculator`, `rowsVisibleCalculator`, …) stay owned by
 * `Viewport`; `createCalculators` / `createVisibleCalculators` assign them through `this`.
 */
import type { CalculationTypeLike, ColumnsCalculationType, RowsCalculationType } from '../calculator/viewportBase';
import { ViewportColumnsCalculator, ViewportRowsCalculator } from '../calculator';
import type { default as Viewport } from './viewport';

/**
 * Which viewport box a calculator reads from the layout snapshot. `'render'` is scrollbar-unaware
 * (covers the strip a scrollbar sits over, so `getCell` on that row/column returns a real TD);
 * `'visible'` is scrollbar-aware (drives the fully/partially-visible counts and scroll-to-cell).
 */
export type ViewportBand = 'render' | 'visible';

/**
 * Calculator-creation queries, mixed into `Viewport`.
 */
export interface CalculatorFactory {
  createRowsCalculator(calculatorTypes?: string[], band?: ViewportBand): ViewportRowsCalculator;
  createColumnsCalculator(calculatorTypes?: string[], band?: ViewportBand): ViewportColumnsCalculator;
  createCalculators(fastDraw?: boolean): boolean;
  createVisibleCalculators(): void;
  usesLayoutSnapshotForCalculators(): boolean;
  allowsRowDeltaRender(): boolean;
  areAllProposedVisibleRowsAlreadyRendered(
    proposedFullyVisibleRowsCalculator: RowsCalculationType | undefined,
    proposedPartiallyVisibleRowsCalculator: RowsCalculationType | undefined): boolean;
  areAllProposedVisibleColumnsAlreadyRendered(
    proposedFullyVisibleColumnsCalculator: ColumnsCalculationType | undefined,
    proposedPartiallyVisibleColumnsCalculator: ColumnsCalculationType | undefined): boolean;
}

/**
 * The calculator-factory mixin. Implements `CalculatorFactory`.
 *
 * @type {CalculatorFactory}
 */
export const calculatorFactory: CalculatorFactory = {
  /**
   * Creates rows calculators. The type of the calculations can be chosen from the list:
   *  - 'rendered' Calculates rows that should be rendered within the current table's viewport;
   *  - 'fullyVisible' Calculates rows that are fully visible (used mostly for scrolling purposes);
   *  - 'partiallyVisible' Calculates rows that are partially visible (used mostly for scrolling purposes).
   *
   * @this Viewport
   * @param {'rendered' | 'fullyVisible' | 'partiallyVisible'} calculatorTypes The list of the calculation types.
   * @returns {ViewportRowsCalculator}
   */
  createRowsCalculator(
    this: Viewport,
    calculatorTypes = ['rendered', 'fullyVisible', 'partiallyVisible'],
    band: ViewportBand = 'visible'
  ): ViewportRowsCalculator {
    const { wtSettings, wtTable } = this;
    const totalRows = wtSettings.getSetting<number>('totalRows');
    const useSnapshot = this.usesLayoutSnapshotForCalculators();

    // Single-pass: source the row viewport from the layout snapshot. The render band reads the
    // scrollbar-unaware height (so it still covers the row under a horizontal scrollbar); the visible
    // band reads the scrollbar-aware height. Both are baked into the snapshot value, so the calculator
    // subtracts no extra scrollbar (`scrollbarHeight = 0`). Legacy path measures the rendered DOM.
    let height;
    let scrollbarHeight = 0;
    let fixedRowsHeight;

    if (useSnapshot) {
      const layout = this.getLayout();

      height = band === 'render' ? layout.renderViewportHeight : layout.visibleViewportHeight;
    } else {
      height = this.getViewportHeight();
    }

    this.rowHeaderWidth = NaN;

    const topOverlay = this.deps.getTopOverlay();
    const bottomOverlay = this.deps.getBottomOverlay();
    let pos = topOverlay.getScrollPosition() - topOverlay.getTableParentOffset();

    const fixedRowsTop = wtSettings.getSetting<number>('fixedRowsTop');
    const fixedRowsBottom = wtSettings.getSetting<number>('fixedRowsBottom');

    if (fixedRowsTop && pos >= 0) {
      fixedRowsHeight = topOverlay.sumCellSizes(0, fixedRowsTop);
      pos += fixedRowsHeight;
      height -= fixedRowsHeight;
    }

    if (fixedRowsBottom && bottomOverlay.clone) {
      fixedRowsHeight = bottomOverlay.sumCellSizes(totalRows - fixedRowsBottom, totalRows);

      height -= fixedRowsHeight;
    }

    if (!useSnapshot) {
      const { geometryReader } = this.deps;

      if (geometryReader.clientHeight(wtTable.holder) !== geometryReader.offsetHeight(wtTable.holder)) {
        scrollbarHeight = geometryReader.getScrollbarWidth(this.deps.rootDocument);
      }
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
  },

  /**
   * Creates columns calculators. The type of the calculations can be chosen from the list:
   *  - 'rendered' Calculates columns that should be rendered within the current table's viewport;
   *  - 'fullyVisible' Calculates columns that are fully visible (used mostly for scrolling purposes);
   *  - 'partiallyVisible' Calculates columns that are partially visible (used mostly for scrolling purposes).
   *
   * @this Viewport
   * @param {'rendered' | 'fullyVisible' | 'partiallyVisible'} calculatorTypes The list of the calculation types.
   * @returns {ViewportColumnsCalculator}
   */
  createColumnsCalculator(
    this: Viewport,
    calculatorTypes = ['rendered', 'fullyVisible', 'partiallyVisible'],
    band: ViewportBand = 'visible'
  ): ViewportColumnsCalculator {
    const { wtSettings, wtTable } = this;
    const inlineStartOverlay = this.deps.getInlineStartOverlay();
    const totalColumns = wtSettings.getSetting<number>('totalColumns');
    const useSnapshot = this.usesLayoutSnapshotForCalculators();

    // Single-pass twin of `createRowsCalculator`: the render band reads the scrollbar-unaware width,
    // the visible band the scrollbar-aware width (both from the snapshot). Legacy path measures the DOM
    // and subtracts a present vertical scrollbar from the width.
    let width;

    if (useSnapshot) {
      const layout = this.getLayout();

      width = band === 'render' ? layout.renderViewportWidth : layout.visibleViewportWidth;
    } else {
      width = this.getViewportWidth();
    }

    let pos = Math.abs(inlineStartOverlay.getScrollPosition()) - inlineStartOverlay.getTableParentOffset();

    this.columnHeaderHeight = NaN;

    const fixedColumnsStart = wtSettings.getSetting<number>('fixedColumnsStart');

    if (fixedColumnsStart && pos >= 0) {
      const fixedColumnsWidth = inlineStartOverlay.sumCellSizes(0, fixedColumnsStart);

      pos += fixedColumnsWidth;
      width -= fixedColumnsWidth;
    }

    if (!useSnapshot) {
      const { geometryReader } = this.deps;

      if (geometryReader.clientWidth(wtTable.holder) !== geometryReader.offsetWidth(wtTable.holder)) {
        width -= geometryReader.getScrollbarWidth(this.deps.rootDocument);
      }
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
      inlineStartOffset: inlineStartOverlay.getTableParentOffset(),
      columnWidthCache: this.columnWidthCache,
    });
  },

  /**
   * Creates rowsRenderCalculator and columnsRenderCalculator (before draw, to determine what rows and
   * cols should be rendered).
   *
   * @this Viewport
   * @param {boolean} fastDraw If `true`, will try to avoid full redraw and only update the border positions.
   *                           If `false` or `undefined`, will perform a full redraw.
   * @returns {boolean} The fastDraw value, possibly modified.
   */
  createCalculators(this: Viewport, fastDraw = false): boolean {
    const { wtSettings } = this;
    const useSnapshot = this.usesLayoutSnapshotForCalculators();

    // In single-pass mode the render band (scrollbar-unaware) and the visible band (scrollbar-aware)
    // read different viewport boxes, so they need separate calculators built in one pass. The visible
    // calculator carries the fully/partially-visible results; a dedicated render-band calculator
    // carries the `rendered` result. In legacy mode one calculator serves both (render == visible),
    // preserving the previous behavior byte-for-byte.
    const visibleTypes = useSnapshot ? ['fullyVisible', 'partiallyVisible'] : undefined;
    const rowsCalculator = this.createRowsCalculator(visibleTypes);
    const columnsCalculator = this.createColumnsCalculator(visibleTypes);
    const rowsRenderCalculator = useSnapshot ? this.createRowsCalculator(['rendered'], 'render') : rowsCalculator;
    const columnsRenderCalculator = useSnapshot
      ? this.createColumnsCalculator(['rendered'], 'render') : columnsCalculator;

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
      this.rowsRenderCalculator = rowsRenderCalculator.getResultsFor('rendered') ?? null;
      this.columnsRenderCalculator = columnsRenderCalculator.getResultsFor('rendered') ?? null;
    }

    this.rowsVisibleCalculator = rowsCalculator.getResultsFor('fullyVisible') ?? null;
    this.columnsVisibleCalculator = columnsCalculator.getResultsFor('fullyVisible') ?? null;
    this.rowsPartiallyVisibleCalculator = rowsCalculator.getResultsFor('partiallyVisible') ?? null;
    this.columnsPartiallyVisibleCalculator = columnsCalculator.getResultsFor('partiallyVisible') ?? null;

    return fastDraw;
  },

  /**
   * Creates rows and columns calculators (after draw, to determine what are
   * the actually fully visible and partially visible rows and columns).
   *
   * @this Viewport
   */
  createVisibleCalculators(this: Viewport): void {
    const rowsCalculator = this.createRowsCalculator(['fullyVisible', 'partiallyVisible']);
    const columnsCalculator = this.createColumnsCalculator(['fullyVisible', 'partiallyVisible']);

    this.rowsVisibleCalculator = rowsCalculator.getResultsFor('fullyVisible') ?? null;
    this.columnsVisibleCalculator = columnsCalculator.getResultsFor('fullyVisible') ?? null;
    this.rowsPartiallyVisibleCalculator = rowsCalculator.getResultsFor('partiallyVisible') ?? null;
    this.columnsPartiallyVisibleCalculator = columnsCalculator.getResultsFor('partiallyVisible') ?? null;
  },

  /**
   * Decides whether the calculators read their viewport boxes from the layout snapshot (single-pass)
   * or measure the rendered DOM (legacy). The snapshot path is scoped to the cases where a numeric
   * prediction is exact and matches the DOM: the table scrolls inside its own element (not the window,
   * whose scroll depends on other page content) and every row and column uses a uniform size (so the
   * content totals from the size caches equal what renders). `singlePassLayout` is the master escape
   * hatch (off under `mergeCells`). Anything else falls back to the measured path unchanged.
   *
   * @this Viewport
   * @returns {boolean}
   */
  usesLayoutSnapshotForCalculators(this: Viewport): boolean {
    return this.wtSettings.getSetting<boolean>('singlePassLayout') &&
      !this.isVerticallyScrollableByWindow() &&
      !this.isHorizontallyScrollableByWindow() &&
      this.wtSettings.getSetting<boolean>('rowHeightsUniform') &&
      this.wtSettings.getSetting<boolean>('columnWidthsUniform');
  },

  /**
   * Decides whether the TBODY row band may be delta-rendered on a pure vertical scroll (rotate the
   * surviving TR nodes, render only the entering rows). This is a looser gate than the single-pass
   * layout gate: it drops the uniform-size requirements (row rotation preserves each surviving row's
   * own content and height, and column widths never change on a vertical scroll), but keeps the two
   * conditions that make skipping a survivor's re-render unsafe — `singlePassLayout` off (which
   * `mergeCells` forces, and merged cells recompute their spans per viewport) and window scrolling
   * (a different scroll/offset model). Anything else takes the full band render unchanged.
   *
   * @this Viewport
   * @returns {boolean}
   */
  allowsRowDeltaRender(this: Viewport): boolean {
    return this.wtSettings.getSetting<boolean>('singlePassLayout') &&
      !this.isVerticallyScrollableByWindow() &&
      !this.isHorizontallyScrollableByWindow();
  },

  /**
   * Returns information whether proposedFullyVisibleRowsCalculator viewport
   * is contained inside rows rendered in previous draw (cached in rowsRenderCalculator).
   *
   * @this Viewport
   * @param {ViewportRowsCalculator} proposedFullyVisibleRowsCalculator The instance of the fully visible rows viewport calculator to compare with.
   * @param {ViewportRowsCalculator} proposedPartiallyVisibleRowsCalculator The instance of the partially visible rows viewport calculator to compare with.
   * @returns {boolean} Returns `true` if all proposed visible rows are already rendered (meaning: redraw is not needed).
   *                    Returns `false` if at least one proposed visible row is not already rendered (meaning: redraw is needed).
   */
  areAllProposedVisibleRowsAlreadyRendered(
    this: Viewport,
    proposedFullyVisibleRowsCalculator: RowsCalculationType | undefined,
    proposedPartiallyVisibleRowsCalculator: RowsCalculationType | undefined): boolean {
    if (!this.rowsVisibleCalculator || !this.rowsRenderCalculator ||
        !proposedFullyVisibleRowsCalculator || !proposedPartiallyVisibleRowsCalculator) {
      return false;
    }

    let { startRow, endRow } = proposedFullyVisibleRowsCalculator;
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
  },

  /**
   * Returns information whether proposedFullyVisibleColumnsCalculator viewport
   * is contained inside column rendered in previous draw (cached in columnsRenderCalculator).
   *
   * @this Viewport
   * @param {ViewportRowsCalculator} proposedFullyVisibleColumnsCalculator The instance of the fully visible columns viewport calculator to compare with.
   * @param {ViewportRowsCalculator} proposedPartiallyVisibleColumnsCalculator The instance of the partially visible columns viewport calculator to compare with.
   * @returns {boolean} Returns `true` if all proposed visible columns are already rendered (meaning: redraw is not needed).
   *                    Returns `false` if at least one proposed visible column is not already rendered (meaning: redraw is needed).
   */
  areAllProposedVisibleColumnsAlreadyRendered(
    this: Viewport,
    proposedFullyVisibleColumnsCalculator: ColumnsCalculationType | undefined,
    proposedPartiallyVisibleColumnsCalculator: ColumnsCalculationType | undefined
  ): boolean {
    if (!this.columnsVisibleCalculator || !this.columnsRenderCalculator ||
        !proposedFullyVisibleColumnsCalculator || !proposedPartiallyVisibleColumnsCalculator) {
      return false;
    }

    let { startColumn, endColumn } = proposedFullyVisibleColumnsCalculator;
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
  },
};
