import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the hidden-init destroy-race fixture (`hidden-init.html`).
 *
 * The fixture builds a grid inside a `display: none` container, shows it, and
 * destroys it inside the `IntersectionObserver` delivery window (DEV-2210).
 * Nothing is built at navigation time — `runDestroyRace()` triggers the whole
 * sequence in-page so the rAF/setTimeout ordering stays exact.
 */
export class HiddenInitPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly status: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.status = page.getByTestId('status');
  }

  /**
   * Navigate to the fixture. Waits only for the document `load` event — there
   * is no visible cell to wait on (the grid starts hidden and is destroyed),
   * and a load-time failure must surface as a page error rather than as an
   * opaque locator timeout.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/hidden-init.html?theme=${this.theme}&bundle=${this.bundle}`);
  }

  /**
   * Build the grid hidden, show it, and destroy it inside the observer
   * delivery window. Returns once the sequence has been kicked off; the
   * post-destroy frames are awaited through `expectSettled()`.
   */
  async runDestroyRace(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as {
      runHiddenInitDestroyRace(): void;
    }).runHiddenInitDestroyRace());
  }

  /**
   * Wait until the pending observer delivery has had several frames to land
   * after `destroy()`.
   */
  async expectSettled(): Promise<void> {
    await expect(this.status).toHaveText('settled');
  }

  /**
   * Whether the grid really did initialize while its container was invisible —
   * proves the hidden-init code path was exercised, not silently skipped.
   */
  async wasHiddenAtInit(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as { htHiddenAtInit: boolean }).htHiddenAtInit);
  }
}
