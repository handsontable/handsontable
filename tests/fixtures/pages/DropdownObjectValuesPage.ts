import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
}

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
// full instance type, and narrowing it here would be a TS2430 conflict.
interface FixtureWindow {
  hot: HandsontableFixture;
  htStoredEntryAt(row: number, col: number): string;
  htPastePlainText(row: number, col: number, text: string): void;
  htSelectCell(row: number, col: number): void;
  htValidState(row: number, col: number): string;
}

/**
 * Page Object for the fixture whose `source` holds key/value entries with an OBJECT `value`,
 * labeled through the `sourceLabel` option.
 *
 * What the cell stores is compared in full against the fixture's own source entries: a flattened
 * pair renders the same label as the real entry, so the rendered text alone could not catch an
 * edit that drops the object.
 */
export class DropdownObjectValuesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  /** The column dropdown menu, which hosts the Filters UI. */
  readonly menu: Locator;
  /** One row per item of the Filters "by value" list. */
  readonly valueList: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.menu = page.locator('.htDropdownMenu');
    this.valueList = this.menu.locator('.htUIMultipleSelect .ht_master .htCore tbody tr');
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/dropdown-object-values.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    // Wait for the bundle before the cell, so a slow bundle and a broken grid read differently.
    await awaitBundle(this.page);

    // Rethrow a constructor throw the fixture captured, instead of a bare "element(s) not found".
    const initError = await this.page.getByTestId('grid').getAttribute('data-init-error');

    if (initError !== null) {
      throw new Error(`The fixture grid failed to build: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell in the master table through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId('grid').locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The label a cell displays, without the dropdown arrow the renderer prepends to the text.
   */
  async cellLabel(row: number, col: number): Promise<string> {
    return this.cell(row, col).evaluate((td) => {
      const clone = td.cloneNode(true) as HTMLElement;

      clone.querySelectorAll('.htAutocompleteArrow').forEach(arrow => arrow.remove());

      return (clone.textContent ?? '').trim();
    });
  }

  /**
   * The rendered options of the open list.
   */
  options(): Locator {
    return this.page.locator('.handsontableEditor .ht_master tbody td');
  }

  /**
   * Opens the cell's editor with a real <kbd>Enter</kbd> and waits for the list to render.
   *
   * The keyboard, not a click: a centred click on a dropdown cell can land on its arrow and open
   * the list by itself, and the Enter that follows then commits and closes it (`tests/AGENTS.md`).
   */
  async openEditor(row: number, col: number): Promise<void> {
    await this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).htSelectCell(r, c),
      [row, col],
    );

    await expect.poll(() => this.selected()).toEqual([[row, col, row, col]]);

    await this.page.keyboard.press('Enter');
    await expect(this.options()).not.toHaveCount(0);
  }

  /**
   * Clicks the option showing exactly `label` in the open list.
   */
  async pickOption(label: string): Promise<void> {
    await this.page.locator('.handsontableEditor .ht_master tbody').getByText(label, { exact: true }).click();
  }

  /**
   * Reports which source entry the cell stores: `entry:<key>` when it equals that entry in full,
   * `other:<json>` for any other object, `null`, or `<type>:<value>` for a primitive.
   */
  async storedEntryAt(row: number, col: number): Promise<string> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).htStoredEntryAt(r, c),
      [row, col],
    );
  }

  /**
   * Pastes plain text into a cell through the CopyPaste plugin's `paste()`, which carries the
   * `text/plain` flavor only - the shape a paste from another application has.
   */
  async pastePlainText(row: number, col: number, text: string): Promise<void> {
    await this.page.evaluate(
      ([r, c, value]) => {
        (window as unknown as FixtureWindow).htPastePlainText(Number(r), Number(c), String(value));
      },
      [row, col, text],
    );
  }

  /**
   * Reports the cell's validation state as `'valid'`, `'invalid'` or `'unvalidated'`.
   */
  async validState(row: number, col: number): Promise<string> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).htValidState(r, c),
      [row, col],
    );
  }

  /**
   * The header cell of a column in the top overlay, found by its caption.
   */
  header(caption: string): Locator {
    return this.page.locator('.ht_clone_top th').filter({ hasText: new RegExp(`^${caption.replace(/[()]/g, '\\$&')}$`) });
  }

  /**
   * Sorts a column with a real click on its header caption. ColumnSorting reacts only when the
   * press lands on the `span.colHeader` element itself, so the click aims at that span.
   */
  async clickSortHeader(caption: string): Promise<void> {
    await this.header(caption).locator('.colHeader').click();
  }

  /**
   * The labels a column displays, top to bottom, for the given rows.
   */
  async columnLabels(col: number, rows: number[]): Promise<string[]> {
    const labels: string[] = [];

    for (const row of rows) {
      labels.push(await this.cellLabel(row, col));
    }

    return labels;
  }

  /**
   * Opens a column's dropdown menu through its header button and waits for the menu.
   */
  async openFilterMenu(caption: string): Promise<void> {
    await this.header(caption).locator('.changeType').click();
    await expect(this.menu).toBeVisible();
    await expect(this.valueList).not.toHaveCount(0);
  }

  /**
   * The Filters "by value" list labels, in display order.
   */
  async listedFilterValues(): Promise<string[]> {
    const labels = await this.valueList.locator('label').allInnerTexts();

    return labels.map(label => label.trim());
  }

  /**
   * In the open menu, keeps only the given value checked and confirms with OK.
   */
  async filterByOnlyValue(label: string): Promise<void> {
    await this.menu.locator('.htUIMultipleSelect a', { hasText: /^Clear$/ }).click();

    const checkbox = this.valueList
      .filter({ has: this.page.locator('label', { hasText: new RegExp(`^${label}$`) }) })
      .locator('input[type="checkbox"]');

    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await this.menu.locator('.htUIButtonOK input').click();
    await expect(this.menu).toBeHidden();
  }

  /**
   * Returns the grid's current selection.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected());
  }
}
