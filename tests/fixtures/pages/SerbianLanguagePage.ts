import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import './windowTypes';

/**
 * Page Object for the Serbian language code fixture (DEV-1090).
 *
 * The fixture builds one grid with the context menu enabled, using the language code from `?language=`.
 */
export class SerbianLanguagePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture with the given language code.
   */
  async goto(language: 'sr-RS' | 'sr-SP'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/serbian-language.html?theme=${this.theme}&bundle=${this.bundle}&language=${language}`);
    await awaitBundle(this.page);

    // Rethrow a constructor failure as itself, rather than as a cell that never appeared.
    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.grid.locator('.ht_master td').first()).toBeVisible();
  }

  /**
   * Open the context menu on the first cell.
   */
  async openContextMenu(): Promise<void> {
    await this.grid.locator('.ht_master td').first().click({ button: 'right' });
  }

  /**
   * The text of every item of the open context menu.
   */
  contextMenuItems(): Locator {
    return this.page.locator('.htContextMenu .htItemWrapper');
  }

  /**
   * Every `console.warn` message the page logged so far.
   */
  async warnings(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { htWarnings: string[] }).htWarnings);
  }
}
