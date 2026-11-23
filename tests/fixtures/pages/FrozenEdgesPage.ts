import { type Page, type Locator } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, BUNDLE_POLLING_MS, type Bundle } from '../bundle';
import { flattenAxTree } from '../../a11y/checks/ax-tree';
import { gridRows, structureFindings } from '../../lib/aria-tree.mjs';

/**
 * Which edges of the grid are frozen, as the fixture's `?edges=` allowlist spells them.
 */
export type FrozenEdges = 'none' | 'top-start' | 'bottom-end' | 'all';

/**
 * One table section (a `thead` or a `tbody`) of the master table or of an overlay clone.
 */
export interface TableSection {
  /**
   * The table the section belongs to: `master`, or the clone's name (`clone_top`, `clone_inline_start`, …).
   */
  table: string;
  /**
   * `thead` or `tbody`.
   */
  tag: string;
  /**
   * The section's `role` attribute, or `null` when it has none.
   */
  role: string | null;
  /**
   * The number of rows the section holds.
   */
  rows: number;
  /**
   * The number of cells the section's rows hold together.
   */
  cells: number;
  /**
   * How many of the section's rows carry the `row` role.
   */
  rowRoles: number;
}

/**
 * Page object for `demo/frozen-edges.html`: a small grid whose frozen edges the query picks, so every
 * overlay clone the grid can build is reachable.
 */
export class FrozenEdgesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Opens the fixture with the given frozen edges and waits for the grid to be built.
   *
   * @param edges The frozen edges.
   * @param headers Whether the grid has row and column headers.
   * @param aria Whether the grid writes accessibility attributes (`ariaTags`).
   */
  async goto(edges: FrozenEdges = 'none', headers: 'on' | 'off' = 'on', aria: 'on' | 'off' = 'on'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/frozen-edges.html?theme=${this.theme}&bundle=${this.bundle}`
      + `&edges=${edges}&headers=${headers}&aria=${aria}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
  }

  /**
   * Every table section of the grid, read in one evaluation: the master's and each clone's `thead` and
   * `tbody`, with its role and its row count.
   *
   * @returns The sections, in document order.
   */
  async sections(): Promise<TableSection[]> {
    return this.grid.evaluate(root => Array.from(root.querySelectorAll('table.htCore > thead, table.htCore > tbody'), (section) => {
      const holder = section.closest('.ht_master, [class*="ht_clone_"]');
      const name = Array.from(holder?.classList ?? []).find(item => item === 'ht_master' || item.startsWith('ht_clone_')) ?? 'unknown';

      return {
        table: name.replace(/^ht_/, ''),
        tag: section.tagName.toLowerCase(),
        role: section.getAttribute('role'),
        rows: section.querySelectorAll(':scope > tr').length,
        cells: section.querySelectorAll(':scope > tr > *').length,
        rowRoles: section.querySelectorAll(':scope > tr[role="row"]').length,
      };
    }));
  }

  /**
   * One section of one table.
   *
   * @param table The table: `master` or a clone's name.
   * @param tag `thead` or `tbody`.
   * @returns The section.
   */
  async section(table: string, tag: 'thead' | 'tbody'): Promise<TableSection | undefined> {
    return (await this.sections()).find(item => item.table === table && item.tag === tag);
  }

  /**
   * Applies settings to the grid. `updateSettings()` renders before it returns.
   *
   * @param settings The settings.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate((value) => {
      (window as unknown as { hot: { updateSettings(settings: object): void } }).hot.updateSettings(value);
    }, settings);
  }

  /**
   * Replaces the grid's data. `loadData()` renders before it returns.
   *
   * @param data The rows.
   */
  async loadData(data: unknown[][]): Promise<void> {
    await this.page.evaluate((value) => {
      (window as unknown as { hot: { loadData(data: unknown[][]): void } }).hot.loadData(value);
    }, data);
  }

  /**
   * The row groups the element with the grid role lists in `aria-owns`, in the listed order, each as `table section`
   * (`top head`, `master body`) with the section's role and row count. An id that names no element reads
   * as `missing`.
   *
   * @returns The listed row groups.
   */
  async ownedRowGroups(): Promise<Array<{ name: string, role: string | null, rows: number }>> {
    return this.page.evaluate(() => {
      const root = (window as unknown as { hot: { rootElement: HTMLElement } }).hot.rootElement;
      const gridElement = root.querySelector(':scope > [role="treegrid"]') ?? root;
      const ids = (gridElement.getAttribute('aria-owns') ?? '').split(' ').filter(Boolean);

      return ids.map((id) => {
        const section = root.ownerDocument.getElementById(id);
        const holder = section?.closest('.ht_master, [class*="ht_clone_"]');
        const table = Array.from(holder?.classList ?? []).find(item => item === 'ht_master' || item.startsWith('ht_clone_'));

        return {
          name: section && table ? `${table.replace(/^ht_(clone_)?/, '')} ${section.tagName === 'THEAD' ? 'head' : 'body'}` : 'missing',
          role: section?.getAttribute('role') ?? null,
          rows: section?.querySelectorAll(':scope > tr').length ?? 0,
        };
      });
    });
  }

  /**
   * The `aria-owns` attribute of the element that carries the grid role.
   *
   * @returns The attribute, or `null` when the element has none.
   */
  async rootOwns(): Promise<string | null> {
    return this.page.evaluate(
      () => {
        const root = (window as unknown as { hot: { rootElement: HTMLElement } }).hot.rootElement;

        return (root.querySelector(':scope > [role="treegrid"]') ?? root).getAttribute('aria-owns');
      }
    );
  }

  /**
   * The grid as Chromium's accessibility tree holds it, which is what a screen reader gets: the cell
   * roles and the cell names of each row in reading order, the number of cells that sit in no row, and
   * the kinds of the structural findings of the tree check.
   *
   * @returns The rows, the orphan count and the finding kinds.
   */
  async accessibilityTree(): Promise<{ rows: string[][], names: string[][], orphanCells: number, findings: string[] }> {
    const cdp = await this.page.context().newCDPSession(this.page);

    try {
      await cdp.send('Accessibility.enable');

      const nodes = await flattenAxTree(this.page, cdp, '[data-testid="grid"]');

      const rows = gridRows(nodes).filter(row => row.cells.length > 0);
      const cellRoles = new Set(['gridcell', 'columnheader', 'rowheader']);
      const roleOf = new Map(nodes.map(item => [item.id, item.role]));

      return {
        rows: rows.map(row => row.cells.map(cell => cell.role)),
        names: rows.map(row => row.cells.map(cell => cell.name)),
        orphanCells: nodes.filter(item => cellRoles.has(item.role) && roleOf.get(item.parent ?? '') !== 'row').length,
        findings: structureFindings(nodes).map(item => item.kind),
      };
    } finally {
      await cdp.detach();
    }
  }

  /**
   * Replaces the data with a grid of the given size in a viewport that scrolls both ways, and scrolls to
   * the given cell. Ends when the cell is rendered.
   *
   * @param rows The number of rows.
   * @param columns The number of columns.
   * @param target The cell to scroll to.
   * @param target.row The row.
   * @param target.col The column.
   */
  async makeScrollableAndScrollTo(rows: number, columns: number, target: { row: number, col: number }): Promise<void> {
    await this.page.evaluate(([rowCount, columnCount, cell]) => {
      const { hot, Handsontable } = window as unknown as {
        hot: { updateSettings(settings: object): void, scrollViewportTo(cell: object): void },
        Handsontable: { helper: { createSpreadsheetData(rows: number, columns: number): unknown[][] } },
      };

      hot.updateSettings({
        data: Handsontable.helper.createSpreadsheetData(rowCount as number, columnCount as number), width: 600, height: 320,
      });
      hot.scrollViewportTo(cell as object);
    }, [rows, columns, target] as const);
    await this.page.waitForFunction(
      cell => (window as unknown as { hot: { getCell(row: number, col: number): unknown } }).hot.getCell(cell.row, cell.col) !== null,
      target,
      { polling: BUNDLE_POLLING_MS },
    );
  }

  /**
   * Selects a cell through the API, so the keyboard acts on the grid from it.
   *
   * @param row The row.
   * @param col The column.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(
      ([cellRow, cellCol]) => (window as unknown as { hot: { selectCell(row: number, col: number): void } }).hot.selectCell(cellRow, cellCol),
      [row, col] as const,
    );
  }

  /**
   * The element that holds the browser focus: its text, and whether it or an ancestor is hidden from
   * assistive technology.
   *
   * @returns The focused element's text and hidden state.
   */
  async focused(): Promise<{ text: string, hidden: boolean }> {
    return this.page.evaluate(() => {
      const element = document.activeElement;

      return { text: element?.textContent ?? '', hidden: element?.closest('[aria-hidden="true"]') !== null };
    });
  }

  /**
   * The overlay table that holds the browser focus, by its first class (`ht_master`, `ht_clone_top`), or
   * `null` when the focus is outside the grid.
   *
   * @returns The class name.
   */
  async focusedTable(): Promise<string | null> {
    return this.page.evaluate(() => {
      const overlay = document.activeElement?.closest('.ht_master, [class*="ht_clone_"]');

      return overlay ? [...overlay.classList].find(name => name.startsWith('ht_')) ?? null : null;
    });
  }

  /**
   * The accessibility snapshot of the grid, as Playwright writes it.
   *
   * @returns The snapshot.
   */
  async ariaSnapshot(): Promise<string> {
    return this.grid.ariaSnapshot();
  }
}
