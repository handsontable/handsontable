import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/**
 * Page Object for the scroll-owner-change listeners fixture.
 */
export class ScrollOwnerChangeListenersPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly root: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.root = page.getByTestId('grid');
  }

  /**
   * Navigates to the fixture and waits for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/scroll-owner-change-listeners.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell, by visual row and column.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Starts recording every listener added to the window, the document and the document element,
   * and counts the calls of the engine's scrollable-element update.
   */
  async startRecording(): Promise<void> {
    await this.page.evaluate(() => {
      const w = window as any;
      const overlays = w.hot.view._wt.wtOverlays;
      const original = overlays.updateMainScrollableElements;

      w.addedPageListeners = [];
      w.scrollableElementUpdates = 0;

      [window, document, document.documentElement].forEach((target) => {
        const add = target.addEventListener;

        target.addEventListener = function(type: string, ...rest: unknown[]) {
          w.addedPageListeners.push(type);

          return (add as any).call(this, type, ...rest);
        } as typeof target.addEventListener;
      });

      overlays.updateMainScrollableElements = function(...args: unknown[]) {
        w.scrollableElementUpdates += 1;

        return original.apply(this, args);
      };
    });
  }

  /**
   * The event names added to the window, the document and the document element since recording
   * started.
   */
  async addedPageListeners(): Promise<string[]> {
    return this.page.evaluate(() => (window as any).addedPageListeners);
  }

  /**
   * How many times the engine re-picked the scrollable elements since recording started.
   */
  async scrollableElementUpdates(): Promise<number> {
    return this.page.evaluate(() => (window as any).scrollableElementUpdates);
  }

  /**
   * Turns pagination on, with every row on one page so the grid still scrolls.
   */
  async enablePagination(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).hot.updateSettings({ pagination: { pageSize: 100 } });
    });
  }

  /**
   * The vertical scroll offsets of the master holder and the row-header clone holder.
   */
  async verticalOffsets(): Promise<{ master: number, rowHeaders: number }> {
    return this.page.evaluate(() => {
      const root = (window as any).hot.rootElement as HTMLElement;
      const master = root.querySelector('.ht_master .wtHolder') as HTMLElement;
      const rowHeaders = root.querySelector('.ht_clone_inline_start .wtHolder') as HTMLElement;

      return { master: master.scrollTop, rowHeaders: rowHeaders.scrollTop };
    });
  }

  /**
   * Scrolls the grid with the mouse wheel over its center.
   */
  async wheelOverGrid(deltaY: number): Promise<void> {
    await this.cell(1, 1).hover();
    await this.page.mouse.wheel(0, deltaY);
  }
}
