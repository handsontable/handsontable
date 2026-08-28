import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the "freeze_column / unfreeze_column as dropdown menu keys" fixture
 * (GitHub #5429).
 *
 * The fixture holds four grids, addressed by the ids below. The page object exposes the two things
 * the bug damaged — what the dropdown menu actually renders for those keys, and whether picking an
 * entry moves the column into the frozen area.
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

  /** Every grid the fixture builds. */
  static readonly ALL_GRIDS = ['custom-keys', 'default-menu', 'context-control', 'plugin-off'];

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
   * Open the column header menu on one visual column.
   *
   * Which overlay clone holds the clickable header depends on whether the column is frozen: a
   * frozen column's header is drawn by the top-inline-start corner clone, which paints ON TOP of
   * the copy `.ht_clone_top` still renders for it. Targeting the wrong clone does not fail
   * loudly — the click is intercepted by the overlay and times out — so pick the clone from the
   * grid's current `fixedColumnsStart` rather than guessing.
   */
  async openColumnMenu(gridId: string, visualColumn: number): Promise<void> {
    const fixedColumnsStart = await this.fixedColumnsStart(gridId);
    const clone = visualColumn < fixedColumnsStart ? '.ht_clone_top_inline_start_corner' : '.ht_clone_top';
    // +2, not +1: the row-header corner cell occupies the first `th` of every header row.
    const headerCell = this.grid(gridId).locator(`${clone} thead th:nth-child(${visualColumn + 2})`);

    await headerCell.locator('.changeType').click();
    await expect(this.dropdownMenu()).toBeVisible();
  }

  /** Open the context menu on one cell. */
  async openContextMenu(gridId: string, row: number, visualColumn: number): Promise<void> {
    await this.cell(gridId, row, visualColumn).click({ button: 'right' });
    await expect(this.contextMenu()).toBeVisible();
  }

  /** A data cell of the master table. */
  cell(gridId: string, row: number, visualColumn: number): Locator {
    return this.grid(gridId)
      .locator('.ht_master tbody tr')
      .nth(row)
      .locator('td')
      .nth(visualColumn);
  }

  private dropdownMenu(): Locator {
    return this.page.locator('.htDropdownMenu .ht_master').first();
  }

  private contextMenu(): Locator {
    return this.page.locator('.htContextMenu .ht_master').first();
  }

  /**
   * The labels of the menu rows a user can actually see.
   *
   * Hidden items stay in the DOM with a zero-height box rather than being dropped, so the `:visible`
   * filter is what separates "the plugin offered this entry" from "the entry's `hidden()` said no".
   * That distinction is the whole point of the unfreeze assertions.
   */
  async visibleDropdownMenuItems(): Promise<string[]> {
    return this.visibleItemsOf('.htDropdownMenu');
  }

  async visibleContextMenuItems(): Promise<string[]> {
    return this.visibleItemsOf('.htContextMenu');
  }

  private async visibleItemsOf(menuSelector: string): Promise<string[]> {
    const labels = await this.page
      .locator(`${menuSelector} .ht_master td:visible`)
      .allTextContents();

    return labels.map(label => label.trim()).filter(label => label.length > 0);
  }

  /** Pick one entry from the open column header menu. */
  async clickDropdownMenuItem(label: string): Promise<void> {
    await this.page.locator('.htDropdownMenu .ht_master td:visible', { hasText: label }).first().click();
    await expect(this.dropdownMenu()).toBeHidden();
  }

  /** Pick one entry from the open context menu. */
  async clickContextMenuItem(label: string): Promise<void> {
    await this.page.locator('.htContextMenu .ht_master td:visible', { hasText: label }).first().click();
    await expect(this.contextMenu()).toBeHidden();
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

  /** One row of data in its current visual order. */
  async rowData(gridId: string, row: number): Promise<string[]> {
    return this.page.evaluate(
      ([id, r]) => (window as unknown as {
        hots: Record<string, { getDataAtRow: (row: number) => string[] }>;
      }).hots[id as string].getDataAtRow(r as number),
      [gridId, row] as [string, number]
    );
  }
}
