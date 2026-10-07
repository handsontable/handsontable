import { type Page, expect, type Locator } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { NestedRowsPage } from './NestedRowsPage';

/**
 * The treegrid attributes of one rendered row: `level`, `posinset` and `setsize` as read off its
 * `TR`, `expanded` off its row header. An attribute the row does not carry reads as `null`.
 */
export interface TreegridRowAttributes {
  level: string | null;
  posinset: string | null;
  setsize: string | null;
  expanded: string | null;
}

/**
 * Page Object for the nested-rows treegrid accessibility fixture.
 *
 * It extends {@link NestedRowsPage}, which already knows how to read and drive a nested grid, and
 * adds what only the treegrid behavior needs: the row attributes, the keyboard entry onto a row
 * header, the polite announcements, and a covering overlay.
 *
 * A row is painted in the master table and in the inline-start clone that carries the row headers,
 * so every attribute read walks both copies and reports a row only when they agree. A copy that
 * disagrees is a bug in itself, and the read says so instead of picking one.
 */
export class NestedRowsTreegridPage extends NestedRowsPage {
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    super(page, theme);
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   *
   * @param options.dir The layout direction of the page and the grid.
   * @param options.aria `off` builds the grid with `ariaTags: false`.
   */
  async goto(options: { dir?: 'ltr' | 'rtl'; aria?: 'on' | 'off' } = {}): Promise<void> {
    const dir = options.dir ?? 'ltr';
    const aria = options.aria ?? 'on';

    await this.page.goto(
      `/tests/fixtures/demo/nested-rows-treegrid.html?theme=${this.theme}&bundle=${this.bundle}&dir=${dir}&aria=${aria}`
    );
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * The treegrid attributes of every rendered row, top to bottom, read in one evaluation so a
   * re-render between two reads cannot mix two layouts. Throws when the master copy of a row and
   * its inline-start copy disagree, and when a row element carries `aria-expanded`, which belongs to
   * the row header.
   */
  rowAttributes(): Promise<TreegridRowAttributes[]> {
    return this.page.evaluate(() => {
      const read = (selector: string) => Array.from(document.querySelectorAll(`${selector} tbody tr`))
        .map((TR) => {
          if (TR.hasAttribute('aria-expanded')) {
            throw new Error('A row element carries aria-expanded, which belongs to its row header');
          }

          return {
            level: TR.getAttribute('aria-level'),
            posinset: TR.getAttribute('aria-posinset'),
            setsize: TR.getAttribute('aria-setsize'),
            expanded: TR.querySelector('th')?.getAttribute('aria-expanded') ?? null,
          };
        });
      const master = read('.ht_master');
      const clone = read('.ht_clone_inline_start');

      if (JSON.stringify(master) !== JSON.stringify(clone)) {
        throw new Error(`Row copies disagree: ${JSON.stringify({ master, clone })}`);
      }

      return master;
    });
  }

  /**
   * The position attributes of every visual row, keyed by the row's name, read in one evaluation.
   * Every row of the fixture is rendered, so the rendered rows and the visual rows line up.
   */
  async setPositionsByName(): Promise<Record<string, string>> {
    const [names, attributes] = await Promise.all([this.visibleNames(), this.rowAttributes()]);

    return Object.fromEntries(names.map((name, index) => [
      name,
      `${attributes[index].level}:${attributes[index].posinset}/${attributes[index].setsize}`,
    ]));
  }

  /**
   * How many rendered rows carry any of the treegrid row attributes, across every copy.
   */
  countRowsWithTreegridAttributes(): Promise<number> {
    return this.page.evaluate(() => document.querySelectorAll(
      '[data-testid="grid"] tbody tr:is([aria-level], [aria-posinset], [aria-setsize])'
    ).length);
  }

  /**
   * Put the focus on a row header the way a user does: click the first cell of the row, then step
   * into the header with the inline-start arrow.
   *
   * @param row Visual row index.
   */
  async focusRowHeader(row: number): Promise<void> {
    const isRtl = await this.page.evaluate(() => window.hot.isRtl());

    await this.cell(row, 0).click();
    await this.page.keyboard.press(isRtl ? 'ArrowRight' : 'ArrowLeft');
    await expect.poll(() => this.selectedCell()).toEqual([row, -1]);
  }

  /**
   * Select a row header through the API, by visual row index. For a row whose cells cannot be
   * clicked, such as one with every column hidden.
   *
   * @param row Visual row index.
   */
  async selectRowHeader(row: number): Promise<void> {
    await this.page.evaluate(visualRow => window.hot.selectCell(visualRow, -1), row);
    await expect.poll(() => this.selectedCell()).toEqual([row, -1]);
  }

  /**
   * The polite live region the plugin announces through.
   */
  politeAnnouncer(): Locator {
    return this.page.locator('[role="status"][aria-live="polite"]');
  }

  /**
   * Start recording every message written to the polite live region, so a spec can tell an
   * announcement that never happened from one that was overwritten by a later one.
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
   * Every message written to the polite live region since {@link NestedRowsTreegridPage#recordAnnouncements}.
   */
  announcements(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { announcementLog: string[] }).announcementLog);
  }

  /**
   * Cover the grid body the way an overlay plugin does, through a focus scope that declares
   * `coversGridBody`. The scope is registered once and only switched on and off afterwards; it never
   * takes the keyboard, so the grid keeps answering keys while it covers the body.
   *
   * @param covered Whether the body is covered.
   */
  async setGridBodyCovered(covered: boolean): Promise<void> {
    await this.page.evaluate((isCovered) => {
      const state = window as unknown as { treegridBodyCovered?: boolean };

      if (state.treegridBodyCovered === undefined) {
        const container = document.createElement('div');

        document.body.appendChild(container);
        window.hot.getFocusScopeManager().registerScope('treegrid-test-cover', container, {
          coversGridBody: true,
          runOnlyIf: () => state.treegridBodyCovered === true,
        });
      }

      state.treegridBodyCovered = isCovered;
    }, covered);
  }

  /**
   * Hide rows through the `HiddenRows` plugin, by visual index.
   *
   * @param rows Visual row indexes to hide.
   */
  async hideRows(rows: number[]): Promise<void> {
    await this.page.evaluate(indexes => window.hot.updateSettings({ hiddenRows: { rows: indexes } }), rows);
  }

  /**
   * Append a child to a parent row through the plugin's data manager, as the context menu's
   * "Insert child row" does.
   *
   * @param physicalRow Physical index of the parent row.
   * @param name The name of the new child.
   */
  async addChild(physicalRow: number, name: string): Promise<void> {
    await this.page.evaluate(({ row, childName }) => {
      const { dataManager } = window.hot.getPlugin('nestedRows');

      dataManager.addChild(dataManager.getDataObject(row), { name: childName });
    }, { row: physicalRow, childName: name });
  }

  /**
   * Detach a child from its parent through the plugin's data manager, as the context menu's
   * "Detach from parent" does.
   *
   * @param physicalRow Physical index of the child row.
   */
  async detachFromParent(physicalRow: number): Promise<void> {
    await this.page.evaluate((row) => {
      const { dataManager } = window.hot.getPlugin('nestedRows');

      dataManager.detachFromParent(dataManager.getDataObject(row));
    }, physicalRow);
  }
}
