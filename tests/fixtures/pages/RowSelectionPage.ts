import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { cellSelection, rowSelectionSources, selectedRows, verticalOffsetInHeader } from '../rowSelection';

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
// full instance type, and narrowing it here would be a TS2430 conflict. Every access is cast.
interface FixtureWindow {
  hot: {
    getPlugin(name: 'rowSelection'): {
      getSelectedRows(): number[];
      getSelectedPhysicalRows(): number[];
      getServerSelection(): { selectAll: boolean; toggledRowIds: unknown[] } | null;
    };
    getPlugin(name: 'filters'): {
      addCondition(column: number, name: string, args: unknown[]): void;
      filter(): void;
    };
    getSettings(): { rowSelection: Record<string, unknown> };
    updateSettings(settings: Record<string, unknown>): void;
    selectCell(row: number, col: number, endRow?: number, endCol?: number): void;
    getActiveEditor(): { isOpened(): boolean } | undefined;
    getSelectedRangeLast(): {
      getTopStartCorner(): { row: number; col: number };
      getBottomEndCorner(): { row: number; col: number };
    } | undefined;
    getSelectedRangeActive(): {
      highlight: { row: number; col: number; isHeader(): boolean };
    } | undefined;
    getDataAtCell(row: number, col: number): unknown;
    countRows(): number;
    getSourceData(): Array<{ name: string }>;
  };
  rowSelectionEvents: Array<{ selected: number[]; deselected: number[]; source: string }>;
  fetchCount: number;
  vetoSelection: boolean;
}

/**
 * The `enableClickSelection` forms.
 */
export type ClickMode = boolean | 'enableSelection' | 'enableDeselection';

/**
 * Page Object for the RowSelection fixture (PRO-87). The checkboxes are found by their accessible
 * names ("Select row 3", "Select all rows (...)"), scoped to the overlay that shows them: the
 * master table renders the row header column too, underneath the inline-start clone.
 */
export class RowSelectionPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture with the checkbox location, the "select all" scope, the row numbers on or off,
   * and the plugin options of the same names (`checkboxes: 'even'` is the function form, which shows
   * a checkbox on the even rows only).
   */
  async goto({
    location = 'rowHeader',
    scope = 'all',
    rowHeaders = true,
    click = false as ClickMode,
    checkboxes = true as boolean | 'even',
    hideDisabled = false,
    headerCheckbox = true,
    mode = 'multiRow' as 'multiRow' | 'singleRow',
  } = {}): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/row-selection.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&location=${location}&scope=${scope}&rowHeaders=${rowHeaders}&click=${click}` +
      `&checkboxes=${checkboxes}&hideDisabled=${hideDisabled}&headerCheckbox=${headerCheckbox}&mode=${mode}`
    );

    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Opens the NestedRows fixture (Europe > Poland > Krakow, Warsaw; Europe > France; Asia > Japan)
   * with the `groupSelects` mode.
   */
  async gotoNested(groupSelects: 'descendants' | 'self' | 'topLevel' = 'descendants'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/row-selection-nested.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&groupSelects=${groupSelects}`
    );

    await awaitBundle(this.page);
    await expect(this.cell(6, 0)).toContainText('Japan');
  }

  /**
   * The `checked`/`indeterminate`/`disabled` state of every row checkbox, by visual row, as one
   * string per row (`x` checked, `-` mixed, ` ` unchecked, followed by `d` when disabled).
   */
  async checkboxStates(rows: number): Promise<string[]> {
    const states: string[] = [];

    for (let row = 0; row < rows; row++) {
      // eslint-disable-next-line no-await-in-loop
      states.push(await this.rowCheckbox(row).evaluate((element) => {
        const input = element as HTMLInputElement;
        const mark = input.indeterminate ? '-' : (input.checked ? 'x' : ' ');

        return `${mark}${input.disabled ? 'd' : ''}`;
      }));
    }

    return states;
  }

  /**
   * Opens the fixture backed by an in-page server (12 rows, 5 per page) and waits for the first page.
   */
  async gotoServerBacked(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/row-selection-data-provider.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);
    await expect(this.cell(0, 1)).toHaveText('Item 1');
  }

  /**
   * Moves to the next page with the pager button, and waits for its first row.
   */
  async nextPage(expectedFirstName: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Go to next page' }).click();
    await expect(this.cell(0, 1)).toHaveText(expectedFirstName);
  }

  /**
   * Moves to the previous page with the pager button, and waits for its first row.
   */
  async previousPage(expectedFirstName: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Go to previous page' }).click();
    await expect(this.cell(0, 1)).toHaveText(expectedFirstName);
  }

  /**
   * The selection of the server-backed grid, by row id.
   */
  async serverSelection(): Promise<{ selectAll: boolean; toggledRowIds: unknown[] } | null> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot
      .getPlugin('rowSelection').getServerSelection());
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Returns the checkbox of a row (visual index). With the row header location it lives in the
   * inline-start clone; with the first column location, inside the row's first data cell.
   */
  rowCheckbox(row: number, location: 'rowHeader' | 'firstColumn' = 'rowHeader'): Locator {
    const scope = location === 'rowHeader' ?
      this.page.locator('.ht_clone_inline_start') : this.cell(row, 0);

    return scope.getByRole('checkbox', { name: `Select row ${row + 1}`, exact: true });
  }

  /**
   * The column header label in the top clone. The first column's header also holds the
   * "select all" checkbox, so the label is the part that selects the column.
   */
  columnHeader(label: string): Locator {
    return this.page.locator('.ht_clone_top').locator('span.colHeader').getByText(label, { exact: true });
  }

  /**
   * Returns the "select all" checkbox: in the corner with the row header location, in the first
   * column's header with the first column location.
   */
  headerCheckbox(location: 'rowHeader' | 'firstColumn' = 'rowHeader'): Locator {
    const scope = this.page.locator(
      location === 'rowHeader' ? '.ht_clone_top_inline_start_corner' : '.ht_clone_top'
    );

    return scope.getByRole('checkbox', { name: /^Select all rows/ });
  }

  /**
   * Whether the checkbox shows the mixed state (the `indeterminate` property has no attribute).
   */
  async isIndeterminate(checkbox: Locator): Promise<boolean> {
    return checkbox.evaluate(element => (element as HTMLInputElement).indeterminate);
  }

  /**
   * How far the checkbox's vertical center sits from its header cell's, in pixels. Measured in one
   * evaluation, so a re-render cannot land between the two reads.
   */
  async verticalOffsetInHeader(checkbox: Locator): Promise<number> {
    return verticalOffsetInHeader(checkbox);
  }

  /**
   * The selected rows, in visual indexes.
   */
  async selectedRows(): Promise<number[]> {
    return selectedRows(this.page);
  }

  /**
   * The selected rows, in physical indexes (rows the filters removed included).
   */
  async selectedPhysicalRows(): Promise<number[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot
      .getPlugin('rowSelection').getSelectedPhysicalRows());
  }

  /**
   * The active highlight, so a spec can tell a column header selection from a cell selection.
   */
  async selectionHighlight(): Promise<{ row: number; col: number; header: boolean } | null> {
    return this.page.evaluate(() => {
      const highlight = (window as unknown as FixtureWindow).hot.getSelectedRangeActive()?.highlight;

      return highlight ? { row: highlight.row, col: highlight.col, header: highlight.isHeader() } : null;
    });
  }

  /**
   * The cell selection, which a checkbox press must leave alone.
   */
  async cellSelection(): Promise<number[][] | undefined> {
    return cellSelection(this.page);
  }

  /**
   * The sources of the `afterRowSelectionChange` calls so far.
   */
  async eventSources(): Promise<string[]> {
    return rowSelectionSources(this.page);
  }

  /**
   * Moves the cell selection (focus) to a cell or header through the API.
   */
  async focusCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => (window as unknown as FixtureWindow).hot.selectCell(r, c), [row, col]);
  }

  /**
   * Selects a range of cells through the API.
   */
  async selectRange(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    await this.page.evaluate(([r1, c1, r2, c2]) => (window as unknown as FixtureWindow).hot
      .selectCell(r1, c1, r2, c2), [fromRow, fromCol, toRow, toCol]);
  }

  /**
   * Whether a cell editor is open.
   */
  async isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(() => !!(window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened());
  }

  /**
   * The value of a cell.
   */
  async dataAt(row: number, col: number): Promise<unknown> {
    return this.page.evaluate(([r, c]) => (window as unknown as FixtureWindow).hot.getDataAtCell(r, c), [row, col]);
  }

  /**
   * The live region the grid announces row selection changes through. The grid also mounts a
   * polite region; the plugin announces through the default, assertive one.
   */
  announcer(): Locator {
    return this.page.locator('[role="status"][aria-live="assertive"]');
  }

  /**
   * Keeps the rows whose status equals the value.
   */
  async filterStatus(value: string): Promise<void> {
    await this.page.evaluate((status) => {
      const filters = (window as unknown as FixtureWindow).hot.getPlugin('filters');

      filters.addCondition(1, 'eq', [status]);
      filters.filter();
    }, value);
  }

  /**
   * Moves the checkboxes to another location through `updateSettings()`, keeping the rest of the
   * plugin settings.
   */
  async switchLocation(location: 'rowHeader' | 'firstColumn'): Promise<void> {
    await this.page.evaluate((checkboxLocation) => {
      const { hot } = window as unknown as FixtureWindow;

      hot.updateSettings({ rowSelection: { ...hot.getSettings().rowSelection, checkboxLocation } });
    }, location);
  }

  /**
   * The names of every row in the source data, filtered-out rows included.
   */
  async names(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSourceData().map(row => row.name));
  }

  /**
   * The number of rows the grid shows.
   */
  async countRows(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.countRows());
  }

  /**
   * Returns the plugin's cell in the row header column: the header cell next to the data (the
   * plugin pushes its column last), in the inline-start clone.
   */
  rowHeaderCell(row: number): Locator {
    return this.page.locator('.ht_clone_inline_start tbody tr').nth(row).locator('th').last();
  }

  /**
   * Returns the corner cell above the plugin's row header column.
   */
  cornerCell(): Locator {
    return this.page.locator('.ht_clone_top_inline_start_corner thead th').last();
  }

  /**
   * Returns every row checkbox the inline-start clone shows, by accessible name.
   */
  rowCheckboxesInHeader(): Locator {
    return this.page.locator('.ht_clone_inline_start').getByRole('checkbox', { name: /^Select row \d+$/ });
  }

  /**
   * Returns the checkbox input a first column cell holds, visible or the hidden placeholder. Found
   * by class, because a placeholder is hidden from the accessibility tree.
   */
  firstColumnCheckboxInput(row: number): Locator {
    return this.cell(row, 0).locator('input.htRowSelectionCheckbox');
  }

  /**
   * The x coordinate where a cell's text starts, in pixels from the viewport's left edge. Measured
   * on the text node itself, in one evaluation.
   */
  async valueTextX(row: number, col: number): Promise<number> {
    return this.cell(row, col).evaluate((td) => {
      const walker = td.ownerDocument.createTreeWalker(td, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();

      while (node && !node.textContent?.trim()) {
        node = walker.nextNode();
      }

      if (!node) {
        throw new Error('The cell has no text.');
      }

      const range = td.ownerDocument.createRange();

      range.selectNodeContents(node);

      return range.getBoundingClientRect().left;
    });
  }

  /**
   * Presses the mouse at the center of an element's layout box, whatever is painted there. A
   * `visibility: hidden` element is not hit-tested, so the press lands on what is underneath it.
   */
  async pressAtBoxOf(locator: Locator): Promise<void> {
    const box = await locator.boundingBox();

    if (!box) {
      throw new Error('The element has no layout box.');
    }

    await this.page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2));
  }

  /**
   * The cursor the element shows.
   */
  async cursorOf(locator: Locator): Promise<string> {
    return locator.evaluate(element => getComputedStyle(element).cursor);
  }

  /**
   * The corners of the last cell selection range, or `null` with no cell selection.
   */
  async lastSelectedRange(): Promise<{ from: { row: number; col: number }; to: { row: number; col: number } } | null> {
    return this.page.evaluate(() => {
      const range = (window as unknown as FixtureWindow).hot.getSelectedRangeLast();

      if (!range) {
        return null;
      }

      const from = range.getTopStartCorner();
      const to = range.getBottomEndCorner();

      return { from: { row: from.row, col: from.col }, to: { row: to.row, col: to.col } };
    });
  }

  /**
   * Makes `beforeRowSelectionChange` veto every change, or stop vetoing.
   */
  async setVeto(veto: boolean): Promise<void> {
    await this.page.evaluate((value) => {
      (window as unknown as FixtureWindow).vetoSelection = value;
    }, veto);
  }

  /**
   * Opens the context menu with a right-click on a data cell, and returns it once it is on screen.
   */
  async openContextMenu(row: number, col: number): Promise<Locator> {
    await this.cell(row, col).click({ button: 'right' });

    const menu = this.page.locator('.htContextMenu:visible').last();

    await expect(menu).toBeVisible();

    return menu;
  }

  /**
   * Returns a context menu item by its label (a string matches the whole label).
   */
  menuItem(menu: Locator, label: string | RegExp): Locator {
    // Every RegExp special character is escaped, backslash included, so a label is matched literally.
    const pattern = typeof label === 'string' ? new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) : label;

    return menu.locator('.ht_master td').filter({ hasText: pattern });
  }
}
