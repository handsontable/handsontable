import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * What one menu item reports about its checked state, read straight off the rendered DOM.
 */
export interface CheckedItemState {
  role: string | null;
  ariaChecked: string | null;
  ariaLabel: string | null;
  checkMarks: number;
}

/**
 * Page Object for the context menu checked-items fixture (DEV-2650).
 *
 * The six items that draw a check mark declare `checked`, and declaring it is what makes an item
 * announce as `menuitemcheckbox`. Before DEV-2650 only `make_read_only` said `checkable`, so the
 * other five would have drawn a mark with no accessible equivalent. These queries read the visible
 * half and the announced half of one item together, because either alone can pass while the pair
 * disagrees.
 */
export class ContextMenuCheckedItemsPage {
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
      `/tests/fixtures/demo/context-menu-checked-items.html?theme=${this.theme}&bundle=${this.bundle}`);
    // The bundle first, or a slow leg fails pointing at a missing cell instead of the real cause.
    // `awaitBundle()` owns both the `waitForFunction`-over-`expect` choice and the polling interval.
    await awaitBundle(this.page);

    // Rethrow a constructor failure as itself. The fixture catches the throw and stamps it, so a
    // grid that never built reads as its own error rather than as a cell that never appeared.
    const initError = await this.grid.getAttribute('data-init-error');

    if (initError) {
      throw new Error(`Fixture failed to build the grid: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master overlay, scoped through the grid container. The menu locators below
   * deliberately are not: the context menu renders in its own element outside this container.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Put cell (0, 0) into the state every item under test reads: a top border, a read-only comment,
   * and read-only cell meta.
   */
  async markCellChecked(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      markCellChecked: () => void;
    }).markCellChecked());
  }

  /**
   * Right-click cell (0, 0) to open the context menu, and wait for it to be on screen.
   */
  async openMenuOnFirstCell(): Promise<void> {
    await this.cell(0, 0).click({ button: 'right' });
    await expect(this.page.locator('.htContextMenu:visible').last()).toBeVisible();
  }

  /**
   * Open the "Borders" submenu and wait for it. The border items live only in there, which is why
   * no assertion can reach them from the top-level menu.
   */
  async openBordersSubmenu(): Promise<void> {
    const menu = this.page.locator('.htContextMenu:visible').last();

    await menu.getByText('Borders', { exact: true }).hover();
    await expect(this.page.locator('.htContextMenuSub_Borders')).toBeVisible();
  }

  /**
   * Read one item's checked state by its visible label.
   *
   * Addressed by label rather than by row index because the item list depends on which plugins are
   * on, and an index would silently move the moment one is added. The `<td>` is the element the
   * renderer stamps the ARIA attributes on; the mark is a `span.selected` inside its wrapper.
   *
   * @param {string} label The item's visible text.
   * @param {boolean} [inBordersSubmenu] Read from the "Borders" submenu instead of the main menu.
   */
  async itemState(label: string, inBordersSubmenu = false): Promise<CheckedItemState> {
    const scope = inBordersSubmenu
      ? this.page.locator('.htContextMenuSub_Borders')
      : this.page.locator('.htContextMenu:visible').last();
    // The check mark is a `span.selected` INSIDE the item, so a checked item's text reads
    // `\u2713Top`, not `Top`. Anchoring on the label alone would silently match nothing in exactly
    // the state these tests care about - which is how the first version of this page object failed.
    const cell = scope.locator('td')
      .filter({ hasText: new RegExp(`^\\s*\u2713?\\s*${label}\\s*$`) })
      .first();

    await expect(cell).toBeVisible();

    return {
      role: await cell.getAttribute('role'),
      ariaChecked: await cell.getAttribute('aria-checked'),
      ariaLabel: await cell.getAttribute('aria-label'),
      checkMarks: await cell.locator('.htItemWrapper span.selected').count(),
    };
  }
}
