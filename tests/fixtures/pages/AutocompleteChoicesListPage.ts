import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * The slice of the open autocomplete editor the probes below read. `htEditor` is the editor's inner
 * grid, the one that draws the list of choices.
 */
interface ListEditor {
  query: string | null;
  htEditor: {
    rootElement: HTMLElement;
    getData(): unknown[][];
    countRows(): number;
  };
}

/**
 * What the fixture (`demo/autocomplete-choices-list.html`) puts on `window`. Deliberately not an
 * `interface Window` augmentation: `windowTypes.ts` owns that and already declares `hot` with another
 * shape, so every access here goes through an explicit cast.
 */
interface FixtureWindow {
  hot: {
    selectCell(row: number, col: number): boolean;
    getDataAtCell(row: number, col: number): unknown;
    getActiveEditor(): ListEditor | undefined;
  };
  initGrid(overrides?: Record<string, unknown>): boolean;
  useFilteringSource(list: string[]): boolean;
  htBuildError?: string;
  __xssTestInjection?: boolean;
}

/**
 * Everything the tests compare about the open list, read in one go.
 */
export interface ListState {
  /**
   * The text the list was last queried with. `null` until the editor ran its first query, so a
   * test that waits for the query it typed knows the list on screen answers that query.
   */
  query: string | null;
  /**
   * The list's data, one `[choice]` row per entry: what the inner grid holds, drawn or not.
   */
  data: unknown[][];
  /**
   * The text of the rows the inner grid has drawn, top to bottom.
   */
  text: string[];
  /**
   * The markup of the rows the inner grid has drawn, top to bottom: where the highlight shows.
   */
  html: string[];
}

/**
 * Page object for the autocomplete choices list fixture (`demo/autocomplete-choices-list.html`): a
 * one-column grid that is rebuilt per test with the settings under test.
 *
 * Choices are read from the editor's inner grid in a single evaluation (`listState()`), never from
 * two round trips: the grid re-renders the list on every query, and a data read and a DOM read that
 * land on either side of one describe two different lists. Text goes in through real key presses, so
 * the editor's own key handling and deferred query are what the tests observe.
 */
export class AutocompleteChoicesListPage {
  /**
   * The Playwright page the fixture is driven through.
   */
  readonly page: Page;
  /**
   * The active theme, passed through to the fixture URL.
   */
  readonly theme: string;
  /**
   * The active bundle, passed through to the fixture URL.
   */
  readonly bundle: string;
  /**
   * The open cell editor's input.
   */
  readonly editor: Locator;

  /**
   * Wires up the page object for one theme/bundle leg.
   *
   * @param {Page} page The Playwright page.
   * @param {string} [theme] The theme the fixture loads.
   * @param {string} [bundle] The bundle the fixture loads.
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
   * Navigates to the fixture and waits for its default grid to render. The shared `awaitFixtureBuilt()`
   * waits for the grid or for the constructor failure the fixture captured in `htBuildError`, and rethrows
   * the failure with its cause, so a bad build is a red test with the cause instead of a mute timeout on a
   * missing cell.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/autocomplete-choices-list.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await this.expectBuilt();
  }

  /**
   * Rebuilds the grid with the given serializable settings merged over the fixture defaults.
   *
   * @param {Record<string, unknown>} [overrides] The settings to build the grid with.
   */
  async initGrid(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => (window as unknown as FixtureWindow).initGrid(settings), overrides);
    await this.expectBuilt();
  }

  /**
   * Rebuilds the grid with one autocomplete column whose `source` is a function, which cannot cross
   * `evaluate()`, so the fixture builds it inside the page. It answers synchronously with the entries
   * of `list` that match the typed query read as a case-insensitive regular expression, and the
   * column runs with `filter: false`, so the editor only highlights the phrase in what it is given.
   *
   * @param {string[]} list The entries the source chooses from.
   */
  async useFilteringSource(list: string[]): Promise<void> {
    await this.page.evaluate(choices => (window as unknown as FixtureWindow).useFilteringSource(choices), list);
    await this.expectBuilt();
  }

  /**
   * A single data cell of the grid, by visual row and column, via its stable test id.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Locator}
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell through the API, so the press cannot land on the cell's dropdown arrow, then opens
   * its editor with Enter and waits for the editor to hold the focus.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async openEditor(row: number, col: number): Promise<void> {
    await this.page.evaluate(
      ({ r, c }) => (window as unknown as FixtureWindow).hot.selectCell(r, c),
      { r: row, c: col }
    );
    await this.page.keyboard.press('Enter');
    await expect(this.editor).toBeVisible();
    await expect(this.editor).toBeFocused();
  }

  /**
   * Types text into the open editor, one key press per character, the way a user does.
   *
   * @param {string} text The text to type.
   */
  async type(text: string): Promise<void> {
    await this.page.keyboard.type(text);
  }

  /**
   * Presses one key (Playwright's key names) in the open editor.
   *
   * @param {string} key The key to press.
   */
  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Picks the first entry of the open list the way a keyboard user does: ArrowDown to move the
   * highlight onto it, then Enter to commit it, and waits for the editor to close.
   */
  async pickFirstWithKeyboard(): Promise<void> {
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
    await expect(this.editor).toBeHidden();
  }

  /**
   * Reads the open list in one evaluation, so every value a comparison needs comes from the same
   * moment. Meant for `expect.poll()`: the deferred query and the rendering after it are what a test
   * waits out. Without an open editor every field is empty.
   *
   * @returns {Promise<ListState>}
   */
  async listState(): Promise<ListState> {
    return this.page.evaluate(() => {
      const editor = (window as unknown as FixtureWindow).hot.getActiveEditor();

      if (!editor || !editor.htEditor) {
        return { query: null, data: [], text: [], html: [] };
      }

      const rows = Array.from(editor.htEditor.rootElement.querySelectorAll('.ht_master tbody td'));

      return {
        query: editor.query,
        data: editor.htEditor.getData(),
        text: rows.map(td => td.textContent ?? ''),
        html: rows.map(td => td.innerHTML),
      };
    });
  }

  /**
   * How long the open list is and how many of its rows the inner grid has drawn. A lighter read than
   * `listState()` for a list too long to ship across `evaluate()` on every poll.
   *
   * @returns {Promise<{ rows: number, drawnRows: number }>}
   */
  async listSize(): Promise<{ rows: number, drawnRows: number }> {
    return this.page.evaluate(() => {
      const editor = (window as unknown as FixtureWindow).hot.getActiveEditor();

      if (!editor || !editor.htEditor) {
        return { rows: 0, drawnRows: 0 };
      }

      return {
        rows: editor.htEditor.countRows(),
        drawnRows: editor.htEditor.rootElement.querySelectorAll('.ht_master tbody tr').length,
      };
    });
  }

  /**
   * The cell's current value.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Promise<unknown>}
   */
  async dataAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(
      ({ r, c }) => (window as unknown as FixtureWindow).hot.getDataAtCell(r, c),
      { r: row, c: col }
    );
  }

  /**
   * What the `onerror` handler of the injected `<img>` writes: `true` once the browser ran it, and
   * `undefined` until then. The handler fires when the image fails to load, a task after the markup
   * is written, so a test polls this rather than reading it once.
   *
   * @returns {Promise<boolean | undefined>}
   */
  async injectedHandlerRan(): Promise<boolean | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).__xssTestInjection);
  }

  /**
   * Rethrows a constructor failure the fixture captured in `htBuildError` (a rebuild through `initGrid()` runs
   * after `goto()`, so the shared wait does not cover it), then waits for the grid to render.
   */
  private async expectBuilt(): Promise<void> {
    const buildError = await this.page.evaluate(() => (window as unknown as FixtureWindow).htBuildError ?? null);

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }
}
