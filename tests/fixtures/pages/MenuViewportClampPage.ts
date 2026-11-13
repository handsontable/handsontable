import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/**
 * Which menu to look at: the context menu, the dropdown menu of a column header, the "Alignment" submenu of
 * the context menu, or the Filters condition list that opens under a condition select of the dropdown menu.
 */
export type MenuKind = 'context' | 'dropdown' | 'submenu' | 'conditions';

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

/**
 * The scroll container of a menu: how tall it shows, how tall its content is, and where it is scrolled to.
 */
export interface MenuScroll {
  clientHeight: number;
  scrollHeight: number;
  scrollTop: number;
  overflowY: string;
  overscrollBehavior: string;
}

// A submenu container carries its parent menu's class as well, and the grid keeps a ghost table of
// the menu's class to measure it with, so the parent menus leave both out.
export const MENU_SELECTOR: Record<MenuKind, string> = {
  context: '.htContextMenu:not([class*="htContextMenuSub_"]):not(.htGhostTable)',
  dropdown: '.htDropdownMenu:not([class*="htDropdownMenuSub_"]):not(.htGhostTable)',
  submenu: '.htContextMenuSub_Alignment',
  conditions: '.htFiltersConditionsMenu:not(.htGhostTable)',
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
  readonly pageWidth: 'fit' | 'wide' | 'locked';
  readonly inset: 'none' | 'start';
  readonly grid: Locator;

  /**
   * Builds the page object for one theme, bundle, direction, and page width.
   *
   * @param {Page} page The Playwright page.
   * @param {string} theme The active theme.
   * @param {Bundle} bundle The active bundle.
   * @param {'ltr' | 'rtl'} dir The document's direction, which the grid follows.
   * @param {'fit' | 'wide' | 'locked'} pageWidth `wide` puts the grid 1000px in from the inline start and the top of a
   * 3000px page, so the window can scroll to it on both axes. `locked` stops the window from scrolling at all.
   * @param {'none' | 'start'} inset `start` shifts the grid 16px in from the inline start, so its edges are
   * not the viewport's.
   */
  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd', dir: 'ltr' | 'rtl' = 'ltr',
    pageWidth: 'fit' | 'wide' | 'locked' = 'fit', inset: 'none' | 'start' = 'none') {
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
   * Reads how much of the menu's content its own scroll container shows, and where it is scrolled to.
   * The container is the menu grid's holder, the element that scrolls once the menu is capped to the
   * viewport.
   *
   * @param {MenuKind} kind The menu.
   * @returns {Promise<MenuScroll>} The holder's client height, content height, scroll offset, and the `overflow-y`
   * written on it inline, which stays what Walkontable wrote (`visible`) until the menu is capped (the computed
   * value is `auto` on some menus whatever the cap does), and the inline `overscroll-behavior`.
   */
  async scrollState(kind: MenuKind): Promise<MenuScroll> {
    return this.page.evaluate((selector) => {
      const holder = document.querySelector<HTMLElement>(`${selector} .ht_master .wtHolder`);

      if (!holder) {
        throw new Error(`No menu holder matches ${selector}`);
      }

      return {
        clientHeight: holder.clientHeight,
        scrollHeight: holder.scrollHeight,
        scrollTop: holder.scrollTop,
        overflowY: holder.style.overflowY,
        overscrollBehavior: holder.style.overscrollBehavior,
      };
    }, MENU_SELECTOR[kind]);
  }

  /**
   * Reads the box of the menu's last item, in viewport coordinates.
   *
   * @param {MenuKind} kind The menu.
   * @returns {Promise<{ top: number, bottom: number }>} The last item's vertical edges.
   */
  async lastItemBox(kind: MenuKind): Promise<{ top: number; bottom: number }> {
    return this.page.evaluate((selector) => {
      const items = document.querySelectorAll(`${selector} .ht_master tbody td[role="menuitem"]`);
      const { top, bottom } = items[items.length - 1].getBoundingClientRect();

      return { top, bottom };
    }, MENU_SELECTOR[kind]);
  }

  /**
   * Drags a finger up the menu: a touch press at its center, a run of moves, and a release, as trusted touch
   * events through CDP. `Input.synthesizeScrollGesture` moved nothing on the CI runners. Chromium only.
   *
   * @param {MenuKind} kind The menu.
   * @param {number} distance How far the finger moves, in pixels.
   */
  async swipeUpOverMenu(kind: MenuKind, distance: number): Promise<void> {
    const box = await this.menu(kind).boundingBox();

    if (!box) {
      throw new Error(`The ${kind} menu has no box`);
    }

    const startX = Math.round(box.x + box.width / 2);
    const startY = Math.round(box.y + box.height / 2);
    const steps = 12;
    const cdp = await this.page.context().newCDPSession(this.page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', y?: number) => cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: y === undefined ? [] : [{ x: startX, y, radiusX: 12, radiusY: 12, force: 1, id: 1 }],
    });

    await touch('touchStart', startY);

    for (let step = 1; step <= steps; step++) {
      await touch('touchMove', Math.round(startY - (distance * step) / steps));
    }

    await touch('touchEnd');
    await cdp.detach();
  }

  /**
   * Shrinks the viewport to just taller than the open menu, so the menu fits it by a margin that any
   * content added later exceeds. The size of a menu depends on the theme, so a fixed viewport height
   * would cap it on one theme and not on another.
   *
   * @param {MenuKind} kind The menu.
   * @param {number} margin How far the viewport stays taller than the menu, in pixels.
   */
  async shrinkViewportAroundMenu(kind: MenuKind, margin = 8): Promise<void> {
    const { height } = await this.geometry(kind);
    const size = this.page.viewportSize()!;

    await this.page.setViewportSize({ width: size.width, height: Math.ceil(height) + margin });
    await expect.poll(() => this.page.evaluate(() => document.documentElement.clientHeight))
      .toBe(Math.ceil(height) + margin);
  }

  /**
   * Moves the selection of the open context menu to its last item, as the End key does. A touch device gives
   * the menu no keyboard focus, so the key itself cannot be pressed there.
   */
  async selectLastContextMenuItem(): Promise<void> {
    await this.page.evaluate(() => {
      // `menu` is the plugin's own, not part of its public typings.
      const plugin = window.hot.getPlugin('contextMenu') as unknown as {
        menu: { hotMenu: { countRows(): number; selectCell(row: number, column: number): boolean } };
      };
      const { hotMenu } = plugin.menu;

      hotMenu.selectCell(hotMenu.countRows() - 1, 0);
    });
  }

  /**
   * Reads the text of the menu's last item.
   *
   * @param {MenuKind} kind The menu.
   * @returns {Promise<string>} The item's text.
   */
  async lastItemText(kind: MenuKind): Promise<string> {
    return this.page.evaluate((selector) => {
      const items = document.querySelectorAll(`${selector} .ht_master tbody td[role="menuitem"]`);

      return items[items.length - 1].textContent ?? '';
    }, MENU_SELECTOR[kind]);
  }

  /**
   * Measures the open dropdown menu again, as the Filters plugin does when its content changes.
   */
  async refreshMenuDimensions(): Promise<void> {
    await this.page.evaluate(() => {
      // `menu` is the plugin's own, not part of its public typings.
      const plugin = window.hot.getPlugin('dropdownMenu') as unknown as { menu: { updateMenuDimensions(): void } };

      plugin.menu.updateMenuDimensions();
    });
  }

  /**
   * Picks a filter condition in the open dropdown menu the way the condition list reports a choice: the select
   * runs its `select` hook, and the Filters plugin shows the condition's inputs and measures the menu again.
   * The list itself is not clicked here: this helper covers the dropdown menu's re-measurement, and the list has its
   * own page object (`FiltersConditionListViewportPage`).
   *
   * @param {string} key The condition's key, such as `contains`.
   * @param {number} inputsCount The number of inputs the condition takes.
   */
  async selectFilterCondition(key: string, inputsCount: number): Promise<void> {
    await this.page.evaluate(([conditionKey, inputs]) => {
      // The component and its select are the plugin's own, not part of its public typings.
      const filters = window.hot.getPlugin('filters') as unknown as {
        components: Map<string, {
          getSelectElement(): { runLocalHooks(name: string, item: unknown): void };
        }>;
      };

      filters.components.get('filter_by_condition')!.getSelectElement()
        .runLocalHooks('select', { key: conditionKey, name: conditionKey, inputsCount: inputs });
    }, [key, inputsCount] as const);
  }

  /**
   * Opens the submenu of a context menu item through the menu's own method, which a hover calls after a delay.
   * A touch device has no hover, and a tap on the row only selects it.
   *
   * @param {string} key The key of the item that has the submenu, such as `alignment`.
   */
  async openContextSubmenu(key: string): Promise<void> {
    await this.page.evaluate((itemKey) => {
      // `menu` is the plugin's own, not part of its public typings.
      const { menu } = window.hot.getPlugin('contextMenu') as unknown as {
        menu: { hotMenu: { getSourceData(): { key?: string }[] }; openSubMenu(row: number): void };
      };
      const row = menu.hotMenu.getSourceData().findIndex(item => item.key === itemKey);

      if (row === -1) {
        throw new Error(`The context menu has no ${itemKey} item`);
      }

      menu.openSubMenu(row);
    }, key);
  }

  /**
   * Sets the scroll offset of the menu's holder from the script, as a scrolled finger or a wheel would.
   *
   * @param {MenuKind} kind The menu.
   * @param {number} scrollTop The offset.
   */
  async setMenuScrollTop(kind: MenuKind, scrollTop: number): Promise<void> {
    await this.page.evaluate(([selector, top]) => {
      document.querySelector<HTMLElement>(`${selector} .ht_master .wtHolder`)!.scrollTop = top as number;
    }, [MENU_SELECTOR[kind], scrollTop] as const);
  }

  /**
   * Scrolls the window down from the script, keeping its horizontal offset, and waits until it got there.
   *
   * @param {number} top The window's new vertical offset.
   */
  async scrollWindowDownTo(top: number): Promise<void> {
    await this.page.evaluate((y) => window.scrollTo(window.scrollX, y), top);
    await expect.poll(() => this.page.evaluate(() => window.scrollY)).toBe(top);
  }

  /**
   * Closes the open menu with Escape and waits until it is gone.
   *
   * @param {MenuKind} kind The menu.
   */
  async closeMenu(kind: MenuKind): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.menu(kind)).toBeHidden();
  }

  /**
   * Reads the box of the "OK" button of the open dropdown menu, in viewport coordinates.
   *
   * @returns {Promise<{ top: number, bottom: number }>} The button's vertical edges.
   */
  async okButtonBox(): Promise<{ top: number; bottom: number }> {
    return this.page.evaluate((selector) => {
      const button = document.querySelector(`${selector} .htUIButtonOK`);

      if (!button) {
        throw new Error('The dropdown menu has no OK button');
      }

      const { top, bottom } = button.getBoundingClientRect();

      return { top, bottom };
    }, MENU_SELECTOR.dropdown);
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
