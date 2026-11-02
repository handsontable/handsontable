import { type Locator, type Page, expect } from '@playwright/test';
import { type Bundle, awaitBundle, awaitFixtureBuilt } from '../bundle';

type FixtureWindow = {
  hot: { loadData(data: unknown[][]): void; updateSettings(settings: object): void };
  data(): unknown[][];
  renderedWidths: number[][];
  fullMeasures: number;
};

/**
 * Page object for `fixtures/demo/nested-headers-autosize-init.html`: collapsible nested headers whose bottom labels
 * are wider than the data, with the default `autoColumnSize`. The fixture records every render's column widths and
 * counts AutoColumnSize's full measurements.
 */
export class NestedHeadersAutosizeInitPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly holder: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.holder = page.locator('.ht_master .wtHolder');
  }

  /**
   * Opens the fixture.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/nested-headers-autosize-init.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.holder).toBeVisible();
  }

  /**
   * Loads the same data again, which makes AutoColumnSize measure every column again.
   */
  async reloadData(): Promise<void> {
    await this.page.evaluate(() => {
      const fixture = window as unknown as FixtureWindow;

      fixture.hot.loadData(fixture.data());
    });
  }

  /**
   * Sends an empty settings update.
   */
  async updateSettings(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as FixtureWindow).hot.updateSettings({});
    });
  }

  /**
   * Every render's column widths, in render order.
   *
   * @returns {Promise<string[]>} One entry per render: the widths joined with commas.
   */
  async widthsPerRender(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).renderedWidths.map(widths => widths.join(',')));
  }

  /**
   * How many times AutoColumnSize has measured every column since the page loaded.
   *
   * @returns {Promise<number>}
   */
  async fullMeasures(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).fullMeasures);
  }
}
