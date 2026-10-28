import { type Page, expect } from '@playwright/test';
import { assertKnownBundle, awaitBundle } from '../bundle';
import { ConsoleWarnings } from '../consoleWarnings';

/**
 * The presets of `demo/menu-unresolved-key.html`, by the name the fixture builds them under.
 */
export type MenuPreset = 'bare' | 'filters' | 'filters-typo' | 'typo-only' | 'filters-off' | 'context-menu';

/**
 * Page Object for the "unresolved menu item key" fixture.
 *
 * The warning is raised while a grid is built, so the page object collects console warnings from the
 * moment it is created and builds a preset only when the spec asks. The collected list is filtered to
 * the unresolved-key warning, so unrelated console noise cannot make an assertion pass on its own.
 */
export class MenuUnresolvedKeyPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  private readonly consoleWarnings: ConsoleWarnings;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.consoleWarnings = new ConsoleWarnings(page, 'does not match any available');
  }

  /** Every unresolved-key warning seen so far, in the order the console delivered them. */
  get warnings(): string[] {
    return this.consoleWarnings.matching;
  }

  /** Waits until every warning logged so far has arrived, so a spec can assert that none did. */
  async flushWarnings(): Promise<void> {
    await this.consoleWarnings.flush();
  }

  async goto(): Promise<void> {
    assertKnownBundle(this.bundle, '(page, theme, bundle)');

    await this.page.goto(`/tests/fixtures/demo/menu-unresolved-key.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await this.page.waitForFunction(() => 'buildMenuGrid' in window && 'updateMenuGrid' in window, undefined, { polling: 100 });
  }

  /** Builds one preset on a fresh root element. A constructor throw rejects with its own message. */
  async build(preset: MenuPreset): Promise<void> {
    await this.page.evaluate((name) => {
      (window as unknown as { buildMenuGrid: (preset: string) => boolean }).buildMenuGrid(name);
    }, preset);
    await expect(this.page.getByTestId('grid').locator('.ht_master')).toBeVisible();
  }

  /** Applies one preset's settings to the built grid through `updateSettings()`. */
  async update(preset: MenuPreset): Promise<void> {
    await this.page.evaluate((name) => {
      (window as unknown as { updateMenuGrid: (preset: string) => boolean }).updateMenuGrid(name);
    }, preset);
  }

  /** Opens the column menu through the plugin API and returns the labels of the rows it shows. */
  async openDropdownMenuItems(): Promise<string[]> {
    await this.page.evaluate(() => {
      const hot = (window as unknown as { hot: any }).hot;

      hot.selectCell(0, 0);
      hot.getPlugin('dropdownMenu').open({ top: 60, left: 60 });
    });

    return this.visibleItems('.htDropdownMenu');
  }

  /** Opens the context menu through the plugin API and returns the labels of the rows it shows. */
  async openContextMenuItems(): Promise<string[]> {
    await this.page.evaluate(() => {
      const hot = (window as unknown as { hot: any }).hot;

      hot.selectCell(0, 0);
      hot.getPlugin('contextMenu').open({ top: 60, left: 60 });
    });

    return this.visibleItems('.htContextMenu');
  }

  /**
   * The labels of the menu's own rows.
   *
   * The child chain stops at the menu's own table: the Filters value list is a nested grid inside one
   * of these cells, and a descendant selector would return its rows as menu entries.
   */
  private async visibleItems(menuSelector: string): Promise<string[]> {
    const menu = this.page.locator(`${menuSelector} > .ht_master:visible`);

    await expect(menu).toBeVisible();

    return this.page.evaluate((selector) => {
      const ownTable = document.querySelector(`${selector} > .ht_master table.htCore`);

      if (!ownTable) {
        return [];
      }

      return Array.from(ownTable.querySelectorAll(':scope > tbody > tr > td'))
        .filter(cell => cell.getBoundingClientRect().height > 0)
        .map(cell => (cell.textContent ?? '').trim())
        .filter(label => label.length > 0);
    }, menuSelector);
  }
}
