import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The slice of the grid API this page reads in the browser. Declared locally, the way the other
 * page objects do it (see `EmptyValuePage.ts`), rather than augmenting `Window` again —
 * `windowTypes.ts` already augments it with `hot: FixtureHotInstance`, and a second augmentation of
 * the same property with a different type is a TS2717 error.
 */
interface StretchFixtureHot {
  rootElement: HTMLElement;
  countCols(): number;
  getColWidth(col: number): number;
  render(): void;
  view: {
    hasVerticalScroll(): boolean;
    hasHorizontalScroll(): boolean;
    isHorizontallyScrollableByWindow(): boolean;
  };
}

/**
 * The geometry the DEV-2902 assertions compare, all read in one `evaluate` so the numbers come from
 * the same layout.
 */
export interface StretchGeometry {
  /** The wrapper's rendered width — what the grid is expected to fill. */
  containerWidth: number;
  /** `.ht_master .wtHider` inline width — the width the engine believes the columns sum to. */
  hiderWidth: number;
  /** `.ht_clone_top` root inline width — the box the column headers are clipped to. */
  topCloneRootWidth: number;
  /** Sum of the master table's first-row cell widths. */
  bodyWidth: number;
  /** How far the LAST header cell's right edge overflows the top clone root. Positive = clipped. */
  lastHeaderOverflow: number;
  /** Pixels a real scrollbar takes out of the master scroll box, per axis. */
  scrollbar: { vertical: number; horizontal: number };
  /** Sum of `hot.getColWidth()` over every column — the plugin's own answer. */
  apiColumnWidthSum: number;
  /** The grid root's rendered width — in window mode the box the columns must fill, not the document. */
  rootWidth: number;
}

/**
 * Page Object for the stretch-columns-container-resize fixture (DEV-2902): a `stretchH` grid inside a
 * wrapper the spec resizes, the way a responsive page resizes a grid without touching its settings.
 */
export class StretchColumnsContainerResizePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate and wait for the first render (a real DOM condition, no sleep).
   *
   * @param options.stretchH The strategy under test.
   * @param options.height `auto` (the reported shape), a pixel height, or `none` to leave `height`
   *                       out so the window owns both scroll axes (the wrapper turns fluid).
   * @param options.autoColumnSize `true` runs the library default; `false` (the default here) keeps
   *                               the invalidation counts this plugin's alone.
   */
  async goto(options: {
    stretchH?: 'all' | 'last' | 'none';
    height?: 'auto' | 'none' | number;
    autoColumnSize?: boolean;
  } = {}): Promise<void> {
    const stretchH = options.stretchH ?? 'all';
    const height = options.height ?? 'auto';
    const autoColumnSize = options.autoColumnSize ? 'on' : 'off';

    await this.page.goto(
      `/tests/fixtures/demo/stretch-columns-container-resize.html` +
      `?theme=${this.theme}&bundle=${this.bundle}&stretchH=${stretchH}&height=${height}` +
      `&autoColumnSize=${autoColumnSize}`
    );
    // The `document.write`-injected bundle and the block that builds the grid are separate scripts;
    // wait for the bundle itself before touching anything the fixture rendered.
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
    await expect(this.headerCell(3)).toBeVisible();
  }

  /**
   * A data cell in the master table.
   */
  cell(row: number, col: number): Locator {
    return this.grid.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A column header cell in the top clone (the element a user sees as the header).
   */
  headerCell(col: number): Locator {
    return this.grid.locator('.ht_clone_top thead tr').first().locator('th').nth(col);
  }

  /**
   * Resizes the wrapper and waits until the engine has re-rendered against the new width.
   *
   * `'hider'` (the default) waits for the master hider to reach the new width: the hider is the
   * element the engine writes the summed column widths to, so it arriving there IS the render having
   * happened. `'render'` waits for the `afterRender` the resize schedules instead — for a width at
   * which the hider does not follow the container (stretching switched off), where waiting on the
   * wrapper's CSS width alone would read the state before the rAF-scheduled `refreshDimensions()`.
   */
  async setContainerWidth(px: number, waitFor: 'hider' | 'render' = 'hider'): Promise<void> {
    const rendersBefore = await this.renderCount();

    await this.page.evaluate(width => window.htSetContainerWidth(width), px);

    await expect.poll(async() => (await this.geometry()).containerWidth, {
      message: `wrapper reaches ${px}px`,
    }).toBe(px);

    if (waitFor === 'hider') {
      await expect.poll(async() => (await this.geometry()).hiderWidth, {
        message: `master hider follows the container to ${px}px`,
      }).toBe(px);
    } else {
      await expect.poll(() => this.renderCount(), {
        message: 'the resize-driven render ran',
      }).toBeGreaterThan(rendersBefore);
    }
  }

  /**
   * Resizes the browser viewport (window mode: the window is the scroller, so this is the resize
   * the grid reacts to) and waits for the render it schedules.
   */
  async resizeViewport(width: number, height: number): Promise<void> {
    const rendersBefore = await this.renderCount();

    await this.page.setViewportSize({ width, height });

    await expect.poll(() => this.renderCount(), {
      message: 'the viewport-resize render ran',
    }).toBeGreaterThan(rendersBefore);
  }

  /**
   * How many full renders the grid has done since load (the fixture's `afterRender` counter).
   */
  async renderCount(): Promise<number> {
    return this.page.evaluate(() => window.htRenderCount());
  }

  /**
   * The fixture's count of engine column-width cache drops since load.
   */
  async invalidationCount(): Promise<number> {
    return this.page.evaluate(() => window.htInvalidationCount());
  }

  /**
   * Whether the window owns the horizontal scroll axis (no ancestor traps it).
   */
  async horizontalAxisOwnedByWindow(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as { hot: StretchFixtureHot }).hot.view
      .isHorizontallyScrollableByWindow());
  }

  /**
   * Whether the document itself overflows horizontally — the page-level scrollbar a window-mode
   * grid wider than its root would summon.
   */
  async documentOverflowsHorizontally(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  }

  /**
   * One layout read for every number the assertions compare.
   */
  async geometry(): Promise<StretchGeometry> {
    return this.page.evaluate(() => {
      const grid = document.querySelector('[data-testid="grid"]') as HTMLElement;
      const wrap = document.getElementById('wrap') as HTMLElement;
      const hider = grid.querySelector('.ht_master .wtHider') as HTMLElement;
      const holder = grid.querySelector('.ht_master .wtHolder') as HTMLElement;
      const topCloneRoot = grid.querySelector('.ht_clone_top') as HTMLElement;
      const firstRowCells = Array.from(grid.querySelectorAll('.ht_master table.htCore tbody tr:first-child td'));
      const headerCells = Array.from(grid.querySelectorAll('.ht_clone_top thead tr:first-child th'));
      const lastHeader = headerCells[headerCells.length - 1];
      const hot = (window as unknown as { hot: StretchFixtureHot }).hot;
      let apiColumnWidthSum = 0;

      for (let col = 0; col < hot.countCols(); col++) {
        apiColumnWidthSum += hot.getColWidth(col);
      }

      return {
        containerWidth: wrap.getBoundingClientRect().width,
        hiderWidth: Number.parseFloat(hider.style.width),
        topCloneRootWidth: Number.parseFloat(topCloneRoot.style.width),
        bodyWidth: firstRowCells.reduce((sum, td) => sum + td.getBoundingClientRect().width, 0),
        lastHeaderOverflow: lastHeader.getBoundingClientRect().right - topCloneRoot.getBoundingClientRect().right,
        scrollbar: {
          vertical: holder.offsetWidth - holder.clientWidth,
          horizontal: holder.offsetHeight - holder.clientHeight,
        },
        apiColumnWidthSum,
        rootWidth: grid.getBoundingClientRect().width,
      };
    });
  }

  /**
   * The scroll-presence classes on the root, in DOM order. Empty when the engine reports no
   * scrollbar on either axis.
   */
  async rootScrollClasses(): Promise<string[]> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: StretchFixtureHot }).hot;

      return Array.from(hot.rootElement.classList)
        .filter(name => name === 'htHasScrollX' || name === 'htHasScrollY');
    });
  }

  /**
   * The engine's own verdict, read through the public TableView wrappers.
   */
  async engineScrollFlags(): Promise<{ vertical: boolean; horizontal: boolean }> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: StretchFixtureHot }).hot;

      return {
        vertical: hot.view.hasVerticalScroll(),
        horizontal: hot.view.hasHorizontalScroll(),
      };
    });
  }

  /**
   * A full render with nothing changed, returning how many column-width cache drops it cost.
   */
  async renderWithoutChange(): Promise<number> {
    return this.page.evaluate(() => {
      const hot = (window as unknown as { hot: StretchFixtureHot }).hot;
      const before = window.htInvalidationCount();

      hot.render();

      return window.htInvalidationCount() - before;
    });
  }
}

declare global {
  interface Window {
    htSetContainerWidth(px: number): void;
    htInvalidationCount(): number;
    htRenderCount(): number;
  }
}
