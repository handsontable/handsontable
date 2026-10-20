import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface FixtureEditor {
  isOpened(): boolean;
  getValue(): string;
}

interface FixtureHot {
  getSelectedLast(): number[] | undefined;
  getActiveEditor(): FixtureEditor | undefined;
  updateData(data: string[][]): void;
  loadData(data: string[][]): void;
  listen(): void;
}

interface FixtureWindow extends Window {
  hot: FixtureHot;
}

/**
 * Page object for a grid whose selected cell keeps its meta across `updateData`.
 *
 * Selecting again after the replace would prepare fresh meta and hide the bug, so
 * the replace and the keystroke both happen with the original selection in place.
 */
export class EditorStaleDataPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait until the first cell is on screen.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/editor-stale-data.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Click a cell and wait until the highlight lands there.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
    await this.expectSelection(row, col);
  }

  /**
   * Replace the dataset through `updateData` without selecting again.
   */
  async updateData(data: string[][]): Promise<void> {
    await this.replaceData('updateData', data);
  }

  /**
   * Replace the dataset through `loadData` without selecting again.
   */
  async loadData(data: string[][]): Promise<void> {
    await this.replaceData('loadData', data);
  }

  /**
   * `listen()` keeps the next keystroke on this grid. It does not prepare cell meta.
   */
  private async replaceData(method: 'updateData' | 'loadData', data: string[][]): Promise<void> {
    await this.page.evaluate(({ method: name, next }) => {
      const { hot } = window as unknown as FixtureWindow;

      hot[name](next);
      hot.listen();
    }, { method, next: data });
  }

  /**
   * Assert the highlight coordinates.
   */
  async expectSelection(row: number, col: number): Promise<void> {
    await expect.poll(() => this.selection()).toEqual([row, col]);
  }

  /**
   * The highlight as `[row, col]`, or null when nothing is selected.
   */
  async selection(): Promise<[number, number] | null> {
    return this.page.evaluate(() => {
      const selected = (window as unknown as FixtureWindow).hot.getSelectedLast();

      return selected ? [selected[0], selected[1]] : null;
    });
  }

  /**
   * Assert a cell shows the expected text.
   */
  async expectCell(row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(row, col)).toHaveText(text);
  }

  /**
   * Whether an editor is open. A prepared textarea is visible before `beginEditing`,
   * so the DOM input is not this answer.
   */
  async isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => {
      const editor = (window as unknown as FixtureWindow).hot.getActiveEditor();

      return !!editor && editor.isOpened();
    });
  }

  /**
   * Assert no editor is open.
   */
  async expectNoEditor(): Promise<void> {
    await expect.poll(() => this.isEditorOpen()).toBe(false);
  }

  /**
   * Assert an editor is open.
   */
  async expectEditorOpen(): Promise<void> {
    await expect.poll(() => this.isEditorOpen()).toBe(true);
  }

  /**
   * The open editor's value, or null when no editor is open.
   */
  async editorValue(): Promise<string | null> {
    return this.page.evaluate(() => {
      const editor = (window as unknown as FixtureWindow).hot.getActiveEditor();

      return editor && editor.isOpened() ? editor.getValue() : null;
    });
  }
}
