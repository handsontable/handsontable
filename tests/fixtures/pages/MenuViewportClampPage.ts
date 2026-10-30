import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/**
 * Which menu to look at: the context menu, the dropdown menu of a column header, or the "Alignment"
 * submenu of the context menu.
 */
export type MenuKind = 'context' | 'dropdown' | 'submenu';

/**
 * A menu's box and the viewport it must stay inside, read in one evaluation so a scroll or a
 * re-render cannot land between two reads.
 */
export interface MenuGeometry {
  left: number;
  right: number;
  width: number;
  top: number;
  bottom: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
}

// A submenu container carries its parent menu's class as well, and the grid keeps a ghost table of
// the menu's class to measure it with, so the parent menus leave both out.
const MENU_SELECTOR: Record<MenuKind, string> = {
  context: '.htContextMenu:not([class*="htContextMenuSub_"]):not(.htGhostTable)',
  dropdown: '.htDropdownMenu:not([class*="htDropdownMenuSub_"]):not(.htGhostTable)',
  submenu: '.htContextMenuSub_Alignment',
};

/**
 * Page Object for the menu-viewport-clamp fixture: a grid as narrow as a 320px viewport, whose
 * context menu and dropdown menu fit on neither side of the point they open at. Both menus place
 * themselves through `Positioner`, which is what the geometry here observes.
 */
export class MenuViewportClampPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly dir: 'ltr' | 'rtl';
  readonly pageWidth: 'fit' | 'wide';
  readonly inset: 'none' | 'start';
  readonly grid: Locator;

  /**
   * Builds the page object for one theme, bundle, direction, and page width.
   *
   * @param {Page} page The Playwright page.
   * @param {string} theme The active theme.
   * @param {Bundle} bundle The active bundle.
   * @param {'ltr' | 'rtl'} dir The document's direction, which the grid follows.
   * @param {'fit' | 'wide'} pageWidth `wide` puts the grid 1000px in from the inline start and the top of a
   * 3000px page, so the window can scroll to it on both axes.
   * @param {'none' | 'start'} inset `start` shifts the grid 16px in from the inline start, so its edges are
   * not the viewport's.
   */
  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd', dir: 'ltr' | 'rtl' = 'ltr',
    pageWidth: 'fit' | 'wide' = 'fit', inset: 'none' | 'start' = 'none') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.dir = dir;
    this.pageWidth = pageWidth;
    this.inset = inset;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigates to the fixture and waits for the grid. Theme, bundle, direction, page width, and inset travel
   * as query params, so the fixture loads the matching stylesheet and build.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/menu-viewport-clamp.html?theme=${this.theme}`
      + `&bundle=${this.bundle}&dir=${this.dir}&page=${this.pageWidth}&inset=${this.inset}`);
    // The bundle first, or a slow leg fails pointing at a missing cell instead of the real cause.
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay, by position.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Locator} The cell.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master tbody tr').nth(row).locator('td').nth(col);
  }

  /**
   * Scrolls the window to the grid of the wide page and waits until it got there. The grid is 1000px
   * from the page's inline start, so `x` is 1000 in an LTR document and -1000 in an RTL one, where the
   * window scrolls toward negative offsets, and 1000px from its top.
   *
   * @param {number} x The window's `scrollX` to scroll to.
   * @param {number} y The window's `scrollY` to scroll to.
   */
  async scrollWindowTo(x: number, y = 1000): Promise<void> {
    await this.page.evaluate(([left, top]) => window.scrollTo(left, top), [x, y]);
    await expect.poll(() => this.page.evaluate(() => [window.scrollX, window.scrollY])).toEqual([x, y]);
  }

  /**
   * Opens the dropdown menu of a column header through its button.
   *
   * @param {number} col The visual column index.
   */
  async openDropdownMenu(col: number): Promise<void> {
    await this.grid.locator('.ht_clone_top .changeType').nth(col).click();
    await expect(this.menu('dropdown')).toBeVisible();
  }

  /**
   * Right-clicks a point of the viewport and waits for the context menu.
   *
   * @param {number} x The viewport x of the click.
   * @param {number} y The viewport y of the click.
   */
  async openContextMenuAt(x: number, y: number): Promise<void> {
    await this.page.mouse.click(x, y, { button: 'right' });
    await expect(this.menu('context')).toBeVisible();
  }

  /**
   * The menu container of the given kind.
   *
   * @param {MenuKind} kind The menu.
   * @returns {Locator} The menu container.
   */
  menu(kind: MenuKind): Locator {
    return this.page.locator(MENU_SELECTOR[kind]);
  }

  /**
   * Opens the "Alignment" submenu of the open context menu by hovering its item, and waits for it.
   */
  async openAlignmentSubmenu(): Promise<void> {
    await this.menu('context').getByText('Alignment', { exact: true }).hover();
    await expect(this.menu('submenu')).toBeVisible();
  }

  /**
   * Reads where the menu is, in viewport coordinates, together with the viewport's size.
   *
   * @param {MenuKind} kind The menu.
   * @returns {Promise<MenuGeometry>} The menu's box and the viewport size.
   */
  async geometry(kind: MenuKind): Promise<MenuGeometry> {
    return this.page.evaluate((selector) => {
      const menu = document.querySelector(selector);

      if (!menu) {
        throw new Error(`No menu matches ${selector}`);
      }

      const { left, right, width, top, bottom, height } = menu.getBoundingClientRect();

      return {
        left,
        right,
        width,
        top,
        bottom,
        height,
        viewportWidth: document.documentElement.clientWidth,
        viewportHeight: document.documentElement.clientHeight,
      };
    }, MENU_SELECTOR[kind]);
  }
}
