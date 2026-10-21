import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the full
// instance type, which has no `TEXTAREA`, and narrowing it here would be a TS2430 conflict. Every
// access goes through this local view, cast once.
interface FixtureWindow {
  hot: {
    selectCell(row: number, col: number): boolean;
    getActiveEditor(): { TEXTAREA?: HTMLElement; isOpened(): boolean } | undefined;
  };
}

/**
 * Page object for the `imeFastEdit` fixture (`demo/intl-date-editor-ime-fast-edit.html`): a 2 x 3 grid
 * with an `intl-date` first column (the third, `intl-time`, is for the a11y scan), built with
 * `imeFastEdit: true`.
 *
 * With `imeFastEdit` the focus manager does not leave the browser focus on the selected cell. Once the
 * selection ends, a debounced `select()` (1 ms, `FocusGridManager#refocusDelay`) moves it to the active
 * editor's input, so an IME composition can start without the editor being opened first. The move is
 * asynchronous, so a spec waits for it with a web-first `toBeFocused()` on `editorInput` and never
 * reads the active element straight after selecting.
 */
export class IntlDateEditorImeFastEditPage {
  /** The Playwright page the fixture is driven through. */
  readonly page: Page;
  /** The active theme, passed through to the fixture URL. */
  readonly theme: string;
  /** The active bundle, passed through to the fixture URL. */
  readonly bundle: string;
  /** The `intl-date` editor's native date input (the editor's `TEXTAREA`). */
  readonly editorInput: Locator;

  /**
   * Wires up the page object for one theme/bundle leg.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    // The fixture's only date column is column 0, so the grid builds one `<input type="date">`
    // (the text column's editor is a `<textarea>`), and it is created on the first selection.
    this.editorInput = page.locator('input[type="date"].handsontableInput');
  }

  /**
   * Navigates to the fixture, waits for the grid to be built (the shared `awaitFixtureBuilt()` rethrows a
   * constructor failure the fixture captured in `htBuildError`, with its cause), and waits for the first
   * cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/intl-date-editor-ime-fast-edit.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell, by visual row and column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell through the API, which ends the selection the way a click does and so starts the
   * focus move to the editor input. A real click would also work, but the press cannot land on
   * anything but the cell here, and the spec is about what happens after the selection.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(
      ({ r, c }) => (window as unknown as FixtureWindow).hot.selectCell(r, c),
      { r: row, c: col }
    );
  }

  /**
   * Reports whether the active editor is open. A closed editor stays in the DOM (`ht_editor_hidden`)
   * and its input is still reported as visible, so the editor's own state is the only reliable read.
   */
  async isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened() === true);
  }

  /**
   * Lets two animation frames pass inside the page, then reports whether the browser focus is on the
   * active editor's input. Both the frames and the read sit in ONE `evaluate`, so no other task can
   * run between the settle and the answer.
   *
   * A positive answer proves the focus stayed only beside an earlier `toBeFocused()` on `editorInput`:
   * on its own, `true` would also be the answer of a focus that had not left yet.
   */
  async editorInputStillFocusedAfterFrames(): Promise<boolean> {
    return this.page.evaluate(() => new Promise<boolean>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const editorInput = (window as unknown as FixtureWindow).hot.getActiveEditor()?.TEXTAREA;

        resolve(editorInput !== undefined && document.activeElement === editorInput);
      }));
    }));
  }
}
