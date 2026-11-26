import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import type { Bundle } from '../bundle';

/**
 * Page Object for the fixture that detaches a nested row while a HyperFormula engine is attached.
 */
export class FormulasNestedRowsDetachPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/formulas-nested-rows-detach.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);

    const fixtureError = await this.page.evaluate(() => window.htFixtureError);

    if (fixtureError) {
      throw new Error(`The fixture grid failed to build: ${fixtureError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell, by visual row and column, via its stable test id.
   *
   * @param {number} row The visual row.
   * @param {number} col The visual column.
   * @returns {Locator}
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Detaches one row through Nested Rows' context-menu command.
   *
   * @param {number} row The visual row to detach.
   */
  async detachFromParentViaContextMenu(row: number): Promise<void> {
    await this.cell(row, 0).click({ button: 'right' });
    const menu = this.page.locator('.htContextMenu.handsontable').locator('visible=true');

    await expect(menu).toBeVisible();
    await menu.locator('.ht_master td').filter({ hasText: /^Detach from parent$/ }).click();
    await expect(menu).toBeHidden();
  }

  /**
   * Undoes through the platform-specific Cmd/Ctrl+Z shortcut, from a selected cell of column A.
   */
  async undoWithKeyboard(): Promise<void> {
    await this.cell(0, 0).click();
    await this.page.keyboard.press('ControlOrMeta+z');
  }

  /**
   * Redoes through the platform-specific Cmd/Ctrl+Shift+Z shortcut, from another cell, so the second
   * click does not open the editor of the first.
   */
  async redoWithKeyboard(): Promise<void> {
    await this.cell(1, 0).click();
    await this.page.keyboard.press('ControlOrMeta+Shift+z');
  }

  /**
   * Re-sends the settings, the path a framework wrapper takes on every render.
   */
  async updateSettings(): Promise<void> {
    await this.page.evaluate(() => window.hot.updateSettings({}));
  }

  /**
   * The values the grid shows, by visual row.
   *
   * @returns {Promise<unknown[][]>}
   */
  data(): Promise<unknown[][]> {
    return this.page.evaluate(() => window.hot.getData());
  }

  /**
   * The undo and redo stack lengths.
   *
   * @returns {Promise<{ done: number, undone: number }>}
   */
  stacks(): Promise<{ done: number, undone: number }> {
    return this.page.evaluate(() => {
      const undoRedo = window.hot.getPlugin('undoRedo');

      return { done: undoRedo.doneActions.length, undone: undoRedo.undoneActions.length };
    });
  }

  /**
   * The host's own data array, as plain JSON: what the application reads back.
   *
   * @returns {Promise<unknown[]>}
   */
  hostData(): Promise<unknown[]> {
    return this.page.evaluate(() => JSON.parse(JSON.stringify(window.sourceData)));
  }

  /**
   * What HyperFormula holds for this grid's sheet, serialized.
   *
   * @returns {Promise<unknown[][]>}
   */
  sheetContent(): Promise<unknown[][]> {
    return this.page.evaluate(() => {
      const plugin = window.hot.getPlugin('formulas');

      return plugin.engine!.getSheetSerialized(plugin.sheetId!);
    });
  }
}
