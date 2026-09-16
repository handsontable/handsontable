import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The clones whose holders the engine scrolls, plus the corner that stays `overflow: hidden` and the
 * master as the reference.
 */
export type HolderName = 'master' | 'inline_start' | 'top' | 'bottom' | 'top_inline_start_corner';

/**
 * What a holder's computed style and box report.
 */
export interface HolderBox {
  overflowX: string;
  overflowY: string;
  scrollbarWidth: string;
  tabIndex: number;
  /** `offsetWidth - clientWidth`: the space a vertical scrollbar takes inside the box. */
  scrollbarGutterX: number;
  /** `offsetHeight - clientHeight`: the space a horizontal scrollbar takes inside the box. */
  scrollbarGutterY: number;
}

/**
 * The scroll offsets of the master and the three scroll-mirrored clone holders.
 */
export interface HolderOffsets {
  master: { top: number; left: number };
  inlineStart: { top: number; left: number };
  top: { top: number; left: number };
  bottom: { top: number; left: number };
}

/**
 * Page Object for the clone-holder fixture (DEV-2937): one grid with frozen rows at both ends and
 * frozen columns, element-scrolled (`?mode=element`, the default) or window-scrolled
 * (`?mode=window`).
 */
export class CloneHolderScrollPage {
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
   * Navigate and wait for the grid to render - a real DOM condition, never a sleep.
   *
   * @param {'element' | 'window'} mode Which scroll mode the fixture builds.
   */
  async goto(mode: 'element' | 'window' = 'element'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/clone-holder-scroll.html?theme=${this.theme}&bundle=${this.bundle}&mode=${mode}`
    );
    // The bundle first, through the shared helper: it owns both the `waitForFunction`-over-`expect`
    // choice and the polling interval, so neither is re-inlined here.
    await awaitBundle(this.page);
    await expect(this.grid.locator('.ht_master table.htCore tbody > tr').first()).toBeVisible();
    await expect(this.grid.locator('.ht_clone_bottom table.htCore tbody > tr').first()).toBeVisible();
  }

  /**
   * The selector of a holder: the master's, or a clone's (`.ht_clone_<name>`).
   *
   * @param {HolderName} name Which holder.
   * @returns {string}
   */
  static holderSelector(name: HolderName): string {
    return name === 'master' ? '.ht_master > .wtHolder' : `.ht_clone_${name} > .wtHolder`;
  }

  /**
   * The computed style and box of one holder.
   *
   * @param {HolderName} name Which holder to read.
   * @returns {Promise<HolderBox>}
   */
  async holderBox(name: HolderName): Promise<HolderBox> {
    return this.grid.evaluate((root, selector) => {
      const holder = root.querySelector<HTMLElement>(selector);

      if (!holder) {
        throw new Error(`No holder for ${selector}`);
      }

      const style = getComputedStyle(holder);

      return {
        overflowX: style.overflowX,
        overflowY: style.overflowY,
        scrollbarWidth: style.scrollbarWidth,
        tabIndex: holder.tabIndex,
        scrollbarGutterX: holder.offsetWidth - holder.clientWidth,
        scrollbarGutterY: holder.offsetHeight - holder.clientHeight,
      };
    }, CloneHolderScrollPage.holderSelector(name));
  }

  /**
   * The scroll offsets of the master holder and the three scroll-mirrored clone holders.
   *
   * @returns {Promise<HolderOffsets>}
   */
  async offsets(): Promise<HolderOffsets> {
    return this.grid.evaluate((root) => {
      const read = (selector: string) => {
        const holder = root.querySelector<HTMLElement>(selector);

        if (!holder) {
          throw new Error(`No holder for ${selector}`);
        }

        return { top: holder.scrollTop, left: holder.scrollLeft };
      };

      return {
        master: read('.ht_master > .wtHolder'),
        inlineStart: read('.ht_clone_inline_start > .wtHolder'),
        top: read('.ht_clone_top > .wtHolder'),
        bottom: read('.ht_clone_bottom > .wtHolder'),
      };
    });
  }

  /**
   * Scrolls the master holder, the way a wheel or a scrollbar drag lands.
   *
   * @param {object} offset The offset to scroll to.
   * @param {number} offset.top The vertical offset.
   * @param {number} offset.left The horizontal offset.
   */
  async scrollMasterTo(offset: { top: number; left: number }): Promise<void> {
    await this.grid.evaluate((root, target) => {
      const holder = root.querySelector<HTMLElement>('.ht_master > .wtHolder');

      if (!holder) {
        throw new Error('No master holder');
      }

      holder.scrollTop = target.top;
      holder.scrollLeft = target.left;
    }, offset);
  }

  /**
   * Scrolls a clone holder itself, which is what a touch pan over a frozen header or a wheel the
   * engine did not cancel does before any script runs: the offset moves on the compositor and the
   * `scroll` event follows a frame later.
   *
   * @param {HolderName} name Which clone holder to scroll.
   * @param {object} offset The absolute offset to put the holder at.
   * @param {number} [offset.top] The vertical offset; unchanged when omitted.
   * @param {number} [offset.left] The horizontal offset; unchanged when omitted.
   */
  async scrollCloneTo(name: HolderName, offset: { top?: number; left?: number }): Promise<void> {
    await this.grid.evaluate((root, { selector, target }) => {
      const holder = root.querySelector<HTMLElement>(selector);

      if (!holder) {
        throw new Error(`No holder for ${selector}`);
      }

      if (target.top !== undefined) {
        holder.scrollTop = target.top;
      }
      if (target.left !== undefined) {
        holder.scrollLeft = target.left;
      }
    }, { selector: CloneHolderScrollPage.holderSelector(name), target: offset });
  }

  /**
   * Scrolls the window, for the window-scrolled fixture.
   *
   * @param {number} y The vertical page offset.
   */
  async scrollWindowTo(y: number): Promise<void> {
    await this.page.evaluate((top) => {
      window.scrollTo({ top, behavior: 'instant' });
    }, y);
  }

  /**
   * Whether the window owns the vertical axis - the premise of the window-mode assertions.
   *
   * @returns {Promise<boolean>}
   */
  async windowOwnsVerticalAxis(): Promise<boolean> {
    return this.page.evaluate(() => {
      const overlay = (window as any).hot.view._wt.wtOverlays.topOverlay;

      return overlay.trimmingContainer === window;
    });
  }
}
