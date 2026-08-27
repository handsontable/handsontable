import { type Locator, type Page, expect } from '@playwright/test';

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
  getActiveEditor(): {
    isOpened(): boolean;
    state: string;
    TEXTAREA?: HTMLTextAreaElement;
    finishEditing(restoreOriginalValue?: boolean): void;
  } | undefined;
  getDataAtCell(row: number, col: number): unknown;
  getSourceData(): unknown[][];
  getPlugin(name: string): {
    setPage(page: number): void;
    setPageSize(size: number): void;
    hideRow(row: number): void;
    hideColumn(column: number): void;
    sort(config: { column: number; sortOrder: string }): void;
  };
  toPhysicalRow(row: number): number;
  scrollViewportTo(options: { row: number; verticalSnap: string }): void;
}

interface RecordingWindow extends Window {
  htChanges: unknown[][];
  htCacheUpdates: { row: { hiddenIndexesChanged: boolean }[]; column: { hiddenIndexesChanged: boolean }[] };
}

interface PageOptions {
  editor?: 'text' | 'select' | 'multiSelect' | 'dropdown';
  scenario?: 'pagination' | 'scroll';
  sorting?: boolean;
  validator?: 'none' | 'reject' | 'rejectAsync';
}

/**
 * Page Object for the fixture that exercises an open editor whose cell stops being rendered.
 */
export class EditorHiddenCellPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly editor: string;
  readonly scenario: string;
  readonly sorting: boolean;
  readonly validator: string;
  readonly selectEditor: Locator;
  readonly selectEditorControl: Locator;
  readonly multiSelectEditor: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd', options: PageOptions = {}) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.editor = options.editor ?? 'text';
    this.scenario = options.scenario ?? 'pagination';
    this.sorting = options.sorting ?? false;
    this.validator = options.validator ?? 'none';
    // `.htSelectEditor` is the wrapper div; the <select> itself is a child of it.
    this.selectEditor = page.locator('.htSelectEditor');
    this.selectEditorControl = page.locator('.htSelectEditor select');
    this.multiSelectEditor = page.locator('.ht-multi-select-editor');
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}` +
      `&editor=${this.editor}&scenario=${this.scenario}&sorting=${this.sorting}` +
      `&validator=${this.validator}`;

    await this.page.goto(`/tests/fixtures/demo/editor-hidden-cell.html?${query}`);

    // Wait for the bundle before the cell. The test id comes from the fixture's custom renderer,
    // so "cell not found" alone cannot tell a slow bundle apart from a grid that failed to render.
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
   * Selects a cell and opens its editor with Enter, which works for every editor type.
   */
  async openEditor(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();

    await expect.poll(() => this.selected()).toEqual([[row, col, row, col]]);

    await this.page.keyboard.press('Enter');

    await expect.poll(() => this.isEditorOpen()).toBe(true);
  }

  /**
   * Selects a cell, opens its text editor by typing, and leaves the value uncommitted.
   *
   * Typing straight onto a selected cell opens the editor and REPLACES its content. Opening with
   * `Enter` would keep the old value and put the caret after it.
   */
  async openEditorAndType(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();

    await expect.poll(() => this.selected()).toEqual([[row, col, row, col]]);

    await this.page.keyboard.type(value);

    await expect.poll(() => this.isEditorOpen()).toBe(true);
    await expect.poll(() => this.editorText()).toBe(value);
  }

  /**
   * Picks an option in the `select` editor without committing it. `SelectEditor` registers no DOM
   * listeners of its own, so the value stays uncommitted until the editor finishes.
   */
  async chooseSelectOption(value: string): Promise<void> {
    await this.selectEditorControl.selectOption(value);
  }

  /**
   * Reports whether the cell editor is open.
   *
   * Read through `getActiveEditor().isOpened()` rather than DOM visibility: `.handsontableInput` is
   * always in the DOM and a closed text editor is merely `opacity: 0`, which Playwright still
   * counts as visible.
   */
  async isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor()?.isOpened() === true
    ));
  }

  /**
   * Returns the editor's state machine value, or null when there is no active editor.
   */
  async editorState(): Promise<string | null> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor()?.state ?? null
    ));
  }

  /**
   * Returns the text held by the editor, whether or not it is currently shown.
   */
  async editorText(): Promise<string | null> {
    return this.page.evaluate(() => (
      (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor()?.TEXTAREA?.value ?? null
    ));
  }

  /**
   * Turns the page without any pointer interaction, so nothing goes through the document
   * `mousedown` handler.
   */
  async setPage(pageNumber: number): Promise<void> {
    await this.page.evaluate(target => {
      (window as Window & { hot: HandsontableFixture }).hot.getPlugin('pagination').setPage(target);
    }, pageNumber);
  }

  /**
   * Changes the page size, which rewrites Pagination's hiding map without turning the page.
   */
  async setPageSize(size: number): Promise<void> {
    await this.page.evaluate(target => {
      (window as Window & { hot: HandsontableFixture }).hot.getPlugin('pagination').setPageSize(target);
    }, size);
  }

  /**
   * Hides a row through the `hiddenRows` plugin, a different hiding map from Pagination's.
   */
  async hideRow(row: number): Promise<void> {
    await this.page.evaluate(target => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;

      hot.getPlugin('hiddenRows').hideRow(target);
      (hot as unknown as { render(): void }).render();
    }, row);
  }

  /**
   * Hides a column through the `hiddenColumns` plugin. This is the only trigger that exercises
   * `afterColumnSequenceCacheUpdate` and the column half of the physical-index conversion.
   */
  async hideColumn(column: number): Promise<void> {
    await this.page.evaluate(target => {
      const hot = (window as Window & { hot: HandsontableFixture }).hot;

      hot.getPlugin('hiddenColumns').hideColumn(target);
      (hot as unknown as { render(): void }).render();
    }, column);
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
   * Scrolls the viewport so the given row is at the top. The rows left behind stay renderable.
   */
  async scrollToRow(row: number): Promise<void> {
    await this.page.evaluate(target => {
      (window as Window & { hot: HandsontableFixture }).hot
        .scrollViewportTo({ row: target, verticalSnap: 'top' });
    }, row);
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
   * Returns a whole column straight from the source data, in physical row order. Stronger than
   * probing single cells: it pins the row count too.
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
    return this.page.evaluate(() => (window as unknown as RecordingWindow).htChanges.length);
  }

  /**
   * Reports whether an index-map cache update that changed hidden indexes has been recorded on the
   * given axis. Assert this before concluding anything from "the editor stayed open": without it,
   * a case passes when the guard's trigger never fired at all.
   */
  async sawHidingCacheUpdate(axis: 'row' | 'column'): Promise<boolean> {
    return this.page.evaluate(
      target => (window as unknown as RecordingWindow).htCacheUpdates[target]
        .some(state => state.hiddenIndexesChanged),
      axis,
    );
  }

  /**
   * Starts the save so an async validator is in flight, without waiting for it to settle. This is
   * the only way to park the editor in `WAITING`, where `finishEditing()` is a no-op.
   */
  async beginSave(): Promise<void> {
    await this.page.evaluate(() => {
      (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor()?.finishEditing(false);
    });
  }

  /**
   * Reports whether the editor object that was last active is still open, regardless of whether the
   * manager still references it. A rejected validation clears the manager's reference while leaving
   * the editor itself open, which is exactly the orphan this asserts against.
   */
  async isAnyEditorStillOpen(): Promise<boolean> {
    return this.page.evaluate(() => {
      const hot = window as unknown as { __lastEditor?: { isOpened(): boolean; state: string } };

      return hot.__lastEditor ? hot.__lastEditor.isOpened() || hot.__lastEditor.state === 'STATE_EDITING' : false;
    });
  }

  /**
   * Remembers the currently active editor object so it can be inspected after the manager drops it.
   */
  async rememberActiveEditor(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { __lastEditor?: unknown }).__lastEditor =
        (window as Window & { hot: HandsontableFixture }).hot.getActiveEditor();
    });
  }

  /**
   * Returns the grid's current selection.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as Window & { hot: HandsontableFixture }).hot.getSelected());
  }
}
