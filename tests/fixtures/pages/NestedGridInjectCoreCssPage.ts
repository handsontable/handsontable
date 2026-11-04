import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

export type NestedGridSurface = 'editor' | 'contextMenu' | 'dropdownMenu';
export type InjectCoreCssMode = 'off' | 'default';

/**
 * Page Object for the nested-grid-inject-core-css fixture: a grid whose dropdown, autocomplete and
 * handsontable columns, context menu, or dropdown menu with Filters each build a nested grid. One
 * surface is enabled per page, because the core stylesheet is injected at most once per document.
 */
export class NestedGridInjectCoreCssPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate and wait for the grid to render.
   */
  async goto(surface: NestedGridSurface, inject: InjectCoreCssMode = 'off'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/nested-grid-inject-core-css.html?theme=${this.theme}&bundle=${this.bundle}` +
        `&surface=${surface}&inject=${inject}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Open the nested grid of a surface: the dropdown editor's list, the context menu with a submenu, or the
   * dropdown menu with its Filters value list.
   */
  async openNestedGrid(surface: NestedGridSurface): Promise<void> {
    if (surface === 'editor') {
      await this.openListEditor(0, 0);
    } else if (surface === 'contextMenu') {
      await this.openContextMenuWithSubmenu(0, 3);
    } else {
      await this.openDropdownMenuWithValueList(0);
    }
  }

  /**
   * How many core stylesheets Handsontable has injected into the document head.
   */
  async injectedCoreStylesCount(): Promise<number> {
    return this.page.locator('head style#handsontable-core-styles').count();
  }

  /**
   * A data cell of the main grid.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master tbody tr').nth(row).locator('td').nth(col);
  }

  /**
   * Open the editor of a list column and wait for its nested list grid.
   */
  async openListEditor(row: number, col: number): Promise<void> {
    await this.cell(row, col).dblclick();
    await expect(this.page.locator('.handsontableEditor:visible .ht_master .htCore')).toBeVisible();
  }

  /**
   * Close the open editor without saving.
   */
  async closeEditor(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.page.locator('.handsontableEditor:visible')).toBeHidden();
  }

  /**
   * Open the context menu on a cell, then its Alignment submenu, which is a second nested grid.
   */
  async openContextMenuWithSubmenu(row: number, col: number): Promise<void> {
    await this.cell(row, col).click({ button: 'right' });

    const menu = this.page.locator('.htContextMenu:visible');

    await expect(menu).toBeVisible();
    await menu.locator('td', { hasText: 'Alignment' }).hover();
    await expect(this.page.locator('.htContextMenuSub_Alignment:visible')).toBeVisible();
  }

  /**
   * Open a column's dropdown menu and wait for the Filters value list, a nested grid inside it.
   */
  async openDropdownMenuWithValueList(col: number): Promise<void> {
    await this.page.locator('.ht_clone_top thead th').nth(col).locator('.changeType').click();

    const menu = this.page.locator('.htDropdownMenu:visible');

    await expect(menu).toBeVisible();
    await expect(menu.locator('.htUIMultipleSelectHot .ht_master .htCore')).toBeVisible();
  }
}
