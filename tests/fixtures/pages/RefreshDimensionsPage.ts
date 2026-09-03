import { type Locator, type Page, expect } from '@playwright/test';

export interface HookLogEntry {
  hook: 'before' | 'after';
  prev: { width: number; height: number };
  curr: { width: number; height: number };
  action: boolean;
}

interface HandsontableFixture {
  rootElement: HTMLElement;
}

interface FixtureWindow extends Window {
  hot: HandsontableFixture;
  htHookLog: HookLogEntry[];
  htWarnLog: string[];
  buildMainGrid(options?: { blockRefresh?: boolean }): void;
  buildDvhGrid(): void;
  buildIframeGrid(options?: {
    width?: number; height?: number; blockRefresh?: boolean; columns?: number;
  }): Promise<void>;
}

/**
 * Page Object for the fixture that exercises the `beforeRefreshDimensions` and
 * `afterRefreshDimensions` hooks - the ResizeObserver pipeline of a sized grid in the main
 * document, and the window-resize pipeline of a grid living inside an iframe.
 */
export class RefreshDimensionsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the bundle. No grid exists yet - each test builds exactly one
   * through `buildMainGrid()` or `buildIframeGrid()`.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/refresh-dimensions.html?theme=${this.theme}&bundle=${this.bundle}`);
    await this.page.waitForFunction(() => 'Handsontable' in window);
  }

  /**
   * Builds the sized grid in the main document and waits for its first cell to render.
   */
  async buildMainGrid(options: { blockRefresh?: boolean } = {}): Promise<void> {
    await this.page.evaluate(opts => (window as unknown as FixtureWindow).buildMainGrid(opts), options);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Builds the grid whose parent is sized in dynamic units (`dvh`), the shape that makes the
   * ResizeObserver callback re-trigger itself indefinitely. Waits only for the first cell - the point
   * of the fixture is that the pipeline never settles, so there is no quiet state to wait for.
   */
  async buildDvhGrid(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).buildDvhGrid());
    await expect(this.page.locator('#dvh-parent .ht_master td').first()).toBeVisible();
  }

  /**
   * Returns the `console.warn` messages the library printed since the page loaded that contain the
   * given fragment. Filtered rather than returned whole, so an unrelated warning a future release adds
   * cannot turn a "warned exactly once" assertion red.
   */
  async warnLog(fragment: string): Promise<string[]> {
    return this.page.evaluate(
      match => (window as unknown as FixtureWindow).htWarnLog.filter(message => message.includes(match)),
      fragment,
    );
  }

  /**
   * Returns how many times ONE hook fired. The cheap probe for a pipeline whose deliveries are
   * counted rather than inspected.
   */
  async hookCount(hook: 'before' | 'after'): Promise<number> {
    return this.page.evaluate(
      which => (window as unknown as FixtureWindow).htHookLog.filter(item => item.hook === which).length,
      hook,
    );
  }

  /**
   * Builds the window-scroll grid inside the iframe and waits for it to render. The fixture
   * resolves only after the iframe's copied stylesheets loaded, so the grid's first measurement
   * already reflects the final CSS.
   */
  async buildIframeGrid(
    options: { width?: number; height?: number; blockRefresh?: boolean; columns?: number } = {},
  ): Promise<void> {
    await this.page.evaluate(opts => (window as unknown as FixtureWindow).buildIframeGrid(opts), options);
    await expect.poll(() => this.iframeCellCount()).toBeGreaterThan(0);
  }

  /**
   * Counts the columns rendered in the iframe grid's first data row. With a data set wider than
   * the iframe, horizontal virtualization ties this number to the viewport width the last
   * dimensions refresh adopted - the render-level effect of the window-resize pipeline.
   */
  async iframeRenderedColumnCount(): Promise<number> {
    return this.page.evaluate(() => {
      const doc = document.querySelector<HTMLIFrameElement>('[data-testid="frame"]')!.contentDocument!;

      return doc.querySelectorAll('.ht_master .htCore tbody tr:first-child td').length;
    });
  }

  /**
   * Returns a main-grid data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Returns every hook invocation recorded since the last `clearHookLog()`.
   */
  async hookLog(): Promise<HookLogEntry[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htHookLog);
  }

  /**
   * Returns how many hook invocations are recorded. The cheap probe for `expect.poll`.
   */
  async hookLogLength(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htHookLog.length);
  }

  /**
   * Returns the most recent invocation of ONE hook, or `null` when it has not fired yet. The probe
   * to poll when a trigger may deliver more than once: taking the array's last element from a
   * separate round trip races a further before/after pair landing in between, whereas the last
   * `after` entry is the latest COMPLETED refresh whatever else arrives (DEV-2744 review).
   */
  async lastEntry(hook: 'before' | 'after'): Promise<HookLogEntry | null> {
    return this.page.evaluate(
      which => (window as unknown as FixtureWindow).htHookLog.filter(item => item.hook === which).at(-1) ?? null,
      hook,
    );
  }

  /**
   * Empties the hook log, so what a case asserts afterwards can only have come from that case's
   * own trigger - never from the observer's initial delivery during the build.
   */
  async clearHookLog(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as FixtureWindow).htHookLog.length = 0;
    });
  }

  /**
   * Resizes the main grid's root element, which the ResizeObserver pipeline reacts to. Returns
   * the hook-log length read SYNCHRONOUSLY after the mutation, in the same task - the observable
   * form of the legacy rAF-sync contract: a resize never fires the hooks synchronously, only on a
   * later frame.
   */
  async resizeRoot(width: number): Promise<number> {
    return this.page.evaluate(px => {
      const fixtureWindow = window as unknown as FixtureWindow;

      fixtureWindow.hot.rootElement.style.width = `${px}px`;

      return fixtureWindow.htHookLog.length;
    }, width);
  }

  /**
   * Toggles the main grid root element's `display` property.
   */
  async setRootDisplay(value: string): Promise<void> {
    await this.page.evaluate(display => {
      (window as unknown as FixtureWindow).hot.rootElement.style.display = display;
    }, value);
  }

  /**
   * Toggles the document body's `display` property - the ancestor-hidden variant of the guard.
   */
  async setBodyDisplay(value: string): Promise<void> {
    await this.page.evaluate(display => {
      document.body.style.display = display;
    }, value);
  }

  /**
   * Resizes the iframe element, which resizes the iframe's WINDOW and drives the window-resize
   * pipeline of the grid inside it.
   */
  async setIframeWidth(width: number): Promise<void> {
    await this.page.evaluate(px => {
      document.querySelector<HTMLIFrameElement>('[data-testid="frame"]')!.width = String(px);
    }, width);
  }

  /**
   * Waits for the given number of animation frames INSIDE the page. This is the bounded settle for
   * a NEGATIVE assertion only - "the pipeline had its delivery chance and stayed quiet" - and every
   * use must be paired with a positive control that proves the machinery was alive. Positive
   * assertions poll the hook log instead.
   */
  async afterAnimationFrames(count: number): Promise<void> {
    await this.page.evaluate(frames => new Promise<void>(resolve => {
      const step = (left: number) => {
        if (left <= 0) {
          resolve();

          return;
        }
        requestAnimationFrame(() => step(left - 1));
      };

      step(frames);
    }), count);
  }

  /**
   * Measures the main grid's scroll holder width - the observable effect of a dimensions refresh
   * having (or having not) adapted the view to a new root size.
   */
  async mainHolderWidth(): Promise<number> {
    return this.page.evaluate(
      () => document.querySelector<HTMLElement>('#grid .ht_master .wtHolder')!.offsetWidth,
    );
  }

  /**
   * Counts rendered cells inside the iframe grid. Render-readiness probe for `buildIframeGrid()`.
   */
  async iframeCellCount(): Promise<number> {
    return this.page.evaluate(() => {
      const doc = document.querySelector<HTMLIFrameElement>('[data-testid="frame"]')!.contentDocument!;

      return doc.querySelectorAll('.ht_master td').length;
    });
  }

  /**
   * Measures the iframe viewport and the iframe grid at assertion time: the scrollbar-less
   * viewport width the window-resize refresh should have adopted (`clientWidth`, not
   * `innerWidth` - the refresh works in layout space), and the root element's rendered size.
   */
  async measuredIframe(): Promise<{ viewportWidth: number; rootWidth: number; rootHeight: number }> {
    return this.page.evaluate(() => {
      const frame = document.querySelector<HTMLIFrameElement>('[data-testid="frame"]')!;
      const root = (window as unknown as FixtureWindow).hot.rootElement;

      return {
        viewportWidth: frame.contentDocument!.documentElement.clientWidth,
        rootWidth: root.offsetWidth,
        rootHeight: root.offsetHeight,
      };
    });
  }
}
