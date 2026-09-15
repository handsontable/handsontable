import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * What the dropdown menu believes about itself, read through the plugin rather than the DOM.
 *
 * `isOpened()` is the invariant DEV-41 broke and it is invisible from the markup: the stranded
 * menu reported itself open while its container was already hidden, so a DOM-only check passed
 * on exactly the build that was broken.
 */
export interface MenuState {
  isOpened: boolean | null;
  containerDisplay: string | null;
}

/**
 * Page Object for the menu open-failure fixture (DEV-41 / DEV-2922).
 *
 * The fixture's dropdown menu carries one item whose `name()` throws while rendering, which is
 * inside `Menu.open()`'s window between "the menu counts as open" and "the navigator exists".
 */
export class MenuOpenFailurePage {
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
   * Navigate to the fixture. The theme and bundle travel as query params so the fixture loads the
   * matching stylesheet and Handsontable build — miss either and the leg silently tests something
   * other than what its name says.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/menu-open-failure.html?theme=${this.theme}&bundle=${this.bundle}`);
    // The bundle first, or a slow leg fails pointing at a missing cell instead of the real cause.
    await awaitBundle(this.page);

    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A data cell in the master overlay. Unfrozen cells live only there, so this hooks cleanly. */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The dropdown menu that is currently on screen.
   *
   * Menus render into a body-level portal, so they cannot be scoped to the grid container.
   * Handsontable removes the inner table when a menu closes, so filtering on visibility resolves
   * to the single open menu.
   */
  openMenu(): Locator {
    return this.page.locator('.htDropdownMenu:visible').last();
  }

  /**
   * Click the dropdown button in one column header.
   *
   * The button is only painted while its header is hovered, so the hover is part of the action
   * rather than an optimisation — without it the click fails the visibility check. Scoped to
   * `.ht_clone_top`, because a header also exists in the master overlay and the corner clone.
   *
   * Does NOT wait for a menu: the whole point of this fixture is the open that fails.
   *
   * @param {number} column The visual column index.
   */
  async clickColumnMenuButton(column: number): Promise<void> {
    const header = this.grid.locator('.ht_clone_top').getByTestId(`header-${column}`);

    await header.hover();

    await header.locator('.changeType').click();
  }

  /**
   * Click empty page background, well clear of the grid and of any menu.
   *
   * This is the gesture DEV-41 turned into a page-wide crash: it reaches `Menu.onDocumentMouseDown`
   * on the `document` listener, which calls `close()`.
   */
  async clickPageBackground(): Promise<void> {
    await this.page.mouse.click(5, 5);
  }

  /** Stop the menu item from throwing, so a later open can succeed. */
  async stopThrowing(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      htStopThrowing: () => void;
    }).htStopThrowing());
  }

  /** The message the fixture's menu item throws. */
  async itemErrorMessage(): Promise<string> {
    return this.page.evaluate(() => (window as unknown as {
      HT_MENU_ITEM_ERROR: string;
    }).HT_MENU_ITEM_ERROR);
  }

  /** What the dropdown menu believes about itself. */
  async menuState(): Promise<MenuState> {
    return this.page.evaluate(() => (window as unknown as {
      htMenuState: () => MenuState;
    }).htMenuState());
  }

  /** Tear the grid down the way an SPA route change does. Returns `'ok'` or the error message. */
  async destroyGrid(): Promise<string> {
    return this.page.evaluate(() => (window as unknown as {
      htDestroyGrid: () => string;
    }).htDestroyGrid());
  }

  /**
   * How many listeners the grid's EventManager holds right now.
   *
   * The only way to see a leaked listener from a test: a leaked `mousedown` handler early-returns
   * once the menu reports itself closed, so watching for a page error cannot tell a torn-down
   * listener from a live one.
   */
  async listenerCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as {
      htListenerCount: () => number;
    }).htListenerCount());
  }
}
