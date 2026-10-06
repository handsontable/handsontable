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
   * Opens the fixture with the image responses held back and waits for the first draw.
   */
  async goto(): Promise<void> {
    const released = new Promise<void>((resolve) => {
      this.#release = resolve;
    });

    await this.page.route('**/fixture-image/*.svg', async(route) => {
      const row = Number(/(\d+)\.svg$/.exec(route.request().url())?.[1]);
      const height = 60 + row * 10;

      await released;
      await route.fulfill({
        contentType: 'image/svg+xml',
        body: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="${height}"></svg>`,
      });
    });

    await this.page.goto(
      `/tests/fixtures/demo/async-image-frozen-columns.html?theme=${this.theme}&bundle=${this.bundle}`,
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
   * Returns the rendered height of every body row of an overlay, in pixels.
   */
  async rowHeights(overlay: 'master' | 'clone_inline_start'): Promise<number[]> {
    return this.page.locator(`.ht_${overlay} tbody tr`).evaluateAll(
      rows => rows.map(row => Math.round(row.getBoundingClientRect().height))
    );
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
