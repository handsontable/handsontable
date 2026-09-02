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

  /**
   * Type a value into a data cell, replacing what it held.
   *
   * Typing straight onto a selected cell starts a fresh edit, so the new value replaces the old
   * one. Opening the editor with a double click would keep the old text and append to it instead.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {string} value The value to type.
   */
  async typeIntoCell(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.type(value);
    await this.page.keyboard.press('Enter');

    await expect(this.cell(row, col)).toHaveText(value);
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

  /**
   * Open the dropdown menu of a column whose value list is empty.
   *
   * A column that is not filtered itself builds its list from the rows still on screen, so another
   * column's filter can leave it with nothing to list. `openMenu()` waits for a first row and would
   * time out here, so this variant waits for the list container instead.
   *
   * @param {string} headerLabel The column header's visible label.
   */
  async openEmptyMenu(headerLabel: string): Promise<void> {
    await this.page
      .locator('.ht_clone_top th')
      .filter({ hasText: new RegExp(`^${headerLabel}$`) })
      .locator('.changeType')
      .click();

    await expect(this.menu).toBeVisible();
    await expect(this.menu.locator('.htUIMultipleSelect')).toBeVisible();
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

  /** Check the "filter by value" item carrying the given label. */
  async checkValue(label: string): Promise<void> {
    const checkbox = this.valueList
      .filter({ has: this.page.locator('label', { hasText: new RegExp(`^${label}$`) }) })
      .locator('input[type="checkbox"]');

    await checkbox.click();
    await expect(checkbox).toBeChecked();
  }

  /**
   * The filter conditions the grid currently holds, as the plugin exports them. Some defects only
   * show here — a condition naming a value that no longer exists matches nothing, so the rows on
   * screen look correct while the column still reads as filtered.
   *
   * @returns {Promise<Array>} One entry per filtered column.
   */
  async exportedConditions(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getPlugin(name: string): { exportConditions(): unknown[] } };
    }).hot.getPlugin('filters').exportConditions());
  }

  /** Click the "Select all" link, which checks every value the filter holds. */
  async selectAllValues(): Promise<void> {
    await this.menu.locator('.htUIMultipleSelect a', { hasText: /^Select all$/ }).click();

    await expect(this.valueList.first().locator('input[type="checkbox"]')).toBeChecked();
  }

  /**
   * Click the "Clear" link, which unchecks every value the filter holds.
   *
   * @param {object} [options] Options.
   * @param {boolean} [options.expectEmptyList] Set when the list holds no values, so there are no
   *   checkboxes to wait for.
   */
  async clearAllValues({ expectEmptyList = false } = {}): Promise<void> {
    await this.menu.locator('.htUIMultipleSelect a', { hasText: /^Clear$/ }).click();

    if (expectEmptyList) {
      return;
    }

    // The inner list is its own Handsontable, so wait for it to repaint before the caller confirms
    // the menu - otherwise OK can read the pre-clear checkboxes.
    await expect(this.valueList.first().locator('input[type="checkbox"]')).not.toBeChecked();
  }

  /** Uncheck the "filter by value" item carrying the given label. */
  async uncheckValue(label: string): Promise<void> {
    const checkbox = this.valueList
      .filter({ has: this.page.locator('label', { hasText: new RegExp(`^${label}$`) }) })
      .locator('input[type="checkbox"]');

    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  }
}
