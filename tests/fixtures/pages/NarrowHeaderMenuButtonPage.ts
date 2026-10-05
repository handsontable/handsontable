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
  /** The rendered width of the header label, `0` when it has collapsed. */
  label: number;
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

    for (const testId of [
      'menu', 'menu-sort', 'menu-sort-right', 'menu-sort-rtl', 'menu-sort-rtl-left', 'no-menu', 'menu-sort-rem',
      'autosize-ltr', 'autosize-rtl-right',
    ]) {
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
   * The narrowest width the active theme allows, pinned per theme: the icon size plus the cell padding
   * on both sides is 16 + 2 * 8 in Main, 16 + 2 * 12 in Horizon and 12 + 2 * 6 in Classic. Pinned rather
   * than computed from the tokens, so a wrong formula in the plugin cannot pass by being repeated here.
   *
   * @returns {number}
   */
  minimumWidth(): number {
    const widths: Record<string, number> = { main: 32, horizon: 40, classic: 24 };

    return widths[this.theme];
  }

  /**
   * The width at which the sort indicator of a column with a menu button is hidden, pinned per theme:
   * 2 * padding + 2 * icon size + 6px, which is 2 * 8 + 2 * 16 + 6 in Main, 2 * 12 + 2 * 16 + 6 in Horizon and
   * 2 * 6 + 2 * 12 + 6 in Classic.
   *
   * @returns {number}
   */
  indicatorMinimumWidth(): number {
    const widths: Record<string, number> = { main: 54, horizon: 62, classic: 42 };

    return widths[this.theme];
  }

  /**
   * The room the header holds open for the sort indicator next to the menu button, pinned per theme: the icon
   * size plus 2px, which is 18px in Main and Horizon and 14px in Classic.
   *
   * @returns {number}
   */
  indicatorSlotWidth(): number {
    const widths: Record<string, number> = { main: 18, horizon: 18, classic: 14 };

    return widths[this.theme];
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
   * Drags a column's resize handle to a given width, reading the current width first.
   *
   * @param {string} testId The grid's test id.
   * @param {number} column The visual column index.
   * @param {number} width The width to drag to, in CSS pixels.
   * @param {boolean} [rtl=false] Whether the grid is right to left, where widening moves the handle the other way.
   */
  async dragColumnTo(testId: string, column: number, width: number, rtl = false): Promise<void> {
    const current = await this.columnWidth(testId, column);
    const delta = (width - current) * (rtl ? -1 : 1);

    await this.dragColumnHandle(testId, column, delta);
  }

  /**
   * Measures a column again from its content and header, as `autoColumnSize` does, and returns its width.
   *
   * @param {string} name The grid's key in the fixture's `grids` object.
   * @param {number} column The visual column index.
   * @returns {Promise<number>}
   */
  async autoWidth(name: string, column: number): Promise<number> {
    return this.page.evaluate(
      ([gridName, col]) => (window as unknown as {
        autoWidth: (name: string, column: number) => number
      }).autoWidth(gridName as string, col as number),
      [name, column] as [string, number]
    );
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
   * The rendered width of one header cell, for a grid that has no menu button to measure.
   *
   * @param {string} testId The grid's test id.
   * @param {number} column The visual column index.
   * @returns {Promise<number>}
   */
  async columnWidth(testId: string, column: number): Promise<number> {
    return this.header(testId, column).evaluate(th => Math.round(th.getBoundingClientRect().width * 10) / 10);
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
      const labelWidth = label.getBoundingClientRect().width;

      return {
        width: Math.round(cell.width * 10) / 10,
        icon: rtl ?
          [toInline(iconStart + iconSize), toInline(iconStart)] as [number, number] :
          [toInline(iconStart), toInline(iconStart + iconSize)] as [number, number],
        indicator: Number.isNaN(indicator) ? 0 : indicator,
        label: Math.round(labelWidth * 10) / 10,
      };
    });
  }
}
