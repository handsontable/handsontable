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
      renderCellBand(
        table,
        ctx,
        filters,
        isPureVerticalScrollDraw(wtOverlays),
      );

      if (!wtSettings.getSetting('externalRowCalculator')) {
        // Single-pass: the fully/partially-visible calculators were already computed in pass 1
        // (`createCalculators`) from the layout snapshot. On the snapshot path, the only thing that
        // can change them post-render is `markOversizedRows` invalidating the row-height cache when
        // rendered content is genuinely taller than its configured size. If both size caches are
        // still current, the post-render values are identical, so this second pass is a redundant
        // recompute — skip it. (Read `isCurrent()` before `ensureBuilt()` rebuilds an invalidated
        // cache. Validated non-destructively across the full e2e: this predicate would skip 595
        // draws with byte-identical ranges and 0 divergences.) The legacy measured path, and any
        // draw with an oversized row, still recompute here.
        const skipSecondPass = wtViewport.usesLayoutSnapshotForCalculators() &&
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
      syncOversizedRowsWithFrozenOverlays(table, wipedFrozenRows);
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

  wtOverlays.afterDraw();

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
 */
function renderCellBand(
  table: Table,
  ctx: DrawContext,
  filters: { rowFilter: RowFilter; columnFilter: ColumnFilter },
  columnHeadersRenderSkippable: boolean,
): void {
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
    markOversizedRows(table, wipedOversizedRows);
  }
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
