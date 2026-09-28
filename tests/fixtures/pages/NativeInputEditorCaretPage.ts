import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page object for the DEV-3049 fixture: a grid with `date`, `time`, and `intl-datetime` columns,
 * whose editors render native inputs that do not support the selection API. Cells are addressed by
 * `data-testid="cell-<row>-<col>"`; the editor input by its stable `.handsontableInput` class.
 */
export class NativeInputEditorCaretPage {
  /** The Playwright page the fixture is driven through. */
  readonly page: Page;
  /** The active theme, passed through to the fixture URL. */
  readonly theme: string;
  /** The active bundle, passed through to the fixture URL. */
  readonly bundle: string;
  /** The open editor's input element. */
  readonly editorInput: Locator;
  /** Uncaught page errors seen since construction, in the order they fired. */
  readonly pageErrors: string[] = [];

  /**
   * Wires up the page object for one theme/bundle leg and starts collecting uncaught page errors
   * immediately.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.editorInput = page.locator('.handsontableInput');
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/native-input-editor-caret.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Replace the native `showPicker()` with a no-op, so opening the editor does not depend on
   * whether the headless browser agrees to render a picker.
   */
  async stubNativePicker(): Promise<void> {
    await this.page.evaluate(() => {
      HTMLInputElement.prototype.showPicker = () => {};
    });
  }

  /** Select a cell, open its editor with Enter, and wait for the native input of the given type. */
  async openEditor(row: number, col: number, inputType: string): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.press('Enter');
    await expect(this.editorInput).toBeVisible();
    await expect(this.editorInput).toHaveAttribute('type', inputType);
  }
}
