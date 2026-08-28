import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the "freeze_column / unfreeze_column as dropdown menu keys" fixture
 * (GitHub #5429).
 *
 * The fixture holds six grids, addressed by the ids below. The page object exposes the three
 * things the bug touched — what the dropdown menu renders for those keys, whether picking an entry
 * moves the column into the frozen area, and whether the menu keeps up when `manualColumnFreeze`
 * is toggled after the menu was built.
 */
export class DropdownMenuFreezeColumnPage {
  /** The reported config: both keys listed explicitly in `dropdownMenu`. */
  static readonly CUSTOM_KEYS = 'custom-keys';
  /** `dropdownMenu: true`, so the items come from the defaults plus the enabled plugins. */
  static readonly DEFAULT_MENU = 'default-menu';
  /** The `contextMenu` path, which already worked — the regression control. */
  static readonly CONTEXT_CONTROL = 'context-control';
  /** The same keys with `manualColumnFreeze: false`. */
  static readonly PLUGIN_OFF = 'plugin-off';
  /** For toggling `manualColumnFreeze` off through `updateSettings` after the menu was built. */
  static readonly TOGGLE = 'toggle';
  /** Starts with the plugin disabled, so the entry is absent from the built list entirely. */
  static readonly TOGGLE_OFF_START = 'toggle-off-start';
  /** `filters` as well, so the entries have to land after the filter interface. */
  static readonly FILTERS_ORDER = 'filters-order';
  /** A custom item list that does not name the freeze keys, with the plugin enabled. */
  static readonly OTHER_KEYS = 'other-keys';

  /** Every grid the fixture builds. */
  static readonly ALL_GRIDS = [
    DropdownMenuFreezeColumnPage.CUSTOM_KEYS,
    DropdownMenuFreezeColumnPage.DEFAULT_MENU,
    DropdownMenuFreezeColumnPage.CONTEXT_CONTROL,
    DropdownMenuFreezeColumnPage.PLUGIN_OFF,
    DropdownMenuFreezeColumnPage.TOGGLE,
    DropdownMenuFreezeColumnPage.TOGGLE_OFF_START,
    DropdownMenuFreezeColumnPage.FILTERS_ORDER,
    DropdownMenuFreezeColumnPage.OTHER_KEYS,
  ];

  /** The fixture's named column headers, in their starting order. */
  static readonly COLUMN_HEADERS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'];

  /** The translated labels the two entries render with when they resolve properly. */
  static readonly FREEZE_LABEL = 'Freeze column';
  static readonly UNFREEZE_LABEL = 'Unfreeze column';

  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /** Navigate and wait for every grid to have rendered — a real DOM condition, never a sleep. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/dropdown-menu-freeze-column.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    // Report a constructor that threw as the error it threw, not as a visibility timeout. The
    // fixture stamps `data-init-error` synchronously while the page script runs, so by the time
    // `goto()` resolves it is either set or never will be — read it before waiting on anything.
    for (const gridId of DropdownMenuFreezeColumnPage.ALL_GRIDS) {
      const initError = await this.grid(gridId).getAttribute('data-init-error');

      if (initError !== null) {
        throw new Error(`Grid "${gridId}" failed to build: ${initError}`);
      }
    }

    for (const gridId of DropdownMenuFreezeColumnPage.ALL_GRIDS) {
      await expect(this.grid(gridId).locator('.ht_master')).toBeVisible();
    }
  }

  /** One of the grid containers. */
  grid(gridId: string): Locator {
    return this.page.getByTestId(gridId);
  }

  /**
   * Open the column header menu on the column carrying this header name.
   *
   * Addressed by name rather than by DOM position on purpose. The fixture is narrower than its
   * columns, so Handsontable renders only the columns in view — after a sideways scroll the nth
   * header cell is no longer the nth column. Freezing compounds it: a frozen column's header is
   * drawn by the top-inline-start corner clone, which paints ON TOP of the copy `.ht_clone_top`
   * still renders for it, and clicking the covered copy times out rather than failing clearly.
   */
  async openColumnMenu(gridId: string, headerName: string): Promise<void> {
    const isFrozen = (await this.frozenHeaders(gridId)).includes(headerName);
    const clone = isFrozen ? '.ht_clone_top_inline_start_corner' : '.ht_clone_top';

    await this.grid(gridId)
      .locator(`${clone} [data-testid="header-${headerName}"] .changeType`)
      .click();

    await expect(this.openMenu('.htDropdownMenu')).toBeVisible();
  }

  /** Open the context menu on one cell. */
  async openContextMenu(gridId: string, row: number, visualColumn: number): Promise<void> {
    await this.grid(gridId)
      .locator('.ht_master tbody tr')
      .nth(row)
      .locator('td')
      .nth(visualColumn)
      .click({ button: 'right' });

    await expect(this.openMenu('.htContextMenu')).toBeVisible();
  }

  /**
   * The menu that is currently on screen.
   *
   * Menus render into a body-level `div.ht-portal`, one per grid, so they cannot be scoped to a
   * grid container. Handsontable removes the inner table when a menu closes, so filtering on
   * visibility resolves to the single open menu.
   *
   * The child combinator matters: the Filters value list is itself a Handsontable, so a descendant
   * match finds that nested grid's table too and trips Playwright's strict mode.
   */
  private openMenu(menuSelector: string): Locator {
    return this.page.locator(`${menuSelector} > .ht_master:visible`);
  }

  /**
   * The labels of the menu rows a user can actually see.
   *
   * Hidden items stay in the DOM with a zero-height box rather than being dropped, so the
   * `:visible` filter is what separates "the plugin offered this entry" from "the entry's
   * `hidden()` said no". That distinction is the whole point of the unfreeze assertions.
   */
  async visibleDropdownMenuItems(): Promise<string[]> {
    return this.visibleItemsOf('.htDropdownMenu');
  }

  async visibleContextMenuItems(): Promise<string[]> {
    return this.visibleItemsOf('.htContextMenu');
  }

  private async visibleItemsOf(menuSelector: string): Promise<string[]> {
    const labels = await this.page.locator(`${menuSelector} td:visible`).allTextContents();

    return labels.map(label => label.trim()).filter(label => label.length > 0);
  }

  /** Pick one entry from the open column header menu. */
  async clickDropdownMenuItem(label: string): Promise<void> {
    await this.menuItem('.htDropdownMenu', label).click();
    await expect(this.openMenu('.htDropdownMenu')).toBeHidden();
  }

  /** Pick one entry from the open context menu. */
  async clickContextMenuItem(label: string): Promise<void> {
    await this.menuItem('.htContextMenu', label).click();
    await expect(this.openMenu('.htContextMenu')).toBeHidden();
  }

  /**
   * One visible menu row, matched on its whole label.
   *
   * The match is anchored because Playwright's `hasText` string form is a case-insensitive
   * SUBSTRING match, and "Unfreeze column" contains "freeze column" — so the plain form would
   * happily click unfreeze when asked for freeze.
   */
  private menuItem(menuSelector: string, label: string): Locator {
    const exact = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

    return this.page.locator(`${menuSelector} td:visible`).filter({ hasText: exact }).first();
  }

  /** How many columns the grid currently holds in its frozen (inline start) area. */
  async fixedColumnsStart(gridId: string): Promise<number> {
    return this.page.evaluate(
      id => (window as unknown as {
        hots: Record<string, { getSettings: () => { fixedColumnsStart?: number } }>;
      }).hots[id].getSettings().fixedColumnsStart ?? 0,
      gridId
    );
  }

  /** The column headers in their current visual order — named, so they travel with their column. */
  async columnHeaders(gridId: string): Promise<string[]> {
    return this.page.evaluate(
      id => (window as unknown as {
        hots: Record<string, { getColHeader: () => string[] }>;
      }).hots[id].getColHeader(),
      gridId
    );
  }

  /** The headers of the columns currently inside the frozen area. */
  async frozenHeaders(gridId: string): Promise<string[]> {
    const headers = await this.columnHeaders(gridId);

    return headers.slice(0, await this.fixedColumnsStart(gridId));
  }

  /** One row of data in its current visual order. */
  async rowData(gridId: string, row: number): Promise<string[]> {
    return this.page.evaluate(
      ([id, r]) => (window as unknown as {
        hots: Record<string, { getDataAtRow: (row: number) => string[] }>;
      }).hots[id as string].getDataAtRow(r as number),
      [gridId, row] as [string, number]
    );
  }

  /** Close the open column header menu without picking anything. */
  async closeDropdownMenu(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.openMenu('.htDropdownMenu')).toBeHidden();
  }

  /** Whether a menu is currently on screen. */
  async isDropdownMenuOpen(): Promise<boolean> {
    return (await this.page.locator('.htDropdownMenu > .ht_master:visible').count()) > 0;
  }

  /**
   * Run a dropdown menu command straight through the plugin's public API, skipping the menu UI.
   *
   * This is the path the rendered item list cannot protect: the command executor keeps every
   * command it was ever given, so an entry contributed by a plugin that is now disabled is still
   * reachable here.
   *
   * The selection is passed the way the menu passes it. `execute()` forwards its extra arguments
   * straight to the item's callback, so calling it bare makes the callback throw on a missing
   * selection — which would look like the command was refused when it was not.
   */
  async executeDropdownCommand(gridId: string, command: string, visualColumn: number): Promise<string | null> {
    return this.page.evaluate(
      ([id, commandName, column]) => {
        const hot = (window as unknown as {
          hots: Record<string, {
            selectColumns: (col: number) => void;
            getPlugin: (name: string) => { executeCommand: (c: string, ...params: unknown[]) => void };
          }>;
        }).hots[id as string];

        hot.selectColumns(column as number);

        const selection = [{
          start: { row: 0, col: column as number },
          end: { row: 0, col: column as number },
        }];

        try {
          hot.getPlugin('dropdownMenu').executeCommand(commandName as string, selection);
        } catch (error) {
          return String((error as Error).message);
        }

        return null;
      },
      [gridId, command, visualColumn] as [string, string, number]
    );
  }

  /** Turn `manualColumnFreeze` on or off after the menu has already been built. */
  async setManualColumnFreeze(gridId: string, enabled: boolean): Promise<void> {
    await this.page.evaluate(
      ([id, value]) => (window as unknown as {
        hots: Record<string, { updateSettings: (settings: object) => void }>;
      }).hots[id as string].updateSettings({ manualColumnFreeze: value as boolean }),
      [gridId, enabled] as [string, boolean]
    );
  }
}
