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
   * Point the cached browser helpers at iOS Chrome or iOS Firefox. Listeners are already
   * registered. `onTouchEnd` reads `isIOS` and the WebKit flags when the gesture ends.
   */
  async stubIosWebKit(engine: 'chrome' | 'firefox'): Promise<void> {
    const userAgent = engine === 'chrome'
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.108 Mobile/15E148 Safari/604.1'
      : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15';

    const detected = await this.page.evaluate((ua) => {
      window.Handsontable.helper.setBrowserMeta({ userAgent: ua });
      window.Handsontable.helper.setPlatformMeta({ platform: 'iPhone' });

      return {
        ios: window.Handsontable.helper.isIOS(),
        chrome: window.Handsontable.helper.isChromeWebKit(),
        firefox: window.Handsontable.helper.isFirefoxWebKit(),
      };
    }, userAgent);

    expect(detected.ios).toBe(true);
    expect(detected.chrome).toBe(engine === 'chrome');
    expect(detected.firefox).toBe(engine === 'firefox');
  }

  /**
   * Dispatch a script `touchstart` and `touchend` on a data cell and report whether
   * `touchend` was cancelled. Row 1 of the visual-selection-off columns is plain text.
   */
  async touchEndOnCell(row: number, col: number): Promise<boolean> {
    return this.page.evaluate(({ row: cellRow, col: cellCol }) => {
      const td = window.hot.getCell(cellRow, cellCol);

      if (!td) {
        throw new Error(`no cell at ${cellRow},${cellCol}`);
      }

      const rect = td.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const touch = new Touch({
        identifier: 1,
        target: td,
        clientX: x,
        clientY: y,
        pageX: x + window.scrollX,
        pageY: y + window.scrollY,
      });
      const init = (ended: boolean): TouchEventInit => ({
        bubbles: true,
        cancelable: true,
        composed: true,
        touches: ended ? [] : [touch],
        targetTouches: ended ? [] : [touch],
        changedTouches: [touch],
      });

      td.dispatchEvent(new TouchEvent('touchstart', init(false)));

      const end = new TouchEvent('touchend', init(true));

      td.dispatchEvent(end);

      return end.defaultPrevented;
    }, { row, col });
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
