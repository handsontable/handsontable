import { type Page, type Locator } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';
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
   * The row groups the grid's root lists in `aria-owns`, in the listed order, each as `table section`
   * (`top head`, `master body`) with the section's role and row count. An id that names no element reads
   * as `missing`.
   *
   * @returns The listed row groups.
   */
  async ownedRowGroups(): Promise<Array<{ name: string, role: string | null, rows: number }>> {
    return this.page.evaluate(() => {
      const root = (window as unknown as { hot: { rootElement: HTMLElement } }).hot.rootElement;
      const ids = (root.getAttribute('aria-owns') ?? '').split(' ').filter(Boolean);

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
   * The `aria-owns` attribute of the grid's root element (the element that carries the grid role).
   *
   * @returns The attribute, or `null` when the root has none.
   */
  async rootOwns(): Promise<string | null> {
    return this.page.evaluate(
      () => (window as unknown as { hot: { rootElement: HTMLElement } }).hot.rootElement.getAttribute('aria-owns')
    );
  }

  /**
   * The grid as Chromium's accessibility tree holds it, which is what a screen reader gets: the cell
   * roles of each row in reading order, and the kinds of the structural findings of the tree check.
   *
   * @returns The rows and the finding kinds.
   */
  async accessibilityTree(): Promise<{ rows: string[][], findings: string[] }> {
    const cdp = await this.page.context().newCDPSession(this.page);

    try {
      await cdp.send('Accessibility.enable');

      const nodes = await flattenAxTree(this.page, cdp, '[data-testid="grid"]');

      return {
        rows: gridRows(nodes).filter(row => row.cells.length > 0).map(row => row.cells.map(cell => cell.role)),
        findings: structureFindings(nodes).map(item => item.kind),
      };
    } finally {
      await cdp.detach();
    }
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
