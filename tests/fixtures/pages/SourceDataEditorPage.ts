import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for writing source data while the user edits a cell of the demo grid fixture.
 */
export class SourceDataEditorPage {
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
    await this.page.goto(`/tests/fixtures/demo/grid.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toHaveText('A1');
  }

  /**
   * A data cell, by visual row and column.
   */
  cell(row: number, column: number): Locator {
    return this.page.getByTestId(`cell-${row}-${column}`);
  }

  /**
   * Opens a cell's editor with a click and Enter, and types into it.
   */
  async typeInto(row: number, column: number, text: string): Promise<void> {
    await this.cell(row, column).click();
    await this.page.keyboard.press('Enter');
    await expect.poll(() => this.editorState()).toMatchObject({ opened: true });
    await this.page.keyboard.press('ControlOrMeta+A');
    await this.page.keyboard.type(text);
  }

  /**
   * Writes a value to the source data, as an application syncing data from a server does.
   */
  async setSourceData(physicalRow: number, column: number, value: string): Promise<void> {
    await this.page.evaluate(([row, col, text]) => {
      (window as any).hot.setSourceDataAtCell(row, col, text);
    }, [physicalRow, column, value] as const);
  }

  /**
   * Whether the editor is open, and the text it holds.
   */
  async editorState(): Promise<{ opened: boolean; value: string }> {
    return this.page.evaluate(() => {
      const editor = (window as any).hot.getActiveEditor();

      return { opened: !!editor?.isOpened(), value: editor ? String(editor.getValue()) : '' };
    });
  }
}
