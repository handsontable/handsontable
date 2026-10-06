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
   * @param {{pager?: boolean}} [options] `pager` adds the pagination bar under the grid.
   */
  async goto(position: Corner, dir: 'ltr' | 'rtl', options: { pager?: boolean } = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle, position, dir });

    if (options.pager) {
      params.set('pager', '1');
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
