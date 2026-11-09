import { type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import * as menuItems from './menuItems';

/**
 * The presets of `demo/menu-duplicate-names.html`, by the name the fixture builds them under.
 */
export type DuplicateNamesPreset =
  'context-object' | 'context-array' | 'dropdown-object' | 'context-function-names';

/**
 * Page Object for the "menu items sharing one label" fixture.
 *
 * Every preset configures three custom items labeled `Name`. The page object opens the menu through
 * the plugin API and reads back the labels of the rows it shows.
 */
export class MenuDuplicateNamesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/menu-duplicate-names.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await this.page.waitForFunction(() => 'buildMenuGrid' in window, undefined, { polling: 100 });
  }

  /**
   * Builds one preset on a fresh grid. A constructor throw is rethrown as itself, rather than as a
   * grid that never appeared.
   */
  async build(preset: DuplicateNamesPreset): Promise<void> {
    await this.page.evaluate((name) => {
      (window as unknown as { buildMenuGrid: (preset: string) => boolean }).buildMenuGrid(name);
    }, preset);

    const initError = await this.page.getByTestId('grid').getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.page.getByTestId('grid').locator('.ht_master')).toBeVisible();
  }

  /**
   * Opens the context menu through the plugin API and returns the labels of the rows it shows.
   */
  async openContextMenuItems(): Promise<string[]> {
    await this.page.evaluate(() => {
      const hot = (window as unknown as { hot: any }).hot;

      hot.selectCell(0, 0);
      hot.getPlugin('contextMenu').open({ top: 60, left: 60 });
    });

    return this.visibleItems('.htContextMenu');
  }

  /**
   * Opens the column menu through the plugin API and returns the labels of the rows it shows.
   */
  async openDropdownMenuItems(): Promise<string[]> {
    await this.page.evaluate(() => {
      const hot = (window as unknown as { hot: any }).hot;

      hot.selectCell(0, 0);
      hot.getPlugin('dropdownMenu').open({ top: 60, left: 60 });
    });

    return this.visibleItems('.htDropdownMenu');
  }

  private async visibleItems(menuSelector: string): Promise<string[]> {
    await expect(menuItems.openMenu(this.page, menuSelector)).toBeVisible();

    return menuItems.visibleItemsOf(this.page, menuSelector);
  }
}
