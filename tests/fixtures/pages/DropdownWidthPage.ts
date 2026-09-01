import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the dropdown-width fixture (#13180): three dropdown columns
 * exercising trimDropdown:false with short items (the bug), trimDropdown:false
 * with long items (must keep growing), and default trimDropdown (must keep
 * matching the cell). Encapsulates opening the editor list and locating the
 * inner listbox table for width measurements.
 */
export class DropdownWidthPage {
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
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/dropdown-width.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A data cell in the master table, addressed by the stamped test id. */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /** Open the dropdown editor on a cell and wait for the list to show. */
  async openDropdownAt(row: number, col: number): Promise<void> {
    await this.cell(row, col).dblclick();
    await expect(this.dropdownList()).toBeVisible();
  }

  /** Close the editor between measurements so lists never overlap. */
  async closeDropdown(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.dropdownList()).toBeHidden();
  }

  /** The inner listbox table of the open dropdown editor. */
  dropdownList(): Locator {
    return this.page.locator('.handsontableInputHolder .autocompleteEditor .ht_master .htCore');
  }

  /** The first option row's cell — the user-visible click/highlight target. */
  firstListRowCell(): Locator {
    return this.dropdownList().locator('tbody tr').first().locator('td');
  }
}
