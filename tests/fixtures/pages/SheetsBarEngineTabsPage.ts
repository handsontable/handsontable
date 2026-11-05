import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/**
 * Page object for the sheets-bar-engine-tabs fixture (fixtures/demo/sheets-bar-engine-tabs.html): a grid
 * with `sheetsBar: true` and no `sheets` setting, whose Formulas plugin gets a HyperFormula instance built
 * from the sheets 'Data', 'Report', and 'Summary'. The fixture records every `console.error` and
 * `console.warn` the page makes.
 */
export class SheetsBarEngineTabsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly bar: Locator;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.bar = page.getByTestId('sheets-bar');
  }

  async goto(): Promise<void> {
    this.page.on('pageerror', error => this.pageErrors.push(error.message));

    await this.page.goto(`/tests/fixtures/demo/sheets-bar-engine-tabs.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    await expect(
      this.tabs().first(),
      this.pageErrors.length > 0 ? `the fixture page threw: ${this.pageErrors.join(' | ')}` : undefined,
    ).toBeVisible();
  }

  /**
   * Every tab of the strip, in the order the strip draws them.
   */
  tabs(): Locator {
    return this.bar.getByTestId(/^sheet-tab-\d+$/);
  }

  /**
   * The tab whose accessible name is the sheet name.
   */
  tabByName(name: string): Locator {
    return this.bar.getByRole('button', { name, exact: true });
  }

  /**
   * Switches sheets with a real click on the tab.
   */
  async clickTab(name: string): Promise<void> {
    await this.tabByName(name).click();
    await expect(this.tabByName(name)).toHaveAttribute('aria-current', 'true');
  }

  /**
   * A data cell by visual row and column, as drawn in the master table.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Clicks a cell, types the value, and commits it with Enter.
   */
  async typeIntoCell(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.type(value);
    await this.page.keyboard.press('Enter');
  }

  consoleMessages(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { consoleMessages: string[] }).consoleMessages);
  }
}
