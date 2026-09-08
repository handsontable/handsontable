import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
// full instance type, and narrowing it here would be a TS2430 conflict. Every access is cast.
interface FixtureWindow {
  hot: {
    getSelected(): number[][] | undefined;
    getActiveEditor(): { isOpened(): boolean } | undefined;
    isListening(): boolean;
  };
  htUnlistenCount: number;
  htFocusAtMouseup: { onCheckbox: boolean, editorOpen: boolean } | null;
}

/**
 * Page Object for the fixture that pairs a text column with a checkbox column, so a Shift+Click
 * can move the browser focus onto an unstamped `<input>` INSIDE the grid while another cell's
 * editor is still open.
 */
export class EditorOpenCheckboxFocusPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the bundle and the first data cell.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/editor-open-checkbox-focus.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Returns the checkbox input a cell's renderer built.
   */
  checkbox(row: number, col: number): Locator {
    return this.cell(row, col).locator('input.htCheckboxRendererInput');
  }

  /**
   * Selects a cell near its leading edge and opens its editor with Enter.
   *
   * The click is off-centre on purpose: a centred press can land on whatever a renderer floats to
   * the cell's trailing edge, and the midpoint moves with the column width.
   */
  async openEditor(row: number, col: number): Promise<void> {
    const box = await this.cell(row, col).boundingBox();

    if (!box) {
      throw new Error(`Cell (${row}, ${col}) is not rendered`);
    }

    await this.page.mouse.click(box.x + 4, box.y + (box.height / 2));

    await expect.poll(() => this.selected()).toEqual([[row, col, row, col]]);

    await this.page.keyboard.press('Enter');

    await expect.poll(() => this.isEditorOpen()).toBe(true);
  }

  /**
   * Shift+Clicks a checkbox cell, which extends the selection onto it.
   */
  async shiftClickCheckbox(row: number, col: number): Promise<void> {
    await this.checkbox(row, col).click({ modifiers: ['Shift'] });
  }

  /**
   * Records where the browser focus sat, and whether an editor was open, at the moment of the
   * document's `mouseup` - which is when `tableView` reads both to reach its verdict.
   *
   * Sampled there and nowhere else, because neither survives the gesture: the browser focus is on
   * the checkbox input at `mousedown` and `mouseup` and back on `body` once the `click` has run
   * (`FocusGridManager#focusCell()` blurs any element `isOutsideInput()` accepts). A precondition
   * read after `click()` returns therefore reports `body` and proves nothing about the verdict.
   *
   * Installed in the CAPTURE phase so it runs before the grid's own bubble-phase listener, and
   * observes the state that listener is about to read.
   */
  async recordFocusAtMouseup(): Promise<void> {
    await this.page.evaluate(() => {
      const fixtureWindow = window as unknown as FixtureWindow;

      fixtureWindow.htFocusAtMouseup = null;

      document.addEventListener('mouseup', () => {
        fixtureWindow.htFocusAtMouseup = {
          onCheckbox: document.activeElement?.classList.contains('htCheckboxRendererInput') === true,
          editorOpen: fixtureWindow.hot.getActiveEditor()?.isOpened() === true,
        };
      }, true);
    });
  }

  /**
   * Returns what `recordFocusAtMouseup()` observed, or `null` when no `mouseup` has run since.
   */
  async focusAtMouseup(): Promise<{ onCheckbox: boolean, editorOpen: boolean } | null> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htFocusAtMouseup);
  }

  /**
   * Resets the `afterUnlisten` counter the fixture installs, so a count covers one named gesture.
   */
  async resetUnlistenCount(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as FixtureWindow).htUnlistenCount = 0;
    });
  }

  /**
   * Returns how many times the grid stopped listening since the last reset.
   */
  async unlistenCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htUnlistenCount);
  }

  /**
   * Reports whether the grid is still listening for keystrokes.
   */
  async isListening(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.isListening());
  }

  /**
   * Reports whether a cell editor is open.
   */
  async isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => (
      (window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened() === true
    ));
  }

  /**
   * Returns the current selection ranges.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected());
  }
}
