import { type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The part of the fixture's Handsontable instance (`window.hot`) the page object calls.
 */
interface FontLoadGrid {
  scrollViewportTo(options: { row: number, verticalSnap: 'top' } | { col: number, horizontalSnap: 'end' }): boolean;
  getFirstFullyVisibleRow(): number | null;
  getLastRenderedVisibleColumn(): number | null;
  getRowHeight(row: number): number | undefined;
  getColWidth(column: number): number;
  getCell(row: number, column: number, topmost?: boolean): HTMLElement | null;
  setDataAtCell(row: number, column: number, value: string): void;
  addHook(name: 'afterRender' | 'afterFontsLoad' | 'beforeRender', callback: () => void, orderIndex?: number): void;
  getPlugin(name: 'autoRowSize' | 'autoColumnSize'): { inProgress: boolean };
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
   * Skips the contents of the grid's root element (`content-visibility: hidden`) or renders them again.
   * Unlike `display: none`, the root element keeps a box in the layout while the table inside it has none.
   * The root element is the div the grid creates inside the fixture's container, so it is reached through
   * the instance.
   */
  async setGridContentHidden(hidden: boolean): Promise<void> {
    await this.page.evaluate((isHidden) => {
      (window as unknown as { hot: { rootElement: HTMLElement } }).hot.rootElement.style.contentVisibility = isHidden ? 'hidden' : '';
    }, hidden);
  }

  /**
   * Counts the elements handed to `IntersectionObserver#observe()` from the next navigation on. Call it
   * before `goto()`, and read the count with `intersectionObserveCalls()`.
   */
  async trackIntersectionObservers(): Promise<void> {
    await this.page.addInitScript(() => {
      const observe = IntersectionObserver.prototype.observe;
      const win = window as unknown as { htIntersectionObserveCalls: number };

      win.htIntersectionObserveCalls = 0;
      IntersectionObserver.prototype.observe = function(target: Element) {
        win.htIntersectionObserveCalls += 1;
        observe.call(this, target);
      };
    });
  }

  /**
   * Reads how many times an `IntersectionObserver` started observing an element (see
   * `trackIntersectionObservers()`).
   */
  async intersectionObserveCalls(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htIntersectionObserveCalls: number }).htIntersectionObserveCalls);
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
   * Reads the width the grid holds for a column (AutoColumnSize's measurement, at least the default width).
   */
  async columnWidth(column: number): Promise<number> {
    return this.page.evaluate(visualColumn => (window as unknown as { hot: FontLoadGrid }).hot
      .getColWidth(visualColumn), column);
  }

  /**
   * Reads the last column the grid has rendered, on screen or just past its edge.
   */
  async lastRenderedColumn(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { hot: FontLoadGrid }).hot
      .getLastRenderedVisibleColumn() ?? -1);
  }

  /**
   * Records the widths the grid holds for `columns` after every render that follows the next font
   * re-measure (the `afterFontsLoad` hook). Read the list with `recordedColumnWidths()`.
   */
  async recordColumnWidthsAfterFontsLoad(columns: number[]): Promise<void> {
    await this.page.evaluate((visualColumns) => {
      const win = window as unknown as { hot: FontLoadGrid, htRecordedColumnWidths: number[][] };
      let fontsLoaded = false;

      win.htRecordedColumnWidths = [];
      win.hot.addHook('afterFontsLoad', () => {
        fontsLoaded = true;
      });
      win.hot.addHook('afterRender', () => {
        if (fontsLoaded) {
          win.htRecordedColumnWidths.push(visualColumns.map(column => win.hot.getColWidth(column)));
        }
      });
    }, columns);
  }

  /**
   * Writes `value` into a cell right after the next font re-measure starts (the `afterFontsLoad` hook, after
   * AutoColumnSize's own listener), so the edit lands while the plugin's sweep is in progress.
   */
  async editDuringFontsLoad(row: number, column: number, value: string): Promise<void> {
    await this.page.evaluate(([visualRow, visualColumn, newValue]) => {
      const win = window as unknown as { hot: FontLoadGrid, htEditedDuringFontsLoad: boolean };

      win.htEditedDuringFontsLoad = false;
      win.hot.addHook('afterFontsLoad', () => {
        win.hot.setDataAtCell(visualRow as number, visualColumn as number, newValue as string);
        win.htEditedDuringFontsLoad = true;
      });
    }, [row, column, value]);
  }

  /**
   * Records the width the grid holds for `column` at the start of every render from now on, ahead of the
   * plugins' own `beforeRender` listeners (a negative hook order), so the value is the one the render was
   * asked to draw, before AutoColumnSize refreshes queued columns. Read the list with
   * `recordedBeforeRenderWidths()`.
   */
  async recordColumnWidthBeforeRenders(column: number): Promise<void> {
    await this.page.evaluate((visualColumn) => {
      const win = window as unknown as { hot: FontLoadGrid, htBeforeRenderWidths: number[] };

      win.htBeforeRenderWidths = [];
      win.hot.addHook('beforeRender', () => {
        win.htBeforeRenderWidths.push(win.hot.getColWidth(visualColumn));
      }, -100);
    }, column);
  }

  /**
   * Reads the widths `recordColumnWidthBeforeRenders()` recorded, one per render.
   */
  async recordedBeforeRenderWidths(): Promise<number[]> {
    return this.page.evaluate(() => (window as unknown as { htBeforeRenderWidths: number[] }).htBeforeRenderWidths);
  }

  /**
   * Waits until the edit of `editDuringFontsLoad()` has landed (so the font re-measure has started: the
   * document's `fonts.ready` resolves for the test before the grid's own handler runs) and AutoColumnSize
   * has no sweep in progress any more.
   */
  async waitForFontSweepAfterEdit(): Promise<void> {
    await expect.poll(() => this.page.evaluate(() => {
      const win = window as unknown as { hot: FontLoadGrid, htEditedDuringFontsLoad: boolean };

      return win.htEditedDuringFontsLoad && !win.hot.getPlugin('autoColumnSize').inProgress;
    })).toBe(true);
  }

  /**
   * Reads the widths `recordColumnWidthsAfterFontsLoad()` recorded, one list per render.
   */
  async recordedColumnWidths(): Promise<number[][]> {
    return this.page.evaluate(() => (window as unknown as { htRecordedColumnWidths: number[][] })
      .htRecordedColumnWidths);
  }

  /**
   * Scrolls the grid right to `column`, and waits until the grid has drawn a cell of it.
   */
  async scrollToColumn(column: number): Promise<void> {
    await this.page.evaluate((visualColumn) => {
      (window as unknown as { hot: FontLoadGrid }).hot.scrollViewportTo({ col: visualColumn, horizontalSnap: 'end' });
    }, column);
    await expect.poll(() => this.page.evaluate(visualColumn => (window as unknown as { hot: FontLoadGrid }).hot
      .getCell(0, visualColumn) !== null, column)).toBe(true);
  }

  /**
   * Tells whether the text of a rendered cell fits its box (`scrollWidth` within `clientWidth`). Reads the
   * topmost cell, which for a frozen column is the one in its overlay.
   */
  async cellTextFits(row: number, column: number): Promise<boolean> {
    return this.page.evaluate(([visualRow, visualColumn]) => {
      const cell = (window as unknown as { hot: FontLoadGrid }).hot.getCell(visualRow, visualColumn, true);

      return cell !== null && cell.scrollWidth <= cell.clientWidth;
    }, [row, column]);
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
