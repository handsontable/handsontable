import { type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * What the page object reads of one grid: the width AutoColumnSize settled on for each column and
 * the rendered height of the first body row, taken in ONE round trip so the two cannot straddle a
 * re-render.
 */
export interface GridMeasure {
  widths: number[];
  rowHeight: number;
}

interface FixtureHot {
  countCols(): number;
  getColWidth(column: number): number;
  getCell(row: number, column: number): HTMLElement | null;
  render(): void;
  rootElement: HTMLElement;
}

interface FixtureWindow extends Window {
  hot: FixtureHot;
  narrowHot: FixtureHot;
}

export type GridName = 'hot' | 'narrowHot';

/**
 * Page Object for the fixture with two auto-sized grids: one in a box the spec collapses to 0px
 * and restores, one in a box narrower than its only long text. Neither sets `colWidths`, so
 * AutoColumnSize measures both.
 */
export class AutoColumnSizeCollapsedRootPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /** Opens the fixture and waits for both grids to be built and the first grid to have rendered. */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/auto-column-size-collapsed-root.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.getByTestId('grid').locator('.ht_master td').first()).toBeVisible();
    await expect(this.page.getByTestId('narrow-grid').locator('.ht_master td').first()).toBeVisible();
  }

  /** The measured column widths and first body row height of a grid. */
  async measure(name: GridName = 'hot'): Promise<GridMeasure> {
    return this.page.evaluate(gridName => {
      const hot = (window as unknown as FixtureWindow)[gridName];
      const widths = Array.from({ length: hot.countCols() }, (_, column) => hot.getColWidth(column));
      const rowHeight = hot.getCell(0, 0)?.getBoundingClientRect().height ?? 0;

      return { widths, rowHeight };
    }, name);
  }

  /** The width of the grid's root element, as the grid itself would read it. */
  async rootWidth(name: GridName = 'hot'): Promise<number> {
    return this.page.evaluate(
      gridName => (window as unknown as FixtureWindow)[gridName].rootElement.clientWidth,
      name
    );
  }

  /** Sets the width of the box that holds the first grid. The grid's ResizeObserver reacts to it. */
  async setBoxWidth(width: number): Promise<void> {
    await this.page.getByTestId('box').evaluate((box, value) => {
      box.style.width = `${value}px`;
    }, width);
  }

  /**
   * A full render, the way an application's `render()` call or a structural change makes one.
   * It re-measures every rendered column and overwrites the cached width, which is the step that
   * stores a wrapped width while the root is collapsed.
   */
  async render(name: GridName = 'hot'): Promise<void> {
    await this.page.evaluate(gridName => (window as unknown as FixtureWindow)[gridName].render(), name);
  }
}
