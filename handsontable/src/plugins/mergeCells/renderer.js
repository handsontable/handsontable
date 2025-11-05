import { isObject } from '../../helpers/object';
import { isSafari } from '../../helpers/browser';
import { sumCellsHeights } from './utils';

/**
 * Creates a renderer object for the `MergeCells` plugin.
 *
 * @private
 * @param {MergeCells} plugin The `MergeCells` plugin instance.
 * @returns {{before: Function, after: Function}}
 */
export function createMergeCellRenderer(plugin) {
  const {
    hot,
  } = plugin;
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
  function before() {}

  /**
   * Runs after the cell is rendered.
   *
   * @private
   * @param {HTMLElement} TD The cell to be modified.
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   */
  function after(TD, row, col) {
    const mergedCell = plugin.mergedCellsCollection.get(row, col);

    if (!isObject(mergedCell)) {
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

    const isVirtualRenderingEnabled = plugin.getSetting('virtualized');
    const renderedRowIndex = rowMapper.getRenderableFromVisualIndex(row);
    const renderedColumnIndex = columnMapper.getRenderableFromVisualIndex(col);

    const maxRowSpan = lastMergedRowIndex - renderedRowIndex + 1; // Number of rendered columns.
    const maxColSpan = lastMergedColumnIndex - renderedColumnIndex + 1; // Number of rendered columns.

    let notHiddenRow = rowMapper.getNearestNotHiddenIndex(origRow, 1);
    let notHiddenColumn = columnMapper.getNearestNotHiddenIndex(origColumn, 1);

    if (isVirtualRenderingEnabled) {
      const overlayName = hot.view.getActiveOverlayName();

      if (!['top', 'top_inline_start_corner'].includes(overlayName)) {
        notHiddenRow = Math.max(notHiddenRow, hot.getFirstRenderedVisibleRow());
      }
      if (!['inline_start', 'top_inline_start_corner', 'bottom_inline_start_corner'].includes(overlayName)) {
        notHiddenColumn = Math.max(notHiddenColumn, hot.getFirstRenderedVisibleColumn());
      }
    }

    const notHiddenRowspan = Math.min(origRowspan, maxRowSpan);
    const notHiddenColspan = Math.min(origColspan, maxColSpan);

    if (notHiddenRow === row && notHiddenColumn === col) {
      TD.setAttribute('rowspan', notHiddenRowspan);
      TD.setAttribute('colspan', notHiddenColspan);

    } else {
      TD.removeAttribute('rowspan');
      TD.removeAttribute('colspan');
      TD.style.display = 'none';
    }
  }

  return { before, after };
}
