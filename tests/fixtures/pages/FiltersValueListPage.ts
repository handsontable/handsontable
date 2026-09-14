import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the "filter by value" dropdown-menu fixture.
 *
 * The filters dropdown is grid-internal DOM, so it cannot carry fixture-stamped
 * `data-testid` attributes. Its class hooks (`.htUISelect`, `.htUIMultipleSelect`,
 * `.htUIButtonOK`) are the plugin's own stable names and live only here — a spec
 * never spells them out.
 */
export class FiltersValueListPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly menu: Locator;
  readonly valueList: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.menu = page.locator('.htDropdownMenu');
    this.valueList = this.menu.locator('.htUIMultipleSelect .ht_master .htCore tbody tr');
  }

  /**
   * Navigate to the fixture and wait for the grid to render. The active theme and
   * bundle are passed as query params so the fixture loads the matching stylesheet
   * and Handsontable build.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/filters-value-list.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** The values currently rendered in the given column, top to bottom. */
  async columnValues(col: number): Promise<string[]> {
    return this.page.locator(`.ht_master .htCore tbody td[data-testid$="-${col}"]`).allTextContents();
  }

  /** Open the dropdown menu of the column with the given header label. */
  async openMenu(headerLabel: string): Promise<void> {
    await this.page
      .locator('.ht_clone_top th')
      .filter({ hasText: new RegExp(`^${headerLabel}$`) })
      .locator('.changeType')
      .click();

    await expect(this.menu).toBeVisible();
    await expect(this.valueList.first()).toBeVisible();
  }

  /** The list items that currently carry the grid's focus highlight. */
  focusedListItems(): Locator {
    return this.menu.locator('.htUIMultipleSelect .ht_master .htCore tbody td.current');
  }

  /**
   * Opens the dropdown menu of the given column from the keyboard, the way a user reaches it without
   * the mouse. The keyboard path keeps the by-value list alive across menu openings, which the click
   * path does not, so a focus ring left in the list survives into the next opening.
   *
   * @param {number} row Visual row index to select first.
   * @param {number} col Visual column index whose menu opens.
   */
  async openMenuWithKeyboard(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => (window as unknown as {
      hot: { selectCell: (row: number, column: number) => void }
    }).hot.selectCell(r, c), [row, col]);
    await this.page.keyboard.press('Alt+Shift+ArrowDown');

    await expect(this.menu).toBeVisible();
    await expect(this.valueList.first()).toBeVisible();
  }

  /** Close the menu with the Escape key and wait for it to go away. */
  async escapeMenu(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.menu).toBeHidden();
  }

  /** Confirm the menu with the "OK" button and wait for it to close. */
  async confirmMenu(): Promise<void> {
    await this.menu.locator('.htUIButtonOK input').click();
    await expect(this.menu).toBeHidden();
  }

  /**
   * Pick a condition in the first "Filter by condition" select.
   *
   * @param {string} conditionLabel The condition's visible label, e.g. "Contains" or "None".
   */
  async selectCondition(conditionLabel: string): Promise<void> {
    await this.menu.locator('.htFiltersMenuCondition .htUISelect').first().click();

    // Each of the two condition selects owns a `.htFiltersConditionsMenu` container;
    // only the opened one is rendered.
    const conditionsMenu = this.page.locator('.htFiltersConditionsMenu:visible');

    await expect(conditionsMenu).toBeVisible();
    await conditionsMenu.locator('td').filter({ hasText: new RegExp(`^${conditionLabel}$`) }).click();
    await expect(conditionsMenu).toBeHidden();
  }

  /**
   * Pick a condition in the "Filter by condition" select and type its argument.
   *
   * @param {string} conditionLabel The condition's visible label, e.g. "Contains".
   * @param {string} value The value typed into the condition's input.
   */
  async applyCondition(conditionLabel: string, value: string): Promise<void> {
    await this.selectCondition(conditionLabel);

    const input = this.menu.locator('.htFiltersMenuCondition .htUIInput input').first();

    await expect(input).toBeVisible();
    await input.fill(value);
    // `InputUI` syncs its value on `keyup`, so a plain `fill()` alone is not enough.
    await input.press('End');
  }

  /**
   * The "filter by value" list as `[checked, label]` pairs, in display order.
   *
   * @returns {Promise<Array>} One entry per listed value.
   */
  async listedValues(): Promise<{ checked: boolean; label: string }[]> {
    const rows = await this.valueList.all();

    return Promise.all(rows.map(async(row) => ({
      checked: await row.locator('input[type="checkbox"]').isChecked(),
      label: (await row.locator('label').innerText()).trim(),
    })));
  }

  /** Uncheck the "filter by value" item carrying the given label. */
  async uncheckValue(label: string): Promise<void> {
    const checkbox = this.valueList
      .filter({ has: this.page.locator('label', { hasText: new RegExp(`^${label}$`) }) })
      .locator('input[type="checkbox"]');

    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  }

  /**
   * Add a filter condition to a column through the plugin API and apply it, the way the documented
   * `filter()` recipe does. This is the API counterpart to the menu-driven `applyCondition()`.
   *
   * @param {number} column The visual column index.
   * @param {string} name The condition short name (e.g. `eq`, `by_value`).
   * @param {Array} args The condition arguments.
   */
  async addFilter(column: number, name: string, args: unknown[]): Promise<void> {
    await this.page.evaluate(({ column: col, name: conditionName, args: conditionArgs }) => {
      const plugin = window.hot.getPlugin('filters');

      plugin.addCondition(col, conditionName, conditionArgs);
      plugin.filter();
    }, { column, name, args });
  }

  /**
   * Replace the grid's source data while keeping the `filters` option in the payload, exactly as the
   * React and Angular wrappers re-send their whole settings object on every update. Passing `filters`
   * is what makes `updateSettings` run the Filters plugin's `updatePlugin` (disable + enable) cycle.
   *
   * @param {Array} data The new source data.
   */
  async replaceData(data: unknown[][]): Promise<void> {
    await this.page.evaluate((newData) => {
      window.hot.updateSettings({ data: newData, filters: true });
    }, data);
  }

  /**
   * Write a value into a cell through the API, which fires `afterChange`.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {string} value The new value.
   */
  async setCellValue(row: number, col: number, value: string): Promise<void> {
    await this.page.evaluate(({ row: r, col: c, value: v }) => {
      window.hot.setDataAtCell(r, c, v);
    }, { row, col, value });
  }

  /** The number of rows the grid currently shows (source rows minus the filtered-out ones). */
  async visibleRowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }
}
