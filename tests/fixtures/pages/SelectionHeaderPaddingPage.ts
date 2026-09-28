import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the full-row / full-column selection highlight fixture (DEV-1176).
 *
 * Custom header padding only reaches the selection edge when `getDimensionsFromHeader` can
 * resolve a header TH. The regression contract is that lookup (`found: true` plus the measured
 * label). Same-row TH-vs-TD pixel alignment is not the contract: body-cell math lands on the
 * same pixel as a same-row header.
 */
export class SelectionHeaderPaddingPage {
  /** Every grid the fixture builds. `goto()` waits for all of them. */
  static readonly GRID_IDS = ['padded', 'padded-rtl', 'line-break', 'nested'];

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
   * How many row-header levels the named grid renders (`countRowHeaders`).
   *
   * @param {string} name The grid's key in `window.grids`.
   * @returns {Promise<number>}
   */
  async countRowHeaders(name: string): Promise<number> {
    return this.page.evaluate((gridName) => {
      return (window as unknown as {
        grids: Record<string, { countRowHeaders: () => number }>
      }).grids[gridName].countRowHeaders();
    }, name);
  }

  /**
   * Whether `getDimensionsFromHeader` found a header TH for a full-row selection.
   *
   * The old level formula (`columnHeaders.length - headerIndex`) is out of range for `-1`, so this
   * used to return `{ found: false }` even when the grid had row headers (DEV-1176). The method
   * name is kept in the minified bundle (the two `this.getDimensionsFromHeader` call sites), so
   * this works on every theme × bundle leg. `text` is the measured TH's `textContent` — nested row
   * headers use it to prove the closest of two levels was chosen, not just that some TH was found.
   * `innerText` is empty on master header cells because the overlay clones cover them.
   *
   * @param {string} name The grid's key in `window.grids`.
   * @param {number} row The visual row index.
   * @returns {Promise<{ found: boolean, tagName: string | null, text: string | null }>}
   */
  async rowHeaderDimensions(
    name: string,
    row: number,
  ): Promise<{ found: boolean; tagName: string | null; text: string | null }> {
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
          return { found: false, tagName: null, text: null };
        }

        return {
          found: true,
          tagName: result[0].tagName,
          text: (result[0].textContent ?? '').trim(),
        };
      },
      [name, row]
    );
  }

  /**
   * Whether `getDimensionsFromHeader` found a header TH for a full-column selection.
   *
   * Needed in RTL: if lookup fails, `appear()` keeps body-cell math (which is already RTL-aware)
   * and an alignment assertion can pass without ever exercising the header-box path.
   *
   * @param {string} name The grid's key in `window.grids`.
   * @param {number} column The visual column index.
   * @returns {Promise<{ found: boolean, tagName: string | null, text: string | null }>}
   */
  async columnHeaderDimensions(
    name: string,
    column: number,
  ): Promise<{ found: boolean; tagName: string | null; text: string | null }> {
    return this.page.evaluate(
      ([gridName, c]) => {
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
          'columns', c as number, c as number, -1, { top: 0, left: 0 }
        );

        if (result === false) {
          return { found: false, tagName: null, text: null };
        }

        return {
          found: true,
          tagName: result[0].tagName,
          text: (result[0].textContent ?? '').trim(),
        };
      },
      [name, column]
    );
  }

  /**
   * How far the selection's start edge sits from the selected column header's start boundary, in
   * CSS pixels. `0` means the edge is drawn just inside the header (first data column behind a
   * row header). `-1` means it straddles the gridline shared with the previous column.
   *
   * Header and border are read in one evaluate on the grid root so a selection render cannot
   * land between the two measurements. In RTL the start edge is the header's right side — comparing
   * `left` would pass a highlight that `appear()` wrote to `style.right` from left-edge math.
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

      const headerRect = header.getBoundingClientRect();
      const htCore = root.querySelector('.htCore');
      const isRtl = getComputedStyle(htCore ?? root).direction === 'rtl';
      const headerStart = isRtl ? headerRect.right : headerRect.left;
      const edges = [...master.querySelectorAll<HTMLElement>('.wtBorder.current')]
        .map(border => border.getBoundingClientRect())
        .filter(rect => rect.height > rect.width && rect.width > 0);

      if (edges.length === 0) {
        throw new Error('The selection drew no vertical edge');
      }

      const nearest = edges
        .sort((a, b) => {
          const aStart = isRtl ? a.right : a.left;
          const bStart = isRtl ? b.right : b.left;

          return Math.abs(aStart - headerStart) - Math.abs(bStart - headerStart);
        })[0];
      const edgeStart = isRtl ? nearest.right : nearest.left;

      return Math.round(edgeStart - headerStart);
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
