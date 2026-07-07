/**
 * Post-render row / column-header measurement for `Table` and every subclass.
 *
 * These read the rendered DOM back after a draw to discover content-driven sizes that exceed the
 * provided ones: `markOversizedRows` records rows taller than their configured height into
 * `wtViewport.oversizedRows`, `adjustColumnHeaderHeights` applies the provided header heights to the
 * THEAD rows, and `syncOversizedColumnHeadersWithFrozenOverlays` keeps the frozen-overlay headers
 * pixel-aligned with the master. They are universal — every table type participates in the draw — so
 * the mixin is applied once to the base `Table` (`mixin(Table, oversizedRows)` in `baseTable.ts`) and
 * inherited by all subclasses.
 *
 * Extracted from `baseTable.ts` (C3) to co-locate the size-measurement logic with the rest of the
 * axis-sizing slice; kept by design (the single-pass work leaves it as the "is a second pass needed?"
 * signal). Behavior is unchanged: the methods run on the `Table` instance (`this`), reading the same
 * public fields (`THEAD`/`TBODY`/`rowFilter`/`wtSettings`/`isMaster`) and the geometry-read port + the
 * overlays/viewport owners via the `deps` getter.
 */
import { isHTMLElement } from '../../../../helpers/dom/element';
import { CLONE_BOTTOM } from '../overlay';
import type { default as Table } from '../table/baseTable';

/**
 * Post-render row / column-header measurement, mixed into every `Table` type.
 */
export interface OversizedRows {
  adjustColumnHeaderHeights(): void;
  syncOversizedColumnHeadersWithFrozenOverlays(): void;
  resetOversizedRows(): void;
  markOversizedRows(): void;
}

const oversizedRows = {
  /**
   * Applies the provided column-header heights to the rendered THEAD rows. The provided height comes
   * from the `columnHeaderHeight` setting funnel (the option, the `modifyColumnHeaderHeight` hook that
   * AutoRowSize feeds, and the Handsontable-side render-size probe for content-driven headers). It is
   * written as `min-height`, never `height`, so a header whose real content is taller (a wrapped or
   * frozen-region header) is not clipped - it still expands to its content, which the frozen-overlay
   * sync then reads. Runs on the master and every clone so all overlays get the same floor.
   *
   * @this Table
   */
  adjustColumnHeaderHeights(this: Table) {
    const { wtSettings } = this;
    const children = this.THEAD!.childNodes;
    const defaultRowHeight = wtSettings.getSetting('stylesHandler').getDefaultRowHeight();
    const columnHeaders = wtSettings.getSetting<Function[]>('columnHeaders');

    for (let i = 0, len = columnHeaders.length; i < len; i++) {
      const headerHeight = this.getColumnHeaderHeight(i);

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
  },

  /**
   * Frozen column headers (e.g., with `white-space: normal`) are rendered only in the frozen
   * overlays, never in the master table's THEAD. When such a header is taller than the headers
   * of the scrollable columns, the master and top overlay THEADs render shorter than the corner
   * and inline-start overlays, so the frozen overlay body rows sit shifted against the master.
   * The gap can be sub-pixel: under browser zoom the frozen header content is a fraction of a
   * pixel taller than the applied height, and that fraction accumulates into a visible 1px shift.
   *
   * This method runs after the frozen overlays have rendered. It reads the corner overlay's
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
   * @this Table
   */
  syncOversizedColumnHeadersWithFrozenOverlays(this: Table): void {
    const wtOverlays = this.deps.getWtOverlays();
    // Cheapest possible bail-out first: with no frozen columns the corner overlay is not cloned,
    // so the overwhelmingly common (non-frozen) grids pay only a couple of property reads per draw.
    const cornerClone = wtOverlays.topInlineStartCornerOverlay?.clone;

    if (!cornerClone?.wtTable?.THEAD) {
      return;
    }

    const columnHeaders = this.wtSettings.getSetting<unknown[]>('columnHeaders');

    if (!columnHeaders.length) {
      return;
    }

    const cornerChildren = cornerClone.wtTable.THEAD.childNodes;
    const topClone = wtOverlays.topOverlay?.clone;
    const targetTheads = [this.THEAD, topClone?.wtTable?.THEAD];
    // Sub-pixel tolerance to avoid rewriting heights on floating-point jitter while still
    // catching the fractional gaps (e.g. ~0.33px at 75% zoom) that read as a 1px shift.
    const epsilon = 0.1;

    for (let i = 0, len = columnHeaders.length; i < len; i++) {
      const cornerChild = cornerChildren[i];

      if (!(cornerChild instanceof HTMLElement)) {
        continue;
      }

      const cornerRowHeight = this.deps.geometryReader.getBoundingClientRect(cornerChild).height;

      targetTheads.forEach((thead) => {
        const targetRow = thead?.childNodes[i];

        if (!(targetRow instanceof HTMLElement) || targetRow.childNodes.length === 0) {
          return;
        }

        const firstChild = targetRow.childNodes[0];

        if (!(firstChild instanceof HTMLElement)) {
          return;
        }

        const targetRowHeight = this.deps.geometryReader.getBoundingClientRect(targetRow).height;

        if (Math.abs(targetRowHeight - cornerRowHeight) > epsilon) {
          firstChild.style.height = `${cornerRowHeight}px`;
        }
      });
    }
  },

  /**
   * Resets cache of row heights. The cache should be cached for each render cycle in a case
   * when new cell values have content which increases/decreases cell height.
   *
   * @this Table
   */
  resetOversizedRows(this: Table) {
    const { wtSettings } = this;
    const wtViewport = this.deps.getWtViewport();

    if (!this.isMaster && !this.is(CLONE_BOTTOM)) {
      return;
    }

    if (!wtSettings.getSetting('externalRowCalculator')) {
      const rowsToRender = this.getRenderedRowsCount();

      // Reset the oversized row cache for rendered rows
      for (let visibleRowIndex = 0; visibleRowIndex < rowsToRender; visibleRowIndex++) {
        const sourceRow = this.rowFilter!.renderedToSource(visibleRowIndex);

        if (wtViewport.oversizedRows && wtViewport.oversizedRows[sourceRow]) {
          wtViewport.oversizedRows[sourceRow] = undefined;
        }
      }
    }
  },

  /**
   * Check if any of the rendered rows is higher than expected, and if so, cache them.
   *
   * @this Table
   */
  markOversizedRows(this: Table) {
    if (this.wtSettings.getSetting('externalRowCalculator')) {
      return;
    }
    let rowCount = this.TBODY!.childNodes.length;
    const stylesHandler = this.wtSettings.getSetting('stylesHandler');
    const expectedTableHeight = rowCount * stylesHandler.getDefaultRowHeight();
    const actualTableHeight = this.deps.geometryReader.innerHeight(this.TBODY!) - 1;
    const borderBoxSizing = stylesHandler.areCellsBorderBox();
    const rowHeightFn = borderBoxSizing
      ? (element: HTMLElement) => this.deps.geometryReader.outerHeight(element)
      : (element: HTMLElement) => this.deps.geometryReader.innerHeight(element);
    const borderCompensation = borderBoxSizing ? 0 : 1;
    const firstRowBorderCompensation = borderBoxSizing ? 1 : 0;
    let previousRowHeight;
    let rowCurrentHeight;
    let sourceRowIndex;
    let currentTr;
    let rowHeader;

    if (expectedTableHeight === actualTableHeight && !this.wtSettings.getSetting('fixedRowsBottom')) {
      // If the actual table height equals rowCount * default single row height, no row is oversized -> no need to iterate over them
      return;
    }

    const wtViewport = this.deps.getWtViewport();
    let hasChanges = false;

    while (rowCount) {
      rowCount -= 1;
      sourceRowIndex = this.rowFilter!.renderedToSource(rowCount);
      previousRowHeight = this.getRowHeight(sourceRowIndex);
      currentTr = this.getTrForRow(sourceRowIndex);
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
        hasChanges = true;
      }
    }

    if (hasChanges) {
      wtViewport.rowHeightCache.invalidate();
    }
  },
};

export default oversizedRows;
