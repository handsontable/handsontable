import { type Page, type Locator, type FrameLocator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, assertKnownBundle, type Bundle } from '../bundle';

/**
 * A range the grid reports, `[fromRow, fromCol, toRow, toCol]`.
 */
type SelectedRange = [number, number, number, number];

/**
 * The part of the parent window this page object reads.
 */
interface FixtureWindow {
  announcementLog: string[];
  frameDoc: Document;
  hot: {
    getSelected(): SelectedRange[] | undefined;
  };
}

/**
 * Page Object for the cross-realm selection-announcement fixture: a 10 x 6 grid whose DOM lives in an
 * iframe, built by the parent page's `Handsontable`.
 *
 * The live regions are created in the iframe document, so the log is read there. Time is frozen with
 * {@link SelectionAnnouncementIframePage#freezeTime}; the announcer's timers are the parent realm's, which
 * the page clock drives.
 */
export class SelectionAnnouncementIframePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    assertKnownBundle(bundle, '(page, theme, bundle)');
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for the grid to render inside the iframe.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/selection-announcement-iframe.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
    await expect(this.frame().locator('[role="status"][aria-live="polite"]')).toHaveCount(1);
  }

  /**
   * The iframe the grid lives in.
   *
   * @returns {FrameLocator}
   */
  frame(): FrameLocator {
    return this.page.frameLocator('[data-testid="frame"]');
  }

  /**
   * A data cell of the master table.
   *
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   * @returns {Locator}
   */
  cell(row: number, col: number): Locator {
    return this.frame().locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Installs a fake clock and pauses it, so no timer runs until {@link SelectionAnnouncementIframePage#advance}.
   */
  async freezeTime(): Promise<void> {
    await this.page.clock.install();
    await this.page.clock.pauseAt(Date.now() + 5000);
  }

  /**
   * Runs the frozen clock forward, firing every timer due in that span.
   *
   * @param {number} ms Milliseconds to advance.
   */
  async advance(ms: number): Promise<void> {
    await this.page.clock.runFor(ms);
  }

  /**
   * Start recording every message written to the polite live region of the iframe document.
   */
  async recordAnnouncements(): Promise<void> {
    await this.page.evaluate(() => {
      const fixture = window as unknown as FixtureWindow;
      const region = fixture.frameDoc.querySelector('[role="status"][aria-live="polite"]') as HTMLElement;
      const log: string[] = [];

      fixture.announcementLog = log;
      new MutationObserver(() => {
        if (region.textContent) {
          log.push(region.textContent);
        }
      }).observe(region, { childList: true, characterData: true, subtree: true });
    });
  }

  /**
   * Every message written to the polite live region since {@link SelectionAnnouncementIframePage#recordAnnouncements}.
   *
   * @returns {Promise<string[]>}
   */
  announcements(): Promise<string[]> {
    return this.page.evaluate(() => [...(window as unknown as FixtureWindow).announcementLog]);
  }

  /**
   * The selection the grid reports.
   *
   * @returns {Promise<SelectedRange[]>}
   */
  selected(): Promise<SelectedRange[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected() ?? []);
  }
}
