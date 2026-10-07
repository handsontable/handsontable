import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

type HotLike = {
  getPlugin: (name: string) => { getCollapsedColumns: () => number[] };
  view: { getFirstFullyVisibleRow: () => number };
};

type WindowWithHots = Window & { hots: Record<string, HotLike> };

/**
 * Whether a header control is really there for the user: the point at its center hits the control
 * itself (nothing paints over it), and its box lies inside its header cell (nothing clips it).
 */
export type ControlVisibility = { hitAtCenter: boolean, insideHeader: boolean };

/**
 * Page Object for the NestedHeaders rowspan fixture (header cells that span header levels).
 *
 * Header cells are rendered twice: in the master table and in the top overlay, which paints the
 * copy the user sees over the master one. Every header locator here is scoped to `.ht_clone_top`,
 * because a check against the master copy measures an element nobody can see or click. That was
 * how the legacy Jasmine version of these checks failed, with the grid rendering fine.
 */
export class NestedHeadersRowspanPage {
  /** Three header levels, every header control a rowspan header can hold. */
  static readonly MENUS = 'menus-grid';
  /** Two header levels, 50 rows in a 180px-tall grid, so the body scrolls under the headers. */
  static readonly SCROLL = 'scroll-grid';

  static readonly ALL_GRIDS = [NestedHeadersRowspanPage.MENUS, NestedHeadersRowspanPage.SCROLL];

  static readonly ACTIVE_HEADER_CLASS = 'ht__active_highlight';

  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /** Navigate and wait for every grid to have rendered its header overlay. */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/nested-headers-rowspan.html?theme=${this.theme}&bundle=${this.bundle}`);

    await awaitBundle(this.page);

    for (const gridId of NestedHeadersRowspanPage.ALL_GRIDS) {
      const initError = await this.page.getByTestId(gridId).getAttribute('data-init-error');

      if (initError !== null) {
        throw new Error(`Grid "${gridId}" failed to build: ${initError}`);
      }
    }

    await expect(this.header(NestedHeadersRowspanPage.MENUS, 1, 3)).toBeVisible();
    await expect(this.header(NestedHeadersRowspanPage.SCROLL, 0, 0)).toBeVisible();
  }

  /**
   * The visible copy of a column header. `level` counts from the top (0 is the topmost level) and
   * `column` is the visual index of the header's first column.
   */
  header(gridId: string, level: number, column: number): Locator {
    return this.page.getByTestId(gridId).locator('.ht_clone_top').getByTestId(`col-header-${level}-${column}`);
  }

  /** The header's label text element. */
  label(gridId: string, level: number, column: number): Locator {
    return this.header(gridId, level, column).locator('.colHeader');
  }

  /** The header's collapse/expand button (CollapsibleColumns). */
  collapseButton(gridId: string, level: number, column: number): Locator {
    return this.header(gridId, level, column).locator('.collapsibleIndicator');
  }

  /** The header's dropdown menu button (DropdownMenu). */
  dropdownButton(gridId: string, level: number, column: number): Locator {
    return this.header(gridId, level, column).locator('.changeType');
  }

  /** Measure one header control in a single evaluation. */
  async controlVisibility(control: Locator): Promise<ControlVisibility> {
    return control.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const header = element.closest('th')!.getBoundingClientRect();
      const hit = element.ownerDocument.elementFromPoint(box.x + (box.width / 2), box.y + (box.height / 2));

      return {
        hitAtCenter: hit !== null && (hit === element || element.contains(hit)),
        insideHeader: box.left >= header.left && box.right <= header.right
          && box.top >= header.top && box.bottom <= header.bottom,
      };
    });
  }

  /** The viewport `bottom` of each header's label, read in one evaluation. */
  async labelBottoms(gridId: string, headers: Array<[number, number]>): Promise<number[]> {
    return this.page.getByTestId(gridId).locator('.ht_clone_top').evaluate((clone, ids) => ids.map((id) => {
      const label = clone.querySelector(`[data-testid="${id}"] .colHeader`);

      return label ? label.getBoundingClientRect().bottom : Number.NaN;
    }), headers.map(([level, column]) => `col-header-${level}-${column}`));
  }

  /** The computed `border-bottom-width` of each header, in pixels, read in one evaluation. */
  async bottomBorderWidths(gridId: string, headers: Array<[number, number]>): Promise<number[]> {
    return this.page.getByTestId(gridId).locator('.ht_clone_top').evaluate((clone, ids) => ids.map((id) => {
      const header = clone.querySelector(`[data-testid="${id}"]`);

      return header ? parseFloat(getComputedStyle(header).borderBottomWidth) : Number.NaN;
    }), headers.map(([level, column]) => `col-header-${level}-${column}`));
  }

  /** The physical indexes of the collapsed columns. */
  async collapsedColumns(gridId: string): Promise<number[]> {
    return this.page.evaluate(id => (window as unknown as WindowWithHots).hots[id]
      .getPlugin('collapsibleColumns').getCollapsedColumns(), gridId);
  }

  /** The first fully visible body row, a render-state probe for a finished scroll. */
  async firstFullyVisibleRow(gridId: string): Promise<number> {
    return this.page.evaluate(id => (window as unknown as WindowWithHots).hots[id].view.getFirstFullyVisibleRow(),
      gridId);
  }

  /** Scroll a grid's body down with the mouse wheel, the way a user does, and wait for the draw. */
  async wheelBodyDown(gridId: string, deltaY: number): Promise<void> {
    const holder = await this.page.getByTestId(gridId).locator('.ht_master .wtHolder').boundingBox();

    if (!holder) {
      throw new Error(`The body of "${gridId}" is not rendered`);
    }

    await this.page.mouse.move(holder.x + (holder.width / 2), holder.y + (holder.height * 0.75));
    await this.page.mouse.wheel(0, deltaY);
    await expect.poll(() => this.firstFullyVisibleRow(gridId)).toBeGreaterThan(0);
  }
}
