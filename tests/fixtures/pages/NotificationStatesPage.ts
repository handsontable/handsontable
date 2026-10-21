import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * A corner of the grid a toast can be anchored to.
 */
export type Corner = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

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
 * The toast and its parts, the notification layer it sits in, the grid's root and the pager, read in one
 * evaluation.
 */
export interface ToastGeometry {
  toast: Box;
  close: Box;
  title: Box;
  primary: Box;
  secondary: Box;
  /**
   * The accent bar, or `null` where the variant does not draw one (`info`).
   */
  accent: Box | null;
  accentColor: string;
  /**
   * The variant's `--ht-notification-<variant>-accent` token as the theme resolves it, read through a
   * probe element in the same evaluation.
   */
  accentToken: string;
  host: Box;
  root: Box;
  /**
   * The pagination bar, or `null` without one.
   */
  pager: Box | null;
  hostDir: string | null;
  /**
   * Whether the page's focus is anywhere inside the notification layer.
   */
  focusInsideHost: boolean;
}

/**
 * Page object for `fixtures/demo/notification-states.html`, one toast laid out as the visual suite's
 * `/notification-demo` route lays it out.
 */
export class NotificationStatesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly toast: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.toast = page.locator('.ht-notification__toast');
  }

  /**
   * Opens the fixture with one toast in the given corner and waits for it.
   *
   * @param {Corner} position The corner.
   * @param {'ltr'|'rtl'} dir The grid's layout direction.
   * @param {{pager?: boolean, animation?: boolean}} [options] `pager` adds the pagination bar under the
   * grid; `animation` turns the toasts' enter animation on.
   */
  async goto(position: Corner, dir: 'ltr' | 'rtl', options: { pager?: boolean; animation?: boolean } = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle, position, dir });

    if (options.pager) {
      params.set('pager', '1');
    }
    if (options.animation) {
      params.set('animation', '1');
    }

    await this.page.goto(`/tests/fixtures/demo/notification-states.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.toast).toBeVisible();
  }

  /**
   * The stack element that holds the toasts of one corner.
   *
   * @param {Corner} position The corner.
   * @returns {Locator}
   */
  stack(position: Corner): Locator {
    return this.page.locator(`.ht-notification__stack[data-ht-notification-position="${position}"]`);
  }

  /**
   * Selects a cell, which gives the grid the focus, and remembers the element that holds it.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   * @returns {Promise<boolean>} Whether the focus is now inside the grid's root.
   */
  async focusCell(row: number, column: number): Promise<boolean> {
    return this.page.evaluate(([r, c]) => {
      const win = window as unknown as {
        hot: { rootElement: HTMLElement; selectCell(row: number, column: number): void };
        htFocusBefore: Element | null;
      };

      win.hot.selectCell(r, c);
      win.htFocusBefore = document.activeElement;

      return win.hot.rootElement.contains(document.activeElement);
    }, [row, column]);
  }

  /**
   * Shows one more toast through the plugin's API, in the variant the demo gives its corner.
   *
   * @param {Corner} position The corner.
   * @param {string} variant The variant.
   */
  async showToast(position: Corner, variant: string): Promise<void> {
    await this.page.evaluate(([corner, kind]) => {
      (window as unknown as { hot: { getPlugin(name: string): { showMessage(options: object): void } } })
        .hot.getPlugin('notification').showMessage({
          title: corner.replace(/-/g, ' '),
          message: 'Notification visual test.',
          position: corner,
          duration: 0,
          variant: kind,
          closable: true,
          actions: [{ label: 'Action', type: 'primary', callback: () => {} }],
        });
    }, [position, variant]);
  }

  /**
   * The computed opacity of the toast in a corner, which reaches `1` when its enter animation ends.
   *
   * @param {Corner} position The corner.
   * @returns {Promise<string>}
   */
  async toastOpacity(position: Corner): Promise<string> {
    return this.stack(position).locator('.ht-notification__toast').evaluate(toast => getComputedStyle(toast).opacity);
  }

  /**
   * Lets `frames` animation frames pass, then reports whether the element that held the focus before
   * (`focusCell()`) still holds it, and whether the grid still listens to the keyboard.
   *
   * @param {number} frames How many frames to wait.
   * @returns {Promise<{unchanged: boolean, listening: boolean}>}
   */
  async focusAfterFrames(frames: number): Promise<{ unchanged: boolean; listening: boolean }> {
    return this.page.evaluate(count => new Promise((resolve) => {
      const win = window as unknown as { hot: { isListening(): boolean }; htFocusBefore: Element | null };
      let left = count;
      const tick = () => {
        left -= 1;

        if (left > 0) {
          requestAnimationFrame(tick);

          return;
        }
        resolve({ unchanged: document.activeElement === win.htFocusBefore, listening: win.hot.isListening() });
      };

      requestAnimationFrame(tick);
    }), frames);
  }

  /**
   * The grid's selection, as `getSelected()` returns it.
   *
   * @returns {Promise<number[][] | undefined>}
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as { hot: { getSelected(): number[][] | undefined } })
      .hot.getSelected());
  }

  /**
   * Reads the toast and its parts, the layer, the grid's root and the pager in one evaluation.
   *
   * @param {string} variant The toast's variant, whose accent token to resolve.
   * @returns {Promise<ToastGeometry>}
   */
  async geometry(variant: string): Promise<ToastGeometry> {
    return this.page.evaluate((variantName) => {
      const box = (element: Element) => {
        const rect = element.getBoundingClientRect();

        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      };
      const host = document.querySelector('.ht-notification') as HTMLElement;
      const toast = host.querySelector('.ht-notification__toast') as HTMLElement;
      const accent = toast.querySelector('.ht-notification__accent') as HTMLElement;
      const pager = document.querySelector('.ht-pagination');
      const probe = document.createElement('span');

      probe.style.backgroundColor = `var(--ht-notification-${variantName}-accent)`;
      toast.appendChild(probe);

      const accentToken = getComputedStyle(probe).backgroundColor;

      probe.remove();

      return {
        toast: box(toast),
        close: box(toast.querySelector('.ht-notification__close') as HTMLElement),
        title: box(toast.querySelector('.ht-notification__title') as HTMLElement),
        primary: box(toast.querySelector('.ht-notification__actions .ht-button--primary') as HTMLElement),
        secondary: box(toast.querySelector('.ht-notification__actions .ht-button--secondary') as HTMLElement),
        accent: getComputedStyle(accent).display === 'none' ? null : box(accent),
        accentColor: getComputedStyle(accent).backgroundColor,
        accentToken,
        host: box(host),
        root: box((window as unknown as { hot: { rootElement: HTMLElement } }).hot.rootElement),
        pager: pager ? box(pager) : null,
        hostDir: host.getAttribute('dir'),
        focusInsideHost: host.contains(document.activeElement),
      };
    }, variant);
  }
}
