import { type Locator, type Page, expect } from '@playwright/test';

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
  isListening(): boolean;
  getActiveEditor(): { isOpened(): boolean; state: string; TEXTAREA?: HTMLTextAreaElement } | undefined;
  getDataAtCell(row: number, col: number): unknown;
  getPlugin(name: string): {
    setPage(page: number): void;
    sort(config: { column: number; sortOrder: string }): void;
  };
  toPhysicalRow(row: number): number;
  getSourceDataAtCell(row: number, col: number): unknown;
  getSourceData(): unknown[][];
  scrollViewportTo(options: { row: number; verticalSnap: string }): void;
  render(): void;
}

interface ChangeRecordingWindow extends Window {
  htChanges: unknown[][];
}

/**
 * Page Object for the layout-slot focus fixture.
 */
export class LayoutSlotFocusPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly outsideClickDeselects: boolean;
  readonly scenario: 'pagination' | 'scroll';
  readonly pageSizeSelect: Locator;
  readonly nextPageButton: Locator;

  constructor(
    page: Page,
    theme = 'main',
    bundle = 'umd',
    outsideClickDeselects = true,
    scenario: 'pagination' | 'scroll' = 'pagination',
  ) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.outsideClickDeselects = outsideClickDeselects;
    this.scenario = scenario;
    this.pageSizeSelect = page.getByRole('combobox', { name: 'Page size' });
    this.nextPageButton = page.getByRole('button', { name: 'Go to next page' });
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/layout-slot-focus.html?theme=${this.theme}&bundle=${this.bundle}&outsideClickDeselects=${this.outsideClickDeselects}&scenario=${this.scenario}`);

    // Wait for the bundle before the cell. The test id on a cell comes from the fixture's custom
    // renderer, so "cell not found" cannot tell a slow bundle apart from a grid that failed to
    // render. Splitting the wait puts that distinction in the failure message.
    await this.page.waitForFunction(() => 'Handsontable' in window);

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell, opens its editor by typing into it, and leaves the value uncommitted.
   *
   * Typing straight onto a selected cell opens the editor and REPLACES its content. Opening with
   * `Enter` instead would keep the old value and put the caret after it, so the editor would hold
   * `A1EDITED` rather than `EDITED`.
   */
  async openEditorAndType(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();

    await expect.poll(() => this.selected()).toEqual([[row, col, row, col]]);

    await this.page.keyboard.type(value);

    await expect.poll(() => this.isEditorOpen()).toBe(true);
    await expect.poll(() => this.editorValue()).toBe(value);
  }

  /**
   * Scrolls the viewport so the given row is at the top. The rows left behind stay renderable;
   * they are only virtualized out of the DOM.
   */
  async scrollToRow(row: number): Promise<void> {
    await this.page.evaluate((target) => {
      (window as Window & { hot: HandsontableFixture }).hot
        .scrollViewportTo({ row: target, verticalSnap: 'top' });
    }, row);
  }

  /**
   * Forces a re-render that leaves every currently rendered row rendered.
   */
  async rerender(): Promise<void> {
    await this.page.evaluate(() => (window as Window & { hot: HandsontableFixture }).hot.render());
  }

  /**
   * Reports whether the cell editor is open.
   *
   * Read through `getActiveEditor().isOpened()` rather than the visibility of `.handsontableInput`:
   * that textarea is always in the DOM (it backs focus and copy/paste) and a closed editor is
   * hidden with `opacity: 0`, which Playwright still counts as visible.
   */
  async isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => {
      const editor = (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor();

      return editor?.isOpened() === true;
    });
  }

  /**
   * Sorts the first column descending, so visual row 0 stops being physical row 0.
   */
  async sortFirstColumnDescending(): Promise<void> {
    await this.page.evaluate(() => {
      (window as Window & { hot: HandsontableFixture }).hot
        .getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
    });
  }

  /**
   * Returns the physical row a visual row currently maps to.
   */
  async toPhysicalRow(row: number): Promise<number> {
    return this.page.evaluate(
      target => (window as Window & { hot: HandsontableFixture }).hot.toPhysicalRow(target),
      row,
    );
  }

  /**
   * Returns a value straight from the source data, bypassing the visual index mapping.
   */
  async sourceDataAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => (
      (window as Window & { hot: HandsontableFixture }).hot.getSourceDataAtCell(r, c)
    ), [row, col]);
  }

  /**
   * Returns a whole column straight from the source data, in physical row order.
   *
   * Stronger than probing single cells: it also pins the row count, so a commit that landed on the
   * right record while appending or dropping rows elsewhere still fails.
   */
  async sourceColumn(col: number): Promise<unknown[]> {
    return this.page.evaluate(
      target => (window as Window & { hot: HandsontableFixture }).hot
        .getSourceData().map(row => row[target]),
      col,
    );
  }

  /**
   * Returns how many changes the grid has committed since it was created.
   */
  async committedChangeCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as ChangeRecordingWindow).htChanges.length);
  }

  /**
   * Returns the editor's state machine value, or null when there is no editor yet.
   *
   * This is the probe for "is an edit still pending", which `isOpened()` cannot answer. Scrolling
   * an edited cell out of view runs `refreshDimensions()` -> `close()`, and `close()` clears
   * `_opened` while deliberately leaving `state` at `STATE_EDITING` so the edit survives.
   */
  async editorState(): Promise<string | null> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor()?.state ?? null
    ));
  }

  /**
   * Returns the text currently held by the editor, whether or not it is currently shown.
   */
  async editorText(): Promise<string | null> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor()?.TEXTAREA?.value ?? null
    ));
  }

  /**
   * Returns the text currently held by the open editor, or null when it is closed.
   */
  async editorValue(): Promise<string | null> {
    return this.page.evaluate(() => {
      const editor = (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor();

      return editor?.isOpened() ? editor.TEXTAREA?.value ?? null : null;
    });
  }

  /**
   * Changes the page without any pointer interaction, so nothing goes through the document
   * `mousedown` handler.
   */
  async setPageProgrammatically(pageNumber: number): Promise<void> {
    await this.page.evaluate((target) => {
      (window as Window & { hot: HandsontableFixture }).hot.getPlugin('pagination').setPage(target);
    }, pageNumber);
  }

  /**
   * Returns the grid's current selection.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as Window & { hot: HandsontableFixture }).hot.getSelected());
  }

  /**
   * Returns the value stored at the given coordinates, regardless of which page renders it.
   */
  async dataAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => (
      (window as Window & { hot: HandsontableFixture }).hot.getDataAtCell(r, c)
    ), [row, col]);
  }

  /**
   * Reports whether the grid keeps its keyboard listener active.
   */
  async isListening(): Promise<boolean> {
    return this.page.evaluate(() => (window as Window & { hot: HandsontableFixture }).hot.isListening());
  }
}
