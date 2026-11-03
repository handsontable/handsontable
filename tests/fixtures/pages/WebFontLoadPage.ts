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
  setSourceDataAtCell(row: number, column: number, value: string): void;
  addHook(name: 'afterRender' | 'afterFontsLoad' | 'beforeRender', callback: () => void, orderIndex?: number): void;
  addHookOnce(name: 'afterFontsLoad', callback: () => void, orderIndex?: number): void;
  runHooks(name: 'afterFontsLoad'): void;
  getPlugin(name: 'autoRowSize' | 'autoColumnSize'): { inProgress: boolean, calculateAllColumnsWidth(): void };
  alter(action: 'remove_row' | 'insert_row_above', index: number, amount: number): void;
  countRows(): number;
  view: { isVisible(): boolean };
  setCellMeta(row: number, column: number, key: string, value: unknown): void;
  getSettings(): { columns?: unknown };
  updateSettings(settings: Record<string, unknown>): void;
  render(): void;
  destroy(): void;
  getSourceData(): unknown[][];
  updateData(data: unknown[][]): void;
  loadData(data: unknown[][]): void;
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
 *
 * The sizing plugins register their `afterFontsLoad` listeners with the hook order index 10, after the
 * listeners an application adds with the default order. A helper whose listener has to run after the
 * plugins started re-measuring registers it with the order index 100.
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
   * AutoColumnSize's own listener, order index 100), so the edit lands while the plugin's sweep is in progress.
   */
  async editDuringFontsLoad(row: number, column: number, value: string): Promise<void> {
    await this.page.evaluate(([visualRow, visualColumn, newValue]) => {
      const win = window as unknown as { hot: FontLoadGrid, htEditedDuringFontsLoad: boolean };

      win.htEditedDuringFontsLoad = false;
      win.hot.addHook('afterFontsLoad', () => {
        win.hot.setDataAtCell(visualRow as number, visualColumn as number, newValue as string);
        win.htEditedDuringFontsLoad = true;
      }, 100);
    }, [row, column, value]);
  }

  /**
   * Sets a cell meta key right after the next font re-measure starts (the `afterFontsLoad` hook, after
   * AutoColumnSize's own listener, order index 100), so the change lands while the plugin's sweep is in progress.
   */
  async setCellMetaDuringFontsLoad(row: number, column: number, key: string, value: string): Promise<void> {
    await this.page.evaluate(([visualRow, visualColumn, metaKey, metaValue]) => {
      const win = window as unknown as { hot: FontLoadGrid };

      win.hot.addHook('afterFontsLoad', () => {
        win.hot.setCellMeta(visualRow as number, visualColumn as number, metaKey as string, metaValue);
      }, 100);
    }, [row, column, key, value]);
  }

  /**
   * Writes `value` into the source data right after the next font re-measure starts (the `afterFontsLoad`
   * hook, after AutoColumnSize's own listener). Unlike `setDataAtCell()`, a source write carries no per-cell
   * change for the plugin's refresh queue; it drops every cached sample instead.
   */
  async setSourceDataDuringFontsLoad(row: number, column: number, value: string): Promise<void> {
    await this.page.evaluate(([visualRow, visualColumn, newValue]) => {
      const win = window as unknown as { hot: FontLoadGrid };

      win.hot.addHook('afterFontsLoad', () => {
        win.hot.setSourceDataAtCell(visualRow as number, visualColumn as number, newValue as string);
      }, 100);
    }, [row, column, value]);
  }

  /**
   * Hides the grid's container (`display: none`) right after the next font re-measure starts (the
   * `afterFontsLoad` hook, after AutoColumnSize's own listener), so the sweep's idle chunks find the grid hidden.
   * It hides the grid once: the re-measure runs again, hook included, when the grid is shown.
   */
  async hideGridDuringFontsLoad(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { hot: FontLoadGrid }).hot.addHookOnce('afterFontsLoad', () => {
        (document.querySelector('[data-testid="grid"]') as HTMLElement).style.display = 'none';
      }, 100);
    });
  }

  /**
   * Notes when the next `afterFontsLoad` hook has run, after the plugins' own listeners. Read it with
   * `fontsLoadHookRan()`: the document's `fonts.ready` resolves for the test before the grid's own handler
   * runs, so a wait on the sweep alone can pass before the re-measure has started.
   */
  async trackFontsLoadHook(): Promise<void> {
    await this.page.evaluate(() => {
      const win = window as unknown as { hot: FontLoadGrid, htFontsLoadHookRan: boolean };

      win.htFontsLoadHookRan = false;
      win.hot.addHook('afterFontsLoad', () => {
        win.htFontsLoadHookRan = true;
      }, 100);
    });
  }

  /**
   * Tells whether the hook `trackFontsLoadHook()` watches has run.
   */
  async fontsLoadHookRan(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as { htFontsLoadHookRan: boolean }).htFontsLoadHookRan);
  }

  /**
   * Makes AutoColumnSize forget the samples it cached for `columns`, without a draw: setting any cell meta
   * drops the column's samples, since the meta could change how the cell renders. The key set here changes
   * nothing, so the widths stay as they are.
   */
  async dropSamplesOfColumns(columns: number[]): Promise<void> {
    await this.page.evaluate((visualColumns) => {
      const win = window as unknown as { hot: FontLoadGrid };

      visualColumns.forEach(column => win.hot.setCellMeta(0, column, 'htSamplesDropped', true));
    }, columns);
  }

  /**
   * Adds a class to the body right after the next font re-measure starts (the `afterFontsLoad` hook, after
   * the plugins' own listeners), the way a theme switch or a class toggle lands while the sweep runs. The
   * grid draws right after the hook.
   */
  async addBodyClassDuringFontsLoad(className: string): Promise<void> {
    await this.page.evaluate((name) => {
      (window as unknown as { hot: FontLoadGrid }).hot.addHook('afterFontsLoad', () => {
        document.body.classList.add(name);
      }, 100);
    }, className);
  }

  /**
   * Records, from a listener of the next `afterFontsLoad` hook added with the default order (the order a
   * listener in the settings object gets), the width the grid holds for `column` and whether AutoColumnSize
   * has a sweep in progress at that moment. Read it with `defaultOrderListenerState()`.
   */
  async recordStateInDefaultOrderFontsListener(column: number): Promise<void> {
    await this.page.evaluate((visualColumn) => {
      const win = window as unknown as {
        hot: FontLoadGrid,
        htDefaultOrderState: { width: number, sweepInProgress: boolean } | null,
      };

      win.htDefaultOrderState = null;
      win.hot.addHook('afterFontsLoad', () => {
        win.htDefaultOrderState = {
          width: win.hot.getColWidth(visualColumn),
          sweepInProgress: win.hot.getPlugin('autoColumnSize').inProgress,
        };
      });
    }, column);
  }

  /**
   * Reads what `recordStateInDefaultOrderFontsListener()` recorded, or `null` while the hook has not fired.
   */
  async defaultOrderListenerState(): Promise<{ width: number, sweepInProgress: boolean } | null> {
    return this.page.evaluate(() => (window as unknown as {
      htDefaultOrderState: { width: number, sweepInProgress: boolean } | null,
    }).htDefaultOrderState);
  }

  /**
   * Makes AutoColumnSize's sweep measure one column per chunk: the budget of cells a chunk samples drops to
   * the 25000 rows of the `&wide=1` variant. Call it after `goto()`.
   */
  async measureOneColumnPerChunk(): Promise<void> {
    await this.page.evaluate(() => {
      const { AutoColumnSize } = (window as unknown as { Handsontable: { plugins: { AutoColumnSize: object } } })
        .Handsontable.plugins;

      Object.defineProperty(AutoColumnSize, 'CALCULATION_CELLS_BUDGET', { get: () => 25000, configurable: true });
    });
  }

  /**
   * Starts a stream of writes once the next font re-measure starts: after every draw while AutoColumnSize's
   * sweep runs, the next idle task writes a new value into D11 through `setSourceDataAtCell()` (`source`), or
   * calls `updateSettings({})` (`settings`, the way a wrapper re-renders), and draws, the way an application
   * that streams updates does. The idle task is
   * queued after the sweep's own, so one chunk of the sweep runs between two writes. The stream ends when a
   * draw finds the sweep over, or after `maxWrites` writes. Read how it ended with `writeStreamEnd()`.
   */
  async streamWritesDuringFontsLoad(maxWrites: number, write: 'source' | 'settings' = 'source'): Promise<void> {
    await this.page.evaluate(([cap, kind]) => {
      const win = window as unknown as {
        hot: FontLoadGrid,
        htWriteStreamEnd: { reason: 'sweepEnded' | 'cap', writes: number } | null,
      };
      const queueTask = (callback: () => void) => (typeof window.requestIdleCallback === 'function' ?
        window.requestIdleCallback(callback) : window.requestAnimationFrame(callback));
      let writes = 0;
      let writeQueued = false;

      win.htWriteStreamEnd = null;

      const onRender = () => {
        if (win.htWriteStreamEnd !== null || writeQueued) {
          return;
        }

        if (!win.hot.getPlugin('autoColumnSize').inProgress) {
          win.htWriteStreamEnd = { reason: 'sweepEnded', writes };
        } else if (writes >= cap) {
          win.htWriteStreamEnd = { reason: 'cap', writes };
        } else {
          writeQueued = true;
          queueTask(() => {
            writeQueued = false;
            writes += 1;

            if (kind === 'settings') {
              win.hot.updateSettings({});
            } else {
              win.hot.setSourceDataAtCell(10, 3, String(writes));
            }

            win.hot.render();
          });
        }
      };

      win.hot.addHook('afterFontsLoad', () => {
        win.hot.addHook('afterRender', onRender);
      }, 100);
    }, [maxWrites, write] as const);
  }

  /**
   * Calls `render()` once right after the draw that follows the next `afterFontsLoad` hook, in a microtask,
   * before any idle task of AutoColumnSize's sweep runs, the way an application renders after a change. Records
   * whether the text of the cell at `row`, `column` fits once that render is done, and whether the sweep was
   * still running. Read it with `renderAfterFontsLoadDrawResult()`.
   */
  async renderAfterFontsLoadDraw(row: number, column: number): Promise<void> {
    await this.page.evaluate(([visualRow, visualColumn]) => {
      const win = window as unknown as {
        hot: FontLoadGrid,
        htRenderAfterDraw: { fitsBefore: boolean, fitsAfter: boolean, sweepInProgress: boolean } | null,
      };
      const fits = () => {
        const cell = win.hot.getCell(visualRow, visualColumn, true);

        return cell !== null && cell.scrollWidth <= cell.clientWidth;
      };

      win.htRenderAfterDraw = null;
      win.hot.addHook('afterFontsLoad', () => {
        // Core draws right after the hook, in the same task, so the microtask runs after that draw.
        queueMicrotask(() => {
          const fitsBefore = fits();

          win.hot.render();
          win.htRenderAfterDraw = {
            fitsBefore,
            fitsAfter: fits(),
            sweepInProgress: win.hot.getPlugin('autoColumnSize').inProgress,
          };
        });
      }, 100);
    }, [row, column]);
  }

  /**
   * Reads what `renderAfterFontsLoadDraw()` recorded, or `null` while it has not run.
   */
  async renderAfterFontsLoadDrawResult(): Promise<{ fitsBefore: boolean, fitsAfter: boolean, sweepInProgress: boolean } | null> {
    return this.page.evaluate(() => (window as unknown as {
      htRenderAfterDraw: { fitsBefore: boolean, fitsAfter: boolean, sweepInProgress: boolean } | null,
    }).htRenderAfterDraw);
  }

  /**
   * Reads how the stream of `streamSourceWritesDuringFontsLoad()` ended, or `null` while it runs.
   */
  async writeStreamEnd(): Promise<{ reason: 'sweepEnded' | 'cap', writes: number } | null> {
    return this.page.evaluate(() => (window as unknown as {
      htWriteStreamEnd: { reason: 'sweepEnded' | 'cap', writes: number } | null,
    }).htWriteStreamEnd);
  }

  /**
   * Removes every row of the grid.
   */
  async removeAllRows(): Promise<void> {
    await this.page.evaluate(() => {
      const { hot } = window as unknown as { hot: FontLoadGrid };

      hot.alter('remove_row', 0, hot.countRows());
    });
  }

  /**
   * Adds `amount` empty rows at the top of the grid.
   */
  async addRows(amount: number): Promise<void> {
    await this.page.evaluate((count) => {
      (window as unknown as { hot: FontLoadGrid }).hot.alter('insert_row_above', 0, count);
    }, amount);
  }

  /**
   * Tells whether the label of a rendered column header fits its cell.
   */
  async columnHeaderFits(column: number): Promise<boolean> {
    return this.page.evaluate((visualColumn) => {
      const header = (window as unknown as { hot: FontLoadGrid }).hot.getCell(-1, visualColumn, true);
      const label = header?.querySelector('.colHeader') as HTMLElement | null;

      return header !== null && label !== null && label.scrollWidth <= header.clientWidth;
    }, column);
  }

  /**
   * Calls AutoColumnSize's public `calculateAllColumnsWidth()`, which measures only the columns that have no
   * width yet.
   */
  async calculateAllColumnsWidth(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { hot: FontLoadGrid }).hot.getPlugin('autoColumnSize').calculateAllColumnsWidth();
    });
  }

  /**
   * Interrupts the column re-measure from inside the next `afterFontsLoad` hook, after AutoColumnSize's
   * own listener started it: `calculateAllColumnsWidth` starts a sweep that measures only the columns that
   * have no width, and `toggle` turns AutoColumnSize off and on again.
   *
   * @param {string} interruption What interrupts the re-measure.
   */
  async interruptColumnSweepDuringFontsLoad(interruption: 'calculateAllColumnsWidth' | 'toggle'): Promise<void> {
    await this.page.evaluate((kind) => {
      const win = window as unknown as { hot: FontLoadGrid };

      win.hot.addHookOnce('afterFontsLoad', () => {
        if (kind === 'toggle') {
          win.hot.updateSettings({ autoColumnSize: false });
          win.hot.updateSettings({ autoColumnSize: true });
        } else {
          win.hot.getPlugin('autoColumnSize').calculateAllColumnsWidth();
        }
      }, 100);
    }, interruption);
  }

  /**
   * Caches the samples of a column off screen: a forced render measures the columns on screen from their
   * samples and keeps them. The grid is scrolled back to its first column afterwards.
   *
   * @param {number} column The visual column index.
   */
  async cacheSamplesOfColumn(column: number): Promise<void> {
    await this.scrollToColumn(column);
    await this.render();
    await this.page.evaluate(() => {
      (window as unknown as { hot: FontLoadGrid }).hot.scrollViewportTo({ col: 0, horizontalSnap: 'start' });
    });
    await expect.poll(() => this.page.evaluate(() => (window as unknown as { hot: FontLoadGrid }).hot
      .getCell(0, 2) !== null)).toBe(true);
  }

  /**
   * Replaces the data through `updateData()` with a copy whose cell holds `value`, right after the next font
   * re-measure starts (the `afterFontsLoad` hook, after AutoColumnSize's own listener). The copy has the
   * same rows and columns, so no index map changes.
   */
  async updateDataDuringFontsLoad(row: number, column: number, value: string): Promise<void> {
    await this.page.evaluate(([visualRow, visualColumn, newValue]) => {
      const win = window as unknown as { hot: FontLoadGrid };

      win.hot.addHookOnce('afterFontsLoad', () => {
        const data = win.hot.getSourceData().map(sourceRow => [...sourceRow]);

        data[visualRow as number][visualColumn as number] = newValue;
        win.hot.updateData(data);
      }, 100);
    }, [row, column, value]);
  }

  /**
   * Sets AutoColumnSize's `syncLimit`, so a sweep over every column runs past the first columns in idle tasks.
   */
  async setAutoColumnSizeSyncLimit(syncLimit: number): Promise<void> {
    await this.page.evaluate((limit) => {
      (window as unknown as { hot: FontLoadGrid }).hot.updateSettings({ autoColumnSize: { syncLimit: limit } });
    }, syncLimit);
  }

  /**
   * Loads a copy of the data whose cell holds `value` through `loadData()`, and hides the grid's container in
   * the same task, so the idle part of the sweep that follows the load finds the grid hidden.
   */
  async loadDataAndHide(row: number, column: number, value: string): Promise<void> {
    await this.page.evaluate(([visualRow, visualColumn, newValue]) => {
      const win = window as unknown as { hot: FontLoadGrid };
      const data = win.hot.getSourceData().map(sourceRow => [...sourceRow]);

      data[visualRow as number][visualColumn as number] = newValue;
      win.hot.loadData(data);
      (document.querySelector('[data-testid="grid"]') as HTMLElement).style.display = 'none';
    }, [row, column, value]);
  }

  /**
   * Turns AutoColumnSize off and on again, which registers its hook listeners after the other plugins'.
   */
  async toggleAutoColumnSize(): Promise<void> {
    await this.page.evaluate(() => {
      const win = window as unknown as { hot: FontLoadGrid };

      win.hot.updateSettings({ autoColumnSize: false });
      win.hot.updateSettings({ autoColumnSize: true });
    });
  }

  /**
   * Destroys the grid from inside the next `afterFontsLoad` hook, the way a framework teardown can.
   */
  async destroyGridDuringFontsLoad(): Promise<void> {
    await this.page.evaluate(() => {
      const win = window as unknown as { hot: FontLoadGrid };

      win.hot.addHook('afterFontsLoad', () => {
        win.hot.destroy();
      }, 100);
    });
  }

  /**
   * Counts the renders that happen inside the next `afterFontsLoad` hook: between a listener that runs ahead
   * of the plugins' own (a negative hook order) and one that runs after them. Read the count with
   * `rendersInsideFontsLoadHook()`.
   */
  async countRendersInsideFontsLoadHook(): Promise<void> {
    await this.page.evaluate(() => {
      const win = window as unknown as { hot: FontLoadGrid, htRendersInsideFontsLoadHook: number | null };
      let renders = 0;
      let rendersAtHookStart = 0;

      win.htRendersInsideFontsLoadHook = null;
      win.hot.addHook('afterRender', () => {
        renders += 1;
      });
      win.hot.addHook('afterFontsLoad', () => {
        rendersAtHookStart = renders;
      }, -100);
      win.hot.addHook('afterFontsLoad', () => {
        win.htRendersInsideFontsLoadHook = renders - rendersAtHookStart;
      }, 100);
    });
  }

  /**
   * Reads the count `countRendersInsideFontsLoadHook()` took, or `null` while the hook has not fired.
   */
  async rendersInsideFontsLoadHook(): Promise<number | null> {
    return this.page.evaluate(() => (window as unknown as { htRendersInsideFontsLoadHook: number | null })
      .htRendersInsideFontsLoadHook);
  }

  /**
   * Fires the `afterFontsLoad` hook by hand, without a font load, so only the plugins' listeners run and the
   * grid itself draws nothing afterwards. Counts the renders from then on; read the count with
   * `renderCount()` once `sweepInProgress()` is false. Resolves with whether AutoColumnSize's sweep is still
   * in progress once the hook returns, and whether the grid was visible, read in the same evaluation.
   */
  async runFontsLoadHookCountingRenders(): Promise<{ sweepInProgress: boolean, gridVisible: boolean }> {
    return this.page.evaluate(() => {
      const win = window as unknown as { hot: FontLoadGrid, htRenderCount: number };

      win.htRenderCount = 0;
      win.hot.addHook('afterRender', () => {
        win.htRenderCount += 1;
      });
      win.hot.runHooks('afterFontsLoad');

      return {
        sweepInProgress: win.hot.getPlugin('autoColumnSize').inProgress,
        gridVisible: win.hot.view.isVisible(),
      };
    });
  }

  /**
   * Reads the count `runFontsLoadHookCountingRenders()` keeps.
   */
  async renderCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { htRenderCount: number }).htRenderCount);
  }

  /**
   * Tells whether AutoColumnSize or AutoRowSize has a sweep in progress.
   */
  async sweepInProgress(plugin: 'autoColumnSize' | 'autoRowSize'): Promise<boolean> {
    return this.page.evaluate(name => (window as unknown as { hot: FontLoadGrid }).hot.getPlugin(name).inProgress, plugin);
  }

  /**
   * Takes every column away (`columns: []`), the way a wrapper can between two renders, or puts the
   * fixture's columns back.
   */
  async setColumnsPresent(present: boolean): Promise<void> {
    await this.page.evaluate((arePresent) => {
      const win = window as unknown as { hot: FontLoadGrid, htColumns: unknown };

      if (arePresent) {
        win.hot.updateSettings({ columns: win.htColumns });
      } else {
        win.htColumns = win.hot.getSettings().columns;
        win.hot.updateSettings({ columns: [] });
      }
    }, present);
  }

  /**
   * Draws the grid again, the way an application does after it shows the grid's container.
   */
  async render(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { hot: FontLoadGrid }).hot.render();
    });
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
