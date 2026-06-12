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
  const updateNextCellsHeight = new Map();

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

      if (updateNextCellsHeight.has(row) && !hot.getSettings().rowHeaders) {
        TD.style.height = `${updateNextCellsHeight.get(row)}px`;
        updateNextCellsHeight.delete(row);
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

    if (origColumn === 0 && !hot.getSettings().rowHeaders) {
      const rowHeights = hot._getRowHeightFromSettings(row);

      if (rowHeights !== undefined) {
        const borderBoxSizing = hot.stylesHandler.areCellsBorderBox();
        const borderCompensation = borderBoxSizing ? 0 : 1;

        updateNextCellsHeight.set(row, rowHeights - borderCompensation);

      } else if (isSafari()) {
        // Safari bug fix - the height of the cells next to the merged cell must be defined
        // so that their height is proportional to the height of the merged cell
        // (this emulates default behavior in Chrome, FF etc.)
        const height = sumCellsHeights(hot, origRow, origRowspan);

        updateNextCellsHeight.set(row, height / origRowspan);
      }
    }

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

  return { before, after };
}
