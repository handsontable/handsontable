import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the dropdown-height fixture (#8872 / DEV-1656): an autocomplete
 * dropdown opened in a grid that a flexbox parent squeezed to 1.5 rows, plus a
 * normal-height control grid. Encapsulates opening the list, reading the theme's
 * rendered row height, and measuring the list box.
 */
export class DropdownHeightPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate and wait for both grids to render (a real DOM condition, no sleep).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/dropdown-height.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.cell(0, 0)).toBeVisible();
    await expect(this.cell(0, 0, 'grid-tall')).toBeVisible();
  }

  /**
   * A data cell in the master table of one of the fixture's grids.
   */
  cell(row: number, col: number, gridTestId = 'grid'): Locator {
    return this.page.getByTestId(gridTestId).locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Open the autocomplete editor on a cell and wait for the list to show.
   */
  async openDropdownAt(row: number, col: number, gridTestId = 'grid'): Promise<void> {
    await this.cell(row, col, gridTestId).dblclick();
    await expect(this.dropdownList(gridTestId)).toBeAttached();
  }

  /**
   * The inner listbox table of the open dropdown editor.
   */
  dropdownList(gridTestId = 'grid'): Locator {
    return this.page.getByTestId(gridTestId)
      .locator('.handsontableInputHolder .autocompleteEditor .ht_master .htCore');
  }

  /**
   * The scrollable holder that clips the option rows — the element whose height
   * decides how much of the list the user actually sees.
   */
  dropdownHolder(gridTestId = 'grid'): Locator {
    return this.page.getByTestId(gridTestId)
      .locator('.handsontableInputHolder .autocompleteEditor .ht_master .wtHolder');
  }

  /**
   * Every option row cell currently rendered in the open list. The list is
   * virtualized, so a trimmed list renders only the rows near the viewport.
   */
  options(gridTestId = 'grid'): Locator {
    return this.dropdownList(gridTestId).locator('tbody tr td');
  }

  /**
   * One option row addressed by its label.
   */
  optionByText(label: string, gridTestId = 'grid'): Locator {
    return this.options(gridTestId).filter({ hasText: label });
  }

  /**
   * Walk down the option list with the keyboard, the way a user reaches the options
   * that a trimmed list does not show. Navigation stops on the last option, so
   * pressing more times than there are options always lands on it.
   */
  async arrowDownThroughList(times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.page.keyboard.press('ArrowDown');
    }
  }

  /**
   * How much of the option row is genuinely on screen, in CSS pixels.
   *
   * The row is intersected with EVERY clipping ancestor, not just the list's own
   * holder. That holder is a descendant of the grid's root element, which carries
   * `overflow: clip` whenever a `height` setting is applied, and the holder can hang
   * past the root's bottom edge - so measuring the row against the holder alone
   * reports a row as visible after the grid root has already cut it away. Playwright's
   * `toBeVisible()` has the same blind spot: it only needs a non-empty bounding box.
   */
  async visibleHeightOfOption(label: string, gridTestId = 'grid'): Promise<number> {
    return this.optionByText(label, gridTestId).evaluate((element: Element) => {
      const view = element.ownerDocument.defaultView;

      if (!view) {
        throw new Error('the option is not attached to a rendered document');
      }

      const rect = element.getBoundingClientRect();
      let top = rect.top;
      let bottom = rect.bottom;
      let ancestor = element.parentElement;

      while (ancestor && ancestor !== element.ownerDocument.body) {
        if (view.getComputedStyle(ancestor).overflowY !== 'visible') {
          const box = ancestor.getBoundingClientRect();

          top = Math.max(top, box.top);
          bottom = Math.min(bottom, box.bottom);
        }

        ancestor = ancestor.parentElement;
      }

      return Math.max(0, bottom - top);
    });
  }

  /**
   * The height the editor gave the option list, in CSS pixels.
   *
   * This is the holder's own box, so it does NOT account for the grid root clipping
   * the list - use `visibleHeightOfOption()` for what the user can actually read.
   * Kept separate because the two answer different questions: this one pins the size
   * the editor computed, which is where the zero-height regression originated.
   */
  async listHeight(gridTestId = 'grid'): Promise<number> {
    return this.dropdownHolder(gridTestId).evaluate((el: Element) => el.getBoundingClientRect().height);
  }

  /**
   * True when the list is taller than its holder, so the user can scroll to the
   * options that do not fit.
   */
  async listCanScroll(gridTestId = 'grid'): Promise<boolean> {
    return this.dropdownHolder(gridTestId).evaluate((el: Element) => el.scrollHeight > el.clientHeight);
  }

  /**
   * The row height the active theme actually rendered, published by the fixture.
   */
  async defaultRowHeight(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htRowHeight: number }).htRowHeight);
  }

  /**
   * The row height the editor sizes its option rows by (`getDefaultRowHeight()`),
   * published by the fixture. It is 1px under `defaultRowHeight()` — the first-row
   * border compensation — so the two must not be used interchangeably when asserting
   * against an exact one-row boundary.
   */
  async listRowHeight(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htListRowHeight: number }).htListRowHeight);
  }

  /**
   * The number of options the fixture feeds to the autocomplete `source`.
   */
  async sourceOptionCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htOptionCount: number }).htOptionCount);
  }
}
