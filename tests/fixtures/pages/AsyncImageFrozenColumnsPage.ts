import { type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface FixtureWindow {
  renderCount: number;
  contentArrivals: number;
  contentBatches: number;
  drawsBeforeContent: number | null;
  arrivedSources: Set<string>;
}

interface DrawStats {
  draws: number;
  drawsBeforeContent: number | null;
  contentBatches: number;
}

/**
 * Page Object for the fixture whose renderer writes an `<img>` into a scrolling column beside frozen
 * columns (DEV-307). The page object holds every image response back until `releaseImages()`, so the
 * test controls exactly when the row heights change after the draw.
 */
export class AsyncImageFrozenColumnsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  #release: () => void = () => {};
  #heldReleases = new Map<string, () => void>();
  #heldGates = new Map<string, Promise<void>>();

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture with the image responses held back and waits for the first draw. A `variant` is
   * extra query parameters such as `&auto=1` (see the fixture).
   */
  async goto(variant = ''): Promise<void> {
    const released = new Promise<void>((resolve) => {
      this.#release = resolve;
    });
    const gate = async(url: string) => {
      await released;

      const held = [...this.#heldGates].find(([source]) => url.endsWith(source));

      if (held) {
        await held[1];
      }
    };

    // The trailing `*` keeps the `?small=1` URLs routed: a glob must match the whole URL, query included.
    await this.page.route('**/fixture-image/*.svg*', async(route) => {
      const url = route.request().url();

      if (url.includes('missing-')) {
        await gate(url);
        await route.fulfill({ status: 404, body: '' });

        return;
      }

      const row = Number(/(\d+)\.svg/.exec(url)?.[1]);
      const height = url.includes('small=1') ? 4 : 60 + row * 10;

      await gate(url);
      await route.fulfill({
        contentType: 'image/svg+xml',
        body: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="${height}"></svg>`,
      });
    });

    await this.page.goto(
      `/tests/fixtures/demo/async-image-frozen-columns.html?theme=${this.theme}&bundle=${this.bundle}${variant}`,
      // The default `load` would wait for the held images, which only `releaseImages()` lets through.
      { waitUntil: 'domcontentloaded' }
    );
    await awaitBundle(this.page);
    await expect(this.page.locator('.ht_master tbody tr').first()).toBeVisible();
  }

  /**
   * Lets the held image responses through. Each response whose URL ends with one of `holdBack` stays held
   * until `releaseHeldImage()` names it.
   */
  releaseImages({ holdBack = [] }: { holdBack?: string[] } = {}): void {
    holdBack.forEach((source) => {
      this.#heldGates.set(source, new Promise<void>((resolve) => {
        this.#heldReleases.set(source, resolve);
      }));
    });
    this.#release();
  }

  /**
   * Lets one response kept by `releaseImages({ holdBack })` through.
   */
  releaseHeldImage(source: string): void {
    this.#heldReleases.get(source)?.();
  }

  /**
   * Returns the rendered height of every body row of the master and of the frozen overlays, read in one
   * evaluation so all of them come from the same layout.
   */
  async rowHeights(): Promise<{ master: number[], frozen: number[], frozenEnd: number[] }> {
    return this.page.evaluate(() => {
      const heights = (selector: string) => [...document.querySelectorAll(selector)]
        .map(row => Math.round(row.getBoundingClientRect().height));

      return {
        master: heights('.ht_master tbody tr'),
        frozen: heights('.ht_clone_inline_start tbody tr'),
        frozenEnd: heights('.ht_clone_inline_end tbody tr'),
      };
    });
  }

  /**
   * Tells whether every frozen overlay that renders rows is as tall as the master, row by row.
   */
  async overlaysMatchMaster(): Promise<boolean> {
    const { master, frozen, frozenEnd } = await this.rowHeights();

    return [frozen, frozenEnd].every(rows => rows.length === 0 || rows.join() === master.join());
  }

  /**
   * Returns how many times the grid has drawn.
   */
  async renderCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).renderCount);
  }

  /**
   * Returns the draw count together with what bounds it, read in one evaluation: the draws made before
   * the first image arrived, and the batches (animation frames in which at least one image source arrived
   * for the first time). The grid redraws at most once per batch, so the draws
   * after the first arrival cannot outnumber the batches. That holds while nothing but arriving images
   * makes the grid draw, as in this fixture (a fixed-size container, no stretching).
   */
  async drawStats(): Promise<DrawStats> {
    return this.page.evaluate(() => {
      const { renderCount, drawsBeforeContent, contentBatches } = window as unknown as FixtureWindow;

      return { draws: renderCount, drawsBeforeContent, contentBatches };
    });
  }

  /**
   * Returns how many image sources have loaded or failed at least once in the grid.
   */
  async contentArrivals(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).contentArrivals);
  }

  /**
   * Returns how many images in the rendered master rows have a source that has not arrived yet.
   */
  async imagesYetToArrive(): Promise<number> {
    return this.page.evaluate(() => {
      const { arrivedSources } = window as unknown as FixtureWindow;

      return [...document.querySelectorAll('.ht_master tbody img')]
        .filter(image => !arrivedSources.has(image.getAttribute('src') ?? '')).length;
    });
  }

  /**
   * Tells whether the draw count stays the same over the given number of frames, read in one evaluation.
   */
  async drawsHoldStill(frames: number): Promise<boolean> {
    return this.page.evaluate(async(count) => {
      const fixture = window as unknown as FixtureWindow;
      const before = fixture.renderCount;

      for (let i = 0; i < count; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
      }

      return fixture.renderCount === before;
    }, frames);
  }

  /**
   * Resolves after the browser has painted the given number of frames, so work queued by a load or an
   * observer callback has had its turn. Counts frames, not milliseconds.
   */
  async waitForFrames(frames: number): Promise<void> {
    await this.page.evaluate(async(count) => {
      for (let i = 0; i < count; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
    }, frames);
  }

  /**
   * Scrolls the grid so the given row is rendered. The caller waits for the row header to change.
   */
  async scrollToRow(row: number): Promise<void> {
    await this.page.evaluate((target) => {
      (window as unknown as { hot: { scrollViewportTo(options: { row: number }): void } }).hot
        .scrollViewportTo({ row: target });
    }, row);
  }

  /**
   * Returns the text of the first rendered row header of the master.
   */
  async firstRowHeader(): Promise<string> {
    return this.page.evaluate(
      () => document.querySelector('.ht_master tbody tr th')?.textContent ?? ''
    );
  }
}
