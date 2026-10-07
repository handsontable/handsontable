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
  /**
   * The `tabindex` attribute as written, or `null` when the holder carries none. The attribute, not
   * the `tabIndex` property: a `div` with no attribute reports the property as `-1` too.
   */
  tabindex: string | null;
  /**
   * `offsetWidth - clientWidth`: the space a vertical scrollbar takes inside the box.
   */
  scrollbarGutterX: number;
  /**
   * `offsetHeight - clientHeight`: the space a horizontal scrollbar takes inside the box.
   */
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
   * @param {'ltr' | 'rtl'} dir Which layout direction the grid takes.
   */
  async goto(mode: 'element' | 'window' = 'element', dir: 'ltr' | 'rtl' = 'ltr'): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/clone-holder-scroll.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&mode=${mode}&dir=${dir}`
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
        tabindex: holder.getAttribute('tabindex'),
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
   * The screen-space bounding box of a holder, for a synthesized gesture aimed at it.
   *
   * @param {HolderName} name Which holder.
   * @returns {Promise<{ x: number, y: number, width: number, height: number }>}
   */
  async holderRect(name: HolderName): Promise<{ x: number; y: number; width: number; height: number }> {
    const rect = await this.grid.locator(CloneHolderScrollPage.holderSelector(name)).boundingBox();

    if (!rect) {
      throw new Error(`No box for ${name}`);
    }

    return rect;
  }

  /**
   * Pans a finger over a holder: a touch press at its center, a run of moves by the given distance,
   * and a release. A negative distance drags the content up or start-wards, which scrolls the grid
   * down or towards its end. Trusted touch events through CDP, the way
   * `fixtures/pages/mobile/DragToScrollPage.ts` drives them - `Input.synthesizeScrollGesture` moved
   * nothing on the CI runners.
   *
   * @param {HolderName} name Which holder the finger lands on.
   * @param {object} offset The distance of the pan, in pixels.
   */
  async panTouch(name: HolderName, offset: { dx?: number; dy?: number }): Promise<void> {
    const rect = await this.holderRect(name);
    const startX = Math.round(rect.x + rect.width / 2);
    const startY = Math.round(rect.y + rect.height / 2);
    const dx = offset.dx ?? 0;
    const dy = offset.dy ?? 0;
    const cdp = await this.page.context().newCDPSession(this.page);
    const touch = (
      type: 'touchStart' | 'touchMove' | 'touchEnd',
      point?: { x: number; y: number }
    ) => cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: point ? [{ x: point.x, y: point.y, radiusX: 12, radiusY: 12, force: 1, id: 1 }] : [],
    });
    const steps = 12;

    await touch('touchStart', { x: startX, y: startY });

    for (let step = 1; step <= steps; step++) {
      await touch('touchMove', {
        x: Math.round(startX + (dx * step) / steps),
        y: Math.round(startY + (dy * step) / steps),
      });
    }

    await touch('touchEnd');
    await cdp.detach();
  }

  /**
   * Reproduces the sub-frame race the clone-scroll listener is designed around, deterministically.
   *
   * A scroll event is dispatched a frame after the offset changed, so a clone's pending event can run
   * while the master has already moved on. Both steps here happen in ONE synchronous block: the
   * master's offset is set (its own `scroll` event is queued, not yet delivered) and the clone's
   * pending event is then delivered by hand, with the clone still holding the offset the engine last
   * wrote to it.
   *
   * A listener judging the clone against the master's live offset reads that gap as a user scroll
   * backwards and drags the master back. One judging it against the ledger sees no drift and leaves
   * the master where it is.
   *
   * The offsets are read back in the SAME block, right after the listener returns, because that is
   * the only moment the two policies differ: reading the master makes the listener move it, and a
   * second correction a frame later happens to put it back, so the settled state cannot tell them
   * apart.
   *
   * @param {HolderName} name Which clone holder's pending event to deliver.
   * @param {number} masterTop The offset the master moves to in the same block.
   * @returns {Promise<{ master: number, clone: number }>} The offsets the listener left behind.
   */
  async raceCloneScrollAgainstMaster(
    name: HolderName,
    masterTop: number
  ): Promise<{ master: number; clone: number }> {
    return this.grid.evaluate((root, { selector, top }) => {
      const master = root.querySelector<HTMLElement>('.ht_master > .wtHolder');
      const holder = root.querySelector<HTMLElement>(selector);

      if (!master || !holder) {
        throw new Error(`No holder for ${selector}`);
      }

      master.scrollTop = top;
      holder.dispatchEvent(new Event('scroll'));

      return { master: master.scrollTop, clone: holder.scrollTop };
    }, { selector: CloneHolderScrollPage.holderSelector(name), top: masterTop });
  }

  /**
   * The page's vertical scroll offset, for the window-scrolled fixture.
   *
   * @returns {Promise<number>}
   */
  async windowScrollTop(): Promise<number> {
    return this.page.evaluate(() => window.scrollY);
  }

  /**
   * How far, in pixels, the inline-start clone's rendered row sits from the master's row at the same
   * band position. Zero while the clone follows the master; anything else is a frozen column out of
   * step with its rows. Reads the two `tbody > tr` at the same index, since both tables render the
   * same row band.
   *
   * @param {number} bandIndex Which rendered row of the band to compare.
   * @returns {Promise<number>}
   */
  async rowMisalignment(bandIndex: number): Promise<number> {
    return this.grid.evaluate((root, index) => {
      const masterRow = root.querySelector<HTMLElement>(`.ht_master tbody > tr:nth-child(${index + 1})`);
      const cloneRow = root.querySelector<HTMLElement>(`.ht_clone_inline_start tbody > tr:nth-child(${index + 1})`);

      if (!masterRow || !cloneRow) {
        throw new Error(`No rendered row at band index ${index}`);
      }

      return cloneRow.getBoundingClientRect().top - masterRow.getBoundingClientRect().top;
    }, bandIndex);
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
