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
   * True when the option row sits inside the list's clipping box, so the user can
   * actually read it. An option outside that box is scrolled or trimmed out of
   * sight even though the row element itself still reports a bounding box - which
   * is exactly what a collapsed list looked like.
   */
  async isOptionInsideVisibleList(label: string, gridTestId = 'grid'): Promise<boolean> {
    const holderBox = await this.dropdownHolder(gridTestId).boundingBox();
    const optionBox = await this.optionByText(label, gridTestId).boundingBox();

    if (!holderBox || !optionBox) {
      throw new Error(`dropdown holder or the "${label}" option is not rendered`);
    }

    // 2px tolerance: the themes differ in how the list's border is compensated.
    return optionBox.y >= holderBox.y - 2 &&
      (optionBox.y + optionBox.height) <= (holderBox.y + holderBox.height + 2);
  }

  /**
   * The visible height of the option list, in CSS pixels.
   */
  async listHeight(gridTestId = 'grid'): Promise<number> {
    return this.dropdownHolder(gridTestId).evaluate(el => el.getBoundingClientRect().height);
  }

  /**
   * True when the list is taller than its holder, so the user can scroll to the
   * options that do not fit.
   */
  async listCanScroll(gridTestId = 'grid'): Promise<boolean> {
    return this.dropdownHolder(gridTestId).evaluate(el => el.scrollHeight > el.clientHeight);
  }

  /**
   * The row height the active theme actually rendered, published by the fixture.
   */
  async defaultRowHeight(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htRowHeight: number }).htRowHeight);
  }

  /**
   * The number of options the fixture feeds to the autocomplete `source`.
   */
  async sourceOptionCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htOptionCount: number }).htOptionCount);
  }
}
