import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

export type PointerCancellationVariant = 'ltr' | 'rtl' | 'frozen' | 'shadow';

/**
 * Page Object for the pointer-cancellation-toggles fixture: one grid with the collapse indicator of a column
 * group, the "check all" checkbox of the Done column, and the row checkboxes and "select all" checkbox of
 * the row selection, laid out as the variant says (plain, right to left, with frozen columns, in a shadow
 * root).
 *
 * Every control is scoped to the overlay clone the user presses: the headers are drawn in the top clone
 * (and, for a frozen column, in the clone of the top start corner), the row checkboxes in the inline start
 * clone. Playwright's locators pierce an open shadow root, so the same locators serve the shadow variant.
 */
export class PointerCancellationTogglesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly variant: PointerCancellationVariant;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd', variant: PointerCancellationVariant = 'ltr') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.variant = variant;
  }

  /**
   * Navigates to the fixture and waits for the grid to render. A grid that failed to build is rethrown.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/pointer-cancellation-toggles.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&variant=${this.variant}`
    );
    await awaitBundle(this.page);

    const buildError = await this.page.evaluate(
      () => (window as unknown as { htBuildError?: string }).htBuildError ?? null
    );

    if (buildError) {
      throw new Error(`The fixture grid failed to build: ${buildError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell, by visual row and column.
   */
  cell(row: number, column: number): Locator {
    return this.page.getByTestId(`cell-${row}-${column}`).first();
  }

  /**
   * The overlay clone that draws the Done column's header: the top clone, or the clone of the top start corner
   * when the column is frozen.
   */
  private doneHeaderClone(): Locator {
    return this.page.locator(this.variant === 'frozen' ? '.ht_clone_top_inline_start_corner' : '.ht_clone_top');
  }

  /**
   * The collapse indicator of the "Group" header.
   */
  groupIndicator(): Locator {
    return this.page.locator('.ht_clone_top .collapsibleIndicator');
  }

  /**
   * The "check all" checkbox in the header of the Done column.
   */
  doneHeaderCheckbox(): Locator {
    return this.doneHeaderClone().getByRole('checkbox', { name: /^Check all/ });
  }

  /**
   * The checkbox of a row, in the inline start clone.
   */
  rowCheckbox(row: number): Locator {
    return this.page.locator('.ht_clone_inline_start')
      .getByRole('checkbox', { name: `Select row ${row + 1}`, exact: true });
  }

  /**
   * The "select all" checkbox, in the clone of the top start corner.
   */
  selectAllCheckbox(): Locator {
    return this.page.locator('.ht_clone_top_inline_start_corner')
      .getByRole('checkbox', { name: /^Select all rows/ });
  }

  /**
   * The visual columns the collapsed group hides.
   */
  collapsedColumns(): Promise<number[]> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getPlugin(name: 'collapsibleColumns'): { getCollapsedColumns(): number[] } };
    }).hot.getPlugin('collapsibleColumns').getCollapsedColumns());
  }

  /**
   * The values of the Done column, in physical order.
   */
  doneValues(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getSourceData(): Array<{ done: unknown }> };
    }).hot.getSourceData().map(row => row.done));
  }

  /**
   * The rows the row selection holds, in visual indexes.
   */
  selectedRows(): Promise<number[]> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getPlugin(name: 'rowSelection'): { getSelectedRows(): number[] } };
    }).hot.getPlugin('rowSelection').getSelectedRows());
  }

  /**
   * The cell selection, which a press on a control must leave alone.
   */
  cellSelection(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getSelected(): number[][] | undefined };
    }).hot.getSelected());
  }
}
