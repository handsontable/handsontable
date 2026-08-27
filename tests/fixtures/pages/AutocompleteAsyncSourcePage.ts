import { type Locator, type Page, expect } from '@playwright/test';

interface EditorFixture {
  isOpened(): boolean;
  state: string;
  rawChoices: unknown[];
  htEditor: { rootElement: HTMLElement };
}

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
  getActiveEditor(): EditorFixture | undefined;
  isListening(): boolean;
  scrollViewportTo(options: { row: number, verticalSnap: string }): void;
}

interface FixtureWindow extends Window {
  hot: HandsontableFixture;
  htEditorRef: EditorFixture | null;
  htListenCount: number;
  htResolveQueries(col: number): number;
  htPendingCount(col: number): number;
  htChoices: string[][];
}

interface PageOptions {
  editor?: 'autocomplete' | 'dropdown';
  scenario?: 'plain' | 'scroll';
}

/**
 * Page Object for the fixture whose `source` answers only when a spec tells it to.
 *
 * Every probe that inspects the dropdown reads it through `window.htEditorRef` rather than a CSS
 * locator. `HandsontableEditor.close()` only hides the nested grid, so the element a late response
 * re-shows is still the same one, and Playwright's own visibility rules cannot be used to tell the
 * two apart: the editor's parent is merely `opacity: 0` when closed, which counts as visible.
 */
export class AutocompleteAsyncSourcePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly editor: string;
  readonly scenario: string;
  readonly outsideInput: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd', options: PageOptions = {}) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.editor = options.editor ?? 'autocomplete';
    this.scenario = options.scenario ?? 'plain';
    this.outsideInput = page.getByTestId('outside-input');
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}` +
      `&editor=${this.editor}&scenario=${this.scenario}`;

    await this.page.goto(`/tests/fixtures/demo/autocomplete-async-source.html?${query}`);

    // Wait for the bundle before the cell. The test id comes from the fixture's `afterRenderer`,
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
   * Selects a cell, opens its editor with Enter, and waits until the column's `source` has been
   * asked for choices. Enter rather than typing: full edit mode seeds the editor with the cell's
   * own value, so the query is the column's shared choice prefix and the whole list matches.
   */
  async openEditor(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();

    await expect.poll(() => this.selected()).toEqual([[row, col, row, col]]);

    await this.page.keyboard.press('Enter');

    await expect.poll(() => this.isEditorOpen()).toBe(true);
    await expect.poll(() => this.pendingQueryCount(col)).toBeGreaterThan(0);
  }

  /**
   * Reports whether the cell editor is open.
   */
  async isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => (
      (window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened() === true
    ));
  }

  /**
   * Returns how many queries the given column has in flight.
   */
  async pendingQueryCount(col: number): Promise<number> {
    return this.page.evaluate(
      target => (window as unknown as FixtureWindow).htPendingCount(target),
      col,
    );
  }

  /**
   * Answers every query the given column has in flight and returns how many were answered.
   * Assert on the return value: a zero means the case proved nothing, because no response landed.
   */
  async resolveQueries(col: number): Promise<number> {
    return this.page.evaluate(
      target => (window as unknown as FixtureWindow).htResolveQueries(target),
      col,
    );
  }

  /**
   * Reports whether the suggestion list is currently shown. `updateChoicesList()` drives this by
   * assigning `display` on the nested grid's root element, so it is the exact thing a late response
   * would flip back on.
   */
  async isDropdownShown(): Promise<boolean> {
    return this.page.evaluate(() => {
      const editor = (window as unknown as FixtureWindow).htEditorRef;

      return editor ? editor.htEditor.rootElement.style.display !== 'none' : false;
    });
  }

  /**
   * Returns the choices currently rendered in the suggestion list, read from its cells.
   */
  async dropdownChoices(): Promise<string[]> {
    return this.page.evaluate(() => {
      const editor = (window as unknown as FixtureWindow).htEditorRef;

      if (!editor) {
        return [];
      }

      return Array.from(editor.htEditor.rootElement.querySelectorAll('.ht_master td'))
        .map(td => td.textContent ?? '');
    });
  }

  /**
   * Returns the choice set the editor last accepted from a `source` response.
   */
  async rawChoices(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htEditorRef?.rawChoices ?? []);
  }

  /**
   * Returns how many times the grid has become the keyboard listener. `updateChoicesList()` ends
   * with `hot.listen()`, so a rise in this count after the editor closed IS the focus steal.
   */
  async listenCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htListenCount);
  }

  /**
   * Reports whether the grid is currently the keyboard listener.
   */
  async isGridListening(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.isListening());
  }

  /**
   * Returns the test id of the focused element, so a spec can pin focus to the outside input.
   */
  async activeElementTestId(): Promise<string | null> {
    return this.page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? null);
  }

  /**
   * Moves the caret to the plain input below the grid. `TableView` unlistens on a `mousedown` that
   * lands on an outside input, so this is the user action that hands keyboard control away.
   */
  async clickOutsideInput(): Promise<void> {
    await this.outsideInput.click();

    await expect.poll(() => this.isGridListening()).toBe(false);
  }

  /**
   * Returns the choice set the fixture serves for a column, so a spec never carries a second copy.
   */
  async choicesFor(col: number): Promise<string[]> {
    return this.page.evaluate(
      target => (window as unknown as FixtureWindow).htChoices[target],
      col,
    );
  }

  /**
   * Returns the editor's state machine value, or null when there is no active editor.
   */
  async editorState(): Promise<string | null> {
    return this.page.evaluate(() => (
      (window as unknown as FixtureWindow).hot.getActiveEditor()?.state ?? null
    ));
  }

  /**
   * Scrolls the viewport so the given row sits at the top. Past the rendered range this makes
   * `TextEditor.refreshDimensions()` close the open editor through `afterScrollVertically`, without
   * finishing the edit - the close that leaves `state` at `EDITING`.
   */
  async scrollToRow(row: number): Promise<void> {
    await this.page.evaluate(target => {
      (window as unknown as FixtureWindow).hot.scrollViewportTo({ row: target, verticalSnap: 'top' });
    }, row);
  }

  /**
   * Returns the grid's current selection.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected());
  }
}
