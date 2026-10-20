import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface HandsontableFixture {
  getPlugin(name: 'columnSorting'): { sort(config: { column: number; sortOrder: string }): void };
  getPlugin(name: 'filters'): {
    addCondition(column: number, name: string, args: unknown[]): void;
    filter(): void;
  };
  getPlugin(name: 'manualRowMove'): { moveRow(row: number, finalIndex: number): void };
  getPlugin(name: 'manualColumnMove'): { moveColumn(column: number, finalIndex: number): void };
  setSourceDataAtCell(row: number, column: number, value: unknown): void;
  getSourceData(): string[][];
  getActiveEditor(): { isOpened(): boolean; getValue(): unknown } | undefined;
}

/**
 * Page Object for refreshing an open select editor on a grid whose visual rows differ from its
 * physical ones.
 */
export class SelectEditorRefreshPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigates to the fixture and waits for the grid.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/select-editor-refresh.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell, by visual row and column.
   */
  cell(row: number, column: number): Locator {
    return this.page.getByTestId(`cell-${row}-${column}`);
  }

  /**
   * Sorts the first column ascending, so visual row 0 becomes physical row 1.
   */
  async sortByName(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { hot: HandsontableFixture }).hot
        .getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
    });
  }

  /**
   * Moves a row, so the visual order differs from the physical one.
   */
  async moveRow(row: number, finalIndex: number): Promise<void> {
    await this.page.evaluate(([from, to]) => {
      (window as unknown as { hot: HandsontableFixture }).hot.getPlugin('manualRowMove').moveRow(from, to);
      (window as unknown as { hot: { render(): void } }).hot.render();
    }, [row, finalIndex] as const);
  }

  /**
   * Moves a column, so the visual order differs from the physical one.
   */
  async moveColumn(column: number, finalIndex: number): Promise<void> {
    await this.page.evaluate(([from, to]) => {
      (window as unknown as { hot: HandsontableFixture }).hot.getPlugin('manualColumnMove').moveColumn(from, to);
      (window as unknown as { hot: { render(): void } }).hot.render();
    }, [column, finalIndex] as const);
  }

  /**
   * Picks an option in the open editor and confirms it with Enter.
   */
  async chooseAndConfirm(option: string): Promise<void> {
    await this.page.locator('.htSelectEditor select').selectOption(option);
    await this.page.keyboard.press('Enter');
    await expect.poll(() => this.editorState()).toMatchObject({ opened: false });
  }

  /**
   * Filters the first column down to the listed values.
   */
  async filterNames(values: string[]): Promise<void> {
    await this.page.evaluate((targetValues) => {
      const filters = (window as unknown as { hot: HandsontableFixture }).hot.getPlugin('filters');

      filters.addCondition(0, 'by_value', [targetValues]);
      filters.filter();
    }, values);
  }

  /**
   * Opens the editor of a cell with a click and Enter.
   */
  async openEditor(row: number, column: number): Promise<void> {
    await this.cell(row, column).click();
    await this.page.keyboard.press('Enter');
    await expect.poll(() => this.editorState()).toMatchObject({ opened: true });
  }

  /**
   * Writes a value to the source data by physical row, as an application syncing data from a server does.
   */
  async setSourceData(physicalRow: number, column: number, value: string): Promise<void> {
    await this.page.evaluate(([row, col, text]) => {
      (window as unknown as { hot: HandsontableFixture }).hot
        .setSourceDataAtCell(row as number, col as number, text);
    }, [physicalRow, column, value] as const);
  }

  /**
   * The source data, in physical order.
   */
  async sourceData(): Promise<string[][]> {
    return this.page.evaluate(() => (window as unknown as { hot: HandsontableFixture }).hot.getSourceData());
  }

  /**
   * Whether the editor is open, and the value it holds.
   */
  async editorState(): Promise<{ opened: boolean; value: string }> {
    return this.page.evaluate(() => {
      const editor = (window as unknown as { hot: HandsontableFixture }).hot.getActiveEditor();

      return { opened: !!editor?.isOpened(), value: editor ? String(editor.getValue()) : '' };
    });
  }
}
