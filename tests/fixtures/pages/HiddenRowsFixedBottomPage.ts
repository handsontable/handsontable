import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for hiding rows next to the `fixedRowsBottom` band.
 *
 * The grid has 50 rows with 2 frozen at the bottom (visual rows 48 and 49), so visual row 47 is the
 * last scrollable row: hiding it moves the selection into the bottom band. Row headers are stamped
 * with their visual index (`rowheader-<row>`), so the label a user sees is that index plus one.
 */
export class HiddenRowsFixedBottomPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly menu: Locator;
  /**
   * Errors the page reported since this page object was created.
   */
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.menu = page.locator('.htContextMenu.handsontable');

    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture, wait for the bundle, and rethrow a constructor failure as itself.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/hidden-rows-fixed-bottom.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Grid failed to initialize: ${initError}`);
    }

    await expect(this.rowHeader(5)).toBeVisible();
  }

  /**
   * Scroll the viewport to its bottom edge, so the last scrollable row sits right above the
   * bottom band, and wait until that row's header is rendered.
   */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.scrollViewportTo({ row: 47, verticalSnap: 'bottom' });
    });
    await expect(this.rowHeader(47)).toBeVisible();
  }

  /**
   * The visible header of a scrollable row. Row headers render in the inline-start overlay, which
   * covers the master copy.
   *
   * @param {number} row Visual row index.
   * @returns {Locator}
   */
  rowHeader(row: number): Locator {
    return this.grid.locator('.ht_clone_inline_start').getByTestId(`rowheader-${row}`);
  }

  /**
   * The visible header of a row in the bottom band (the bottom inline-start corner overlay).
   *
   * @param {number} row Visual row index.
   * @returns {Locator}
   */
  bottomBandRowHeader(row: number): Locator {
    return this.grid.locator('.ht_clone_bottom_inline_start_corner').getByTestId(`rowheader-${row}`);
  }

  /**
   * Select the rows `first` to `last` through their headers (a click, then a Shift+click for a
   * range), right-click the last header and click "Hide row" ("Hide rows" for a range) in the
   * context menu that opens. The item runs its command inside the click, so it has finished (or
   * thrown) when this resolves. It does not wait for the menu to close: a command that throws
   * leaves it open, and the spec asserts the error first so that is what a failure reports.
   *
   * @param {number} first Visual row index of the first header to select.
   * @param {number} [last] Visual row index of the last header; defaults to `first`.
   */
  async hideRowsFromHeaderMenu(first: number, last: number = first): Promise<void> {
    if (last === first) {
      await this.rowHeader(first).click();
    } else {
      await this.rowHeader(first).click();
      await this.rowHeader(last).click({ modifiers: ['Shift'] });
    }

    await this.rowHeader(last).click({ button: 'right' });
    await expect(this.menu).toBeVisible();
    await this.menu.locator('td').filter({ hasText: /^Hide rows?$/ }).click();
  }

  /**
   * Visual indexes of the rows the HiddenRows plugin hides.
   *
   * @returns {Promise<number[]>}
   */
  async hiddenRows(): Promise<number[]> {
    return this.page.evaluate(() => window.hot.getPlugin('hiddenRows').getHiddenRows());
  }

  /**
   * The focused row of the active selection layer, and whether the HiddenRows plugin hides it.
   *
   * @returns {Promise<{ row: number | null, isHidden: boolean }>}
   */
  async selectedRow(): Promise<{ row: number | null, isHidden: boolean }> {
    return this.page.evaluate(() => {
      const row = window.hot.getSelectedRangeActive()?.highlight.row ?? null;

      return { row, isHidden: row !== null && window.hot.getPlugin('hiddenRows').isHidden(row) };
    });
  }

  /**
   * Where the browser focus is: the coordinates of the focused cell, and whether that cell is the
   * bottom inline-start corner overlay's copy. `null` when the focus is not on a cell of this grid
   * (a cell of the context menu, for one, has no coordinates here).
   *
   * @returns {Promise<{ row: number, col: number, inBottomBand: boolean } | null>}
   */
  async focusedCell(): Promise<{ row: number, col: number, inBottomBand: boolean } | null> {
    return this.page.evaluate(() => {
      const element = document.activeElement;

      if (!element || element.tagName !== 'TD') {
        return null;
      }

      const coords = window.hot.getCoords(element);

      if (coords === null) {
        return null;
      }

      return {
        row: coords.row,
        col: coords.col,
        inBottomBand: element.closest('.ht_clone_bottom_inline_start_corner') !== null,
      };
    });
  }
}
