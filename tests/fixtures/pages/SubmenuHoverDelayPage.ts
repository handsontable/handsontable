import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { afterAtLeast } from '../frames';

/**
 * A rectangle in viewport coordinates, plus the vertical middle of each row it contains.
 */
export interface MenuGeometry {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Page Object for the submenu hover-delay fixture (DEV-2861 / DEV-66).
 *
 * Every assertion here depends on the pointer taking a REAL path: the bug is caused by the rows the
 * pointer crosses on its way, so a single jump to the destination proves nothing. `page.mouse.move`
 * is therefore always called with `steps`, which emits the intermediate `mousemove` events a hand
 * would. The legacy Jasmine suite cannot express this at all — it dispatches one synthetic
 * `mouseover` per element — which is why this coverage is Playwright-only.
 */
export class SubmenuHoverDelayPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  /**
   * How many intermediate points a travelling move emits. High enough that the pointer cannot skip
   * a menu row, which is exactly what a hand cannot do either.
   */
  static readonly TRAVEL_STEPS = 25;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture. The theme and bundle travel as query params so the fixture loads the
   * matching stylesheet and Handsontable build — miss either and the leg silently tests something
   * other than what its name says.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/submenu-hover-delay.html?theme=${this.theme}&bundle=${this.bundle}`);
    // The bundle first, or a slow leg fails pointing at a missing cell instead of the real cause.
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay. The menu locators below are deliberately not scoped to the
   * grid container: the menu renders in its own element outside it.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The open "Alignment" submenu, whether or not it is on screen.
   */
  get alignmentSubmenu(): Locator {
    return this.page.locator('.htContextMenuSub_Alignment');
  }

  /**
   * Opens the context menu on a cell in the grid's upper half, so the submenu has room to render
   * below its anchor — the geometry the whole bug depends on.
   */
  async openMenu(): Promise<void> {
    await this.cell(2, 2).click({ button: 'right' });
    await expect(this.page.locator('.htContextMenu').first()).toBeVisible();
  }

  /**
   * The bounding box of a parent-menu item, by its visible label.
   */
  async itemBox(label: string): Promise<MenuGeometry> {
    const box = await this.page.locator('.htContextMenu .ht_master .htCore td')
      .filter({ hasText: new RegExp(`^${label}$`) })
      .first()
      .boundingBox();

    if (!box) {
      throw new Error(`Menu item ${JSON.stringify(label)} has no bounding box`);
    }

    return { left: box.x, right: box.x + box.width, top: box.y, bottom: box.y + box.height };
  }

  /**
   * The parent menu's own bounding box. Used to aim a move that leaves the menu entirely.
   */
  async menuBox(): Promise<MenuGeometry> {
    const box = await this.page.locator('.htContextMenu').first().boundingBox();

    if (!box) {
      throw new Error('The context menu has no bounding box');
    }

    return { left: box.x, right: box.x + box.width, top: box.y, bottom: box.y + box.height };
  }

  /**
   * Hovers "Alignment" and waits for its submenu, which opens on a delay of its own.
   */
  async openAlignmentSubmenu(): Promise<void> {
    const item = await this.itemBox('Alignment');

    await this.page.mouse.move(item.left + 20, (item.top + item.bottom) / 2, { steps: 5 });
    await expect(this.alignmentSubmenu).toBeVisible();
  }

  /**
   * The centre point of one item inside the open "Alignment" submenu.
   */
  async submenuItemPoint(label: string): Promise<{ x: number; y: number }> {
    const box = await this.alignmentSubmenu.locator('.ht_master .htCore td')
      .filter({ hasText: new RegExp(`^${label}$`) })
      .first()
      .boundingBox();

    if (!box) {
      throw new Error(`Submenu item ${JSON.stringify(label)} has no bounding box`);
    }

    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  /**
   * Moves the pointer along a real path, emitting the intermediate `mousemove` events that make the
   * crossed rows fire their hover handlers.
   */
  async travelTo(x: number, y: number): Promise<void> {
    await this.page.mouse.move(x, y, { steps: SubmenuHoverDelayPage.TRAVEL_STEPS });
  }

  /**
   * Brushes the anchor row and leaves the menu again, and reports how long that took.
   *
   * Deliberately TWO unstepped moves, not `travelTo`: this is the one test that has to beat the
   * 300 ms open delay, and 25 intermediate points per move is 50 CDP round trips. Locally that
   * finished about 250 ms after landing on the anchor — inside the delay by ~50 ms — and on a
   * loaded CI runner it went past it, so the open fired and the submenu was there for a reason
   * that had nothing to do with the behaviour under test. Two round trips leave a margin of
   * hundreds of milliseconds instead of tens.
   *
   * No path is needed here anyway: the exit runs along the anchor's own row, so it crosses no
   * other row whether it is stepped or not.
   *
   * @param {MenuGeometry} anchor The anchor item's box.
   * @param {MenuGeometry} parentMenu The menu's own box.
   * @returns {Promise<number>} Milliseconds from landing on the anchor to being off the menu.
   */
  async brushAnchorAndLeave(anchor: MenuGeometry, parentMenu: MenuGeometry): Promise<number> {
    const anchorMiddle = (anchor.top + anchor.bottom) / 2;
    const startedAt = Date.now();

    await this.page.mouse.move(anchor.left + 30, anchorMiddle);
    await this.page.mouse.move(parentMenu.left - 60, anchorMiddle);

    return Date.now() - startedAt;
  }

  /**
   * The bounded settle used before every survival assertion here. Measured in milliseconds, not in
   * frames: the thing being outlasted is a `setTimeout`, and a frame count that clears 300 ms on a
   * 60Hz display does not clear it on a 144Hz one.
   */
  async settlePastHoverDelay(): Promise<void> {
    await afterAtLeast(this.page, 750);
  }

  /**
   * The key of the menu item the keyboard selection currently sits on, or `undefined`.
   */
  async keyboardSelection(): Promise<string | undefined> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getPlugin: (n: string) => { menu: { getSelectedItem: () => { key?: string } | undefined } } };
    }).hot.getPlugin('contextMenu').menu.getSelectedItem()?.key);
  }

  /**
   * Walks the keyboard selection down to the item with the given key, and fails loudly if it never
   * arrives — otherwise a later assertion blames the submenu for navigation that never got there.
   */
  async selectItemWithKeyboard(key: string): Promise<void> {
    for (let i = 0; i < 20; i++) {
      await this.page.keyboard.press('ArrowDown');

      if (await this.keyboardSelection() === key) {
        return;
      }
    }

    throw new Error(`ArrowDown never reached the ${JSON.stringify(key)} item`);
  }

  /**
   * Stamps the open submenu's container so a later read can tell the SAME element from a
   * replacement. `toBeVisible()` cannot: a submenu that was closed and instantly recreated looks
   * identical to one that survived, and those are exactly the two outcomes these tests separate.
   */
  async markSubmenu(): Promise<void> {
    await this.alignmentSubmenu.evaluate((el: HTMLElement) => {
      el.dataset.survivalProbe = 'original';
    });
  }

  /**
   * Reads back the stamp from `markSubmenu()`. `undefined` means the container is a new element —
   * the submenu was destroyed and rebuilt, not kept.
   */
  async submenuMark(): Promise<string | undefined> {
    return this.page.evaluate(() => (document.querySelector('.htContextMenuSub_Alignment') as
      HTMLElement | null)?.dataset.survivalProbe);
  }

  /**
   * Closes the open submenu the way its own keyboard shortcuts do — `close()` on the submenu
   * itself, never the parent's `closeSubMenu()`. That path leaves the parent to clean up its own
   * bookkeeping through an `afterClose` hook.
   */
  async closeSubmenuFromItsOwnSide(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      hot: { getPlugin: (n: string) => { menu: { hotSubMenus: Record<string, { close: () => void }> } } };
    }).hot.getPlugin('contextMenu').menu.hotSubMenus.alignment.close());
  }

  /**
   * Whether the parent menu still believes a submenu is open — `hotSubMenus` plus the row it
   * anchors. Drift between this and the DOM is what made the anchor row stop responding to hover.
   */
  async parentSubmenuBookkeeping(): Promise<{ keys: string[]; allClosed: boolean }> {
    return this.page.evaluate(() => {
      const menu = (window as unknown as {
        hot: { getPlugin: (n: string) => { menu: {
          hotSubMenus: Record<string, unknown>; isAllSubMenusClosed: () => boolean;
        } } };
      }).hot.getPlugin('contextMenu').menu;

      return { keys: Object.keys(menu.hotSubMenus), allClosed: menu.isAllSubMenusClosed() };
    });
  }

  /**
   * Parks the pointer well away from the menu. Opening the menu with a right-click leaves the
   * cursor on top of it, which arms a delayed open for whatever row landed under it — a stray
   * timer that would otherwise fire in the middle of a keyboard test.
   */
  async parkPointerAwayFromMenu(): Promise<void> {
    await this.page.mouse.move(2, 2, { steps: 5 });
  }

  /**
   * The labels of every item in the "Alignment" submenu, separators excluded.
   */
  async submenuItemLabels(): Promise<string[]> {
    return this.alignmentSubmenu.locator('.ht_master .htCore td:not(.htSeparator)')
      .allInnerTexts()
      .then(labels => labels.map(label => label.trim()).filter(Boolean));
  }
}
