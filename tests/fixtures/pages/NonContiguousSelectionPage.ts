import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, assertKnownBundle, type Bundle } from '../bundle';

/**
 * A range the grid reports, `[fromRow, fromCol, toRow, toCol]`.
 */
type SelectedRange = [number, number, number, number];

/**
 * A merged area as the MergeCells plugin holds it.
 */
type MergedArea = { row: number, col: number, rowspan: number, colspan: number };

/**
 * The part of the fixture window this page object reads. Kept local, so the shared `Window`
 * declaration does not grow with members only this fixture has.
 */
interface FixtureWindow {
  initGrid(overrides?: Record<string, unknown>): void;
  hot: {
    getSelected(): SelectedRange[] | undefined;
    selectCells(ranges: SelectedRange[]): boolean;
    getDataAtRow(row: number): unknown[];
    getDataAtCol(col: number): unknown[];
    rootElement: HTMLElement;
    getPlugin(name: string): {
      getHiddenColumns?(): number[],
      getHiddenRows?(): number[],
      mergedCellsCollection?: { mergedCells: MergedArea[] },
      executeCommand?(commandName: string): void,
    };
  };
}

/**
 * Page Object for the non-contiguous selection fixture
 * (tests/fixtures/demo/non-contiguous-selection.html).
 *
 * The grid has column and row headers, the context menu, hiding, merging and moving on, so one page
 * drives every feature that reads a selection of several ranges. Column headers are read from the
 * top clone and row headers from the inline-start clone, where the user clicks them; the master
 * table holds second copies.
 */
export class NonContiguousSelectionPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    assertKnownBundle(bundle, '(page, theme, bundle)');
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the grid.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/non-contiguous-selection.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Rebuilds the grid with the fixture's settings merged with `overrides`.
   *
   * @param {object} overrides Settings to merge.
   */
  async initGrid(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => (window as unknown as FixtureWindow).initGrid(settings), overrides);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell of the master table.
   *
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   * @returns {Locator}
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A column header, as the top clone draws it.
   *
   * @param {number} col Visual column index.
   * @returns {Locator}
   */
  columnHeader(col: number): Locator {
    return this.page.locator('.ht_clone_top').getByTestId(`col-header-${col}`);
  }

  /**
   * A row header, as the inline-start clone draws it.
   *
   * @param {number} row Visual row index.
   * @returns {Locator}
   */
  rowHeader(row: number): Locator {
    return this.page.locator('.ht_clone_inline_start').getByTestId(`row-header-${row}`);
  }

  /**
   * Clicks the corner header, which selects the whole grid.
   */
  async clickCorner(): Promise<void> {
    await this.page.locator('.ht_clone_top_inline_start_corner thead th').first().click();
  }

  /**
   * Clicks column headers in turn, holding Ctrl/Cmd from the second one, which adds each column as a
   * range of its own.
   *
   * @param {number[]} cols Visual column indexes.
   */
  async selectColumnHeaders(cols: number[]): Promise<void> {
    for (const [index, col] of cols.entries()) {
      await this.columnHeader(col).click({ modifiers: index === 0 ? [] : ['ControlOrMeta'] });
    }
  }

  /**
   * Clicks row headers in turn, holding Ctrl/Cmd from the second one.
   *
   * @param {number[]} rows Visual row indexes.
   */
  async selectRowHeaders(rows: number[]): Promise<void> {
    for (const [index, row] of rows.entries()) {
      await this.rowHeader(row).click({ modifiers: index === 0 ? [] : ['ControlOrMeta'] });
    }
  }

  /**
   * Selects cell ranges through the API, the way `selectCells()` builds a non-contiguous selection.
   *
   * @param {SelectedRange[]} ranges The ranges.
   */
  async selectRanges(ranges: SelectedRange[]): Promise<void> {
    await this.page.evaluate(selection => (window as unknown as FixtureWindow).hot.selectCells(selection), ranges);
  }

  /**
   * The selection the grid reports.
   *
   * @returns {Promise<SelectedRange[]>}
   */
  async selected(): Promise<SelectedRange[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected() ?? []);
  }

  /**
   * Opens the context menu with a right click on an element.
   *
   * @param {Locator} target The element to right-click.
   */
  async openContextMenuOn(target: Locator): Promise<void> {
    await target.click({ button: 'right' });
    await expect(this.contextMenu()).toBeVisible();
  }

  /**
   * The open context menu.
   *
   * @returns {Locator}
   */
  contextMenu(): Locator {
    return this.page.locator('.htContextMenu:visible');
  }

  /**
   * An item of the open context menu, by its label.
   *
   * @param {string} name The item's label.
   * @returns {Locator}
   */
  contextMenuItem(name: string): Locator {
    return this.contextMenu().getByRole('menuitem', { name, exact: true });
  }

  /**
   * Clicks an item of the open context menu and waits for the menu to close.
   *
   * @param {string} name The item's label.
   */
  async clickContextMenuItem(name: string): Promise<void> {
    await this.contextMenuItem(name).click();
    await expect(this.contextMenu()).toHaveCount(0);
  }

  /**
   * Runs a context menu command through `ContextMenu#executeCommand()`, the way an application does
   * from its own code, without opening the menu.
   *
   * @param {string} commandName The command's key, such as `mergeCells`.
   */
  async executeContextMenuCommand(commandName: string): Promise<void> {
    await this.page.evaluate(
      name => (window as unknown as FixtureWindow).hot.getPlugin('contextMenu').executeCommand?.(name),
      commandName,
    );
  }

  /**
   * The physical indexes of the hidden columns.
   *
   * @returns {Promise<number[]>}
   */
  async hiddenColumns(): Promise<number[]> {
    return this.page.evaluate(() => (
      (window as unknown as FixtureWindow).hot.getPlugin('hiddenColumns').getHiddenColumns?.() ?? []
    ));
  }

  /**
   * The physical indexes of the hidden rows.
   *
   * @returns {Promise<number[]>}
   */
  async hiddenRows(): Promise<number[]> {
    return this.page.evaluate(() => (
      (window as unknown as FixtureWindow).hot.getPlugin('hiddenRows').getHiddenRows?.() ?? []
    ));
  }

  /**
   * The merged areas, as `{ row, col, rowspan, colspan }`.
   *
   * @returns {Promise<MergedArea[]>}
   */
  async mergedAreas(): Promise<MergedArea[]> {
    return this.page.evaluate(() => {
      const collection = (window as unknown as FixtureWindow).hot.getPlugin('mergeCells').mergedCellsCollection;

      return (collection?.mergedCells ?? []).map(({ row, col, rowspan, colspan }) => ({ row, col, rowspan, colspan }));
    });
  }

  /**
   * The values of the first row, which show the column order.
   *
   * @returns {Promise<unknown[]>}
   */
  async firstRow(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getDataAtRow(0));
  }

  /**
   * The values of the first column, which show the row order.
   *
   * @returns {Promise<unknown[]>}
   */
  async firstColumn(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getDataAtCol(0));
  }

  /**
   * Presses a column header and drags it onto another header, with the real mouse.
   *
   * @param {number} col The visual column whose header is pressed.
   * @param {number} targetCol The visual column whose header it is dropped on.
   */
  async dragColumnHeaderOnto(col: number, targetCol: number): Promise<void> {
    await this.#drag(this.columnHeader(col), this.columnHeader(targetCol));
  }

  /**
   * Presses a row header and drags it onto another header, with the real mouse.
   *
   * @param {number} row The visual row whose header is pressed.
   * @param {number} targetRow The visual row whose header it is dropped on.
   */
  async dragRowHeaderOnto(row: number, targetRow: number): Promise<void> {
    await this.#drag(this.rowHeader(row), this.rowHeader(targetRow));
  }

  /**
   * Whether the grid's root element carries the class that draws the grab cursor on the selected
   * column or row headers.
   *
   * @param {'columns' | 'rows'} axis The headers asked about.
   * @returns {Promise<boolean>}
   */
  async showsMoveCursor(axis: 'columns' | 'rows'): Promise<boolean> {
    return this.page.evaluate(
      className => (window as unknown as FixtureWindow).hot.rootElement.classList.contains(className),
      `after-selection--${axis}`,
    );
  }

  /**
   * Presses the centre of one element, moves the pointer onto another, and releases. Two hovers on
   * the target make the move travel past the plugins' 3 px click tolerance before it lands.
   *
   * @param {Locator} from The element pressed.
   * @param {Locator} to The element released over.
   */
  async #drag(from: Locator, to: Locator): Promise<void> {
    await from.hover();
    await this.page.mouse.down();
    await to.hover();
    await to.hover();
    await this.page.mouse.up();
  }
}
