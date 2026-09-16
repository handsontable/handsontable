import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the full-row / full-column selection highlight fixture (DEV-1176).
 *
 * Custom header padding only reaches the selection edge when `getDimensionsFromHeader` can
 * resolve a header TH. The highlight must then sit on the header's own boundary (first row or
 * column) or straddle the shared gridline (later rows or columns).
 */
export class SelectionHeaderPaddingPage {
  /** Every grid the fixture builds. `goto()` waits for all of them. */
  static readonly GRID_IDS = ['padded', 'line-break', 'nested'];

  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * The grid container carrying the given test id.
   *
   * @param {string} testId The container's test id.
   * @returns {Locator}
   */
  grid(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Selects a whole row through the grid's own API, which is what stamps `ht__selection--rows`.
   *
   * @param {string} name The grid's key in `window.grids`.
   * @param {number} row The visual row index.
   */
  async selectRow(name: string, row: number): Promise<void> {
    await this.page.evaluate(
      ([gridName, r]) => (window as unknown as {
        grids: Record<string, { selectRows: (row: number) => void }>
      }).grids[gridName as string].selectRows(r as number),
      [name, row]
    );
  }

  /**
   * Selects a whole column through the grid's own API, which is what stamps `ht__selection--columns`.
   *
   * @param {string} name The grid's key in `window.grids`.
   * @param {number} column The visual column index.
   */
  async selectColumn(name: string, column: number): Promise<void> {
    await this.page.evaluate(
      ([gridName, c]) => (window as unknown as {
        grids: Record<string, { selectColumns: (column: number) => void }>
      }).grids[gridName as string].selectColumns(c as number),
      [name, column]
    );
  }

  /**
   * Whether `getDimensionsFromHeader` found a header TH for a full-row selection.
   *
   * The old level formula (`columnHeaders.length - headerIndex`) is out of range for `-1`, so this
   * used to return `{ found: false }` even when the grid had row headers (DEV-1176). The method
   * name is kept in the minified bundle (the two `this.getDimensionsFromHeader` call sites), so
   * this works on every theme × bundle leg.
   *
   * @param {string} name The grid's key in `window.grids`.
   * @param {number} row The visual row index.
   * @returns {Promise<{ found: boolean, tagName: string | null }>}
   */
  async rowHeaderDimensions(name: string, row: number): Promise<{ found: boolean; tagName: string | null }> {
    return this.page.evaluate(
      ([gridName, r]) => {
        const hot = (window as unknown as {
          grids: Record<string, {
            view: {
              _wt: {
                selectionManager: {
                  getFocusSelection: () => unknown;
                  getBorderInstance: (selection: unknown) => {
                    getDimensionsFromHeader: (
                      direction: string,
                      fromIndex: number,
                      toIndex: number,
                      headerIndex: number,
                      containerOffset: { top: number; left: number }
                    ) => false | [HTMLElement, number, number];
                  } | null;
                };
              };
            };
          }>
        }).grids[gridName as string];
        const wt = hot.view._wt;
        const focus = wt.selectionManager.getFocusSelection();
        const border = wt.selectionManager.getBorderInstance(focus);

        if (!focus || !border) {
          throw new Error('The focus selection has no border');
        }

        const result = border.getDimensionsFromHeader(
          'rows', r as number, r as number, -1, { top: 0, left: 0 }
        );

        if (result === false) {
          return { found: false, tagName: null };
        }

        return { found: true, tagName: result[0].tagName };
      },
      [name, row]
    );
  }

  /**
   * How far the selection's top edge sits from the selected row header's top boundary, in CSS
   * pixels. `0` means the edge is drawn just inside the header (first body row under a column
   * header). `-1` means it straddles the gridline shared with the row above.
   *
   * Header and border are read in one evaluate on the grid root so a selection render cannot
   * land between the two measurements.
   *
   * @param {string} testId The grid's test id.
   * @param {number} row The visual row index.
   * @returns {Promise<number>}
   */
  async selectionTopOffsetFromRowHeader(testId: string, row: number): Promise<number> {
    return this.grid(testId).evaluate((root, r) => {
      const rows = root.querySelectorAll(
        '.ht_clone_inline_start table.htCore > tbody > tr'
      );
      const headerCells = rows[r as number]?.querySelectorAll('th');
      const header = headerCells?.[headerCells.length - 1];
      const master = root.querySelector('.ht_master');

      if (!header || master === null) {
        throw new Error(`No row header at visual row ${r as number}`);
      }

      const headerTop = header.getBoundingClientRect().top;
      const edges = [...master.querySelectorAll<HTMLElement>('.wtBorder.current')]
        .map(border => border.getBoundingClientRect())
        .filter(rect => rect.width > rect.height && rect.height > 0);

      if (edges.length === 0) {
        throw new Error('The selection drew no horizontal edge');
      }

      const nearest = edges
        .sort((a, b) => Math.abs(a.top - headerTop) - Math.abs(b.top - headerTop))[0];

      return Math.round(nearest.top - headerTop);
    }, row);
  }

  /**
   * How far the selection's start edge sits from the selected column header's start boundary, in
   * CSS pixels. `0` means the edge is drawn just inside the header (first data column behind a
   * row header). `-1` means it straddles the gridline shared with the previous column.
   *
   * Header and border are read in one evaluate on the grid root so a selection render cannot
   * land between the two measurements.
   *
   * @param {string} testId The grid's test id.
   * @param {number} column The visual column index.
   * @returns {Promise<number>}
   */
  async selectionStartOffsetFromColumnHeader(testId: string, column: number): Promise<number> {
    return this.grid(testId).evaluate((root, c) => {
      const headers = root.querySelectorAll(
        '.ht_clone_top table.htCore > thead > tr:last-child > th'
      );
      const header = headers[(c as number) + 1];
      const master = root.querySelector('.ht_master');

      if (!header || master === null) {
        throw new Error(`No column header at visual column ${c as number}`);
      }

      const headerLeft = header.getBoundingClientRect().left;
      const edges = [...master.querySelectorAll<HTMLElement>('.wtBorder.current')]
        .map(border => border.getBoundingClientRect())
        .filter(rect => rect.height > rect.width && rect.width > 0);

      if (edges.length === 0) {
        throw new Error('The selection drew no vertical edge');
      }

      const nearest = edges
        .sort((a, b) => Math.abs(a.left - headerLeft) - Math.abs(b.left - headerLeft))[0];

      return Math.round(nearest.left - headerLeft);
    }, column);
  }

  /**
   * Navigate and wait for every grid to have rendered. The wait is on the overlay clones: the
   * master's header cells are the copies the overlays draw over, so they do not read as visible.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/selection-header-padding.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);

    for (const testId of SelectionHeaderPaddingPage.GRID_IDS) {
      await expect(this.grid(testId).locator('.ht_clone_inline_start')).toBeVisible();
      await expect(this.grid(testId).locator('.ht_clone_top')).toBeVisible();
    }
  }
}
