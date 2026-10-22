import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

/**
 * The grid configurations `demo/formula-builder.html` builds, one per `?variant=` value.
 */
export type FormulaBuilderVariant =
  | 'default'
  | 'sorting'
  | 'nested'
  | 'popups-host'
  | 'no-aria'
  | 'rtl'
  | 'frozen'
  | 'hidden-row'
  | 'read-only';

/**
 * The overlay a frozen cell is drawn in, by the class of its clone.
 */
export type FormulaBuilderOverlay =
  | 'ht_master'
  | 'ht_clone_top'
  | 'ht_clone_inline_start'
  | 'ht_clone_top_inline_start_corner';

/**
 * A selection range as `getSelectedLast()` returns it: `[row, col, row2, col2]`.
 */
export type SelectionTuple = [number, number, number, number];

/**
 * The boxes of the open inline editor and the visible suggestions popup, read in one evaluation.
 */
export interface PopupAlignment {
  editorLeft: number;
  editorRight: number;
  popupLeft: number;
  popupRight: number;
}

/**
 * The fixture's globals the page object reads.
 */
interface FixtureWindow {
  hot: {
    selectCell(row: number, col: number): void;
    getSelectedLast(): SelectionTuple | undefined;
    getSelected(): SelectionTuple[] | undefined;
    getSourceDataAtCell(row: number, col: number): unknown;
    getDataAtCell(row: number, col: number): unknown;
    setDataAtCell(row: number, col: number, value: unknown): void;
    isListening(): boolean;
    getActiveEditor(): { isOpened?: () => boolean } | undefined;
    getPlugin(name: string): {
      getSortConfig?: () => unknown[];
      sort?: (config: { column: number; sortOrder: 'asc' | 'desc' }) => void;
    } | undefined;
    getCurrentThemeName(): string | null;
    useTheme(name: string): void;
    updateSettings(settings: Record<string, unknown>): void;
  };
  FormulaBuilderModule: unknown;
}

/**
 * Page Object for the FormulaBuilder plugin fixture (`demo/formula-builder.html`).
 *
 * Grid cells are addressed via the `data-testid` stamped by the fixture renderer, scoped to the
 * master overlay (a frozen cell is drawn in a clone as well, see `frozenCell()`). The formula bar
 * and the editor are located by role and accessible name, the way a screen reader user meets them;
 * the remaining `hyperformula-ui` surfaces without a role (the bar's layout boxes, the function
 * help) use the package's stable `hfe-*` class names. Waits are condition-based, never fixed
 * timeouts.
 */
export class FormulaBuilderPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly variant: FormulaBuilderVariant;
  readonly grid: Locator;
  /**
   * The text field the fixture puts before the grid, where a keyboard user starts.
   */
  readonly beforeGrid: Locator;
  readonly formulaBar: Locator;
  /**
   * The element the plugin registers in the grid's top layout slot to host the bar.
   */
  readonly formulaBarHost: Locator;
  readonly layoutSlotTop: Locator;
  readonly addressInput: Locator;
  /**
   * The bar's idle (click-to-edit) formula area.
   */
  readonly barFormulaArea: Locator;
  /**
   * The bar's formula cell, which the capped bar editor spans.
   */
  readonly barFormulaCell: Locator;
  /**
   * The editor root while the bar hosts the edit.
   */
  readonly barEditor: Locator;
  /**
   * The one formula editor input, shared by the bar and the inline editor.
   */
  readonly editorInput: Locator;
  /**
   * The container of the inline (in-cell) editor, which carries the layer class of its cell.
   */
  readonly inlineEditorContainer: Locator;
  /**
   * The editor root while the cell hosts the edit.
   */
  readonly inlineEditor: Locator;
  readonly suggestions: Locator;
  readonly suggestionOptions: Locator;
  readonly fnHelp: Locator;
  /**
   * The element the `popups-host` variant docks the suggestions popup into.
   */
  readonly suggestionsHost: Locator;
  /**
   * The error popup a focused or hovered error cell opens.
   */
  readonly errorPopup: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd', variant: FormulaBuilderVariant = 'default') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.variant = variant;
    this.grid = page.getByTestId('grid');
    this.beforeGrid = page.getByTestId('before-grid');
    this.formulaBar = page.locator('.hfe-formula-bar').first();
    this.formulaBarHost = page.locator('.ht-formula-builder__formula-bar');
    this.layoutSlotTop = page.locator('.ht-slot-top');
    this.addressInput = page.getByRole('textbox', { name: 'Cell address', exact: true });
    this.barFormulaArea = page.getByRole('textbox', { name: 'Formula input', exact: true });
    this.barFormulaCell = page.locator('.hfe-formula-bar__cell--formula');
    this.barEditor = page.locator('.hfe-formula-bar__overlay .hfe-editor');
    this.editorInput = page.getByRole('combobox', { name: 'Formula editor', exact: true });
    this.inlineEditorContainer = page.locator('div:has(> .ht-formula-builder__inline-editor)');
    this.inlineEditor = page.locator('.ht-formula-builder__inline-editor > .hfe-editor');
    this.suggestions = page.getByRole('listbox', { name: 'Formula suggestions', exact: true });
    this.suggestionOptions = this.suggestions.getByRole('option');
    this.fnHelp = page.locator('.hfe-fn-help[role="dialog"]:not([hidden])');
    this.suggestionsHost = page.getByTestId('suggestions-host');
    this.errorPopup = page.locator('.hfe-error');
  }

  /**
   * Navigates to the fixture and waits for the grid. `awaitFixtureBuilt()` waits for `window.hot`
   * or the failure the fixture captured in `htBuildError` (a failed `hyperformula-ui` import or a
   * constructor throw), and rethrows the failure with its cause.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/formula-builder.html?theme=${this.theme}&bundle=${this.bundle}&variant=${this.variant}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell in the master overlay, by visual row/column, via its stable test id.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Locator}
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A data cell as one overlay draws it (a frozen cell is drawn in a clone and in the master).
   *
   * @param {FormulaBuilderOverlay} overlay The overlay class.
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Locator}
   */
  frozenCell(overlay: FormulaBuilderOverlay, row: number, col: number): Locator {
    return this.grid.locator(`.${overlay}`).getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The selection borders Walkontable draws for a reference highlight in one overlay (the
   * highlight renders as a custom selection carrying a generated `ht-formula-ref-fill-*` class).
   *
   * @param {FormulaBuilderOverlay} overlay The overlay class.
   * @returns {Locator}
   */
  refFillBorders(overlay: FormulaBuilderOverlay): Locator {
    return this.grid.locator(`.${overlay} [class*="wtBorder"][class*="ht-formula-ref-fill-"]`);
  }

  /**
   * A column header in the top clone, by its label text (`span.colHeader`), so a sort badge cannot
   * change what the locator finds (`tests/AGENTS.md`, "A header's accessible name can change").
   *
   * @param {string} label The header label.
   * @returns {Locator}
   */
  columnHeader(label: string): Locator {
    return this.grid.locator('.ht_clone_top thead th')
      .filter({ has: this.page.locator('span.colHeader').getByText(label, { exact: true }) });
  }

  /**
   * A row header in the inline-start clone, by its label text.
   *
   * @param {string} label The header label.
   * @returns {Locator}
   */
  rowHeader(label: string): Locator {
    return this.grid.locator('.ht_clone_inline_start tbody th')
      .filter({ has: this.page.locator('span.rowHeader').getByText(label, { exact: true }) });
  }

  /**
   * Assert a cell shows the expected text (web-first, auto-retrying).
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {string} text The expected text.
   */
  async expectCell(row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(row, col)).toHaveText(text);
  }

  /**
   * Click a cell to select it.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
  }

  /**
   * Selects a cell through the API, so the keyboard flow that follows starts from a known state
   * without a pointer event, and waits for the browser focus to land on the cell.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async selectCellByApi(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => (window as unknown as FixtureWindow).hot.selectCell(r, c), [row, col]);
    await expect.poll(() => this.focusedCellTestId()).toBe(`cell-${row}-${col}`);
  }

  /**
   * The test id of the cell holding the browser focus, or `null` when no cell has it. A frozen
   * cell takes the focus in the clone that draws it, not in the master, so the read goes by the
   * active element instead of one overlay's locator.
   *
   * @returns {Promise<string | null>}
   */
  async focusedCellTestId(): Promise<string | null> {
    return this.page.evaluate(() => {
      const active = document.activeElement;

      return active?.tagName === 'TD' ? active.getAttribute('data-testid') : null;
    });
  }

  /**
   * Open the formula editor on a cell via double click.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   */
  async openEditor(row: number, col: number): Promise<void> {
    await this.cell(row, col).dblclick();
    await expect(this.editorInput).toBeVisible();
  }

  /**
   * Start a bar-hosted edit of the selected cell by clicking the bar's formula area, and wait for
   * the shared editor to take focus.
   */
  async openBarEditor(): Promise<void> {
    await this.barFormulaArea.click();
    await expect(this.editorInput).toBeFocused();
  }

  /**
   * Drags the pointer from one cell to another with the primary button held.
   *
   * @param {Locator} from The element the press starts on.
   * @param {Locator} to The element the press ends on.
   */
  async drag(from: Locator, to: Locator): Promise<void> {
    await from.hover();
    await this.page.mouse.down();
    await to.hover();
    await this.page.mouse.up();
  }

  /**
   * The last selection range, as `getSelectedLast()` returns it.
   *
   * @returns {Promise<SelectionTuple | null>}
   */
  async selectedLast(): Promise<SelectionTuple | null> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelectedLast() ?? null);
  }

  /**
   * Every selection layer, as `getSelected()` returns it.
   *
   * @returns {Promise<SelectionTuple[] | null>}
   */
  async selectedAll(): Promise<SelectionTuple[] | null> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected() ?? null);
  }

  /**
   * The source value of a cell (the formula text of a formula cell).
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Promise<unknown>}
   */
  async sourceAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).hot.getSourceDataAtCell(r, c), [row, col]);
  }

  /**
   * The computed value of a cell.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @returns {Promise<unknown>}
   */
  async dataAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(
      ([r, c]) => (window as unknown as FixtureWindow).hot.getDataAtCell(r, c), [row, col]);
  }

  /**
   * Writes a cell value through the API.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {string | number} value The value to write.
   */
  async setDataAt(row: number, col: number, value: string | number): Promise<void> {
    await this.page.evaluate(
      ([r, c, v]) => (window as unknown as FixtureWindow).hot.setDataAtCell(r as number, c as number, v),
      [row, col, value] as const);
  }

  /**
   * Whether the grid listens to the keyboard.
   *
   * @returns {Promise<boolean>}
   */
  async isListening(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.isListening());
  }

  /**
   * Whether Handsontable's active editor is open. A closed editor stays in the DOM, so the
   * editor's own state is the reliable read (`tests/AGENTS.md`, "Reading grid UI state").
   *
   * @returns {Promise<boolean>}
   */
  async editorOpened(): Promise<boolean> {
    return this.page.evaluate(
      () => (window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened?.() ?? false);
  }

  /**
   * Sorts a column through the ColumnSorting plugin's API.
   *
   * @param {number} column The visual column index.
   * @param {'asc' | 'desc'} sortOrder The sort order.
   */
  async sortBy(column: number, sortOrder: 'asc' | 'desc'): Promise<void> {
    await this.page.evaluate(
      ([c, order]) => (window as unknown as FixtureWindow).hot.getPlugin('columnSorting')
        ?.sort?.({ column: c, sortOrder: order }),
      [column, sortOrder] as const);
  }

  /**
   * The ColumnSorting plugin's sort config.
   *
   * @returns {Promise<unknown[]>}
   */
  async sortConfig(): Promise<unknown[]> {
    return this.page.evaluate(
      () => (window as unknown as FixtureWindow).hot.getPlugin('columnSorting')?.getSortConfig?.() ?? []);
  }

  /**
   * Updates the `formulaBuilder` setting with a NEW object carrying the same `builder` module the
   * fixture built the grid with, the way a framework wrapper re-sends its props.
   *
   * @param {boolean} showFormulaBar The `showFormulaBar` value to send.
   */
  async updateFormulaBuilderSettings(showFormulaBar: boolean): Promise<void> {
    await this.page.evaluate((show) => {
      const fixture = window as unknown as FixtureWindow;

      fixture.hot.updateSettings({
        formulaBuilder: { builder: fixture.FormulaBuilderModule, showFormulaBar: show },
      });
    }, showFormulaBar);
  }

  /**
   * Switches the grid to a theme other than the one it runs on, through `hot.useTheme()`, after
   * the target theme's stylesheet has loaded. The target is picked in the page from the grid's
   * current theme, so every leg switches to a different one.
   *
   * @returns {Promise<string>} The class name of the theme switched to.
   */
  async switchToAnotherTheme(): Promise<string> {
    return this.page.evaluate(async() => {
      const hot = (window as unknown as FixtureWindow).hot;
      const current = hot.getCurrentThemeName();
      const target = ['ht-theme-main', 'ht-theme-horizon', 'ht-theme-classic'].find(name => name !== current)!;
      const link = document.createElement('link');

      link.rel = 'stylesheet';
      link.href = `/handsontable/styles/${target}.min.css`;
      await new Promise<void>((resolve, reject) => {
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`The stylesheet of ${target} did not load`));
        document.head.appendChild(link);
      });
      hot.useTheme(target);

      return target;
    });
  }

  /**
   * Whether the open inline editor is what a press at its own centre would hit, read in one
   * evaluation (a frozen pane drawn above it would take the press instead).
   *
   * @returns {Promise<boolean>}
   */
  async inlineEditorIsTopmost(): Promise<boolean> {
    return this.page.evaluate(() => {
      const editor = document.querySelector('.ht-formula-builder__inline-editor');
      const container = editor?.parentElement;

      if (!editor || !container) {
        return false;
      }

      const box = container.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + (box.width / 2), box.top + (box.height / 2));

      return hit !== null && editor.contains(hit);
    });
  }

  /**
   * The horizontal edges of the inline editor root and the visible suggestions popup, read in one
   * evaluation so both describe the same frame.
   *
   * @returns {Promise<PopupAlignment | null>}
   */
  async popupAlignment(): Promise<PopupAlignment | null> {
    return this.page.evaluate(() => {
      const editor = document.querySelector('.ht-formula-builder__inline-editor > .hfe-editor');
      const popup = document.querySelector('[role="listbox"]')?.closest('.hfe-popup');

      if (!editor || !popup) {
        return null;
      }

      const editorBox = editor.getBoundingClientRect();
      const popupBox = popup.getBoundingClientRect();

      return {
        editorLeft: editorBox.left,
        editorRight: editorBox.right,
        popupLeft: popupBox.left,
        popupRight: popupBox.right,
      };
    });
  }
}
