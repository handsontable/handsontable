import { type Page, type Locator, expect } from '@playwright/test';

export type SchemaGrid = 'getter' | 'accessor';

/**
 * Page object for the #5833 fixture: two grids with a function `dataSchema`. Cells are addressed
 * by `data-testid="<grid>-cell-<row>-<col>"`; interactions go through the real UI (context menu,
 * Ctrl+Z). Uncaught page errors are collected so a spec can assert the undo did not throw.
 *
 * `window.hotGetter` / `window.hotAccessor` are declared once, in `windowTypes.ts` – the single
 * home of the `Window` augmentation shared by every page object in this directory.
 */
export class UndoRemoveRowSchemaPage {
  /** The Playwright page the fixture is driven through. */
  readonly page: Page;
  /** The active theme, passed through to the fixture URL. */
  readonly theme: string;
  /** The active bundle, passed through to the fixture URL. */
  readonly bundle: string;
  /** Uncaught page errors seen since construction, in the order they fired. */
  readonly pageErrors: string[] = [];

  /**
   * Wires up the page object for one theme/bundle leg and starts collecting uncaught page errors
   * immediately, so a spec that never calls `goto()` before an assertion still sees them.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture and wait for both grids to render (web-first wait on a real DOM
   * condition).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/undo-remove-row-schema.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.cell('getter', 0, 0)).toBeVisible();
    await expect(this.cell('accessor', 0, 0)).toBeVisible();
  }

  /** A single data cell of one grid, by visual row/column, via its stable test id. */
  cell(grid: SchemaGrid, row: number, col: number): Locator {
    return this.page.getByTestId(`${grid}-cell-${row}-${col}`);
  }

  /**
   * Removes a row the way a user does: right-click → "Remove row". Both grids on this fixture
   * keep their own context-menu portal in the DOM, so the selector must be narrowed to the one
   * actually open (the pattern `ColorSchemeDensityPage` uses for the same two-grid situation).
   */
  async removeRowViaContextMenu(grid: SchemaGrid, row: number): Promise<void> {
    await this.cell(grid, row, 0).click({ button: 'right' });
    const menu = this.page.locator('.htContextMenu.handsontable').locator('visible=true');
    await expect(menu).toBeVisible();
    await menu.locator('.ht_master td').filter({ hasText: /^Remove row$/ }).click();
    await expect(menu).toBeHidden();
  }

  /** Undo with the keyboard shortcut (the grid must own focus – a cell click does that). */
  async undoWithKeyboard(grid: SchemaGrid): Promise<void> {
    await this.cell(grid, 0, 0).click();
    await this.page.keyboard.press('ControlOrMeta+z');
  }

  /** The number of rows the given grid currently renders. */
  async rowCount(grid: SchemaGrid): Promise<number> {
    return this.page.evaluate(
      key => (key === 'getter' ? window.hotGetter : window.hotAccessor).countRows(),
      grid,
    );
  }

  /** The number of rows in the given grid's underlying source data. */
  async sourceRowCount(grid: SchemaGrid): Promise<number> {
    return this.page.evaluate(
      key => (key === 'getter' ? window.hotGetter : window.hotAccessor).getSourceData().length,
      grid,
    );
  }

  /** Whether the given grid's UndoRedo plugin is still willing to record new actions. */
  async isUndoRecording(grid: SchemaGrid): Promise<boolean> {
    return this.page.evaluate(
      key => (key === 'getter' ? window.hotGetter : window.hotAccessor).getPlugin('undoRedo').ignoreNewActions === false,
      grid,
    );
  }
}
