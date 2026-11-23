import { A11Y_HIDDEN, A11Y_PRESENTATION } from '../helpers/a11y';
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
 * Hides the wrapper elements of a nested grid from assistive technology: marks as presentational every element
 * between the grid's root element and each of its own tables (the overlay element, the scroll holder, the
 * hider, and the spreader), for the master table and for every overlay clone. The rendering engine writes the
 * same role on them itself only when the nested grid's own `ariaTags` is on, and a list built with it off left
 * them exposed: Chromium reports such wrappers to VoiceOver as groups, so a `listbox` on the root read as a
 * list of one item instead of a list of its options. Tables rendered inside a cell of the grid are not reached.
 *
 * @param {HotInstance} hot The nested Handsontable instance.
 */
export function markOwnWrappersAsPresentational(hot: HotInstance): void {
  const [name, value] = A11Y_PRESENTATION();
  const { rootElement } = hot;

  getOwnTables(hot).forEach((wtTable) => {
    let element = wtTable.TABLE.parentElement;

    while (element !== null && element !== rootElement && rootElement.contains(element)) {
      setAttribute(element, name, value);
      element = element.parentElement;
    }
  });
}

/**
 * Hides the selection borders of a nested grid from assistive technology: sets `aria-hidden="true"` on the
 * element that holds them (`.htBorders`) in the master table and in every overlay clone. The borders draw the
 * highlight of a list option, which the option already exposes, and they sit beside the table inside the
 * widget role, as children the role does not allow. The holder is created on the grid's first draw that lays
 * a border, so call this after every draw.
 *
 * @param {HotInstance} hot The nested Handsontable instance.
 */
export function hideOwnSelectionBorders(hot: HotInstance): void {
  getOwnTables(hot).forEach((wtTable) => {
    const { bordersHolder } = wtTable;

    if (bordersHolder && bordersHolder.getAttribute('aria-hidden') !== 'true') {
      setAttribute(bordersHolder, ...A11Y_HIDDEN());
    }
  });
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
