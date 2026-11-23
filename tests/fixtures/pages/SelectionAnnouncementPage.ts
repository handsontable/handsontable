import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, assertKnownBundle, type Bundle } from '../bundle';

/**
 * A range the grid reports, `[fromRow, fromCol, toRow, toCol]`.
 */
type SelectedRange = [number, number, number, number];

/**
 * The part of the fixture window this page object reads.
 */
interface FixtureWindow {
  announcementLog: string[];
  hot: {
    getSelected(): SelectedRange[] | undefined;
    selectCell(row: number, col: number, endRow?: number, endCol?: number): boolean;
    selectAll(): void;
    getPlugin(name: string): { menu?: { hotMenu?: { getSelectedRangeLast(): { highlight: { row: number } } | undefined } } };
  };
  companion: {
    getPlugin(name: 'pagination'): { setPage(page: number): void };
  };
}

/**
 * Options the fixture reads from its query string.
 */
type GotoOptions = {
  aria?: 'on' | 'off';
  headers?: 'default' | 'custom';
  plugin?: 'none' | 'columnSorting' | 'contextMenu' | 'nestedRows';
  data?: 'grid' | 'empty';
  companion?: 'none' | 'pagination';
};

/**
 * Page Object for the selection-announcement fixture: a 10 x 6 grid with row and column headers,
 * built with `ariaTags` on or off, with default or custom column labels, and with ColumnSorting or
 * ContextMenu on.
 *
 * Time is frozen with {@link SelectionAnnouncementPage#freezeTime}, so a spec decides when the
 * announcement's debounce and the announcer's write may run, and can tell "one announcement" from
 * "none yet".
 */
export class SelectionAnnouncementPage {
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
   * Navigate to the fixture and wait for the grid to render.
   *
   * @param {GotoOptions} options The fixture's query options.
   */
  async goto(options: GotoOptions = {}): Promise<void> {
    const aria = options.aria ?? 'on';
    const headers = options.headers ?? 'default';
    const plugin = options.plugin ?? 'none';
    const data = options.data ?? 'grid';
    const companion = options.companion ?? 'none';

    await this.page.goto(
      `/tests/fixtures/demo/selection-announcement.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&aria=${aria}&headers=${headers}&plugin=${plugin}&data=${data}&companion=${companion}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(data === 'empty' ? this.columnHeader(0) : this.cell(0, 0)).toBeVisible();

    if (companion !== 'none') {
      await expect(this.page.getByTestId('companion').locator('.ht_master td').first()).toBeVisible();
    }

    await expect(this.politeAnnouncer()).toHaveCount(1);
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
   * The corner header, which selects the whole grid.
   *
   * @returns {Locator}
   */
  corner(): Locator {
    return this.page.locator('.ht_clone_top_inline_start_corner thead th').first();
  }

  /**
   * The polite live region the selection is announced through.
   *
   * @returns {Locator}
   */
  politeAnnouncer(): Locator {
    return this.page.locator('[role="status"][aria-live="polite"]');
  }

  /**
   * The assertive live region, which announcements that do not wait for the screen reader go through.
   *
   * @returns {Locator}
   */
  assertiveAnnouncer(): Locator {
    return this.page.locator('[role="status"][aria-live="assertive"]');
  }

  /**
   * A focusable button outside the grid.
   *
   * @returns {Locator}
   */
  outside(): Locator {
    return this.page.getByTestId('outside');
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
   * Installs a fake clock and pauses it, so no timer runs until {@link SelectionAnnouncementPage#advance}.
   */
  async freezeTime(): Promise<void> {
    await this.page.clock.install();
    await this.page.clock.pauseAt(Date.now() + 5000);
  }

  /**
   * Runs the frozen clock forward, firing every timer due in that span.
   *
   * @param {number} ms Milliseconds to advance.
   */
  async advance(ms: number): Promise<void> {
    await this.page.clock.runFor(ms);
  }

  /**
   * Start recording every message written to the polite live region, so a spec can tell an
   * announcement that never happened from one that a later one overwrote.
   */
  async recordAnnouncements(): Promise<void> {
    await this.page.evaluate(() => {
      const region = document.querySelector('[role="status"][aria-live="polite"]') as HTMLElement;
      const log: string[] = [];

      (window as unknown as FixtureWindow).announcementLog = log;
      new MutationObserver(() => {
        if (region.textContent) {
          log.push(region.textContent);
        }
      }).observe(region, { childList: true, characterData: true, subtree: true });
    });
  }

  /**
   * Every message written to the polite live region since {@link SelectionAnnouncementPage#recordAnnouncements}.
   *
   * @returns {Promise<string[]>}
   */
  announcements(): Promise<string[]> {
    return this.page.evaluate(() => [...(window as unknown as FixtureWindow).announcementLog]);
  }

  /**
   * The selection the grid reports.
   *
   * @returns {Promise<SelectedRange[]>}
   */
  selected(): Promise<SelectedRange[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected() ?? []);
  }

  /**
   * Presses a cell and moves the pointer onto another one, holding the button down.
   *
   * @param {Locator} from The cell pressed.
   * @param {Locator} to The cell the pointer ends on.
   */
  async pressAndDrag(from: Locator, to: Locator): Promise<void> {
    await from.hover();
    await this.page.mouse.down();
    await to.hover();
    await to.hover();
  }

  /**
   * Releases the mouse button.
   */
  async release(): Promise<void> {
    await this.page.mouse.up();
  }

  /**
   * Drags from one cell to another and releases, with the real mouse.
   *
   * @param {Locator} from The cell pressed.
   * @param {Locator} to The cell released over.
   */
  async drag(from: Locator, to: Locator): Promise<void> {
    await this.pressAndDrag(from, to);
    await this.release();
  }

  /**
   * Drags from one cell to another with Ctrl (Cmd on macOS) held, which adds a selection layer.
   *
   * @param {Locator} from The cell pressed.
   * @param {Locator} to The cell released over.
   */
  async dragAddingLayer(from: Locator, to: Locator): Promise<void> {
    await this.page.keyboard.down('ControlOrMeta');
    await this.drag(from, to);
    await this.page.keyboard.up('ControlOrMeta');
  }

  /**
   * Selects through the public API, which must stay silent.
   *
   * @param {'cells' | 'all'} kind `cells` selects B2:D4, `all` calls `selectAll()`.
   */
  async selectThroughApi(kind: 'cells' | 'all'): Promise<void> {
    await this.page.evaluate((what) => {
      const { hot } = window as unknown as FixtureWindow;

      if (what === 'all') {
        hot.selectAll();
      } else {
        hot.selectCell(1, 1, 3, 3);
      }
    }, kind);
  }

  /**
   * Moves the companion grid to another page through the Pagination API, which announces the page
   * without any selection change in the grid under test.
   *
   * @param {number} pageNumber The page to show.
   */
  async turnCompanionPage(pageNumber: number): Promise<void> {
    await this.page.evaluate((target) => {
      (window as unknown as FixtureWindow).companion.getPlugin('pagination').setPage(target);
    }, pageNumber);
  }

  /**
   * The row the open context menu highlights, or `null` when it highlights none.
   *
   * @returns {Promise<number | null>}
   */
  contextMenuHighlightedRow(): Promise<number | null> {
    return this.page.evaluate(() => {
      const range = (window as unknown as FixtureWindow).hot.getPlugin('contextMenu').menu?.hotMenu?.getSelectedRangeLast();

      return range ? range.highlight.row : null;
    });
  }
}
