import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';
import { presetKey, presetQuery, type LicensePresetName } from '../licenseTiers';

type PluginsName = 'filters' | 'column-menu' | 'header-checkbox';

/**
 * Page Object for the license capabilities fixture: a grid built with a license key that names a
 * made-up tier (or none), asking for Filters, or Filters and the column menu. The fixture gives each
 * made-up tier the features of its preset (`LICENSE_PRESETS`). A plugin the key's tier leaves out stays
 * off, and one console error and the license bar say which.
 */
export class LicenseCapabilitiesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;
  readonly bar: Locator;
  readonly missingFeatures: Locator;
  readonly salesLink: Locator;
  readonly columnMenuButtons: Locator;
  readonly openColumnMenu: Locator;
  readonly valueList: Locator;
  readonly consoleErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.bar = page.locator('.hot-display-license-info');
    this.missingFeatures = page.locator('.hot-display-license-info_missing-features');
    this.salesLink = this.missingFeatures.getByRole('link', { name: 'sales@handsontable.com' });
    this.columnMenuButtons = page.locator('.ht_clone_top button.changeType');
    this.openColumnMenu = page.locator('.htDropdownMenu:not([class*="htDropdownMenuSub_"]):visible');
    this.valueList = this.openColumnMenu.locator('.htUIMultipleSelectHot');

    // Registered once, from before the first navigation: the license message prints while the grid is
    // built. A listener added per `goto()` recorded every later error once more for each call.
    page.on('console', (message) => {
      if (message.type() === 'error') {
        this.consoleErrors.push(message.text());
      }
    });
  }

  /**
   * Opens the fixture with every preset's tier, the key of one preset and the options the grid asks
   * for, and waits for the grid.
   *
   * @param {object} options The fixture options.
   * @param {string} options.key The preset whose key the grid is built with.
   * @param {string} [options.plugins] The options the grid asks for.
   */
  async goto({ key, plugins = 'filters' }: { key: LicensePresetName; plugins?: PluginsName }): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/license-capabilities.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&${presetQuery(key, plugins)}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.grid.locator('.ht_master td').first()).toBeVisible();
  }

  /**
   * The license messages printed with `console.error`.
   *
   * @returns {string[]}
   */
  licenseErrors(): string[] {
    return this.consoleErrors.filter(text => text.includes('does not include these features'));
  }

  /**
   * The grid's outer height (the root plus its top and bottom slots) and whether the license bar was in the
   * page, read by the fixture in the same task as the constructor.
   *
   * @returns {Promise<{ barMounted: boolean, outerHeight: number }>}
   */
  async sizeAtConstruction(): Promise<{ barMounted: boolean; outerHeight: number }> {
    return this.page.evaluate(() => (window as unknown as {
      sizeAtConstruction: { barMounted: boolean; outerHeight: number };
    }).sizeAtConstruction);
  }

  /**
   * Whether a plugin of the grid is on.
   *
   * @param {string} pluginName The plugin key.
   * @returns {Promise<boolean>}
   */
  async isPluginEnabled(pluginName: string): Promise<boolean> {
    return this.page.evaluate(name => (window as unknown as {
      hot: { getPlugin(n: string): { enabled: boolean } };
    }).hot.getPlugin(name).enabled, pluginName);
  }

  /**
   * The grid's own `filters` setting.
   *
   * @returns {Promise<unknown>}
   */
  async filtersSetting(): Promise<unknown> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getSettings(): { filters: unknown } };
    }).hot.getSettings().filters);
  }

  /**
   * Opens the column menu of the first column from the keyboard (Shift+Alt+ArrowDown on a selected cell).
   */
  async openFirstColumnMenu(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as { hot: { selectCell(r: number, c: number): void } })
      .hot.selectCell(0, 0));
    await this.page.keyboard.press('Shift+Alt+ArrowDown');
    await expect(this.openColumnMenu).toBeVisible();
  }

  /**
   * Passes the key of another preset through `updateSettings()`. The fixture gave every preset's tier
   * its features when it loaded.
   *
   * @param {string} name The preset.
   */
  async updateLicenseKey(name: LicensePresetName): Promise<void> {
    await this.page.evaluate((licenseKey) => {
      (window as unknown as { hot: { updateSettings(settings: object): void } })
        .hot.updateSettings({ licenseKey });
    }, presetKey(name));
  }

  /**
   * Selects the last cell and presses Tab, which moves the focus out of the grid to the next focus scope.
   */
  async tabOutOfLastCell(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as { hot: { selectCell(r: number, c: number): void } })
      .hot.selectCell(2, 1));
    await this.page.keyboard.press('Tab');
  }
}
