import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { afterAnimationFrames } from '../frames';

/**
 * What the menu under test believes about itself, read through the plugin rather than the DOM.
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
 * The two plugins built on the shared `Menu` class that this fixture configures.
 */
export type MenuPlugin = 'dropdownMenu' | 'contextMenu';

/**
 * What the fixture's menu item does each time its menu paints it (see `htItemMode` in the fixture).
 */
export type ItemMode = 'throw' | 'none' | 'probe' | 'close' | 'reopen' | 'swap' | 'destroy';

/**
 * What the fixture's menu item does while the item list is filtered (see `htHiddenMode`).
 */
export type HiddenMode = 'none' | 'swap';

/**
 * The fixture's failure switches (see `htArm` in the fixture).
 */
export type FailureSwitch = 'subItemThrows' | 'hideThrows' | 'subMenuTeardownThrows';

/**
 * The fixture's thrown messages, by what throws them.
 */
const FIXTURE_ERROR = {
  item: 'HT_MENU_ITEM_ERROR',
  subItem: 'HT_SUB_ITEM_ERROR',
  hide: 'HT_HIDE_ERROR',
  teardown: 'HT_TEARDOWN_ERROR',
} as const;

/**
 * One `probe` paint: what `isOpened()` said, and whether the menu could actually be driven then.
 */
export interface MenuProbe {
  isOpened: boolean;
  canDrive: boolean;
}

/**
 * One public show/hide hook of the menu under test, with what `isOpened()` said inside it.
 */
export interface HookEntry {
  event: 'beforeShow' | 'afterShow' | 'afterHide';
  isOpened: boolean | null;
}

const MENU_CLASS: Record<MenuPlugin, string> = {
  dropdownMenu: 'htDropdownMenu',
  contextMenu: 'htContextMenu',
};

/**
 * Page Object for the menu open-failure fixture (DEV-41 / DEV-2922).
 *
 * The fixture's dropdown menu and context menu share one item whose `name()` runs while the menu is
 * still being built - the window between "`open()` started" and "the navigator exists". By default
 * it throws; `setItemMode()` switches it to reaching back into the menu without a throw.
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
   * The menu of one plugin that is currently on screen.
   *
   * Menus render into a body-level portal, so they cannot be scoped to the grid container.
   * Handsontable removes the inner table when a menu closes, so filtering on visibility resolves
   * to the single open menu.
   *
   * A sub-menu's container carries the same plugin class plus a `...Sub_<name>` one, so it is
   * excluded here - `subMenu()` is the way to it.
   *
   * @param {MenuPlugin} [plugin] Which plugin's menu.
   */
  openMenu(plugin: MenuPlugin = 'dropdownMenu'): Locator {
    return this.page.locator(`.${MENU_CLASS[plugin]}:not([class*="Sub_"]):visible`).last();
  }

  /**
   * The fixture's sub-menu (`Parent` > `Child item`) of one plugin, when it is on screen.
   *
   * @param {MenuPlugin} plugin Which plugin's menu.
   */
  subMenu(plugin: MenuPlugin): Locator {
    return this.page.locator(`.${MENU_CLASS[plugin]}[class*="Sub_Parent"]:visible`);
  }

  /**
   * Move the pointer onto one row of the open menu. Hovering the `Parent` row is what opens the
   * sub-menu, after the menu's 300ms hover delay.
   *
   * @param {MenuPlugin} plugin Which plugin's menu.
   * @param {string} label The row's visible text.
   */
  async hoverMenuItem(plugin: MenuPlugin, label: string): Promise<void> {
    await this.openMenu(plugin).locator('td').filter({ hasText: label }).first().hover();
  }

  /**
   * Run one row of the open menu, the way a user does.
   *
   * @param {MenuPlugin} plugin Which plugin's menu.
   * @param {string} label The row's visible text.
   */
  async clickMenuItem(plugin: MenuPlugin, label: string): Promise<void> {
    await this.openMenu(plugin).locator('td').filter({ hasText: label }).first().click();
  }

  /**
   * Arm one of the fixture's failure switches.
   *
   * @param {FailureSwitch} name The switch.
   */
  async arm(name: FailureSwitch): Promise<void> {
    await this.page.evaluate(switchName => (window as unknown as {
      htArm: (name: string) => void;
    }).htArm(switchName), name);
  }

  /**
   * The message one of the fixture's failures throws.
   *
   * @param {keyof typeof FIXTURE_ERROR} source What throws it.
   */
  async fixtureError(source: keyof typeof FIXTURE_ERROR): Promise<string> {
    return this.page.evaluate(key => (window as unknown as Record<string, string>)[key], FIXTURE_ERROR[source]);
  }

  /**
   * How many sub-menu containers sit in the page.
   */
  async subMenuContainerCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as {
      htSubMenuContainerCount: () => number;
    }).htSubMenuContainerCount());
  }

  /**
   * How many menu grids are alive in the page.
   */
  async menuGridCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as {
      htMenuGridCount: () => number;
    }).htMenuGridCount());
  }

  /**
   * The bounded settle that goes before every "no page error" read.
   *
   * A web-first poll cannot prove a negative: `expect.poll(...).toEqual([])` passes on its first
   * read, the moment the buffer is empty, so it waits for nothing. Two animation frames are what the
   * grid and the menu schedule their follow-up work on, so an error from anything a gesture set in
   * motion has landed by then. Sound only beside a positive control in the same test.
   */
  async settle(): Promise<void> {
    await afterAnimationFrames(this.page, 2);
  }

  /**
   * Open one plugin's menu the way a user does: the header button for the dropdown menu, a right
   * click on a data cell for the context menu.
   *
   * Does NOT wait for the menu - several tests here are about an open that goes wrong.
   *
   * @param {MenuPlugin} plugin Which plugin's menu to open.
   */
  async openMenuOf(plugin: MenuPlugin): Promise<void> {
    if (plugin === 'dropdownMenu') {
      await this.clickColumnMenuButton(0);

      return;
    }

    // Row 1, column 1: a row below the header on every theme, and clear of the header button.
    await this.cell(1, 1).click({ button: 'right' });
  }

  /**
   * Pick what the fixture's menu item does on its next paints, and which plugin's menu it reaches
   * back into.
   *
   * @param {ItemMode} mode What the item does.
   * @param {MenuPlugin} plugin The plugin whose menu is under test.
   */
  async setItemMode(mode: ItemMode, plugin: MenuPlugin): Promise<void> {
    await this.page.evaluate(([nextMode, nextPlugin]) => (window as unknown as {
      htSetItemMode: (mode: string, plugin: string) => void;
    }).htSetItemMode(nextMode, nextPlugin), [mode, plugin]);
  }

  /**
   * Every `probe` paint so far.
   */
  async probes(): Promise<MenuProbe[]> {
    return this.page.evaluate(() => (window as unknown as { htProbes: MenuProbe[] }).htProbes);
  }

  /**
   * Every public show/hide hook of the menu under test so far, in order.
   */
  async hookLog(): Promise<HookEntry[]> {
    return this.page.evaluate(() => (window as unknown as { htHookLog: HookEntry[] }).htHookLog);
  }

  /**
   * Paint the open menu again, which calls every item's `name()` with the menu fully open.
   */
  async repaintMenu(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as { htRepaintMenu: () => void }).htRepaintMenu());
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

  /** What the menu under test believes about itself. */
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

  /** Pick what the item's `hidden()` does next, and which plugin's menu it reaches into. */
  async setHiddenMode(mode: HiddenMode, plugin: MenuPlugin): Promise<void> {
    await this.page.evaluate(([nextMode, pluginName]) => (window as unknown as {
      htSetHiddenMode: (mode: string, plugin: string) => void;
    }).htSetHiddenMode(nextMode, pluginName), [mode, plugin] as const);
  }

  /**
   * The HOST grid's `outsideClickDeselects`.
   *
   * The menu turns it off while it is open and puts it back when it closes, so a menu abandoned
   * mid-build leaves it off for the life of the page - clicking outside the grid then never clears
   * the selection again.
   */
  async hostOutsideClickDeselects(): Promise<boolean | null> {
    return this.page.evaluate(() => (window as unknown as {
      htHostState: () => boolean | null;
    }).htHostState());
  }

  /** Remember the menu object, before a settings change swaps the plugin's menu for a fresh one. */
  async captureMenu(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      htCaptureMenu: () => void;
    }).htCaptureMenu());
  }

  /** What the remembered menu ended up as: still open, and still holding a grid? */
  async capturedMenuState(): Promise<{ isOpened: boolean; hasGrid: boolean }> {
    return this.page.evaluate(() => (window as unknown as {
      htCapturedMenuState: () => { isOpened: boolean; hasGrid: boolean };
    }).htCapturedMenuState());
  }

  /** How many times the menu under test rebuilt its item list, through its public hook. */
  async setItemsCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htSetItemsCount: number }).htSetItemsCount);
  }

  /** How many `afterSetTheme` hooks the host grid holds - one per menu ever built. */
  async themeHookCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as {
      htThemeHookCount: () => number;
    }).htThemeHookCount());
  }
}
