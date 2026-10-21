import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * One recorded collapse/expand hook call, as captured by the fixture.
 *
 * The index arrays are physical row indexes - a collapsed parent nested inside another
 * collapsed parent is trimmed and has no visual index to report.
 */
export interface NestedRowsHookCall {
  name: string;
  args: unknown[];
}

/**
 * Page Object for the nested-rows public API fixture.
 *
 * Row headers live in the left overlay (`.ht_clone_inline_start`), so the collapse/expand
 * button locator is scoped to it - an unscoped match would also hit the master table copy
 * and fail Playwright's strict mode.
 */
export class NestedRowsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly rowHeaderOverlay: Locator;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.rowHeaderOverlay = page.locator('.ht_clone_inline_start');
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   *
   * `block` makes the matching `before*` hook return false, so a spec can cover cancelling
   * without injecting script into the page.
   */
  async goto(options: { block?: 'rowCollapse' | 'rowExpand' } = {}): Promise<void> {
    const block = options.block ? `&block=${options.block}` : '';

    await this.page.goto(`/tests/fixtures/demo/nested-rows.html?theme=${this.theme}&bundle=${this.bundle}${block}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** The collapse/expand button in a row header, by visual row index. */
  collapseButton(row: number): Locator {
    return this.rowHeaderOverlay.locator('tbody tr').nth(row).locator('.ht_nestingButton');
  }

  /**
   * Every nesting indicator the plugin has drawn into a row header - the collapse/expand buttons and
   * the indent spacers - across both copies of the headers: the master table and the inline-start
   * clone painted over it.
   *
   * Scoped to the whole grid on purpose. Only the clone is visible, but Walkontable recycles the
   * master's `th` elements too, so a leak there is just as permanent. Scoped to `tbody` because
   * CollapsibleColumns draws the same class names into `thead th`.
   */
  nestingIndicators(): Locator {
    return this.grid.locator('tbody th [class^="ht_nesting"]');
  }

  /** How many rows the grid currently shows. Collapsing trims rows, so this shrinks. */
  countRows(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  /** The text of the first column, top to bottom - what the user actually sees. */
  visibleNames(): Promise<string[]> {
    return this.page.evaluate(() => {
      const rows: string[] = [];

      for (let row = 0; row < window.hot.countRows(); row++) {
        rows.push(String(window.hot.getDataAtCell(row, 0)));
      }

      return rows;
    });
  }

  /** Physical row indexes of the parents that are collapsed right now. */
  collapsedParents(): Promise<number[]> {
    return this.page.evaluate(() => window.hot.getPlugin('nestedRows').getCollapsedParents());
  }

  /** Replace the data with `updateData()`, which is documented to keep the rows' states. */
  async updateData(data: unknown[]): Promise<void> {
    await this.page.evaluate(rows => window.hot.updateData(rows), data);
  }

  /** Replace the data with `loadData()`, which is documented to reset the rows' states. */
  async loadData(data: unknown[]): Promise<void> {
    await this.page.evaluate(rows => window.hot.loadData(rows), data);
  }

  /**
   * Opens the collapse stash, the way add child, detach child, remove row and row move all do:
   * the grid is expanded and the collapsed parents are parked until `applyCollapsedStash()`.
   *
   * No public API opens that window, so the spec drives the plugin internals directly.
   */
  async stashCollapsedState(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.getPlugin('nestedRows').collapsingUI.collapsedRowsStash.stash();
    });
  }

  /** Closes the stash window, restoring the parked parents. */
  async applyCollapsedStash(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.getPlugin('nestedRows').collapsingUI.collapsedRowsStash.applyStash();
    });
  }

  /**
   * Replaces the data from inside a real `beforeAddChild` window, the way an app that refetches on
   * every structural change does. The plugin has the stash open for the whole call, so this drives
   * the data hooks through an operation rather than opening the stash by hand.
   *
   * @param data The new source data.
   * @param parentRow Physical row index of the parent to add a child to.
   */
  async replaceDataWhileAddingChild(data: unknown[], parentRow: number): Promise<void> {
    await this.page.evaluate(({ rows, parent }) => {
      window.hot.addHook('beforeAddChild', () => {
        window.hot.updateData(rows as unknown[]);
      });

      const { dataManager } = window.hot.getPlugin('nestedRows');
      const parentObject = dataManager.getDataObject(parent as number);

      if (parentObject) {
        dataManager.addChild(parentObject);
      }
    }, { rows: data, parent: parentRow });
  }

  /** The visual row the selection highlight sits on, or `null` when nothing is selected. */
  async highlightedRow(): Promise<number | null> {
    return (await this.selectedCell())?.[0] ?? null;
  }

  /** Put the selection on one cell, by visual row/column. */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => window.hot.selectCell(r, c), [row, col]);
  }

  /**
   * The whole selected range as `[fromRow, fromCol, toRow, toCol]`, or `null` when nothing is
   * selected.
   *
   * {@link NestedRowsPage#selectedCell} reports only where the highlight sits, which cannot tell a
   * surviving whole-column selection from a single cell on the same row.
   */
  selectedRange(): Promise<number[] | null> {
    return this.page.evaluate(() => window.hot.getSelectedLast() ?? null);
  }

  /**
   * Add a child to the parent at the given visual row by calling the plugin's private
   * `dataManager.addChild()` directly. It is the method the "Insert child row" context-menu item ends
   * in, but this skips the menu and resolves the parent with `toPhysicalRow()` rather than the menu's
   * `translateTrimmedRow()`. It expands every parent for its own length (`collapsedRowsStash`) and
   * re-collapses afterwards.
   */
  async addChildTo(parentRow: number): Promise<void> {
    await this.page.evaluate((row) => {
      const plugin = window.hot.getPlugin('nestedRows');

      plugin.dataManager.addChild(plugin.dataManager.getDataObject(window.hot.toPhysicalRow(row)));
    }, parentRow);
  }

  /** Scroll the grid so the given visual row is at the top. */
  async scrollToRow(row: number): Promise<void> {
    await this.page.evaluate(r => window.hot.scrollViewportTo({ row: r, verticalSnap: 'top' }), row);
  }

  /** The first visual row the viewport renders fully, which moves only when the grid scrolls. */
  firstVisibleRow(): Promise<number> {
    return this.page.evaluate(() => window.hot.getFirstFullyVisibleRow());
  }

  /**
   * Remove rows through `alter()`, by visual row. With a parent collapsed, the plugin expands every
   * parent for the length of the removal (`collapsedRowsStash`) and re-collapses afterwards.
   */
  async removeRow(row: number, amount = 1): Promise<void> {
    await this.page.evaluate(([r, n]) => window.hot.alter('remove_row', r, n), [row, amount]);
  }

  /**
   * Remove a row and push settings in the SAME task, so `updateSettings()` lands while the removal's
   * collapse stash is still open - the plugin re-collapses the stashed parents a tick later. A React
   * parent re-rendering right after a removal produces exactly this.
   */
  async removeRowThenUpdateSettings(row: number, settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(([r, config]) => {
      window.hot.alter('remove_row', r as number, 1);
      window.hot.updateSettings(config as Record<string, unknown>);
    }, [row, settings] as [number, Record<string, unknown>]);
  }

  /** Push settings through `updateSettings()`, which rebuilds the plugin and replays its state. */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(config => window.hot.updateSettings(config), settings);
  }

  /**
   * The selected cell as `[row, column]` in VISUAL coordinates, or `null` when nothing is selected.
   *
   * Reported as a pair rather than through {@link NestedRowsPage#highlightedRow} alone, because a
   * selection that moves to a parent row must keep the column the user was on.
   */
  selectedCell(): Promise<[number, number] | null> {
    return this.page.evaluate(() => {
      const last = window.hot.getSelectedLast();

      return last ? [last[0], last[1]] as [number, number] : null;
    });
  }

  /**
   * Whether DOM focus is still somewhere inside the grid.
   *
   * Assert this only AFTER a key press. The collapse/expand button is not focusable, so a real
   * pointer press on it leaves `document.activeElement` on `<body>` even on a grid that is working
   * perfectly - reading it straight after a click measures that, not the grid's state. Handsontable
   * listens for keys on the document, so the first key press moves the selection and pulls focus
   * back into the grid; that is the point at which this is worth checking.
   */
  focusInsideGrid(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.rootElement.contains(document.activeElement));
  }

  /** Every collapse/expand hook call the fixture has recorded, in order. */
  hookLog(): Promise<NestedRowsHookCall[]> {
    return this.page.evaluate(() => window.hookLog);
  }

  /** Just the names of the recorded hook calls, in firing order. */
  async hookNames(): Promise<string[]> {
    return (await this.hookLog()).map(call => call.name);
  }

  /** Clear the recorded hooks, so an assertion only sees the action under test. */
  async resetHookLog(): Promise<void> {
    await this.page.evaluate(() => {
      window.hookLog.length = 0;
    });
  }

  /**
   * The master hider's height against the height of the table inside it.
   *
   * The hider is the element that gives the grid its scroll range, so it must never be shorter than
   * the table it holds - a short hider clips the last rows and the scrollbar stops early.
   */
  async masterHiderVsTable(): Promise<{ hiderHeight: number; tableHeight: number }> {
    return this.page.evaluate(() => {
      const master = document.querySelector('.ht_master') as HTMLElement;

      return {
        hiderHeight: (master.querySelector('.wtHider') as HTMLElement).offsetHeight,
        tableHeight: (master.querySelector('table.htCore') as HTMLElement).offsetHeight,
      };
    });
  }

  /**
   * Call one of the plugin's public methods in the page and return its result.
   *
   * Kept generic so the spec reads as the API call it is making, rather than growing one
   * wrapper method per plugin method.
   */
  callPlugin(method: string, ...args: unknown[]): Promise<unknown> {
    return this.page.evaluate(
      ({ method: name, args: methodArgs }) => {
        const plugin = window.hot.getPlugin('nestedRows') as unknown as Record<string, (...a: unknown[]) => unknown>;

        return plugin[name](...methodArgs);
      },
      { method, args }
    );
  }
}
