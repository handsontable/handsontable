import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/**
 * Page Object for the collapsible-columns keyboard and announcement fixture.
 *
 * Column headers are painted in the top overlay (`.ht_clone_top`) and again in the master table, so
 * every header locator is scoped to the overlay, which is the copy a user sees and presses.
 */
export class CollapsibleColumnsA11yPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;
  readonly pageErrors: string[] = [];

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    page.on('pageerror', (error) => { this.pageErrors.push(error.message); });
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   *
   * @param options.aria `off` builds the grid with `ariaTags: false`.
   * @param options.navigableHeaders `on` lets the headers take the focus.
   * @param options.nestedRows `on` loads a two-level tree and enables the NestedRows plugin.
   */
  async goto(
    options: { aria?: 'on' | 'off'; navigableHeaders?: 'on' | 'off'; nestedRows?: 'on' | 'off' } = {}
  ): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}&aria=${options.aria ?? 'on'}` +
      `&navigableHeaders=${options.navigableHeaders ?? 'off'}&nestedRows=${options.nestedRows ?? 'off'}`;

    await this.page.goto(`/tests/fixtures/demo/collapsible-columns-a11y.html?${query}`);
    await awaitBundle(this.page);

    const buildError = await this.page.evaluate(
      () => (window as unknown as { htBuildError?: string }).htBuildError ?? null
    );

    if (buildError) {
      throw new Error(`The fixture grid failed to build: ${buildError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell, by visual row and column, via its stable test id.
   *
   * @param row Visual row index.
   * @param column Visual column index.
   */
  cell(row: number, column: number): Locator {
    return this.page.getByTestId(`cell-${row}-${column}`);
  }

  /**
   * The header cell that shows the given label, in the top overlay.
   *
   * @param label The header's label.
   */
  header(label: string): Locator {
    return this.page.locator('.ht_clone_top thead th').filter({
      has: this.page.locator('span.colHeader').getByText(label, { exact: true }),
    });
  }

  /**
   * The collapse/expand indicator inside the header that shows the given label.
   *
   * @param label The header's label.
   */
  indicator(label: string): Locator {
    return this.header(label).locator('.collapsibleIndicator');
  }

  /**
   * Put the selection on a data cell the way a user does, with a press on it.
   *
   * @param row Visual row index.
   * @param column Visual column index.
   */
  async clickCell(row: number, column: number): Promise<void> {
    await this.cell(row, column).click();
    await expect.poll(() => this.selectedCell()).toEqual([row, column]);
  }

  /**
   * Move the focus from a data cell of the first row up into the column headers with the keyboard.
   * The grid must be built with `navigableHeaders: 'on'`.
   *
   * @param column Visual column index.
   * @param headerRow The header row to stop on: `-1` is the row closest to the data.
   */
  async focusHeader(column: number, headerRow: number): Promise<void> {
    await this.clickCell(0, column);

    for (let row = -1; row >= headerRow; row--) {
      await this.page.keyboard.press('ArrowUp');
      await expect.poll(() => this.selectedCell()).toEqual([row, column]);
    }
  }

  /**
   * Where the active highlight sits, as `[row, column]`, or `null` when nothing is selected.
   */
  selectedCell(): Promise<[number, number] | null> {
    return this.page.evaluate(() => {
      const highlight = window.hot.getSelectedRangeActive()?.highlight;

      return highlight ? [highlight.row, highlight.col] as [number, number] : null;
    });
  }

  /**
   * Select two separate cells through the API, the way Ctrl/Cmd+click does.
   */
  async selectTwoRanges(): Promise<void> {
    await this.page.evaluate(() => window.hot.selectCells([[0, 1, 0, 1], [1, 3, 1, 3]]));
    await expect.poll(() => this.page.evaluate(() => window.hot.getSelectedRange()?.length)).toBe(2);
  }

  /**
   * The visual indexes of the columns the grid hides right now, ascending.
   */
  hiddenColumns(): Promise<number[]> {
    return this.page.evaluate(() => {
      const hidden: number[] = [];

      for (let column = 0; column < window.hot.countCols(); column++) {
        if (window.hot.columnIndexMapper.isHidden(window.hot.toPhysicalColumn(column))) {
          hidden.push(column);
        }
      }

      return hidden;
    });
  }

  /**
   * Collapse or expand a header group through the plugin's public API.
   *
   * @param method The public method to call.
   * @param row The header row of the group, a negative index.
   * @param column A visual column the group spans.
   */
  async callSection(method: 'collapseSection' | 'expandSection', row: number, column: number): Promise<void> {
    await this.page.evaluate(
      ({ name, coords }) => window.hot.getPlugin('collapsibleColumns')[name](coords),
      { name: method, coords: { row, col: column } }
    );
  }

  /**
   * Make the grid refuse every collapse, the way an application's `beforeColumnCollapse` listener
   * that returns `false` does, or let collapses through again.
   *
   * @param vetoed Whether a collapse is refused.
   */
  async setCollapsesVetoed(vetoed: boolean): Promise<void> {
    await this.page.evaluate((isVetoed) => {
      const scope = window as unknown as { htCollapseVeto?: () => boolean };

      if (scope.htCollapseVeto) {
        window.hot.removeHook('beforeColumnCollapse', scope.htCollapseVeto);
        scope.htCollapseVeto = undefined;
      }

      if (isVetoed) {
        scope.htCollapseVeto = () => false;
        window.hot.addHook('beforeColumnCollapse', scope.htCollapseVeto);
      }
    }, vetoed);
  }

  /**
   * The text of the first column, top to bottom.
   */
  firstColumn(): Promise<string[]> {
    return this.page.evaluate(() => window.hot.getDataAtCol(0).map(String));
  }

  /**
   * The polite live region the plugins announce through.
   */
  politeAnnouncer(): Locator {
    return this.page.locator('[role="status"][aria-live="polite"]');
  }

  /**
   * Start recording every message written to the polite live region, so a spec can tell an
   * announcement that never happened from one a later one replaced.
   */
  async recordAnnouncements(): Promise<void> {
    await this.page.evaluate(() => {
      const region = document.querySelector('[role="status"][aria-live="polite"]') as HTMLElement;
      const log: string[] = [];

      (window as unknown as { announcementLog: string[] }).announcementLog = log;
      new MutationObserver(() => {
        if (region.textContent) {
          log.push(region.textContent);
        }
      }).observe(region, { childList: true, characterData: true, subtree: true });
    });
  }

  /**
   * Every message written to the polite live region since
   * {@link CollapsibleColumnsA11yPage#recordAnnouncements}.
   */
  announcements(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { announcementLog: string[] }).announcementLog);
  }

  /**
   * Start recording, for every key press that reaches the page, whether the grid claimed it by
   * preventing the browser's default action.
   */
  async recordKeyClaims(): Promise<void> {
    await this.page.evaluate(() => {
      const claims: boolean[] = [];

      (window as unknown as { keyClaims: boolean[] }).keyClaims = claims;
      window.addEventListener('keydown', (event) => {
        if (!['Shift', 'Alt', 'Control', 'Meta'].includes(event.key)) {
          claims.push(event.defaultPrevented);
        }
      });
    });
  }

  /**
   * Whether the grid claimed each key pressed since {@link CollapsibleColumnsA11yPage#recordKeyClaims}.
   */
  keyClaims(): Promise<boolean[]> {
    return this.page.evaluate(() => (window as unknown as { keyClaims: boolean[] }).keyClaims);
  }

  /**
   * The dropdown menu the grid opens for a column.
   */
  dropdownMenu(): Locator {
    return this.page.locator('.htDropdownMenu:visible');
  }
}
