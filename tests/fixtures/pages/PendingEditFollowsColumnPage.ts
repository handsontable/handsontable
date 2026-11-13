import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

export interface ColumnEditorState {
  opened: boolean;
  waiting: boolean;
  row: number | null;
  col: number | null;
  selected: [number, number] | null;
}

interface FixtureWindow {
  htPending: unknown[];
  htAnswer(value: string, result: boolean): boolean;
  htMoveColumn(from: number, to: number): void;
  htInsertColumn(index: number): void;
  htRemoveColumn(index: number): void;
  htHideColumn(index: number): void;
  htSourceData(): (string | null)[][];
  htEditorState(): ColumnEditorState;
}

/**
 * Page Object for the fixture whose validator holds every answer until the spec releases it, so the spec can
 * move, insert, or remove columns while a confirmed edit waits.
 */
export class PendingEditFollowsColumnPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly allowInvalid: boolean;
  readonly pageErrors: string[] = [];
  readonly editorInput: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd', allowInvalid = true) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.allowInvalid = allowInvalid;
    this.editorInput = page.locator('textarea.handsontableInput');

    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/pending-edit-follows-column.html?theme=${this.theme}&bundle=${this.bundle}`
        + `&allowInvalid=${this.allowInvalid}`
    );

    await awaitBundle(this.page);

    const initError = await this.page.getByTestId('grid').getAttribute('data-init-error');

    if (initError !== null) {
      throw new Error(`The fixture grid failed to build: ${initError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell, by visual coordinates, through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell with the mouse, types a value with the keyboard, and confirms it with Enter.
   */
  async typeAndConfirm(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.type(value);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Replaces the text of the open editor with a value and confirms it with Enter.
   */
  async retypeAndConfirm(value: string): Promise<void> {
    await this.page.keyboard.press('ControlOrMeta+A');
    await this.page.keyboard.type(value);
    await expect(this.editorInput).toHaveValue(value);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Waits until the validator holds an answer for the value.
   */
  async expectPending(value: string): Promise<void> {
    await expect.poll(() => this.page.evaluate(
      v => (window as unknown as FixtureWindow).htPending.some(item => (item as { value: string }).value === v),
      value,
    )).toBe(true);
  }

  /**
   * Answers the held validator of a value. Fails when no validator waits on it.
   */
  async answer(value: string, result: boolean): Promise<void> {
    const answered = await this.page.evaluate(
      ([v, r]) => (window as unknown as FixtureWindow).htAnswer(v as string, r as boolean),
      [value, result],
    );

    expect(answered, `a validator waits on "${value}"`).toBe(true);
  }

  /**
   * Moves a visual column to another visual index through the Manual Column Move API.
   */
  async moveColumn(from: number, to: number): Promise<void> {
    await this.page.evaluate(([f, t]) => (window as unknown as FixtureWindow).htMoveColumn(f, t), [from, to]);
  }

  /**
   * Inserts a column at a visual column through `alter()`.
   */
  async insertColumn(index: number): Promise<void> {
    await this.page.evaluate(i => (window as unknown as FixtureWindow).htInsertColumn(i), index);
  }

  /**
   * Removes the column at a visual column through `alter()`.
   */
  async removeColumn(index: number): Promise<void> {
    await this.page.evaluate(i => (window as unknown as FixtureWindow).htRemoveColumn(i), index);
  }

  /**
   * Hides the column at a visual column through the Hidden Columns API.
   */
  async hideColumn(index: number): Promise<void> {
    await this.page.evaluate(i => (window as unknown as FixtureWindow).htHideColumn(i), index);
  }

  /**
   * Returns the source rows, in physical order.
   */
  async sourceData(): Promise<(string | null)[][]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htSourceData());
  }

  /**
   * Reports whether the active editor is open and waiting, the visual cell it edits, and the last selected cell.
   */
  async editorState(): Promise<ColumnEditorState> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htEditorState());
  }
}
