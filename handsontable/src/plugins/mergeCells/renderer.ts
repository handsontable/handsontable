import { isSafari } from '../../helpers/browser';
import { empty, getCellContentRoot } from '../../helpers/dom/element';
import {
  getFirstRowOfActiveBottomOverlay,
  sumCellsHeights,
  isEndColumnOverlay,
  getFirstRenderedRowOfOverlay,
  getFirstRenderedColumnOfOverlay,
  getFrozenColumnBandOfOverlay,
  sumBlockWidthsOutsideBand,
} from './utils';
import type { HotInstance } from '../../core/types';

/**
 * The class of the element that lays out a merged cell's content at the width of the whole block, in a
 * frozen column overlay that renders only part of the block's columns.
 */
const CONTENT_WINDOW_CLASS = 'htMergedCellContentWindow';

/**
 * The content window of each cell that has one. Tracking it per cell, rather than finding it again by its
 * position in the cell, keeps it removable when a hook wraps the cell's content in something else after the
 * plugin ran (a link, for instance), and lets a cell reuse its element on the next paint.
 */
const contentWindows = new WeakMap<HTMLTableCellElement, HTMLElement>();

/**
 * Represents a merged cell entry.
 */
interface MergedCellEntry {
  row: number;
  col: number;
  colspan: number;
  rowspan: number;
}

/**
 * Minimal interface for MergeCells plugin methods used by the renderer.
 */
interface MergeCellsPluginInstance {
  hot: HotInstance;
  mergedCellsCollection: {
    get(row: number, col: number): MergedCellEntry | false;
  };
  translateMergedCellToRenderable(
    row: number, rowspan: number, col: number, colspan: number
  ): [number, number];
  getSetting<T = unknown>(key: string): T;
}

/**
 * Clamps the not-hidden row and column indexes to the virtual viewport boundaries
 * based on the active overlay, ensuring merged cells don't extend beyond the visible area.
 */
function clampToVirtualViewport(
  hot: HotInstance,
  notHiddenRow: number | null,
  notHiddenColumn: number | null,
  clampRow: boolean
): [number | null, number | null] {
  const overlayName = hot.view.getActiveOverlayName();
  const firstRenderedVisibleRow = getFirstRenderedRowOfOverlay(hot, overlayName);
  const firstRenderedVisibleColumn = getFirstRenderedColumnOfOverlay(hot, overlayName);

  if (clampRow && notHiddenRow !== null && firstRenderedVisibleRow !== null) {
    notHiddenRow = Math.max(notHiddenRow, firstRenderedVisibleRow);
  }

  if (notHiddenColumn !== null && firstRenderedVisibleColumn !== null) {
    notHiddenColumn = Math.max(notHiddenColumn, firstRenderedVisibleColumn);
  }

  return [notHiddenRow, notHiddenColumn];
}

/**
 * Creates a renderer object for the `MergeCells` plugin.
 *
 * @private
 */
export function createMergeCellRenderer(plugin: MergeCellsPluginInstance) {
  const hot = plugin.hot;
  const {
    rowIndexMapper: rowMapper,
    columnIndexMapper: columnMapper,
  } = hot;

  /**
   * Runs before the cell is rendered. Puts back the content an earlier paint wrapped, so the cell renderer
   * finds the cell the way it left it: a framework renderer that keeps its DOM checks that its container is
   * still the cell's child, and would otherwise rebuild it on every paint.
   *
   * @private
   * @param {HTMLElement} TD The cell to be rendered.
   */
  function before(TD: HTMLTableCellElement) {
    releaseContentWindow(TD);
  }

  /**
   * Runs after the cell is rendered.
   *
   * @private
   * @param {HTMLElement} TD The cell to be modified.
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   */
  function after(TD: HTMLTableCellElement, row: number, col: number) {
    const mergedCell = plugin.mergedCellsCollection.get(row, col);

    if (mergedCell === false) {
      TD.removeAttribute('rowspan');
      TD.removeAttribute('colspan');

      const heightNextToBlock = getHeightNextToMergedBlock(row, col);

      if (heightNextToBlock !== null) {
        TD.style.height = `${heightNextToBlock}px`;
      }

      TD.style.display = '';

      return;
    }

    const {
      row: origRow,
      col: origColumn,
      colspan: origColspan,
      rowspan: origRowspan,
    } = mergedCell;
    const [
      lastMergedRowIndex,
      lastMergedColumnIndex,
    ] = plugin.translateMergedCellToRenderable(origRow, origRowspan, origColumn, origColspan);
    const isVirtualRenderingEnabled = plugin.getSetting('virtualized');

    const renderedRowIndex = rowMapper.getRenderableFromVisualIndex(row) ?? 0;
    const renderedColumnIndex = columnMapper.getRenderableFromVisualIndex(col) ?? 0;

    const maxRowSpan = lastMergedRowIndex - renderedRowIndex + 1; // Number of rendered columns.
    const maxColSpan = lastMergedColumnIndex - renderedColumnIndex + 1; // Number of rendered columns.

    let notHiddenRow = rowMapper.getNearestNotHiddenIndex(origRow, 1);
    let notHiddenColumn = columnMapper.getNearestNotHiddenIndex(origColumn, 1);

    // The inline-end clone renders only the last columns, so a merge anchored before them has to be
    // drawn from the first end column whether or not the virtualized rendering is on.
    if (isVirtualRenderingEnabled || isEndColumnOverlay(hot.view.getActiveOverlayName())) {
      [notHiddenRow, notHiddenColumn] = clampToVirtualViewport(
        hot, notHiddenRow, notHiddenColumn, !!isVirtualRenderingEnabled
      );
    }

    // A bottom overlay never holds the origin of a block that starts above the frozen bottom rows. Its first
    // row carries the span instead, or the covered cells are all hidden and the row slides out of its columns.
    const firstRowOfBottomOverlay = getFirstRowOfActiveBottomOverlay(hot);

    const continuesAboveBottomOverlay = notHiddenRow !== null && firstRowOfBottomOverlay !== null &&
      firstRowOfBottomOverlay > notHiddenRow;

    if (continuesAboveBottomOverlay) {
      notHiddenRow = firstRowOfBottomOverlay;
    }

    const notHiddenRowspan = Math.min(origRowspan, maxRowSpan);
    const notHiddenColspan = Math.min(origColspan, maxColSpan);

    if (notHiddenRow === row && notHiddenColumn === col) {
      TD.setAttribute('rowspan', String(notHiddenRowspan));
      TD.setAttribute('colspan', String(notHiddenColspan));

      if (continuesAboveBottomOverlay) {
        // The cell only continues a block whose content the master draws. It is painted with the covered
        // cell's own coordinates, so the renderer's output (a checkbox, a long wrapped text) would act on, or
        // size the rows of the clone from, a cell the block does not own.
        empty(getCellContentRoot(TD));
      } else {
        layOutContentAtBlockWidth(TD, origColumn, lastMergedColumnIndex);
      }

    } else {
      TD.removeAttribute('rowspan');
      TD.removeAttribute('colspan');
      TD.style.display = 'none';
    }
  }

  /**
   * Lays the content of a merged block's cell out at the width of the whole block when the overlay being drawn
   * renders a frozen column band that holds only part of the block's columns. The browser cuts such a cell at
   * the edge of the overlay's table, so the content would be aligned and wrapped against the cut width: a
   * right-aligned or centered value showed in the frozen pane and again in the master, and a long value
   * wrapped in the narrow frozen part and made the pane's row taller than the master's. Wrapped in an element
   * as wide as the block (and pulled back by the width of the columns before the band, for the inline-end
   * band), the content lands exactly where the master draws it, and the cell clips it to the pane's part.
   *
   * @param {HTMLTableCellElement} TD The cell that carries the block's span in the overlay.
   * @param {number} origColumn Visual column index of the block's top-left cell.
   * @param {number} lastMergedColumnIndex Renderable index of the block's last column.
   */
  function layOutContentAtBlockWidth(TD: HTMLTableCellElement, origColumn: number, lastMergedColumnIndex: number) {
    const band = getFrozenColumnBandOfOverlay(hot, hot.view.getActiveOverlayName());

    if (band === null) {
      return;
    }

    const firstColumn = columnMapper.getNearestNotHiddenIndex(origColumn, 1);
    const blockStart = firstColumn === null ? null : columnMapper.getRenderableFromVisualIndex(firstColumn);

    if (blockStart === null) {
      return;
    }

    const getRenderableColumnWidth = (renderableColumn: number) => {
      const visualColumn = columnMapper.getVisualFromRenderableIndex(renderableColumn);

      return visualColumn === null ? 0 : hot.getColWidth(visualColumn);
    };
    const { before, after } = sumBlockWidthsOutsideBand(
      blockStart, lastMergedColumnIndex, band, getRenderableColumnWidth
    );

    if (before === 0 && after === 0) {
      return;
    }

    const isRtl = hot.isRtl();
    // Physical sides, not inline ones: a renderer may give the cell its own direction (the numeric and time
    // renderers set `dir="ltr"` in a right-to-left grid), and the block's remaining columns lie on the same
    // side of the pane whatever the cell's direction is.
    const leftOutside = isRtl ? after : before;
    const rightOutside = isRtl ? before : after;
    const contentRoot = getCellContentRoot(TD);
    let contentWindow = contentWindows.get(TD);

    if (contentWindow === undefined) {
      contentWindow = hot.rootDocument.createElement('div');
      contentWindow.className = CONTENT_WINDOW_CLASS;
      contentWindows.set(TD, contentWindow);

    } else if (contentWindow.firstChild) {
      // The cell was emptied after the last paint; what the element still holds is stale.
      empty(contentWindow);
    }

    contentWindow.style.width = `calc(100% + ${leftOutside + rightOutside}px)`;
    contentWindow.style.marginLeft = leftOutside > 0 ? `-${leftOutside}px` : '';
    contentWindow.style.marginRight = rightOutside > 0 ? `-${rightOutside}px` : '';

    while (contentRoot.firstChild) {
      contentWindow.appendChild(contentRoot.firstChild);
    }

    contentRoot.appendChild(contentWindow);
  }

  /**
   * Puts back the content `layOutContentAtBlockWidth` wrapped on an earlier paint of the cell. Most renderers
   * replace the cell's content and drop the wrapper with it, but one that keeps its DOM (a framework
   * component renderer) leaves it in place, and the cell element may now hold another cell or a block that no
   * longer crosses the freeze line. The wrapper is found through the registry, wherever it sits: a hook that
   * wrapped the cell's whole content in a link after the plugin ran moved it under that link. A cell that
   * never had a wrapper answers from the registry alone.
   *
   * @param {HTMLTableCellElement} TD The cell being painted.
   */
  function releaseContentWindow(TD: HTMLTableCellElement) {
    const contentWindow = contentWindows.get(TD);
    const parent = contentWindow?.parentNode;

    if (contentWindow === undefined || !parent) {
      return;
    }

    while (contentWindow.firstChild) {
      parent.insertBefore(contentWindow.firstChild, contentWindow);
    }

    contentWindow.remove();
  }

  /**
   * Returns the height the cell right after a merged block has to carry, or `null` when the cell is
   * not such a neighbor. Without row headers, a block that starts at column 0 owns the row's first
   * cell (the one the engine writes the row height on), so the browser sizes the rows of the block
   * from their next cell instead. The height is derived from the merged collection inside the
   * neighbor's own paint: it holds under `renderMode: 'onChange'` when the origin is skipped, and
   * it goes away with the merge, because a collection change repaints every cell.
   *
   * @private
   * @param {number} row Visual row index of the cell being painted.
   * @param {number} col Visual column index of the cell being painted.
   * @returns {number|null}
   */
  function getHeightNextToMergedBlock(row: number, col: number): number | null {
    if (hot.getSettings().rowHeaders) {
      return null;
    }

    const renderedColumn = columnMapper.getRenderableFromVisualIndex(col);

    if (renderedColumn === null || renderedColumn === 0) {
      return null;
    }

    const previousVisualColumn = columnMapper.getVisualFromRenderableIndex(renderedColumn - 1);
    const blockBefore = previousVisualColumn === null ?
      false : plugin.mergedCellsCollection.get(row, previousVisualColumn);

    if (blockBefore === false || blockBefore.col !== 0) {
      return null;
    }

    const rowHeight = hot._getRowHeightFromSettings(row);

    if (rowHeight !== undefined) {
      return rowHeight - (hot.stylesHandler.areCellsBorderBox() ? 0 : 1);
    }

    if (isSafari()) {
      // Safari bug fix - the height of the cells next to the merged cell must be defined
      // so that their height is proportional to the height of the merged cell
      // (this emulates default behavior in Chrome, FF etc.)
      return sumCellsHeights(hot, blockBefore.row, blockBefore.rowspan) / blockBefore.rowspan;
    }

    return null;
  }

  return { before, after };
}
