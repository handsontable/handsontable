import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

/**
 * The layout `window.buildGrid()` builds (see fixtures/demo/sheets-bar-ui.html).
 */
export interface SheetsBarUiConfig {
  sheets?: number;
  activeSheet?: number;
  rtl?: boolean;
  uiContainer?: boolean;
  hidden?: boolean;
  colorScheme?: 'light' | 'dark';
  density?: 'compact' | 'default' | 'comfortable';
  ariaTags?: boolean;
  hostLabel?: string;
}

/**
 * Page object for the sheets bar UI and accessibility fixture (fixtures/demo/sheets-bar-ui.html).
 */
export class SheetsBarUiPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly bar: Locator;
  readonly strip: Locator;
  readonly activeTab: Locator;
  readonly addButton: Locator;
  readonly allButton: Locator;
  readonly renameInput: Locator;
  readonly openMenu: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.bar = page.locator('.ht-sheets-bar');
    this.strip = this.bar.locator('.ht-sheets-bar__tabs');
    this.activeTab = this.strip.locator('.ht-sheets-bar__tab--active');
    this.addButton = this.bar.locator('.ht-sheets-bar__add');
    this.allButton = this.bar.locator('.ht-sheets-bar__all');
    this.renameInput = this.strip.locator('.ht-sheets-bar__tab-rename');
    this.openMenu = page.locator('.htSheetsBarMenu:visible');
  }

  /**
   * Opens the fixture and builds the grid.
   *
   * @param {SheetsBarUiConfig} [config] The layout under test.
   */
  async goto(config: SheetsBarUiConfig = {}): Promise<void> {
    const pageErrors: string[] = [];

    this.page.on('pageerror', error => pageErrors.push(error.message));

    await this.page.goto(`/tests/fixtures/demo/sheets-bar-ui.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await this.page.waitForFunction(() => (window as any).htFixtureReady === true, null, {
      polling: BUNDLE_POLLING_MS,
    });
    await this.page.evaluate(options => (window as any).buildGrid(options), config);

    const buildError = await this.page.evaluate(() => (window as any).htBuildError);

    expect(buildError, 'the grid threw while it was built').toBeUndefined();
    await expect(
      this.tab(0),
      pageErrors.length > 0 ? `the fixture page threw: ${pageErrors.join(' | ')}` : undefined,
    ).toBeAttached();
  }

  /**
   * A sheet tab, by its position in the strip.
   *
   * @param {number} index The tab's position.
   * @returns {Locator} The tab.
   */
  tab(index: number): Locator {
    return this.strip.locator('.ht-sheets-bar__tab').nth(index);
  }

  /**
   * The menu trigger glyph of a tab.
   *
   * @param {number} index The tab's position.
   * @returns {Locator} The chevron.
   */
  chevron(index: number): Locator {
    return this.tab(index).locator('.ht-sheets-bar__tab-chevron');
  }

  /**
   * A row of the open menu, by its text.
   *
   * @param {string} text The row's label.
   * @returns {Locator} The row's cell.
   */
  menuItem(text: string): Locator {
    return this.openMenu.locator('td', { hasText: text }).first();
  }

  /**
   * Shows the container a `hidden` build put the grid in.
   */
  async showHost(): Promise<void> {
    await this.page.evaluate(() => (window as any).showHost());
  }

  /**
   * Switches sheets through the API.
   *
   * @param {number} position The sheet's position in the declared `sheets`.
   */
  async setActiveSheet(position: number): Promise<void> {
    await this.page.evaluate((index) => {
      const plugin = (window as any).hot.getPlugin('sheetsBar');

      plugin.setActiveSheet(plugin.getSheets()[index].id);
    }, position);
  }

  /**
   * Whether a tab lies wholly inside the strip's visible part.
   *
   * @param {number} index The tab's position.
   * @returns {Promise<boolean>} `true` when the tab is fully in view.
   */
  tabInStrip(index: number): Promise<boolean> {
    return this.page.evaluate((position) => {
      const strip = document.querySelector('.ht-sheets-bar__tabs') as HTMLElement;
      const tab = strip.querySelectorAll('.ht-sheets-bar__tab')[position] as HTMLElement;
      const stripBox = strip.getBoundingClientRect();
      const tabBox = tab.getBoundingClientRect();

      return tabBox.left >= stripBox.left - 1 && tabBox.right <= stripBox.right + 1;
    }, index);
  }
}
