import { isObject } from '../../helpers/object';

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
