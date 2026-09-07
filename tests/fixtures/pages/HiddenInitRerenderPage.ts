import { type Locator, type Page } from '@playwright/test';

export type HiddenScenario = 'inline-root' | 'inline-parent' | 'stylesheet-root' | 'stylesheet-parent';

export interface RevealGeometry {
  topHolderHeight: number;
  topHeaderHeight: number;
  topHolderWidth: number;
  topCoreWidth: number;
  headerWidths: number[];
  firstRowCellWidths: number[];
}

interface HandsontableFixture {
  rootElement: HTMLElement;
  getCell(row: number, col: number, topmost?: boolean): HTMLElement | null;
  countCols(): number;
}

interface FixtureWindow extends Window {
  hot: HandsontableFixture;
  revealGrid(): void;
  Handsontable: {
    dom: {
      observeVisibilityChangeOnce(element: HTMLElement, callback: () => void): void;
    };
  };
  htVisibilityProbe?: {
    calls: number[];
    disconnects: number;
    unobserves: number;
    activeObservers: number;
  };
}

/**
 * Page Object for the fixture that initializes a grid inside a hidden container - in the four
 * hiding shapes core's hidden-init branch must recover from - and reveals it. Also hosts the
 * probes for the `observeVisibilityChangeOnce` DOM helper the mechanism is built on.
 */
export class HiddenInitRerenderPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly hidden: HiddenScenario;

  constructor(page: Page, theme = 'main', bundle = 'umd', hidden: HiddenScenario = 'inline-root') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.hidden = hidden;
  }

  /**
   * Opens the fixture; the grid is built at parse time, inside the hidden container.
   *
   * The wait polls on a TIMER, not the default rAF (a throttled or busy page can starve rAF
   * callbacks long past the timeout), accepts a captured constructor throw as a terminal state,
   * and on timeout rethrows with a page snapshot - so a failed build is diagnosable from the CI
   * report alone.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/hidden-init-rerender.html?theme=${this.theme}&bundle=${this.bundle}&hidden=${this.hidden}`,
    );

    try {
      await this.page.waitForFunction(
        () => 'hot' in window || 'htBuildError' in window, undefined, { polling: 100 },
      );
    } catch (timeoutError) {
      const snapshot = await this.page.evaluate(() => ({
        readyState: document.readyState,
        handsontable: typeof (window as { Handsontable?: unknown }).Handsontable,
        stylesheets: document.styleSheets.length,
      })).catch(() => 'page unreachable');

      throw new Error(`The fixture never built its grid; page snapshot: ${JSON.stringify(snapshot)}`,
        { cause: timeoutError });
    }

    const buildError = await this.page.evaluate(
      () => (window as { htBuildError?: string }).htBuildError ?? null,
    );

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Whether the grid's root element currently has no layout box - the premise every reveal test
   * must pin before revealing, or the scenario silently degrades into a plain visible init.
   */
  async isGridHidden(): Promise<boolean> {
    return this.page.evaluate(
      () => (window as unknown as FixtureWindow).hot.rootElement.offsetParent === null,
    );
  }

  /**
   * Reveals the grid with an inline `display: block` on whatever the scenario hid.
   */
  async reveal(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).revealGrid());
  }

  /**
   * How many pixels tall the top-clone holder currently is. Zero until the visibility-triggered
   * rerender ran, which makes it the poll probe for "the reveal was processed".
   */
  async topHolderHeight(): Promise<number> {
    return this.page.evaluate(() => {
      const holder = document.querySelector<HTMLElement>('.ht_clone_top .wtHolder');

      return holder ? holder.getBoundingClientRect().height : 0;
    });
  }

  /**
   * Measures everything the reveal assertions compare, in one evaluate so all values describe the
   * same rendered frame. Widths come from `getBoundingClientRect()` on both sides of every
   * comparison, so stretched fractional widths compare exactly.
   */
  async revealGeometry(): Promise<RevealGeometry> {
    return this.page.evaluate(() => {
      const fixtureWindow = window as unknown as FixtureWindow;
      const hot = fixtureWindow.hot;
      const holder = document.querySelector<HTMLElement>('.ht_clone_top .wtHolder')!;
      const core = document.querySelector<HTMLElement>('.ht_clone_top .htCore')!;
      const columns = Array.from({ length: hot.countCols() }, (unused, index) => index);
      const width = (element: HTMLElement | null): number =>
        (element ? element.getBoundingClientRect().width : -1);

      return {
        topHolderHeight: holder.getBoundingClientRect().height,
        topHeaderHeight: hot.getCell(-1, 0, true)!.getBoundingClientRect().height,
        topHolderWidth: holder.getBoundingClientRect().width,
        topCoreWidth: core.getBoundingClientRect().width,
        headerWidths: columns.map(index => width(hot.getCell(-1, index, true))),
        firstRowCellWidths: columns.map(index => width(hot.getCell(0, index, true))),
      };
    });
  }

  /**
   * Waits for the given number of animation frames INSIDE the page - the bounded settle for a
   * negative assertion (here: once-ness), always paired with a positive poll that proved the
   * machinery delivered.
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
   * Starts the plain `observeVisibilityChangeOnce` probe: `count` hidden elements get an observer
   * each (through an IntersectionObserver wrapper that counts constructions, disconnects, and
   * unobserves), then every element is toggled visible - after `flickers` extra hide/show rounds
   * on each, which is how the once-ness case provokes a second delivery.
   */
  async startVisibilityProbe(options: { count?: number; flickers?: number; zeroHeightBody?: boolean } = {},
  ): Promise<void> {
    await this.page.evaluate(({ count = 1, flickers = 0, zeroHeightBody = false }) => {
      const fixtureWindow = window as unknown as FixtureWindow;
      const NativeIntersectionObserver = window.IntersectionObserver;
      const probe = {
        calls: Array.from({ length: count }, () => 0),
        disconnects: 0,
        unobserves: 0,
        activeObservers: 0,
      };

      fixtureWindow.htVisibilityProbe = probe;

      // Counting wrapper, not a stub: the real observer still runs, the probe only records what
      // the helper does with it.
      (window as { IntersectionObserver: unknown }).IntersectionObserver =
        function(callback: IntersectionObserverCallback, observerOptions?: IntersectionObserverInit) {
          const observer = new NativeIntersectionObserver(callback, observerOptions);
          const originalDisconnect = observer.disconnect.bind(observer);
          const originalUnobserve = observer.unobserve.bind(observer);

          probe.activeObservers += 1;
          observer.disconnect = () => {
            probe.disconnects += 1;
            probe.activeObservers -= 1;
            originalDisconnect();
          };
          observer.unobserve = (target: Element) => {
            probe.unobserves += 1;
            originalUnobserve(target);
          };

          return observer;
        };

      if (zeroHeightBody) {
        document.body.style.height = '0px';
        document.body.style.overflow = 'hidden';
      }

      for (let index = 0; index < count; index++) {
        const element = document.createElement('div');

        element.style.display = 'none';
        document.body.appendChild(element);

        fixtureWindow.Handsontable.dom.observeVisibilityChangeOnce(element, () => {
          probe.calls[index] += 1;
        });

        element.style.display = 'block';

        for (let flicker = 0; flicker < flickers; flicker++) {
          element.style.display = 'none';
          element.style.display = 'block';
        }
      }
    }, options);
  }

  /**
   * Reads the probe counters started by `startVisibilityProbe()`.
   */
  async visibilityProbe(): Promise<{
    calls: number[]; disconnects: number; unobserves: number; activeObservers: number;
  }> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htVisibilityProbe!);
  }
}
