import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

/**
 * Page Object for the auto-size sampling-settings fixture (DEV-2850).
 *
 * The reader sees the effect of these options as row heights: a row whose tallest cell the sampler
 * skipped is measured too short, and its row-header number then slides away from its row. So the
 * assertions read the rendered geometry - the master body against the row-header overlay - and the
 * plugin's own measured heights, rather than only the settings the plugin stored.
 */
export class AutoSizeSamplingSettingsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly inlineStartOverlay: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.inlineStartOverlay = this.grid.locator('.ht_clone_inline_start');
  }

  /**
   * Raises the sampling ratio through `updateSettings()` and waits for the redraw it causes.
   *
   * @param {number} samplingRatio How many samples per value length to collect.
   */
  async setSamplingRatio(samplingRatio: number): Promise<void> {
    await this.#runAndAwaitRender(
      (ratio) => (window as unknown as {
        setSamplingRatio: (value: number) => void
      }).setSamplingRatio(ratio as number),
      samplingRatio
    );
  }

  /**
   * Changes an unrelated setting through `updateSettings()` and waits for the redraw it causes.
   *
   * The payload carries no `autoRowSize` key, which is the shape that used to reset the options set
   * above - see the fixture's own comment for why.
   */
  async changeUnrelatedSetting(): Promise<void> {
    await this.#runAndAwaitRender(
      () => (window as unknown as { changeUnrelatedSetting: () => void }).changeUnrelatedSetting()
    );
  }

  /**
   * The sample count the generator is actually using.
   *
   * The stored setting is not the same thing - the whole defect was a setting that arrived and was
   * never applied - so this reads the value the sampler will use.
   *
   * @returns {Promise<number>}
   */
  async sampleCount(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as { hot: {
      getPlugin(name: string): { samplesGenerator: { getSampleCount(): number } },
    } }).hot.getPlugin('autoRowSize').samplesGenerator.getSampleCount());
  }

  /**
   * The heights the plugin has measured, one per physical row.
   *
   * @returns {Promise<(number | null)[]>}
   */
  async measuredRowHeights(): Promise<(number | null)[]> {
    return this.page.evaluate(() => (window as unknown as { hot: {
      getPlugin(name: string): { rowHeightsMap: { getValues(): (number | null)[] } },
    } }).hot.getPlugin('autoRowSize').rowHeightsMap.getValues());
  }

  /**
   * The rendered height of every row in the master table.
   *
   * @returns {Promise<number[]>}
   */
  async renderedRowHeights(): Promise<number[]> {
    return this.grid.evaluate((root) => {
      const rows = [...root.querySelectorAll('.ht_master .wtHolder table tbody tr')];

      // A vacuous read would let every comparison below pass while measuring nothing.
      if (rows.length === 0) {
        throw new Error('No master rows rendered; the height measurement would be vacuous.');
      }

      return rows.map(row => Math.round(row.getBoundingClientRect().height * 100) / 100);
    });
  }

  /**
   * How far the row headers have drifted from their rows, in pixels - the largest disagreement
   * across every rendered row, counting both the row's height and where its top edge sits.
   *
   * @returns {Promise<number>} `0` when every row lines up.
   */
  async worstRowHeaderDrift(): Promise<number> {
    return this.grid.evaluate((root) => {
      const masterRows = [...root.querySelectorAll('.ht_master .wtHolder table tbody tr')];
      const cloneRows = [...root.querySelectorAll('.ht_clone_inline_start .wtHolder table tbody tr')];

      // Without these, an empty or short clone list would skip the loop and report a drift of 0 -
      // every assertion would pass while measuring nothing.
      if (masterRows.length === 0) {
        throw new Error('No master rows rendered; the drift measurement would be vacuous.');
      }
      if (masterRows.length !== cloneRows.length) {
        throw new Error(
          `Master rendered ${masterRows.length} rows but the row-header overlay rendered ` +
          `${cloneRows.length}; the two tables cannot be compared row by row.`
        );
      }

      let worst = 0;

      for (let i = 0; i < masterRows.length; i++) {
        const master = masterRows[i].getBoundingClientRect();
        const clone = cloneRows[i].getBoundingClientRect();

        worst = Math.max(
          worst,
          Math.abs(master.height - clone.height),
          Math.abs(master.top - clone.top)
        );
      }

      return worst;
    });
  }

  /**
   * Runs one of the fixture's settings helpers and waits until the grid has actually repainted.
   *
   * The draw counter is the signal rather than a fixed delay: `updateSettings()` redraws
   * synchronously, but the measurement that follows it can be scheduled, so the assertion has to
   * wait for a real event. Polling on a timer for the same reason `awaitBundle()` does - parallel
   * workers starve `requestAnimationFrame`.
   *
   * @param {Function} action The helper to call in the page.
   * @param {*} [argument] A single argument to forward to it.
   */
  async #runAndAwaitRender(action: (argument?: unknown) => void, argument?: unknown): Promise<void> {
    const before = await this.page.evaluate(() => (window as unknown as { renderCount: number }).renderCount);

    await this.page.evaluate(action, argument);

    await this.page.waitForFunction(
      (previous) => (window as unknown as { renderCount: number }).renderCount > (previous as number),
      before,
      { polling: BUNDLE_POLLING_MS }
    );
    // A second settled frame, so a measurement that landed on the following draw is included.
    await this.page.evaluate(() => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
  }

  /** Navigate and wait for the grid to have rendered - a real DOM condition, never a sleep. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/auto-size-sampling-settings.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    // The bundle first, or the leg would fail pointing at an overlay class instead of the real
    // cause. `awaitBundle()` owns both the `waitForFunction`-over-`expect` choice and the polling
    // interval - see its docstring for why each one matters.
    await awaitBundle(this.page);
    await expect(this.inlineStartOverlay).toBeVisible();
    await expect(this.grid.locator('.ht_master tbody tr').first()).toBeVisible();
  }
}
