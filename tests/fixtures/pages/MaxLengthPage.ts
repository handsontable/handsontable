import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page object for the `maxLength` fixture (`demo/max-length.html`): a small grid that is rebuilt per
 * test with the options under test. Cells are addressed by `data-testid="cell-<row>-<col>"`, and the
 * open cell editor is the single `.handsontableInput` element.
 *
 * Text goes into the editor through real key presses and real clipboard pastes, so the editor's own
 * `input` handling is what the tests observe, not a value assigned from the outside.
 */
export class MaxLengthPage {
  /** The Playwright page the fixture is driven through. */
  readonly page: Page;
  /** The active theme, passed through to the fixture URL. */
  readonly theme: string;
  /** The active bundle, passed through to the fixture URL. */
  readonly bundle: string;
  /** The open cell editor's input. */
  readonly editor: Locator;

  /**
   * Wires up the page object for one theme/bundle leg.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    // Every editor class keeps its own holder in the DOM for good and only hides it when it closes
    // (`ht_editor_hidden`), so the input of the editor that is open now is the one in a visible holder.
    this.editor = page.locator('.handsontableInputHolder:not(.ht_editor_hidden) .handsontableInput');
  }

  /**
   * Navigate to the fixture and wait for the default grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/max-length.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Rebuilds the grid with the given serializable settings merged over the fixture defaults. A failed
   * constructor is rethrown here, so a bad option shows as itself and not as a missing cell.
   */
  async initGrid(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => window.initMaxLengthGrid(settings), overrides);
    await this.expectBuilt();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell through the API, so the click cannot land on anything but the cell, and opens its
   * editor with Enter. The caret sits at the end of the existing value.
   */
  async openEditor(row: number, col: number): Promise<void> {
    await this.page.evaluate(({ r, c }) => window.hot.selectCell(r, c), { r: row, c: col });
    await this.page.keyboard.press('Enter');
    await expect(this.editor).toBeVisible();
    await expect(this.editor).toBeFocused();
  }

  /** Types text into the open editor, one key press per character. */
  async type(text: string): Promise<void> {
    await this.editor.pressSequentially(text);
  }

  /**
   * Types each emoji with its own insertion, the way an emoji picker or a mobile keyboard delivers
   * one: a single `input` event per emoji, carrying both halves of the surrogate pair.
   */
  async typeEmoji(...emoji: string[]): Promise<void> {
    for (const symbol of emoji) {
      await this.page.keyboard.insertText(symbol);
    }
  }

  /** Commits the open editor with Enter. */
  async commit(): Promise<void> {
    await this.page.keyboard.press('Enter');
    await expect(this.editor).toBeHidden();
  }

  /**
   * Puts text on the real clipboard and pastes it with the keyboard shortcut into whatever has the
   * focus. Needs the `clipboard-read` and `clipboard-write` permissions in the spec.
   */
  async pasteText(text: string): Promise<void> {
    await this.page.evaluate(value => navigator.clipboard.writeText(value), text);
    await this.page.keyboard.press('ControlOrMeta+v');
  }

  /** The editor's caret, as the UTF-16 offsets of the selection. */
  async caret(): Promise<{ start: number | null, end: number | null }> {
    return this.editor.evaluate((element) => {
      const field = element as HTMLTextAreaElement;

      return { start: field.selectionStart, end: field.selectionEnd };
    });
  }

  /** Writes a value straight through the API, as an integration would. */
  async setDataAtCell(row: number, col: number, value: unknown): Promise<void> {
    await this.page.evaluate(
      ({ r, c, v }) => { window.hot.setDataAtCell(r, c, v as string); },
      { r: row, c: col, v: value }
    );
  }

  /** Selects one cell through the API. */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(({ r, c }) => window.hot.selectCell(r, c), { r: row, c: col });
  }

  /** The cell's current value. */
  async dataAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(({ r, c }) => window.hot.getDataAtCell(r, c), { r: row, c: col });
  }

  /**
   * Installs a validator that records every value it is asked about in `window.validatorCalls` and
   * accepts all of them, on top of the given settings. It is built inside the page, because a function
   * cannot cross `evaluate()`.
   */
  async useRecordingValidator(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate((overrides) => {
      const calls: unknown[] = [];

      (window as unknown as { validatorCalls: unknown[] }).validatorCalls = calls;
      window.initMaxLengthGrid({
        ...overrides,
        validator(value: unknown, callback: (valid: boolean) => void) {
          calls.push(value);
          callback(true);
        },
      });
    }, settings);
    await this.expectBuilt();
  }

  /** Rethrows a constructor failure the fixture captured, then waits for the grid to render. */
  private async expectBuilt(): Promise<void> {
    const buildError = await this.page.evaluate(() => window.fixtureError);

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** Selects a range of the open editor's text, by UTF-16 offsets. */
  async selectInEditor(start: number, end: number): Promise<void> {
    await this.editor.evaluate((element, range) => {
      (element as HTMLTextAreaElement).setSelectionRange(range.start, range.end);
    }, { start, end });
  }

  /** The values the recording validator was asked about, in order. */
  async validatorCalls(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as { validatorCalls: unknown[] }).validatorCalls);
  }
}
