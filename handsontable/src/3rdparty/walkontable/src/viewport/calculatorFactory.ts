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
import {
  RenderedColumnsCalculationType,
  RenderedRowsCalculationType,
  ViewportColumnsCalculator,
  ViewportRowsCalculator,
} from '../calculator';
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
  createCalculators(fastDraw?: boolean, options?: { stationaryBands?: boolean }): boolean;
  createVisibleCalculators(): void;
  usesLayoutSnapshotForCalculators(): boolean;
  allowsStationaryBands(): boolean;
  applyRenderedColumnsBandOverscan(renderedColumns: ColumnsCalculationType | null): void;
  applyRenderedRowsBandOverscan(renderedRows: RowsCalculationType | null): void;
  extendRenderedRowsBandTo(startRow: number, endRow: number): void;
  stabilizeRenderedRowsBand(renderedRows: RowsCalculationType | null): void;
  stabilizeRenderedColumnsBand(renderedColumns: ColumnsCalculationType | null): void;
  areAllProposedVisibleRowsAlreadyRendered(
    proposedFullyVisibleRowsCalculator: RowsCalculationType | undefined,
    proposedPartiallyVisibleRowsCalculator: RowsCalculationType | undefined): boolean;
  areAllProposedVisibleColumnsAlreadyRendered(
    proposedFullyVisibleColumnsCalculator: ColumnsCalculationType | undefined,
    proposedPartiallyVisibleColumnsCalculator: ColumnsCalculationType | undefined): boolean;
}

/**
 * The cap on the directional column-band overscan (see
 * {@link CalculatorFactory#applyRenderedColumnsBandOverscan}). Tuned on a 50k-row/300-column grid
 * for perceived smoothness, not raw totals: raising the cap makes band-crossing stalls rarer but
 * taller (0 → a ~40 ms stall on nearly every scroll frame; 8 → a ~50 ms stall every ~10 frames;
 * 16 → every ~19 frames but up to ~60 ms). The 60 ms class reads as a visible catch during smooth
 * scrolling, so 8 trades a few more pauses for keeping every pause in the mild 40–50 ms class.
 *
 * When retuning, keep the user-facing number in the `viewportColumnRenderingOffset` JSDoc
 * (`src/dataMap/metaManager/metaSchema.ts`) in sync.
 */
const COLUMN_BAND_OVERSCAN_MAX = 8;

/**
 * The cap on the directional row-band overscan (see
 * {@link CalculatorFactory#applyRenderedRowsBandOverscan}). Tuned the same way: at 4, one-notch
 * wheel steps (~120 px = 6 rows) drop from a ~30 ms full draw nearly every frame to almost none
 * (hitches over 33 ms: ~22 → 2) while the worst frame stays in the same ~40 ms class as no
 * overscan at all. Higher caps look better on medians but grow the band every full draw must
 * re-render, pushing fast-flick (~25 rows/frame) stalls into the 50–60 ms class.
 *
 * When retuning, keep the user-facing number in the `viewportRowRenderingOffset` JSDoc
 * (`src/dataMap/metaManager/metaSchema.ts`) in sync.
 */
const ROW_BAND_OVERSCAN_MAX = 4;

/**
 * Decides the directional overscan for a freshly computed render band: which side of the band to
 * extend (toward the scroll direction) and by how many tracks. Shared by the row and column overscan
 * appliers — the axis methods map their field names onto this axis-agnostic arithmetic, so the
 * direction rules stay single-sourced.
 *
 * Direction: the sign of the scroll-offset delta between this draw and the previous full draw.
 * A zero delta means the OTHER axis scrolled; an existing overscan side is then preserved (so the
 * band comes out identical), where "existing" is proven by a recorded side offset greater than 1 —
 * the 'auto' offset override adds at most 1 per side, and clamps to 0 at the dataset edges, so
 * offset inequality alone cannot be the test. A band that was never overscanned gets none.
 *
 * Exported for direct unit coverage; the production callers are the two band-overscan appliers
 * in this module.
 *
 * @param {number} scrollOffsetDelta The current band's scroll offset minus the previous band's.
 * @param {object} previous The previous band's recorded side offsets.
 * @param {number} previous.startOffset The previous band's start-side offset.
 * @param {number} previous.endOffset The previous band's end-side offset.
 * @param {object} fresh The freshly computed band's geometry.
 * @param {number} fresh.start The band's first track index.
 * @param {number} fresh.end The band's last track index.
 * @param {number} fresh.count The band's track count.
 * @param {number} total The axis total track count.
 * @param {number} max The axis overscan cap.
 * @returns {{ side: -1 | 1, extension: number } | null} The side to extend (`-1` = start, `1` =
 * end) and the clamped track count, or `null` when no overscan applies.
 */
export function directionalBandOverscan(
  scrollOffsetDelta: number,
  previous: { startOffset: number, endOffset: number },
  fresh: { start: number, end: number, count: number },
  total: number,
  max: number,
): { side: -1 | 1, extension: number } | null {
  let side = Math.sign(scrollOffsetDelta);

  if (side === 0) {
    if (previous.startOffset > 1) {
      side = -1;
    } else if (previous.endOffset > 1) {
      side = 1;
    } else {
      return null;
    }
  }

  const overscan = Math.min(Math.ceil(fresh.count / 2), max);
  const extension = side > 0 ? Math.min(overscan, (total - 1) - fresh.end) : Math.min(overscan, fresh.start);

  if (extension <= 0) {
    return null;
  }

  return { side: side as -1 | 1, extension };
}

/**
 * Computes how many tracks to extend a freshly computed render band by so it keeps the previous
 * band's size across a scroll-driven draw — the overscan that stops the rendered node count from
 * oscillating (a structural DOM add/remove that would trigger the host page's `:has()` style
 * invalidation). Returns `0` when the band already covers the previous size, or when the dataset
 * edge leaves no track to extend into. Axis-agnostic: the caller applies the result to its own
 * end-index and count fields. Shared by the row and column stabilizers so the clamp arithmetic
 * (notably the `(total - 1) - end` upper bound) lives in exactly one place — a divergent edit to it
 * on one axis would silently reintroduce per-scroll structural mutations on that axis only.
 *
 * @param {number} renderedEnd The last index of the freshly computed band (`endRow` / `endColumn`).
 * @param {number} renderedCount The freshly computed band size.
 * @param {number} previousCount The size of the band rendered on the previous draw.
 * @param {number} total The axis total (`totalRows` / `totalColumns`).
 * @returns {number} The number of tracks to extend by (never negative).
 */
function bandStabilizationExtension(
  renderedEnd: number,
  renderedCount: number,
  previousCount: number,
  total: number,
): number {
  const missing = previousCount - renderedCount;

  if (missing <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(missing, (total - 1) - renderedEnd));
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
   * @param {object} [options] The per-draw options.
   * @param {boolean} [options.stationaryBands=false] When `true` (a scroll-driven draw on the
   * stationary-band path), the new rendered row and column bands keep the previous bands' sizes —
   * see {@link CalculatorFactory#stabilizeRenderedRowsBand}. Both axes are stabilized on ANY
   * scroll-driven draw (not per scrolled axis): a draw for one axis recomputes the other axis'
   * band too, so per-axis gating would let each axis shrink the other's band back and re-oscillate.
   * @returns {boolean} The fastDraw value, possibly modified.
   */
  createCalculators(
    this: Viewport,
    fastDraw = false,
    { stationaryBands = false }: { stationaryBands?: boolean } = {}
  ): boolean {
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
      const renderedRows = rowsRenderCalculator.getResultsFor('rendered') ?? null;
      const renderedColumns = columnsRenderCalculator.getResultsFor('rendered') ?? null;

      if (stationaryBands) {
        // Overscan must run BEFORE the stabilizers: the stabilizer tops the band up to the previous
        // band's size at its end side, so overscan applied after it would double-pad the band on
        // every scroll-direction flip.
        this.applyRenderedColumnsBandOverscan(renderedColumns);
        this.applyRenderedRowsBandOverscan(renderedRows);
        this.stabilizeRenderedRowsBand(renderedRows);
        this.stabilizeRenderedColumnsBand(renderedColumns);
      }

      this.rowsRenderCalculator = renderedRows;
      this.columnsRenderCalculator = renderedColumns;
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
   * Decides whether the rendered row/column bands may be kept stationary on a scroll-driven draw
   * (each band keeps its previous size so the `OrderView`s never add or remove TR/TD/TH/COL nodes —
   * see {@link CalculatorFactory#stabilizeRenderedRowsBand}). This is a looser gate than the
   * single-pass layout gate: it drops the uniform-size requirements (an extra rendered row/column
   * past the viewport edge is harmless whatever its size), but keeps the two conditions with a
   * different scroll/offset model — `singlePassLayout` off (which `mergeCells` forces, and merged
   * cells recompute their spans per viewport) and window scrolling. Anything else takes the natural
   * bands unchanged.
   *
   * @this Viewport
   * @returns {boolean}
   */
  allowsStationaryBands(this: Viewport): boolean {
    return this.wtSettings.getSetting<boolean>('singlePassLayout') &&
      !this.isVerticallyScrollableByWindow() &&
      !this.isHorizontallyScrollableByWindow();
  },

  /**
   * Extends the freshly computed rendered column band by up to {@link COLUMN_BAND_OVERSCAN_MAX}
   * columns of overscan on the side the user is scrolling toward, so the next several band
   * crossings land inside the already-rendered band and resolve as fast draws (no cell render, no
   * post-render measurements) instead of full band re-renders. This is the engine half of the
   * `viewportColumnRenderingOffset: 'auto'` behavior: the static resolution (1 column, applied
   * symmetrically by the `viewportColumnCalculatorOverride` override) stays as-is for non-scroll
   * draws, and scroll-driven draws add the directional overscan on top. An explicit numeric
   * offset (2 or more) is an exact user choice, so the overscan detects it through the recorded
   * override offsets and leaves such bands untouched.
   *
   * The scroll direction comes from the sign of the zero-based scroll-offset delta between this
   * draw and the previous full draw (both captured on the rendered results). Logical column
   * indexes and absolute offsets both grow toward the inline end, so the same arithmetic is
   * correct in LTR and RTL. A zero delta (a vertical-scroll-driven draw recomputing the column
   * axis) keeps the overscan on the side that carried it on the previous draw, so the band stays
   * identical instead of rotating.
   *
   * The band mutation keeps every derived field consistent: `startPosition` is recomputed from
   * the width prefix-sum cache when the band grows at the start, and
   * `columnStartOffset`/`columnEndOffset` grow with the applied overscan so the
   * `viewportColumnRenderingThreshold` containment padding (see
   * {@link CalculatorFactory#areAllProposedVisibleColumnsAlreadyRendered}) caps against the real
   * overscan on each side.
   *
   * Runs only on scroll-driven draws on the stationary-band path (the caller gates on
   * `stationaryBands`) and only under uniform column widths — with measured or varying widths
   * (for example `autoColumnSize`) the pixel cost of the overscan is unpredictable, so those
   * grids keep the previous behavior. Near a dataset edge the extension clamps to the remaining
   * columns; the band stabilizer that runs next keeps the band size stable where possible.
   *
   * @this Viewport
   * @param {ColumnsCalculationType | null} renderedColumns The freshly computed rendered-columns
   * result, mutated in place. The previous band is read off `this.columnsRenderCalculator` (not
   * yet overwritten at the call site).
   */
  applyRenderedColumnsBandOverscan(this: Viewport, renderedColumns: ColumnsCalculationType | null): void {
    const previousBand = this.columnsRenderCalculator;

    if (
      !(renderedColumns instanceof RenderedColumnsCalculationType) ||
      !(previousBand instanceof RenderedColumnsCalculationType) ||
      renderedColumns.startColumn === null || renderedColumns.endColumn === null ||
      // An explicit `viewportColumnRenderingOffset` number is an exact manual offset — only the
      // 'auto' mode carries the dynamic overscan. The recorded-offsets check backs the flag up
      // for custom `viewportColumnCalculatorOverride` functions that pad wider than 'auto' (1).
      !this.wtSettings.getSetting<boolean>('viewportColumnRenderingOffsetIsAuto') ||
      renderedColumns.columnStartOffset > 1 || renderedColumns.columnEndOffset > 1 ||
      !this.wtSettings.getSetting<boolean>('columnWidthsUniform')
    ) {
      return;
    }

    const plan = directionalBandOverscan(
      renderedColumns.scrollOffset - previousBand.scrollOffset,
      { startOffset: previousBand.columnStartOffset, endOffset: previousBand.columnEndOffset },
      { start: renderedColumns.startColumn, end: renderedColumns.endColumn, count: renderedColumns.count },
      this.wtSettings.getSetting<number>('totalColumns'),
      COLUMN_BAND_OVERSCAN_MAX,
    );

    if (!plan) {
      return;
    }

    if (plan.side > 0) {
      renderedColumns.endColumn += plan.extension;
      renderedColumns.count += plan.extension;
      renderedColumns.columnEndOffset += plan.extension;
    } else {
      renderedColumns.startColumn -= plan.extension;
      renderedColumns.count += plan.extension;
      renderedColumns.columnStartOffset += plan.extension;
      renderedColumns.startPosition = this.columnWidthCache.getOffset(renderedColumns.startColumn);
    }
  },

  /**
   * Row-axis twin of {@link CalculatorFactory#applyRenderedColumnsBandOverscan}: extends the freshly
   * computed rendered row band by up to {@link ROW_BAND_OVERSCAN_MAX} rows of overscan on the side
   * the user is scrolling toward, so consecutive vertical scroll steps land inside the rendered
   * band and resolve as fast draws. The direction rules, the preserve-vs-invent zero-delta logic,
   * and the clamps live in the shared {@link directionalBandOverscan} helper. Gated to uniform row
   * heights for the same reason the column overscan is gated to uniform widths: with measured or
   * varying heights the pixel cost of the overscan is unpredictable. `startPosition` is recomputed
   * from the height prefix-sum cache when the band grows upward, and `rowStartOffset`/`rowEndOffset`
   * grow with the applied overscan so the `viewportRowRenderingThreshold` containment padding caps
   * against the real overscan.
   *
   * @this Viewport
   * @param {RowsCalculationType | null} renderedRows The freshly computed rendered-rows result,
   * mutated in place. The previous band is read off `this.rowsRenderCalculator` (not yet
   * overwritten at the call site).
   */
  applyRenderedRowsBandOverscan(this: Viewport, renderedRows: RowsCalculationType | null): void {
    const previousBand = this.rowsRenderCalculator;

    if (
      !(renderedRows instanceof RenderedRowsCalculationType) ||
      !(previousBand instanceof RenderedRowsCalculationType) ||
      renderedRows.startRow === null || renderedRows.endRow === null ||
      // An explicit `viewportRowRenderingOffset` number is an exact manual offset — only the
      // 'auto' mode carries the dynamic overscan. The recorded-offsets check backs the flag up
      // for custom `viewportRowCalculatorOverride` functions that pad wider than 'auto' (1).
      !this.wtSettings.getSetting<boolean>('viewportRowRenderingOffsetIsAuto') ||
      renderedRows.rowStartOffset > 1 || renderedRows.rowEndOffset > 1 ||
      !this.wtSettings.getSetting<boolean>('rowHeightsUniform')
    ) {
      return;
    }

    const plan = directionalBandOverscan(
      renderedRows.scrollOffset - previousBand.scrollOffset,
      { startOffset: previousBand.rowStartOffset, endOffset: previousBand.rowEndOffset },
      { start: renderedRows.startRow, end: renderedRows.endRow, count: renderedRows.count },
      this.wtSettings.getSetting<number>('totalRows'),
      ROW_BAND_OVERSCAN_MAX,
    );

    if (!plan) {
      return;
    }

    if (plan.side > 0) {
      renderedRows.endRow += plan.extension;
      renderedRows.count += plan.extension;
      renderedRows.rowEndOffset += plan.extension;
    } else {
      renderedRows.startRow -= plan.extension;
      renderedRows.count += plan.extension;
      renderedRows.rowStartOffset += plan.extension;
      renderedRows.startPosition = this.rowHeightCache.getOffset(renderedRows.startRow);
    }
  },

  /**
   * Extends the CURRENT rendered row band (`this.rowsRenderCalculator`) so that it covers at least
   * the `[startRow, endRow]` range. The band never shrinks here: an edge that already lies outside
   * the range stays where it is, which makes the resulting band the union of the two.
   *
   * The refill loop in `table/drawCycle.ts` (`refillRenderedRowsBandIfShrunk`, issue #6452, DEV-406)
   * is the reason this exists. That loop proposes a fresh band from the heights the last render
   * measured and assigns it with `createCalculators(false)`, and it takes a pass only when the
   * proposal grows the BOTTOM edge. A proposal built from re-measured heights can still move the
   * START edge inwards while `endRow` grows, and applying it wholesale would drop rows the DOM
   * already shows. The refill calls this right after the recompute with the previous band's edges, so
   * every row the DOM already showed stays inside the band; a row the fresh proposal dropped remains
   * rendered as plain overscan.
   *
   * This does not make an earlier proposed `startRow` a reason to refill: that trigger belongs to the
   * caller, and an earlier `startRow` alone is not one. It is the virtualized merged-cell signature —
   * per-band `modifyRowHeightByOverlayName` heights plus rowspan-inflated `oversizedRows` records make
   * every scroll draw of such a grid propose a band that starts one row earlier and ends far short of
   * the rendered one, and refilling from that proposal is what broke
   * `src/plugins/mergeCells/__tests__/selection.spec.js`.
   *
   * The mutation mirrors {@link CalculatorFactory#applyRenderedRowsBandOverscan} field for field, so
   * `count`, `rowStartOffset`, `rowEndOffset`, and `startPosition` stay consistent with the moved
   * edges. It is a no-op for a band that renders all rows (`RenderedAllRowsCalculationType`), which
   * has no edge to move.
   *
   * @this Viewport
   * @param {number} startRow The first row the band must cover. Ignored when negative, which is what
   * the range queries answer before the first render.
   * @param {number} endRow The last row the band must cover. Clamped to the last row of the dataset.
   */
  extendRenderedRowsBandTo(this: Viewport, startRow: number, endRow: number): void {
    const band = this.rowsRenderCalculator;

    if (!(band instanceof RenderedRowsCalculationType) || band.startRow === null || band.endRow === null) {
      return;
    }

    if (startRow >= 0 && startRow < band.startRow) {
      const extension = band.startRow - startRow;

      band.startRow -= extension;
      band.count += extension;
      band.rowStartOffset += extension;
      band.startPosition = this.rowHeightCache.getOffset(band.startRow);
    }

    const lastRow = this.wtSettings.getSetting<number>('totalRows') - 1;
    const clampedEndRow = Math.min(endRow, lastRow);

    if (clampedEndRow > band.endRow) {
      const extension = clampedEndRow - band.endRow;

      band.endRow += extension;
      band.count += extension;
      band.rowEndOffset += extension;
    }
  },

  /**
   * Keeps the rendered row band's size stable across a scroll-driven draw by extending the freshly
   * computed band DOWNWARD (past the viewport's bottom edge) to the previous band's size. The natural
   * band size oscillates by one row as the scroll position aligns with the row grid; without this,
   * every other band shift adds/removes a TR, and a structural DOM mutation triggers the host page's
   * `:has()` style invalidation — a style recalculation whose cost scales with the whole host
   * document, paid on every scroll. The extra row is a plain overscan row: it is rendered from real
   * data below the viewport and clipped by the holder. Near the dataset's end, where no rows remain
   * to extend into, the band shrinks naturally (a one-time mutation at the edge, not one per shift).
   *
   * @this Viewport
   * @param {RowsCalculationType | null} renderedRows The freshly computed rendered-rows result,
   * mutated in place. The previous band is read off `this.rowsRenderCalculator` (not yet
   * overwritten at the call site).
   */
  stabilizeRenderedRowsBand(this: Viewport, renderedRows: RowsCalculationType | null): void {
    const previousBand = this.rowsRenderCalculator;

    if (!renderedRows || !previousBand || renderedRows.endRow === null) {
      return;
    }

    const extension = bandStabilizationExtension(
      renderedRows.endRow,
      renderedRows.count,
      previousBand.count,
      this.wtSettings.getSetting<number>('totalRows'),
    );

    renderedRows.endRow += extension;
    renderedRows.count += extension;
  },

  /**
   * Column-axis mirror of {@link CalculatorFactory#stabilizeRenderedRowsBand}: keeps the rendered
   * column band's size stable across a scroll-driven draw by extending the freshly computed band
   * toward the inline end (past the viewport's edge) to the previous band's size. Without it, every
   * other column-band shift adds/removes a TD per body row, a TH per header row, and a COL — dozens
   * of structural DOM mutations per crossing, each triggering the host page's `:has()` style
   * invalidation. The extra column is plain overscan: real data, clipped by the holder. The
   * extension works on logical indexes, so it is direction-agnostic (RTL-safe).
   *
   * @this Viewport
   * @param {ColumnsCalculationType | null} renderedColumns The freshly computed rendered-columns
   * result, mutated in place. The previous band is read off `this.columnsRenderCalculator` (not yet
   * overwritten at the call site).
   */
  stabilizeRenderedColumnsBand(this: Viewport, renderedColumns: ColumnsCalculationType | null): void {
    const previousBand = this.columnsRenderCalculator;

    if (!renderedColumns || !previousBand || renderedColumns.endColumn === null) {
      return;
    }

    const extension = bandStabilizationExtension(
      renderedColumns.endColumn,
      renderedColumns.count,
      previousBand.count,
      this.wtSettings.getSetting<number>('totalColumns'),
    );

    renderedColumns.endColumn += extension;
    renderedColumns.count += extension;
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
