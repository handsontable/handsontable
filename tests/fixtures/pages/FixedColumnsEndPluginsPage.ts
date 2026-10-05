import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * Which plugin the `fixed-columns-end-plugins.html` fixture sets up (see the comment in the fixture for the
 * spans each scenario declares).
 */
export type PluginsScenario = 'merge' | 'nested' | 'collapsible';

/**
 * Query params the fixture understands.
 */
export interface FixedColumnsEndPluginsOptions {
  scenario: PluginsScenario;
  rtl?: boolean;
  virtualized?: boolean;
  fixedColumnsStart?: number;
  fixedColumnsEnd?: number;
}

/**
 * A rectangle in viewport coordinates.
 */
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * What the grid shows for one cell: the topmost rendered cell at the coordinates.
 */
export interface CellInfo {
  hidden: boolean;
  colspan: number;
  rowspan: number;
  text: string;
  clone: string;
  box: Box;
}

/**
 * What a column header cell shows.
 */
export interface HeaderInfo {
  text: string;
  colspan: number;
  hiddenHeader: boolean;
  hiddenHeaderText: boolean;
  box: Box;
}

type HotWindow = { hot: { getCell(row: number, col: number, topmost: boolean): HTMLTableCellElement | null } };

/**
 * Page Object for the `fixedColumnsEnd` fixture with the merged cells, nested headers and collapsible columns
 * plugins. It hides the globals and the clone class names, so a spec asserts what the user sees: which cell
 * spans what, where, and which header carries which label.
 */
export class FixedColumnsEndPluginsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   *
   * @param {FixedColumnsEndPluginsOptions} options The fixture options.
   */
  async goto(options: FixedColumnsEndPluginsOptions): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(options).forEach(([name, value]) => {
      if (value !== undefined && value !== false) {
        params.set(name, value === true ? '1' : String(value));
      }
    });
    await this.page.goto(`/tests/fixtures/demo/fixed-columns-end-plugins.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.master).toBeVisible();
  }

  /**
   * The topmost rendered cell at the coordinates, as the user sees it.
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   */
  async cell(row: number, col: number): Promise<CellInfo> {
    return this.page.evaluate(([r, c]) => {
      const td = (window as unknown as HotWindow).hot.getCell(r, c, true);

      if (!td) {
        throw new Error(`Cell ${r},${c} is not rendered`);
      }

      const { left, right, top, bottom } = td.getBoundingClientRect();
      const cloneClass = (td.closest('[class*="ht_clone_"]')?.className ?? '')
        .split(/\s+/).find(name => /^ht_clone_(inline|top|bottom)/.test(name) && !/_left/.test(name));

      return {
        hidden: getComputedStyle(td).display === 'none',
        colspan: Number(td.getAttribute('colspan') ?? 1),
        rowspan: Number(td.getAttribute('rowspan') ?? 1),
        text: (td.textContent ?? '').trim(),
        clone: cloneClass?.replace('ht_clone_', '') ?? 'master',
        box: { left, right, top, bottom },
      };
    }, [row, col]);
  }

  /**
   * The cell the end clone draws at the coordinates. Unlike `cell()` it does not go through the core lookup,
   * which resolves a covered cell of a merge to the merge's top-left cell (a cell of the master, or none at all
   * while the master does not render it).
   *
   * @param {number} row Visual row.
   * @param {number} col Visual column.
   */
  async endBandCell(row: number, col: number): Promise<CellInfo> {
    return this.grid.locator(`.ht_clone_inline_end [data-testid="cell-${row}-${col}"]`).evaluate((td) => {
      const { left, right, top, bottom } = td.getBoundingClientRect();

      return {
        hidden: getComputedStyle(td).display === 'none',
        colspan: Number(td.getAttribute('colspan') ?? 1),
        rowspan: Number(td.getAttribute('rowspan') ?? 1),
        text: (td.textContent ?? '').trim(),
        clone: 'inline_end',
        box: { left, right, top, bottom },
      };
    });
  }

  /**
   * The box of the inline-end clone: the band the end columns must stay inside.
   */
  async endBandBox(): Promise<Box> {
    return this.grid.locator('.ht_clone_inline_end').evaluate((el) => {
      const { left, right, top, bottom } = el.getBoundingClientRect();

      return { left, right, top, bottom };
    });
  }

  /**
   * The column header cells of one header level in a clone, in DOM order.
   *
   * @param {string} cloneClass The clone's class, for example `ht_clone_top_inline_end_corner`.
   * @param {number} level The header level, counted from the top.
   */
  async headers(cloneClass: string, level: number): Promise<HeaderInfo[]> {
    return this.grid.locator(`.${cloneClass} thead tr:nth-child(${level + 1}) th`).evaluateAll((cells) => {
      const text = (el: Element) => (el.querySelector('.colHeader')?.textContent ?? '').trim();

      // The corner cell over the row headers has no column header span.
      return cells
        .filter(el => el.querySelector('.colHeader') !== null)
        .map((el) => {
          const { left, right, top, bottom } = el.getBoundingClientRect();

          return {
            text: text(el),
            colspan: Number(el.getAttribute('colspan') ?? 1),
            hiddenHeader: el.classList.contains('hiddenHeader'),
            hiddenHeaderText: el.classList.contains('hiddenHeaderText'),
            box: { left, right, top, bottom },
          };
        });
    });
  }

  /**
   * Scroll the master holder horizontally and let the overlays sync.
   *
   * @param {{ left: number }} offset The offset to set, as a magnitude (the browser clamps it to the maximum).
   */
  async scrollTo({ left }: { left: number }): Promise<void> {
    await this.master.locator('.wtHolder').evaluate(async (holder, target) => {
      const isRtl = getComputedStyle(holder).direction === 'rtl';
      const hot = (window as unknown as { hot: { addHook(name: string, callback: () => void): void } }).hot;
      const state = window as unknown as { htScrolls?: number };
      const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

      if (state.htScrolls === undefined) {
        state.htScrolls = 0;
        hot.addHook('afterScrollHorizontally', () => {
          state.htScrolls = (state.htScrolls ?? 0) + 1;
        });
      }

      const before = holder.scrollLeft;
      const scrollsBefore = state.htScrolls;

      holder.scrollLeft = isRtl ? -target : target;

      if (holder.scrollLeft === before) {
        return;
      }

      // The overlays follow on the scroll the grid reports: wait for the first one, then for two quiet frames.
      while (state.htScrolls === scrollsBefore) {
        await nextFrame();
      }

      await nextFrame();
      await nextFrame();
    }, left);
  }

  /**
   * How many collapse toggles a clone renders.
   *
   * @param {string} cloneClass The clone's class, for example `ht_clone_top`.
   */
  async indicatorCount(cloneClass: string): Promise<number> {
    return this.grid.locator(`.${cloneClass} .collapsibleIndicator`).count();
  }

  /**
   * The group labels that carry a collapse toggle in a clone.
   *
   * @param {string} cloneClass The clone's class.
   */
  async indicatorOwners(cloneClass: string): Promise<string[]> {
    return this.grid.locator(`.${cloneClass} .collapsibleIndicator`).evaluateAll(
      toggles => toggles.map(el => (el.closest('th')?.querySelector('.colHeader')?.textContent ?? '').trim())
    );
  }

  /**
   * Click the collapse toggle of the group with the label, in the top clone.
   *
   * @param {string} label The group label.
   */
  async toggleGroup(label: string): Promise<void> {
    await this.grid.locator('.ht_clone_top th', { hasText: new RegExp(`^${label}`) })
      .locator('.collapsibleIndicator').first().click();
  }
}
