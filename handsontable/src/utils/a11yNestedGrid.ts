import { A11Y_PRESENTATION } from '../helpers/a11y';
import { removeAttribute, setAttribute } from '../helpers/dom/element';
import type { HotInstance } from '../core/types';

type OwnTable = HotInstance['view']['_wt']['wtTable'];

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
 * Collects the tables a nested grid draws itself: its master table and the clone of every overlay. A grid
 * rendered inside one of its cells has tables of its own, which are not listed.
 *
 * @param {HotInstance} hot The nested Handsontable instance.
 * @returns {OwnTable[]}
 */
function getOwnTables(hot: HotInstance): OwnTable[] {
  const wt = hot.view._wt;
  const tables: OwnTable[] = [wt.wtTable];

  wt.wtOverlays.getOverlays().forEach((overlay) => {
    // `getOverlays()` is typed as `Overlay | Table`, only an overlay owns a clone (absent until it is created).
    if ('clone' in overlay && overlay.clone) {
      tables.push(overlay.clone.wtTable);
    }
  });

  return tables;
}

/**
 * Hides the table markup of a nested grid from assistive technology: marks the `table`, `thead`, and
 * `tbody` of the master table and of every overlay clone of the grid as presentational. Tables rendered inside
 * a cell of the grid are left untouched.
 *
 * @param {HotInstance} hot The nested Handsontable instance.
 */
export function markOwnTablesAsPresentational(hot: HotInstance): void {
  getOwnTables(hot).forEach(wtTable => markTableAsPresentational(wtTable.TABLE));
}

/**
 * Removes the `tabindex` the rendering engine writes on the scroll holders of a nested grid, in its master
 * table and in every overlay clone. A focusable holder between a widget role (`menu`, `listbox`, `grid`) and
 * its items is a child the role does not allow. The holders of a grid rendered inside a cell are left
 * untouched.
 *
 * @param {HotInstance} hot The nested Handsontable instance.
 */
export function removeOwnHoldersTabIndex(hot: HotInstance): void {
  getOwnTables(hot).forEach((wtTable) => {
    if (wtTable.holder) {
      removeAttribute(wtTable.holder, 'tabindex');
    }
  });
}

/**
 * Removes the `tabindex` the rendering engine writes on the drawn body cells of a nested grid, in its master
 * table and in every overlay clone. The cells of a grid rendered inside a cell are left untouched.
 *
 * @param {HotInstance} hot The nested Handsontable instance.
 */
export function removeOwnCellsTabIndex(hot: HotInstance): void {
  getOwnTables(hot).forEach((wtTable) => {
    Array.from(wtTable.TBODY?.children ?? []).forEach((row) => {
      Array.from(row.children).forEach((cell) => {
        if (cell.tagName === 'TD' && cell.hasAttribute('tabindex')) {
          removeAttribute(cell as HTMLElement, 'tabindex');
        }
      });
    });
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
