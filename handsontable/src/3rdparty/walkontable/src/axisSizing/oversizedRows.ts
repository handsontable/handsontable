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
 * getter. They belong to the `axisSizing` slice: together with `positionCache.ts` and
 * `sizeGetters.ts` they own the "how tall is a row really" answer.
 */
import { isHTMLElement } from '../../../../helpers/dom/element';
import { CLONE_BOTTOM } from '../overlay';
import type { default as Table } from '../table/baseTable';

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

    if (previousHeight) {
      wipedOversizedRows.set(sourceRow, previousHeight);
      delete wtViewport.oversizedRows[sourceRow];
    }
  }

  return wipedOversizedRows;
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
 */
export function markOversizedRows(table: Table, wipedOversizedRows?: Map<number, number>): void {
  if (table.wtSettings.getSetting('externalRowCalculator')) {
    return;
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
    if (wipedOversizedRows !== undefined && wipedOversizedRows.size > 0) {
      table.deps.getWtViewport().invalidateRowHeightCache();
    }

    return;
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
  // height — a height change, even though no new record was written.
  if (wipedOversizedRows !== undefined && wipedOversizedRows.size > 0) {
    hasChanges = true;
  }

  if (hasChanges) {
    // Go through the Viewport method (not `rowHeightCache.invalidate()` directly) so the per-draw
    // layout snapshot is dropped too — otherwise later snapshot readers in the same draw would use
    // the pre-measurement scrollbar state after the content height changed.
    wtViewport.invalidateRowHeightCache();
  }
}
