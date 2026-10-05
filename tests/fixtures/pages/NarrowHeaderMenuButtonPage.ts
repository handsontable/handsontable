import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { dragResizeHandle } from '../gestures';

/**
 * Geometry of one column header, in CSS pixels, relative to the header's own inline-start edge so a
 * right-to-left grid reads the same as a left-to-right one.
 */
export interface HeaderGeometry {
  /** The header cell's width. */
  width: number;
  /** Where the menu icon (not its larger hit area) starts and ends. */
  icon: [number, number];
  /** The rendered width of the sort indicator, `0` when it is hidden. */
  indicator: number;
}

/**
 * Page Object for the narrow header fixture (DEV-158).
 *
 * The geometry is read from the top overlay clone, which draws the column headers the reader sees,
 * and the columns are narrowed by dragging the real resize handle, so the width is produced the way
 * a user produces it.
 */
export class NarrowHeaderMenuButtonPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture for the active theme and bundle.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/narrow-header-menu-button.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);

    for (const testId of ['menu', 'menu-sort', 'menu-sort-right', 'menu-sort-rtl', 'menu-sort-rtl-left']) {
      // The clones exist before their rows are laid out, and every test drags or measures a header.
      await expect(this.header(testId, 3)).toBeVisible();
    }
  }

  /**
   * The grid container carrying the given test id.
   *
   * @param {string} testId The container's test id.
   * @returns {Locator}
   */
  grid(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * The header cell of a data column, from the top overlay clone.
   *
   * @param {string} testId The grid's test id.
   * @param {number} column The visual column index.
   * @returns {Locator}
   */
  header(testId: string, column: number): Locator {
    // `nth(column + 1)` skips the corner cell, so index 0 addresses the first data column.
    return this.grid(testId).locator('.ht_clone_top thead tr').first().locator('th').nth(column + 1);
  }

  /**
   * The narrowest width the active theme allows: the icon size plus the cell padding on both sides.
   *
   * @param {string} testId The grid's test id.
   * @returns {Promise<number>}
   */
  async minimumWidth(testId: string): Promise<number> {
    return this.grid(testId).evaluate((root) => {
      const style = getComputedStyle(root.querySelector('.ht-root-wrapper') ?? root);

      return parseFloat(style.getPropertyValue('--ht-icon-size')) +
        (2 * parseFloat(style.getPropertyValue('--ht-cell-horizontal-padding')));
    });
  }

  /**
   * Drags a column's resize handle far past the narrowest width, so the stored width is the floor.
   *
   * @param {string} testId The grid's test id.
   * @param {number} column The visual column index.
   * @param {number} [delta=-400] The drag distance. Negative narrows a left-to-right column.
   */
  async dragColumnHandle(testId: string, column: number, delta = -400): Promise<void> {
    await this.header(testId, column).hover();

    const handle = this.grid(testId).locator('.manualColumnResizer');

    await expect(handle).toBeVisible();

    await dragResizeHandle(this.page, handle, { x: delta });
  }

  /**
   * The class list of a header's inner element, which is where the alignment class and the
   * `has-header-button` / `has-sort-indicator` markers the narrow-header rules key on live.
   *
   * @param {string} testId The grid's test id.
   * @param {number} column The visual column index.
   * @returns {Promise<string[]>}
   */
  async headerClasses(testId: string, column: number): Promise<string[]> {
    return this.header(testId, column).locator('.relative')
      .evaluate(relative => Array.from(relative.classList));
  }

  /**
   * Sorts a column ascending, which adds the sort indicator to its header.
   *
   * @param {string} name The grid's key in the fixture's `grids` object.
   * @param {number} column The visual column index.
   */
  async sortColumn(name: string, column: number): Promise<void> {
    await this.page.evaluate(
      ([gridName, col]) => (window as unknown as {
        sortColumn: (name: string, column: number) => void
      }).sortColumn(gridName as string, col as number),
      [name, column] as [string, number]
    );
  }

  /**
   * Measures one header: its width, where its menu icon sits and how wide its sort indicator is.
   *
   * @param {string} testId The grid's test id.
   * @param {number} column The visual column index.
   * @returns {Promise<HeaderGeometry>}
   */
  async geometry(testId: string, column: number): Promise<HeaderGeometry> {
    return this.header(testId, column).evaluate((th) => {
      const cell = th.getBoundingClientRect();
      const button = th.querySelector('.changeType')!.getBoundingClientRect();
      const label = th.querySelector('.colHeader')!;
      const iconSize = parseFloat(getComputedStyle(th).getPropertyValue('--ht-icon-size'));
      const rtl = getComputedStyle(th).direction === 'rtl';
      // The icon is centered in the button's larger hit area.
      const iconStart = button.left + ((button.width - iconSize) / 2);
      const toInline = (x: number) => Math.round((rtl ? cell.right - x : x - cell.left) * 10) / 10;
      const indicator = parseFloat(getComputedStyle(label, '::before').width);

      return {
        width: Math.round(cell.width * 10) / 10,
        icon: rtl ?
          [toInline(iconStart + iconSize), toInline(iconStart)] as [number, number] :
          [toInline(iconStart), toInline(iconStart + iconSize)] as [number, number],
        indicator: Number.isNaN(indicator) ? 0 : indicator,
      };
    });
  }
}
