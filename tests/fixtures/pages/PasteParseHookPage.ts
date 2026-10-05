import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * What the `beforePasteParse` callback of one grid received, copied out at call time.
 */
export interface HookCall {
  eventIsNull: boolean;
  eventIsClipboardEvent: boolean;
  eventType: string | null;
  types: string[];
  plain: string;
  html: string;
}

/**
 * The fixture's `?behavior=` allowlist: what the callback of grid A does with the snapshot.
 */
export type HookBehavior =
  | 'observe'
  | 'clean-number'
  | 'replace-text'
  | 'edit-html'
  | 'edit-html-xss'
  | 'cancel'
  | 'two-callbacks';

interface FixtureWindow {
  hot: {
    getSourceDataAtCell(row: number, col: number): unknown;
    isListening(): boolean;
    getSelected(): number[][] | undefined;
    getPlugin(name: string): { paste(text: string, html?: string): void };
    getActiveEditor(): { isOpened(): boolean } | undefined;
  };
  htHookCalls: { a: HookCall[]; b: HookCall[] };
  htPasteHooks: { beforePaste: number; afterPaste: number };
  htSanitizerCalls: Array<[string, string]>;
  htSecondSaw: string[];
}

/**
 * Page Object for the `beforePasteParse` fixture: two grids (A, B) and a light-DOM textarea.
 *
 * Grid A runs the callback chosen by `behavior`, and every callback first records what it received.
 * Grid B only records. The page object reads those records back, so a spec asserts on what the hook
 * saw and on what a paste wrote, never on the fixture's internals.
 */
export class PasteParseHookPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly behavior: HookBehavior;
  readonly outsideTextarea: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd', behavior: HookBehavior = 'observe') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.behavior = behavior;
    this.outsideTextarea = page.getByTestId('outside-textarea');
  }

  /**
   * Opens the fixture and waits for the first cell of grid A to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/paste-parse-hook.html?theme=${this.theme}&bundle=${this.bundle}&behavior=${this.behavior}`
    );
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
    await expect(this.cellB(0, 0)).toBeVisible();
  }

  /**
   * A data cell of grid A, through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A data cell of grid B.
   */
  cellB(row: number, col: number): Locator {
    return this.page.getByTestId(`b-cell-${row}-${col}`);
  }

  /**
   * The cell editor textarea. Only one editor is open at a time, so this is unambiguous.
   */
  editor(): Locator {
    return this.page.locator('textarea.handsontableInput:visible');
  }

  /**
   * Asserts the text a cell of grid A shows.
   */
  async expectCell(row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(row, col)).toHaveText(text);
  }

  /**
   * Opens the editor of a cell of grid A with a double click.
   */
  async openEditor(row: number, col: number): Promise<void> {
    await this.cell(row, col).dblclick();
    await expect(this.editor()).toBeVisible();
  }

  /**
   * Copies the selected cell with the keyboard shortcut. The plugin writes its private flavor then.
   */
  async copy(): Promise<void> {
    await this.page.keyboard.press('ControlOrMeta+c');
  }

  /**
   * Pastes with the keyboard shortcut: a real, trusted paste event.
   */
  async paste(): Promise<void> {
    await this.page.keyboard.press('ControlOrMeta+v');
  }

  /**
   * Puts plain text on the real clipboard. Requires the clipboard permissions, and a focused page.
   */
  async writeClipboardText(text: string): Promise<void> {
    await this.page.evaluate(value => navigator.clipboard.writeText(value), text);
  }

  /**
   * Puts both a `text/html` and a `text/plain` flavor on the real clipboard.
   */
  async writeClipboardHtml(html: string, text: string): Promise<void> {
    await this.page.evaluate(async({ htmlValue, textValue }) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlValue], { type: 'text/html' }),
          'text/plain': new Blob([textValue], { type: 'text/plain' }),
        }),
      ]);
    }, { htmlValue: html, textValue: text });
  }

  /**
   * Whether grid A currently listens for keyboard and clipboard input.
   */
  async isListening(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.isListening());
  }

  /**
   * Whether a cell editor of grid A is open. The editor's textarea stays in the DOM when it closes,
   * so its visibility says nothing.
   */
  async isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened() ?? false);
  }

  /**
   * Grid A's selection, or `null` when nothing is selected.
   */
  async selected(): Promise<number[][] | null> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected() ?? null);
  }

  /**
   * The value of a cell of grid A straight from the source data, so an object stays an object.
   */
  async sourceCell(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(
      ([targetRow, targetCol]) => (window as unknown as FixtureWindow).hot.getSourceDataAtCell(targetRow, targetCol),
      [row, col] as [number, number],
    );
  }

  /**
   * Every `beforePasteParse` call a grid ran, in order.
   */
  async hookCalls(grid: 'a' | 'b' = 'a'): Promise<HookCall[]> {
    return this.page.evaluate(g => (window as unknown as FixtureWindow).htHookCalls[g], grid);
  }

  /**
   * How many times the `beforePaste` and `afterPaste` hooks of grid A fired.
   */
  async pasteHookCounts(): Promise<{ beforePaste: number; afterPaste: number }> {
    return this.page.evaluate(() => ({ ...(window as unknown as FixtureWindow).htPasteHooks }));
  }

  /**
   * Every `[context, content]` pair the sanitizer of grid A was called with.
   */
  async sanitizerCalls(): Promise<Array<[string, string]>> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htSanitizerCalls);
  }

  /**
   * What the second `beforePasteParse` callback read from the shared snapshot.
   */
  async secondCallbackSaw(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htSecondSaw);
  }

  /**
   * Pastes through the plugin's public `paste()` method, with no DOM event behind it. Needs a
   * selection and a listening grid, like any paste.
   */
  async pasteThroughPlugin(text: string): Promise<void> {
    await this.page.evaluate((value) => {
      (window as unknown as FixtureWindow).hot.getPlugin('copyPaste').paste(value);
    }, text);
  }
}
