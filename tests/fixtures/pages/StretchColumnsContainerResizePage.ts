import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

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
   * @param options.stretchH The strategy under test; `none` is the control.
   * @param options.height `auto` (the reported shape) or a pixel height.
   */
  async goto(options: { stretchH?: 'all' | 'last' | 'none'; height?: 'auto' | number } = {}): Promise<void> {
    const stretchH = options.stretchH ?? 'all';
    const height = options.height ?? 'auto';

    await this.page.goto(
      `/tests/fixtures/demo/stretch-columns-container-resize.html` +
      `?theme=${this.theme}&bundle=${this.bundle}&stretchH=${stretchH}&height=${height}`
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
   * Resizes the wrapper and waits until the engine has re-rendered against the new width: the
   * master hider is the element the engine writes the summed column widths to, so it reaching the
   * new width IS the render having happened. For the `none` control the hider does not follow the
   * container, so the caller passes `expectHiderFollows: false` and only the wrapper is awaited.
   */
  async setContainerWidth(px: number, expectHiderFollows = true): Promise<void> {
    await this.page.evaluate(width => window.setContainerWidth(width), px);

    await expect.poll(async() => (await this.geometry()).containerWidth, {
      message: `wrapper reaches ${px}px`,
    }).toBe(px);

    if (expectHiderFollows) {
      await expect.poll(async() => (await this.geometry()).hiderWidth, {
        message: `master hider follows the container to ${px}px`,
      }).toBe(px);
    }
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
      const hot = window.hot;
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
      };
    });
  }

  /**
   * The scroll-presence classes on the root, in DOM order. Empty when the engine reports no
   * scrollbar on either axis.
   */
  async rootScrollClasses(): Promise<string[]> {
    return this.page.evaluate(() => Array.from(window.hot.rootElement.classList)
      .filter(name => name === 'htHasScrollX' || name === 'htHasScrollY'));
  }

  /**
   * The engine's own verdict, read through the public TableView wrappers.
   */
  async engineScrollFlags(): Promise<{ vertical: boolean; horizontal: boolean }> {
    return this.page.evaluate(() => ({
      vertical: window.hot.view.hasVerticalScroll(),
      horizontal: window.hot.view.hasHorizontalScroll(),
    }));
  }

  /**
   * A full render with nothing changed, returning how many column-width cache drops it cost.
   */
  async renderWithoutChange(): Promise<number> {
    return this.page.evaluate(() => {
      const before = window.invalidationCount();

      window.hot.render();

      return window.invalidationCount() - before;
    });
  }
}

declare global {
  interface Window {
    hot: {
      rootElement: HTMLElement;
      countCols(): number;
      getColWidth(col: number): number;
      render(): void;
      view: {
        hasVerticalScroll(): boolean;
        hasHorizontalScroll(): boolean;
      };
    };
    setContainerWidth(px: number): void;
    invalidationCount(): number;
  }
}
