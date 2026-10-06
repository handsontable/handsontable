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
 * The toast, its close button, the notification layer it sits in and the grid's root, read in one
 * evaluation.
 */
export interface ToastGeometry {
  toast: Box;
  close: Box;
  host: Box;
  root: Box;
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
   */
  async goto(position: Corner, dir: 'ltr' | 'rtl'): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle, position, dir });

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
   * Reads the toast, its close button, the layer and the grid's root in one evaluation.
   *
   * @returns {Promise<ToastGeometry>}
   */
  async geometry(): Promise<ToastGeometry> {
    return this.page.evaluate(() => {
      const box = (element: Element) => {
        const rect = element.getBoundingClientRect();

        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      };
      const host = document.querySelector('.ht-notification') as HTMLElement;
      const toast = host.querySelector('.ht-notification__toast') as HTMLElement;

      return {
        toast: box(toast),
        close: box(toast.querySelector('.ht-notification__close') as HTMLElement),
        host: box(host),
        root: box((window as unknown as { hot: { rootElement: HTMLElement } }).hot.rootElement),
        hostDir: host.getAttribute('dir'),
        focusInsideHost: host.contains(document.activeElement),
      };
    });
  }
}
