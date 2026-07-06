import ColumnFilter from '../filter/column';
import RowFilter from '../filter/row';
import {
  CLONE_BOTTOM,
  CLONE_BOTTOM_INLINE_START_CORNER,
} from '../overlay';
import type Table from '../table';

/**
 * Runs one draw of a Walkontable table — the master table and each overlay clone both go through
 * here. Extracted verbatim from `Table.draw()` so the orchestration lives outside the class; it
 * reaches the instance only through its public surface + the `get deps()` getter (never `#deps`),
 * exactly like the `cellAccess`/`domScaffold` mixins.
 *
 * This is the free-function seam for the master-vs-clone cycle split: the body is unchanged today
 * (a later step routes master and clone through dedicated `runMasterDrawCycle`/`runCloneDrawCycle`
 * functions over shared phase helpers). Behavior is byte-identical to the previous in-class method.
 *
 * @param {Table} table The table instance (master or an overlay clone).
 * @param {boolean} fastDraw If `true`, try to only reposition rather than re-render cells.
 */
export function runDrawCycle(table: Table, fastDraw: boolean): void {
  const { wtSettings } = table;
  const wtOverlays = table.deps.getWtOverlays();
  const wtViewport = table.deps.getWtViewport();
  const rowHeaders = wtSettings.getSetting<Function[]>('rowHeaders');
  const rowHeadersCount = rowHeaders.length;
  const columnHeaders = wtSettings.getSetting<Function[]>('columnHeaders');
  const columnHeadersCount = columnHeaders.length;
  let runFastDraw = fastDraw;

  if (table.isMaster) {
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

    runFastDraw = wtViewport.createCalculators(runFastDraw);

    if (rowHeadersCount && !wtSettings.getSetting('fixedColumnsStart')) {
      const leftScrollPos = wtOverlays.inlineStartOverlay.getScrollPosition();
      const previousState = table.correctHeaderWidth;

      table.correctHeaderWidth = leftScrollPos !== 0;

      if (previousState !== table.correctHeaderWidth) {
        runFastDraw = false;
      }
    }
  }

  if (runFastDraw) {
    if (table.isMaster) {
      wtOverlays.refresh(true);
      // Fast (scroll) draws skip the full-render header-height pass below, so the master/top
      // header heights can drift against the frozen overlays during scrolling (a tall wrapped
      // frozen header that the master never renders). Re-sync here. The method is a cheap no-op
      // unless the grid has frozen columns with column headers, so non-frozen grids are unaffected.
      table.syncOversizedColumnHeadersWithFrozenOverlays();
    }
  } else {
    if (table.isMaster) {
      table.tableOffset = table.deps.geometryReader.offset(table.TABLE);
    } else {
      table.tableOffset = table.deps.getParentTableOffset();
    }

    const startRow = Math.max(table.getFirstRenderedRow(), 0);
    const startColumn = Math.max(table.getFirstRenderedColumn(), 0);

    table.rowFilter = new RowFilter(startRow, wtSettings.getSetting<number>('totalRows'), columnHeadersCount);
    table.columnFilter = new ColumnFilter(startColumn, wtSettings.getSetting<number>('totalColumns'), rowHeadersCount);

    let performRedraw = true;

    // Only master table rendering can be skipped
    if (table.isMaster) {
      table.alignOverlaysWithTrimmingContainer(); // todo It calls method from child class (MasterTable).
      const skipRender: { skipRender?: boolean } = {};

      table.wtSettings.getSetting('beforeDraw', true, skipRender);
      performRedraw = skipRender.skipRender !== true;
    }

    if (performRedraw) {
      table.tableRenderer.setHeaderContentRenderers(rowHeaders, columnHeaders);

      if (table.is(CLONE_BOTTOM) ||
          table.is(CLONE_BOTTOM_INLINE_START_CORNER)) {
        // do NOT render headers on the bottom or bottom-left corner overlay
        table.tableRenderer.setHeaderContentRenderers(rowHeaders, []);
      }

      table.resetOversizedRows();

      table.tableRenderer
        .setActiveOverlayName(table.name)
        .setViewportSize(table.getRenderedRowsCount(), table.getRenderedColumnsCount())
        .setFilters(table.rowFilter, table.columnFilter)
        .render();

      table.adjustColumnHeaderHeights();

      if (table.isMaster || table.is(CLONE_BOTTOM)) {
        table.markOversizedRows();
      }

      if (table.isMaster) {
        if (!table.wtSettings.getSetting('externalRowCalculator')) {
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

        table.wtSettings.getSetting('onDraw', true);

      } else if (table.is(CLONE_BOTTOM)) {
        table.deps.getCloneSource().wtOverlays.adjustElementsSize();
      }
    }
  }

  let positionChanged = false;

  if (table.isMaster) {
    positionChanged = wtOverlays.topOverlay.resetFixedPosition();

    if (wtOverlays.bottomOverlay.clone) {
      positionChanged = wtOverlays.bottomOverlay.resetFixedPosition() || positionChanged;
    }

    positionChanged = wtOverlays.inlineStartOverlay.resetFixedPosition() || positionChanged;

    if (wtOverlays.topInlineStartCornerOverlay) {
      wtOverlays.topInlineStartCornerOverlay.resetFixedPosition();
    }

    if (wtOverlays.bottomInlineStartCornerOverlay && wtOverlays.bottomInlineStartCornerOverlay.clone) {
      wtOverlays.bottomInlineStartCornerOverlay.resetFixedPosition();
    }
  }

  if (positionChanged) {
    // It refreshes the cells borders caused by a 1px shift (introduced by overlays which add or
    // remove `innerBorderTop` and `innerBorderInlineStart` CSS classes to the DOM element. This happens
    // when there is a switch between rendering from 0 to N rows/columns and vice versa).
    wtOverlays.refreshAll(); // `refreshAll()` internally already calls `refreshSelections()` method
    wtOverlays.adjustElementsSize();
  } else {
    table.deps.getSelectionManager()
      .setActiveOverlay(table.facadeGetter())
      .render(runFastDraw);
  }

  if (table.isMaster) {
    wtOverlays.afterDraw();
  }

  table.deps.setDrawn(true);
}
