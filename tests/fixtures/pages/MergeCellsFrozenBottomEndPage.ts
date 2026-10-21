import { SelectionFeaturesPage } from './SelectionFeaturesPage';

/**
 * What one overlay renders for a cell: whether it is displayed and the span it carries.
 */
export interface EndOverlayCell {
  displayed: boolean;
  rowspan: string | null;
  colspan: string | null;
  text: string;
}

/**
 * Page Object for a merged block next to `fixedRowsBottom` and `fixedColumnsEnd` together. It extends the
 * selection features page (same fixture, cells stamped with `data-testid="cell-<row>-<col>"`) with the reads
 * that page does not have for the inline-end clones: the overlays it names are only the start ones.
 */
export class MergeCellsFrozenBottomEndPage extends SelectionFeaturesPage {
  /**
   * What a clone (by its CSS class, `ht_clone_bottom_inline_end_corner` for one) renders for `row`/`col`, or
   * `null` when it holds no such cell. Read in one evaluation, because the grid recycles its nodes.
   *
   * @param {string} cloneClass The class of the clone's root element.
   * @param {number} row The visual row.
   * @param {number} col The visual column.
   * @returns {Promise<EndOverlayCell|null>}
   */
  async cloneCell(cloneClass: string, row: number, col: number): Promise<EndOverlayCell | null> {
    return this.page.evaluate(([name, targetRow, targetCol]) => {
      const cell = document.querySelector(`.${name} [data-testid="cell-${targetRow}-${targetCol}"]`);

      if (!cell) {
        return null;
      }

      return {
        displayed: getComputedStyle(cell).display !== 'none',
        rowspan: cell.getAttribute('rowspan'),
        colspan: cell.getAttribute('colspan'),
        text: cell.textContent ?? '',
      };
    }, [cloneClass, row, col] as const);
  }

  /**
   * How far (in px) the inline-start edge of the cell a clone renders for `row`/`col` sits from the inline-start
   * edge of its column header, or `null` while the clone renders no displayed cell there. `0` means the cell is
   * under its own header, in LTR and RTL alike.
   *
   * @param {string} cloneClass The class of the clone's root element.
   * @param {number} row The visual row.
   * @param {number} col The visual column.
   * @returns {Promise<number|null>}
   */
  async offsetFromHeader(cloneClass: string, row: number, col: number): Promise<number | null> {
    return this.page.evaluate(([name, targetRow, targetCol]) => {
      const cell = document.querySelector(`.${name} [data-testid="cell-${targetRow}-${targetCol}"]`);
      const header = window.hot.getCell(-1, targetCol as number, true);

      if (!cell || !header || getComputedStyle(cell).display === 'none') {
        return null;
      }

      const cellBox = cell.getBoundingClientRect();
      const headerBox = header.getBoundingClientRect();

      // The inline-start edges: a cell with a colspan starts at the right in RTL.
      const offset = window.hot.isRtl() ? cellBox.right - headerBox.right : cellBox.left - headerBox.left;

      // `+ 0` turns a rounded -0 into 0.
      return Math.round(offset) + 0;
    }, [cloneClass, row, col] as const);
  }

  /**
   * The columns of a clone's row that are displayed, as the visual column each `data-testid` names.
   *
   * @param {string} cloneClass The class of the clone's root element.
   * @param {number} row The visual row.
   * @returns {Promise<number[]>}
   */
  async displayedColumns(cloneClass: string, row: number): Promise<number[]> {
    return this.page.evaluate(([name, targetRow]) => {
      const cells = document.querySelectorAll(`.${name} [data-testid^="cell-${targetRow}-"]`);

      return Array.from(cells)
        .filter(cell => getComputedStyle(cell).display !== 'none')
        .map(cell => Number(cell.getAttribute('data-testid')!.split('-')[2]));
    }, [cloneClass, row] as const);
  }
}
