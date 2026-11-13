import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

/**
 * The editor column B edits with in `demo/editor-validation-wait-own-cell.html`: the FormulaBuilder
 * editor, or the plain text editor.
 */
export type ValidationWaitEditor = 'formula' | 'text';

/**
 * A B validation the fixture holds until the spec releases it: the visual row and the value asked.
 */
export interface HeldValidation {
  row: number;
  value: unknown;
}

/**
 * The fixture's globals the page object reads.
 */
interface FixtureWindow {
  hot: {
    getActiveEditor(): { isOpened?: () => boolean, state?: string } | undefined;
    getDataAtCell(row: number, col: number): unknown;
    getCellMeta(row: number, col: number): { valid?: boolean };
    getPlugin(name: 'undoRedo'): { isUndoAvailable(): boolean, undo(): void };
  };
  htPending: Array<HeldValidation & { callback: (valid: boolean) => void }>;
  htDependentPending: unknown[];
}

/**
 * Page object for the editor validation wait fixture (`demo/editor-validation-wait-own-cell.html`):
 * column B is numeric with an async validator that rejects negatives (`allowInvalid: false`),
 * column C holds `=B<n>*2`, and a button runs `hot.validateCells()`. B's validator answers only
 * when the spec releases it (`window.htPending`), in the order the validations were asked.
 */
export class EditorValidationWaitPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly editor: ValidationWaitEditor;
  readonly grid: Locator;
  readonly validateCellsButton: Locator;
  /**
   * The FormulaBuilder editor input, shared by the bar and the inline editor.
   */
  readonly formulaEditorInput: Locator;
  /**
   * The bar's idle (click-to-edit) formula area.
   */
  readonly barFormulaArea: Locator;
  /**
   * The editor root while the formula bar hosts the edit.
   */
  readonly barEditorOverlay: Locator;
  /**
   * The text editor's textarea (it stays in the DOM while closed, see `editorOpened()`).
   */
  readonly textEditorInput: Locator;
  /**
   * The row of the highlighted cell in the master table.
   */
  readonly selectedRow: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd', editor: ValidationWaitEditor = 'formula') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.editor = editor;
    this.grid = page.getByTestId('grid');
    this.validateCellsButton = page.getByTestId('validate-cells');
    this.formulaEditorInput = page.getByRole('combobox', { name: 'Formula editor', exact: true });
    this.barFormulaArea = page.getByRole('textbox', { name: 'Formula input', exact: true });
    this.barEditorOverlay = page.locator('.hfe-formula-bar__overlay .hfe-editor');
    this.textEditorInput = this.grid.locator('textarea.handsontableInput');
    this.selectedRow = this.grid.locator('.ht_master tbody tr:has(> td.current)');
  }

  /**
   * Opens the fixture and waits for the grid. `awaitFixtureBuilt()` rethrows a failed
   * `hyperformula-ui` import or a constructor throw the fixture captured.
   */
  async goto(dependent: 'none' | 'held' = 'none'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/editor-validation-wait-own-cell.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&editor=${this.editor}&dependent=${dependent}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master table, by visual row/column, via its stable test id.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Locator}
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The input of the editor column B edits with.
   *
   * @returns {Locator}
   */
  editorInput(): Locator {
    return this.editor === 'formula' ? this.formulaEditorInput : this.textEditorInput;
  }

  /**
   * Clicks a cell to select it.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async clickCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
  }

  /**
   * Selects a cell and types a value over it, the way a user replaces a cell's content: the first
   * key opens the editor. Waits for the editor to hold the typed text, and does not commit it.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {string} value The text to type.
   */
  async typeInCell(row: number, col: number, value: string): Promise<void> {
    await this.clickCell(row, col);
    await this.page.keyboard.type(value);
    await expect(this.editorInput()).toBeFocused();
    await expect(this.editorInput()).toHaveValue(value);
  }

  /**
   * Starts an edit of the selected cell the way its editor offers: a click on the formula bar for
   * the formula editor, Enter for the text editor. Waits for the editor input to take the focus.
   */
  async openEditorOnSelectedCell(): Promise<void> {
    if (this.editor === 'formula') {
      await this.barFormulaArea.click();
    } else {
      await this.page.keyboard.press('Enter');
    }

    await expect(this.editorInput()).toBeFocused();
  }

  /**
   * Clicks the button that runs `hot.validateCells()`.
   */
  async clickValidateCells(): Promise<void> {
    await this.validateCellsButton.click();
  }

  /**
   * How many C validations the fixture holds (`goto('held')` only).
   *
   * @returns {Promise<number>}
   */
  async heldDependentValidationCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htDependentPending.length);
  }

  /**
   * Whether the grid's UndoRedo plugin has a step to undo.
   *
   * @returns {Promise<boolean>}
   */
  async undoAvailable(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getPlugin('undoRedo').isUndoAvailable());
  }

  /**
   * The B validations the fixture holds, in the order they were asked.
   *
   * @returns {Promise<HeldValidation[]>}
   */
  async heldValidations(): Promise<HeldValidation[]> {
    return this.page.evaluate(
      () => (window as unknown as FixtureWindow).htPending.map(({ row, value }) => ({ row, value })));
  }

  /**
   * Answers the oldest held B validation (negatives are rejected) and tells which one it was.
   *
   * @returns {Promise<HeldValidation>}
   */
  async releaseNextValidation(): Promise<HeldValidation> {
    return this.page.evaluate(() => {
      const held = (window as unknown as FixtureWindow).htPending.shift();

      if (!held) {
        throw new Error('No B validation is held');
      }

      held.callback(Number(held.value) >= 0);

      return { row: held.row, value: held.value };
    });
  }

  /**
   * Whether Handsontable's active editor is open. A closed editor stays in the DOM, so the
   * editor's own state is the reliable read (`tests/AGENTS.md`, "Reading grid UI state").
   *
   * @returns {Promise<boolean>}
   */
  async editorOpened(): Promise<boolean> {
    return this.page.evaluate(
      () => (window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened?.() ?? false);
  }

  /**
   * The active editor's state (`STATE_EDITING`, `STATE_WAITING`, ...): `STATE_WAITING` while it
   * waits for its validation answer.
   *
   * @returns {Promise<string | null>}
   */
  async editorState(): Promise<string | null> {
    return this.page.evaluate(
      () => (window as unknown as FixtureWindow).hot.getActiveEditor()?.state ?? null);
  }

  /**
   * The `valid` flag the last validation left in a cell's meta (`null` before any).
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Promise<boolean | null>}
   */
  async cellValid(row: number, col: number): Promise<boolean | null> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).hot.getCellMeta(r, c).valid ?? null, [row, col]);
  }

  /**
   * The value of a cell, as `getDataAtCell()` returns it.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Promise<unknown>}
   */
  async dataAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).hot.getDataAtCell(r, c), [row, col]);
  }
}
