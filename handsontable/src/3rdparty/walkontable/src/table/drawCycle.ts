import ColumnFilter from '../filter/column';
import RowFilter from '../filter/row';
import {
  CLONE_BOTTOM,
  CLONE_BOTTOM_INLINE_START_CORNER,
} from '../overlay';
import {
  adjustColumnHeaderHeights,
  markOversizedRows,
  resetOversizedRows,
  resetFrozenOversizedRows,
  shouldSyncOversizedRowsWithFrozenOverlays,
  syncOversizedColumnHeadersWithFrozenOverlays,
  syncOversizedRowsWithFrozenOverlays,
} from '../axisSizing/oversizedRows';
import type Table from './baseTable';
import type { default as Overlays } from '../overlay/overlays';
import type Viewport from '../viewport/viewport';
import type { ViewportBand } from '../viewport/calculatorFactory';
import type { ColumnsCalculationType, RowsCalculationType } from '../calculator/viewportBase';

/**
 * The state that describes what is actually rendered in the TBODY/THEAD right now: the rendered
 * row/column bands (held by the viewport), the render filters derived from them, and the
 * `correctHeaderWidth` flag that describes the row-header width the DOM was rendered with. Captured
 * before the draw resolves the new band, so the master's `skipRender` gate can put it back — see
 * {@link restoreRenderedStateIfSafe}.
 */
interface RenderedState {
  rowsRenderCalculator: RowsCalculationType | null;
  columnsRenderCalculator: ColumnsCalculationType | null;
  rowFilter: RowFilter | null;
  columnFilter: ColumnFilter | null;
  correctHeaderWidth: boolean;
}

/**
 * Per-draw mutable scratch shared by the phase functions of a single draw. It also captures the
 * settings that must be read at their PRE-hook timing: `rowHeaders`/`columnHeaders` are read here,
 * before the `beforeDraw` hook fires, and the cell render below must use these captured values —
 * reading them fresh after the hook would pick up a hook mutation and change the rendered output.
 */
interface DrawContext {
  /** Starts at the `fastDraw` argument; only the master begin-layout phase can downgrade it. */
  runFastDraw: boolean;
  /** Default `true`; only the master `beforeDraw`/`skipRender` gate writes `false`. */
  performRedraw: boolean;
  /** Default `false`; only the master fixed-position pass writes `true`. */
  positionChanged: boolean;
  /**
   * Whether this draw runs the frozen-column row sync. Decided once, before the master renders, and
   * read again when the frozen records are cleared and measured, so the two can never disagree.
   */
  syncFrozenRows: boolean;
  rowHeaders: Function[];
  columnHeaders: Function[];
  rowHeadersCount: number;
  columnHeadersCount: number;
}

/**
 * Runs one draw of a Walkontable table. Dispatches to the master or the overlay-clone cycle by
 * instance role. Both cycles are free functions over the table's public surface + `get deps()`
 * (never `#deps`), exactly like the `cellAccess`/`domScaffold` mixins — so the draw orchestration
 * lives outside the `Table` class while the measurement/query methods it calls stay on it.
 *
 * Behavior is byte-identical to the previous single `Table.draw()`: the master cycle keeps every
 * step in its original order, and the clone cycle is the strict subset a clone executed (a clone
 * never has a begin-layout phase, never fires the view hooks, and never runs the fixed-position
 * pass, so `positionChanged` stays `false` and it always renders selections through the else-path).
 *
 * @param {Table} table The table instance (master or an overlay clone).
 * @param {boolean} fastDraw If `true`, try to only reposition rather than re-render cells.
 */
export function runDrawCycle(table: Table, fastDraw: boolean): void {
  const { wtSettings } = table;
  const rowHeaders = wtSettings.getSetting<Function[]>('rowHeaders');
  const columnHeaders = wtSettings.getSetting<Function[]>('columnHeaders');
  const ctx: DrawContext = {
    runFastDraw: fastDraw,
    performRedraw: true,
    positionChanged: false,
    syncFrozenRows: false,
    rowHeaders,
    columnHeaders,
    rowHeadersCount: rowHeaders.length,
    columnHeadersCount: columnHeaders.length,
  };

  if (table.isMaster) {
    runMasterDrawCycle(table, ctx);
  } else {
    runCloneDrawCycle(table, ctx);
  }
}

/**
 * The master table's draw cycle: resolve the layout, decide fast vs full, (optionally) render the
 * cells, place the overlays, then reconcile a 1px border shift or render the active selections.
 *
 * @param {Table} table The master table.
 * @param {DrawContext} ctx The per-draw scratch.
 */
function runMasterDrawCycle(table: Table, ctx: DrawContext): void {
  const { wtSettings } = table;
  const wtOverlays = table.deps.getWtOverlays();
  const wtViewport = table.deps.getWtViewport();
  // What is on the screen before this draw touches anything. Restored (when safe — see
  // `restoreRenderedStateIfSafe`) if the `beforeDraw` hook cancels the cell render below.
  const renderedStateBeforeDraw = captureRenderedState(table, wtViewport);

  // Record whether this master draw was entered as a fast/scroll draw, BEFORE `createCalculators`
  // below can downgrade `ctx.runFastDraw`. A `forceFullRender` (`hot.render()`) enters as `draw(false)`,
  // so this is `false` for it even if the scroll-direction flags are still set (an `afterScroll` hook
  // can trigger a render while they are). The clones read this off the master through their clone
  // source, so the header-render skip decision stays consistent across the master and its overlays.
  wtOverlays.isScrollDrivenDraw = ctx.runFastDraw;

  wtOverlays.beforeDraw();
  table.holderOffset = table.deps.geometryReader.offset(table.holder);

  wtViewport.rowHeightCache.ensureBuilt();
  wtViewport.columnWidthCache.ensureBuilt();

  // On the single-pass gated path, decide and apply the header-border classes
  // (`innerBorderTop` / `innerBorderInlineStart`) BEFORE resolving the snapshot and rendering the
  // cells, from the pre-render scroll position + settings. Cells then render in their final
  // position, so the post-render `resetFixedPosition` toggle is a no-op (`positionChanged` stays
  // `false`) and the nested `wot.draw(true)` re-render never fires. Element mode only (guaranteed
  // by the gate); the border box is thus present when `beginDrawLayout` measures the workspace,
  // matching a steady-state scrolled draw.
  if (wtViewport.usesLayoutSnapshotForCalculators()) {
    wtOverlays.prepareHeaderBorders();
  }

  // Resolve the single-pass layout snapshot for this draw (scrollbar prediction from numbers).
  // Not yet the source of truth for the calculators below — see Viewport#beginDrawLayout.
  wtViewport.beginDrawLayout();

  // On a scroll-driven draw both rendered bands (rows AND columns) keep their previous size
  // (extending the new band past the viewport edge when the natural count is smaller). Stable band
  // sizes mean the `OrderView`s never add or remove TR/TD/TH/COL nodes while scrolling — a
  // structural DOM mutation would trigger the host page's `:has()` style invalidation, whose cost
  // scales with the whole host document. Both axes stabilize on ANY scroll-driven draw: a draw for
  // one axis recomputes the other axis' band too, so per-axis gating would let each axis shrink the
  // other's band back and re-oscillate it. On top of that, both bands gain directional overscan
  // (`applyRenderedColumnsBandOverscan` / `applyRenderedRowsBandOverscan`) so consecutive scroll
  // steps land inside the rendered band and resolve as fast draws.
  ctx.runFastDraw = wtViewport.createCalculators(ctx.runFastDraw, {
    stationaryBands: wtOverlays.isScrollDrivenDraw && wtViewport.allowsStationaryBands(),
  });

  if (ctx.rowHeadersCount && !wtSettings.getSetting('fixedColumnsStart')) {
    const leftScrollPos = wtOverlays.inlineStartOverlay.getScrollPosition();
    const previousState = table.correctHeaderWidth;

    table.correctHeaderWidth = leftScrollPos !== 0;

    if (previousState !== table.correctHeaderWidth) {
      ctx.runFastDraw = false;
    }
  }

  if (ctx.runFastDraw) {
    wtOverlays.refresh(true);
    // Fast (scroll) draws skip the full-render header-height pass below, so the master/top
    // header heights can drift against the frozen overlays during scrolling (a tall wrapped
    // frozen header that the master never renders). Re-sync here. The method is a cheap no-op
    // unless the grid has frozen columns with column headers, so non-frozen grids are unaffected.
    // No row-height twin of the call above is needed here: a fast draw re-renders neither the master
    // nor the clones, so no cell content — and therefore no row height — can have changed.
    syncOversizedColumnHeadersWithFrozenOverlays(table);
  } else {
    table.tableOffset = table.deps.geometryReader.offset(table.TABLE);

    const filters = buildRenderFilters(table, ctx);

    // Decided before the master renders, because `resetOversizedRows` (inside `renderCellBand`) has
    // to know whether the frozen-derived records are still being maintained. When they are not — the
    // master's band starts at column 0, so it renders every frozen column itself — they go back to
    // the ordinary machinery, which wipes and re-measures them like any other oversized row.
    ctx.syncFrozenRows = shouldSyncOversizedRowsWithFrozenOverlays(table);

    if (!ctx.syncFrozenRows) {
      wtViewport.releaseFrozenOversizedRows();
    }

    table.alignOverlaysWithTrimmingContainer(); // todo It calls method from child class (MasterTable).
    const skipRender: { skipRender?: boolean } = {};
    // Read the counter as late as possible — right before the hook fires — so the guard in
    // `restoreRenderedStateIfSafe` asks exactly "did the HOOK render?", and a hypothetical engine-
    // internal render earlier in this draw cannot silently disable a rollback that is still safe.
    const renderCycleSeqBeforeHook = wtViewport.renderCycleSeq;

    wtSettings.getSetting('beforeDraw', true, skipRender);
    ctx.performRedraw = skipRender.skipRender !== true;

    if (!ctx.performRedraw) {
      // The cells are not rendered on this draw, so the rendered bands and the filters resolved above
      // describe a band that never reached the DOM. Everything that resolves an element from a source
      // index (`Table#getCell` and, through it, the selection render below) gates on the bands but
      // reads the element through the filters and the TBODY, so leaving them advanced makes those two
      // disagree: `getCell` then throws "TR was expected to be rendered but is not" for every row past
      // the end of the stale DOM. Put the pre-draw state back when doing so is provably safe — the
      // guard conditions and the deliberate fallbacks are documented on the helper.
      restoreRenderedStateIfSafe(table, wtViewport, renderedStateBeforeDraw, renderCycleSeqBeforeHook);
    } else {
      const columnHeadersRenderSkippable = isPureVerticalScrollDraw(wtOverlays);
      const rowHeightsChanged = renderCellBand(table, ctx, filters, columnHeadersRenderSkippable);
      const hasExternalRowCalculator = wtSettings.getSetting<boolean>('externalRowCalculator');

      // `rowHeightsChanged` alone gates the refill: `markOversizedRows` returns `false` before
      // measuring anything when `externalRowCalculator` is on, so the flag already carries that
      // condition.
      if (rowHeightsChanged) {
        refillRenderedRowsBandIfShrunk(table, ctx, columnHeadersRenderSkippable);
      }

      if (!hasExternalRowCalculator) {
        // Single-pass: the fully/partially-visible calculators were already computed in pass 1
        // (`createCalculators`) from the layout snapshot. On the snapshot path, the only thing that
        // can change them post-render is `markOversizedRows` invalidating the row-height cache when
        // rendered content is genuinely taller than its configured size. If both size caches are
        // still current, the post-render values are identical, so this second pass is a redundant
        // recompute — skip it. (Read `isCurrent()` before `ensureBuilt()` rebuilds an invalidated
        // cache. Validated non-destructively across the full e2e: this predicate would skip 595
        // draws with byte-identical ranges and 0 divergences.) The legacy measured path, and any
        // draw with an oversized row, still recompute here.
        //
        // The hazard the `!rowHeightsChanged` clause closes: nothing between `renderCellBand` and
        // this line may call `rowHeightCache.ensureBuilt()` without also feeding this predicate. An
        // `ensureBuilt()` rebuilds an invalidated cache, so `isCurrent()` answers `true` again and
        // the recompute this draw needs is skipped. `refillRenderedRowsBandIfShrunk` above does
        // exactly that — it builds both caches on every pass, including a pass that then declines
        // to grow the band (the ordinary case: a row GREW, `renderAllRows`, a band already large
        // enough). Asking `rowHeightsChanged` instead of the cache restores what `isCurrent()`
        // reported at this point before the refill existed: `markOversizedRows` reporting a change
        // is precisely what invalidated the row-height cache.
        const skipSecondPass = wtViewport.usesLayoutSnapshotForCalculators() &&
          !rowHeightsChanged &&
          wtViewport.rowHeightCache.isCurrent() && wtViewport.columnWidthCache.isCurrent();

        wtViewport.rowHeightCache.ensureBuilt();
        wtViewport.columnWidthCache.ensureBuilt();

        if (!skipSecondPass) {
          wtViewport.createVisibleCalculators();
        }
      }

      // The seam: the master has rendered and both size caches and the viewport calculators were
      // built from the frozen-derived heights, so clearing them now costs nothing — and it makes the
      // frozen overlays below render at their natural content height, which is what keeps them
      // re-measurable instead of ratcheting on their own cached value.
      const wipedFrozenRows = ctx.syncFrozenRows ? resetFrozenOversizedRows(table) : undefined;

      wtOverlays.refresh(false);
      syncOversizedColumnHeadersWithFrozenOverlays(table);
      // The frozen overlays have now rendered, so a row whose tallest cell lives in a frozen column
      // (which the master's rendered band skips) can finally be measured. Runs after the header sync
      // so a taller frozen header is already reflected in the THEAD when the body rows are re-sized.
      const frozenRowHeightsChanged = syncOversizedRowsWithFrozenOverlays(table, wipedFrozenRows);

      if (frozenRowHeightsChanged && !wtSettings.getSetting('externalRowCalculator')) {
        // The calculators above were built from row heights this sync has since changed, and a
        // frozen-derived height cannot be known any earlier — the frozen overlays had not rendered.
        // An ordinary oversized row never reaches here: the master measures it inside
        // `renderCellBand`, and a shrink that leaves the band too short is refilled right after it
        // (`refillRenderedRowsBandIfShrunk`). Left alone, the frame reports a visible row range
        // measured against the old heights, which self-corrects on the next draw and so reads as
        // an intermittent off-by-a-row to anything asking during this one.
        // Both caches, as at the sibling call above: `createVisibleCalculators` builds the COLUMN
        // visible calculators too, and an unbuilt strategy answers every offset with 0.
        wtViewport.rowHeightCache.ensureBuilt();
        wtViewport.columnWidthCache.ensureBuilt();
        wtViewport.createVisibleCalculators();
      }

      wtOverlays.applyToDOM();

      wtSettings.getSetting('onDraw', true);
    }
  }

  placeFixedOverlays(table, ctx);

  if (ctx.positionChanged) {
    if (ctx.performRedraw) {
      // It refreshes the cells borders caused by a 1px shift (introduced by overlays which add or
      // remove `innerBorderTop` and `innerBorderInlineStart` CSS classes to the DOM element. This happens
      // when there is a switch between rendering from 0 to N rows/columns and vice versa).
      wtOverlays.refreshAll(); // `refreshAll()` internally already calls `refreshSelections()` method
    } else {
      // A skipped render must not run the nested reconciliation draw above (`refreshAll` is
      // `wot.draw(true)`): the rolled-back band would fail its fast-draw check and escalate it to a
      // full render that fires `beforeDraw` a second time and renders the cells the hook just
      // cancelled. But the `innerBorder*` toggle has already shifted the layout by 1px AFTER the
      // overlay positions were computed, so rerun the fixed-position pass against the post-toggle
      // layout — it converges, because the second border-state check finds the class already in
      // place — and render the selections that `refreshAll` would have refreshed.
      placeFixedOverlays(table, ctx);
      renderActiveSelections(table, ctx.runFastDraw);
    }

    // Outside the render gate on purpose: the master hider/spreader size is written ONLY here on the
    // 1px-shift path (the per-overlay `adjustElementsSize()` calls inside `placeFixedOverlays` size
    // the clone roots, not the master hider), and the bands it reads are current whether or not the
    // cell render ran — a skipped draw would otherwise keep a stale scrollbar until an unrelated
    // full draw.
    wtOverlays.adjustElementsSize();
  } else {
    renderActiveSelections(table, ctx.runFastDraw);
  }

  wtOverlays.afterDraw(!ctx.runFastDraw && ctx.performRedraw);

  table.deps.setDrawn(true);
}

/**
 * The overlay-clone draw cycle. A clone is a separate Walkontable instance whose `draw()` is driven
 * from the master's `wtOverlays.refresh(fastDraw)`. It has no begin-layout phase (so it cannot
 * downgrade `runFastDraw` — it takes the master-resolved value), fires no view hooks, and runs no
 * fixed-position pass, so it always renders selections through the normal path.
 *
 * @param {Table} table The overlay-clone table.
 * @param {DrawContext} ctx The per-draw scratch.
 */
function runCloneDrawCycle(table: Table, ctx: DrawContext): void {
  if (!ctx.runFastDraw) {
    table.tableOffset = table.deps.getParentTableOffset();

    const filters = buildRenderFilters(table, ctx);

    // A clone's render is never gated by `skipRender` (that gate is master-only), so it always runs.
    // The scroll-direction flags live on the master's overlays, reached via the clone source.
    const cloneSourceOverlays = table.deps.getCloneSource().wtOverlays;

    renderCellBand(
      table,
      ctx,
      filters,
      isPureVerticalScrollDraw(cloneSourceOverlays),
    );

    if (table.is(CLONE_BOTTOM)) {
      table.deps.getCloneSource().wtOverlays.adjustElementsSize();
    }
  }

  renderActiveSelections(table, ctx.runFastDraw);

  table.deps.setDrawn(true);
}

/**
 * Rebuilds the row/column render filters from the current first-rendered row/column. Shared by both
 * cycles and called BEFORE the master `beforeDraw` gate, because the hook (and
 * `alignOverlaysWithTrimmingContainer` before it) may read the filters for the band about to render.
 * The filters and the rendered bands are the pair that `Table#getCell` resolves an element with, so
 * when that gate cancels the render the master puts BOTH back to their pre-draw values — see
 * {@link restoreRenderedStateIfSafe}.
 *
 * @param {Table} table The table (master or clone).
 * @param {DrawContext} ctx The per-draw scratch (supplies the pre-hook header counts).
 */
function buildRenderFilters(table: Table, ctx: DrawContext): { rowFilter: RowFilter; columnFilter: ColumnFilter } {
  const startRow = Math.max(table.getFirstRenderedRow(), 0);
  const startColumn = Math.max(table.getFirstRenderedColumn(), 0);
  const rowFilter =
    new RowFilter(startRow, table.wtSettings.getSetting<number>('totalRows'), ctx.columnHeadersCount);
  const columnFilter =
    new ColumnFilter(startColumn, table.wtSettings.getSetting<number>('totalColumns'), ctx.rowHeadersCount);

  table.rowFilter = rowFilter;
  table.columnFilter = columnFilter;

  return { rowFilter, columnFilter };
}

/**
 * Captures the rendered row/column bands, the render filters, and the `correctHeaderWidth` flag,
 * i.e. everything that describes which source rows and columns the current DOM holds and how it was
 * rendered. Master-only: the `skipRender` gate it serves is master-only.
 *
 * @param {Table} table The master table.
 * @param {Viewport} wtViewport The viewport that owns the rendered bands.
 * @returns {RenderedState}
 */
function captureRenderedState(table: Table, wtViewport: Viewport): RenderedState {
  return {
    rowsRenderCalculator: wtViewport.rowsRenderCalculator,
    columnsRenderCalculator: wtViewport.columnsRenderCalculator,
    rowFilter: table.rowFilter,
    columnFilter: table.columnFilter,
    correctHeaderWidth: table.correctHeaderWidth,
  };
}

/**
 * Puts the pre-draw rendered state back, undoing the band and filter advance of a draw whose render
 * the `beforeDraw` hook cancelled — but only when the rollback is provably safe. When any guard
 * fails, the this-draw state is kept, which is exactly the pre-rollback behavior of the engine, so
 * a blocked rollback is never worse than what shipped before the rollback existed.
 *
 * The guards:
 * - The viewport's render-cycle counter must not have moved since it was read right before the
 *   `beforeDraw` hook fired. A hook that renders (a nested master `draw()`, or a draw of any overlay
 *   clone — the clones share this viewport) has put a NEWER band into the DOM; rolling the shared
 *   band back under it would create the very band/DOM divergence this rollback exists to prevent.
 * - Per axis, the captured filter's build-time total must still match the current
 *   `totalRows`/`totalColumns`. When the dataset shrank before the skipped draw (NestedRows cancels
 *   the render right after its row removal), the captured band names rows that no longer exist — the
 *   this-draw band, capped at the new totals, is the correct description. Each axis decides
 *   independently, so a column-count change never blocks the row rollback (and vice versa); the
 *   axes never disagree inside `getCell`, which gates and resolves each axis on its own pair.
 *   (A dataset that GREW before a skipped draw keeps the this-draw band too; that band can then
 *   overhang the stale DOM — a pre-existing edge of the skip contract, unchanged here.)
 *
 * The restore itself is asymmetric by design:
 * - The render calculators are restored — `null` on a skipped first draw correctly reports
 *   "nothing rendered", so `Table#getCell` answers with its out-of-viewport exit codes (and the
 *   overlays' `applyToDOM` treats a `null` calculator as the nothing-rendered spreader offset).
 * - The filters are restored only when the captured ones are non-null; on a skipped first draw the
 *   just-built filters are kept instead, because filter consumers (`getRowHeader`, `getTrForRow`,
 *   the selection scanner's header loop) read `rowFilter!` unguarded and must never see `null`
 *   after a completed draw.
 * - `correctHeaderWidth` is restored whenever no render happened, regardless of the totals gates:
 *   the flag describes the row-header width the DOM was rendered with, and that DOM did not change.
 *   Leaving it advanced would make the next draw see "no change" and never re-render the corrected
 *   header width.
 * - The visible-row/column calculators are deliberately NOT restored: they describe what the user
 *   can see (scroll position), not what the DOM holds. After a skipped draw the visible band may
 *   therefore extend past the rendered band — unlike a fast draw, which guarantees the visible band
 *   sits inside the rendered one — and `getCell` answers those rows with exit codes.
 *
 * @param {Table} table The master table.
 * @param {Viewport} wtViewport The viewport that owns the rendered bands.
 * @param {RenderedState} state The state captured before the draw.
 * @param {number} renderCycleSeqBeforeHook The render-cycle counter read right before the
 *   `beforeDraw` hook fired.
 */
function restoreRenderedStateIfSafe(
  table: Table,
  wtViewport: Viewport,
  state: RenderedState,
  renderCycleSeqBeforeHook: number,
): void {
  const { wtSettings } = table;

  if (wtViewport.renderCycleSeq !== renderCycleSeqBeforeHook) {
    return;
  }

  table.correctHeaderWidth = state.correctHeaderWidth;

  if (state.rowFilter === null || state.rowFilter.total === wtSettings.getSetting<number>('totalRows')) {
    wtViewport.rowsRenderCalculator = state.rowsRenderCalculator;

    if (state.rowFilter !== null) {
      table.rowFilter = state.rowFilter;
    }
  }

  if (state.columnFilter === null || state.columnFilter.total === wtSettings.getSetting<number>('totalColumns')) {
    wtViewport.columnsRenderCalculator = state.columnsRenderCalculator;

    if (state.columnFilter !== null) {
      table.columnFilter = state.columnFilter;
    }
  }
}

/**
 * Returns `true` when this draw is a pure vertical scroll (only the vertical scroll position moved),
 * so the column window (and thus the THEAD) is unchanged. The scroll-direction flags live on the
 * master's overlays, so the master passes its own overlays and a clone passes its clone source's —
 * each cycle already knows its role, so the resolution stays at the call site rather than re-branching
 * here. `isScrollDrivenDraw` guards against a `forceFullRender` that runs while the scroll-direction
 * flags are still set (an `afterScroll` hook can trigger one): a full render enters as `draw(false)`,
 * so it is excluded here and always rebuilds the headers.
 *
 * @param {Overlays} wtOverlays The master's overlays object (the owner of the scroll-direction flags).
 * @returns {boolean}
 */
function isPureVerticalScrollDraw(wtOverlays: Overlays): boolean {
  return !!wtOverlays &&
    wtOverlays.isScrollDrivenDraw &&
    wtOverlays.verticalScrolling &&
    !wtOverlays.horizontalScrolling;
}

/**
 * Renders the header + cell band and measures the rendered rows. Shared by both cycles. The
 * role-specific branches stay inline and verbatim: bottom / bottom-left-corner overlays suppress
 * column headers, and only the master or the bottom clone marks oversized rows.
 *
 * @param {Table} table The table (master or clone).
 * @param {DrawContext} ctx The per-draw scratch (supplies the pre-hook header renderers).
 * @param {{ rowFilter: RowFilter, columnFilter: ColumnFilter }} filters The filters just built by
 *   `buildRenderFilters` (passed non-null rather than re-read off the nullable `table.*Filter`).
 * @param {boolean} columnHeadersRenderSkippable Whether the column-header (THEAD) pass may be skipped
 *   for this draw (a pure vertical scroll); resolved per role by the caller.
 * @returns {boolean} `true` when the post-render row measurement (`markOversizedRows`) found heights
 *   that differ from the records the band was computed from and invalidated the row-height cache.
 *   Always `false` for the tables that do not measure rows (every clone but the bottom one).
 */
function renderCellBand(
  table: Table,
  ctx: DrawContext,
  filters: { rowFilter: RowFilter; columnFilter: ColumnFilter },
  columnHeadersRenderSkippable: boolean,
): boolean {
  table.tableRenderer.setHeaderContentRenderers(ctx.rowHeaders, ctx.columnHeaders);

  if (table.is(CLONE_BOTTOM) ||
      table.is(CLONE_BOTTOM_INLINE_START_CORNER)) {
    // do NOT render headers on the bottom or bottom-left corner overlay
    table.tableRenderer.setHeaderContentRenderers(ctx.rowHeaders, []);
  }

  table.tableRenderer.setColumnHeadersRenderSkippable(columnHeadersRenderSkippable);

  const wipedOversizedRows = resetOversizedRows(table);

  table.tableRenderer
    .setActiveOverlayName(table.name)
    .setViewportSize(table.getRenderedRowsCount(), table.getRenderedColumnsCount())
    .setFilters(filters.rowFilter, filters.columnFilter)
    .render();

  // Mark that a cell band reached the DOM. The viewport is shared by the master and all overlay
  // clones, so this advances one counter no matter which table rendered — the signal the master's
  // `skipRender` rollback guards on (see `restoreRenderedStateIfSafe`).
  table.deps.getWtViewport().renderCycleSeq += 1;

  adjustColumnHeaderHeights(table);

  if (table.isMaster || table.is(CLONE_BOTTOM)) {
    return markOversizedRows(table, wipedOversizedRows);
  }

  return false;
}

/**
 * The upper bound on how many extra cell-band renders one draw may spend refilling the viewport
 * after the rendered rows measured shorter than the band was computed from.
 *
 * Passes scale with the number of stale tall records BELOW the band, roughly one pass per record:
 * each pass's proposal is capped at the first row below the band that still holds a stale tall
 * record (the axis calculator stops where the cumulative offsets — stale record included — cross
 * the viewport, and `resetOversizedRows` wipes only the rows inside the band, so every
 * previously-measured tall row below it survives to cap the next proposal). Only rendering that row
 * re-measures it and lets the following pass propose past it. The overscan does not help here:
 * `rowHeightsUniform` is `false` in exactly this scenario. So the practical limit is a shrink that
 * leaves at most `MAX_ROWS_BAND_REFILL_PASSES` stale out-of-band tall records between the pre-shrink
 * band and the settled one — the #6452 fixture (rows 1-7 tall, a ~5-row pre-fix band) already
 * consumes all three passes.
 *
 * Exhausting the cap does NOT self-correct on the next draw. The pass that spent the last iteration
 * re-measured every row inside the final band accurately, so what still caps the band is a stale
 * tall record for a row just OUTSIDE it — and that is precisely the state in which the next draw's
 * `markOversizedRows` reports no change, `rowHeightsChanged` is `false`, and the refill never fires.
 * The viewport then stays under-filled until a scroll or a resize brings those rows into a rendered
 * band, i.e. exactly the pre-fix #6452 behavior. That is not a regression; the cap buys it against
 * letting one draw re-render the band an unbounded number of times. Do not "fix" it by dropping the
 * out-of-band records: a record for a row that is still genuinely tall is legitimate, and dropping
 * it would shrink the scroll range on unrelated edits.
 */
const MAX_ROWS_BAND_REFILL_PASSES = 3;

/**
 * Master-only. Re-renders the cell band when the rows just rendered measured SHORTER than the
 * heights the band was computed from, so the viewport is filled in this draw instead of the next one.
 *
 * The rendered band is computed BEFORE the cells render, from `rowHeightCache` — the provided heights
 * merged with `wtViewport.oversizedRows`, i.e. heights measured on a PREVIOUS render. When content
 * shrinks between two draws (a column autosized wider so wrapped text fits on one line, a long value
 * replaced by a short one, `colWidths` changed), that band is too short for the new heights:
 * `markOversizedRows` measures the shrink and invalidates the cache, the visible calculators are
 * recomputed, but the rendered band and the DOM stay as sized for the tall rows — a blank area
 * under the last row until an unrelated draw (issue #6452, DEV-406).
 *
 * A pass runs only when the proposal grows the BOTTOM edge (a later `endRow`). #6452 is exclusively
 * an under-filled bottom: the rows shrank, so the band no longer reaches the bottom of the viewport.
 * An earlier proposed `startRow` on its own is NOT a refill trigger. That is the virtualized
 * merged-cell signature — `mergeCells` serves per-band heights through `modifyRowHeightByOverlayName`
 * and the rowspan inflates the `oversizedRows` records of the few spanned rows the band renders, so
 * every scroll draw proposes a band that starts one row earlier and ends far short of the rendered
 * one. The band rendered on such a draw is already correct, and refilling from that proposal is what
 * broke `src/plugins/mergeCells/__tests__/selection.spec.js`.
 *
 * The band that then gets applied is the UNION of the previous band and the proposal
 * (`extendRenderedRowsBandTo`, `viewport/calculatorFactory.ts`), never the proposal alone: a proposal
 * built from re-measured heights can move the START edge inwards while `endRow` grows — the
 * legitimate scrolled-shrink case has rows above the viewport shrinking, which pushes `startRow`
 * later — and applying it wholesale would drop rows the DOM already shows from under the viewport.
 * With the union each pass strictly grows the band, so the loop is bounded by monotonic growth (the
 * band cannot pass `totalRows`) as well as by `MAX_ROWS_BAND_REFILL_PASSES`. Applying a grown band is
 * safe because nothing reads `getCell` or a band-gated range query between `createCalculators`
 * assigning the band and the `renderCellBand` on the next line bringing the TBODY into agreement
 * with it.
 *
 * The loop also stops as soon as a pass proposes no further growth of the bottom edge, or measures
 * no further height change.
 *
 * Three more declines keep a pass cheap or safe. `renderAllRows`, and a band already at the dataset
 * end, skip the proposal walk — the bottom edge cannot grow there. A proposal that does not overlap
 * (or touch) the previous band is declined: the union would span the whole gap between them and one
 * `renderCellBand` would build it all (a whole-dataset shrink while scrolled deep reaches this).
 * And a pass whose recomputed column band disagrees with the captured `ctx.syncFrozenRows` decision
 * is declined — see {@link refillDisagreesWithFrozenColumnSync}. Every decline leaves the rendered
 * state exactly as pass 1 rendered it, which is the pre-fix #6452 behavior: under-filled until the
 * next scroll, resize, or content draw.
 *
 * Accepted trade-off: `createCalculators(false)` runs with `stationaryBands` off, so a scroll-driven
 * draw that reaches a refill loses the columns overscan/stabilization for that draw. A shrink during
 * a scroll draw is rare, and the recompute is answering a content change rather than a scroll step,
 * where the stabilization has nothing to hold steady.
 *
 * Renderer-level callbacks fire once per pass: each pass re-renders the whole band, so the cell
 * renderer — and the core `beforeRenderer`/`afterRenderer` hooks that `tableView.ts` fires from
 * inside it — runs again for every cell. The draw-level hooks do not repeat: the `beforeDraw`
 * setting (core's `beforeViewRender`) fires once before the first pass and the `onDraw` setting
 * (core's `afterViewRender`) once after the last, both outside this loop. `renderCycleSeq` advances
 * once per pass, and its only consumer is the `skipRender` rollback guard.
 *
 * Every pass rebuilds both size caches, which is why the second-calculator-pass skip right after the
 * call site reads `rowHeightsChanged` and not `rowHeightCache.isCurrent()` alone — see the comment
 * on `skipSecondPass`.
 *
 * @param {Table} table The master table.
 * @param {DrawContext} ctx The per-draw scratch (supplies the header renderers for the re-render).
 * @param {boolean} columnHeadersRenderSkippable Forwarded to `renderCellBand`, same value as the first pass.
 */
function refillRenderedRowsBandIfShrunk(
  table: Table,
  ctx: DrawContext,
  columnHeadersRenderSkippable: boolean,
): void {
  const { wtSettings } = table;
  const wtViewport = table.deps.getWtViewport();

  // With `renderAllRows` every row is already in the band, so the bottom edge can never grow —
  // skip the proposal walk entirely.
  if (wtSettings.getSetting<boolean>('renderAllRows')) {
    return;
  }

  const lastDatasetRow = wtSettings.getSetting<number>('totalRows') - 1;

  for (let pass = 0; pass < MAX_ROWS_BAND_REFILL_PASSES; pass++) {
    const previousStartRow = table.getFirstRenderedRow();
    const previousEndRow = table.getLastRenderedRow();

    // A band that already reaches the dataset end cannot grow its bottom edge; skip the cache
    // builds and the proposal walk that would only conclude the same. Rows that merely GREW
    // still pay one proposal walk per pass-triggering draw — the walk is the only place the
    // viewport-fill question is answered without duplicating the axis math.
    if (previousEndRow >= lastDatasetRow) {
      return;
    }

    // Both caches, as at the other `createVisibleCalculators` call sites: an unbuilt column strategy
    // answers every offset with 0.
    wtViewport.rowHeightCache.ensureBuilt();
    wtViewport.columnWidthCache.ensureBuilt();

    // Propose only — this does not assign the viewport's calculators, and `proposeOnly` skips the
    // `rowHeaderWidth` memo reset (the build's one side effect), so a declined pass leaves the
    // rendered state alone and costs no header re-measure.
    // Mirror `createCalculators`: the render band reads the scrollbar-unaware box on the single-pass
    // path; the legacy measured path serves render and visible from the same 'visible' band.
    const renderBand: ViewportBand = wtViewport.usesLayoutSnapshotForCalculators() ? 'render' : 'visible';
    const proposedBand = wtViewport
      .createRowsCalculator(['rendered'], renderBand, { proposeOnly: true })
      .getResultsFor('rendered');

    // Only a bottom edge that must grow takes a pass. An earlier proposed `startRow` on its own is
    // not a refill signal — see the JSDoc: it is the virtualized-merged-cell signature, and the band
    // rendered above it is already correct.
    if (
      !proposedBand ||
      proposedBand.startRow === null || proposedBand.endRow === null ||
      proposedBand.endRow <= previousEndRow
    ) {
      return;
    }

    // A proposal that shares no row with (and is not adjacent to) the previous band would union into
    // a band spanning the whole gap between them — a whole-dataset shrink while scrolled deep puts
    // the proposal near the dataset end with the previous band thousands of rows above it, and the
    // `renderCellBand` below would build all of it in one go. Decline the pass instead: the viewport
    // stays under-filled until the next scroll or resize (the pre-fix #6452 behavior). This guard is
    // also what bounds `extendRenderedRowsBandTo`'s start-edge growth: with it, the union can never
    // exceed the two bands' combined span.
    if (proposedBand.startRow > previousEndRow + 1) {
      return;
    }

    if (refillDisagreesWithFrozenColumnSync(table, ctx, renderBand)) {
      return;
    }

    // Full recompute (no stationary bands: this is a content change, not a scroll step) so the
    // rendered and visible calculators are rebuilt from the freshly measured heights together.
    wtViewport.createCalculators(false);

    // Apply the UNION of the previous band and the proposal, never the proposal alone: a proposal
    // built from re-measured heights can move one edge inwards, and an edge inside the band the
    // DOM already shows would leave the viewport shorter than it was.
    wtViewport.extendRenderedRowsBandTo(previousStartRow, previousEndRow);

    const filters = buildRenderFilters(table, ctx);

    // A pass that measures no further change has settled the band; anything else is another shrink
    // the grown band just exposed, and the next iteration decides whether it must grow again.
    if (!renderCellBand(table, ctx, filters, columnHeadersRenderSkippable)) {
      return;
    }
  }
}

/**
 * Whether a refill pass would render with a frozen-column sync decision different from the one this
 * draw already acted on. `ctx.syncFrozenRows` is a function of the master's first rendered column
 * (`shouldSyncOversizedRowsWithFrozenOverlays`), resolved from the PREVIOUS draw's column band —
 * and pass 1's band got the columns overscan, which the refill's `createCalculators(false)` (no
 * `stationaryBands`) does not re-apply, so the recomputed band can start past column 0 where the
 * captured one started at 0. Rendering with that mismatch is destructive when the flag was captured
 * `false`: `releaseFrozenOversizedRows()` already ran, so the refill's `resetOversizedRows` would
 * wipe frozen-tall records with no exemption left, on a master that no longer renders the frozen
 * columns and therefore can never re-measure them. The refill declines the pass on any disagreement
 * (the opposite direction merely leaves the records one draw staler, but a declined pass is the
 * pre-fix behavior either way and settles on the next draw).
 *
 * The column proposal here is prediction, not assignment: `createColumnsCalculator` builds the same
 * band `createCalculators(false)` would assign, without touching the viewport's calculators.
 * `externalRowCalculator` needs no re-check — the refill only runs when `markOversizedRows`
 * reported a change, which it never does with that setting on.
 *
 * @param {Table} table The master table.
 * @param {DrawContext} ctx The per-draw scratch (supplies the captured `syncFrozenRows` flag).
 * @param {ViewportBand} renderBand The viewport band the refill's proposals read.
 * @returns {boolean} `true` when the pass must be declined.
 */
function refillDisagreesWithFrozenColumnSync(table: Table, ctx: DrawContext, renderBand: ViewportBand): boolean {
  if (!table.wtSettings.getSetting<number>('fixedColumnsStart')) {
    return false;
  }

  const wtViewport = table.deps.getWtViewport();
  const proposedStartColumn = wtViewport
    .createColumnsCalculator(['rendered'], renderBand, { proposeOnly: true })
    .getResultsFor('rendered')?.startColumn ?? null;

  return (proposedStartColumn !== null && proposedStartColumn > 0) !== ctx.syncFrozenRows;
}

/**
 * Renders the active selections for this table's overlay. Shared by both cycles (the clone always
 * reaches here; the master reaches here only when the fixed-position pass reported no 1px shift).
 *
 * @param {Table} table The table (master or clone).
 * @param {boolean} runFastDraw Whether this draw is a fast (reposition-only) draw.
 */
function renderActiveSelections(table: Table, runFastDraw: boolean): void {
  table.deps.getSelectionManager()
    .setActiveOverlay(table.facadeGetter())
    .render(runFastDraw);
}

/**
 * Master-only fixed-position pass: repositions the top / bottom / inline-start / corner overlays and
 * records in `ctx.positionChanged` whether an `innerBorder*` toggle shifted the layout by 1px (the
 * corners do not contribute to the flag, matching the original).
 *
 * @param {Table} table The master table.
 * @param {DrawContext} ctx The per-draw scratch (receives `positionChanged`).
 */
function placeFixedOverlays(table: Table, ctx: DrawContext): void {
  const wtOverlays = table.deps.getWtOverlays();

  ctx.positionChanged = wtOverlays.topOverlay.resetFixedPosition();

  if (wtOverlays.bottomOverlay.clone) {
    ctx.positionChanged = wtOverlays.bottomOverlay.resetFixedPosition() || ctx.positionChanged;
  }

  ctx.positionChanged = wtOverlays.inlineStartOverlay.resetFixedPosition() || ctx.positionChanged;

  if (wtOverlays.topInlineStartCornerOverlay) {
    wtOverlays.topInlineStartCornerOverlay.resetFixedPosition();
  }

  if (wtOverlays.bottomInlineStartCornerOverlay && wtOverlays.bottomInlineStartCornerOverlay.clone) {
    wtOverlays.bottomInlineStartCornerOverlay.resetFixedPosition();
  }
}
