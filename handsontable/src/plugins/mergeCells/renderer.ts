import { isSafari } from '../../helpers/browser';
import { sumCellsHeights } from './utils';
import type { HotInstance } from '../../core/types';

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
  notHiddenColumn: number | null
): [number | null, number | null] {
  const overlayName = hot.view.getActiveOverlayName();

  if (!['top', 'top_inline_start_corner'].includes(overlayName)) {
    const firstRenderedVisibleRow = hot.getFirstRenderedVisibleRow();

    if (notHiddenRow !== null && firstRenderedVisibleRow !== null) {
      notHiddenRow = Math.max(notHiddenRow, firstRenderedVisibleRow);
    }
  }
  if (!['inline_start', 'top_inline_start_corner', 'bottom_inline_start_corner'].includes(overlayName)) {
    const firstRenderedVisibleColumn = hot.getFirstRenderedVisibleColumn();

    if (notHiddenColumn !== null && firstRenderedVisibleColumn !== null) {
      notHiddenColumn = Math.max(notHiddenColumn, firstRenderedVisibleColumn);
    }
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
   * Runs before the cell is rendered.
   *
   * @private
   */
  function before() { // intentionally empty
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

    if (isVirtualRenderingEnabled) {
      [notHiddenRow, notHiddenColumn] = clampToVirtualViewport(
        hot, notHiddenRow, notHiddenColumn
      );
    }

    const notHiddenRowspan = Math.min(origRowspan, maxRowSpan);
    const notHiddenColspan = Math.min(origColspan, maxColSpan);

    if (notHiddenRow === row && notHiddenColumn === col) {
      TD.setAttribute('rowspan', String(notHiddenRowspan));
      TD.setAttribute('colspan', String(notHiddenColspan));

    } else {
      TD.removeAttribute('rowspan');
      TD.removeAttribute('colspan');
      TD.style.display = 'none';
    }
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
