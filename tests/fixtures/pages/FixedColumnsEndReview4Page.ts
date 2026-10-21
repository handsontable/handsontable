import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * Which scenario the `fixed-columns-end-review4.html` fixture builds (see the comment in the fixture).
 */
export type Review4Scenario = 'collapse' | 'order' | 'perf';

/**
 * Query params the fixture understands.
 */
export interface FixedColumnsEndReview4Options {
  scenario: Review4Scenario;
  rtl?: boolean;
  collapsed?: boolean;
  fixedColumnsStart?: number;
  fixedColumnsEnd?: number;
}

/**
 * One header cell and the overlay the grid says it belongs to.
 */
export interface HeaderOwner {
  cloneClass: string;
  overlayName: string;
}

/**
 * The result of timing the header-cell lookup against the one that walked every overlay.
 */
export interface LookupTiming {
  cells: number;
  mismatches: number;
  previousMs: number;
  currentMs: number;
}

type HotWindow = {
  hot: {
    rootElement: HTMLElement;
    getPlugin(name: string): { collapseSection(coords: { row: number; col: number }): void;
      expandSection(coords: { row: number; col: number }): void };
    view: {
      getElementOverlayName(el: HTMLElement): string;
      _wt: {
        wtOverlays: {
          getOverlays(): Array<{ clone?: { wtTable: { TABLE: HTMLElement } } }>;
          getParentOverlay(el: HTMLElement): unknown;
        };
      };
    };
  };
};

/**
 * Page Object for the `fixedColumnsEnd` fixture of the fourth review round. It hides the globals, so a spec
 * asserts what the user sees (which groups carry a toggle, how the clones sit in the DOM) and how the lookup of
 * a header cell's overlay behaves.
 */
export class FixedColumnsEndReview4Page {
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
   * @param {FixedColumnsEndReview4Options} options The fixture options.
   */
  async goto(options: FixedColumnsEndReview4Options): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(options).forEach(([name, value]) => {
      if (value !== undefined && value !== false) {
        params.set(name, value === true ? '1' : String(value));
      }
    });
    await this.page.goto(`/tests/fixtures/demo/fixed-columns-end-review4.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.master).toBeVisible();
  }

  /**
   * Collapses the group that starts at the column through the API, the way an application does.
   *
   * @param {number} col The first visual column of the group.
   */
  async collapseGroup(col: number): Promise<void> {
    await this.page.evaluate((c) => {
      (window as unknown as HotWindow).hot.getPlugin('collapsibleColumns').collapseSection({ row: -2, col: c });
    }, col);
  }

  /**
   * Expands the group that starts at the column through the API.
   *
   * @param {number} col The first visual column of the group.
   */
  async expandGroup(col: number): Promise<void> {
    await this.page.evaluate((c) => {
      (window as unknown as HotWindow).hot.getPlugin('collapsibleColumns').expandSection({ row: -2, col: c });
    }, col);
  }

  /**
   * The labels of the groups that show a collapse toggle, in any clone of the grid.
   */
  async groupsWithToggle(): Promise<string[]> {
    const labels = await this.grid.locator('.collapsibleIndicator').evaluateAll(
      toggles => toggles.map(el => (el.closest('th')?.querySelector('.colHeader')?.textContent ?? '')
        .replace(/[+-]$/, '').trim())
    );

    return [...new Set(labels)].sort();
  }

  /**
   * The roots of the tables the grid builds next to each other, in DOM order: the class that names each one.
   * The master comes first, then the overlay clones in the order they were added to the wrapper.
   */
  async cloneOrder(): Promise<string[]> {
    return this.master.evaluate((master) => {
      const names: string[] = [];

      Array.from(master.parentElement?.children ?? []).forEach((child) => {
        const token = Array.from(child.classList).find(name => /^ht_(master|clone_)/.test(name));

        if (token) {
          names.push(token);
        }
      });

      return names;
    });
  }

  /**
   * The overlay names the grid reports for each overlay it owns, in `getOverlays()` order.
   */
  async overlayTableNames(): Promise<string[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as HotWindow;

      return hot.view._wt.wtOverlays.getOverlays().map((overlay) => {
        const root = overlay.clone?.wtTable.TABLE.closest('[class*="ht_clone_"]');

        return Array.from(root?.classList ?? []).find(name => /^ht_clone_/.test(name)) ?? '';
      });
    });
  }

  /**
   * Every rendered header cell of the clones with the overlay the grid resolves for it.
   */
  async headerOwners(): Promise<HeaderOwner[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as HotWindow;
      const owners: Array<{ cloneClass: string; overlayName: string }> = [];

      hot.rootElement.querySelectorAll<HTMLElement>('[class*="ht_clone_"]').forEach((cloneRoot) => {
        const cloneClass = Array.from(cloneRoot.classList).find(name => /^ht_clone_/.test(name)) ?? '';

        cloneRoot.querySelectorAll<HTMLElement>('th').forEach((th) => {
          owners.push({ cloneClass, overlayName: hot.view.getElementOverlayName(th) });
        });
      });

      return owners;
    });
  }

  /**
   * Times the lookup of the overlay that holds a cell, against a copy of the lookup that walked every overlay and
   * built its list and closure on each call, over every cell of the grid. It also counts the cells for which the
   * two answer differently.
   *
   * @param {number} rounds How many times each cell is looked up.
   */
  async timeLookup(rounds: number): Promise<LookupTiming> {
    return this.page.evaluate((count) => {
      const { hot } = window as unknown as HotWindow;
      const { wtOverlays } = hot.view._wt;
      const cells = Array.from(hot.rootElement.querySelectorAll<HTMLElement>('th, td'));
      const previous = (element: HTMLElement) => {
        const overlays = wtOverlays.getOverlays();
        let result: unknown = null;

        overlays.forEach((overlay) => {
          if (overlay.clone && overlay.clone.wtTable.TABLE.contains(element)) {
            result = overlay.clone;
          }
        });

        return result;
      };
      let mismatches = 0;

      cells.forEach((cell) => {
        if (previous(cell) !== wtOverlays.getParentOverlay(cell)) {
          mismatches += 1;
        }
      });

      const run = (find: (el: HTMLElement) => unknown) => {
        const start = performance.now();

        for (let round = 0; round < count; round++) {
          for (let index = 0; index < cells.length; index++) {
            find(cells[index]);
          }
        }

        return performance.now() - start;
      };

      // Warm both, then measure each twice and keep the faster run, so a stray GC pause does not decide it.
      run(previous);
      run(el => wtOverlays.getParentOverlay(el));

      const previousMs = Math.min(run(previous), run(previous));
      const currentMs = Math.min(run(el => wtOverlays.getParentOverlay(el)),
        run(el => wtOverlays.getParentOverlay(el)));

      return { cells: cells.length, mismatches, previousMs, currentMs };
    }, rounds);
  }
}
