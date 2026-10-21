import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page object for taps on renderer controls (DEV-332, DEV-891).
 *
 * The spec uses a phone device profile, so Walkontable registers touch listeners
 * only. `data-clicks` on each control is incremented by that control's click listener.
 */
export class TouchInteractiveCellPage {
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
   * Navigate to the fixture and wait until every control is on screen.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/touch-interactive-cell.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await expect(this.control('button-off')).toBeVisible();
    await expect(this.control('file-input')).toBeVisible();
    await expect(this.control('file-label-text')).toBeVisible();
    await expect(this.control('button-on')).toBeVisible();
    await expect(this.control('cell-link')).toBeVisible();
    await expect(this.control('button-blocked')).toBeVisible();
  }

  /**
   * A control or the outside barrier, by its test id.
   */
  control(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Tap a control. Chromium synthesizes a click after `touchend` when the event is not cancelled.
   */
  async tap(testId: string): Promise<void> {
    await this.control(testId).tap();
  }

  /**
   * Read the click count a control's own listener recorded.
   */
  async clickCount(testId: string): Promise<number> {
    const raw = await this.control(testId).getAttribute('data-clicks');

    return Number(raw ?? '0');
  }

  /**
   * Wait until a control's click count reaches `expected`. The synthesized click is the
   * settle signal for a tap that was allowed through.
   */
  async expectClicks(testId: string, expected: number): Promise<void> {
    await expect.poll(() => this.clickCount(testId)).toBe(expected);
  }

  /**
   * Exact read of a click count. Call it after a positive settle (`expectClicks` or the barrier).
   */
  async expectClicksExact(testId: string, expected: number): Promise<void> {
    expect(await this.clickCount(testId)).toBe(expected);
  }

  /**
   * Record each `touchend` after the grid's listener, so `defaultPrevented` is the grid's decision.
   */
  async installTouchEndLog(): Promise<void> {
    await this.page.evaluate(() => {
      const target = window as Window & { touchEndPrevented: boolean[] };

      target.touchEndPrevented = [];
      document.addEventListener('touchend', (event) => {
        target.touchEndPrevented.push(event.defaultPrevented);
      });
    });
  }

  /**
   * Whether each `touchend` since `installTouchEndLog` was cancelled.
   */
  async touchEndPrevented(): Promise<boolean[]> {
    return this.page.evaluate(() => {
      const target = window as Window & { touchEndPrevented?: boolean[] };

      return target.touchEndPrevented ?? [];
    });
  }

  /**
   * Wait until the recorded `touchend` decisions equal `expected`.
   */
  async expectTouchEndsPrevented(expected: boolean[]): Promise<void> {
    await expect.poll(() => this.touchEndPrevented()).toEqual(expected);
  }

  /**
   * The engine flags the grid cached at load. `isIOS` reads `navigator.platform`, which a
   * user-agent override does not change on its own.
   */
  async engineFlags(): Promise<{ ios: boolean; chromeWebKit: boolean }> {
    return this.page.evaluate(() => {
      const helper = (window as unknown as {
        Handsontable: { helper: { isIOS: () => boolean; isChromeWebKit: () => boolean } };
      }).Handsontable.helper;

      return { ios: helper.isIOS(), chromeWebKit: helper.isChromeWebKit() };
    });
  }

  /**
   * Click the button outside the grid. `outsideClickDeselects` is off, so this does not
   * clear the cell the tap selected. Its own click is the positive barrier: it is issued
   * after the tap, so a click the tap still owed has already been delivered.
   */
  async clickBarrier(): Promise<void> {
    await this.control('barrier').click();
    await expect.poll(() => this.clickCount('barrier')).toBeGreaterThan(0);
  }
}
