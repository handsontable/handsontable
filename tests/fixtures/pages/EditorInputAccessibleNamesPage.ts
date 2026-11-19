import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, assertKnownBundle, type Bundle } from '../bundle';

/**
 * Page Object for the accessible names of the controls that edit a cell
 * (`tests/fixtures/demo/editor-input-accessible-names.html`).
 *
 * The fixture loads the bundle and the pl-PL language pack and leaves the container empty, so each test
 * builds the grid it needs with `build()`. Cells carry `data-testid="cell-<row>-<col>"`.
 */
export class EditorInputAccessibleNamesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;
  /**
   * The text editor's input (a `<textarea>`, or an `<input>` for the native date and time editors).
   */
  readonly editorInput: Locator;
  /**
   * The comment editor's textarea, rendered in the grid's portal.
   */
  readonly commentInput: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    assertKnownBundle(bundle, '(page, theme, bundle)');
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.editorInput = page.locator('.handsontableInput');
    this.commentInput = page.locator('textarea.htCommentTextArea');
  }

  /**
   * Opens the fixture and waits for the bundle.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/editor-input-accessible-names.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
  }

  /**
   * Builds the grid with the given settings (plain JSON) and waits for its first cell.
   *
   * @param {object} settings Handsontable settings, without `licenseKey`.
   */
  async build(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate((options) => {
      const win = window as unknown as {
        Handsontable: new(element: Element, settings: object) => unknown;
        htTestLicenseKey: string;
        hot: unknown;
      };
      const container = document.querySelector('[data-testid="grid"]') as Element;

      win.hot = new win.Handsontable(container, {
        ...options,
        afterRenderer(td: HTMLElement, row: number, col: number) {
          td.setAttribute('data-testid', `cell-${row}-${col}`);
        },
        licenseKey: win.htTestLicenseKey,
      });
    }, settings);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Registers, under `editorName`, a custom editor built on `TextEditor` that names its own input with
   * `aria-label`, the way an application can.
   *
   * @param {string} editorName The name the editor is registered under.
   * @param {string} label The `aria-label` the editor writes on its input.
   */
  async registerSelfLabelledEditor(editorName: string, label: string): Promise<void> {
    await this.page.evaluate(([name, ariaLabel]) => {
      type TextEditorClass = new (...args: unknown[]) => { TEXTAREA: HTMLElement; createElements(): void };
      const { editors } = (window as unknown as {
        Handsontable: { editors: { TextEditor: TextEditorClass; registerEditor: (n: string, e: unknown) => void } };
      }).Handsontable;

      class SelfLabelledEditor extends editors.TextEditor {
        createElements() {
          super.createElements();
          this.TEXTAREA.setAttribute('aria-label', ariaLabel);
        }
      }

      editors.registerEditor(name, SelfLabelledEditor);
    }, [editorName, label]);
  }

  /**
   * A data cell, by visual row and column.
   *
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   * @returns {Locator}
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Puts the keyboard focus on a cell through the API, so the keys that follow reach the grid.
   *
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      (window as unknown as { hot: { selectCell: (r: number, c: number) => void } }).hot.selectCell(r, c);
    }, [row, col]);
    await expect(this.cell(row, col)).toHaveClass(/\bcurrent\b/);
  }

  /**
   * The `[row, col]` of the last selected cell.
   *
   * @returns {Promise<number[]>}
   */
  async selectedCell(): Promise<number[]> {
    return this.page.evaluate(() => {
      const [row, col] = (window as unknown as { hot: { getSelectedLast: () => number[] } }).hot.getSelectedLast();

      return [row, col];
    });
  }

  /**
   * Whether the active cell editor is open.
   *
   * @returns {Promise<boolean>}
   */
  async isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: { getActiveEditor: () => { isOpened: () => boolean } | undefined } }).hot;

      return hot.getActiveEditor()?.isOpened() ?? false;
    });
  }
}
