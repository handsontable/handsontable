import { A11Y_PRESENTATION } from '../helpers/a11y';
import { setAttribute } from '../helpers/dom/element';
import type { HotInstance } from '../core/types';

/**
 * Sets `role="presentation"` on a table and on its own `thead` and `tbody` sections. A table rendered inside
 * one of its cells is not reached, because only the direct children of the table are visited.
 *
 * @param {HTMLTableElement} table The table to mark.
 */
function markTableAsPresentational(table: HTMLTableElement): void {
  const [name, value] = A11Y_PRESENTATION();

  setAttribute(table, name, value);

  Array.from(table.children).forEach((section) => {
    if (section.tagName === 'THEAD' || section.tagName === 'TBODY') {
      setAttribute(section as HTMLElement, name, value);
    }
  });
}

/**
 * Hides the table markup of a nested grid from assistive technology: marks the `table`, `thead`, and
 * `tbody` of the master table and of every overlay clone of the grid as presentational. Tables rendered inside
 * a cell of the grid are left untouched.
 *
 * @param {HotInstance} hot The nested Handsontable instance.
 */
export function markOwnTablesAsPresentational(hot: HotInstance): void {
  const wt = hot.view._wt;

  markTableAsPresentational(wt.wtTable.TABLE);

  wt.wtOverlays.getOverlays().forEach((overlay) => {
    // `getOverlays()` is typed as `Overlay | Table`, only an overlay owns a clone (absent until it is created).
    if ('clone' in overlay && overlay.clone) {
      markTableAsPresentational(overlay.clone.wtTable.TABLE);
    }
  });
}

/**
 * Sets `role="presentation"` on the row of a cell. A cell with no row is left alone: a renderer also runs
 * for cells that are not in a table yet, such as the cells AutoColumnSize renders to measure a column.
 *
 * @param {HTMLTableCellElement} TD The cell whose row to mark.
 */
export function markRowAsPresentational(TD: HTMLTableCellElement): void {
  const row = TD.parentElement;

  if (row === null) {
    return;
  }

  const [name, value] = A11Y_PRESENTATION();

  setAttribute(row, name, value);
}
