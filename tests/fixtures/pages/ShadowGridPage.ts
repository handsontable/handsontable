import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the shadow DOM fixture (DEV-1619).
 *
 * The grid is mounted inside a native open shadow root; Playwright locators
 * pierce open shadow roots, so the same `data-testid` hooks work unchanged.
 * The fixture also exposes a light-DOM textarea used to assert focus and
 * deselection behavior across the shadow boundary.
 */
export class ShadowGridPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly outsideTextarea: Locator;
  readonly outsideInput: Locator;
  readonly shadowSibling: Locator;
  readonly focusMover: Locator;
  readonly commentTooltip: Locator;
  readonly commentTooltipInput: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.outsideTextarea = page.getByTestId('outside-textarea');
    this.outsideInput = page.getByTestId('outside-input');
    this.shadowSibling = page.getByTestId('shadow-sibling');
    this.focusMover = page.getByTestId('focus-mover');
    // The comment editor is portaled into `document.body`, so it sits in the light DOM
    // even though its grid lives inside the shadow root.
    this.commentTooltip = page.locator('.htComments');
    this.commentTooltipInput = page.locator('.htCommentTextArea');
  }

  /**
   * Navigate to the fixture and wait for the grid to render inside the shadow
   * root. Waits on a real DOM condition (first cell visible) — web-first, no
   * readiness flags.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/shadow-dom.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** The cell editor textarea rendered inside the shadow root. */
  editor(): Locator {
    return this.page.locator('textarea.handsontableInput');
  }

  /** Assert a cell shows the expected text (web-first, auto-retrying). */
  async expectCell(row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(row, col)).toHaveText(text);
  }

  /** Open the editor on a cell with a double click. */
  async openEditor(row: number, col: number): Promise<void> {
    await this.cell(row, col).dblclick();
    await expect(this.editor()).toBeVisible();
  }

  /** Whether the grid currently listens for keyboard input (fixture probe). */
  async isListening(): Promise<boolean> {
    return this.page.evaluate(() => (window as any).__hotProbe.isListening());
  }

  /** The grid's current selection as `[startRow, startCol, endRow, endCol]` (fixture probe). */
  async selected(): Promise<number[][] | null> {
    return this.page.evaluate(() => (window as any).__hotProbe.selected());
  }

  /**
   * Swap `outsideClickDeselects` for a recording callback (fixture probe). The callback keeps
   * the selection when the clicked element is the focus-mover button and records the test id
   * of every element it receives.
   */
  async armOutsideClickRecorder(): Promise<void> {
    await this.page.evaluate(() => (window as any).__hotProbe.armOutsideClickRecorder());
  }

  /** Test ids of the elements passed to the recording `outsideClickDeselects` callback. */
  async outsideClickTargets(): Promise<string[]> {
    return this.page.evaluate(() => (window as any).__hotProbe.outsideClickTargets());
  }
}
