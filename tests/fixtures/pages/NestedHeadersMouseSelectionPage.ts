import { type Locator, type Page, expect } from '@playwright/test';
import { assertKnownBundle, awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

export type NestedHeaderCell = string | { label: string, colspan?: number, rowspan?: number };

export type HeaderSelection = {
  selected: number[][] | null,
  highlight: { row: number, col: number } | null,
};

type SortConfig = { column: number, sortOrder: string };

type GridSettings = {
  nestedHeaders: NestedHeaderCell[][],
  navigableHeaders?: boolean,
  multiColumnSorting?: boolean,
};

type ClickModifier = 'ControlOrMeta';

type HotSelection = {
  getSelected(): number[][] | undefined,
  getSelectedRangeLast(): { highlight: { row: number | null, col: number | null } } | undefined,
  getPlugin(name: string): { getSortConfig(): SortConfig[] },
  addHook(name: string, callback: (...args: unknown[]) => void, orderIndex?: number): void,
};

type FixtureWindow = Window & {
  hot: HotSelection,
  buildGrid(settings: Record<string, unknown>): HotSelection | null,
  htBuildError?: string,
};

/**
 * Header clicks go through the label in `.ht_clone_top`. That label is the sortable control, and
 * the copy painted over the master header.
 */
export class NestedHeadersMouseSelectionPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle: Bundle | string = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  async goto(): Promise<void> {
    assertKnownBundle(this.bundle, 'constructor(page, theme, bundle)');
    await this.page.goto(
      `/tests/fixtures/demo/nested-headers-mouse-selection.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.header(0, 0)).toBeVisible();
  }

  /**
   * Rebuilds the grid. Each test starts from its own headers and plugins.
   */
  async configure(settings: GridSettings): Promise<void> {
    const buildError = await this.page.evaluate((next) => {
      const fixture = window as unknown as FixtureWindow;

      fixture.buildGrid(next);

      return fixture.htBuildError ?? null;
    }, settings);

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await expect(this.header(0, 0)).toBeVisible();
  }

  /**
   * From `afterOnCellMouseUp`, move the focus to the first cell of the clicked header.
   */
  async selectCellOnHeaderMouseUp(): Promise<void> {
    await this.page.evaluate(() => {
      const fixture = window as unknown as FixtureWindow;

      fixture.hot.addHook('afterOnCellMouseUp', (...args: unknown[]) => {
        const coords = args[1] as { row: number, col: number };
        const hot = fixture.hot as unknown as { selectCell(row: number, col: number): void };

        if (coords.row < 0) {
          hot.selectCell(0, coords.col);
        }
      });
    });
  }

  /**
   * `orderIndex` -1 runs before nested headers, which registers `afterOnCellMouseDown` at the
   * default index. A settings callback is registered after plugins, so it would select the cell
   * after the header and replace it.
   */
  async selectCellBeforeHeaderSelection(): Promise<void> {
    await this.page.evaluate(() => {
      const fixture = window as unknown as FixtureWindow;

      fixture.hot.addHook('afterOnCellMouseDown', function (
        this: { deselectCell(): void, selectCell(row: number, col: number): void },
        ...args: unknown[]
      ) {
        const event = args[0] as MouseEvent;
        const coords = args[1] as { row: number, col: number };

        if (coords.row < 0 && (event.ctrlKey || event.metaKey)) {
          this.deselectCell();
          this.selectCell(0, coords.col);
        }
      }, -1);
    });
  }

  /**
   * `column` is the visual column the cell starts on. A group cell is anchored there.
   */
  header(level: number, column: number): Locator {
    return this.page.locator('.ht_clone_top').getByTestId(`col-header-${level}-${column}`);
  }

  cell(row: number, column: number): Locator {
    return this.page.locator('.ht_master tbody tr').nth(row).locator('td').nth(column);
  }

  /**
   * Clicks `.colHeader`. That is the sort target, and on a wide group the click lands on the
   * header's first column.
   */
  async clickHeader(level: number, column: number, modifiers: ClickModifier[] = []): Promise<void> {
    const label = this.header(level, column).locator('.colHeader');

    await expect(label).toBeVisible();
    await label.click({ modifiers });
  }

  async dragCellToHeader(
    cellRow: number,
    cellColumn: number,
    headerLevel: number,
    headerColumn: number,
  ): Promise<void> {
    await this.cell(cellRow, cellColumn).hover();
    await this.page.mouse.down();
    await this.header(headerLevel, headerColumn).hover();
    await this.page.mouse.up();
  }

  /**
   * Releases outside the grid, where no cell mouseup runs.
   */
  async pressHeaderAndReleaseOutside(level: number, column: number): Promise<void> {
    await this.header(level, column).hover();
    await this.page.mouse.down();
    await this.page.mouse.move(2, 2);
    await this.page.mouse.up();
  }

  async selection(): Promise<HeaderSelection> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as FixtureWindow).hot;
      const highlight = hot.getSelectedRangeLast()?.highlight;

      return {
        selected: hot.getSelected() ?? null,
        highlight: highlight && highlight.row !== null && highlight.col !== null ?
          { row: highlight.row, col: highlight.col } :
          null,
      };
    });
  }

  /**
   * `getSortConfig()` lists columns in the order they were added.
   */
  async sortConfig(): Promise<SortConfig[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot
      .getPlugin('multiColumnSorting')
      .getSortConfig());
  }
}
