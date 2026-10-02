import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

declare global {
  interface Window {
    hookLog: string[];
    customClearCalls: number[];
  }
}

export type NestedRowsClearColumnMode = 'nested' | 'custom' | 'formulas' | 'trim';

/**
 * One source row, read straight from the tree (or the flat source in `trim` mode), so a row the
 * grid currently trims is still visible to the assertion.
 */
export interface SourceRow {
  name: string;
  value: unknown;
  note: unknown;
}

/**
 * Page object for DEV-150: "Clear column" from the column dropdown menu must also clear the rows
 * a collapsed Nested Rows parent trims away.
 *
 * The fixture tree, by physical row: 0 P1, 1 C1.1, 2 C1.2 (read-only value), 3 C1.3,
 * 4 G1.3.1, 5 G1.3.2, 6 P2, 7 C2.1, 8 C2.2, 9 L3.
 */
export class NestedRowsClearColumnPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture and wait for the bundle and the column headers.
   */
  async goto(mode: NestedRowsClearColumnMode = 'nested'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/nested-rows-clear-column.html?theme=${this.theme}&bundle=${this.bundle}&mode=${mode}`
    );
    await awaitBundle(this.page);
    await expect(this.columnHeader('Value')).toBeVisible();
  }

  /**
   * The column header carrying this name, in the top overlay.
   */
  columnHeader(name: string): Locator {
    return this.page.locator(`.ht_clone_top [data-testid="header-${name}"]`);
  }

  /**
   * A data cell by its current visual coordinates. Plain cells live in the master table only.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The expand button a collapsed parent shows in its row header, by visual row.
   */
  expandButton(row: number): Locator {
    return this.page.locator(`.ht_clone_inline_start [data-testid="row-header-${row}"] .ht_nestingExpand`);
  }

  /**
   * The collapse button an expanded parent shows in its row header, by visual row.
   */
  collapseButton(row: number): Locator {
    return this.page.locator(`.ht_clone_inline_start [data-testid="row-header-${row}"] .ht_nestingCollapse`);
  }

  /**
   * Collapse parents through the public API, by visual row, in the given order.
   */
  async collapseParents(visualRows: number[]): Promise<void> {
    await this.page.evaluate((rows) => {
      const plugin = window.hot.getPlugin('nestedRows');

      rows.forEach(row => plugin.collapseParent(row));
    }, visualRows);
  }

  /**
   * Expand every parent through the public API.
   */
  async expandAll(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('nestedRows').expandAll());
  }

  /**
   * Move a column through the ManualColumnMove API (the original report drags it first).
   */
  async moveColumn(from: number, to: number): Promise<void> {
    await this.page.evaluate(([fromColumn, toColumn]) => {
      window.hot.getPlugin('manualColumnMove').moveColumn(fromColumn, toColumn);
      window.hot.render();
    }, [from, to]);
  }

  /**
   * Open the column dropdown on the named header and pick "Clear column".
   */
  async clearColumnViaDropdown(headerName: string): Promise<void> {
    await this.columnHeader(headerName).locator('.changeType').click();

    const menu = this.page.locator('.htDropdownMenu > .ht_master:visible');

    await expect(menu).toBeVisible();
    await menu.locator('td').filter({ hasText: /^Clear column$/ }).click();
    await expect(menu).toBeHidden();
  }

  /**
   * Right-click the named column header and pick "Clear column" from the context menu.
   */
  async clearColumnViaContextMenu(headerName: string): Promise<void> {
    await this.columnHeader(headerName).click({ button: 'right' });

    const menu = this.page.locator('.htContextMenu > .ht_master:visible');

    await expect(menu).toBeVisible();
    await menu.locator('td').filter({ hasText: /^Clear column$/ }).click();
    await expect(menu).toBeHidden();
  }

  /**
   * Select a column by its header and run "Clear column" through `DropdownMenu#executeCommand()`,
   * without opening the menu first - the command list then is the one built at initialization.
   * `endRow` replaces the bottom row of the range handed to the command, the way an API caller can.
   */
  async clearColumnViaApi(visualColumn: number, endRow?: number): Promise<void> {
    await this.page.evaluate(([column, lastRow]) => {
      const hot = window.hot;

      hot.selectColumns(column);

      const ranges = hot.getSelectedRange().map((range) => {
        const end = range.getBottomEndCorner();

        return {
          start: range.getTopStartCorner(),
          end: lastRow === null ? end : { row: lastRow, col: end.col },
        };
      });

      hot.getPlugin('dropdownMenu').executeCommand('clear_column', ranges);
    }, [visualColumn, endRow ?? null] as const);
  }

  /**
   * Undo through the platform-specific Cmd/Ctrl+Z shortcut, keeping the current selection.
   */
  async undoWithKeyboard(): Promise<void> {
    await this.page.keyboard.press('ControlOrMeta+z');
  }

  /**
   * Redo through the platform-specific Cmd/Ctrl+Shift+Z shortcut, keeping the current selection.
   */
  async redoWithKeyboard(): Promise<void> {
    await this.page.keyboard.press('ControlOrMeta+Shift+z');
  }

  /**
   * The computed `note` column of the HyperFormula sheet, one entry per physical row
   * (`formulas` mode only).
   */
  formulaResults(): Promise<unknown[]> {
    return this.page.evaluate(() => {
      const formulas = window.hot.getPlugin('formulas');

      return formulas.engine!.getSheetValues(formulas.sheetId!).map(row => row[2]);
    });
  }

  /**
   * Physical indexes of the collapsed parents.
   */
  collapsedParents(): Promise<number[]> {
    return this.page.evaluate(() => window.hot.getPlugin('nestedRows').getCollapsedParents());
  }

  /**
   * Number of rows the grid currently shows.
   */
  countRows(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  /**
   * Every source row in physical order, trimmed ones included.
   */
  sourceRows(): Promise<SourceRow[]> {
    return this.page.evaluate(() => {
      const rows: SourceRow[] = [];
      const plugin = window.hot.getPlugin('nestedRows');
      const walk = (nodes: Array<Record<string, unknown>>) => {
        nodes.forEach((node) => {
          rows.push({ name: String(node.name), value: node.value, note: node.note });

          if (Array.isArray(node.__children)) {
            walk(node.__children as Array<Record<string, unknown>>);
          }
        });
      };

      walk(plugin.enabled ?
        plugin.dataManager.getRawSourceData() :
        window.hot.getSourceData() as Array<Record<string, unknown>>);

      return rows;
    });
  }

  /**
   * The hooks the fixture records: the four collapse/expand hooks and `afterChange:<source>:<count>`.
   */
  hookLog(): Promise<string[]> {
    return this.page.evaluate(() => window.hookLog.slice());
  }

  /**
   * Empty the hook log, so a test reads only what its own gesture fired.
   */
  async clearHookLog(): Promise<void> {
    await this.page.evaluate(() => { window.hookLog.length = 0; });
  }

  /**
   * Row counts the user `clear_column` callback saw, one entry per call (`custom` mode only).
   */
  customClearCalls(): Promise<number[]> {
    return this.page.evaluate(() => window.customClearCalls.slice());
  }
}
