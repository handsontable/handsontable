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
}
