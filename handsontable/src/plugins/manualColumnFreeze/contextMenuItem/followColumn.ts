import type { HotInstance } from '../../../core/types';

/**
 * Runs a freeze or unfreeze that moves a column, then selects that column where it ended up.
 *
 * The column moves to another visual index, and the selection holds visual coordinates, so without this it stays
 * at the old index and selects whichever column landed there. The column is followed by its physical index. The
 * selection keeps the rows it had, and a column selected through its header stays selected as a whole column.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} column Visual index of the column that is frozen or unfrozen.
 * @param {Function} action Freezes or unfreezes the column.
 */
export function followColumn(hot: HotInstance, column: number, action: () => void): void {
  const physicalColumn = hot.toPhysicalColumn(column);
  const range = hot.getSelectedRangeLast();
  const wasSelectedByHeader = hot.selection.isSelectedByColumnHeader();

  action();

  const newColumn = physicalColumn === null ? null : hot.toVisualColumn(physicalColumn);

  if (!range || newColumn === null || newColumn === column) {
    return;
  }

  if (wasSelectedByHeader) {
    hot.selectColumns(newColumn);

  } else {
    hot.selectCells([[range.from.row, newColumn, range.to.row, newColumn]]);
  }
}
