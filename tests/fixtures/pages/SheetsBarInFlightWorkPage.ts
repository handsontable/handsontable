import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

export type InFlightWorkbook = 'asyncValidator' | 'rejectedValue' | 'comments' | 'loading' | 'drags';

/**
 * Page object for the sheets-bar-in-flight-work fixture (fixtures/demo/sheets-bar-in-flight-work.html):
 * a two-sheet workbook, 'Alpha' and 'Beta', picked by `?workbook=`, with work that can still be running
 * when the user switches sheets. Every page error is collected, so a switch that throws fails the test
 * that made it.
 */
export class SheetsBarInFlightWorkPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  async goto(workbook: InFlightWorkbook): Promise<void> {
    this.page.on('pageerror', error => this.pageErrors.push(error.message));

    await this.page.goto(
      `/tests/fixtures/demo/sheets-bar-in-flight-work.html?theme=${this.theme}&bundle=${this.bundle}&workbook=${workbook}`
    );
    await awaitBundle(this.page);
    await this.page.waitForFunction(
      () => 'hot' in window || 'htBuildError' in window,
      undefined,
      { polling: BUNDLE_POLLING_MS },
    );

    const buildError = await this.page.evaluate(() => (window as { htBuildError?: string }).htBuildError ?? null);

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell by visual row and column, as drawn in the master table.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The tab of a sheet, found by its accessible name.
   */
  tab(name: string): Locator {
    return this.page.locator('.ht-sheets-bar').getByRole('button', { name, exact: true });
  }

  /**
   * Clicks a sheet's tab and waits until it is the active one.
   */
  async openSheet(name: string): Promise<void> {
    await this.tab(name).click();
    await expect(this.tab(name)).toHaveAttribute('aria-current', 'true');
  }

  /**
   * The name of the sheet the bar reports as active.
   */
  activeSheetName(): Promise<string | undefined> {
    return this.page.evaluate(() => window.hot.getPlugin('sheetsBar').getSheets().find(sheet => sheet.isActive)?.name);
  }

  /**
   * Switches sheets through the API and answers what `setActiveSheet()` returned.
   */
  setActiveSheet(name: string): Promise<boolean> {
    return this.page.evaluate(sheetName => window.hot.getPlugin('sheetsBar').setActiveSheet(sheetName), name);
  }

  /**
   * Selects a cell by clicking it, types a value into it with the keyboard, and presses Enter.
   */
  async typeInto(row: number, col: number, value: string): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.type(value);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Whether the cell editor is open, a cell editor waiting for its validator included.
   */
  isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(() => !!window.hot.getActiveEditor()?.isOpened());
  }

  /**
   * The cell editor's text field.
   */
  editorInput(): Locator {
    return this.page.locator('.handsontableInputHolder textarea.handsontableInput');
  }

  /**
   * Answers every validator call still waiting, and returns how many there were.
   */
  answerValidators(valid: boolean): Promise<number> {
    return this.page.evaluate(isValid => (window as unknown as {
      answerValidators: (v: boolean) => number,
    }).answerValidators(isValid), valid);
  }

  /**
   * The number of validator calls still waiting for an answer.
   */
  pendingValidatorCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { pendingValidations: unknown[] }).pendingValidations.length);
  }

  /**
   * A column of a sheet's own declared data array, read from the workbook the fixture passed in.
   */
  declaredSheetColumn(sheetIndex: number, col: number): Promise<unknown[]> {
    return this.page.evaluate(([index, c]) => {
      const { workbook } = window as unknown as { workbook: { sheets: Array<{ data: unknown[][] }> } };

      return workbook.sheets[index].data.map(row => row[c]);
    }, [sheetIndex, col]);
  }

  /**
   * Clicks the label of a column header, which sorts the column.
   */
  async clickColumnHeader(col: number): Promise<void> {
    await this.page.locator('.ht_clone_top .htCore thead th').nth(col + 1).locator('.colHeader').click();
  }

  /**
   * The sort configuration of the sheet the grid shows.
   */
  sortConfig(): Promise<unknown[]> {
    return this.page.evaluate(() => window.hot.getPlugin('columnSorting').getSortConfig() as unknown[]);
  }

  /**
   * Opens the comment editor on a cell through the API and types a text into it.
   */
  async typeCommentThroughApi(row: number, col: number, text: string): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      const comments = window.hot.getPlugin('comments');

      comments.showAtCell(r, c);
      comments.focusEditor();
    }, [row, col]);
    await this.commentEditor().fill(text);
  }

  /**
   * The comment editor's text field.
   */
  commentEditor(): Locator {
    return this.page.locator('.htCommentTextArea');
  }

  /**
   * The comment of a cell of the sheet the grid shows.
   */
  commentAt(row: number, col: number): Promise<string | undefined> {
    return this.page.evaluate(([r, c]) => window.hot.getPlugin('comments').getCommentAtCell(r, c), [row, col]);
  }

  /**
   * Selects a cell through the API.
   */
  selectCell(row: number, col: number): Promise<void> {
    return this.page.evaluate(([r, c]) => {
      window.hot.selectCell(r, c);
    }, [row, col]);
  }

  /**
   * The selection of the sheet the grid shows, or `null` when nothing is selected.
   */
  selected(): Promise<number[][] | null> {
    return this.page.evaluate(() => window.hot.getSelected() ?? null);
  }

  /**
   * Shows or hides the Loading plugin's overlay.
   */
  setLoading(visible: boolean): Promise<void> {
    return this.page.evaluate((show) => {
      const loading = window.hot.getPlugin('loading');

      if (show) {
        loading.show();
      } else {
        loading.hide();
      }
    }, visible);
  }
}
