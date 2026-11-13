import { type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * A box in viewport coordinates, as `getBoundingClientRect()` reports it.
 */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * The container, the grid's root and wrapper, the master holder, and which box scrolls, read in one
 * evaluation.
 */
export interface WrapperGeometry {
  container: Box;
  root: Box;
  wrapper: Box;
  holder: Box;
  scrollsDown: boolean;
  scrollsAcross: boolean;
  pageScrolls: boolean;
}

/**
 * Page object for `fixtures/demo/wrapper-size.html`, a grid sized 100% by 100% in a 500 x 400 px box.
 */
export class WrapperSizePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the first cell.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/wrapper-size.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.locator('.ht_master tbody td').first()).toBeVisible();
  }

  /**
   * Reads the boxes and the scroll owners in one evaluation.
   *
   * @returns {Promise<WrapperGeometry>}
   */
  async geometry(): Promise<WrapperGeometry> {
    return this.page.evaluate(() => {
      const box = (element: Element) => {
        const rect = element.getBoundingClientRect();

        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      };
      const hot = (window as unknown as { hot: { rootElement: HTMLElement; rootWrapperElement: HTMLElement } }).hot;
      const holder = document.querySelector('.ht_master .wtHolder') as HTMLElement;
      const scroller = document.scrollingElement as HTMLElement;

      return {
        container: box(document.querySelector('[data-testid="container"]') as HTMLElement),
        root: box(hot.rootElement),
        wrapper: box(hot.rootWrapperElement),
        holder: box(holder),
        scrollsDown: holder.scrollHeight > holder.clientHeight,
        scrollsAcross: holder.scrollWidth > holder.clientWidth,
        pageScrolls: scroller.scrollWidth > window.innerWidth || scroller.scrollHeight > window.innerHeight,
      };
    });
  }
}
