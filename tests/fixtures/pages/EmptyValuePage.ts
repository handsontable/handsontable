import { type Page, type Locator, expect } from '@playwright/test';

/**
 * The slice of the grid API this page reads in the browser. Declared locally, the way the other
 * editor page objects do it, rather than augmenting `Window` again — `windowTypes.ts` already
 * augments it with `hot`, and a second augmentation of the same property with a different type is a
 * TS2717 error.
 */
interface HandsontableFixture {
  getActiveEditor(): { isOpened(): boolean } | undefined;
}

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
    private readonly strict: 'off' | 'on' = 'off',
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
      `&emptyValue=${this.emptyValue}&strict=${this.strict}`
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
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor()?.isOpened() === true
    ));
  }

  /**
   * Presses Enter, without asserting anything about what it does.
   *
   * Used by specs that drive an editor which validation reopens, where the usual open/confirm
   * helpers do not apply because the editor never closes.
   */
  async pressEnter(): Promise<void> {
    await this.page.keyboard.press('Enter');
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
   * Selects a rectangular range through the API.
   *
   * @param {number} fromRow The visual row index to start from.
   * @param {number} fromCol The visual column index to start from.
   * @param {number} toRow The visual row index to end at.
   * @param {number} toCol The visual column index to end at.
   */
  async selectRange(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    await this.page.evaluate(
      ([r1, c1, r2, c2]) => window.htSelectRange(r1, c1, r2, c2),
      [fromRow, fromCol, toRow, toCol]
    );
  }

  /**
   * Opens the editor on the current selection's focus cell and confirms it the way Ctrl/Cmd + Enter
   * does, which copies the edited value into every other cell of the selection.
   *
   * The confirm goes through the API, not the keyboard — see the fixture's `htConfirmWithCtrl` for
   * why Playwright cannot deliver that chord to the grid.
   */
  async confirmWithCtrlEnter(): Promise<void> {
    await this.page.keyboard.press('Enter');
    await this.expectEditorOpen();
    await this.page.evaluate(() => window.htConfirmWithCtrl());
    await this.expectEditorClosed();
  }

  /**
   * The same Ctrl/Cmd + Enter confirm, but with the selection range taken away for the call.
   *
   * A range is always there in practice. The editor guards against a missing one anyway, and this
   * is the only way to reach that branch from a spec.
   */
  async confirmWithCtrlEnterAndNoRange(): Promise<void> {
    await this.page.keyboard.press('Enter');
    await this.expectEditorOpen();
    await this.page.evaluate(() => window.htConfirmWithCtrlNoRange());
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
   * Removes one row through the API.
   *
   * @param {number} row The visual row index.
   */
  async removeRow(row: number): Promise<void> {
    await this.page.evaluate(r => window.htRemoveRow(r), row);
  }

  /**
   * Undoes the last action.
   */
  async undo(): Promise<void> {
    await this.page.evaluate(() => window.htUndo());
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

// `hot` is deliberately NOT declared here: `windowTypes.ts` already augments `Window` with it, and a
// second augmentation of the same property with a different type is a TS2717 error. The one place
// this page needs the editor API reads it through a local cast, as the other page objects do.
declare global {
  interface Window {
    htSelect: (row: number, col: number) => void;
    htSelectRange: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
    htConfirmWithCtrl: () => void;
    htConfirmWithCtrlNoRange: () => void;
    htSourceAt: (row: number, col: number) => string;
    htChangeCount: () => number;
    htPaste: (text: string) => void;
    htRemoveRow: (row: number) => void;
    htUndo: () => void;
  }
}
