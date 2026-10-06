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
  readonly errors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.menu = page.locator('.htContextMenu.handsontable');

    page.on('pageerror', error => this.errors.push(error.message));
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
      (window as any).hot.scrollViewportTo({ row: 47, verticalSnap: 'bottom' });
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
   * Right-click a row header and click "Hide row" in the context menu that opens. The item runs
   * its command inside the click, so it has finished (or thrown) when this resolves. It does not
   * wait for the menu to close: a command that throws leaves it open, and the spec asserts the
   * error first so that is what a failure reports.
   *
   * @param {number} row Visual row index whose header to right-click.
   */
  async hideRowFromHeaderMenu(row: number): Promise<void> {
    await this.rowHeader(row).click({ button: 'right' });
    await expect(this.menu).toBeVisible();
    await this.menu.locator('td').filter({ hasText: /^Hide row$/ }).click();
  }

  /**
   * Select a range and run the HiddenRows "Hide" context-menu command on it, the same callback the
   * menu item calls. This is API coverage: for a selection not made by a row header the menu does
   * not offer the item, but `executeCommand()` runs it anyway. The command runs synchronously, so
   * an error it throws is recorded with the page errors instead of rejecting this call.
   *
   * @param {number[]} range `[row, column, toRow, toColumn]` passed to `selectCell()`.
   */
  async hideSelectionByCommand(range: [number, number, number, number]): Promise<void> {
    const thrown = await this.page.evaluate(([row, column, toRow, toColumn]) => {
      const hot = (window as any).hot;

      hot.selectCell(row, column, toRow, toColumn);

      try {
        hot.getPlugin('contextMenu').executeCommand('hidden_rows_hide');
      } catch (error) {
        return String((error as Error).message);
      }

      return null;
    }, range);

    if (thrown !== null) {
      this.errors.push(thrown);
    }
  }

  /**
   * Errors the page reported since this page object was created, plus any error the command run
   * by `hideSelectionByCommand()` threw.
   *
   * @returns {string[]}
   */
  pageErrors(): string[] {
    return [...this.errors];
  }

  /**
   * Visual indexes of the rows the HiddenRows plugin hides.
   *
   * @returns {Promise<number[]>}
   */
  async hiddenRows(): Promise<number[]> {
    return this.page.evaluate(() => (window as any).hot.getPlugin('hiddenRows').getHiddenRows());
  }

  /**
   * The focused row of the active selection layer, and whether the HiddenRows plugin hides it.
   *
   * @returns {Promise<{ row: number, isHidden: boolean }>}
   */
  async selectedRow(): Promise<{ row: number, isHidden: boolean }> {
    return this.page.evaluate(() => {
      const hot = (window as any).hot;
      const row = hot.getSelectedRangeActive().highlight.row;

      return { row, isHidden: hot.getPlugin('hiddenRows').isHidden(row) };
    });
  }

  /**
   * Where the browser focus is: the coordinates of the focused cell, and whether that cell is the
   * bottom inline-start corner overlay's copy. `null` when no cell holds the focus.
   *
   * @returns {Promise<{ row: number, col: number, inBottomBand: boolean } | null>}
   */
  async focusedCell(): Promise<{ row: number, col: number, inBottomBand: boolean } | null> {
    return this.page.evaluate(() => {
      const hot = (window as any).hot;
      const element = document.activeElement;

      if (!element || element.tagName !== 'TD') {
        return null;
      }

      const { row, col } = hot.getCoords(element);

      return { row, col, inBottomBand: element.closest('.ht_clone_bottom_inline_start_corner') !== null };
    });
  }
}
