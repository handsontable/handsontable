import { type Locator, type Page, expect } from '@playwright/test';

interface EditorFixture {
  isOpened(): boolean;
  row: number;
  col: number;
}

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the full
// instance type, and narrowing it here to the members these probes use would be a TS2430 conflict.
// Every access goes through an explicit cast anyway.
interface FixtureWindow {
  hot: {
    getSelected(): number[][] | undefined;
    getActiveEditor(): EditorFixture | undefined;
  };
}

export type CellType = 'autocomplete' | 'dropdown' | 'handsontable' | 'multiselect';

// `multiselect` builds its own indicator in `multiSelectRenderer` rather than reusing
// `htAutocompleteArrow`, whose styling and global listener belong to `autocompleteRenderer`.
const ARROW_CLASS: Record<CellType, string> = {
  autocomplete: 'htAutocompleteArrow',
  dropdown: 'htAutocompleteArrow',
  handsontable: 'htAutocompleteArrow',
  multiselect: 'ht-multi-select-arrow',
};

/**
 * Page Object for the fixture whose cells carry a dropdown arrow.
 *
 * Openness is read through `hot.getActiveEditor()`, never a CSS locator: `.handsontableInput` is
 * always in the DOM and a closed editor is only `opacity: 0`, which Playwright counts as visible.
 */
export class CellDropdownArrowPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly cellType: CellType;

  constructor(page: Page, theme = 'main', bundle = 'umd', cellType: CellType = 'autocomplete') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.cellType = cellType;
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}&cellType=${this.cellType}`;

    await this.page.goto(`/tests/fixtures/demo/cell-dropdown-arrow.html?${query}`);

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
    return this.cell(row, col).locator(`.${ARROW_CLASS[this.cellType]}`);
  }

  /**
   * Clicks a cell near its leading edge, far from the dropdown arrow.
   *
   * A centred click can land on the right-floated arrow at narrow column widths, and whether it
   * does is theme-dependent. Addressing the leading edge keeps "a click on the cell body" a
   * meaningful control regardless of theme or column width.
   */
  async clickCellBody(row: number, col: number): Promise<void> {
    const box = await this.cell(row, col).boundingBox();

    if (!box) {
      throw new Error(`Cell (${row}, ${col}) is not rendered`);
    }

    await this.page.mouse.click(box.x + 4, box.y + (box.height / 2));
  }

  /**
   * Reports whether a cell editor is open.
   */
  async isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => (
      (window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened() === true
    ));
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
   * Returns the current selection.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected());
  }
}
