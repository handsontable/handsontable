import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the null-vs-empty-string fixture.
 *
 * Every assertion here reads the DATA SOURCE, never the rendered text: `null` and `''`
 * render as the same blank cell, so rendered text cannot distinguish them and a spec
 * written against it would pass against the bug.
 */
export class EmptyValuePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly editor: Locator;

  /**
   * @param {Page} page The Playwright page.
   * @param {string} theme The theme under test.
   * @param {string} bundle The bundle under test.
   * @param {'default'|'null'} emptyValue Which `emptyValue` the fixture builds the grid with.
   */
  constructor(
    page: Page,
    theme = 'main',
    bundle = 'umd',
    private readonly emptyValue: 'default' | 'null' = 'default',
  ) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.editor = page.locator('.handsontableInput');
  }

  /**
   * Navigates to the fixture and waits for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/empty-value.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&emptyValue=${this.emptyValue}`
    );
    await expect(this.cell(1, 0)).toBeVisible();
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Locator}
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell through the API rather than by clicking.
   *
   * Deliberate: on an EMPTY cell, `click()` followed by `Enter` opens the editor and closes
   * it again on the same keypress, so the editor is never really open (see `tests/AGENTS.md`).
   * Every case here starts from an empty cell, so the click path would test nothing.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => window.htSelect(r, c), [row, col]);
  }

  /**
   * Whether Handsontable considers an editor open.
   *
   * Read through `getActiveEditor().isOpened()` rather than DOM visibility: `.handsontableInput`
   * stays in the DOM whether or not an editor is open, so `toBeVisible()` passes always and
   * `toBeHidden()` never does.
   *
   * @returns {Promise<boolean>}
   */
  private isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getActiveEditor()?.isOpened() === true);
  }

  /**
   * Waits until an editor is open.
   */
  async expectEditorOpen(): Promise<void> {
    await expect.poll(() => this.isEditorOpen()).toBe(true);
  }

  /**
   * Waits until no editor is open.
   */
  async expectEditorClosed(): Promise<void> {
    await expect.poll(() => this.isEditorOpen()).toBe(false);
  }

  /**
   * Opens the editor on a cell and confirms it without changing anything.
   *
   * This is the exact gesture from issue #3927: open, then confirm, having typed nothing.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async openAndConfirmUnchanged(row: number, col: number): Promise<void> {
    await this.selectCell(row, col);
    await this.page.keyboard.press('Enter');
    await this.expectEditorOpen();
    await this.page.keyboard.press('Enter');
    await this.expectEditorClosed();
  }

  /**
   * Opens the editor on a cell, replaces its content, and confirms.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {string} value The value to type. An empty string empties the cell.
   */
  async openAndReplace(row: number, col: number, value: string): Promise<void> {
    await this.selectCell(row, col);
    await this.page.keyboard.press('Enter');
    await this.expectEditorOpen();
    await this.editor.fill(value);
    await this.page.keyboard.press('Enter');
    await this.expectEditorClosed();
  }

  /**
   * Types over a cell without opening the editor first, which is the fast-edit path.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {string} value The value to type.
   */
  async typeOver(row: number, col: number, value: string): Promise<void> {
    await this.selectCell(row, col);
    await this.page.keyboard.type(value);
    await this.expectEditorOpen();
    await this.page.keyboard.press('Enter');
    await this.expectEditorClosed();
  }

  /**
   * Pastes clipboard text into a cell through the CopyPaste plugin.
   *
   * @param {number} row The visual row index to paste at.
   * @param {number} col The visual column index to paste at.
   * @param {string} text The clipboard text.
   */
  async pasteAt(row: number, col: number, text: string): Promise<void> {
    await this.selectCell(row, col);
    await this.page.evaluate(value => window.htPaste(value), text);
  }

  /**
   * Asserts what the DATA SOURCE holds at a cell.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {string} expected One of `null`, `undefined`, `empty-string`, or `<type>:<value>`.
   */
  async expectSource(row: number, col: number, expected: string): Promise<void> {
    await expect
      .poll(() => this.page.evaluate(([r, c]) => window.htSourceAt(r, c), [row, col]))
      .toBe(expected);
  }

  /**
   * Asserts how many change events the grid has emitted since it loaded.
   *
   * @param {number} expected The expected number of recorded changes.
   */
  async expectChangeCount(expected: number): Promise<void> {
    await expect.poll(() => this.page.evaluate(() => window.htChangeCount())).toBe(expected);
  }
}

declare global {
  interface Window {
    hot: { getActiveEditor: () => { isOpened: () => boolean } | null | undefined };
    htSelect: (row: number, col: number) => void;
    htSourceAt: (row: number, col: number) => string;
    htChangeCount: () => number;
    htPaste: (text: string) => void;
  }
}
