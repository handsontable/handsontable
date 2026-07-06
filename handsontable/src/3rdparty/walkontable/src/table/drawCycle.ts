import ColumnFilter from '../filter/column';
import RowFilter from '../filter/row';
import {
  CLONE_BOTTOM,
  CLONE_BOTTOM_INLINE_START_CORNER,
} from '../overlay';
import type Table from '../table';

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

  wtOverlays.beforeDraw();
  table.holderOffset = table.deps.geometryReader.offset(table.holder);

  wtViewport.rowHeightCache.ensureBuilt();
  wtViewport.columnWidthCache.ensureBuilt();

  // S16b: on the single-pass gated path, decide and apply the header-border classes
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

  ctx.runFastDraw = wtViewport.createCalculators(ctx.runFastDraw);

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
    table.syncOversizedColumnHeadersWithFrozenOverlays();
  } else {
    table.tableOffset = table.deps.geometryReader.offset(table.TABLE);

    const filters = buildRenderFilters(table, ctx);

    table.alignOverlaysWithTrimmingContainer(); // todo It calls method from child class (MasterTable).
    const skipRender: { skipRender?: boolean } = {};

    wtSettings.getSetting('beforeDraw', true, skipRender);
    ctx.performRedraw = skipRender.skipRender !== true;

    if (ctx.performRedraw) {
      renderCellBand(table, ctx, filters);

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

      wtOverlays.refresh(false);
      table.syncOversizedColumnHeadersWithFrozenOverlays();
      wtOverlays.applyToDOM();

      wtSettings.getSetting('onDraw', true);
    }
  }

  placeFixedOverlays(table, ctx);

  if (ctx.positionChanged) {
    // It refreshes the cells borders caused by a 1px shift (introduced by overlays which add or
    // remove `innerBorderTop` and `innerBorderInlineStart` CSS classes to the DOM element. This happens
    // when there is a switch between rendering from 0 to N rows/columns and vice versa).
    wtOverlays.refreshAll(); // `refreshAll()` internally already calls `refreshSelections()` method
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
    renderCellBand(table, ctx, filters);

    if (table.is(CLONE_BOTTOM)) {
      table.deps.getCloneSource().wtOverlays.adjustElementsSize();
    }
  }

  renderActiveSelections(table, ctx.runFastDraw);

  table.deps.setDrawn(true);
}

/**
 * Rebuilds the row/column render filters from the current first-rendered row/column. Shared by both
 * cycles and kept SEPARATE from `renderCellBand`, called BEFORE the master `beforeDraw` gate:
 * filters are rebuilt on the full path even when `skipRender` is true, and both the selection render
 * and the range-query mixins read them. Folding it into `renderCellBand` would stop the master
 * rebuilding filters on the skip-render path — a behavior break.
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
 * Renders the header + cell band and measures the rendered rows. Shared by both cycles. The
 * role-specific branches stay inline and verbatim: bottom / bottom-left-corner overlays suppress
 * column headers, and only the master or the bottom clone marks oversized rows.
 *
 * @param {Table} table The table (master or clone).
 * @param {DrawContext} ctx The per-draw scratch (supplies the pre-hook header renderers).
 * @param {{ rowFilter: RowFilter, columnFilter: ColumnFilter }} filters The filters just built by
 *   `buildRenderFilters` (passed non-null rather than re-read off the nullable `table.*Filter`).
 */
function renderCellBand(
  table: Table,
  ctx: DrawContext,
  filters: { rowFilter: RowFilter; columnFilter: ColumnFilter },
): void {
  table.tableRenderer.setHeaderContentRenderers(ctx.rowHeaders, ctx.columnHeaders);

  if (table.is(CLONE_BOTTOM) ||
      table.is(CLONE_BOTTOM_INLINE_START_CORNER)) {
    // do NOT render headers on the bottom or bottom-left corner overlay
    table.tableRenderer.setHeaderContentRenderers(ctx.rowHeaders, []);
  }

  table.resetOversizedRows();

  table.tableRenderer
    .setActiveOverlayName(table.name)
    .setViewportSize(table.getRenderedRowsCount(), table.getRenderedColumnsCount())
    .setFilters(filters.rowFilter, filters.columnFilter)
    .render();

  table.adjustColumnHeaderHeights();

  if (table.isMaster || table.is(CLONE_BOTTOM)) {
    table.markOversizedRows();
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
