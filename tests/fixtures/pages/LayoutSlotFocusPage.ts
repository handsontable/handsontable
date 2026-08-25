import { type Locator, type Page, expect } from '@playwright/test';

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
  isListening(): boolean;
}

/**
 * Page Object for the layout-slot focus fixture.
 */
export class LayoutSlotFocusPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly outsideClickDeselects: boolean;
  readonly pageSizeSelect: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd', outsideClickDeselects = true) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.outsideClickDeselects = outsideClickDeselects;
    this.pageSizeSelect = page.getByRole('combobox', { name: 'Page size' });
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/layout-slot-focus.html?theme=${this.theme}&bundle=${this.bundle}&outsideClickDeselects=${this.outsideClickDeselects}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell and opens its editor.
   */
  async openEditor(row: number, col: number): Promise<Locator> {
    await this.cell(row, col).click();
    await this.page.keyboard.press('Enter');

    const editor = this.page.locator('.handsontableInput');

    await expect(editor).toBeVisible();

    return editor;
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
