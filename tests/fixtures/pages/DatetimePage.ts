import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the intl-datetime cell type fixture.
 *
 * Wraps the grid seeded with an `intl-datetime` column (see
 * `tests/fixtures/demo/datetime.html`). Selectors prefer `data-testid`
 * (stamped by the fixture's afterRenderer hook); the native datetime-local
 * editor input and the filters dropdown UI are located by their stable
 * type/class hooks because Handsontable renders them without test ids.
 */
export class DatetimePage {
  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;
  readonly editorInput: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
    this.editorInput = page.locator('input[type="datetime-local"].handsontableInput');
  }

  /**
   * Navigate to the fixture and wait for the grid to render — a web-first
   * wait on the first cell, never a fixed timeout.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/datetime.html?theme=${this.theme}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Replace the native `showPicker()` with a counter before the editor opens,
   * so the spec can assert the editor invoked the native picker without the
   * browser actually rendering one (headless browsers reject it anyway).
   */
  async stubNativePicker(): Promise<void> {
    await this.page.evaluate(() => {
      const win = window as unknown as { __pickerCalls: number };

      win.__pickerCalls = 0;
      HTMLInputElement.prototype.showPicker = function() {
        win.__pickerCalls += 1;
      };
    });
  }

  /** How many times the (stubbed) native picker was invoked. */
  async nativePickerCalls(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { __pickerCalls: number }).__pickerCalls);
  }

  /** Open the datetime editor on a cell and wait for the native input. */
  async openEditor(row: number, col: number): Promise<void> {
    await this.cell(row, col).dblclick();
    await expect(this.editorInput).toBeVisible();
  }

  /** Open a cell's editor, fill the native datetime-local input, and commit. */
  async editCell(row: number, col: number, isoValue: string): Promise<void> {
    await this.openEditor(row, col);
    await this.editorInput.fill(isoValue);
    await this.editorInput.press('Enter');
  }

  /** A column header cell (scoped to the top overlay clone, where headers live). */
  columnHeader(caption: string): Locator {
    return this.page.locator('.ht_clone_top thead th', { hasText: caption });
  }

  /** Click a column header to toggle its sort order. */
  async sortByColumn(caption: string): Promise<void> {
    await this.columnHeader(caption).click();
  }

  /** Open the dropdown (filters) menu of a column via its header button. */
  async openDropdownMenu(caption: string): Promise<void> {
    await this.columnHeader(caption).locator('.changeType').click();
    await expect(this.page.locator('.htDropdownMenu .htUISelect')).toBeVisible();
  }

  /**
   * In the open dropdown menu, pick a filter condition by its visible name,
   * then confirm with OK.
   */
  async applyFilterCondition(conditionName: string): Promise<void> {
    await this.page.locator('.htDropdownMenu .htUISelect').first().click();
    await this.page.locator('.htFiltersConditionsMenu td', { hasText: conditionName }).first().click();
    await this.page.locator('.htDropdownMenu .htUIButtonOK input').click();
  }

  /** The number of rendered data rows in the master overlay. */
  rowLocator(): Locator {
    return this.page.locator('.ht_master .htCore tbody tr');
  }
}
