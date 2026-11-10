import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

export interface EditorState {
  opened: boolean;
  waiting: boolean;
  row: number | null;
  selected: [number, number] | null;
}

interface FixtureWindow {
  htPending: unknown[];
  htAnswer(value: string, result: boolean): boolean;
  htSortByRank(): void;
  htMoveRow(from: number, to: number): void;
  htFilterRank(name: string, value: number): void;
  htSourceData(): [string, number][];
  htEditorState(): EditorState;
}

/**
 * Page Object for the fixture whose first column's validator holds every answer until the spec
 * releases it, so the spec can sort, move, or filter the rows while a confirmed edit waits.
 */
export class PendingEditFollowsRecordPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly allowInvalid: boolean;
  readonly pageSize: number | null;
  readonly pageErrors: string[] = [];
  readonly editorInput: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd', allowInvalid = true, pageSize: number | null = null) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.allowInvalid = allowInvalid;
    this.pageSize = pageSize;
    this.editorInput = page.locator('textarea.handsontableInput');

    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/pending-edit-follows-record.html?theme=${this.theme}&bundle=${this.bundle}`
        + `&allowInvalid=${this.allowInvalid}&pageSize=${this.pageSize ?? 'none'}`
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
   * Sorts the rows by the rank column, ascending, through the Column Sorting API.
   */
  async sortByRank(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htSortByRank());
  }

  /**
   * Moves a visual row to another visual index through the Manual Row Move API.
   */
  async moveRow(from: number, to: number): Promise<void> {
    await this.page.evaluate(([f, t]) => (window as unknown as FixtureWindow).htMoveRow(f, t), [from, to]);
  }

  /**
   * Filters the rank column by one condition through the Filters API.
   */
  async filterRank(name: string, value: number): Promise<void> {
    await this.page.evaluate(
      ([n, v]) => (window as unknown as FixtureWindow).htFilterRank(n as string, v as number),
      [name, value],
    );
  }

  /**
   * Returns the source rows, in physical order.
   */
  async sourceData(): Promise<[string, number][]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htSourceData());
  }

  /**
   * Reports whether the active editor is open and waiting, the visual row it edits, and the last
   * selected cell.
   */
  async editorState(): Promise<EditorState> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htEditorState());
  }
}
