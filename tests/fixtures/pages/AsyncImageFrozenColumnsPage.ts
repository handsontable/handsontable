import { type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface FixtureWindow {
  renderCount: number;
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

    await this.page.route('**/fixture-image/*.svg', async(route) => {
      const url = route.request().url();

      if (url.includes('missing-')) {
        await released;
        await route.fulfill({ status: 404, body: '' });

        return;
      }

      const row = Number(/(\d+)\.svg/.exec(url)?.[1]);
      const height = url.includes('small=1') ? 4 : 60 + row * 10;

      await released;
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
   * Lets the held image responses through.
   */
  releaseImages(): void {
    this.#release();
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
}
