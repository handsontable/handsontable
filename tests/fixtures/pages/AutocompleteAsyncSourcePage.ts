import { type Locator, type Page, expect } from '@playwright/test';

interface EditorFixture {
  isOpened(): boolean;
  state: string;
  row: number;
  col: number;
  rawChoices: unknown[];
  htEditor: { rootElement: HTMLElement };
  TEXTAREA: HTMLTextAreaElement;
  queryChoices(query: string): void;
}

interface HandsontableFixture {
  getSelected(): number[][] | undefined;
  getActiveEditor(): EditorFixture | undefined;
  isListening(): boolean;
  scrollViewportTo(options: { row: number, verticalSnap: string }): void;
  destroy(): void;
}

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
// full instance type, and narrowing it here to the handful of members these probes use would be a
// TS2430 conflict. Every access goes through an explicit cast anyway.
interface FixtureWindow {
  hot: HandsontableFixture;
  htEditorRef: EditorFixture | null;
  htListenCount: number;
  htResolveQueries(col: number): number;
  htPendingCount(col: number): number;
  htChoices: string[][];
  htScheduleQueryThenClose(): Promise<void>;
  htScheduleQuery(): Promise<void>;
  htQueryCount(): number;
  htResolveQueryAt(index: number): boolean;
  htQueryStates(col: number): (string | null)[];
  htSettleValidation(): number;
  htArmRefocusThenClose(): void;
  htFocusProbeDone: boolean;
  htRefocusAfterClose: number;
}

interface PageOptions {
  editor?: 'autocomplete' | 'dropdown';
  scenario?: 'plain' | 'scroll' | 'ordering';
  validator?: 'none' | 'slowAsync';
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
  readonly validator: string;
  readonly outsideInput: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd', options: PageOptions = {}) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.editor = options.editor ?? 'autocomplete';
    this.scenario = options.scenario ?? 'plain';
    this.validator = options.validator ?? 'none';
    this.outsideInput = page.getByTestId('outside-input');
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}` +
      `&editor=${this.editor}&scenario=${this.scenario}&validator=${this.validator}`;

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
   * Returns a cell's dropdown arrow. The renderer builds the arrow, so it carries no test id of its
   * own and has to be reached through the cell that owns it.
   */
  arrow(row: number, col: number): Locator {
    return this.cell(row, col).locator('.htAutocompleteArrow');
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
   * Returns the coordinates of the cell the active editor is bound to, or `null` when there is no
   * editor. `isEditorOpen()` only reports that SOME editor is open, which cannot tell an editor on
   * the wrong cell apart from the right one.
   */
  async editorCoords(): Promise<[number, number] | null> {
    return this.page.evaluate(() => {
      const editor = (window as unknown as FixtureWindow).hot.getActiveEditor();

      return editor ? [editor.row, editor.col] : null;
    });
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
   * Lands a close inside the window of an already-scheduled `queryChoices()` timeout, then returns
   * once that timeout has either run or been cancelled. See the fixture for why both halves happen
   * page-side and how the wait is ordered against the editor's own timer.
   */
  async scheduleQueryThenClose(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htScheduleQueryThenClose());
  }

  /**
   * Returns how many queries the `source` has been asked for since the page loaded, answered or not.
   */
  async totalQueryCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htQueryCount());
  }

  /**
   * Returns how many of the column's queries came from the editor itself rather than from
   * `autocompleteValidator`, which calls the same user `source` on the strict save path.
   */
  async editorQueryCount(col: number): Promise<number> {
    const states = await this.page.evaluate(
      target => (window as unknown as FixtureWindow).htQueryStates(target),
      col,
    );

    return states.filter(state => state === 'STATE_EDITING').length;
  }

  /**
   * Returns the editor state captured for each of the column's queries, in call order.
   */
  async queryStates(col: number): Promise<(string | null)[]> {
    return this.page.evaluate(
      target => (window as unknown as FixtureWindow).htQueryStates(target),
      col,
    );
  }

  /**
   * Answers one specific query by its position in the call log, so two overlapping queries can be
   * resolved newest-first.
   */
  async resolveQueryAt(index: number): Promise<boolean> {
    return this.page.evaluate(
      target => (window as unknown as FixtureWindow).htResolveQueryAt(target),
      index,
    );
  }

  /**
   * Schedules another `queryChoices()` through a keystroke and returns once its timer has fired,
   * leaving the editor open.
   */
  async scheduleAnotherQuery(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htScheduleQuery());
  }

  /**
   * Settles every pending async validation, rejecting the value. Returns how many settled.
   */
  async settleValidation(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htSettleValidation());
  }

  /**
   * Tears the grid down while a query is still in flight. `Core#destroy()` never closes the active
   * editor, so neither token moves and only the destroyed check stops the response.
   */
  async destroyGrid(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).hot.destroy());
  }

  /**
   * Arms the debounced refocus and closes the editor inside its window, returning once the debounce
   * has provably fired or been cancelled.
   */
  async armRefocusThenClose(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).htArmRefocusThenClose());

    await expect
      .poll(() => this.page.evaluate(() => (window as unknown as FixtureWindow).htFocusProbeDone))
      .toBe(true);
  }

  /**
   * Returns how many times the editor refocused itself after that close.
   */
  async refocusCountAfterClose(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htRefocusAfterClose);
  }

  /**
   * Calls the public `queryChoices()` and reports how many new queries reached the `source`.
   *
   * This is the only way to exercise the entry guard: with deferred queries cancelled on close, no
   * internal caller can reach the method outside an edit, so the guard exists purely for the
   * documented public contract - and that contract needs a test of its own.
   */
  async callQueryChoicesDirectly(): Promise<number> {
    return this.page.evaluate(() => {
      const fixture = window as unknown as FixtureWindow;
      const editor = fixture.hot.getActiveEditor();
      const before = fixture.htQueryCount();

      editor?.queryChoices(editor.TEXTAREA.value);

      return fixture.htQueryCount() - before;
    });
  }

  /**
   * Returns the grid's current selection.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected());
  }
}
