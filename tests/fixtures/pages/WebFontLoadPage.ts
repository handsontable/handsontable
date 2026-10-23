import { type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The part of the fixture's Handsontable instance (`window.hot`) the page object calls.
 */
interface FontLoadGrid {
  scrollViewportTo(options: { row: number, verticalSnap: 'top' }): boolean;
  getFirstFullyVisibleRow(): number | null;
  getRowHeight(row: number): number | undefined;
  addHook(name: 'afterRender', callback: () => void): void;
  getPlugin(name: 'autoRowSize'): { inProgress: boolean };
}

interface GridGeometry {
  wrappedCellHeight: number;
  wrappedRowHeaderHeight: number;
  wrappedFrozenCellHeight: number;
  autoSizedTextWidth: number;
  autoSizedCellWidth: number;
  tableHeight: number;
  rootHeight: number;
}

/**
 * Page Object for the fixture whose cells use a web font that loads only after the grid has drawn
 * (DEV-199). `loadFont()` adds the font face at the moment the test chooses, so the first draw always
 * measures the fallback font.
 */
export class WebFontLoadPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the first draw. A `variant` is extra query parameters such as
   * `&height=1` (see the fixture).
   */
  async goto(variant = ''): Promise<void> {
    // A held font request (`holdFontRequest()`) delays the window's `load` event until it is answered.
    const waitUntil = variant.includes('preload=1') ? 'domcontentloaded' : 'load';

    await this.page.goto(`/tests/fixtures/demo/web-font-load.html?theme=${this.theme}&bundle=${this.bundle}${variant}`, { waitUntil });
    await awaitBundle(this.page);
    await expect(this.page.locator('.ht_master tbody tr').first()).toBeVisible();
  }

  /**
   * Holds the request for the font the `&preload=1` variant starts loading before it creates the grid, so
   * `document.fonts` stays loading until the test calls the returned function. That function answers the
   * request with a 404, which ends the load without changing any text. Call this before `goto()`.
   */
  async holdFontRequest(): Promise<() => void> {
    let release: () => void = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });

    await this.page.route('**/__ht-held-font.woff2', async(route) => {
      await released;
      await route.fulfill({ status: 404, body: '' });
    });

    return release;
  }

  /**
   * Reads `document.fonts.status`: `'loading'` while any font face is loading, `'loaded'` otherwise.
   */
  async fontsStatus(): Promise<string> {
    return this.page.evaluate(() => document.fonts.status);
  }

  /**
   * Loads the `HtLateFont` face the fixture's cells ask for. It is a system font drawn at twice its size
   * (`size-adjust`), so it needs no network and the text gets much wider than the fallback. Resolves once
   * the face has loaded; the document fires `loadingdone` at that point. Throws when none of the local
   * fonts exists, so a missing font fails the test instead of passing it with nothing loaded.
   */
  async loadFont(): Promise<void> {
    await this.page.evaluate(async() => {
      const face = new FontFace(
        'HtLateFont',
        'local("DejaVu Sans"), local("Liberation Sans"), local("Arial"), local("Helvetica"), local("Noto Sans")',
        { sizeAdjust: '200%' },
      );

      document.fonts.add(face);
      await face.load();
    });
  }

  /**
   * Reads, in one evaluation, the sizes the font changes: the wrapped cell (B2) beside its row header and
   * its frozen-column neighbor, the no-wrap cell (C4) against its text, and the table against the grid's
   * root element.
   */
  async geometry(): Promise<GridGeometry> {
    return this.page.evaluate(() => {
      const height = (element: Element | null | undefined) => element?.getBoundingClientRect().height ?? NaN;
      const masterRows = document.querySelectorAll('.ht_master .htCore tbody tr');
      const frozenRows = document.querySelectorAll('.ht_clone_inline_start .htCore tbody tr');
      const autoSizedCell = masterRows[3].querySelectorAll('td')[2];

      return {
        wrappedCellHeight: height(masterRows[1].querySelectorAll('td')[1]),
        wrappedRowHeaderHeight: height(frozenRows[1].querySelector('th')),
        wrappedFrozenCellHeight: height(frozenRows[1].querySelector('td')),
        autoSizedTextWidth: autoSizedCell.scrollWidth,
        autoSizedCellWidth: autoSizedCell.clientWidth,
        tableHeight: height(document.querySelector('.ht_master .htCore')),
        rootHeight: height(document.querySelector('[data-testid="grid"]')),
      };
    });
  }

  /**
   * Hides the grid's container (`display: none`) or shows it again.
   */
  async setGridDisplayed(displayed: boolean): Promise<void> {
    await this.page.evaluate((isDisplayed) => {
      (document.querySelector('[data-testid="grid"]') as HTMLElement).style.display = isDisplayed ? '' : 'none';
    }, displayed);
  }

  /**
   * Scrolls the grid down until its first fully visible row is below `row`, and waits until the grid has
   * drawn there.
   */
  async scrollBelowRow(row: number): Promise<void> {
    // AutoRowSize measures the rows past its sync limit in idle chunks, and each chunk can move the rows on
    // screen, so the scroll waits for that sweep to end.
    await expect.poll(() => this.page.evaluate(() => (window as unknown as { hot: FontLoadGrid }).hot
      .getPlugin('autoRowSize').inProgress)).toBe(false);
    await this.page.evaluate((visualRow) => {
      (window as unknown as { hot: FontLoadGrid }).hot.scrollViewportTo({ row: visualRow, verticalSnap: 'top' });
    }, row + 500);
    await expect.poll(async() => (await this.firstVisibleRow()) ?? -1).toBeGreaterThan(row);
  }

  /**
   * Reads the grid's first fully visible row.
   */
  async firstVisibleRow(): Promise<number | null> {
    return this.page.evaluate(() => (window as unknown as { hot: FontLoadGrid }).hot.getFirstFullyVisibleRow());
  }

  /**
   * Reads the height the grid holds for a row (AutoRowSize's measurement when it is on).
   */
  async rowHeight(row: number): Promise<number | undefined> {
    return this.page.evaluate(visualRow => (window as unknown as { hot: FontLoadGrid }).hot.getRowHeight(visualRow), row);
  }

  /**
   * Records the height the grid holds for `row` after every render from now on. Read the list with
   * `recordedRowHeights()`.
   */
  async recordRowHeight(row: number): Promise<void> {
    await this.page.evaluate((visualRow) => {
      const win = window as unknown as { hot: FontLoadGrid, htRecordedRowHeights: (number | undefined)[] };

      win.htRecordedRowHeights = [];
      win.hot.addHook('afterRender', () => {
        win.htRecordedRowHeights.push(win.hot.getRowHeight(visualRow));
      });
    }, row);
  }

  /**
   * Reads the heights `recordRowHeight()` recorded, one per render.
   */
  async recordedRowHeights(): Promise<(number | undefined)[]> {
    return this.page.evaluate(() => (window as unknown as { htRecordedRowHeights: (number | undefined)[] })
      .htRecordedRowHeights);
  }

  /**
   * Reads, in one evaluation, the width of the first row header's label against its cell, and of the nested
   * header label over columns C and D against its cell (the `&headers=1` variant).
   */
  async headerGeometry(): Promise<{ rowLabel: number, rowCell: number, nestedLabel: number, nestedCell: number }> {
    return this.page.evaluate(() => {
      const rowHeader = document.querySelector('.ht_clone_inline_start .htCore tbody tr th') as HTMLElement;
      const nestedHeader = document.querySelector('.ht_clone_top .htCore thead tr:first-child th[colspan="2"]') as HTMLElement;
      // `scrollWidth`, not the box: the nested label is a block clipped to its cell, so its box never grows.
      const labelWidth = (cell: HTMLElement) => (cell.querySelector('.rowHeader, .colHeader') as HTMLElement)
        .scrollWidth;

      return {
        rowLabel: labelWidth(rowHeader),
        rowCell: rowHeader.clientWidth,
        nestedLabel: labelWidth(nestedHeader),
        nestedCell: nestedHeader.clientWidth,
      };
    });
  }

  /**
   * Counts the `loading` listeners added to and removed from `document.fonts` from the next navigation on.
   * Call it before `goto()`, and read the balance with `fontLoadingListeners()`.
   */
  async trackFontListeners(): Promise<void> {
    await this.page.addInitScript(() => {
      const fonts = document.fonts;
      const add = fonts.addEventListener.bind(fonts);
      const remove = fonts.removeEventListener.bind(fonts);
      const win = window as unknown as { htFontLoadingListeners: number };

      win.htFontLoadingListeners = 0;
      fonts.addEventListener = (type: string, ...rest: [EventListenerOrEventListenerObject, unknown?]) => {
        if (type === 'loading') {
          win.htFontLoadingListeners += 1;
        }

        add(type, ...(rest as [EventListenerOrEventListenerObject]));
      };
      fonts.removeEventListener = (type: string, ...rest: [EventListenerOrEventListenerObject, unknown?]) => {
        if (type === 'loading') {
          win.htFontLoadingListeners -= 1;
        }

        remove(type, ...(rest as [EventListenerOrEventListenerObject]));
      };
    });
  }

  /**
   * Reads how many `loading` listeners `document.fonts` holds (see `trackFontListeners()`).
   */
  async fontLoadingListeners(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htFontLoadingListeners: number }).htFontLoadingListeners);
  }

  /**
   * Destroys the grid.
   */
  async destroyGrid(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { hot: { destroy(): void } }).hot.destroy();
    });
  }

  /**
   * Resolves after the browser has painted the given number of frames, so work queued for the next
   * animation frame has had its turn. Counts frames, not milliseconds.
   */
  async waitForFrames(frames: number): Promise<void> {
    await this.page.evaluate(async(count) => {
      for (let i = 0; i < count; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
    }, frames);
  }
}
