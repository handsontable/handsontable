import { type Locator, type Page, expect } from '@playwright/test';

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
  isListening(): boolean;
}

/**
 * Page Object for the layout-slot focus fixture.
 *
 * Scope is deliberately narrow: whether clicking the grid's layout-slot UI counts as an outside
 * click. Everything about an editor whose cell stops being rendered lives in
 * `EditorHiddenCellPage`; do not grow this one back into that.
 */
export class LayoutSlotFocusPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly outsideClickDeselects: boolean;
  readonly pageSizeSelect: Locator;
  readonly nextPageButton: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd', outsideClickDeselects = true) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.outsideClickDeselects = outsideClickDeselects;
    this.pageSizeSelect = page.getByRole('combobox', { name: 'Page size' });
    this.nextPageButton = page.getByRole('button', { name: 'Go to next page' });
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/layout-slot-focus.html?theme=${this.theme}&bundle=${this.bundle}&outsideClickDeselects=${this.outsideClickDeselects}`);

    // Wait for the bundle before the cell. The test id comes from the fixture's custom renderer,
    // so "cell not found" alone cannot tell a slow bundle apart from a grid that failed to render.
    await this.page.waitForFunction(() => 'Handsontable' in window);

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Returns the grid's current selection.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as Window & { hot: HandsontableFixture }).hot.getSelected());
  }

  /**
   * Reports whether the grid keeps its keyboard listener active.
   */
  async isListening(): Promise<boolean> {
    return this.page.evaluate(() => (window as Window & { hot: HandsontableFixture }).hot.isListening());
  }
}
