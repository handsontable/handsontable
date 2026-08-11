/**
 * Post-render row / column-header measurement for `Table` and every subclass.
 *
 * These read the rendered DOM back after a draw to discover content-driven sizes that exceed the
 * provided ones: `markOversizedRows` records rows taller than their configured height into
 * `wtViewport.oversizedRows`, `adjustColumnHeaderHeights` applies the provided header heights to the
 * THEAD rows, and `syncOversizedColumnHeadersWithFrozenOverlays` keeps the frozen-overlay headers
 * pixel-aligned with the master. They are universal — every table type participates in the draw —
 * so they are free functions over a `Table` instance (the same pattern as the draw-cycle phase
 * helpers in `table/drawCycle.ts`), reading the table's public fields (`THEAD`/`TBODY`/`rowFilter`/
 * `wtSettings`/`isMaster`) and the geometry-read port + the overlays/viewport owners via the `deps`
 * getter. They belong to the `axisSizing` slice: together with `positionCache/` and
 * `sizeGetters.ts` they own the "how tall is a row really" answer.
 */
import { isHTMLElement } from '../../../../helpers/dom/element';
import { CLONE_BOTTOM } from '../overlay';
import { getBoxAdjustedRowHeight } from './boxModel';
import type { default as Table } from '../table/baseTable';

/**
 * The two knobs `markOversizedRows` exposes purely for the frozen-column row sync. Grouped so the
 * shared measurement function keeps a two-argument signature for its ordinary callers.
 */
interface FrozenPassOptions {
  /**
   * Leave a wiped record this table could not re-detect alone, rather than reading it as a row that
   * shrank back. Only the caller that measures every frozen table can tell the two apart.
   */
  deferShrinkDetection?: boolean;
  /**
   * Receives the source index of every row this call records.
   */
  recordedRows?: Set<number>;
}

/**
 * Applies the provided column-header heights to the rendered THEAD rows. The provided height comes
 * from the `columnHeaderHeight` setting funnel (the option, the `modifyColumnHeaderHeight` hook that
 * AutoRowSize feeds, and the Handsontable-side render-size probe for content-driven headers). It is
 * written as `min-height`, never `height`, so a header whose real content is taller (a wrapped or
 * frozen-region header) is not clipped - it still expands to its content, which the frozen-overlay
 * sync then reads. Runs on the master and every clone so all overlays get the same floor.
 *
 * @param {Table} table The table (master or clone) whose THEAD rows receive the heights.
 */
export function adjustColumnHeaderHeights(table: Table): void {
  const { wtSettings } = table;
  const children = table.THEAD!.childNodes;
  const defaultRowHeight = wtSettings.getSetting('stylesHandler').getDefaultRowHeight();
  const columnHeaders = wtSettings.getSetting<Function[]>('columnHeaders');

  for (let i = 0, len = columnHeaders.length; i < len; i++) {
    const headerHeight = table.getColumnHeaderHeight(i);

    if (headerHeight > defaultRowHeight) {
      if (!children[i] || children[i].childNodes.length === 0) {
        return;
      }
      const firstChild = children[i].childNodes[0];

      if (isHTMLElement(firstChild)) {
        firstChild.style.height = `${headerHeight}px`;
      }
    }
  }
}

/**
 * Frozen column headers (e.g., with `white-space: normal`) are rendered only in the frozen
 * overlays, never in the master table's THEAD. When such a header is taller than the headers
 * of the scrollable columns, the master and top overlay THEADs render shorter than the corner
 * and inline-start overlays, so the frozen overlay body rows sit shifted against the master.
 * The gap can be sub-pixel: under browser zoom the frozen header content is a fraction of a
 * pixel taller than the applied height, and that fraction accumulates into a visible 1px shift.
 *
 * This function runs after the frozen overlays have rendered. It reads the corner overlay's
 * content-driven THEAD row heights with sub-pixel precision and forces the matching master and
 * top overlay header cells to the same height so every overlay THEAD ends up the same height
 * and the body rows stay pixel-aligned.
 *
 * It deliberately does NOT write to `wtViewport.oversizedColumnHeaders`. That cache is applied
 * back to the corner overlay on the next render; growing it here would inflate the corner cell,
 * which would then be re-measured taller, ratcheting the height up every render. Reading the
 * corner's natural (content-driven) height and only adjusting the master/top side keeps the
 * synchronization stable and lets the header shrink again when the content allows.
 *
 * @param {Table} table The master table.
 */
export function syncOversizedColumnHeadersWithFrozenOverlays(table: Table): void {
  const wtOverlays = table.deps.getWtOverlays();
  // Cheapest possible bail-out first: with no frozen columns the corner overlay is not cloned,
  // so the overwhelmingly common (non-frozen) grids pay only a couple of property reads per draw.
  const cornerClone = wtOverlays.topInlineStartCornerOverlay?.clone;

  if (!cornerClone?.wtTable?.THEAD) {
    return;
  }

  const columnHeaders = table.wtSettings.getSetting<unknown[]>('columnHeaders');

  if (!columnHeaders.length) {
    return;
  }

  const cornerChildren = cornerClone.wtTable.THEAD.childNodes;
  const topClone = wtOverlays.topOverlay?.clone;
  const targetTheads = [table.THEAD, topClone?.wtTable?.THEAD];
  // Sub-pixel tolerance to avoid rewriting heights on floating-point jitter while still
  // catching the fractional gaps (e.g. ~0.33px at 75% zoom) that read as a 1px shift.
  const epsilon = 0.1;

  for (let i = 0, len = columnHeaders.length; i < len; i++) {
    const cornerChild = cornerChildren[i];

    if (!isHTMLElement(cornerChild)) {
      continue;
    }

    const cornerRowHeight = table.deps.geometryReader.getBoundingClientRect(cornerChild).height;

    targetTheads.forEach((thead) => {
      const targetRow = thead?.childNodes[i];

      if (!isHTMLElement(targetRow) || targetRow.childNodes.length === 0) {
        return;
      }

      const firstChild = targetRow.childNodes[0];

      if (!isHTMLElement(firstChild)) {
        return;
      }

      const targetRowHeight = table.deps.geometryReader.getBoundingClientRect(targetRow).height;

      if (Math.abs(targetRowHeight - cornerRowHeight) > epsilon) {
        firstChild.style.height = `${cornerRowHeight}px`;
      }
    });
  }
}

/**
 * Re-applies the effective row heights to one table's already-rendered rows.
 *
 * Mirrors the final pass of `TableRenderer#render` (`render/tableRenderer.ts`), which writes the same
 * value onto the row's first cell while rendering. This is the out-of-render path, for a height that
 * became known only after this table had rendered.
 *
 * @param {Table} table The table (master or clone) whose rendered rows are re-sized.
 */
function applyRowHeightsToRenderedRows(table: Table): void {
  const { TBODY, rowFilter } = table;

  if (!TBODY || !rowFilter) {
    return;
  }

  const borderBoxSizing = table.wtSettings.getSetting('stylesHandler').areCellsBorderBox();
  const renderedRows = TBODY.childNodes;

  for (let renderedRowIndex = 0; renderedRowIndex < renderedRows.length; renderedRowIndex++) {
    const firstChild = renderedRows[renderedRowIndex].firstChild;

    if (!isHTMLElement(firstChild)) {
      continue;
    }

    const sourceRowIndex = rowFilter.renderedToSource(renderedRowIndex);
    const rowHeight = table.rowUtils.getHeightByOverlayName(sourceRowIndex, table.name);

    firstChild.style.height = rowHeight ? `${getBoxAdjustedRowHeight(rowHeight, borderBoxSizing)}px` : '';
  }
}

/**
 * Whether this draw needs the frozen-column row-height sync at all: only when frozen columns exist
 * AND the master's rendered band starts past column 0, so at least one frozen column is rendered by
 * the inline-start overlays and by nothing else. AutoRowSize (`externalRowCalculator`) owns every
 * row height when it is on, and `markOversizedRows` is a no-op then.
 *
 * Called twice per draw, deliberately at two different moments, and they CAN disagree: the draw
 * cycle asks before the master renders (so `resetOversizedRows` knows whether the frozen-derived
 * records are still being maintained), which reads the band of the PREVIOUS draw; the sync asks
 * after, on this draw's band. Each wants the answer as of its own moment, and the disagreement is
 * the horizontal-scroll transition into or out of the frozen columns, which settles in one draw:
 * entering, the sync records the frozen heights the master could not; leaving, the released records
 * are re-measured by a master that now renders those columns itself.
 *
 * @param {Table} table The master table.
 * @returns {boolean}
 */
export function shouldSyncOversizedRowsWithFrozenOverlays(table: Table): boolean {
  const { wtSettings } = table;

  return !wtSettings.getSetting('externalRowCalculator') &&
    !!wtSettings.getSetting<number>('fixedColumnsStart') &&
    table.getFirstRenderedColumn() > 0;
}

/**
 * A row whose tallest content sits in a frozen (inline-start) column is rendered at that height only
 * by the frozen overlays. The master renders a contiguous column band starting at the column under
 * the horizontal scroll offset, so as soon as that band starts past column 0 the master never renders
 * the frozen columns — and `markOversizedRows` measures the master. Left alone, the row would be
 * recorded at its provided height while the frozen overlays render it at its content height, and
 * every row below it would drift by the difference.
 *
 * This runs after the frozen overlays have rendered, and is the row-height twin of
 * `syncOversizedColumnHeadersWithFrozenOverlays`. It measures all three tables that render frozen
 * columns — the inline-start clone, which mirrors the master's row band, and the two corners, which
 * hold the frozen top and bottom rows the inline-start clone does not — then re-applies the resulting
 * heights to the tables that render those rows WITHOUT the frozen columns.
 *
 * Re-measuring cannot ratchet: `resetFrozenOversizedRows` cleared these rows' records moments ago,
 * after the master rendered but before the frozen overlays did, so they rendered at their natural
 * content height. A frozen cell that shrank back is measured smaller and recorded smaller.
 *
 * @param {Table} table The master table.
 * @param {Map<number, number>} [wipedFrozenRows] The heights `resetFrozenOversizedRows` cleared, so
 *   an unchanged row is not mistaken for a new one (which would invalidate the row-height cache on
 *   every draw — a full prefix-sum walk when the row-size source is non-uniform).
 * @returns {boolean} `true` when this draw's row heights are no longer the ones the viewport
 *   calculators were built from, so the caller must rebuild them. An ordinary oversized row gets
 *   this for free — the master invalidates inside `renderCellBand`, which is BEFORE the calculators
 *   are computed — but a frozen-derived height is only knowable after the frozen overlays have
 *   rendered, which is after. Without the rebuild the frame reports a visible row range measured
 *   against the old heights.
 */
export function syncOversizedRowsWithFrozenOverlays(
  table: Table,
  wipedFrozenRows?: Map<number, number>,
): boolean {
  const wtOverlays = table.deps.getWtOverlays();
  // Cheapest question first — three settings reads — so a grid with no frozen columns never pays
  // for the overlay lookups and the list build below.
  const shouldSync = shouldSyncOversizedRowsWithFrozenOverlays(table);
  // Only overlays that actually rendered their band in THIS draw may be measured. `Overlay#refresh`
  // is a no-op when `needFullRender` is false, and a skipped clone still owns the DOM of whatever it
  // rendered last — measuring that would record a previous draw's heights and mark them
  // frozen-derived. The master's own pass has this guarantee structurally (`renderCellBand` measures
  // only the table it just rendered); here it has to be asked for.
  const frozenTables = shouldSync ? [
    wtOverlays.inlineStartOverlay,
    wtOverlays.topInlineStartCornerOverlay,
    wtOverlays.bottomInlineStartCornerOverlay,
  ]
    .filter(overlay => overlay?.needFullRender)
    .map(overlay => overlay?.clone?.wtTable)
    .filter((frozenTable): frozenTable is Table => !!frozenTable?.TBODY) : [];
  const settleWipedRows = () => {
    // Rows nothing re-detected shrank back to their provided height.
    if (wipedFrozenRows !== undefined && wipedFrozenRows.size > 0) {
      table.deps.getWtViewport().invalidateRowHeightCache();

      return true;
    }

    return false;
  };
  // Drops a row-height cache that was built while the frozen-derived records were cleared, i.e.
  // missing every one of their heights. The bottom clone reaches this: it renders and measures
  // inside `wtOverlays.refresh()`, so an invalidation of its own lands mid-window and the next
  // read rebuilds from an `oversizedRows` the frozen rows are not in yet. Nothing else would ever
  // correct it — the records come back unchanged, so no invalidation follows them — and the result
  // is a scrollbar too short to reach the end of the grid with every rendered row still correct.
  //
  // Must run AFTER the records are back, so whatever rebuilds next sees them.
  const dropStaleRowCacheBuild = () => {
    const wtViewport = table.deps.getWtViewport();

    if (wipedFrozenRows === undefined ||
        wtViewport.rowHeightCache.buildSeq === wtViewport.frozenClearRowCacheBuildSeq) {
      return false;
    }

    wtViewport.invalidateRowHeightCache();

    return true;
  };

  if (!shouldSync || frozenTables.length === 0) {
    // `settleWipedRows` first: it invalidates too, and both must be evaluated.
    const settled = settleWipedRows();

    if (dropStaleRowCacheBuild() || settled) {
      // The heights changed after `wtOverlays.refresh()` sized the elements for this draw.
      wtOverlays.adjustElementsSize();

      return true;
    }

    return false;
  }

  // Exactly the rows these tables measured taller than what was already known — i.e. the heights
  // that came from a frozen column. A row that is tall for a reason the master renders is NOT in
  // here, and must not be: the frozen overlays could never re-detect it, so marking it
  // frozen-derived would make the next draw read it as shrunk and drop it.
  const recordedRows = new Set<number>();
  let heightsChanged = false;

  frozenTables.forEach((frozenTable) => {
    // `deferShrinkDetection`: each table sees only its own slice of the band, so a record it cannot
    // re-detect may simply belong to one of the others. `settleWipedRows` concludes once, below.
    heightsChanged = markOversizedRows(frozenTable, wipedFrozenRows, {
      deferShrinkDetection: true,
      recordedRows,
    }) || heightsChanged;
  });

  const { frozenOversizedRows } = table.deps.getWtViewport();

  recordedRows.forEach(sourceRow => frozenOversizedRows.add(sourceRow));

  heightsChanged = settleWipedRows() || heightsChanged;

  // The records are back, so a rebuild from here on is complete. Evaluated on its own line rather
  // than folded into `heightsChanged`: a stale build needs the elements re-sized, but none of the
  // per-row height re-writes that a genuine height change needs.
  const hadStaleRowCacheBuild = dropStaleRowCacheBuild();

  // The top and bottom clones render inside `wtOverlays.refresh()` — AFTER
  // `resetFrozenOversizedRows` cleared the records — so they need the correction on every draw that
  // has one. (With no frozen rows configured these clones carry no body rows, so this costs nothing
  // on an ordinary frozen-columns grid.)
  //
  // In steady state the master is deliberately NOT here: it rendered BEFORE the clear, so it already
  // has the right heights, and re-writing every row each draw would be a per-row DOM write for
  // nothing.
  const reapplyTargets = [
    wtOverlays.topOverlay?.clone?.wtTable,
    wtOverlays.bottomOverlay?.clone?.wtTable,
  ];

  if (heightsChanged) {
    // A frozen height appeared or disappeared. Release the master first: one that just went away is
    // still forced onto its rows. Then re-measure it — the row may STILL be tall for a reason the
    // master renders, which its own pass earlier in this draw could not see because at that point it
    // was measuring the frozen height. Without this the row collapses to the frozen overlays' short
    // natural height while the master keeps its own tall content, i.e. the very misalignment this
    // whole sync exists to prevent.
    applyRowHeightsToRenderedRows(table);

    const masterRecordedRows = new Set<number>();

    markOversizedRows(table, undefined, { recordedRows: masterRecordedRows });

    // Whatever the master just recorded, it out-measured the frozen height — its own content is the
    // taller one, so the record is the master's to own and hand back. Leaving it marked
    // frozen-derived costs nothing visible and never settles: the next draw's
    // `resetFrozenOversizedRows` clears a height only the master can recreate, the frozen pass
    // re-records its own shorter one, the master out-measures it again, and both invalidate the
    // row-height cache on every draw for as long as both cells stay oversized.
    masterRecordedRows.forEach(sourceRow => frozenOversizedRows.delete(sourceRow));

    // The frozen overlays rendered before the final set of records was known, so they join the
    // re-apply. Writing to them cannot ratchet — this draw's measurement is finished, and the next
    // clears and re-renders them before measuring again. The master joins only if that re-measure
    // actually recorded something; otherwise the release above already left it at the right height
    // and a second full pass over its rows would write every one of them for nothing.
    reapplyTargets.push(...frozenTables);

    if (masterRecordedRows.size > 0) {
      reapplyTargets.push(table);
    }
  }

  if (recordedRows.size > 0 || heightsChanged) {
    reapplyTargets.forEach((target) => {
      if (target) {
        applyRowHeightsToRenderedRows(target);
      }
    });
  }

  if (heightsChanged || hadStaleRowCacheBuild) {
    // The summed row heights behind the scrollbar changed after `wtOverlays.refresh()` sized the
    // elements for this draw, so that sizing is stale. Gated on a real change: `adjustElementsSize`
    // walks every column (`sumCellSizes` must stay a live walk) and resizes three overlays.
    wtOverlays.adjustElementsSize();

    return true;
  }

  return false;
}

/**
 * Resets cache of row heights. The cache should be cached for each render cycle in a case
 * when new cell values have content which increases/decreases cell height.
 *
 * Returns the wiped `oversizedRows` records of the rendered band, so `markOversizedRows` can
 * tell a re-detected UNCHANGED height (no row-height cache invalidation needed) from a genuine
 * change. Keys are deleted, not set to `undefined`, so the row-height cache's uniform fast path
 * can re-engage once no oversized records remain.
 *
 * @param {Table} table The table (master or bottom clone) whose rendered band is reset.
 * @returns {Map<number, number>|undefined} The previous oversized heights of the rendered band,
 *   keyed by source row index, or `undefined` when this table does not measure oversized rows.
 */
export function resetOversizedRows(table: Table): Map<number, number> | undefined {
  const { wtSettings } = table;
  const wtViewport = table.deps.getWtViewport();

  if (!table.isMaster && !table.is(CLONE_BOTTOM)) {
    return undefined;
  }

  if (wtSettings.getSetting('externalRowCalculator')) {
    return undefined;
  }

  const rowsToRender = table.getRenderedRowsCount();
  const wipedOversizedRows = new Map<number, number>();

  // Reset the oversized row cache for rendered rows
  for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
    const sourceRow = table.rowFilter!.renderedToSource(visibleRowIndex);
    const previousHeight = wtViewport.oversizedRows?.[sourceRow];

    // A frozen-derived record is exempt: this table does not render the column the height came from,
    // so it could not put the record back, and the row-height cache and the viewport calculators are
    // both built from this map before the frozen overlays have even rendered.
    // `resetFrozenOversizedRows` clears these later in the draw instead.
    if (previousHeight && !wtViewport.frozenOversizedRows.has(sourceRow)) {
      wipedOversizedRows.set(sourceRow, previousHeight);
      delete wtViewport.oversizedRows[sourceRow];
    }
  }

  return wipedOversizedRows;
}

/**
 * Clears the frozen-derived oversized-row records that this draw is about to re-measure, and returns
 * their previous heights so the frozen sync can tell an unchanged row from a changed one.
 *
 * Timing is the whole point. This runs in the seam between the master's render and the frozen
 * overlays' — after the master rendered (so it used the correct, still-recorded heights, and no row
 * drifts on this frame), after the row-height cache and the viewport calculators were built from
 * them, and before the inline-start overlays render, so those render at their natural content height
 * and stay re-measurable rather than being forced to the cached height and ratcheting.
 *
 * Only the rows this draw will re-measure are cleared: the master's rendered band (which the
 * inline-start clone mirrors) plus the frozen top and bottom rows (which the corner overlays hold).
 * A frozen-derived record for any other row is left alone — nothing would put it back, and the
 * summed row heights behind the scrollbar need it.
 *
 * @param {Table} table The master table.
 * @returns {Map<number, number>|undefined} The cleared heights by source row, or `undefined` when
 *   there was nothing recorded.
 */
export function resetFrozenOversizedRows(table: Table): Map<number, number> | undefined {
  const wtViewport = table.deps.getWtViewport();
  const { frozenOversizedRows } = wtViewport;

  if (frozenOversizedRows.size === 0) {
    return undefined;
  }

  // The window where `oversizedRows` is short of every frozen-derived height opens here. Anything
  // that builds the row-height cache before the sync closes it gets a prefix sum missing them all.
  wtViewport.frozenClearRowCacheBuildSeq = wtViewport.rowHeightCache.buildSeq;

  const { wtSettings } = table;
  const wipedRows = new Map<number, number>();
  const clear = (sourceRow: number) => {
    if (!frozenOversizedRows.has(sourceRow)) {
      return;
    }

    const previousHeight = wtViewport.oversizedRows[sourceRow];

    if (previousHeight !== undefined) {
      wipedRows.set(sourceRow, previousHeight);
    }

    delete wtViewport.oversizedRows[sourceRow];
    frozenOversizedRows.delete(sourceRow);
  };

  const rowsToRender = table.getRenderedRowsCount();

  for (let renderedRowIndex = 0; renderedRowIndex < rowsToRender; renderedRowIndex++) {
    clear(table.rowFilter!.renderedToSource(renderedRowIndex));
  }

  const totalRows = wtSettings.getSetting<number>('totalRows');
  const fixedRowsTop = wtSettings.getSetting<number>('fixedRowsTop');
  const fixedRowsBottom = wtSettings.getSetting<number>('fixedRowsBottom');

  for (let row = 0; row < fixedRowsTop; row++) {
    clear(row);
  }

  for (let row = Math.max(0, totalRows - fixedRowsBottom); row < totalRows; row++) {
    clear(row);
  }

  return wipedRows;
}

/**
 * Check if any of the rendered rows is higher than expected, and if so, cache them.
 *
 * The row-height position cache is invalidated only when the measured heights genuinely differ
 * from the records `resetOversizedRows` wiped before this render: a new oversized row, a changed
 * height, or a previously oversized row that shrank back. A steady-state redraw of the same tall
 * rows re-records the same values and keeps the cache intact, avoiding an O(totalRows) prefix-sum
 * rebuild on every full draw.
 *
 * @param {Table} table The table (master or bottom clone) whose rendered rows are measured.
 * @param {Map<number, number>} [wipedOversizedRows] The oversized heights recorded before this
 *   render, as returned by `resetOversizedRows`.
 * @param {object} [frozenPass] Options used only by the frozen-column row sync.
 * @param {boolean} [frozenPass.deferShrinkDetection=false] When `true`, a wiped record this table could not
 *   re-detect is NOT treated as a shrunk row. The master passes this when the frozen-column row
 *   sync runs later in the same draw: those records belong to rows whose tall content lives only in
 *   the inline-start clone, so only that pass can tell "shrank back" from "the master never renders
 *   it". Without the deferral a steady-state redraw would invalidate the row-height cache twice per
 *   draw — and with a non-uniform row-size source each invalidation costs a full prefix-sum walk.
 *   The caller keeps the map and must settle whatever is left in it.
 * @param {Set<number>} [frozenPass.recordedRows] Filled with the source index of every row this call recorded.
 *   The frozen sync marks exactly these as frozen-derived — a row that is oversized for a reason the
 *   MASTER can see is not recorded here (the measured height does not exceed what is already known),
 *   and must stay the master's to own. Adopting it would be fatal: the frozen overlays cannot
 *   re-detect a height they never saw, so it would read as "shrank" on the next draw.
 * @returns {boolean} `true` when this call invalidated the row-height cache. The frozen-column row
 *   sync reads it: an invalidation there lands AFTER `wtOverlays.refresh()` sized the overlay
 *   elements for the draw, so it has to re-size them.
 */
export function markOversizedRows(
  table: Table,
  wipedOversizedRows?: Map<number, number>,
  { deferShrinkDetection = false, recordedRows }: FrozenPassOptions = {},
): boolean {
  if (table.wtSettings.getSetting('externalRowCalculator')) {
    return false;
  }
  let rowCount = table.TBODY!.childNodes.length;
  const stylesHandler = table.wtSettings.getSetting('stylesHandler');
  const expectedTableHeight = rowCount * stylesHandler.getDefaultRowHeight();
  const actualTableHeight = table.deps.geometryReader.innerHeight(table.TBODY!) - 1;
  const borderBoxSizing = stylesHandler.areCellsBorderBox();
  const rowHeightFn = borderBoxSizing
    ? (element: HTMLElement) => table.deps.geometryReader.outerHeight(element)
    : (element: HTMLElement) => table.deps.geometryReader.innerHeight(element);
  const borderCompensation = borderBoxSizing ? 0 : 1;
  const firstRowBorderCompensation = borderBoxSizing ? 1 : 0;
  let previousRowHeight;
  let rowCurrentHeight;
  let sourceRowIndex;
  let currentTr;
  let rowHeader;

  if (expectedTableHeight === actualTableHeight && !table.wtSettings.getSetting('fixedRowsBottom')) {
    // If the actual table height equals rowCount * default single row height, no row is oversized -> no need to iterate over them.
    // Rows that WERE oversized before this render shrank back to the default height, so their
    // cached heights are stale and the row-height cache must still be dropped.
    if (!deferShrinkDetection && wipedOversizedRows !== undefined && wipedOversizedRows.size > 0) {
      table.deps.getWtViewport().invalidateRowHeightCache();

      return true;
    }

    return false;
  }

  const wtViewport = table.deps.getWtViewport();
  let hasChanges = false;

  while (rowCount) {
    rowCount -= 1;
    sourceRowIndex = table.rowFilter!.renderedToSource(rowCount);
    previousRowHeight = table.getRowHeight(sourceRowIndex);
    currentTr = table.getTrForRow(sourceRowIndex);
    rowHeader = currentTr.querySelector('th');

    // Use the rendered row index (rowCount === 0 is always the first <tr> in this tbody),
    // not the source row index (which would be wrong for clones whose first rendered row
    // has a different source index). Any tbody's first <tr> gets border-top: 1px from the
    // tr:first-child CSS rule, so the compensation applies regardless of source identity.
    const topBorderCompensation = rowCount === 0 ? firstRowBorderCompensation : 0;

    if (rowHeader) {
      rowCurrentHeight = rowHeightFn(rowHeader);

    } else {
      rowCurrentHeight = rowHeightFn(currentTr) - borderCompensation;
    }

    if (
      !previousRowHeight &&
      stylesHandler.getDefaultRowHeight() < rowCurrentHeight - topBorderCompensation ||
      (previousRowHeight !== undefined && previousRowHeight < rowCurrentHeight)
    ) {
      if (!borderBoxSizing) {
        rowCurrentHeight += 1;
      }

      wtViewport.oversizedRows[sourceRowIndex] = rowCurrentHeight;
      recordedRows?.add(sourceRowIndex);

      const wipedHeight = wipedOversizedRows?.get(sourceRowIndex);

      // Re-detecting the height that was already recorded before this render is not a change —
      // the row-height cache still holds the correct value. A ±1px difference is the
      // first-rendered-row border compensation flipping as the band boundary moves (the same
      // row measures 1px taller while it is the band's first <tr>, see the `tr:first-child`
      // compensation above); `Viewport#sumRowHeights` re-reads the boundary rows live for
      // exactly this reason, so it is measurement noise, not a content change.
      if (wipedHeight === undefined || Math.abs(rowCurrentHeight - wipedHeight) > 1) {
        hasChanges = true;
      }

      wipedOversizedRows?.delete(sourceRowIndex);
    }
  }

  // Any wiped record not re-detected above belongs to a row that shrank back to its provided
  // height — a height change, even though no new record was written. Unless the caller deferred:
  // then the leftovers may simply be rows this table does not render, and it settles them.
  if (!deferShrinkDetection && wipedOversizedRows !== undefined && wipedOversizedRows.size > 0) {
    hasChanges = true;
  }

  if (hasChanges) {
    // Go through the Viewport method (not `rowHeightCache.invalidate()` directly) so the per-draw
    // layout snapshot is dropped too — otherwise later snapshot readers in the same draw would use
    // the pre-measurement scrollbar state after the content height changed.
    wtViewport.invalidateRowHeightCache();
  }

  return hasChanges;
}
