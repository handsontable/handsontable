import { type Locator, type Page } from '@playwright/test';
import { assertKnownBundle, awaitBundle, awaitFixtureBuilt } from '../bundle';

export type CommentsPluginOffHoverLayout = 'plain' | 'sheets';

/**
 * Page object for the comments-plugin-off-hover fixture (fixtures/demo/comments-plugin-off-hover.html):
 * cell (0, 0) carries a comment shown 300 ms after the pointer rests on it, on a plain grid (`plain`)
 * or on sheet 'Alpha' of a workbook whose sheet 'Beta' turns the plugin off (`sheets`). The spec
 * installs `page.clock` before `goto()`, so the display delay is crossed on demand.
 */
export class CommentsPluginOffHoverPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    assertKnownBundle(bundle, '(page, theme, bundle)');
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  async goto(layout: CommentsPluginOffHoverLayout): Promise<void> {
    this.page.on('pageerror', error => this.pageErrors.push(error.message));

    await this.page.goto(
      `/tests/fixtures/demo/comments-plugin-off-hover.html?theme=${this.theme}&bundle=${this.bundle}&layout=${layout}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
  }

  /**
   * The comment editor's outer element.
   */
  get editor(): Locator {
    return this.page.locator('.htComments');
  }

  /**
   * A data cell by visual row and column, as drawn in the master table.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * An element below the grid, for moving the pointer off it.
   */
  get outside(): Locator {
    return this.page.getByTestId('outside');
  }

  /**
   * Rests the pointer on the commented cell, which arms the delayed show.
   */
  async hoverCommentedCell(): Promise<void> {
    await this.cell(0, 0).hover();
  }

  /**
   * Turns the Comments plugin off through `updateSettings()`.
   */
  async turnCommentsOff(): Promise<void> {
    await this.page.evaluate(() => window.hot.updateSettings({ comments: false }));
  }

  /**
   * Switches to a sheet through the API.
   */
  async openSheet(name: string): Promise<void> {
    await this.page.evaluate(sheetName => window.hot.getPlugin('sheetsBar').setActiveSheet(sheetName), name);
  }

  /**
   * Whether the Comments plugin is enabled.
   */
  async isCommentsEnabled(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('comments').enabled);
  }
}
